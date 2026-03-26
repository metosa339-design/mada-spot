// Script pour supprimer les articles en malgache de la base de données
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mots typiquement malgaches pour détecter la langue
const MALAGASY_INDICATORS = [
  ' ny ', ' sy ', ' ary ', ' dia ', ' izay ', ' ho ', ' tsy ', ' ao ', ' eto ',
  ' teo ', " amin'ny ", " an'ny ", " tamin'ny ", ' momba ', ' izao ', ' mba ',
  ' nanao ', ' manao ', ' hoe ', ' noho ', ' satria ', ' raha ', ' fa ', ' koa ',
  'ina ', 'ana ', 'tra ', 'ena ', 'iana ', 'oana ',
  ' maha', ' mam', ' man', ' mif', ' mit', ' mia', ' mp',
  'firenena', 'malagasy', 'madagasikara',
  'vahoaka', 'fanjakana', 'minisitra', 'filoha', 'governemanta',
  'lalàna', 'fitsarana', 'polisy', 'zandary', 'miaramila',
  'araka ny', "taorian'ny", 'mialoha ny', 'nandritra ny',
  "ho an'ny", 'avy any', "any amin'ny"
];

function isMalagasyText(title, summary) {
  const text = `${title || ''} ${summary || ''}`.toLowerCase();

  let malagasyCount = 0;
  for (const indicator of MALAGASY_INDICATORS) {
    if (text.includes(indicator.toLowerCase())) {
      malagasyCount++;
    }
  }

  return malagasyCount >= 3;
}

async function cleanupMalagasyArticles() {
  console.log('🔍 Recherche des articles en malgache...\n');

  try {
    // Récupérer tous les articles
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        summary: true,
      }
    });

    console.log(`📊 Total articles: ${articles.length}`);

    // Identifier les articles en malgache
    const malagasyArticles = articles.filter(a => isMalagasyText(a.title, a.summary));

    console.log(`🇲🇬 Articles en malgache détectés: ${malagasyArticles.length}\n`);

    if (malagasyArticles.length === 0) {
      console.log('✅ Aucun article en malgache à supprimer.');
      return;
    }

    // Afficher les articles qui seront supprimés
    console.log('Articles à supprimer:');
    malagasyArticles.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.title.substring(0, 60)}...`);
    });

    // Supprimer les articles en malgache
    const idsToDelete = malagasyArticles.map(a => a.id);

    const result = await prisma.article.deleteMany({
      where: {
        id: { in: idsToDelete }
      }
    });

    console.log(`\n✅ ${result.count} articles en malgache supprimés.`);

    // Afficher le nouveau total
    const remaining = await prisma.article.count();
    console.log(`📊 Articles restants: ${remaining}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupMalagasyArticles();
