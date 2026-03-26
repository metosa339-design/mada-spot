"""
Module de réécriture d'articles avec Claude API
"""
import asyncio
import json
import re
from typing import Dict, Any, Optional, List
from anthropic import Anthropic

from config import CLAUDE_API_KEY, REWRITE_PROMPT, CATEGORY_MAPPING
from database import (
    get_articles_to_rewrite,
    save_rewritten_article,
    log_event
)


class ArticleRewriter:
    """Réécrit les articles avec Claude API"""

    def __init__(self):
        if not CLAUDE_API_KEY:
            raise ValueError("CLAUDE_API_KEY non configurée!")

        self.client = Anthropic(api_key=CLAUDE_API_KEY)
        self.model = "claude-sonnet-4-20250514"  # Modèle équilibré coût/qualité

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Extrait le JSON de la réponse"""
        # Essaie d'abord de parser directement
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Cherche un bloc JSON dans le texte
        json_patterns = [
            r'```json\s*([\s\S]*?)\s*```',
            r'```\s*([\s\S]*?)\s*```',
            r'\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\}'
        ]

        for pattern in json_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    json_str = match.group(1) if '```' in pattern else match.group(0)
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    continue

        return None

    def _validate_rewrite(self, data: Dict[str, Any]) -> bool:
        """Valide la structure de l'article réécrit"""
        required_fields = ['title', 'content']
        return all(field in data and data[field] for field in required_fields)

    def _truncate_content(self, content: str, max_chars: int = 8000) -> str:
        """Tronque le contenu si trop long"""
        if len(content) <= max_chars:
            return content
        return content[:max_chars] + "..."

    async def rewrite_article(
        self,
        title: str,
        content: str,
        original_category: str = 'general'
    ) -> Optional[Dict[str, Any]]:
        """Réécrit un article avec Claude"""
        try:
            # Prépare le prompt
            truncated_content = self._truncate_content(content)
            prompt = REWRITE_PROMPT.format(
                title=title,
                content=truncated_content
            )

            # Appel à l'API Claude
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Extrait la réponse
            response_text = message.content[0].text

            # Parse le JSON
            result = self._extract_json(response_text)

            if not result or not self._validate_rewrite(result):
                log_event('warning', 'Réponse Claude invalide', response_text[:500])
                return None

            # Ajoute le résumé s'il manque
            if 'summary' not in result or not result['summary']:
                # Génère un résumé à partir du contenu
                result['summary'] = result['content'][:200] + "..."

            # Normalise la catégorie
            if 'category' not in result:
                result['category'] = CATEGORY_MAPPING.get(original_category, 'Actualités')

            return result

        except Exception as e:
            log_event('error', 'Erreur API Claude', str(e))
            return None

    async def rewrite_pending_articles(self, limit: int = 5) -> int:
        """Reecrit les articles en attente"""
        articles = get_articles_to_rewrite(limit)

        if not articles:
            print("Aucun article a reecrire")
            return 0

        print(f"\n[WRITE] Reecriture de {len(articles)} articles...")

        rewritten = 0
        for article in articles:
            print(f"  [..] Reecriture: {article['original_title'][:50]}...")

            result = await self.rewrite_article(
                article['original_title'],
                article['original_content'],
                article.get('category', 'general')
            )

            if result:
                # Sauvegarde l'article reecrit
                article_id = save_rewritten_article(
                    scraped_article_id=article['id'],
                    title=result['title'],
                    summary=result.get('summary', ''),
                    content=result['content'],
                    category=result.get('category', 'Actualites')
                )

                if article_id:
                    print(f"  [OK] Reecrit: {result['title'][:50]}")
                    rewritten += 1
                else:
                    print(f"  [SKIP] Deja traite: {article['original_title'][:50]}")
            else:
                print(f"  [ERR] Echec: {article['original_title'][:50]}")

            # Pause entre les appels API pour respecter les limites
            await asyncio.sleep(1)

        print(f"\n[DONE] {rewritten}/{len(articles)} articles reecrits\n")
        log_event('info', f'{rewritten} articles reecrits')

        return rewritten


class LocalRewriter:
    """Alternative sans API pour des réécritures simples"""

    def __init__(self):
        pass

    def simple_rewrite(
        self,
        title: str,
        content: str,
        category: str = 'Actualités'
    ) -> Dict[str, Any]:
        """Réécriture simple sans IA (reformatage basique)"""
        # Nettoie le titre
        clean_title = title.strip()
        if not clean_title.endswith(('.', '!', '?')):
            clean_title = clean_title.rstrip('.')

        # Crée un résumé
        sentences = re.split(r'[.!?]+', content)
        summary_sentences = [s.strip() for s in sentences[:2] if s.strip()]
        summary = '. '.join(summary_sentences) + '.'

        # Formate le contenu en paragraphes
        paragraphs = content.split('\n\n')
        if len(paragraphs) < 2:
            paragraphs = content.split('\n')

        formatted_content = '\n\n'.join(p.strip() for p in paragraphs if p.strip())

        return {
            'title': clean_title,
            'summary': summary[:300],
            'content': formatted_content,
            'category': category
        }


async def run_rewriter(limit: int = 5, use_ai: bool = True):
    """Fonction principale pour réécrire les articles"""
    if use_ai and CLAUDE_API_KEY:
        rewriter = ArticleRewriter()
        return await rewriter.rewrite_pending_articles(limit)
    else:
        print("[WARN] Mode sans IA: reecriture basique uniquement")
        from database import get_articles_to_rewrite, save_rewritten_article

        local_rewriter = LocalRewriter()
        articles = get_articles_to_rewrite(limit)

        rewritten = 0
        for article in articles:
            result = local_rewriter.simple_rewrite(
                article['original_title'],
                article['original_content'],
                CATEGORY_MAPPING.get(article.get('category', 'general'), 'Actualités')
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

        return rewritten


if __name__ == "__main__":
    from database import init_database
    init_database()
    asyncio.run(run_rewriter())
