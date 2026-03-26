// Script to add articles directly to database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample articles data
const articles = [
  {
    title: "Embouteillages à Antananarivo : La capitale malgache paralysée",
    slug: "embouteillages-antananarivo-capitale-paralysee",
    summary: "La capitale malgache fait face à une crise de mobilité devenue structurelle, avec des embouteillages quotidiens qui paralysent la ville.",
    content: `La capitale malgache fait face à une crise de mobilité devenue structurelle. Chaque jour, des milliers de Tananariviens passent des heures dans les embouteillages, affectant leur qualité de vie et l'économie locale.

Les causes sont multiples : un réseau routier inadapté, une croissance démographique rapide, et un parc automobile en constante augmentation. Les autorités tentent de trouver des solutions, mais le défi reste immense.

Les habitants réclament des mesures urgentes pour améliorer la circulation dans la capitale.`,
    imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Madagascar : Les exportations de vanille en hausse",
    slug: "madagascar-exportations-vanille-hausse",
    summary: "Les exportations de vanille malgache connaissent une croissance significative sur le marché international.",
    content: `Madagascar, premier producteur mondial de vanille, voit ses exportations augmenter significativement cette année. La demande internationale pour l'or noir malgache reste forte, notamment de la part des industries agroalimentaires et cosmétiques.

Les producteurs locaux bénéficient de prix favorables, bien que la filière reste confrontée à des défis liés au changement climatique et à la concurrence des arômes synthétiques.

Le gouvernement encourage la structuration de la filière pour maintenir la qualité premium de la vanille malgache.`,
    imageUrl: "https://images.unsplash.com/photo-1631209121750-a9f656d14ab3?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Tourisme : Madagascar attire de plus en plus de visiteurs",
    slug: "tourisme-madagascar-attire-visiteurs",
    summary: "Le secteur touristique malgache montre des signes encourageants de reprise avec une augmentation du nombre de visiteurs.",
    content: `Le tourisme à Madagascar reprend des couleurs. Les chiffres montrent une augmentation notable du nombre de visiteurs internationaux, attirés par la biodiversité unique et les paysages exceptionnels de la Grande Île.

Les principales destinations comme Nosy Be, l'Allée des Baobabs et les parcs nationaux connaissent une affluence croissante. Les opérateurs touristiques s'adaptent en proposant des offres diversifiées.

Le gouvernement mise sur le développement durable du secteur pour préserver les richesses naturelles du pays.`,
    imageUrl: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Agriculture : Nouvelle saison rizicole prometteuse",
    slug: "agriculture-saison-rizicole-prometteuse",
    summary: "Les prévisions pour la saison rizicole s'annoncent favorables pour les agriculteurs malgaches.",
    content: `La nouvelle saison rizicole démarre sous de bons auspices à Madagascar. Les conditions climatiques favorables et les efforts d'amélioration des techniques agricoles laissent présager une bonne récolte.

Le riz reste l'aliment de base des Malgaches, et une bonne production est essentielle pour la sécurité alimentaire du pays. Les autorités encouragent l'adoption de variétés améliorées et de techniques modernes.

Les agriculteurs espèrent des prix justes pour leur production afin d'améliorer leurs conditions de vie.`,
    imageUrl: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Éducation : Rentrée scolaire réussie dans tout le pays",
    slug: "education-rentree-scolaire-reussie",
    summary: "La rentrée scolaire s'est déroulée dans de bonnes conditions à travers Madagascar.",
    content: `La rentrée scolaire s'est déroulée avec succès dans l'ensemble du territoire malgache. Les élèves ont repris le chemin de l'école dans un contexte d'amélioration des infrastructures éducatives.

Le ministère de l'Éducation a déployé des efforts pour assurer la disponibilité des fournitures et des enseignants. De nouvelles salles de classe ont été construites dans plusieurs régions.

Les parents d'élèves restent mobilisés pour soutenir la scolarisation de leurs enfants malgré les difficultés économiques.`,
    imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Santé : Campagne de vaccination élargie",
    slug: "sante-campagne-vaccination-elargie",
    summary: "Une nouvelle campagne de vaccination est lancée pour protéger la population contre plusieurs maladies.",
    content: `Le ministère de la Santé lance une vaste campagne de vaccination à travers Madagascar. Cette initiative vise à protéger la population, notamment les enfants, contre plusieurs maladies évitables.

Les équipes médicales se déploient dans les zones rurales pour atteindre les populations les plus éloignées. Les vaccins sont gratuits et disponibles dans tous les centres de santé.

La population est encouragée à participer massivement à cette campagne pour renforcer l'immunité collective.`,
    imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Économie : Le PIB malgache en croissance",
    slug: "economie-pib-malgache-croissance",
    summary: "L'économie malgache affiche des indicateurs positifs avec une croissance du PIB.",
    content: `L'économie de Madagascar montre des signes encourageants de croissance. Les indicateurs macroéconomiques révèlent une progression du PIB, portée par plusieurs secteurs clés.

Les investissements étrangers augmentent, notamment dans les secteurs minier, textile et touristique. Le gouvernement poursuit ses réformes pour améliorer le climat des affaires.

Les experts appellent à une croissance plus inclusive pour réduire les inégalités et améliorer les conditions de vie de la population.`,
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Sport : Les Barea préparent leurs prochains matchs",
    slug: "sport-barea-preparent-prochains-matchs",
    summary: "L'équipe nationale de football de Madagascar intensifie sa préparation pour les compétitions à venir.",
    content: `Les Barea, l'équipe nationale de football de Madagascar, se préparent activement pour leurs prochaines échéances. Le sélectionneur a convoqué les meilleurs joueurs pour un stage de préparation.

Depuis leur parcours historique à la CAN 2019, les Barea continuent de susciter l'enthousiasme des supporters malgaches. L'objectif est de maintenir le niveau de performance et de qualifier le pays pour les grandes compétitions.

Les joueurs évoluant à l'étranger rejoignent progressivement le groupe pour renforcer l'équipe.`,
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Environnement : Reboisement massif dans le sud",
    slug: "environnement-reboisement-massif-sud",
    summary: "Un vaste programme de reboisement est lancé dans le sud de Madagascar pour lutter contre la déforestation.",
    content: `Un ambitieux programme de reboisement est en cours dans le sud de Madagascar. Cette initiative vise à restaurer les écosystèmes dégradés et à lutter contre la désertification.

Des milliers d'arbres sont plantés avec la participation active des communautés locales. Le projet combine reforestation et développement économique à travers l'agroforesterie.

Les organisations environnementales saluent cet effort mais appellent à des actions plus larges pour préserver la biodiversité unique de Madagascar.`,
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Technologie : Expansion du réseau mobile à Madagascar",
    slug: "technologie-expansion-reseau-mobile",
    summary: "Les opérateurs télécoms étendent leur couverture réseau pour connecter plus de Malgaches.",
    content: `Les opérateurs de téléphonie mobile poursuivent l'expansion de leurs réseaux à Madagascar. L'objectif est d'améliorer la connectivité dans les zones rurales et de démocratiser l'accès à internet.

La 4G se déploie progressivement dans les grandes villes, tandis que les zones reculées bénéficient d'une meilleure couverture 2G et 3G. Ces avancées favorisent le développement du commerce électronique et des services numériques.

Le gouvernement encourage ces investissements dans le cadre de sa stratégie de transformation digitale du pays.`,
    imageUrl: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Culture : Festival international de musique à Antananarivo",
    slug: "culture-festival-musique-antananarivo",
    summary: "La capitale accueille un festival international célébrant la richesse musicale de Madagascar et d'ailleurs.",
    content: `Antananarivo vibre au rythme d'un festival international de musique. Des artistes malgaches et internationaux se produisent pour célébrer la diversité musicale et culturelle.

Le festival met en lumière les talents locaux tout en favorisant les échanges culturels. Les styles traditionnels malgaches côtoient les musiques du monde dans une ambiance festive.

Cet événement contribue au rayonnement culturel de Madagascar et au développement du tourisme culturel.`,
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Infrastructure : Réhabilitation des routes nationales",
    slug: "infrastructure-rehabilitation-routes-nationales",
    summary: "D'importants travaux de réhabilitation des routes nationales sont en cours pour améliorer le transport.",
    content: `Le gouvernement poursuit la réhabilitation des routes nationales de Madagascar. Ces travaux visent à améliorer les liaisons entre les régions et à faciliter le transport des marchandises et des personnes.

Plusieurs axes stratégiques font l'objet de travaux de réfection et d'élargissement. Les entreprises locales et internationales participent à ces chantiers d'envergure.

L'amélioration du réseau routier est considérée comme un levier essentiel pour le développement économique du pays.`,
    imageUrl: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Politique : Dialogue national pour la réconciliation",
    slug: "politique-dialogue-national-reconciliation",
    summary: "Un dialogue national est engagé pour renforcer la cohésion sociale et politique à Madagascar.",
    content: `Un dialogue national est en cours à Madagascar pour favoriser la réconciliation et renforcer la cohésion sociale. Les différentes parties prenantes sont invitées à participer à ces échanges constructifs.

L'objectif est de créer un consensus autour des grandes orientations du pays et de résoudre les différends de manière pacifique. La société civile joue un rôle actif dans ce processus.

Les observateurs espèrent que ce dialogue aboutira à des résultats concrets pour la stabilité du pays.`,
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Météo : Saison des pluies annoncée dans le nord",
    slug: "meteo-saison-pluies-annoncee-nord",
    summary: "Les services météorologiques prévoient le début de la saison des pluies dans les régions nord du pays.",
    content: `La saison des pluies s'annonce dans le nord de Madagascar. Les services météorologiques prévoient des précipitations importantes dans les semaines à venir.

Les autorités appellent la population à la vigilance, notamment dans les zones sujettes aux inondations. Des mesures préventives sont mises en place pour faire face aux éventuelles intempéries.

Les agriculteurs se préparent pour cette saison cruciale pour leurs cultures, tout en restant attentifs aux risques liés aux fortes pluies.`,
    imageUrl: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
  {
    title: "Commerce : Ouverture d'un nouveau centre commercial",
    slug: "commerce-ouverture-nouveau-centre-commercial",
    summary: "Un nouveau centre commercial ouvre ses portes à Antananarivo, créant des emplois et dynamisant l'économie locale.",
    content: `Un nouveau centre commercial vient d'ouvrir ses portes dans la capitale malgache. Cet espace moderne abrite de nombreuses enseignes locales et internationales.

L'ouverture de ce centre crée plusieurs centaines d'emplois directs et indirects. Les consommateurs peuvent désormais accéder à une offre diversifiée de produits et services.

Ce projet illustre le dynamisme du secteur commercial à Madagascar et l'attractivité croissante du marché malgache.`,
    imageUrl: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800",
    status: "published",
    isFromRSS: true,
    isAiEnhanced: true,
  },
];

async function generateSlug(title: string): Promise<string> {
  let slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }
  return slug;
}

async function main() {
  console.log('Adding articles to database...\n');

  let count = 0;
  for (const articleData of articles) {
    try {
      const slug = await generateSlug(articleData.title);

      const article = await prisma.article.create({
        data: {
          ...articleData,
          slug,
          publishedAt: new Date(),
        },
      });

      console.log(`[OK] ${article.title.substring(0, 50)}...`);
      count++;
    } catch (error: any) {
      console.log(`[ERR] ${articleData.title.substring(0, 30)}... - ${error.message}`);
    }
  }

  console.log(`\nTotal: ${count} articles added`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
