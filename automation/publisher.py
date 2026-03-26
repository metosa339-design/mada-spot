"""
Module de publication vers l'API Mada Flash
"""
import asyncio
import aiohttp
import base64
from pathlib import Path
from typing import Dict, Any, Optional, List

from config import MADA_FLASH_API_URL, MADA_FLASH_API_KEY, REQUEST_TIMEOUT
from database import (
    get_articles_to_publish,
    save_published_article,
    log_event
)


class ArticlePublisher:
    """Publie les articles vers Mada Flash"""

    def __init__(self):
        self.api_url = MADA_FLASH_API_URL
        self.api_key = MADA_FLASH_API_KEY
        self.headers = {
            'Content-Type': 'application/json',
        }
        if self.api_key:
            self.headers['x-api-key'] = self.api_key
            self.headers['Authorization'] = f'Bearer {self.api_key}'

        self.session = None

    async def __aenter__(self):
        timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)
        self.session = aiohttp.ClientSession(headers=self.headers, timeout=timeout)
        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()

    def _image_to_base64(self, image_path: str) -> Optional[str]:
        """Convertit une image locale en base64"""
        try:
            path = Path(image_path)
            if path.exists():
                with open(path, 'rb') as f:
                    image_data = f.read()
                    return base64.b64encode(image_data).decode('utf-8')
        except Exception as e:
            log_event('warning', f'Erreur conversion base64 {image_path}', str(e))
        return None

    async def _download_and_encode_image(self, url: str) -> Optional[str]:
        """Telecharge une image externe et la convertit en base64"""
        try:
            async with self.session.get(url, ssl=False) as response:
                if response.status == 200:
                    content_type = response.headers.get('content-type', '')
                    if 'image' in content_type:
                        image_data = await response.read()
                        return base64.b64encode(image_data).decode('utf-8')
        except Exception as e:
            log_event('warning', f'Erreur telechargement image {url}', str(e))
        return None

    async def upload_image(self, image_path: str) -> Optional[str]:
        """Upload une image et retourne l'URL"""
        # Si l'API supporte l'upload d'images
        upload_url = self.api_url.replace('/articles', '/upload')

        try:
            path = Path(image_path)
            if not path.exists():
                return None

            data = aiohttp.FormData()
            data.add_field('file',
                           open(path, 'rb'),
                           filename=path.name,
                           content_type='image/jpeg')

            async with self.session.post(upload_url, data=data) as response:
                if response.status in (200, 201):
                    result = await response.json()
                    return result.get('url') or result.get('imageUrl')

        except Exception as e:
            log_event('warning', f'Erreur upload image', str(e))

        return None

    async def publish_article(self, article: Dict[str, Any]) -> Optional[str]:
        """Publie un article vers l'API Mada Flash"""
        try:
            # Prépare les données de l'article
            payload = {
                'title': article['title'],
                'summary': article.get('summary', ''),
                'content': article['content'],
                'category': article.get('category', 'Actualités'),
                'isPublished': True,
                'source': 'automation'
            }

            # Gère l'image - priorite aux images locales en base64
            local_image = article.get('local_image')
            original_image = article.get('original_image_url')

            if local_image and Path(local_image).exists():
                # Envoie l'image en base64
                image_base64 = self._image_to_base64(local_image)
                if image_base64:
                    payload['imageBase64'] = image_base64
                    print(f"    [IMG] Image locale encodee en base64")
            elif original_image:
                # Essaie de telecharger et encoder l'image externe
                image_data = await self._download_and_encode_image(original_image)
                if image_data:
                    payload['imageBase64'] = image_data
                    print(f"    [IMG] Image externe encodee en base64")
                else:
                    # Fallback sur l'URL (peut ne pas fonctionner)
                    payload['imageUrl'] = original_image
                    print(f"    [IMG] Fallback URL externe")

            # Publie l'article
            async with self.session.post(self.api_url, json=payload) as response:
                if response.status in (200, 201):
                    result = await response.json()
                    article_id = result.get('id') or result.get('article', {}).get('id')
                    return str(article_id) if article_id else 'published'
                else:
                    error_text = await response.text()
                    log_event('error', f'Erreur publication {response.status}', error_text)
                    return None

        except Exception as e:
            log_event('error', 'Erreur publication article', str(e))
            return None

    async def publish_pending_articles(self, limit: int = 5) -> int:
        """Publie les articles en attente"""
        articles = get_articles_to_publish(limit)

        if not articles:
            print("Aucun article a publier")
            return 0

        print(f"\n[PUBLISH] Publication de {len(articles)} articles...")

        published = 0
        for article in articles:
            print(f"  [..] Publication: {article['title'][:50]}...")

            mada_flash_id = await self.publish_article(article)

            if mada_flash_id:
                save_published_article(article['id'], mada_flash_id)
                print(f"  [OK] Publie: {article['title'][:50]}")
                published += 1
            else:
                print(f"  [ERR] Echec: {article['title'][:50]}")

            # Petite pause entre les publications
            await asyncio.sleep(0.5)

        print(f"\n[DONE] {published}/{len(articles)} articles publies\n")
        log_event('info', f'{published} articles publies')

        return published


class LocalPublisher:
    """Mode hors-ligne: sauvegarde les articles en JSON"""

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def save_article(self, article: Dict[str, Any]) -> str:
        """Sauvegarde un article en JSON"""
        import json
        from datetime import datetime

        filename = f"article_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{article['id']}.json"
        filepath = self.output_dir / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(article, f, ensure_ascii=False, indent=2)

        return str(filepath)

    def publish_pending_articles(self, limit: int = 10) -> int:
        """Sauvegarde les articles en attente en local"""
        articles = get_articles_to_publish(limit)

        if not articles:
            print("Aucun article à sauvegarder")
            return 0

        saved = 0
        for article in articles:
            filepath = self.save_article(article)
            save_published_article(article['id'], f'local:{filepath}')
            saved += 1
            print(f"  [OK] Sauvegarde: {filepath}")

        return saved


async def run_publisher(limit: int = 5, offline: bool = False):
    """Fonction principale pour publier les articles"""
    if offline:
        from config import BASE_DIR
        local_publisher = LocalPublisher(BASE_DIR / 'published')
        return local_publisher.publish_pending_articles(limit)
    else:
        async with ArticlePublisher() as publisher:
            return await publisher.publish_pending_articles(limit)


if __name__ == "__main__":
    from database import init_database
    init_database()
    asyncio.run(run_publisher())
