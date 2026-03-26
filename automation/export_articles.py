"""Export scraped articles to JSON for import"""
import sqlite3
import json
from config import DATABASE_PATH

def export_articles():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute('''
      SELECT
        ra.title,
        ra.summary,
        ra.content,
        ra.category,
        sa.original_image_url as imageUrl,
        sa.source_name as sourceName,
        sa.original_url as sourceUrl
      FROM rewritten_articles ra
      JOIN scraped_articles sa ON ra.scraped_article_id = sa.id
      LEFT JOIN published_articles pa ON ra.id = pa.rewritten_article_id
      WHERE pa.id IS NULL
    ''')

    articles = [dict(row) for row in cursor.fetchall()]
    conn.close()

    with open('articles_export.json', 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    print(f'Exported {len(articles)} articles to articles_export.json')

if __name__ == '__main__':
    export_articles()
