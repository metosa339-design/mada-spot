# 🇲🇬 Mada Flash - Système d'Automatisation

Système complet d'automatisation pour scraper, réécrire et publier automatiquement les actualités malgaches.

## 📋 Fonctionnalités

- **Scraping asynchrone** de 20 sources d'actualités malgaches
- **Réécriture IA** avec Claude API (Anthropic)
- **Téléchargement et optimisation** automatique des images
- **Publication automatique** vers votre site Mada Flash
- **Base de données SQLite** pour le suivi et l'historique
- **Mode continu** avec intervalle configurable
- **Mode hors-ligne** pour sauvegarde locale

## 🚀 Installation

### Prérequis

- Python 3.8+
- pip (gestionnaire de paquets Python)

### Étapes

```bash
# 1. Allez dans le dossier automation
cd automation

# 2. Créez un environnement virtuel (recommandé)
python -m venv venv

# 3. Activez l'environnement
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Installez les dépendances
pip install -r requirements.txt

# 5. Copiez et configurez les variables d'environnement
copy .env.example .env
# Puis éditez .env avec vos clés API
```

## ⚙️ Configuration

Éditez le fichier `.env` :

```env
# Clé API Claude (obligatoire pour la réécriture IA)
CLAUDE_API_KEY=sk-ant-api03-xxxxx

# URL de l'API de votre site
MADA_FLASH_API_URL=http://localhost:3000/api/admin/articles

# Clé API si nécessaire
MADA_FLASH_API_KEY=votre-cle
```

## 📖 Utilisation

### Mode Continu (Production)

```bash
python main.py
```

Le script s'exécute en boucle toutes les 30 minutes (configurable).

### Exécution Unique

```bash
python main.py --once
```

### Commandes Spécifiques

```bash
# Scraping uniquement
python main.py --scrape

# Réécriture uniquement
python main.py --rewrite --limit 10

# Publication uniquement
python main.py --publish --limit 5

# Afficher les statistiques
python main.py --stats

# Mode sans IA (reformatage simple)
python main.py --no-ai

# Mode hors-ligne (sauvegarde en JSON)
python main.py --offline
```

## 📁 Structure des Fichiers

```
automation/
├── main.py              # Script principal / orchestrateur
├── config.py            # Configuration et liste des sources
├── database.py          # Gestion SQLite
├── scraper.py           # Scraping asynchrone
├── image_processor.py   # Téléchargement/optimisation images
├── rewriter.py          # Réécriture avec Claude AI
├── publisher.py         # Publication vers l'API
├── requirements.txt     # Dépendances Python
├── .env.example         # Template de configuration
├── .env                 # Configuration (à créer)
├── mada_news.db         # Base de données SQLite (créée auto)
└── images/              # Images téléchargées (créé auto)
```

## 📰 Sources d'Actualités

Le système scrape automatiquement 20 sources :

| Source | Type | Catégorie |
|--------|------|-----------|
| L'Express de Madagascar | RSS | Général |
| Midi Madagasikara | RSS | Général |
| Madagascar Tribune | RSS | Général |
| Newsmada | RSS | Général |
| Orange Actu Madagascar | HTML | Général |
| La Gazette de la Grande Île | RSS | Général |
| Moov Madagascar | HTML | Général |
| RFI Afrique (Madagascar) | RSS | International |
| Les Nouvelles | HTML | Général |
| Sobika | HTML | Culture |
| Mada Actus | RSS | Général |
| Tananews | HTML | Général |
| Madonline | HTML | Général |
| Indian Ocean Times | HTML | Régional |
| Jejoo | HTML | Divertissement |
| Taratra | HTML | Général |
| No Comment Madagascar | HTML | Divertissement |
| Lakroan'i Madagasikara | HTML | Religion |
| Matv Madagascar | HTML | Vidéo |
| Ao Raha | HTML | Général |

## 🔄 Flux de Travail

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SCRAPING  │────▶│   IMAGES    │────▶│  RÉÉCRITURE │────▶│ PUBLICATION │
│  20 sources │     │  Télécharg. │     │  Claude AI  │     │  API Mada   │
│   async     │     │  Optimis.   │     │  Français   │     │   Flash     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
   scraped_           images           rewritten_          published_
   articles                            articles            articles
   (SQLite)           (local)          (SQLite)            (SQLite)
```

## 📊 Base de Données

Tables SQLite :

- `scraped_articles` - Articles scrapés bruts
- `rewritten_articles` - Articles réécrits par l'IA
- `images` - Suivi des images téléchargées
- `published_articles` - Articles publiés
- `logs` - Journaux d'événements

## ⚡ Performance

- Scraping asynchrone avec 5 requêtes simultanées
- Délai de 2 secondes entre les sources
- Timeout de 30 secondes par requête
- Retry automatique (3 tentatives)

## 🛠️ Personnalisation

### Ajouter une Source

Dans `config.py`, ajoutez à `NEWS_SOURCES` :

```python
{
    "name": "Nom du Site",
    "url": "https://site.mg",
    "feed_url": "https://site.mg/feed/",  # ou None
    "type": "rss",  # ou "html"
    "category": "general",
    "selectors": {
        "article": "article",
        "title": "h2 a",
        "content": ".content",
        "image": "img",
        "date": ".date"
    }
}
```

### Modifier l'Intervalle

Dans `config.py` :

```python
SCRAPE_INTERVAL_MINUTES = 30  # Changez cette valeur
```

## 🐛 Dépannage

### Erreur "CLAUDE_API_KEY non configurée"

Assurez-vous d'avoir créé le fichier `.env` avec votre clé API.

### Erreur de connexion aux sites

Vérifiez votre connexion internet et que les sites sont accessibles.

### Images non téléchargées

Vérifiez que le dossier `images/` est accessible en écriture.

## 📝 Logs

Les logs sont stockés dans la table `logs` de la base SQLite. Consultez-les avec :

```bash
sqlite3 mada_news.db "SELECT * FROM logs ORDER BY created_at DESC LIMIT 20;"
```

## 🤝 Coexistence avec le Back-Office Manuel

Ce système fonctionne **en parallèle** avec votre back-office manuel :

- Les articles automatisés sont marqués `source: 'automation'`
- Votre back-office reste 100% fonctionnel
- Vous pouvez désactiver l'automatisation à tout moment

## 📄 Licence

Projet privé - Mada Flash
