#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mada Flash - Systeme d'automatisation des actualites malgaches

Ce script orchestre le scraping, la reecriture et la publication
automatique des actualites de Madagascar.

Usage:
    python main.py              # Mode continu (boucle infinie)
    python main.py --once       # Execution unique
    python main.py --scrape     # Scraping uniquement
    python main.py --rewrite    # Reecriture uniquement
    python main.py --publish    # Publication uniquement
    python main.py --stats      # Affiche les statistiques
"""

import asyncio
import argparse
import signal
import sys
from datetime import datetime
from typing import Optional

from config import SCRAPE_INTERVAL_MINUTES, CLAUDE_API_KEY, MADA_FLASH_API_URL
from database import init_database, get_stats, cleanup_old_data, log_event
from scraper import AsyncScraper
from image_processor import ImageProcessor
from rewriter import ArticleRewriter, LocalRewriter, CATEGORY_MAPPING
from publisher import ArticlePublisher, LocalPublisher


class MadaFlashAutomation:
    """Orchestrateur principal du systeme d'automatisation"""

    def __init__(self, use_ai: bool = True, offline: bool = False):
        self.use_ai = use_ai and bool(CLAUDE_API_KEY)
        self.offline = offline
        self.running = True

        # Gestion du signal d'arret
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

    def _handle_shutdown(self, signum, frame):
        """Gere l'arret propre du programme"""
        print("\n\n[STOP] Arret demande... Finalisation en cours...")
        self.running = False

    def print_banner(self):
        """Affiche la banniere de demarrage"""
        banner = """
================================================================

     MADA FLASH - Automatisation des Actualites

     Scraping - Reecriture IA - Publication Automatique

================================================================
        """
        print(banner)

        # Affiche la configuration
        print("[CONFIG] Configuration:")
        print(f"   - Mode IA: {'[OK] Active' if self.use_ai else '[X] Desactive (pas de cle API)'}")
        print(f"   - Mode hors-ligne: {'[OK] Active' if self.offline else '[X] Desactive'}")
        print(f"   - Intervalle de scraping: {SCRAPE_INTERVAL_MINUTES} minutes")
        print(f"   - URL API: {MADA_FLASH_API_URL}")
        print()

    async def run_scraping(self) -> int:
        """Execute le scraping de toutes les sources"""
        print("\n" + "="*60)
        print("[NEWS] PHASE 1: SCRAPING DES SOURCES")
        print("="*60)

        async with AsyncScraper() as scraper:
            return await scraper.scrape_all_sources()

    async def run_image_processing(self) -> int:
        """Traite les images des articles"""
        print("\n" + "="*60)
        print("[IMG] PHASE 2: TRAITEMENT DES IMAGES")
        print("="*60)

        async with ImageProcessor() as processor:
            return await processor.process_pending_images()

    async def run_rewriting(self, limit: int = 5) -> int:
        """Reecrit les articles avec l'IA"""
        print("\n" + "="*60)
        print("[WRITE] PHASE 3: REECRITURE DES ARTICLES")
        print("="*60)

        if self.use_ai:
            rewriter = ArticleRewriter()
            return await rewriter.rewrite_pending_articles(limit)
        else:
            print("[WARN] Mode sans IA: reecriture basique")
            from database import get_articles_to_rewrite, save_rewritten_article

            local_rewriter = LocalRewriter()
            articles = get_articles_to_rewrite(limit)

            rewritten = 0
            for article in articles:
                result = local_rewriter.simple_rewrite(
                    article['original_title'],
                    article['original_content'],
                    CATEGORY_MAPPING.get(article.get('category', 'general'), 'Actualites')
                )

                article_id = save_rewritten_article(
                    scraped_article_id=article['id'],
                    title=result['title'],
                    summary=result['summary'],
                    content=result['content'],
                    category=result['category']
                )

                if article_id:
                    rewritten += 1
                    print(f"  [OK] Formate: {result['title'][:50]}")

            return rewritten

    async def run_publishing(self, limit: int = 5) -> int:
        """Publie les articles vers Mada Flash"""
        print("\n" + "="*60)
        print("[PUBLISH] PHASE 4: PUBLICATION")
        print("="*60)

        if self.offline:
            from config import BASE_DIR
            local_publisher = LocalPublisher(BASE_DIR / 'published')
            return local_publisher.publish_pending_articles(limit)
        else:
            async with ArticlePublisher() as publisher:
                return await publisher.publish_pending_articles(limit)

    async def run_full_cycle(self) -> dict:
        """Execute un cycle complet"""
        results = {
            'scraped': 0,
            'images': 0,
            'rewritten': 0,
            'published': 0,
            'timestamp': datetime.now().isoformat()
        }

        try:
            # Scraping
            results['scraped'] = await self.run_scraping()

            # Traitement des images
            results['images'] = await self.run_image_processing()

            # Reecriture
            results['rewritten'] = await self.run_rewriting()

            # Publication
            results['published'] = await self.run_publishing()

        except Exception as e:
            log_event('error', 'Erreur cycle complet', str(e))
            print(f"\n[ERROR] Erreur: {e}")

        return results

    def print_summary(self, results: dict):
        """Affiche le resume d'un cycle"""
        print("\n" + "="*60)
        print("[STATS] RESUME DU CYCLE")
        print("="*60)
        print(f"   - Articles scrapes: {results['scraped']}")
        print(f"   - Images traitees: {results['images']}")
        print(f"   - Articles reecrits: {results['rewritten']}")
        print(f"   - Articles publies: {results['published']}")
        print(f"   - Timestamp: {results['timestamp']}")

    def print_stats(self):
        """Affiche les statistiques de la base de donnees"""
        stats = get_stats()

        print("\n" + "="*60)
        print("[STATS] STATISTIQUES")
        print("="*60)
        print(f"   - Total articles scrapes: {stats['total_scraped']}")
        print(f"   - Total articles reecrits: {stats['total_rewritten']}")
        print(f"   - Total articles publies: {stats['total_published']}")
        print(f"   - Total images: {stats['total_images']}")
        print(f"   - Scrapes aujourd'hui: {stats['scraped_today']}")

    async def run_continuous(self):
        """Execute en mode continu"""
        self.print_banner()
        print("[RUN] Mode continu active. Ctrl+C pour arreter.\n")

        cycle_count = 0

        while self.running:
            cycle_count += 1
            print(f"\n{'#'*60}")
            print(f"# CYCLE {cycle_count} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'#'*60}")

            results = await self.run_full_cycle()
            self.print_summary(results)

            if self.running:
                # Nettoyage periodique
                if cycle_count % 10 == 0:
                    cleanup_old_data(days=30)

                # Attente avant le prochain cycle
                print(f"\n[WAIT] Prochain cycle dans {SCRAPE_INTERVAL_MINUTES} minutes...")
                for i in range(SCRAPE_INTERVAL_MINUTES * 60):
                    if not self.running:
                        break
                    await asyncio.sleep(1)

        print("\n[OK] Arret termine. A bientot!")

    async def run_once(self):
        """Execute un seul cycle"""
        self.print_banner()
        print("[RUN] Mode execution unique\n")

        results = await self.run_full_cycle()
        self.print_summary(results)
        self.print_stats()


def main():
    """Point d'entree principal"""
    parser = argparse.ArgumentParser(
        description="Mada Flash - Automatisation des actualites malgaches"
    )

    parser.add_argument(
        '--once', action='store_true',
        help="Execution unique (pas de boucle)"
    )
    parser.add_argument(
        '--scrape', action='store_true',
        help="Scraping uniquement"
    )
    parser.add_argument(
        '--rewrite', action='store_true',
        help="Reecriture uniquement"
    )
    parser.add_argument(
        '--publish', action='store_true',
        help="Publication uniquement"
    )
    parser.add_argument(
        '--stats', action='store_true',
        help="Affiche les statistiques"
    )
    parser.add_argument(
        '--no-ai', action='store_true',
        help="Desactive la reecriture IA"
    )
    parser.add_argument(
        '--offline', action='store_true',
        help="Mode hors-ligne (sauvegarde locale)"
    )
    parser.add_argument(
        '--limit', type=int, default=5,
        help="Nombre max d'articles a traiter (defaut: 5)"
    )

    args = parser.parse_args()

    # Initialise la base de donnees
    init_database()

    # Cree l'orchestrateur
    automation = MadaFlashAutomation(
        use_ai=not args.no_ai,
        offline=args.offline
    )

    # Execute selon les arguments
    if args.stats:
        automation.print_stats()

    elif args.scrape:
        asyncio.run(automation.run_scraping())

    elif args.rewrite:
        asyncio.run(automation.run_rewriting(args.limit))

    elif args.publish:
        asyncio.run(automation.run_publishing(args.limit))

    elif args.once:
        asyncio.run(automation.run_once())

    else:
        # Mode continu par defaut
        asyncio.run(automation.run_continuous())


if __name__ == "__main__":
    main()
