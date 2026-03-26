// Match images to article content based on keywords
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Images thématiques par catégorie/mots-clés
const THEMED_IMAGES: Record<string, string[]> = {
  // Politique
  politique: [
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80', // meeting politique
    'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=800&q=80', // parlement
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80', // vote
  ],
  // Justice
  justice: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80', // justice
    'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&q=80', // tribunal
    'https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?w=800&q=80', // loi
  ],
  // Sport/Football
  football: [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80', // football
    'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80', // stade
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80', // match
  ],
  // Économie/Business
  economie: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80', // finance
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', // business
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80', // bureau
  ],
  // Santé
  sante: [
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80', // médical
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80', // hôpital
    'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80', // docteur
  ],
  // Agriculture
  agriculture: [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80', // champ
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80', // récolte
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80', // agriculture
  ],
  // Environnement
  environnement: [
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80', // nature
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', // forêt
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80', // paysage
  ],
  // Éducation
  education: [
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80', // école
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', // étudiants
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80', // université
  ],
  // Transport/Route
  transport: [
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80', // ville trafic
    'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&q=80', // route
    'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=800&q=80', // voiture
  ],
  // Météo
  meteo: [
    'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&q=80', // pluie
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=80', // nuage
    'https://images.unsplash.com/photo-1561484930-998b6a7b22e8?w=800&q=80', // tempête
  ],
  // Culture/Festival
  culture: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', // concert
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', // festival
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80', // musique
  ],
  // Technologie
  technologie: [
    'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&q=80', // tech
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', // circuit
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', // réseau
  ],
  // Commerce
  commerce: [
    'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800&q=80', // magasin
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80', // marché
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80', // shopping
  ],
  // Militaire/Sécurité
  securite: [
    'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=800&q=80', // militaire
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80', // police
    'https://images.unsplash.com/photo-1593113598332-cd59a0c3a9a1?w=800&q=80', // sécurité
  ],
  // Accident/Urgence
  accident: [
    'https://images.unsplash.com/photo-1587574293340-e0011c4e8ecf?w=800&q=80', // ambulance
    'https://images.unsplash.com/photo-1504439904031-93ded9f93e4e?w=800&q=80', // urgence
  ],
  // Tourisme
  tourisme: [
    'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80', // baobab madagascar
    'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80', // plage
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80', // voyage
  ],
  // Vanille/Export
  vanille: [
    'https://images.unsplash.com/photo-1631209121750-a9f656d14ab3?w=800&q=80', // vanille
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', // épices
  ],
  // Décès/Funéraire (mais pas nécrologie)
  deces: [
    'https://images.unsplash.com/photo-1509822929063-6b6cfc9b42f2?w=800&q=80', // commémoration
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80', // hommage
  ],
  // Default news
  default: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80',
  ],
};

// Mots-clés pour chaque catégorie
const KEYWORDS: Record<string, string[]> = {
  politique: ['politique', 'gouvernement', 'ministre', 'président', 'député', 'élection', 'parlement', 'refondation', 'exécutif', 'concertation', 'comité', 'pilotage', 'dialogue', 'réconciliation'],
  justice: ['justice', 'tribunal', 'juge', 'procès', 'loi', 'ciblée', 'captée'],
  football: ['football', 'barea', 'match', 'league', 'équipe', 'stade', 'championnat', 'pureplay'],
  economie: ['économie', 'pib', 'croissance', 'investissement', 'business', 'entreprise', 'richesse', 'exportation', 'commerce'],
  sante: ['santé', 'vaccination', 'hôpital', 'médecin', 'épidémie', 'mpox', 'maladie', 'fièvre'],
  agriculture: ['agriculture', 'rizicole', 'récolte', 'agri-business', 'cultivateur', 'riz', 'maïs'],
  environnement: ['environnement', 'reboisement', 'forêt', 'déforestation', 'climat', 'nature'],
  education: ['éducation', 'école', 'rentrée', 'scolaire', 'étudiant', 'université'],
  transport: ['embouteillage', 'route', 'transport', 'trafic', 'circulation', 'mobilité', 'infrastructure'],
  meteo: ['météo', 'pluie', 'cyclone', 'saison', 'inondation', 'tempête'],
  culture: ['culture', 'festival', 'musique', 'concert', 'artiste', 'art'],
  technologie: ['technologie', 'mobile', 'internet', 'réseau', 'numérique', 'digital'],
  commerce: ['commerce', 'centre commercial', 'magasin', 'ouverture', 'marché'],
  securite: ['militaire', 'sécurité', 'police', 'gendarmerie', 'armée', 'opération', 'interpellation', 'suspect'],
  accident: ['accident', 'urgence', 'maty', 'tampoka', 'noyade', 'drano', 'funeste', 'décès'],
  tourisme: ['tourisme', 'visiteur', 'hôtel', 'plage', 'vacances', 'baobab'],
  vanille: ['vanille', 'exportation', 'épice'],
  deces: ['anniversaire funeste', 'décès', 'hommage'],
};

function findBestCategory(title: string, content: string): string {
  const text = (title + ' ' + (content || '')).toLowerCase();

  let bestMatch = 'default';
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    const matches = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = category;
    }
  }

  return bestMatch;
}

function getRandomImage(category: string): string {
  const images = THEMED_IMAGES[category] || THEMED_IMAGES.default;
  return images[Math.floor(Math.random() * images.length)];
}

async function main() {
  console.log('Matching images to article content...\n');

  const articles = await prisma.article.findMany({
    select: { id: true, title: true, content: true, summary: true, imageUrl: true }
  });

  console.log(`Processing ${articles.length} articles...\n`);

  let updated = 0;
  for (const article of articles) {
    // Skip articles that already have local images (uploaded)
    if (article.imageUrl?.startsWith('/uploads/')) {
      continue;
    }

    const category = findBestCategory(article.title, article.summary || article.content || '');
    const newImage = getRandomImage(category);

    await prisma.article.update({
      where: { id: article.id },
      data: { imageUrl: newImage }
    });

    console.log(`[${category.toUpperCase()}] ${article.title.substring(0, 45)}...`);
    updated++;
  }

  console.log(`\n✓ Updated ${updated} articles with matching images`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
