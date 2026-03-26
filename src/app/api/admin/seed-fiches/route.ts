import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const A = '/images/Attractions';

// ================================================================
// 45 FICHES TOURISTIQUES — données extraites du PDF officiel
// GPS vérifié via Google Places, tarifs MNP/MTA officiels
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
  // For matching existing slugs in DB
  existingSlugs?: string[];
}

const FICHES: FicheData[] = [
  // ============================
  // FICHE 01 — Allée des Baobabs (UPDATE)
  // ============================
  {
    name: 'Allée des Baobabs',
    slug: 'allee-des-baobabs',
    existingSlugs: ['allee-des-baobabs', 'allee-des-baobabs-morondava'],
    description: `L'Allée des Baobabs est sans doute le site le plus photographié de Madagascar. Cette rangée spectaculaire de baobabs Grandidier (Adansonia grandidieri) borde une piste de terre rouge entre Morondava et Belo-sur-Tsiribihina. Ces arbres majestueux, certains vieux de plus de 800 ans, atteignent 30 mètres de haut.

Au coucher du soleil, c'est absolument magique : les silhouettes des baobabs se découpent en un spectacle inoubliable. Classé monument naturel, le site est un symbole de Madagascar reconnu dans le monde entier.

Non loin, les "Baobabs Amoureux" — deux arbres entrelacés — sont devenus un symbole romantique. La région abrite également le "Baobab Sacré", un arbre géant vénéré par les locaux.`,
    shortDescription: 'Avenue mythique de baobabs millénaires — Le coucher de soleil le plus photographié de Madagascar.',
    city: 'Morondava',
    region: 'Menabe',
    attractionType: 'monument_naturel',
    isFree: false,
    entryFeeLocal: 2000,
    entryFeeForeign: 10000,
    visitDuration: '1-2 heures',
    bestTimeToVisit: 'Coucher de soleil (17h-18h)',
    highlights: ['Baobabs Grandidier de 800 ans', 'Coucher de soleil spectaculaire', 'Piste de terre rouge', 'Photographie unique de Madagascar'],
    rating: 4.7,
    reviewCount: 361,
    isFeatured: true,
    latitude: -20.2505,
    longitude: 44.4197,
    coverImage: `${A}/baobabs/allee-des-baobabs.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 02 — Parc National de l'Isalo (UPDATE)
  // ============================
  {
    name: "Parc National de l'Isalo",
    slug: 'parc-national-isalo',
    existingSlugs: ['parc-national-isalo'],
    description: `Surnommé le "Colorado Malgache", l'Isalo est un sanctuaire de grès jurassique sculpté par l'érosion sur des millénaires. Ce massif ruiniforme offre un spectacle saisissant de canyons profonds, d'oasis verdoyantes et de plaines à perte de vue.

Entre ses piscines naturelles d'eau turquoise et sa faune endémique — notamment les lémuriens Catta et les Sifakas —, c'est une étape incontournable de la RN7. Classé parc national depuis 1962, il représente l'âme sauvage du sud de Madagascar.

La Fenêtre de l'Isalo est le spot incontournable au coucher du soleil : cette arche naturelle encadre le disque solaire à l'horizon, créant une photo emblématique.`,
    shortDescription: 'Le "Colorado Malgache" — Canyons, piscines naturelles turquoise et lémuriens catta.',
    city: 'Ranohira',
    region: 'Ihorombe',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '1 jour',
    bestTimeToVisit: 'Avril à novembre / Coucher de soleil à la "Fenêtre" (17h15-18h00)',
    highlights: ['Piscine Naturelle (Oasis turquoise)', 'Canyon des Singes (Lémuriens Catta)', 'La Fenêtre de l\'Isalo (Coucher du soleil)', 'Massifs ruiniformes (Formations géologiques)'],
    rating: 4.6,
    reviewCount: 471,
    isFeatured: true,
    latitude: -22.4656,
    longitude: 45.2618,
    coverImage: `${A}/isalo/Piscine Naturelle Isalo-144.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: false,
  },

  // ============================
  // FICHE 03 — Tsingy de Bemaraha (UPDATE)
  // ============================
  {
    name: 'Tsingy de Bemaraha',
    slug: 'tsingy-de-bemaraha',
    existingSlugs: ['tsingy-de-bemaraha'],
    description: `Classé au Patrimoine Mondial de l'UNESCO depuis 1990, le Parc National des Tsingy de Bemaraha est un labyrinthe spectaculaire de pointes calcaires acérées formées il y a 200 millions d'années. Le mot "Tsingy" signifie en malgache "là où l'on ne peut marcher pieds nus".

Entre les ponts suspendus vertigineux, les grottes profondes et les forêts sèches abritant 11 espèces de lémuriens, ce site offre l'une des expériences d'aventure les plus intenses de Madagascar. La descente en pirogue de la rivière Manambolo complète cette aventure inoubliable.

Les Grands Tsingy présentent des pitons atteignant 45 mètres de hauteur, tandis que les Petits Tsingy sont plus accessibles.`,
    shortDescription: 'Cathédrale de calcaire UNESCO — Forêt de pierre, ponts suspendus et via ferrata.',
    city: 'Bekopaka',
    region: 'Melaky',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Avril à novembre (saison sèche uniquement — fermé en saison des pluies)',
    highlights: ['Forêt de pierre calcaire (Tsingy)', 'Ponts suspendus et via ferrata', 'Descente de la rivière Manambolo', 'Grottes et faune endémique'],
    rating: 4.7,
    reviewCount: 237,
    isFeatured: true,
    latitude: -18.9200,
    longitude: 44.7944,
    coverImage: `${A}/bemaraha/bemaraha.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: false,
  },

  // ============================
  // FICHE 04 — Ranomafana (UPDATE)
  // ============================
  {
    name: 'Parc National de Ranomafana',
    slug: 'parc-national-ranomafana',
    existingSlugs: ['parc-national-ranomafana'],
    description: `Le Parc National de Ranomafana est un joyau de biodiversité niché dans une forêt tropicale humide dense et luxuriante. Créé en 1991 suite à la découverte de l'Hapalémur doré — une espèce de lémurien que l'on croyait éteinte —, ce parc abrite 12 espèces de lémuriens, plus de 100 espèces d'oiseaux et une flore extraordinaire.

Le village voisin offre des sources thermales naturelles où les visiteurs peuvent se détendre après une randonnée en forêt. Les orchidées sauvages rares et les cascades en forêt tropicale complètent la magie du lieu.

Les visites nocturnes (19h-21h) révèlent un monde fascinant de microfaune invisible le jour.`,
    shortDescription: 'Forêt tropicale UNESCO — Lémurien bambou doré et sources thermales naturelles.',
    city: 'Ranomafana',
    region: 'Vatovavy-Fitovinany',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '1 jour',
    bestTimeToVisit: 'Avril à novembre / Matin (6h-10h pour les lémuriens)',
    highlights: ['Hapalémur doré (Lémurien rare)', 'Sources thermales naturelles', 'Orchidées et fougères arborescentes', 'Cascades en forêt tropicale'],
    rating: 4.5,
    reviewCount: 420,
    isFeatured: true,
    latitude: -21.2641,
    longitude: 47.4193,
    coverImage: `${A}/ranomafana/parc-ranomafana.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: false,
  },

  // ============================
  // FICHE 05 — Réserve d'Anja (UPDATE)
  // ============================
  {
    name: "Réserve d'Anja",
    slug: 'reserve-anja',
    existingSlugs: ['reserve-anja'],
    description: `La Réserve d'Anja est un modèle de conservation communautaire à Madagascar. Gérée entièrement par les habitants du village d'Anja, cette réserve de 30 hectares abrite environ 300 lémuriens Catta particulièrement habitués à la présence humaine.

Le décor est saisissant : d'immenses dômes de granit dominent une forêt sèche parsemée de cactus et d'aloès. Située juste au bord de la RN7, c'est un arrêt facile et abordable entre Fianarantsoa et le Parc de l'Isalo.

Les revenus du tourisme bénéficient directement aux 1 800 habitants des villages environnants, finançant écoles et dispensaires.`,
    shortDescription: 'Écotourisme communautaire — 300 lémuriens catta et dômes de granit panoramiques.',
    city: 'Ambalavao',
    region: 'Haute Matsiatra',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 5000,
    entryFeeForeign: 20000,
    visitDuration: '1-2 heures',
    bestTimeToVisit: 'Toute l\'année / Matin (7h-10h pour les lémuriens)',
    highlights: ['Colonies de lémuriens Catta (approche facile)', 'Dômes de granit panoramiques', 'Grottes sacrées', 'Flore endémique (Aloès, Pachypodium)'],
    rating: 4.6,
    reviewCount: 341,
    isFeatured: true,
    latitude: -21.8510,
    longitude: 46.8419,
    coverImage: `${A}/faune-flore/Faune de Madagascar-12.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 06 — Andasibe-Mantadia (UPDATE)
  // ============================
  {
    name: "Parc National d'Andasibe-Mantadia",
    slug: 'parc-national-andasibe',
    existingSlugs: ['parc-national-andasibe'],
    description: `Le Parc National d'Andasibe-Mantadia est le sanctuaire de l'Indri-Indri, le plus grand lémurien vivant, célèbre pour son chant puissant et mélodieux qui résonne à travers la canopée chaque matin. Situé à seulement 3 heures de route de la capitale, c'est le parc le plus accessible de Madagascar.

La forêt tropicale humide abrite 14 espèces de lémuriens, des caméléons colorés, des grenouilles endémiques et une impressionnante diversité d'orchidées.

Les visites nocturnes permettent de découvrir un monde fascinant de microfaune invisible le jour : lémuriens nocturnes, caméléons endormis et grenouilles multicolores.`,
    shortDescription: 'Royaume de l\'Indri-Indri — Son chant matinal légendaire et forêt d\'orchidées.',
    city: 'Andasibe',
    region: 'Alaotra-Mangoro',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '1 jour',
    bestTimeToVisit: 'Toute l\'année / Matin (7h-9h pour le chant des Indri) et nocturne (19h-21h)',
    highlights: ['Indri-Indri (Chant matinal emblématique)', 'Visite nocturne de la faune', 'Orchidées et forêt de mousse', 'Caméléons et grenouilles endémiques'],
    rating: 4.5,
    reviewCount: 260,
    isFeatured: false,
    latitude: -18.8350,
    longitude: 48.4587,
    coverImage: `${A}/andasibe/Andasibe et les Gidro-312.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 07 — Parc National de l'Ankarana (UPDATE)
  // ============================
  {
    name: 'Réserve Spéciale Ankarana',
    slug: 'reserve-ankarana',
    existingSlugs: ['reserve-ankarana-diego-suarez'],
    description: `Le Parc National de l'Ankarana est une forteresse calcaire spectaculaire abritant un réseau souterrain de grottes et de rivières parmi les plus impressionnants de l'océan Indien. Ce massif karstique de 18 225 hectares renferme des Tsingy spectaculaires, des forêts denses et des lacs souterrains.

La faune y est remarquable avec 11 espèces de lémuriens, des crocodiles dans les grottes, et l'une des plus grandes colonies de chauves-souris de Madagascar. Les ponts de singe naturels et les points de vue vertigineux en font une aventure mémorable.

Les piscines naturelles cachées dans les canyons offrent une baignade cristalline après la traversée des formations acérées.`,
    shortDescription: 'Forteresse calcaire — Grottes souterraines, tsingy et lémuriens couronnés.',
    city: 'Mahamasina',
    region: 'Diana',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '1 jour',
    bestTimeToVisit: 'Mai à novembre (saison sèche) / Matin (7h-11h)',
    highlights: ['Grottes aux chauves-souris', 'Tsingy du Nord (Ponts de singe)', 'Piscines naturelles cristallines', 'Forêt dense et lémuriens couronnés'],
    rating: 4.4,
    reviewCount: 131,
    isFeatured: false,
    latitude: -12.8955,
    longitude: 49.1424,
    coverImage: `${A}/ankarana/Tsingy Ankarana.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: false,
  },

  // ============================
  // FICHE 08 — Tsingy Rouges (UPDATE)
  // ============================
  {
    name: 'Les Tsingy Rouge',
    slug: 'tsingy-rouge',
    existingSlugs: ['tsingy-rouge-diego-suarez'],
    description: `Les Tsingy Rouges sont des formations géologiques uniques au monde, sculptées par l'érosion dans un mélange de grès, de marne et de latérite. Contrairement aux Tsingy gris calcaires de Bemaraha, ces pinacles arborent des teintes allant du rouge vif à l'ocre doré, créant un paysage quasi extraterrestre.

Relativement récentes à l'échelle géologique et en évolution constante, ces formations changent d'aspect selon la lumière du jour. Situées à environ 1h30 de route de Diego-Suarez, elles constituent une excursion spectaculaire.

Au coucher du soleil, les contrastes de couleurs sont saisissants, offrant des opportunités photographiques surréalistes.`,
    shortDescription: 'Formations extraterrestres — Pinacles de latérite rouge et panoramas surréalistes.',
    city: 'Antsiranana',
    region: 'Diana',
    attractionType: 'viewpoint',
    isFree: false,
    entryFeeLocal: 5000,
    entryFeeForeign: 15000,
    visitDuration: '1-2 heures',
    bestTimeToVisit: 'Mai à novembre / Fin d\'après-midi (15h-17h pour les meilleures lumières)',
    highlights: ['Pinacles de latérite rouge (Formations uniques)', 'Contrastes au coucher du soleil', 'Panorama sur la vallée de l\'Irodo', 'Photographie surréaliste'],
    rating: 4.7,
    reviewCount: 158,
    isFeatured: false,
    latitude: -12.6357,
    longitude: 49.4936,
    coverImage: `${A}/tsingy-rouge/Tsingy rouge-462.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 09 — Nosy Be (UPDATE)
  // ============================
  {
    name: 'Nosy Be',
    slug: 'nosy-be',
    existingSlugs: ['nosy-be'],
    description: `Nosy Be est la destination balnéaire phare de Madagascar, surnommée "l'île aux Parfums" grâce à ses plantations d'ylang-ylang, de vanille et de cacao qui embaument l'air tropical. Cette île volcanique de 320 km² offre des plages de sable blanc bordées d'eaux turquoise.

La plongée sous-marine y est exceptionnelle, avec des récifs coralliens préservés, des tortues marines et, d'octobre à décembre, la possibilité de nager avec les requins-baleines. Le festival Somaroho anime l'île chaque année.

L'archipel paradisiaque — Nosy Iranja, Nosy Tanikely, Nosy Komba — constitue la porte d'entrée d'un monde tropical incomparable.`,
    shortDescription: 'L\'île aux Parfums — Plages de sable blanc, plongée et requins-baleines.',
    city: 'Hell-Ville',
    region: 'Diana',
    attractionType: 'ile',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '3-5 jours',
    bestTimeToVisit: 'Avril à décembre (saison sèche et requins-baleines oct-déc)',
    highlights: ['Plages de sable blanc (Andilana, Ambatoloaka)', 'Archipel paradisiaque (Nosy Iranja, Tanikely)', 'Plongée et snorkeling', 'Plantations d\'ylang-ylang et marché d\'Hell-Ville'],
    rating: 4.5,
    reviewCount: 1874,
    isFeatured: true,
    latitude: -13.3971,
    longitude: 48.2667,
    coverImage: `${A}/nosy-be/Nosy Be, Madagascar-201.jpg`,
    hasGuide: false,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 10 — Île Sainte-Marie (NEW)
  // ============================
  {
    name: 'Île Sainte-Marie',
    slug: 'ile-sainte-marie',
    description: `Ancien repaire de pirates au XVIIe siècle, l'île Sainte-Marie est un trésor de charme authentique et de tranquillité. Cette île étroite de 60 km de long abrite des cocoteraies à perte de vue, des plages secrètes et la baie d'Ampanihy, l'un des plus beaux mouillages de l'océan Indien.

De juillet à septembre, les baleines à bosse viennent s'y reproduire et offrir un spectacle grandiose depuis la côte. Le cimetière des pirates, l'un des rares vestiges historiques de la piraterie dans l'océan Indien, est un lieu chargé d'histoire et de légendes.

L'Île aux Nattes, accessible en pirogue depuis la pointe sud, est un bijou de tranquillité tropicale.`,
    shortDescription: 'Sanctuaire des baleines à bosse — Île de pirates, plages secrètes et cocoteraies.',
    city: 'Ambodifotatra',
    region: 'Analanjirofo',
    attractionType: 'ile',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '3-5 jours',
    bestTimeToVisit: 'Juillet à septembre (baleines) / Avril à décembre (climat)',
    highlights: ['Observation des baleines (Juillet-Septembre)', 'Cimetière des pirates (Site historique)', 'Baie d\'Ampanihy', 'Île aux Nattes (Paradis tropical)'],
    rating: 4.6,
    reviewCount: 218,
    isFeatured: false,
    latitude: -16.8944,
    longitude: 49.9059,
    coverImage: `${A}/sainte-marie/ile-sainte-marie.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: true,
  },

  // ============================
  // FICHE 11 — Baie de Diego-Suarez (UPDATE)
  // ============================
  {
    name: 'Baie de Diego-Suarez',
    slug: 'baie-diego-suarez',
    existingSlugs: ['baie-diego-suarez'],
    description: `La Baie de Diego-Suarez est la deuxième plus grande baie naturelle au monde après celle de Rio de Janeiro. Ce vaste amphithéâtre maritime offre des paysages d'une diversité remarquable : la Mer d'Émeraude, un lagon d'une beauté irréelle aux eaux cristallines posé sur un banc de sable blanc.

Le Pain de Sucre — un piton rocheux emblématique — et les plages sauvages de Ramena complètent le décor. La baie est un spot de renommée mondiale pour le kitesurf grâce au vent "Varatraza" qui souffle de mai à novembre.

Diego-Suarez elle-même séduit par son architecture coloniale et sa douceur de vivre.`,
    shortDescription: 'La 2ème plus grande baie du monde — Mer d\'Émeraude, kitesurf et architecture coloniale.',
    city: 'Antsiranana',
    region: 'Diana',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Mai à novembre (vent idéal pour kitesurf, saison sèche)',
    highlights: ['Mer d\'Émeraude (Lagon cristallin)', 'Pain de Sucre (Piton emblématique)', 'Kitesurf et sports de vent', 'Plage de Ramena et architecture coloniale'],
    rating: 4.7,
    reviewCount: 528,
    isFeatured: true,
    latitude: -12.2306,
    longitude: 49.2928,
    coverImage: `${A}/diego-suarez/003A8246-440.jpg`,
    hasGuide: false,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 12 — Foulpointe (NEW)
  // ============================
  {
    name: 'Foulpointe',
    slug: 'foulpointe',
    description: `Foulpointe, ou Mahavelona en malgache, est la station balnéaire la plus prisée de la côte Est de Madagascar. Son atout majeur est son lagon protégé par une barrière de corail naturelle qui crée des eaux calmes et chaudes idéales pour la baignade en famille.

Le Fort Manda, construction fortifiée du XIXe siècle érigée sous le règne de Radama Ier, témoigne de l'histoire militaire de la région. Le marché aux fruits de mer frais et les gargotes de plage proposant du crabe grillé et des langoustes font le bonheur des gourmands.

Située à seulement 56 km au nord de Toamasina, c'est une escapade balnéaire accessible et prisée des familles.`,
    shortDescription: 'Station balnéaire de la côte Est — Lagon protégé, Fort Manda et fruits de mer.',
    city: 'Mahavelona',
    region: 'Atsinanana',
    attractionType: 'plage',
    isFree: true,
    entryFeeLocal: 2000,
    entryFeeForeign: 10000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Juin à octobre (saison sèche côte Est)',
    highlights: ['Lagon calme protégé par le récif', 'Fort Manda (Monument historique)', 'Dégustation de fruits de mer frais', 'Plages de sable et cocotiers'],
    rating: 4.3,
    reviewCount: 385,
    isFeatured: false,
    latitude: -17.6814,
    longitude: 49.5140,
    coverImage: null, // pas d'image locale → dossier vide
    hasGuide: false,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 13 — Anakao (UPDATE)
  // ============================
  {
    name: 'Anakao et Nosy Ve',
    slug: 'anakao-nosy-ve',
    existingSlugs: ['anakao-nosy-ve-tulear'],
    description: `Anakao est un authentique village de pêcheurs Vezo niché sur le littoral sud-ouest de Madagascar, à l'abri du Grand Récif de Tuléar. Ce havre de paix offre des kilomètres de plages vierges bordées d'une mer turquoise d'un calme parfait.

La sortie en pirogue à balancier traditionnelle Vezo vers l'île de Nosy Ve — sanctuaire d'oiseaux paille-en-queue (Phaétons) — est une expérience unique. L'absence de route goudronnée et la simplicité de la vie locale confèrent à Anakao un caractère préservé et un dépaysement total.

Le snorkeling sur le Grand Récif révèle un monde sous-marin d'une richesse exceptionnelle.`,
    shortDescription: 'Village Vezo authentique — Plages vierges, pirogues et sanctuaire d\'oiseaux de Nosy Ve.',
    city: 'Anakao',
    region: 'Atsimo-Andrefana',
    attractionType: 'plage',
    isFree: true,
    entryFeeLocal: 10000,
    entryFeeForeign: 25000,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Avril à novembre (mer calme, saison sèche)',
    highlights: ['Île de Nosy Ve (Oiseaux Paille-en-queue)', 'Plages vierges infinies', 'Pirogue à balancier Vezo', 'Snorkeling sur le Grand Récif'],
    rating: 4.6,
    reviewCount: 276,
    isFeatured: false,
    latitude: -23.6643,
    longitude: 43.6483,
    coverImage: `${A}/paysages/Plage, Madagascar-202.jpg`,
    hasGuide: false,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 14 — Antananarivo (UPDATE)
  // ============================
  {
    name: 'Antananarivo',
    slug: 'antananarivo',
    existingSlugs: ['antananarivo'],
    description: `Antananarivo, la capitale de Madagascar, est une ville fascinante bâtie sur 12 collines sacrées à 1 300 mètres d'altitude. Dominée par le Rova — l'ancien Palais de la Reine en cours de reconstruction après l'incendie de 1995 —, la ville offre un panorama unique de maisons en briques rouge s'étirant sur les collines.

Le marché animé d'Analakely, les escaliers centenaires et la Colline Royale d'Ambohimanga (Patrimoine UNESCO), ancienne résidence des souverains Merina, racontent l'histoire riche d'un royaume millénaire.

C'est le point de départ de toutes les aventures malgaches, carrefour où convergent culture, histoire et modernité.`,
    shortDescription: 'La capitale sur 12 collines sacrées — Palais de la Reine, Ambohimanga UNESCO et marchés.',
    city: 'Antananarivo',
    region: 'Analamanga',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 5000,
    entryFeeForeign: 20000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Avril à octobre (saison sèche et fraîche)',
    highlights: ['Le Rova — Palais de la Reine', 'Colline Royale d\'Ambohimanga (UNESCO)', 'Marché d\'Analakely', 'Lac Anosy et Haute-Ville historique'],
    rating: 4.2,
    reviewCount: 1456,
    isFeatured: true,
    latitude: -18.9237,
    longitude: 47.5321,
    coverImage: `${A}/antananarivo/antananarivo.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 15 — Antsirabe (NEW)
  // ============================
  {
    name: 'Antsirabe',
    slug: 'antsirabe',
    description: `Antsirabe, dont le nom signifie "là où il y a beaucoup de sel", est une charmante ville thermale perchée à 1 500 mètres d'altitude. Fondée par des missionnaires norvégiens à la fin du XIXe siècle, elle conserve une architecture coloniale élégante et une atmosphère unique marquée par le cliquetis de ses célèbres pousse-pousse colorés.

Les lacs volcaniques environnants, dont le mystérieux Lac Tritriva, et les ateliers d'artisanat de la corne de zébu en font une halte culturelle incontournable sur la RN7.

L'Hôtel des Thermes, héritage colonial, et les sources thermales rappellent le surnom de "Vichy malgache" de cette ville attachante.`,
    shortDescription: 'La Vichy malgache — Pousse-pousse colorés, lacs volcaniques et artisanat de la corne.',
    city: 'Antsirabe',
    region: 'Vakinankaratra',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 10000,
    visitDuration: '1 jour',
    bestTimeToVisit: 'Avril à novembre (saison sèche)',
    highlights: ['Tours en pousse-pousse colorés', 'Lacs volcaniques (Tritriva, Andraikiba)', 'Artisanat de la corne de zébu', 'Hôtel des Thermes (Architecture coloniale)'],
    rating: 4.4,
    reviewCount: 367,
    isFeatured: false,
    latitude: -19.8649,
    longitude: 47.0383,
    coverImage: `${A}/antsirabe/antsirabe.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 16 — Ambositra (UPDATE)
  // ============================
  {
    name: 'Ambositra et villages Zafimaniry',
    slug: 'ambositra-zafimaniry',
    existingSlugs: ['ambositra-zafimaniry'],
    description: `Ambositra est reconnue comme la capitale de l'artisanat du bois à Madagascar. Cette petite ville des Hautes Terres est le berceau de la tradition de marqueterie et de sculpture sur bois, héritée du peuple Zafimaniry dont le savoir-faire est inscrit au Patrimoine Immatériel de l'UNESCO.

Les boutiques et ateliers bordant la rue principale regorgent de coffres sculptés, de figurines et de marqueteries aux motifs géométriques sophistiqués.

C'est l'étape idéale pour rapporter un souvenir authentique et fait main de Madagascar, tout en admirant les rizières en terrasses environnantes.`,
    shortDescription: 'Capitale de l\'artisanat du bois — Marqueterie Zafimaniry UNESCO et sculptures.',
    city: 'Ambositra',
    region: "Amoron'i Mania",
    attractionType: 'culture',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '2-3 heures',
    bestTimeToVisit: 'Toute l\'année',
    highlights: ['Ateliers de marqueterie et sculpture', 'Art Zafimaniry (UNESCO)', 'Marché artisanal de la rue principale', 'Paysages de rizières en terrasses'],
    rating: 4.3,
    reviewCount: 254,
    isFeatured: false,
    latitude: -20.5309,
    longitude: 47.2429,
    coverImage: `${A}/ambositra/Sculpture zafimaniry ambositra-339.jpg`,
    hasGuide: false,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 17 — Belo sur Mer (UPDATE)
  // ============================
  {
    name: 'Belo sur Mer',
    slug: 'belo-sur-mer',
    existingSlugs: ['belo-sur-mer'],
    description: `Belo sur Mer est un village côtier isolé et authentique, célèbre pour ses chantiers navals traditionnels où les artisans construisent des boutres et des goélettes à la main, sans plan ni machine, selon un savoir-faire transmis de génération en génération.

Le spectacle de ces navires en bois prenant forme sur la plage est saisissant. Le village est également entouré de salines artisanales et de mangroves riches en biodiversité.

C'est un témoignage vivant de la culture maritime Vezo, accessible uniquement par piste 4x4 depuis Morondava.`,
    shortDescription: 'Village côtier isolé — Chantiers navals artisanaux, goélettes et salines Vezo.',
    city: 'Belo sur Mer',
    region: 'Menabe',
    attractionType: 'culture',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1 jour',
    bestTimeToVisit: 'Mai à octobre (saison sèche)',
    highlights: ['Chantiers navals artisanaux (Boutres et goélettes)', 'Salines traditionnelles', 'Mangroves et biodiversité marine', 'Vie quotidienne du village Vezo'],
    rating: 4.4,
    reviewCount: 156,
    isFeatured: true,
    latitude: -20.7312,
    longitude: 44.0056,
    coverImage: `${A}/paysages/Mer-425.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 18 — Ampefy & Région Itasy (NEW)
  // ============================
  {
    name: 'Ampefy et Région Itasy',
    slug: 'ampefy-itasy',
    description: `La région Itasy, avec Ampefy comme ville principale, est une zone volcanique fertile surnommée le "jardin de la capitale". Le paysage est marqué par des lacs de cratère, des geysers et une végétation luxuriante.

Les Chutes de la Lily, les plus hautes cascades de la région, offrent un spectacle impressionnant, tandis que les geysers d'Andranomandroatra rappellent l'activité volcanique endormie de la zone.

La région est également connue pour son artisanat de la soie et la douceur de son climat, à environ 2h de route de Tana.`,
    shortDescription: 'Le jardin de la capitale — Chutes de la Lily, geysers et lacs volcaniques.',
    city: 'Ampefy',
    region: 'Itasy',
    attractionType: 'nature',
    isFree: false,
    entryFeeLocal: 2000,
    entryFeeForeign: 10000,
    visitDuration: '1 jour',
    bestTimeToVisit: 'Avril à octobre / Matin (cascades plus impressionnantes en saison humide)',
    highlights: ['Chutes de la Lily (Cascades spectaculaires)', 'Geysers d\'Andranomandroatra', 'Lac Itasy (Lac volcanique)', 'Artisanat de la soie'],
    rating: 4.1,
    reviewCount: 176,
    isFeatured: false,
    latitude: -19.0317,
    longitude: 46.6848,
    coverImage: null,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 19 — La Route Nationale 7 (NEW)
  // ============================
  {
    name: 'La Route Nationale 7 (RN7)',
    slug: 'route-nationale-7',
    description: `La RN7 est la route mythique de Madagascar, reliant la capitale Antananarivo à Toliara dans le sud sur environ 950 km. C'est un condensé extraordinaire de tout ce que l'île a à offrir : rizières en terrasses des Hautes Terres, savanes dorées du sud, marchés colorés et villages authentiques.

En chemin, elle traverse les villes d'Antsirabe, Ambositra, Fianarantsoa et Ambalavao, et donne accès aux parcs nationaux de Ranomafana, de l'Isalo et à la Réserve d'Anja.

C'est le road trip ultime pour découvrir Madagascar, recommandé sur 5 à 7 jours avec un chauffeur-guide.`,
    shortDescription: 'Le road trip ultime — 950 km de rizières, parcs nationaux et villages authentiques.',
    city: 'Antananarivo',
    region: 'Multi-régions',
    attractionType: 'nature',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '5-7 jours (road trip complet)',
    bestTimeToVisit: 'Avril à novembre (saison sèche)',
    highlights: ['Rizières en terrasses (Hautes Terres)', 'Parcs nationaux en enfilade (Ranomafana, Isalo)', 'Marchés locaux et villages authentiques', 'Diversité des paysages (montagne → savane → désert)'],
    rating: 4.8,
    reviewCount: 1102,
    isFeatured: false,
    latitude: -18.9237,
    longitude: 47.5321,
    coverImage: `${A}/isalo/route nationale 7 Isalo.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 20 — Canal des Pangalanes (UPDATE)
  // ============================
  {
    name: 'Canal des Pangalanes',
    slug: 'canal-des-pangalanes',
    existingSlugs: ['canal-des-pangalanes'],
    description: `Le Canal des Pangalanes est une voie navigable intérieure de plus de 600 km longeant la côte Est de Madagascar. Construit à l'époque coloniale française pour relier les lagunes naturelles, ce canal traverse des paysages de mangroves, de palmiers ravenala et de villages de pêcheurs isolés.

La croisière en chaland ou en pirogue motorisée est une immersion totale dans la vie quotidienne des communautés côtières Betsimisaraka. Le rythme lent de la navigation et l'absence de route font de cette expérience un voyage hors du temps.

C'est la Madagascar authentique, loin des circuits touristiques classiques.`,
    shortDescription: '600 km de voie navigable — Croisière parmi les villages de pêcheurs et mangroves.',
    city: 'Toamasina',
    region: 'Atsinanana',
    attractionType: 'nature',
    isFree: false,
    entryFeeLocal: 50000,
    entryFeeForeign: 400000,
    visitDuration: '2-5 jours',
    bestTimeToVisit: 'Mai à octobre (eaux calmes et saison sèche)',
    highlights: ['Croisière en chaland ou pirogue', 'Villages de pêcheurs isolés', 'Mangroves et ravenala', 'Immersion culturelle Betsimisaraka'],
    rating: 4.6,
    reviewCount: 287,
    isFeatured: false,
    latitude: -18.6053,
    longitude: 49.2405,
    coverImage: `${A}/pangalanes/canal-pangalanes.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 21 — Descente du fleuve Tsiribihina (UPDATE)
  // ============================
  {
    name: 'Descente du fleuve Tsiribihina',
    slug: 'descente-tsiribihina',
    existingSlugs: ['descente-tsiribihina'],
    description: `La descente du fleuve Tsiribihina est l'une des aventures les plus emblématiques de Madagascar. Cette expédition de 3 jours en chaland ou en pirogue motorisée traverse le cœur sauvage de l'île, entre gorges imposantes, falaises de grès rouge et forêts-galeries.

Les bivouacs sauvages sur les berges de sable offrent des nuits étoilées inoubliables. En chemin, vous observerez des crocodiles, des lémuriens, des oiseaux rares et vous vous baignerez au pied de cascades cachées.

C'est la porte d'entrée naturelle vers les Tsingy de Bemaraha.`,
    shortDescription: 'Aventure fluviale de 3 jours — Bivouac sous les étoiles, gorges et cascades.',
    city: 'Miandrivazo',
    region: 'Menabe',
    attractionType: 'nature',
    isFree: false,
    entryFeeLocal: 200000,
    entryFeeForeign: 500000,
    visitDuration: '3 jours',
    bestTimeToVisit: 'Mai à octobre (saison sèche, niveau d\'eau idéal)',
    highlights: ['Bivouac sauvage sous les étoiles', 'Cascades cachées (baignade)', 'Observation de crocodiles et lémuriens', 'Gorges et falaises de grès rouge'],
    rating: 4.7,
    reviewCount: 345,
    isFeatured: true,
    latitude: -19.5438,
    longitude: 45.4499,
    coverImage: `${A}/pangalanes/canal-pangalanes.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 22 — Réserve de Lokobe (UPDATE)
  // ============================
  {
    name: 'Réserve de Lokobe',
    slug: 'reserve-lokobe',
    existingSlugs: ['reserve-lokobe-nosy-be'],
    description: `La Réserve de Lokobe est la dernière parcelle de forêt primaire de Nosy Be, accessible uniquement par pirogue traditionnelle depuis le village d'Ambatozavavy. Cette forêt dense de Sambirano abrite le lémurien noir endémique de Nosy Be (Eulemur macaco).

On y trouve aussi des caméléons parmi les plus minuscules du monde (Brookesia) et le Boa de Madagascar. L'approche en pirogue à travers les mangroves est déjà une aventure en soi.

C'est une excursion indispensable pour les amoureux de nature en séjour à Nosy Be.`,
    shortDescription: 'Dernière forêt primaire de Nosy Be — Lémurien noir et caméléons miniatures.',
    city: 'Nosy Be',
    region: 'Diana',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 45000,
    visitDuration: '3-4 heures',
    bestTimeToVisit: 'Avril à novembre / Matin (8h-11h pour l\'observation)',
    highlights: ['Lémurien noir de Nosy Be', 'Caméléons miniatures (Brookesia)', 'Approche en pirogue dans les mangroves', 'Forêt primaire tropicale'],
    rating: 4.5,
    reviewCount: 99,
    isFeatured: false,
    latitude: -13.3894,
    longitude: 48.3409,
    coverImage: `${A}/faune-flore/Gidro.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 23 — Routes de l'Artisanat RN1 (NEW)
  // ============================
  {
    name: "Les Routes de l'Artisanat (RN1)",
    slug: 'routes-artisanat-rn1',
    description: `La Route de l'Artisanat sur la RN1 est un itinéraire promu par le Ministère du Tourisme de Madagascar pour valoriser le savoir-faire artisanal local. En suivant cette route vers l'Ouest depuis Antananarivo, les voyageurs découvrent des villages spécialisés.

La poterie d'Ambohimanambola, la vannerie traditionnelle, le tissage de soie sauvage et la fabrication d'instruments de musique traditionnels se côtoient le long du parcours. Chaque village a sa spécialité et ses artisans ouvrent leurs ateliers aux visiteurs.

C'est une plongée authentique dans les traditions séculaires des Hautes Terres malgaches.`,
    shortDescription: 'Itinéraire artisanal officiel — Poterie, vannerie, soie sauvage et artisans.',
    city: 'Antananarivo',
    region: 'Analamanga',
    attractionType: 'culture',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Toute l\'année',
    highlights: ['Ateliers de potiers (Ambohimanambola)', 'Vannerie traditionnelle', 'Tissage de soie sauvage', 'Rencontres avec les artisans'],
    rating: 4.2,
    reviewCount: 134,
    isFeatured: false,
    latitude: -18.9237,
    longitude: 47.5321,
    coverImage: `${A}/culture/Sculpture Malagasy-334.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 24 — Massif du Makay (UPDATE)
  // ============================
  {
    name: 'Aire protégée du Makay',
    slug: 'aire-protegee-makay',
    existingSlugs: ['aire-protegee-makay'],
    description: `Le Massif du Makay est un véritable "monde perdu", l'un des derniers sanctuaires inexplorés de la planète. Ce labyrinthe de canyons profonds creusés dans le grès abrite des forêts vierges, des rivières souterraines et une biodiversité encore largement méconnue des scientifiques.

L'explorateur français Evrard Wendenbaum a contribué à faire connaître ce site depuis 2007. C'est une expédition en autonomie totale — trekking et bivouac — réservée aux vrais aventuriers en quête de l'endroit le plus sauvage et préservé de Madagascar.

L'accès est difficile : aucune infrastructure, 4x4 puis marche uniquement.`,
    shortDescription: 'Le "monde perdu" — Canyons labyrinthiques, forêts vierges et expédition extrême.',
    city: 'Beroroha',
    region: 'Atsimo-Andrefana',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 200000,
    entryFeeForeign: 3000000,
    visitDuration: '5-10 jours (expédition)',
    bestTimeToVisit: 'Mai à octobre (saison sèche impérative)',
    highlights: ['Canyons labyrinthiques (Monde perdu)', 'Forêts vierges inexplorées', 'Bivouac en autonomie totale', 'Biodiversité unique et méconnue'],
    rating: 4.9,
    reviewCount: 87,
    isFeatured: true,
    latitude: -21.3778,
    longitude: 45.1281,
    coverImage: `${A}/divers/massif-andringitra.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 25 — Vallée de Tsaranoro (NEW)
  // ============================
  {
    name: 'Les Falaises de Tsaranoro',
    slug: 'falaises-tsaranoro',
    description: `La Vallée de Tsaranoro abrite l'une des parois granitiques les plus impressionnantes de l'hémisphère sud : une falaise de 800 mètres de haut qui attire des grimpeurs du monde entier.

Pour les non-grimpeurs, les randonnées au pied des falaises offrent des panoramas spectaculaires sur la vallée verdoyante entourée de massifs montagneux. Le cadre est d'une beauté brute et silencieuse.

Des éco-lodges nichés face à la montagne proposent des réveils magiques avec le soleil se levant derrière le granit. C'est l'un des secrets les mieux gardés de Madagascar.`,
    shortDescription: 'Paroi granitique de 800m — Escalade mondiale, éco-lodges et lever de soleil magique.',
    city: 'Ambalavao',
    region: 'Haute Matsiatra',
    attractionType: 'montagne',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Avril à novembre (saison sèche)',
    highlights: ['Paroi granitique de 800m (Escalade mondiale)', 'Randonnée panoramique', 'Éco-lodges face à la montagne', 'Lever de soleil sur le massif'],
    rating: 4.4,
    reviewCount: 45,
    isFeatured: false,
    latitude: -22.2136,
    longitude: 46.9222,
    coverImage: `${A}/divers/massif-andringitra.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: false,
  },

  // ============================
  // FICHE 26 — Le Moraingy (NEW)
  // ============================
  {
    name: 'Le Moraingy',
    slug: 'moraingy-lutte-malgache',
    description: `Le Moraingy est un sport de combat traditionnel ancestral, véritable institution culturelle dans les régions côtières de Madagascar. Pratiqué principalement par les jeunes hommes Sakalava et Antakarana, ce combat à mains nues mêle techniques de boxe et de lutte.

L'ambiance est électrique : musique live, chants et paris ponctuent les combats qui se tiennent généralement le week-end sur les places des villages.

C'est bien plus qu'un sport : c'est un rite de passage, un spectacle social et une fenêtre exceptionnelle sur la culture malgache vivante.`,
    shortDescription: 'Lutte traditionnelle ancestrale — Combats à mains nues, musique live et rite de passage.',
    city: 'Régions côtières',
    region: 'Diana',
    attractionType: 'culture',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1-2 heures',
    bestTimeToVisit: 'Toute l\'année (week-ends et jours de fête)',
    highlights: ['Combats traditionnels à mains nues', 'Ambiance festive (musique live et paris)', 'Immersion culturelle locale', 'Rite de passage ancestral'],
    rating: 4.5,
    reviewCount: 203,
    isFeatured: false,
    latitude: -12.2765,
    longitude: 49.2917,
    coverImage: null,
    hasGuide: true,
    hasParking: false,
    isAccessible: true,
  },

  // ============================
  // FICHE 27 — Lac Tritriva (UPDATE)
  // ============================
  {
    name: 'Lac Tritriva',
    slug: 'lac-tritriva',
    existingSlugs: ['lac-tritriva-antsirabe'],
    description: `Le Lac Tritriva est un lac de cratère d'un bleu profond et mystérieux, niché au sommet d'un volcan éteint à environ 1 800 mètres d'altitude. Selon la légende locale, deux amoureux maudits se seraient jetés dans ses eaux plutôt que de renoncer à leur amour interdit.

Deux arbres entrelacés au bord du lac symbolisent leur union éternelle. Fait troublant : le niveau de l'eau monte pendant la saison sèche et descend pendant la saison des pluies, défiant toute logique.

Ce phénomène encore inexpliqué renforce l'aura mystique de ce lieu sacré, à 17 km d'Antsirabe.`,
    shortDescription: 'Le joyau sacré — Lac de cratère bleu profond et légende des amoureux maudits.',
    city: 'Antsirabe',
    region: 'Vakinankaratra',
    attractionType: 'nature',
    isFree: false,
    entryFeeLocal: 3000,
    entryFeeForeign: 10000,
    visitDuration: '2-3 heures',
    bestTimeToVisit: 'Toute l\'année / Matin (lumière idéale)',
    highlights: ['Lac de cratère bleu profond', 'Légende des amoureux maudits', 'Randonnée autour du cratère', 'Phénomène hydrologique mystérieux'],
    rating: 4.5,
    reviewCount: 118,
    isFeatured: false,
    latitude: -19.9289,
    longitude: 46.9245,
    coverImage: `${A}/antsirabe/lac tritriva.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 28 — Nosy Mangabe (NEW)
  // ============================
  {
    name: 'Réserve Spéciale de Nosy Mangabe',
    slug: 'nosy-mangabe',
    description: `Nosy Mangabe est une petite île de 520 hectares couverte de forêt tropicale dense, posée dans la baie d'Antongil. C'est le meilleur endroit au monde pour tenter d'apercevoir l'Aye-Aye (Daubentonia madagascariensis), le lémurien le plus étrange et le plus rare de Madagascar, lors d'une marche nocturne guidée.

L'île abrite également des Uroplatus (geckos à queue de feuille), des caméléons et d'anciens pétroglyphes gravés par des navigateurs hollandais du XVIIe siècle.

Les tombeaux sacrés de chefs Betsimisaraka ajoutent une dimension culturelle à cette réserve exceptionnelle.`,
    shortDescription: 'L\'île de l\'Aye-Aye — Marche nocturne, pétroglyphes hollandais et forêt primaire.',
    city: 'Maroantsetra',
    region: 'Analanjirofo',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 55000,
    visitDuration: '1 jour (avec nuit pour observation nocturne)',
    bestTimeToVisit: 'Septembre à décembre (saison sèche relative du Nord-Est)',
    highlights: ['Observation de l\'Aye-Aye (Marche nocturne)', 'Forêt tropicale primaire', 'Pétroglyphes hollandais du XVIIe siècle', 'Geckos Uroplatus et faune endémique'],
    rating: 4.4,
    reviewCount: 167,
    isFeatured: false,
    latitude: -15.4890,
    longitude: 49.7600,
    coverImage: null,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 29 — Fonderie d'Ambatolampy (NEW)
  // ============================
  {
    name: "Fonderie d'Aluminium d'Ambatolampy",
    slug: 'fonderie-ambatolampy',
    description: `Ambatolampy est célèbre dans tout Madagascar pour ses fonderies artisanales d'aluminium. Dans des ateliers à ciel ouvert, les artisans recyclent de vieilles pièces de voitures, des cannettes et des métaux usagés pour fabriquer les célèbres marmites malgaches ("vilany").

Le processus de fonte et de moulage, réalisé avec des moyens rudimentaires mais une expertise impressionnante, est un spectacle fascinant. C'est un arrêt rapide, authentique et gratuit sur la RN7.

Ce témoignage du génie de la débrouillardise malgache se trouve entre Tana et Antsirabe.`,
    shortDescription: 'L\'art de la récup\' — Fonderies artisanales et marmites malgaches sur la RN7.',
    city: 'Ambatolampy',
    region: 'Vakinankaratra',
    attractionType: 'culture',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '30 min - 1 heure',
    bestTimeToVisit: 'Toute l\'année / Matin (ateliers actifs dès 7h)',
    highlights: ['Fonderie artisanale en plein air', 'Recyclage créatif (Marmites malgaches)', 'Savoir-faire traditionnel', 'Arrêt rapide et authentique sur la RN7'],
    rating: 4.3,
    reviewCount: 289,
    isFeatured: false,
    latitude: -19.3829,
    longitude: 47.4404,
    coverImage: null,
    hasGuide: false,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 30 — Requins-Baleines de Nosy Be (NEW)
  // ============================
  {
    name: 'Nager avec les Requins-Baleines',
    slug: 'requins-baleines-nosy-be',
    description: `De octobre à décembre, les eaux au large de Nosy Be accueillent les requins-baleines (Rhincodon typus), les plus grands poissons du monde pouvant atteindre 12 mètres de long. Ces géants inoffensifs se nourrissent de plancton.

Leur rencontre en snorkeling est une expérience à couper le souffle. Madagascar est l'une des rares destinations au monde où cette rencontre est possible dans des conditions naturelles et préservées.

Le choix d'opérateurs éco-responsables respectant les distances de sécurité est essentiel pour préserver cette espèce vulnérable.`,
    shortDescription: 'Snorkeling avec les géants — Requins-baleines de 12m au large de Nosy Be.',
    city: 'Nosy Be',
    region: 'Diana',
    attractionType: 'nature',
    isFree: false,
    entryFeeLocal: 100000,
    entryFeeForeign: 300000,
    visitDuration: 'Demi-journée',
    bestTimeToVisit: 'Octobre à décembre (présence confirmée)',
    highlights: ['Snorkeling avec les requins-baleines', 'Plus grands poissons du monde (jusqu\'à 12m)', 'Expérience éco-responsable', 'Eaux chaudes et visibilité excellente'],
    rating: 4.8,
    reviewCount: 423,
    isFeatured: false,
    latitude: -13.40,
    longitude: 48.15,
    coverImage: `${A}/faune-flore/Baleine-391.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 31 — Train FCE (UPDATE)
  // ============================
  {
    name: 'Train FCE Fianarantsoa-Manakara',
    slug: 'train-fce',
    existingSlugs: ['train-fce-fianarantsoa-manakara'],
    description: `La ligne de chemin de fer FCE (Fianarantsoa-Côte Est), inaugurée en 1936, est l'une des aventures ferroviaires les plus mythiques au monde. Ce train traverse 67 tunnels, franchit des dizaines de ponts et serpente à travers la jungle, les falaises et les rizières en terrasses.

À chaque arrêt de gare — il y en a 17 — les paysans vendent des fruits frais, des beignets (mofo baolina) et de l'artisanat sur les quais.

Ce n'est pas seulement un transport, c'est une immersion totale dans des paysages inaccessibles par la route et dans la vie quotidienne malgache. Le trajet dure 10 à 18 heures.`,
    shortDescription: 'Le voyage le plus lent du monde — 67 tunnels, marchés de quai et jungle impénétrable.',
    city: 'Fianarantsoa',
    region: 'Haute Matsiatra',
    attractionType: 'nature',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 25000,
    visitDuration: '1 jour (10-18h de trajet)',
    bestTimeToVisit: 'Toute l\'année (mardi, jeudi et samedi)',
    highlights: ['Traversée de 67 tunnels et ponts suspendus', 'Paysages de jungle inaccessibles par la route', 'Marchés de quai à chaque gare', 'Immersion humaine et culturelle'],
    rating: 4.4,
    reviewCount: 356,
    isFeatured: false,
    latitude: -21.4478,
    longitude: 47.0902,
    coverImage: `${A}/manakara/Rary Manakara-263.jpg`,
    hasGuide: false,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 32 — Vallée de la SAVA / Route de la Vanille (NEW)
  // ============================
  {
    name: 'Sambava & Antalaha — Route de la Vanille',
    slug: 'route-vanille-sava',
    description: `La région SAVA (Sambava-Antalaha-Vohémar-Andapa) produit environ 80% de la vanille mondiale, faisant de Madagascar le premier producteur planétaire de cet "or noir".

Visiter une plantation de vanille est une expérience sensorielle unique : vous découvrirez le processus minutieux du "mariage" de la vanille — la fécondation manuelle fleur par fleur — et les mois de préparation nécessaires.

La région offre également l'accès au Parc National de Marojejy, sanctuaire du rarissime Propithèque soyeux, dans un décor de montagnes brumeuses.`,
    shortDescription: '80% de la vanille mondiale — Plantations, "mariage" des fleurs et or noir malgache.',
    city: 'Sambava',
    region: 'SAVA',
    attractionType: 'culture',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 25000,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Octobre à janvier (floraison de la vanille)',
    highlights: ['Visite de plantations de vanille (Le "Mariage")', 'Parc National de Marojejy', 'Ateliers de préparation de la vanille', 'Paysages de montagnes tropicales'],
    rating: 4.6,
    reviewCount: 178,
    isFeatured: false,
    latitude: -14.2713,
    longitude: 50.1678,
    coverImage: null,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 33 — Surf à Lavanono (NEW)
  // ============================
  {
    name: 'Lavanono — Le Spot du Bout du Monde',
    slug: 'surf-lavanono',
    description: `Lavanono est un village de pêcheurs niché au pied d'une falaise spectaculaire, à l'extrême sud de Madagascar. Devenu mondialement célèbre dans la communauté des surfeurs pour ses vagues puissantes et régulières.

Ce spot offre une déconnexion totale : pas d'internet, peu d'électricité, et une immersion dans un mode de vie préservé. Les tortues radiées (Astrochelys radiata), espèce endémique en danger, vivent en liberté dans la brousse environnante.

C'est le paradis des amateurs de glisse en quête de calme absolu et de vagues parfaites loin de tout.`,
    shortDescription: 'Le spot de surf ultime — Vagues parfaites, déconnexion totale et tortues radiées.',
    city: 'Lavanono',
    region: 'Anosy',
    attractionType: 'plage',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '3-5 jours',
    bestTimeToVisit: 'Avril à septembre (houle régulière du sud)',
    highlights: ['Vagues parfaites pour le surf', 'Déconnexion totale du monde moderne', 'Tortues radiées en liberté', 'Falaises et paysages du Grand Sud'],
    rating: 4.7,
    reviewCount: 92,
    isFeatured: false,
    latitude: -25.4293,
    longitude: 44.9452,
    coverImage: null,
    hasGuide: false,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 34 — Zafimaniry Trek (NEW)
  // ============================
  {
    name: 'Randonnée vers les Villages Zafimaniry',
    slug: 'trek-zafimaniry',
    description: `Le peuple Zafimaniry est le dernier dépositaire d'une culture unique de construction en bois, inscrite au Patrimoine Immatériel de l'UNESCO depuis 2003. Leurs maisons, entièrement assemblées sans clous ni vis, sont ornées de motifs géométriques sculptés d'une beauté extraordinaire.

Le trekking de 2 à 3 jours de village en village — notamment Antoetra, Sakaivo et Ifasina — avec hébergement chez l'habitant, est une immersion profonde dans une culture préservée par l'isolement des montagnes.

L'initiation à la sculpture géométrique par les artisans locaux est un souvenir unique.`,
    shortDescription: 'Trekking culturel UNESCO — Maisons sculptées sans clous et hébergement chez l\'habitant.',
    city: 'Antoetra',
    region: "Amoron'i Mania",
    attractionType: 'culture',
    isFree: false,
    entryFeeLocal: 5000,
    entryFeeForeign: 25000,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Avril à octobre (saison sèche, sentiers praticables)',
    highlights: ['Maisons sculptées sans clous (UNESCO)', 'Trekking de village en village', 'Hébergement chez l\'habitant', 'Initiation à la sculpture géométrique'],
    rating: 4.7,
    reviewCount: 143,
    isFeatured: false,
    latitude: -20.7745,
    longitude: 47.3181,
    coverImage: `${A}/ambositra/Art Malagasy zafimaniry ambositra-336.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: false,
  },

  // ============================
  // FICHE 35 — Piscines Naturelles Ankarana (NEW - part of Ankarana)
  // ============================
  {
    name: "Piscines Naturelles de l'Ankarana",
    slug: 'piscines-ankarana',
    description: `Cachées au cœur du massif calcaire de l'Ankarana, les piscines naturelles sont des joyaux d'eau cristalline nichés au fond de canyons ombragés par une végétation luxuriante.

Moins fréquentées que les célèbres piscines du Parc de l'Isalo, elles offrent une expérience plus sauvage et intime. Après une marche sous le soleil à travers les formations acérées des Tsingy, plonger dans ces bassins d'eau fraîche est un moment de pur bonheur.

Certains de ces points d'eau sont considérés comme sacrés par les populations locales.`,
    shortDescription: 'Baignade secrète dans les Tsingy — Bassins cristallins au cœur du massif calcaire.',
    city: 'Mahamasina',
    region: 'Diana',
    attractionType: 'nature',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '3-4 heures',
    bestTimeToVisit: 'Mai à novembre / Matin (10h-12h)',
    highlights: ['Piscines d\'eau cristalline', 'Cadre plus sauvage que l\'Isalo', 'Traversée des Tsingy', 'Lieux sacrés locaux'],
    rating: 4.6,
    reviewCount: 178,
    isFeatured: false,
    latitude: -12.8955,
    longitude: 49.1424,
    coverImage: `${A}/ankarana/Lac ankarana.jpg`,
    hasGuide: true,
    hasParking: true,
    isAccessible: false,
  },

  // ============================
  // FICHE 36 — Parc National de Masoala (UPDATE)
  // ============================
  {
    name: 'Parc National de Masoala',
    slug: 'parc-national-masoala',
    existingSlugs: ['parc-national-masoala'],
    description: `Le Parc National de Masoala est la plus grande aire protégée de Madagascar avec plus de 230 000 hectares. C'est l'un des rares endroits au monde où la forêt tropicale primaire dégringole directement dans une mer turquoise bordée de récifs coralliens.

Cette biodiversité exceptionnelle abrite le Vari roux (Varecia rubra), des orchidées rarissimes et une faune marine riche incluant tortues, dauphins et coraux intacts.

Le combiné unique "kayak de mer le matin et observation de lémuriens l'après-midi" en fait une destination de rêve pour les écotouristes exigeants.`,
    shortDescription: 'Là où la forêt rencontre la mer — 230 000 hectares, Vari roux et kayak de mer.',
    city: 'Maroantsetra',
    region: 'Analanjirofo',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '3-5 jours',
    bestTimeToVisit: 'Septembre à décembre (saison sèche relative)',
    highlights: ['Forêt primaire plongeant dans la mer turquoise', 'Vari roux (Lémurien endémique)', 'Kayak de mer et snorkeling', 'Parcs marins protégés'],
    rating: 4.3,
    reviewCount: 38,
    isFeatured: false,
    latitude: -15.5965,
    longitude: 50.1418,
    coverImage: `${A}/masoala/parc-masoala.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 37 — Le Famadihana (NEW)
  // ============================
  {
    name: 'Le Famadihana',
    slug: 'famadihana',
    description: `Le Famadihana est l'une des cérémonies les plus extraordinaires au monde. Tous les cinq à sept ans, les familles des Hautes Terres sortent les ossements de leurs ancêtres du tombeau familial pour les envelopper dans de nouveaux linceuls de soie ("lamba mena").

L'ambiance est celle d'une fête joyeuse avec musique, danse et repas communautaire. Loin d'être macabre, c'est un moment de communion profonde entre les vivants et les morts, pilier central de la culture malgache.

Ce n'est pas une attraction touristique : y assister sur invitation est un immense privilège. Un guide local est indispensable pour être invité et respecter les coutumes.`,
    shortDescription: 'Retournement des Morts — Cérémonie ancestrale unique, musique et communion familiale.',
    city: 'Hautes Terres',
    region: 'Analamanga',
    attractionType: 'culture',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1 jour (sur invitation)',
    bestTimeToVisit: 'Juin à septembre (saison sèche des Hautes Terres)',
    highlights: ['Cérémonie ancestrale unique au monde', 'Ambiance festive (Musique et danse)', 'Communion entre vivants et ancêtres', 'Immersion culturelle profonde'],
    rating: 4.8,
    reviewCount: 97,
    isFeatured: false,
    latitude: -18.9237,
    longitude: 47.5321,
    coverImage: `${A}/culture/Joie de vivre-427.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: true,
  },

  // ============================
  // FICHE 38 — Kimony Beach (NEW)
  // ============================
  {
    name: 'Kimony Beach',
    slug: 'kimony-beach',
    description: `Alors que la plupart des visiteurs de Morondava restent sur la plage du centre-ville, Kimony Beach offre des kilomètres de sable fin bordés de cocotiers et de palmiers Satrana dans un cadre d'une tranquillité absolue.

Cette plage immense et peu fréquentée est le secret des locaux : on y croise des charrettes à zébus longeant le rivage et des pirogues de pêcheurs Vezo rentrant au coucher du soleil.

C'est l'endroit parfait pour décompresser après les pistes poussiéreuses des Tsingy de Bemaraha.`,
    shortDescription: 'La plage secrète de Morondava — Sable fin, cocotiers et coucher de soleil Vezo.',
    city: 'Morondava',
    region: 'Menabe',
    attractionType: 'plage',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: 'Demi-journée à 1 jour',
    bestTimeToVisit: 'Avril à novembre (saison sèche)',
    highlights: ['Plage immense et tranquille', 'Cocotiers et palmiers Satrana', 'Coucher de soleil sur le canal du Mozambique', 'Ambiance locale authentique (charrettes à zébus)'],
    rating: 4.3,
    reviewCount: 45,
    isFeatured: false,
    latitude: -20.2535,
    longitude: 44.2971,
    coverImage: `${A}/paysages/paysage-195.jpg`,
    hasGuide: false,
    hasParking: false,
    isAccessible: true,
  },

  // ============================
  // FICHE 39 — Ilakaka (NEW)
  // ============================
  {
    name: 'Ilakaka — La Ville du Saphir',
    slug: 'ilakaka',
    description: `Ilakaka est née de la fièvre du saphir à la fin des années 1990, lorsque le plus grand gisement de saphirs au monde a été découvert dans cette zone. En quelques années, un petit village s'est transformé en une ville champignon digne du Far West américain.

Des milliers de mineurs artisanaux tamisent le gravier des rivières à la recherche de la pierre précieuse. Le spectacle de cette fourmilière humaine — les tamiseurs dans l'eau, les négociants Sri-Lankais et Thaïlandais, les showrooms de pierres — est saisissant.

Située à l'entrée du Parc de l'Isalo sur la RN7, c'est un arrêt aussi fascinant qu'inattendu.`,
    shortDescription: 'La ville du Far West malgache — Mines de saphir, tamiseurs et showrooms de pierres.',
    city: 'Ilakaka',
    region: 'Ihorombe',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '2-3 heures',
    bestTimeToVisit: 'Toute l\'année / Matin (activité des tamiseurs)',
    highlights: ['Mines de saphir à ciel ouvert', 'Tamiseurs dans la rivière', 'Showrooms de pierres précieuses', 'Ambiance Far West malgache'],
    rating: 4.0,
    reviewCount: 198,
    isFeatured: false,
    latitude: -22.6941,
    longitude: 45.2128,
    coverImage: null,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 40 — Mofo Gasy (NEW)
  // ============================
  {
    name: 'Le Mofo Gasy — Petit-déjeuner des Champions',
    slug: 'mofo-gasy',
    description: `Le Mofo Gasy ("pain malgache") est bien plus qu'une simple galette de riz : c'est une institution matinale à Madagascar. Chaque matin dès l'aube, des vendeuses installent leurs réchauds à charbon et leurs moules en fonte ronds sur les trottoirs.

Ces petites galettes sucrées à base de farine de riz et de lait de coco, accompagnées d'un café "belge" (café local très sucré filtré dans un tissu), constituent le petit-déjeuner le plus authentique et le moins cher du pays.

Les variantes Mofo Baolina (beignet boule) et Mofo Sakay (beignet épicé au cresson) méritent aussi le détour.`,
    shortDescription: 'Institution matinale malgache — Galettes de riz au coco et café "belge" sur le trottoir.',
    city: 'Partout à Madagascar',
    region: 'Multi-régions',
    attractionType: 'gastronomie',
    isFree: false,
    entryFeeLocal: 500,
    entryFeeForeign: 500,
    visitDuration: '30 minutes',
    bestTimeToVisit: 'Toute l\'année / Tôt le matin (5h30-8h)',
    highlights: ['Galettes de riz sucrées cuites sur charbon', 'Café "belge" traditionnel', 'Ambiance matinale authentique', 'Variantes : Mofo Baolina et Mofo Sakay'],
    rating: 4.7,
    reviewCount: 534,
    isFeatured: false,
    latitude: -18.9237,
    longitude: 47.5321,
    coverImage: null,
    hasGuide: false,
    hasParking: false,
    isAccessible: true,
  },

  // ============================
  // FICHE 41 — Massif de l'Ankaratra (NEW)
  // ============================
  {
    name: "Massif de l'Ankaratra",
    slug: 'massif-ankaratra',
    description: `Le Massif de l'Ankaratra est un ensemble volcanique culminant à 2 643 mètres au sommet du Tsiafajavona, le troisième plus haut point de Madagascar. Véritable château d'eau de la région, ce massif offre un paysage de forêts de pins, de cascades et de prairies d'altitude.

L'air frais et pur, à seulement 2 heures de Tana, en fait une escapade nature idéale pour les citadins. Les élevages de truites et les pique-niques au bord des chutes d'eau complètent cette parenthèse montagnarde.

Le panorama depuis le sommet du Tsiafajavona, par temps clair, embrasse une grande partie des Hautes Terres.`,
    shortDescription: 'Tsiafajavona 2 643m — Cascades, forêts de pins et truites d\'altitude à 2h de Tana.',
    city: 'Ambatolampy',
    region: 'Vakinankaratra',
    attractionType: 'montagne',
    isFree: false,
    entryFeeLocal: 2000,
    entryFeeForeign: 10000,
    visitDuration: '1 jour',
    bestTimeToVisit: 'Avril à octobre (saison sèche, sentiers praticables)',
    highlights: ['Sommet du Tsiafajavona (2 643m)', 'Cascades et forêts de pins', 'Élevages de truites d\'altitude', 'Pique-nique en pleine nature'],
    rating: 4.4,
    reviewCount: 156,
    isFeatured: false,
    latitude: -19.3822,
    longitude: 47.3529,
    coverImage: `${A}/paysages/Montagnes Madagascar-141.jpg`,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 42 — Île aux Nattes (UPDATE)
  // ============================
  {
    name: 'Île aux Nattes',
    slug: 'ile-aux-nattes',
    existingSlugs: ['ile-aux-nattes', 'ile-aux-nattes-sainte-marie'],
    description: `L'Île aux Nattes est l'image même du paradis tropical : une minuscule île circulaire que l'on peut contourner à pied en 2 à 3 heures, sans routes, sans moteurs, avec seulement du sable blanc, des cocotiers et un lagon turquoise d'une clarté irréelle.

On y accède en pirogue traditionnelle depuis la pointe sud de Sainte-Marie pour quelques centimes. Le vieux phare, perché au sommet de l'île, offre une vue à 360° sur l'océan Indien.

Le snorkeling dans le lagon y est exceptionnel et le rythme de vie d'une lenteur délicieuse.`,
    shortDescription: 'Le paradis sans voiture — Tour à pied, lagon turquoise et phare panoramique.',
    city: 'Sainte-Marie',
    region: 'Analanjirofo',
    attractionType: 'ile',
    isFree: true,
    entryFeeLocal: 1000,
    entryFeeForeign: 5000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Avril à décembre (saison sèche)',
    highlights: ['Tour de l\'île à pied (2-3h)', 'Lagon turquoise et snorkeling', 'Vue 360° depuis le phare', 'Traversée en pirogue traditionnelle'],
    rating: 4.7,
    reviewCount: 75,
    isFeatured: true,
    latitude: -17.1102,
    longitude: 49.8061,
    coverImage: `${A}/sainte-marie/ile-sainte-marie.jpg`,
    hasGuide: false,
    hasParking: false,
    isAccessible: true,
  },

  // ============================
  // FICHE 43 — Parc National de Midongy du Sud (NEW)
  // ============================
  {
    name: 'Parc National de Midongy du Sud',
    slug: 'parc-midongy-sud',
    description: `Le Parc National de Midongy du Sud est l'un des parcs les moins visités de Madagascar, un joyau caché de forêt pluviale de haute altitude accessible uniquement par des pistes difficiles.

Cette isolation a préservé un écosystème d'une richesse exceptionnelle : plantes médicinales uniques, oiseaux endémiques rares et une flore de sous-bois extraordinaire.

Pour les passionnés de botanique et d'ornithologie qui rêvent d'être absolument seuls dans une forêt primaire intacte, c'est la destination ultime de Madagascar.`,
    shortDescription: 'La forêt oubliée — Parc le moins visité, solitude absolue et oiseaux endémiques rares.',
    city: 'Midongy du Sud',
    region: 'Atsimo-Atsinanana',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 65000,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Septembre à novembre (fin de saison sèche)',
    highlights: ['Forêt pluviale de haute altitude vierge', 'Oiseaux endémiques rares', 'Plantes médicinales uniques', 'Solitude absolue en forêt primaire'],
    rating: 4.5,
    reviewCount: 34,
    isFeatured: false,
    latitude: -23.7074,
    longitude: 47.0972,
    coverImage: null,
    hasGuide: true,
    hasParking: false,
    isAccessible: false,
  },

  // ============================
  // FICHE 44 — Ateliers de Soie de Soatanana (NEW)
  // ============================
  {
    name: 'La Soie Sauvage de Soatanana',
    slug: 'soie-soatanana',
    description: `Dans le village de Soatanana, la quasi-totalité de la population travaille la soie "Landibe", une soie sauvage produite par des vers vivant dans les forêts de Tapia (Uapaca bojeri), un arbre endémique de Madagascar.

Le processus artisanal — de la récolte des cocons dans la forêt au filage à la main, en passant par la teinture avec des pigments naturels — est un spectacle fascinant transmis de mère en fille.

Acheter une écharpe directement à la coopérative des femmes du village, c'est acquérir un produit de luxe à une fraction du prix européen tout en soutenant l'économie locale.`,
    shortDescription: 'Soie sauvage artisanale — Récolte des cocons, filage à la main et coopérative des femmes.',
    city: 'Ambalavao',
    region: 'Haute Matsiatra',
    attractionType: 'culture',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '2-3 heures',
    bestTimeToVisit: 'Toute l\'année / Matin (artisanes au travail dès 7h)',
    highlights: ['Récolte des cocons en forêt de Tapia', 'Filage et tissage à la main', 'Teinture naturelle artisanale', 'Coopérative des femmes (Achat direct)'],
    rating: 4.8,
    reviewCount: 112,
    isFeatured: false,
    latitude: -21.8206,
    longitude: 46.9483,
    coverImage: null,
    hasGuide: true,
    hasParking: true,
    isAccessible: true,
  },

  // ============================
  // FICHE 45 — Vary sy Anana (NEW)
  // ============================
  {
    name: 'Vary sy Anana — Le Petit-déjeuner du Voyageur',
    slug: 'vary-sy-anana',
    description: `Le "Vary sy Anana" (riz et brèdes) est le petit-déjeuner traditionnel de Madagascar, servi dans les "Hotely" — ces petits restaurants de bord de route au mobilier rudimentaire mais à la cuisine généreuse.

Chaque matin, un bol de riz fumant accompagné de brèdes (feuilles vertes sautées à l'ail), parfois relevé de petits morceaux de viande ou de poisson, nourrit le pays tout entier.

C'est nutritif, chaud, réconfortant et extrêmement bon marché — l'idéal avant une longue route en taxi-brousse. Partager ce repas dans un Hotely, c'est vivre Madagascar au quotidien.`,
    shortDescription: 'Plat national dans les Hotely — Riz et brèdes fumants, ambiance taxi-brousse.',
    city: 'Partout à Madagascar',
    region: 'Multi-régions',
    attractionType: 'gastronomie',
    isFree: false,
    entryFeeLocal: 3000,
    entryFeeForeign: 3000,
    visitDuration: '30 minutes',
    bestTimeToVisit: 'Toute l\'année / Matin (dès 5h30-8h dans les Hotely)',
    highlights: ['Riz et brèdes fumants (Plat national)', 'Ambiance des "Hotely" de bord de route', 'Repas le plus authentique et économique', 'Partage avec les locaux avant le taxi-brousse'],
    rating: 4.5,
    reviewCount: 321,
    isFeatured: false,
    latitude: -18.9237,
    longitude: 47.5321,
    coverImage: null,
    hasGuide: false,
    hasParking: false,
    isAccessible: true,
  },
];

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

        // Update coverImage only if we have a local one and the current one isn't set
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
    logger.error('Error seeding fiches:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
