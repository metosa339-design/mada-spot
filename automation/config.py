"""
Configuration pour le système d'automatisation Mada Flash
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Chemins
BASE_DIR = Path(__file__).parent
IMAGES_DIR = BASE_DIR / "images"
DATABASE_PATH = BASE_DIR / "mada_news.db"

# API Configuration
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "")
MADA_FLASH_API_URL = os.getenv("MADA_FLASH_API_URL", "http://localhost:3000/api/automation/articles")
MADA_FLASH_API_KEY = os.getenv("MADA_FLASH_API_KEY", "")

# Scraping Configuration
MAX_CONCURRENT_REQUESTS = 5
REQUEST_TIMEOUT = 30
RETRY_ATTEMPTS = 3
DELAY_BETWEEN_REQUESTS = 2  # seconds

# Image Configuration
MAX_IMAGE_WIDTH = 1200
MAX_IMAGE_HEIGHT = 800
IMAGE_QUALITY = 85
SUPPORTED_IMAGE_FORMATS = [".jpg", ".jpeg", ".png", ".webp"]

# Scheduling
SCRAPE_INTERVAL_MINUTES = 30
MAX_ARTICLES_PER_SOURCE = 5

# Liste des 20 sources d'actualités malgaches
NEWS_SOURCES = [
    {
        "name": "L'Express de Madagascar",
        "url": "https://lexpress.mg",
        "feed_url": "https://lexpress.mg/feed/",
        "type": "rss",
        "category": "general",
        "selectors": {
            "article": "article",
            "title": "h2.entry-title a",
            "content": ".entry-content",
            "image": ".post-thumbnail img",
            "date": ".entry-date"
        }
    },
    {
        "name": "Midi Madagasikara",
        "url": "https://www.midi-madagasikara.mg",
        "feed_url": "https://www.midi-madagasikara.mg/feed/",
        "type": "rss",
        "category": "general",
        "selectors": {
            "article": "article",
            "title": "h2.entry-title a",
            "content": ".entry-content",
            "image": ".featured-image img",
            "date": ".post-date"
        }
    },
    {
        "name": "Madagascar Tribune",
        "url": "https://www.madagascar-tribune.com",
        "feed_url": "https://www.madagascar-tribune.com/spip.php?page=backend",
        "type": "rss",
        "category": "general",
        "selectors": {
            "article": ".article",
            "title": "h1.entry-title",
            "content": ".article-content",
            "image": ".article-image img",
            "date": ".date"
        }
    },
    {
        "name": "Newsmada",
        "url": "https://www.newsmada.com",
        "feed_url": "https://www.newsmada.com/feed/",
        "type": "rss",
        "category": "general",
        "selectors": {
            "article": "article",
            "title": "h2.entry-title",
            "content": ".entry-content",
            "image": ".post-thumbnail img",
            "date": ".entry-date"
        }
    },
    {
        "name": "Orange Actu Madagascar",
        "url": "https://actu.orange.mg",
        "feed_url": None,
        "type": "html",
        "category": "general",
        "selectors": {
            "article_list": ".article-item",
            "title": "h2 a",
            "content": ".article-body",
            "image": "img.article-image",
            "date": ".article-date",
            "link": "h2 a"
        }
    },
    {
        "name": "La Gazette de la Grande Île",
        "url": "https://lagazette-dgi.com",
        "feed_url": "https://lagazette-dgi.com/feed/",
        "type": "rss",
        "category": "general",
        "selectors": {
            "article": "article",
            "title": "h2.entry-title",
            "content": ".entry-content",
            "image": ".wp-post-image",
            "date": ".entry-date"
        }
    },
    {
        "name": "Moov Madagascar",
        "url": "https://www.moov.mg",
        "feed_url": None,
        "type": "html",
        "category": "general",
        "selectors": {
            "article_list": ".news-item",
            "title": "h3 a",
            "content": ".news-content",
            "image": ".news-image img",
            "date": ".news-date",
            "link": "h3 a"
        }
    },
    {
        "name": "RFI Afrique - Madagascar",
        "url": "https://www.rfi.fr/fr/afrique",
        "feed_url": "https://www.rfi.fr/fr/afrique/rss",
        "type": "rss",
        "category": "international",
        "filter_keywords": ["madagascar", "malgache", "antananarivo"],
        "selectors": {
            "article": "article",
            "title": "h1",
            "content": ".article-content",
            "image": ".article-image img",
            "date": "time"
        }
    },
    {
        "name": "Les Nouvelles",
        "url": "https://www.les-nouvelles.com",
        "feed_url": None,
        "type": "html",
        "category": "general",
        "selectors": {
            "article_list": ".post",
            "title": "h2 a",
            "content": ".post-content",
            "image": ".post-image img",
            "date": ".post-date",
            "link": "h2 a"
        }
    },
    {
        "name": "Sobika",
        "url": "https://www.sobika.com",
        "feed_url": None,
        "type": "html",
        "category": "culture",
        "selectors": {
            "article_list": ".article",
            "title": "h2 a",
            "content": ".article-text",
            "image": ".article-img img",
            "date": ".date",
            "link": "h2 a"
        }
    },
    {
        "name": "Mada Actus",
        "url": "https://madaactus.com",
        "feed_url": "https://madaactus.com/feed/",
        "type": "rss",
        "category": "general",
        "selectors": {
            "article": "article",
            "title": "h2.entry-title",
            "content": ".entry-content",
            "image": ".post-thumbnail img",
            "date": ".entry-date"
        }
    },
    {
        "name": "Tananews",
        "url": "https://www.tananews.com",
        "feed_url": None,
        "type": "html",
        "category": "general",
        "selectors": {
            "article_list": ".post",
            "title": "h2 a",
            "content": ".post-excerpt",
            "image": ".post-thumb img",
            "date": ".post-meta .date",
            "link": "h2 a"
        }
    },
    {
        "name": "Madonline",
        "url": "https://www.madonline.com",
        "feed_url": None,
        "type": "html",
        "category": "general",
        "selectors": {
            "article_list": ".article-item",
            "title": "h3 a",
            "content": ".article-summary",
            "image": ".article-image img",
            "date": ".article-date",
            "link": "h3 a"
        }
    },
    {
        "name": "Indian Ocean Times",
        "url": "https://www.indian-ocean-times.com",
        "feed_url": None,
        "type": "html",
        "category": "regional",
        "filter_keywords": ["madagascar"],
        "selectors": {
            "article_list": ".news-block",
            "title": "h2 a",
            "content": ".news-excerpt",
            "image": ".news-img img",
            "date": ".news-meta time",
            "link": "h2 a"
        }
    },
    {
        "name": "Jejoo",
        "url": "https://jejoo.mg",
        "feed_url": None,
        "type": "html",
        "category": "entertainment",
        "selectors": {
            "article_list": ".post-item",
            "title": "h2 a",
            "content": ".post-summary",
            "image": ".post-image img",
            "date": ".post-date",
            "link": "h2 a"
        }
    },
    {
        "name": "Taratra",
        "url": "https://www.taratra.mg",
        "feed_url": None,
        "type": "html",
        "category": "general",
        "selectors": {
            "article_list": ".article",
            "title": "h2 a",
            "content": ".article-excerpt",
            "image": ".article-thumb img",
            "date": ".article-date",
            "link": "h2 a"
        }
    },
    {
        "name": "No Comment Madagascar",
        "url": "https://www.nocomment.mg",
        "feed_url": None,
        "type": "html",
        "category": "entertainment",
        "selectors": {
            "article_list": ".post",
            "title": "h2 a",
            "content": ".post-excerpt",
            "image": ".post-image img",
            "date": ".post-meta",
            "link": "h2 a"
        }
    },
    {
        "name": "Lakroan'i Madagasikara",
        "url": "https://www.lakroa.mg",
        "feed_url": None,
        "type": "html",
        "category": "catholic",
        "selectors": {
            "article_list": ".article-item",
            "title": "h3 a",
            "content": ".article-text",
            "image": ".article-image img",
            "date": ".article-date",
            "link": "h3 a"
        }
    },
    {
        "name": "Matv Madagascar",
        "url": "https://matv.mg",
        "feed_url": None,
        "type": "html",
        "category": "video",
        "selectors": {
            "article_list": ".video-item",
            "title": "h3 a",
            "content": ".video-description",
            "image": ".video-thumbnail img",
            "date": ".video-date",
            "link": "h3 a"
        }
    },
    {
        "name": "Ao Raha",
        "url": "https://www.aoraha.mg",
        "feed_url": None,
        "type": "html",
        "category": "general",
        "selectors": {
            "article_list": ".news-item",
            "title": "h2 a",
            "content": ".news-summary",
            "image": ".news-image img",
            "date": ".news-date",
            "link": "h2 a"
        }
    }
]

# Catégories pour le mapping
CATEGORY_MAPPING = {
    "general": "Actualités",
    "international": "International",
    "culture": "Culture",
    "entertainment": "Divertissement",
    "regional": "Région",
    "catholic": "Religion",
    "video": "Vidéo",
    "sport": "Sport",
    "economie": "Économie",
    "politique": "Politique"
}

# Prompts pour Claude
REWRITE_PROMPT = """Tu es un journaliste professionnel malgache. Réécris cet article de manière originale et engageante en français.

RÈGLES IMPORTANTES:
1. Garde le sens et les faits principaux
2. Utilise un ton professionnel mais accessible
3. Écris en français avec parfois des expressions malgaches courantes
4. Crée un titre accrocheur
5. Résumé de 2-3 phrases maximum
6. Corps de l'article: 3-5 paragraphes bien structurés
7. Ne mentionne JAMAIS la source originale
8. N'invente AUCUN fait

ARTICLE ORIGINAL:
Titre: {title}
Contenu: {content}

RÉPONDS EN JSON STRICT:
{{
    "title": "Nouveau titre accrocheur",
    "summary": "Résumé court et percutant",
    "content": "Corps de l'article réécrit en plusieurs paragraphes",
    "category": "Catégorie suggérée (Actualités, Sport, Culture, Économie, Politique, International)"
}}
"""
