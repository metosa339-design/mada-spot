"""
Gestion de la base de données SQLite pour le système d'automatisation
"""
import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

from config import DATABASE_PATH


def init_database():
    """Initialise la base de données avec les tables nécessaires"""
    with get_connection() as conn:
        cursor = conn.cursor()

        # Table des articles scrapés
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scraped_articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_name TEXT NOT NULL,
                source_url TEXT NOT NULL,
                original_url TEXT UNIQUE NOT NULL,
                original_title TEXT NOT NULL,
                original_content TEXT,
                original_image_url TEXT,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'scraped',
                category TEXT
            )
        """)

        # Table des articles réécrits
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rewritten_articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scraped_article_id INTEGER UNIQUE,
                title TEXT NOT NULL,
                summary TEXT,
                content TEXT NOT NULL,
                category TEXT,
                rewritten_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'rewritten',
                FOREIGN KEY (scraped_article_id) REFERENCES scraped_articles(id)
            )
        """)

        # Table des images
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id INTEGER,
                original_url TEXT,
                local_path TEXT,
                optimized_path TEXT,
                downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                FOREIGN KEY (article_id) REFERENCES scraped_articles(id)
            )
        """)

        # Table des publications
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS published_articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rewritten_article_id INTEGER UNIQUE,
                mada_flash_id TEXT,
                published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'published',
                FOREIGN KEY (rewritten_article_id) REFERENCES rewritten_articles(id)
            )
        """)

        # Table des logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT,
                message TEXT,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        print("[OK] Base de données initialisée")


@contextmanager
def get_connection():
    """Context manager pour la connexion à la base de données"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def article_exists(original_url: str) -> bool:
    """Vérifie si un article existe déjà dans la base"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM scraped_articles WHERE original_url = ?",
            (original_url,)
        )
        return cursor.fetchone() is not None


def save_scraped_article(
    source_name: str,
    source_url: str,
    original_url: str,
    original_title: str,
    original_content: str,
    original_image_url: Optional[str] = None,
    category: Optional[str] = None
) -> Optional[int]:
    """Sauvegarde un article scrapé"""
    if article_exists(original_url):
        return None

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO scraped_articles
            (source_name, source_url, original_url, original_title, original_content, original_image_url, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (source_name, source_url, original_url, original_title, original_content, original_image_url, category))
        conn.commit()
        return cursor.lastrowid


def get_articles_to_rewrite(limit: int = 10) -> List[Dict[str, Any]]:
    """Récupère les articles non encore réécrits"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT sa.* FROM scraped_articles sa
            LEFT JOIN rewritten_articles ra ON sa.id = ra.scraped_article_id
            WHERE ra.id IS NULL AND sa.status = 'scraped'
            ORDER BY sa.scraped_at DESC
            LIMIT ?
        """, (limit,))
        return [dict(row) for row in cursor.fetchall()]


def save_rewritten_article(
    scraped_article_id: int,
    title: str,
    summary: str,
    content: str,
    category: str
) -> Optional[int]:
    """Sauvegarde un article réécrit"""
    with get_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO rewritten_articles
                (scraped_article_id, title, summary, content, category)
                VALUES (?, ?, ?, ?, ?)
            """, (scraped_article_id, title, summary, content, category))

            # Met à jour le statut de l'article scrapé
            cursor.execute("""
                UPDATE scraped_articles SET status = 'rewritten' WHERE id = ?
            """, (scraped_article_id,))

            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None


def get_articles_to_publish(limit: int = 10) -> List[Dict[str, Any]]:
    """Récupère les articles réécrits non encore publiés"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ra.*, sa.original_image_url, i.optimized_path as local_image
            FROM rewritten_articles ra
            JOIN scraped_articles sa ON ra.scraped_article_id = sa.id
            LEFT JOIN images i ON sa.id = i.article_id AND i.status = 'optimized'
            LEFT JOIN published_articles pa ON ra.id = pa.rewritten_article_id
            WHERE pa.id IS NULL AND ra.status = 'rewritten'
            ORDER BY ra.rewritten_at DESC
            LIMIT ?
        """, (limit,))
        return [dict(row) for row in cursor.fetchall()]


def save_published_article(
    rewritten_article_id: int,
    mada_flash_id: str
) -> Optional[int]:
    """Marque un article comme publié"""
    with get_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO published_articles
                (rewritten_article_id, mada_flash_id)
                VALUES (?, ?)
            """, (rewritten_article_id, mada_flash_id))

            # Met à jour le statut de l'article réécrit
            cursor.execute("""
                UPDATE rewritten_articles SET status = 'published' WHERE id = ?
            """, (rewritten_article_id,))

            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None


def save_image(
    article_id: int,
    original_url: str,
    local_path: Optional[str] = None,
    status: str = 'pending'
) -> Optional[int]:
    """Sauvegarde les informations d'une image"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO images (article_id, original_url, local_path, status)
            VALUES (?, ?, ?, ?)
        """, (article_id, original_url, local_path, status))
        conn.commit()
        return cursor.lastrowid


def update_image_status(
    image_id: int,
    local_path: Optional[str] = None,
    optimized_path: Optional[str] = None,
    status: str = 'downloaded'
):
    """Met à jour le statut d'une image"""
    with get_connection() as conn:
        cursor = conn.cursor()
        if optimized_path:
            cursor.execute("""
                UPDATE images SET local_path = ?, optimized_path = ?, status = ?
                WHERE id = ?
            """, (local_path, optimized_path, status, image_id))
        else:
            cursor.execute("""
                UPDATE images SET local_path = ?, status = ?
                WHERE id = ?
            """, (local_path, status, image_id))
        conn.commit()


def get_images_to_download(limit: int = 20) -> List[Dict[str, Any]]:
    """Récupère les images en attente de téléchargement"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM images WHERE status = 'pending'
            ORDER BY downloaded_at DESC
            LIMIT ?
        """, (limit,))
        return [dict(row) for row in cursor.fetchall()]


def log_event(level: str, message: str, details: Optional[str] = None):
    """Enregistre un événement dans les logs"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO logs (level, message, details)
            VALUES (?, ?, ?)
        """, (level, message, details))
        conn.commit()


def get_stats() -> Dict[str, int]:
    """Retourne les statistiques de la base de données"""
    with get_connection() as conn:
        cursor = conn.cursor()

        stats = {}

        cursor.execute("SELECT COUNT(*) FROM scraped_articles")
        stats['total_scraped'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM rewritten_articles")
        stats['total_rewritten'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM published_articles")
        stats['total_published'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM images WHERE status = 'optimized'")
        stats['total_images'] = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM scraped_articles
            WHERE scraped_at > datetime('now', '-24 hours')
        """)
        stats['scraped_today'] = cursor.fetchone()[0]

        return stats


def cleanup_old_data(days: int = 30):
    """Nettoie les anciennes données"""
    with get_connection() as conn:
        cursor = conn.cursor()

        # Supprime les logs vieux de plus de X jours
        cursor.execute("""
            DELETE FROM logs
            WHERE created_at < datetime('now', ?)
        """, (f'-{days} days',))

        conn.commit()
        print(f"[OK] Nettoyage: logs de plus de {days} jours supprimés")


if __name__ == "__main__":
    init_database()
    print("Base de données prête!")
