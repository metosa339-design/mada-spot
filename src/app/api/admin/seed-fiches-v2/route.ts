import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const A = '/images/Attractions';

// ================================================================
// VOLUME 2 — 12 NOUVEAUX SITES (Fiches 46-57)
// GPS vérifié via Google Places, tarifs MNP officiels 2024
// ================================================================

interface FicheData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  city: string;
  region: string;
  attractionType: string;
  isFree: boolean;
  entryFeeLocal: number;
  entryFeeForeign: number;
  visitDuration: string;
  bestTimeToVisit: string;
  highlights: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  latitude: number;
  longitude: number;
  coverImage: string | null;
  hasGuide: boolean;
  hasParking: boolean;
  isAccessible: boolean;
  existingSlugs?: string[];
}

const FICHES: FicheData[] = [
  // ============================
  // FICHE 46 — Parc National de la Montagne d'Ambre (UPDATE)
  // ============================
  {
    name: "Parc National de la Montagne d'Ambre",
    slug: 'montagne-dambre-diego-suarez',
    existingSlugs: ['montagne-dambre-diego-suarez', 'montagne-ambre', 'parc-montagne-ambre'],
    description: `Le Parc National de la Montagne d'Ambre est le plus ancien parc national de Madagascar, créé en 1958. Perché entre 850 et 1 475 mètres d'altitude, ce massif volcanique abrite une forêt tropicale humide luxuriante au cœur d'une région pourtant sèche — un véritable îlot de verdure.

Ses cascades spectaculaires, dont la Grande Cascade et la Cascade Sacrée, ses lacs de cratère aux eaux émeraude et sa biodiversité exceptionnelle en font un incontournable du Nord. Le parc héberge 7 espèces de lémuriens, le célèbre caméléon Brookesia tuberculata et plus de 75 espèces d'oiseaux.

À seulement 45 minutes de Diego-Suarez, c'est l'excursion nature la plus accessible de la pointe Nord.`,
    shortDescription: "Forêt tropicale d'altitude avec cascades spectaculaires et lacs de cratère — Le plus ancien parc national de Madagascar.",
    city: 'Joffreville',
    region: 'Diana',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '1 jour',
    bestTimeToVisit: 'Avril à novembre (matin 7h-11h)',
    highlights: [
      'Grande Cascade (chute de 80 m en forêt)',
      'Lac de la Coupe Verte (lac de cratère)',
      'Caméléons et 7 espèces de lémuriens',
      "Forêt tropicale d'altitude (orchidées, fougères géantes)",
    ],
    rating: 4.3,
    reviewCount: 129,
    isFeatured: false,
    latitude: -12.6167,
    longitude: 49.15,
    coverImage: `${A}/montagne-ambre/Parc National Montagne d'Ambre.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 47 — Parc National de Zombitse-Vohibasia (UPDATE)
  // ============================
  {
    name: 'Parc National de Zombitse-Vohibasia',
    slug: 'parc-national-zombitse-vohibasia',
    existingSlugs: ['parc-national-zombitse-vohibasia', 'zombitse-vohibasia'],
    description: `Le Parc National de Zombitse-Vohibasia est un trésor méconnu de la RN7, niché dans une forêt sèche dense qui constitue une zone de transition biogéographique unique entre l'Ouest et le Sud de Madagascar.

Ce parc de 36 300 hectares est un paradis pour les ornithologues : on y trouve des espèces d'oiseaux endémiques introuvables ailleurs, comme l'Ibis huppé de Madagascar. Le lémurien sportif de Zombitse (Lepilemur hubbardorum), découvert ici, ne vit nulle part ailleurs sur la planète.

C'est un arrêt rapide et facile sur la route de l'Isalo, souvent ignoré à tort par les voyageurs pressés.`,
    shortDescription: "Paradis ornithologique sur la RN7 — Espèces d'oiseaux endémiques introuvables ailleurs à Madagascar.",
    city: 'Sakaraha',
    region: 'Atsimo-Andrefana',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '2-3 heures',
    bestTimeToVisit: 'Avril à novembre (matin 6h-9h pour les oiseaux)',
    highlights: [
      'Oiseaux endémiques rares (Ibis huppé, Coua)',
      'Lémurien sportif de Zombitse (espèce unique)',
      'Sifaka de Verreaux (observation facile)',
      'Forêt sèche de transition (écosystème unique)',
    ],
    rating: 4.1,
    reviewCount: 16,
    isFeatured: false,
    latitude: -22.8862,
    longitude: 44.6914,
    coverImage: null,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 48 — Parc National de Tsimanampesotse (CREATE)
  // ============================
  {
    name: 'Parc National de Tsimanampesotse',
    slug: 'parc-national-tsimanampesotse',
    description: `Le Parc National de Tsimanampesotse — dont le nom signifie "le lac où il n'y a pas de dauphins" — est l'un des joyaux les plus insolites de Madagascar. Ce parc de 43 200 hectares protège un lac salé alcalin peuplé de flamants roses, une forêt épineuse surréaliste avec des baobabs nains et des euphorbes candélabres.

Un réseau de grottes sous-marines où des plongeurs ont découvert des ossements fossilisés de lémuriens géants disparus et de tortues préhistoriques. Le paysage, entre cactus géants et arbres fantomatiques, donne l'impression d'évoluer sur une autre planète.`,
    shortDescription: "Lac salé aux flamants roses et forêt épineuse surréaliste — Un paysage d'une autre planète.",
    city: 'Toliara',
    region: 'Atsimo-Andrefana',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '1 jour',
    bestTimeToVisit: "Avril à novembre (matin, éviter la chaleur de l'après-midi)",
    highlights: [
      'Lac salé aux flamants roses',
      'Grottes sous-marines (fossiles de lémuriens géants)',
      'Forêt épineuse surréaliste (baobabs nains, euphorbes)',
      'Plongée souterraine dans les grottes Vintany',
    ],
    rating: 4.4,
    reviewCount: 32,
    isFeatured: false,
    latitude: -24.1454,
    longitude: 43.8291,
    coverImage: null,
    hasGuide: true,
    hasParking: true,
    isAccessible: false,
  },

  // ============================
  // FICHE 49 — Parc National de Kirindy Mitea (CREATE)
  // ============================
  {
    name: 'Parc National de Kirindy Mitea',
    slug: 'parc-national-kirindy-mitea',
    description: `Le Parc National de Kirindy Mitea est un condensé remarquable de la biodiversité de l'Ouest malgache, rassemblant sur 72 200 hectares une mosaïque d'écosystèmes rares : forêt sèche caducifoliée, dunes littorales, lagons de sable blanc, mangroves et bosquets de baobabs.

Très peu visité — ce qui en fait son charme —, le parc abrite le Fossa, le plus grand prédateur de Madagascar, ainsi que des lémuriens, des reptiles endémiques et une avifaune côtière riche. Les villages de pêcheurs environnants et les couchers de soleil sur le canal du Mozambique ajoutent une dimension humaine et esthétique exceptionnelle.`,
    shortDescription: "Mosaïque d'écosystèmes rares entre dunes, forêt sèche et lagons — Un parc sauvage quasi inexploré.",
    city: 'Morondava',
    region: 'Menabe',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Mai à octobre (safari nocturne 18h-20h recommandé)',
    highlights: [
      "Mosaïque d'écosystèmes (dunes, forêt, lagons)",
      'Baobabs et forêt sèche caducifoliée',
      'Fossa et faune endémique',
      'Lagons et villages de pêcheurs',
    ],
    rating: 4.1,
    reviewCount: 66,
    isFeatured: false,
    latitude: -20.7398,
    longitude: 44.172,
    coverImage: null,
    hasGuide: true,
    hasParking: true,
    isAccessible: false,
  },

  // ============================
  // FICHE 50 — Parc National de la Baie de Baly (CREATE)
  // ============================
  {
    name: 'Parc National de la Baie de Baly',
    slug: 'parc-national-baie-de-baly',
    description: `Le Parc National de la Baie de Baly est l'un des parcs les plus reculés et les moins visités de Madagascar, mais il abrite un trésor inestimable : la tortue à soc (Astrochelys yniphora), considérée comme la tortue la plus rare au monde avec moins de 400 individus à l'état sauvage.

Ce parc de 57 142 hectares protège un ensemble de forêts sèches, de mangroves, de savanes et de plages immaculées bordant la baie. L'isolement total du site, accessible uniquement par des pistes difficiles ou par bateau, en fait une destination réservée aux voyageurs les plus déterminés et aux passionnés de conservation.`,
    shortDescription: "Refuge de la tortue la plus rare au monde — Un parc sauvage accessible uniquement aux aventuriers.",
    city: 'Soalala',
    region: 'Boeny',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Mai à octobre (saison sèche impérative)',
    highlights: [
      'Tortue à soc (tortue la plus rare du monde)',
      'Mangroves et baie sauvage',
      'Forêt sèche préservée',
      'Isolement total et plages vierges',
    ],
    rating: 4.5,
    reviewCount: 5,
    isFeatured: false,
    latitude: -16.0263,
    longitude: 45.2431,
    coverImage: null,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 51 — Tsingy de Namoroka (CREATE)
  // ============================
  {
    name: 'Parc National des Tsingy de Namoroka',
    slug: 'tsingy-de-namoroka',
    description: `Les Tsingy de Namoroka sont le secret le mieux gardé de Madagascar. Ce parc national de 21 742 hectares abrite des formations calcaires acérées similaires à celles de Bemaraha, mais dans un isolement quasi total — vous pourriez être le seul visiteur pendant des jours.

Les canyons profonds, les grottes, les lacs souterrains et la forêt sèche abritent une faune endémique remarquable incluant 8 espèces de lémuriens. L'absence quasi totale de touristes confère à ce site une authenticité et une sérénité impossibles à trouver ailleurs. C'est le Tsingy originel, brut, sans pont suspendu ni via ferrata — l'aventure à l'état pur.`,
    shortDescription: "Le secret le mieux gardé de Madagascar — Des Tsingy sauvages sans aucun aménagement touristique.",
    city: 'Soalala',
    region: 'Boeny',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Juin à octobre (saison sèche stricte)',
    highlights: [
      'Tsingy calcaires sauvages (sans aménagement)',
      'Grottes et lacs souterrains',
      'Solitude totale (quasi aucun touriste)',
      '8 espèces de lémuriens en forêt sèche',
    ],
    rating: 4.6,
    reviewCount: 3,
    isFeatured: false,
    latitude: -16.4709,
    longitude: 45.3369,
    coverImage: null,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 52 — Forêt de Kirindy (UPDATE)
  // ============================
  {
    name: 'Forêt de Kirindy — Le Royaume du Fossa',
    slug: 'foret-de-kirindy',
    existingSlugs: ['foret-de-kirindy-morondava', 'foret-de-kirindy', 'foret-kirindy'],
    description: `La Forêt de Kirindy est une réserve de forêt sèche caducifoliée gérée par le CNFEREF. C'est LE spot incontournable pour observer le Fossa (Cryptoprocta ferox), le plus grand prédateur carnivore de Madagascar, un félin-mangouste endémique qui ne vit nulle part ailleurs sur Terre.

Le safari nocturne est le moment fort : à la tombée de la nuit, la forêt s'anime avec des lémuriens nocturnes (Microcebus, Phaner, lémurien sportif), des rats sauteurs géants, des tenrecs et, si la chance vous sourit, le Fossa en chasse.

En saison de reproduction (octobre-novembre), les observations de Fossa sont quasi garanties.`,
    shortDescription: "LE spot pour observer le Fossa — Safari nocturne exceptionnel en forêt sèche.",
    city: 'Morondava',
    region: 'Menabe',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 50000,
    visitDuration: '1 jour (avec safari nocturne)',
    bestTimeToVisit: 'Octobre-novembre (reproduction Fossa) / Mai-novembre (saison sèche)',
    highlights: [
      'Observation du Fossa (plus grand prédateur endémique)',
      'Safari nocturne (microfaune fascinante)',
      'Lémuriens diurnes et nocturnes (8 espèces)',
      'Forêt sèche caducifoliée (recherche scientifique)',
    ],
    rating: 4.2,
    reviewCount: 76,
    isFeatured: false,
    latitude: -20.0574,
    longitude: 44.6276,
    coverImage: null,
    hasGuide: true,
    hasParking: true,
    isAccessible: false,
  },

  // ============================
  // FICHE 53 — Réserve de Berenty (UPDATE)
  // ============================
  {
    name: 'Réserve de Berenty',
    slug: 'reserve-de-berenty',
    existingSlugs: ['reserve-de-berenty', 'berenty'],
    description: `La Réserve de Berenty est la réserve privée la plus célèbre de Madagascar, fondée en 1936 par la famille de Heaulme au cœur de leur plantation de sisal. Étendue sur 265 hectares, elle protège deux types de forêt : une forêt de galerie le long du fleuve Mandrare et une forêt épineuse typique du Grand Sud.

Ce qui rend Berenty unique, c'est l'extrême proximité avec les lémuriens : les Catta et les Sifaka de Verreaux se promènent librement dans le lodge, sur les chemins et même sur les tables du restaurant. C'est probablement l'endroit le plus confortable et le plus garanti au monde pour observer les lémuriens dans un cadre semi-naturel.`,
    shortDescription: "Lémuriens en liberté dans un lodge en pleine nature — L'endroit le plus garanti au monde pour les observer.",
    city: 'Amboasary-Atsimo',
    region: 'Anosy',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 150000,
    entryFeeForeign: 250000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Avril à novembre (matin 6h-9h et 15h-17h)',
    highlights: [
      'Lémuriens Catta en liberté (approche à 1 mètre)',
      'Sifaka de Verreaux "danseurs" (locomotion bipède unique)',
      'Forêt épineuse du Grand Sud (paysage lunaire)',
      'Lodge confortable en pleine nature',
    ],
    rating: 4.4,
    reviewCount: 54,
    isFeatured: false,
    latitude: -25.0106,
    longitude: 46.3084,
    coverImage: `${A}/fort-dauphin/fort-dauphin.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 54 — Réserve Peyrieras Madagascar Exotic (CREATE)
  // ============================
  {
    name: 'Réserve Peyrieras Madagascar Exotic',
    slug: 'reserve-peyrieras',
    description: `La Réserve Peyrieras Madagascar Exotic, fondée par l'entomologiste André Peyrieras, est un parc animalier et centre de reproduction situé stratégiquement sur la RN2, à mi-chemin entre Antananarivo et le Parc d'Andasibe.

C'est l'arrêt idéal pour découvrir de très près les caméléons les plus spectaculaires de Madagascar — du géant Parsonii au minuscule Brookesia — ainsi que des geckos, des grenouilles colorées (Mantella), des boas, des papillons et des lémuriens Sifaka en semi-liberté.

Le centre participe à des programmes de reproduction et de réintroduction en milieu naturel.`,
    shortDescription: "Collection exceptionnelle de caméléons et lémuriens — L'arrêt idéal sur la route d'Andasibe.",
    city: 'Marozevo',
    region: 'Mangoro',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 25000,
    visitDuration: '45 min - 1h30',
    bestTimeToVisit: 'Toute l\'année (matin 8h-11h)',
    highlights: [
      'Collection exceptionnelle de caméléons (toutes tailles)',
      'Lémuriens Sifaka en semi-liberté',
      'Grenouilles Mantella (couleurs vives)',
      'Papillons géants et insectes endémiques',
    ],
    rating: 4.3,
    reviewCount: 267,
    isFeatured: false,
    latitude: -18.9321,
    longitude: 47.95,
    coverImage: null,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 55 — Nosy Komba (UPDATE)
  // ============================
  {
    name: "Nosy Komba — L'Île aux Lémuriens",
    slug: 'nosy-komba-nosy-be',
    existingSlugs: ['nosy-komba-nosy-be', 'nosy-komba'],
    description: `Nosy Komba, "l'île aux lémuriens", est une île volcanique conique couverte de forêt tropicale, nichée entre Nosy Be et la côte nord-ouest de Madagascar. Son village principal, Ampangorinana, est le point de départ d'une rencontre inoubliable avec les lémuriens noirs macaco (Eulemur macaco) qui descendent des arbres pour se percher sur les épaules des visiteurs et manger des bananes dans leurs mains.

L'île est également réputée pour ses artisans — nappes brodées, sculptures en bois et bijoux — que l'on découvre en remontant le sentier bordé d'échoppes colorées depuis la plage.

Accessible en 30 minutes de bateau depuis Nosy Be, c'est l'excursion la plus populaire de l'archipel.`,
    shortDescription: "L'île aux lémuriens — Rencontre inoubliable avec les lémuriens noirs en liberté.",
    city: 'Nosy Be',
    region: 'Diana',
    attractionType: 'ile',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 35000,
    visitDuration: 'Demi-journée à 1 jour',
    bestTimeToVisit: 'Avril à décembre (saison sèche)',
    highlights: [
      'Lémuriens noirs en semi-liberté (contact direct)',
      'Artisanat local (nappes brodées, sculptures)',
      'Tortues géantes et caméléons',
      'Village de pêcheurs authentique (Ampangorinana)',
    ],
    rating: 4.5,
    reviewCount: 448,
    isFeatured: false,
    latitude: -13.445,
    longitude: 48.3458,
    coverImage: `${A}/nosy-be/nosy-be.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: true,
  },

  // ============================
  // FICHE 56 — Fort-Dauphin / Tolagnaro (CREATE)
  // ============================
  {
    name: 'Fort-Dauphin (Tolagnaro)',
    slug: 'fort-dauphin',
    description: `Fort-Dauphin, ou Tolagnaro, est une ville côtière spectaculaire nichée sur une péninsule battue par les vents de l'océan Indien, à l'extrême sud-est de Madagascar. Fondée en 1643 par les Français — ce qui en fait le premier établissement européen de l'île —, la ville est dominée par le Pic Saint-Louis (529 m) et entourée de plages sauvages à couper le souffle.

La plage de Libanona, avec ses eaux cristallines et son sable doré bordé de collines verdoyantes, est l'une des plus belles de Madagascar. Fort-Dauphin est le point de départ idéal pour la Réserve de Berenty, les forêts littorales de Mandena et le littoral sauvage d'Evatra.`,
    shortDescription: "Péninsule spectaculaire battue par l'océan Indien — Plages sauvages et randonnée au Pic Saint-Louis.",
    city: 'Fort-Dauphin',
    region: 'Anosy',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 10000,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Avril à novembre (attention : ville très venteuse)',
    highlights: [
      'Plage de Libanona (baignade et coucher de soleil)',
      'Pic Saint-Louis (randonnée panoramique, 529 m)',
      'Fort colonial portugais et français (histoire)',
      'Porte d\'entrée vers Berenty et le littoral sauvage',
    ],
    rating: 4.6,
    reviewCount: 358,
    isFeatured: false,
    latitude: -25.0287,
    longitude: 46.9825,
    coverImage: `${A}/fort-dauphin/fort-dauphin-1.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 57 — Ifaty-Mangily (CREATE)
  // ============================
  {
    name: 'Ifaty-Mangily — La Riviera du Sud',
    slug: 'ifaty-mangily',
    description: `Ifaty-Mangily est la station balnéaire principale du Sud de Madagascar, un chapelet de villages de pêcheurs Vezo étirés le long d'une côte protégée par le Grand Récif, la troisième plus grande barrière de corail au monde.

Le lagon offre des conditions idéales pour le snorkeling et la plongée, avec des jardins de corail, des tortues marines et une vie sous-marine colorée. À terre, la Forêt Épineuse de Reniala — un Arboretum communautaire — abrite des baobabs millénaires, dont le "Baobab Amoureux" (deux baobabs enlacés), et des oiseaux endémiques.

Le contraste entre la mer turquoise et la brousse épineuse du Sud est saisissant.`,
    shortDescription: "Station balnéaire du Grand Récif — Snorkeling, baobabs millénaires et villages de pêcheurs Vezo.",
    city: 'Toliara',
    region: 'Atsimo-Andrefana',
    attractionType: 'plage',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 30000,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Avril à novembre (mer calme)',
    highlights: [
      'Grand Récif (snorkeling et plongée)',
      'Arboretum de Reniala (baobabs et forêt épineuse)',
      'Le "Baobab Amoureux" (deux baobabs enlacés)',
      'Village de pêcheurs Vezo (pirogues à balancier)',
    ],
    rating: 4.2,
    reviewCount: 178,
    isFeatured: false,
    latitude: -23.1247,
    longitude: 43.6092,
    coverImage: `${A}/ifaty/ifaty-tulear.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },
];

// ================================================================
// POST handler — same logic as seed-fiches (Vol.1)
// ================================================================
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non autorisé en production' }, { status: 403 });
  }

  try {
    const results: string[] = [];
    let created = 0;
    let updated = 0;

    for (const item of FICHES) {
      // Try to find existing entry
      let existing = null;

      // 1) Check all possible slugs
      const slugsToCheck = [item.slug, ...(item.existingSlugs || [])];
      for (const slug of slugsToCheck) {
        existing = await prisma.establishment.findFirst({
          where: { slug },
          include: { attraction: true },
        });
        if (existing) break;
      }

      // 2) Fallback: match by name
      if (!existing) {
        existing = await prisma.establishment.findFirst({
          where: { type: 'ATTRACTION', name: item.name },
          include: { attraction: true },
        });
      }

      if (existing) {
        // UPDATE existing with enriched data from PDF
        const updateData: Record<string, unknown> = {
          name: item.name,
          description: item.description,
          shortDescription: item.shortDescription,
          city: item.city,
          region: item.region,
          rating: item.rating,
          reviewCount: item.reviewCount,
          isFeatured: item.isFeatured,
          isActive: true,
          moderationStatus: 'approved',
          latitude: item.latitude,
          longitude: item.longitude,
        };

        // Update coverImage only if we have a local one
        if (item.coverImage) {
          updateData.coverImage = item.coverImage;
        }

        // Update slug if no conflict
        if (existing.slug !== item.slug) {
          const conflict = await prisma.establishment.findFirst({
            where: { slug: item.slug, id: { not: existing.id } },
          });
          if (!conflict) {
            updateData.slug = item.slug;
          }
        }

        await prisma.establishment.update({
          where: { id: existing.id },
          data: updateData,
        });

        if (existing.attraction) {
          await prisma.attraction.update({
            where: { establishmentId: existing.id },
            data: {
              attractionType: item.attractionType,
              isFree: item.isFree,
              entryFeeLocal: item.entryFeeLocal,
              entryFeeForeign: item.entryFeeForeign,
              visitDuration: item.visitDuration,
              bestTimeToVisit: item.bestTimeToVisit,
              highlights: JSON.stringify(item.highlights),
              isAccessible: item.isAccessible,
              hasGuide: item.hasGuide,
              hasParking: item.hasParking,
            },
          });
        }

        results.push(`[UPDATE] ${item.name}`);
        updated++;
      } else {
        // CREATE new entry
        let finalSlug = item.slug;
        const slugExists = await prisma.establishment.findFirst({ where: { slug: finalSlug } });
        if (slugExists) {
          finalSlug = `${item.slug}-v2`;
        }

        await prisma.establishment.create({
          data: {
            name: item.name,
            slug: finalSlug,
            description: item.description,
            shortDescription: item.shortDescription,
            type: 'ATTRACTION',
            city: item.city,
            region: item.region,
            coverImage: item.coverImage,
            rating: item.rating,
            reviewCount: item.reviewCount,
            isFeatured: item.isFeatured,
            isActive: true,
            moderationStatus: 'approved',
            latitude: item.latitude,
            longitude: item.longitude,
            attraction: {
              create: {
                attractionType: item.attractionType,
                isFree: item.isFree,
                entryFeeLocal: item.entryFeeLocal,
                entryFeeForeign: item.entryFeeForeign,
                visitDuration: item.visitDuration,
                bestTimeToVisit: item.bestTimeToVisit,
                highlights: JSON.stringify(item.highlights),
                isAccessible: item.isAccessible,
                hasGuide: item.hasGuide,
                hasParking: item.hasParking,
              },
            },
          },
        });

        results.push(`[CREATE] ${item.name} (slug: ${finalSlug})`);
        created++;
      }
    }

    // Final counts
    const totalAttractions = await prisma.establishment.count({
      where: { type: 'ATTRACTION', isActive: true, moderationStatus: 'approved' },
    });
    const featuredCount = await prisma.establishment.count({
      where: { type: 'ATTRACTION', isFeatured: true },
    });

    return NextResponse.json({
      success: true,
      message: `${created} créées, ${updated} enrichies. Total: ${totalAttractions} attractions (${featuredCount} incontournables)`,
      created,
      updated,
      totalAttractions,
      featuredCount,
      details: results,
    });
  } catch (error: unknown) {
    logger.error('Error seeding fiches v2:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
