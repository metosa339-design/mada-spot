"""Run full automation - scrape all sources and publish"""
import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from database import init_database, get_articles_to_rewrite, get_articles_to_publish
from database import save_rewritten_article, save_published_article, save_scraped_article, save_image
from scraper import AsyncScraper
from rewriter import LocalRewriter, CATEGORY_MAPPING
from publisher import ArticlePublisher
from config import NEWS_SOURCES

init_database()

async def run_full():
    print('='*60)
    print('MADA FLASH - AUTOMATION COMPLETE')
    print('='*60)

    # 1. SCRAPING
    print('\n[1] SCRAPING DE TOUTES LES SOURCES...\n')

    total_scraped = 0
    async with AsyncScraper() as scraper:
        for source in NEWS_SOURCES:
            try:
                print(f'  Scraping: {source["name"]}...', end=' ')

                if source.get('type') == 'rss' and source.get('feed_url'):
                    articles = await scraper.scrape_rss_source(source)
                else:
                    articles = await scraper.scrape_html_source(source)

                saved = 0
                for article in articles:
                    article_id = save_scraped_article(**article)
                    if article_id:
                        saved += 1
                        if article.get('original_image_url'):
                            save_image(article_id, article['original_image_url'])

                if saved > 0:
                    print(f'{saved} articles')
                    total_scraped += saved
                else:
                    print('0 nouveaux')

            except Exception as e:
                print(f'ERREUR: {str(e)[:50]}')

    print(f'\n  TOTAL SCRAPE: {total_scraped} articles\n')

    # 2. REECRITURE
    print('[2] REECRITURE (mode local)...\n')

    local_rewriter = LocalRewriter()
    articles_to_rewrite = get_articles_to_rewrite(100)  # Max 100

    rewritten = 0
    for article in articles_to_rewrite:
        try:
            result = local_rewriter.simple_rewrite(
                article['original_title'],
                article['original_content'],
                CATEGORY_MAPPING.get(article.get('category', 'general'), 'Actualites')
            )
            save_rewritten_article(
                scraped_article_id=article['id'],
                title=result['title'],
                summary=result['summary'],
                content=result['content'],
                category=result['category']
            )
            rewritten += 1
        except Exception as e:
            print(f'  Erreur reecriture: {e}')

    print(f'  TOTAL REECRIT: {rewritten} articles\n')

    # 3. PUBLICATION
    print('[3] PUBLICATION...\n')

    published = 0
    async with ArticlePublisher() as publisher:
        articles_to_publish = get_articles_to_publish(100)  # Max 100

        for article in articles_to_publish:
            try:
                result = await publisher.publish_article(article)
                if result:
                    save_published_article(article['id'], result)
                    published += 1
                    print(f'  [OK] {article["title"][:50]}...')
            except Exception as e:
                print(f'  [ERR] {str(e)[:50]}')

    print(f'\n  TOTAL PUBLIE: {published} articles')
    print('\n' + '='*60)
    print('TERMINE!')
    print('='*60)

asyncio.run(run_full())
