"""
Module de traitement et optimisation des images
"""
import asyncio
import aiohttp
import aiofiles
from pathlib import Path
from PIL import Image
from io import BytesIO
import hashlib
import os
from typing import Optional, Tuple
from datetime import datetime

from config import (
    IMAGES_DIR,
    MAX_IMAGE_WIDTH,
    MAX_IMAGE_HEIGHT,
    IMAGE_QUALITY,
    SUPPORTED_IMAGE_FORMATS,
    MAX_CONCURRENT_REQUESTS,
    REQUEST_TIMEOUT
)
from database import (
    save_image,
    update_image_status,
    get_images_to_download,
    log_event
)


class ImageProcessor:
    """Processeur d'images asynchrone"""

    def __init__(self):
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        }
        self.session = None

        # Crée le dossier images s'il n'existe pas
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    async def __aenter__(self):
        timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)
        self.session = aiohttp.ClientSession(headers=self.headers, timeout=timeout)
        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()

    def generate_filename(self, url: str, extension: str = '.jpg') -> str:
        """Génère un nom de fichier unique basé sur l'URL"""
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        return f"{timestamp}_{url_hash}{extension}"

    async def download_image(self, url: str) -> Optional[bytes]:
        """Télécharge une image depuis une URL"""
        async with self.semaphore:
            try:
                async with self.session.get(url, ssl=False) as response:
                    if response.status == 200:
                        content_type = response.headers.get('content-type', '')
                        if 'image' in content_type or url.lower().endswith(tuple(SUPPORTED_IMAGE_FORMATS)):
                            return await response.read()
                    return None
            except Exception as e:
                log_event('warning', f'Erreur téléchargement image {url}', str(e))
                return None

    def optimize_image(self, image_data: bytes) -> Tuple[Optional[bytes], str]:
        """Optimise une image: redimensionne et compresse"""
        try:
            img = Image.open(BytesIO(image_data))

            # Convertit en RGB si nécessaire (pour les PNG avec transparence)
            if img.mode in ('RGBA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if len(img.split()) == 4 else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Redimensionne si nécessaire
            original_width, original_height = img.size
            if original_width > MAX_IMAGE_WIDTH or original_height > MAX_IMAGE_HEIGHT:
                ratio = min(MAX_IMAGE_WIDTH / original_width, MAX_IMAGE_HEIGHT / original_height)
                new_size = (int(original_width * ratio), int(original_height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)

            # Sauvegarde en JPEG optimisé
            output = BytesIO()
            img.save(output, format='JPEG', quality=IMAGE_QUALITY, optimize=True)
            output.seek(0)

            return output.read(), '.jpg'

        except Exception as e:
            log_event('error', 'Erreur optimisation image', str(e))
            return None, ''

    async def process_image(self, url: str, article_id: int) -> Optional[str]:
        """Télécharge, optimise et sauvegarde une image"""
        try:
            # Télécharge l'image
            image_data = await self.download_image(url)
            if not image_data:
                return None

            # Optimise l'image
            optimized_data, extension = self.optimize_image(image_data)
            if not optimized_data:
                return None

            # Génère le nom de fichier
            filename = self.generate_filename(url, extension)
            filepath = IMAGES_DIR / filename

            # Sauvegarde le fichier
            async with aiofiles.open(filepath, 'wb') as f:
                await f.write(optimized_data)

            return str(filepath)

        except Exception as e:
            log_event('error', f'Erreur traitement image {url}', str(e))
            return None

    async def process_article_image(
        self,
        article_id: int,
        image_url: str
    ) -> Optional[str]:
        """Traite l'image d'un article"""
        if not image_url:
            return None

        # Enregistre l'image dans la DB
        image_id = save_image(article_id, image_url)
        if not image_id:
            return None

        # Télécharge et optimise
        local_path = await self.process_image(image_url, article_id)

        if local_path:
            update_image_status(image_id, local_path, local_path, 'optimized')
            return local_path
        else:
            update_image_status(image_id, status='failed')
            return None

    async def process_pending_images(self) -> int:
        """Traite toutes les images en attente"""
        pending = get_images_to_download()
        if not pending:
            return 0

        print(f"\n[IMG] Traitement de {len(pending)} images en attente...")

        processed = 0
        for img in pending:
            local_path = await self.process_image(img['original_url'], img['article_id'])
            if local_path:
                update_image_status(img['id'], local_path, local_path, 'optimized')
                processed += 1
                print(f"  [OK] Image {img['id']} optimisee")
            else:
                update_image_status(img['id'], status='failed')
                print(f"  [ERR] Image {img['id']} echouee")

        print(f"\n[DONE] {processed}/{len(pending)} images traitees\n")
        return processed

    def cleanup_old_images(self, days: int = 7):
        """Supprime les anciennes images"""
        import time

        now = time.time()
        cutoff = now - (days * 86400)
        removed = 0

        for filepath in IMAGES_DIR.glob('*'):
            if filepath.is_file():
                if filepath.stat().st_mtime < cutoff:
                    filepath.unlink()
                    removed += 1

        if removed > 0:
            print(f"[OK] {removed} anciennes images supprimees")
            log_event('info', f'{removed} anciennes images supprimees')


async def run_image_processor():
    """Fonction principale pour traiter les images"""
    async with ImageProcessor() as processor:
        return await processor.process_pending_images()


if __name__ == "__main__":
    asyncio.run(run_image_processor())
