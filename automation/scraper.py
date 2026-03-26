"""
Module de scraping asynchrone pour les sites d'actualités malgaches
"""
import asyncio
import aiohttp
import feedparser
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse
import re
import hashlib

from config import (
    NEWS_SOURCES,
    MAX_CONCURRENT_REQUESTS,
    REQUEST_TIMEOUT,
    RETRY_ATTEMPTS,
    DELAY_BETWEEN_REQUESTS,
    MAX_ARTICLES_PER_SOURCE
)
from database import save_scraped_article, article_exists, log_event, save_image


class AsyncScraper:
    """Scraper asynchrone pour les sources d'actualités"""

    def __init__(self):
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        }
        self.session = None

    async def __aenter__(self):
        timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)
        self.session = aiohttp.ClientSession(headers=self.headers, timeout=timeout)
        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()

    async def fetch_url(self, url: str, retry: int = 0) -> Optional[str]:
        """Récupère le contenu d'une URL avec retry"""
        async with self.semaphore:
            try:
                async with self.session.get(url, ssl=False) as response:
                    if response.status == 200:
                        return await response.text()
                    else:
                        log_event('warning', f'Status {response.status} pour {url}')
                        return None
            except Exception as e:
                if retry < RETRY_ATTEMPTS:
                    await asyncio.sleep(DELAY_BETWEEN_REQUESTS * (retry + 1))
                    return await self.fetch_url(url, retry + 1)
                log_event('error', f'Erreur fetch {url}', str(e))
                return None

    async def scrape_rss_source(self, source: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Scrape une source RSS"""
        articles = []
        feed_url = source.get('feed_url')

        if not feed_url:
            return articles

        try:
            content = await self.fetch_url(feed_url)
            if not content:
                return articles

            feed = feedparser.parse(content)
            filter_keywords = source.get('filter_keywords', [])

            for entry in feed.entries[:MAX_ARTICLES_PER_SOURCE]:
                title = entry.get('title', '')
                link = entry.get('link', '')
                summary = entry.get('summary', entry.get('description', ''))

                # Filtre par mots-clés si spécifié
                if filter_keywords:
                    text_to_check = (title + ' ' + summary).lower()
                    if not any(kw.lower() in text_to_check for kw in filter_keywords):
                        continue

                # JAMAIS d'articles necrologie
                title_lower = title.lower()
                if 'necrologie' in title_lower or 'nécrologie' in title_lower or 'obituaire' in title_lower:
                    continue

                # Vérifie si l'article existe déjà
                if article_exists(link):
                    continue

                # Extrait l'image si disponible
                image_url = None
                if 'media_content' in entry:
                    image_url = entry.media_content[0].get('url')
                elif 'media_thumbnail' in entry:
                    image_url = entry.media_thumbnail[0].get('url')
                elif 'enclosures' in entry and entry.enclosures:
                    for enc in entry.enclosures:
                        if enc.get('type', '').startswith('image'):
                            image_url = enc.get('url')
                            break

                # Cherche image dans le contenu HTML si pas trouvee
                if not image_url:
                    content_html = ''
                    # Utilise try/except car feedparser cree des attributs dynamiques
                    try:
                        if entry.content:
                            content_html = entry.content[0].get('value', '')
                    except (AttributeError, IndexError, KeyError):
                        pass
                    if not content_html:
                        content_html = summary

                    # Extrait la premiere image du HTML
                    img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content_html)
                    if img_match:
                        image_url = img_match.group(1)
                        # Filtre les petites icones et images non pertinentes
                        if any(x in image_url.lower() for x in ['gravatar', 'icon', 'logo', 'avatar', 'pixel']):
                            image_url = None

                # Récupère le contenu complet si nécessaire
                full_content = summary
                if link and len(summary) < 500:
                    article_content = await self.fetch_article_content(link, source)
                    if article_content:
                        full_content = article_content

                articles.append({
                    'source_name': source['name'],
                    'source_url': source['url'],
                    'original_url': link,
                    'original_title': self.clean_text(title),
                    'original_content': self.clean_text(full_content),
                    'original_image_url': image_url,
                    'category': source.get('category', 'general')
                })

            await asyncio.sleep(DELAY_BETWEEN_REQUESTS)

        except Exception as e:
            log_event('error', f'Erreur RSS {source["name"]}', str(e))

        return articles

    async def scrape_html_source(self, source: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Scrape une source HTML directement"""
        articles = []
        selectors = source.get('selectors', {})

        try:
            content = await self.fetch_url(source['url'])
            if not content:
                return articles

            soup = BeautifulSoup(content, 'html.parser')
            article_selector = selectors.get('article_list', '.article')
            article_elements = soup.select(article_selector)[:MAX_ARTICLES_PER_SOURCE]

            for element in article_elements:
                try:
                    # Titre
                    title_elem = element.select_one(selectors.get('title', 'h2 a'))
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)

                    # Lien
                    link_elem = element.select_one(selectors.get('link', 'a'))
                    if not link_elem or not link_elem.get('href'):
                        continue
                    link = urljoin(source['url'], link_elem.get('href'))

                    # Vérifie si l'article existe déjà
                    if article_exists(link):
                        continue

                    # JAMAIS d'articles necrologie
                    title_lower = title.lower()
                    if 'necrologie' in title_lower or 'nécrologie' in title_lower or 'obituaire' in title_lower:
                        continue

                    # Image
                    image_url = None
                    img_elem = element.select_one(selectors.get('image', 'img'))
                    if img_elem:
                        image_url = img_elem.get('src') or img_elem.get('data-src')
                        if image_url:
                            image_url = urljoin(source['url'], image_url)

                    # Contenu (résumé ou contenu complet)
                    content_elem = element.select_one(selectors.get('content', '.excerpt'))
                    summary = content_elem.get_text(strip=True) if content_elem else ''

                    # Récupère le contenu complet
                    full_content = await self.fetch_article_content(link, source)
                    if not full_content:
                        full_content = summary

                    if not title or not full_content:
                        continue

                    articles.append({
                        'source_name': source['name'],
                        'source_url': source['url'],
                        'original_url': link,
                        'original_title': self.clean_text(title),
                        'original_content': self.clean_text(full_content),
                        'original_image_url': image_url,
                        'category': source.get('category', 'general')
                    })

                except Exception as e:
                    log_event('warning', f'Erreur élément {source["name"]}', str(e))
                    continue

            await asyncio.sleep(DELAY_BETWEEN_REQUESTS)

        except Exception as e:
            log_event('error', f'Erreur HTML {source["name"]}', str(e))

        return articles

    async def fetch_article_content(self, url: str, source: Dict[str, Any]) -> Optional[str]:
        """Récupère le contenu complet d'un article"""
        try:
            content = await self.fetch_url(url)
            if not content:
                return None

            soup = BeautifulSoup(content, 'html.parser')
            selectors = source.get('selectors', {})

            # Essaie plusieurs sélecteurs courants
            content_selectors = [
                selectors.get('content', '.entry-content'),
                '.entry-content',
                '.article-content',
                '.post-content',
                '.content',
                'article .content',
                '.article-body',
                '.story-content'
            ]

            for selector in content_selectors:
                content_elem = soup.select_one(selector)
                if content_elem:
                    # Supprime les éléments indésirables
                    for unwanted in content_elem.select('script, style, .ad, .advertisement, .social-share, .related-posts'):
                        unwanted.decompose()

                    text = content_elem.get_text(separator='\n', strip=True)
                    if len(text) > 200:
                        return text

            return None

        except Exception as e:
            log_event('warning', f'Erreur contenu article {url}', str(e))
            return None

    def clean_text(self, text: str) -> str:
        """Nettoie le texte"""
        if not text:
            return ''

        # Supprime les caractères spéciaux excessifs
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

        # Supprime les balises HTML résiduelles
        text = re.sub(r'<[^>]+>', '', text)

        return text.strip()

    async def scrape_source(self, source: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Scrape une source selon son type"""
        if source.get('type') == 'rss' and source.get('feed_url'):
            return await self.scrape_rss_source(source)
        else:
            return await self.scrape_html_source(source)

    async def scrape_all_sources(self) -> int:
        """Scrape toutes les sources en parallele"""
        print(f"\n[SCRAPE] Debut du scraping de {len(NEWS_SOURCES)} sources...")

        tasks = [self.scrape_source(source) for source in NEWS_SOURCES]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        total_articles = 0
        for i, result in enumerate(results):
            source = NEWS_SOURCES[i]
            if isinstance(result, Exception):
                log_event('error', f'Erreur source {source["name"]}', str(result))
                print(f"  [ERR] {source['name']}: Erreur")
            elif result:
                # Sauvegarde les articles
                saved = 0
                for article in result:
                    article_id = save_scraped_article(**article)
                    if article_id:
                        saved += 1
                        # Enregistre l'image pour traitement ulterieur
                        if article.get('original_image_url'):
                            save_image(article_id, article['original_image_url'])

                if saved > 0:
                    print(f"  [OK] {source['name']}: {saved} nouveaux articles")
                    total_articles += saved
                else:
                    print(f"  [--] {source['name']}: Aucun nouvel article")
            else:
                print(f"  [--] {source['name']}: Aucun article trouve")

        log_event('info', f'Scraping termine: {total_articles} articles')
        print(f"\n[DONE] Scraping termine: {total_articles} nouveaux articles\n")

        return total_articles


async def run_scraper():
    """Fonction principale pour lancer le scraper"""
    async with AsyncScraper() as scraper:
        return await scraper.scrape_all_sources()


if __name__ == "__main__":
    from database import init_database
    init_database()
    asyncio.run(run_scraper())
