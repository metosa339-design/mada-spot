import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const A = '/images/Attractions';

// Les 17 incontournables de Madagascar (source: generationvoyage.fr, contenu restructuré)
const INCONTOURNABLES = [
  {
    name: 'Antananarivo',
    slug: 'antananarivo',
    description: `Antananarivo, surnommée "Tana", est la vibrante capitale de Madagascar perchée à 1 276 mètres d'altitude sur les hauts plateaux. Bâtie sur plusieurs collines, la ville offre un panorama saisissant mêlant architecture coloniale, palais royaux et rizières en terrasses.

Le château de la Reine (Rova de Manjakamiadana), dominant la ville du haut de la colline la plus élevée, témoigne de la grandeur du royaume Merina. Le lac Anosy, cerné de jacarandas, constitue un havre de paix au cœur de l'effervescence urbaine.

Le marché d'Analakely et les rues animées de la Haute-Ville dévoilent l'âme de la capitale : artisanat malgache, épices, vanille et pierres précieuses. Antananarivo est aussi la porte d'entrée incontournable pour toutes les explorations de la Grande Île.`,
    shortDescription: 'La capitale historique perchée sur les collines, mélange unique de palais royaux et de vie urbaine trépidante.',
    city: 'Antananarivo',
    region: 'Analamanga',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Rova de Manjakamiadana', 'Lac Anosy', 'Marché d\'Analakely', 'Haute-Ville historique', 'Parc de Tsimbazaza'],
    rating: 4.2,
    reviewCount: 156,
    isFeatured: true,
    latitude: -18.8792,
    longitude: 47.5079,
    coverImage: `${A}/antananarivo/antananarivo.jpg`,
  },
  {
    name: 'Nosy Be',
    slug: 'nosy-be',
    description: `Nosy Be, la plus grande station balnéaire de Madagascar, est un véritable joyau tropical au nord-ouest du pays. Surnommée "l'île aux parfums" pour ses plantations d'ylang-ylang, de café et de cacao, elle offre des plages de sable blanc progressives, peu profondes et paisibles, idéales pour la baignade.

Les eaux turquoise abritent une vie marine extraordinaire : tortues, raies manta et requins-baleines. Le Mont Passot, point culminant à 329 mètres, offre un coucher de soleil inoubliable sur les lacs sacrés. La réserve de Lokobe, dernière forêt primaire de l'île, abrite le lémurien noir aux yeux bleus.

Les îles satellites — Nosy Komba, Nosy Tanikely et Nosy Iranja — complètent ce paradis tropical, chacune avec son caractère unique.`,
    shortDescription: 'L\'île aux parfums — Paradis balnéaire avec plages de sable blanc, eaux turquoise et ylang-ylang.',
    city: 'Hell-Ville',
    region: 'Diana',
    attractionType: 'ile',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '4-7 jours',
    bestTimeToVisit: 'Avril à Décembre',
    highlights: ['Plage d\'Andilana', 'Mont Passot', 'Nosy Tanikely', 'Réserve de Lokobe', 'Nosy Komba', 'Ylang-ylang'],
    rating: 4.7,
    reviewCount: 423,
    isFeatured: true,
    latitude: -13.4167,
    longitude: 48.2667,
    coverImage: `${A}/nosy-be/Nosy Be, Madagascar-201.jpg`,
  },
  {
    name: 'Allée des Baobabs',
    slug: 'allee-des-baobabs',
    description: `L'Allée des Baobabs est l'image la plus emblématique de Madagascar. Située sur une route de terre de 260 mètres entre Morondava et Belo sur Tsiribihina, cette avenue est bordée d'une vingtaine de baobabs Grandidier imposants, certains âgés de plus de 800 ans.

Ces géants millénaires s'élèvent jusqu'à 30 mètres de hauteur avec des troncs atteignant 11 mètres de circonférence. Le moment magique se produit au coucher du soleil, quand les rayons dorés transforment ces colosses en silhouettes majestueuses sur un ciel embrasé.

Classée zone protégée depuis 2007, l'allée attire photographes et voyageurs du monde entier. Non loin, les "Baobabs Amoureux" — deux arbres entrelacés — sont devenus un symbole romantique de Madagascar.`,
    shortDescription: 'Avenue mythique de baobabs millénaires — Le coucher de soleil le plus photographié de Madagascar.',
    city: 'Morondava',
    region: 'Menabe',
    attractionType: 'monument_naturel',
    isFree: false,
    entryFeeLocal: 5000,
    entryFeeForeign: 25000,
    visitDuration: '2-3 heures',
    bestTimeToVisit: 'Avril à Novembre, idéalement au coucher de soleil',
    highlights: ['Baobabs Grandidier de 800 ans', 'Coucher de soleil magique', 'Baobabs Amoureux', 'Zone protégée UNESCO', 'Photographie iconique'],
    rating: 4.9,
    reviewCount: 892,
    isFeatured: true,
    latitude: -20.2510,
    longitude: 44.4189,
    coverImage: `${A}/baobabs/allee-des-baobabs.jpg`,
  },
  {
    name: 'Aire protégée du Makay',
    slug: 'aire-protegee-makay',
    description: `Le massif du Makay est l'un des derniers refuges sauvages de Madagascar, un territoire isolé et mystérieux accessible uniquement en 4×4 à travers des pistes difficiles. Ce massif de grès constitue un véritable coffre-fort de biodiversité, abritant des espèces encore inconnues de la science.

L'exploration du Makay est une aventure de 2 à 4 jours à travers des canyons profonds, des grottes ornées de peintures rupestres et une végétation luxuriante. La faune y est exceptionnelle : lémuriens, fossas, caméléons et des centaines d'espèces d'oiseaux trouvent refuge dans ce labyrinthe naturel.

Classé aire protégée, le Makay représente l'aventure ultime pour les explorateurs en quête de nature intacte et de paysages à couper le souffle.`,
    shortDescription: 'Massif isolé et mystérieux — Exploration en 4×4, canyons profonds et biodiversité exceptionnelle.',
    city: 'Beroroha',
    region: 'Atsimo-Andrefana',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 65000,
    visitDuration: '2-4 jours',
    bestTimeToVisit: 'Mai à Octobre',
    highlights: ['Canyons profonds', 'Peintures rupestres', 'Biodiversité unique', 'Aventure en 4×4', 'Lémuriens et fossas', 'Paysages intacts'],
    rating: 4.8,
    reviewCount: 98,
    isFeatured: true,
    latitude: -21.5833,
    longitude: 45.3333,
    coverImage: `${A}/divers/massif-andringitra.jpg`,
  },
  {
    name: 'Parc National de l\'Isalo',
    slug: 'parc-national-isalo',
    description: `Le Parc National de l'Isalo est le parc le plus visité de Madagascar, souvent surnommé le "Jurassic Park" malgache. Ce massif de grès ruiniforme de 81 540 hectares offre des paysages spectaculaires : formations rocheuses sculptées par des millions d'années d'érosion, canyons profonds et oasis naturelles.

Le Canyon des Makis permet d'observer les fameux lémuriens catta avec leurs queues annelées. Les piscines naturelles — Piscine Bleue, Piscine Noire et la célèbre Piscine Naturelle — offrent des baignades rafraîchissantes au creux de canyons verdoyants.

La Fenêtre de l'Isalo est le spot incontournable au coucher du soleil : cette arche naturelle encadre le disque solaire à l'horizon, créant une photo emblématique. Le parc abrite 82 espèces d'oiseaux, 33 reptiles et 6 espèces de lémuriens.`,
    shortDescription: 'Le "Jurassic Park" malgache — Canyons spectaculaires, piscines naturelles et lémuriens catta.',
    city: 'Ranohira',
    region: 'Ihorombe',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 65000,
    visitDuration: '1-3 jours',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Piscine Naturelle', 'Fenêtre de l\'Isalo', 'Canyon des Makis', 'Lémuriens catta', 'Formations de grès', 'Coucher de soleil'],
    rating: 4.8,
    reviewCount: 1247,
    isFeatured: true,
    latitude: -22.5500,
    longitude: 45.3667,
    coverImage: `${A}/isalo/Piscine Naturelle Isalo-144.jpg`,
  },
  {
    name: 'Parc National de Ranomafana',
    slug: 'parc-national-ranomafana',
    description: `Le Parc National de Ranomafana, dont le nom signifie "eau chaude", est un joyau de la biodiversité mondiale inscrit au patrimoine de l'UNESCO. Créé en 1991 suite à la découverte du lémurien bambou doré — espèce alors inconnue de la science — cette forêt tropicale de 41 600 hectares abrite une biodiversité remarquable.

Les 12 espèces de lémuriens peuplent cette forêt primaire drapée de brumes matinales. Les sources thermales naturelles, chauffées par l'activité volcanique souterraine à 38°C, invitent à la détente après une randonnée.

Les visites nocturnes révèlent un monde fascinant : lémuriens aux grands yeux, caméléons changeant de couleur et grenouilles multicolores. Les cascades dévalant les pentes ajoutent à la magie du lieu. Même dans ses régions les plus éloignées, le parc réserve des surprises extraordinaires.`,
    shortDescription: 'Forêt tropicale UNESCO — Sources chaudes et habitat du rare lémurien bambou doré.',
    city: 'Ranomafana',
    region: 'Vatovavy-Fitovinany',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 65000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Septembre à Décembre',
    highlights: ['Lémurien bambou doré', 'Sources thermales', 'Cascades', 'Forêt primaire UNESCO', 'Visite nocturne', '12 espèces de lémuriens'],
    rating: 4.7,
    reviewCount: 834,
    isFeatured: true,
    latitude: -21.2500,
    longitude: 47.4167,
    coverImage: `${A}/ranomafana/parc-ranomafana.jpg`,
  },
  {
    name: 'Descente du fleuve Tsiribihina',
    slug: 'descente-tsiribihina',
    description: `La descente du fleuve Tsiribihina est l'une des expériences les plus authentiques de Madagascar. En pirogue ou en canoë, cette aventure unique mêle camping sous les étoiles, cuisine locale préparée au bord du fleuve et immersion totale dans la nature malgache.

Le fleuve traverse des paysages grandioses : gorges encaissées, forêts denses peuplées de lémuriens et villages de pêcheurs vivant au rythme de l'eau. Les crocodiles se prélassent sur les berges tandis que les oiseaux tropicaux survolent les eaux calmes.

Traditionnellement, la descente dure 2 à 3 jours et se termine à Belo sur Tsiribihina, porte d'entrée vers l'Allée des Baobabs et les Tsingy de Bemaraha. C'est la combinaison parfaite pour un itinéraire Ouest inoubliable.`,
    shortDescription: 'Aventure fluviale en pirogue — Camping sous les étoiles et paysages sauvages.',
    city: 'Miandrivazo',
    region: 'Menabe',
    attractionType: 'nature',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Mai à Octobre',
    highlights: ['Navigation en pirogue', 'Camping sous les étoiles', 'Gorges spectaculaires', 'Crocodiles', 'Villages de pêcheurs', 'Lémuriens'],
    rating: 4.6,
    reviewCount: 287,
    isFeatured: true,
    latitude: -19.5167,
    longitude: 45.4667,
    coverImage: `${A}/pangalanes/canal-pangalanes.jpg`,
  },
  {
    name: 'Tsingy de Bemaraha',
    slug: 'tsingy-de-bemaraha',
    description: `Les Tsingy de Bemaraha, inscrits au patrimoine mondial de l'UNESCO depuis 1990, constituent l'un des paysages les plus extraordinaires de la planète. Ouvert au public en 1998, ce labyrinthe de pinacles calcaires tranchants s'étend sur 157 710 hectares.

Le mot "tsingy" signifie en malgache "là où l'on ne peut marcher pieds nus" — les arêtes calcaires sont si acérées qu'elles couperaient la peau. Les Grands Tsingy présentent des pitons atteignant 45 mètres de hauteur. L'exploration est une aventure : ponts suspendus au-dessus du vide, via ferrata et passages dans des grottes.

Entre les aiguilles de pierre, une forêt sèche abrite 11 espèces de lémuriens, des caméléons géants et des fossas. Les canyons riches en faune et flore offrent un contraste saisissant avec le relief minéral environnant.`,
    shortDescription: 'Cathédrale de calcaire UNESCO — Pinacles de 45m, ponts suspendus et via ferrata.',
    city: 'Bekopaka',
    region: 'Melaky',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 35000,
    entryFeeForeign: 75000,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Mai à Novembre',
    highlights: ['Patrimoine UNESCO', 'Grands Tsingy', 'Ponts suspendus', 'Via ferrata', 'Gorges de Manambolo', 'Sifaka de Decken'],
    rating: 4.9,
    reviewCount: 567,
    isFeatured: true,
    latitude: -19.1333,
    longitude: 44.8167,
    coverImage: `${A}/bemaraha/bemaraha.jpg`,
  },
  {
    name: 'Belo sur Mer',
    slug: 'belo-sur-mer',
    description: `Belo sur Mer est un village côtier préservé de l'ouest de Madagascar, où le temps semble s'être arrêté. Cette destination hors des sentiers battus est le lieu idéal pour se détendre, observer les pirogues de pêche traditionnelles glisser sur les eaux calmes et découvrir un mode de vie authentique.

Le village est célèbre pour ses salines artisanales et surtout pour ses charpentiers marins, qui perpétuent la tradition ancestrale de construction de goélettes en bois — ces voiliers à l'ancienne navigant encore le long des côtes malgaches.

Les plages de sable blanc immaculé, bordées de cocotiers, offrent un cadre paisible loin du tourisme de masse. La barrière de corail au large protège les eaux et crée un lagon idéal pour le snorkeling et l'observation de la vie marine.`,
    shortDescription: 'Village côtier préservé — Pirogues traditionnelles, salines et goélettes ancestrales.',
    city: 'Belo sur Mer',
    region: 'Menabe',
    attractionType: 'plage',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Goélettes traditionnelles', 'Salines artisanales', 'Plages désertes', 'Pirogues de pêche', 'Snorkeling', 'Village authentique'],
    rating: 4.3,
    reviewCount: 89,
    isFeatured: true,
    latitude: -20.7333,
    longitude: 44.0167,
    coverImage: `${A}/paysages/Mer-425.jpg`,
  },
  {
    name: 'Ankazobe',
    slug: 'ankazobe',
    description: `Ankazobe est une petite ville typique des hauts plateaux malgaches, située à seulement 40 km d'Antananarivo. Caractérisée par sa terre rouge distinctive et ses rues non goudronnées, elle offre un aperçu authentique de la vie rurale malgache.

Le marché local d'Ankazobe est un véritable spectacle de couleurs et d'odeurs, où l'on trouve des souvenirs typiques, de l'artisanat local et les produits du terroir. C'est l'endroit idéal pour s'immerger dans la culture malgache sans s'éloigner de la capitale.

Les environs offrent de belles randonnées à travers les collines des hauts plateaux, les rizières en terrasses et les villages traditionnels aux maisons de terre ocre. Une excursion à la journée parfaite pour découvrir la Madagascar authentique.`,
    shortDescription: 'Village authentique à 40 km de Tana — Terre rouge, marché local et vie rurale malgache.',
    city: 'Ankazobe',
    region: 'Analamanga',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1 journée',
    bestTimeToVisit: 'Toute l\'année',
    highlights: ['Marché local', 'Terre rouge', 'Artisanat', 'Rizières en terrasses', 'Villages traditionnels', 'Excursion depuis Tana'],
    rating: 4.0,
    reviewCount: 67,
    isFeatured: true,
    latitude: -18.3167,
    longitude: 47.1167,
    coverImage: `${A}/culture/cultur-riz1.png`,
  },
  {
    name: 'Île aux Nattes',
    slug: 'ile-aux-nattes',
    description: `L'Île aux Nattes (Nosy Nato) est un petit paradis situé au sud de l'île Sainte-Marie, sur la côte est de Madagascar. Accessible en pirogue depuis Sainte-Marie, cette île minuscule est un bijou de tranquillité reconnu pour ses sentiers de randonnée ombragés et ses plages immaculées.

Entre juillet et septembre, les baleines à bosse viennent se reproduire dans les eaux chaudes environnantes, offrant un spectacle naturel exceptionnel. L'observation de ces géants des mers bondissant hors de l'eau est une expérience inoubliable.

L'île se parcourt à pied en quelques heures, dévoilant des cocoteraies, des récifs coralliens accessibles en snorkeling et une ambiance paisible unique. C'est le lieu idéal pour déconnecter totalement et profiter de la beauté brute de Madagascar.`,
    shortDescription: 'Petit paradis au sud de Sainte-Marie — Baleines à bosse, randonnée et plages désertes.',
    city: 'Sainte-Marie',
    region: 'Analanjirofo',
    attractionType: 'ile',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Juillet à Septembre pour les baleines',
    highlights: ['Baleines à bosse', 'Plages désertes', 'Snorkeling', 'Randonnée', 'Cocoteraies', 'Pirogues traditionnelles'],
    rating: 4.7,
    reviewCount: 234,
    isFeatured: true,
    latitude: -17.1000,
    longitude: 49.8500,
    coverImage: `${A}/sainte-marie/ile-sainte-marie.jpg`,
  },
  {
    name: 'Baie de Diego-Suarez',
    slug: 'baie-diego-suarez',
    description: `La baie de Diego-Suarez (Antsiranana), à la pointe nord de Madagascar, est la deuxième plus grande baie du monde après Rio de Janeiro. Composée de quatre baies distinctes dont une sacrée, elle offre des panoramas d'une beauté saisissante entre mer et montagne.

La ville portuaire d'Antsiranana conserve un charme colonial avec ses bâtiments historiques. Le Pain de Sucre, formation rocheuse emblématique, rappelle son célèbre homologue brésilien. Aux alentours, le Parc National de la Montagne d'Ambre abrite des cascades majestueuses et le plus petit caméléon du monde.

La Mer d'Émeraude, lagon aux eaux turquoise, et les Tsingy Rouges aux formations d'argile flamboyantes complètent cette destination extraordinaire. Les plages de Ramena et les Trois Baies attirent les amateurs de farniente et de sports nautiques.`,
    shortDescription: 'La 2ème plus grande baie du monde — Pain de Sucre, Mer d\'Émeraude et Tsingy Rouges.',
    city: 'Antsiranana',
    region: 'Diana',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '3-5 jours',
    bestTimeToVisit: 'Avril à Décembre',
    highlights: ['Pain de Sucre', 'Mer d\'Émeraude', 'Tsingy Rouges', 'Montagne d\'Ambre', 'Plage de Ramena', 'Trois Baies'],
    rating: 4.6,
    reviewCount: 512,
    isFeatured: true,
    latitude: -12.2765,
    longitude: 49.2917,
    coverImage: `${A}/diego-suarez/003A8246-440.jpg`,
  },
  {
    name: 'Parc National de Marojejy',
    slug: 'parc-national-marojejy',
    description: `Le Parc National de Marojejy, inscrit au patrimoine mondial de l'UNESCO, est une réserve de 55 500 hectares au nord-est de Madagascar. Sa forêt dense s'élève jusqu'à 2 000 mètres d'altitude, créant des étages de végétation d'une richesse botanique exceptionnelle.

Le parc abrite 110 espèces d'oiseaux, des lémuriens rares dont le sifaka soyeux, et une flore endémique extraordinaire. Les randonnées à travers cette forêt primaire sont parmi les plus belles de l'île, offrant des vues panoramiques spectaculaires depuis les crêtes.

L'isolement du parc a préservé un écosystème d'une pureté rare. Les cascades, les bassins naturels et la brume matinale qui enveloppe la canopée créent une atmosphère mystique et hors du temps.`,
    shortDescription: 'Réserve UNESCO de 55 500 hectares — Forêt dense, sifaka soyeux et 110 espèces d\'oiseaux.',
    city: 'Andapa',
    region: 'SAVA',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 65000,
    visitDuration: '2-4 jours',
    bestTimeToVisit: 'Septembre à Décembre',
    highlights: ['Patrimoine UNESCO', 'Sifaka soyeux', '110 espèces d\'oiseaux', 'Forêt dense d\'altitude', 'Cascades', 'Randonnée'],
    rating: 4.8,
    reviewCount: 167,
    isFeatured: true,
    latitude: -14.4333,
    longitude: 49.7500,
    coverImage: `${A}/faune-flore/Varika-370.jpg`,
  },
  {
    name: 'Réserve de Nahampoana',
    slug: 'reserve-nahampoana',
    description: `La Réserve de Nahampoana, située près de Fort-Dauphin (Tôlanaro) dans le sud-est de Madagascar, est un jardin botanique et zoologique enchanteur qui offre des rencontres intimes avec la faune malgache.

Les lémuriens semi-apprivoisés se laissent approcher et photographier facilement, créant des souvenirs mémorables. La flore est d'une diversité remarquable : eucalyptus, bambous, hibiscus et orchidées sauvages composent un écrin de verdure luxuriant.

Les cascades du parc invitent à la baignade dans un cadre naturel préservé. C'est l'endroit idéal pour une immersion douce dans la nature malgache, accessible et conviviale, parfaite pour les familles et les amoureux de la nature.`,
    shortDescription: 'Jardin enchanteur près de Fort-Dauphin — Lémuriens apprivoisés, cascades et flore luxuriante.',
    city: 'Fort-Dauphin',
    region: 'Anosy',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 15000,
    entryFeeForeign: 40000,
    visitDuration: '2-3 heures',
    bestTimeToVisit: 'Toute l\'année',
    highlights: ['Lémuriens apprivoisés', 'Cascades', 'Jardin botanique', 'Orchidées sauvages', 'Baignade', 'Photo avec lémuriens'],
    rating: 4.5,
    reviewCount: 178,
    isFeatured: true,
    latitude: -25.0500,
    longitude: 46.9667,
    coverImage: `${A}/faune-flore/Gidro.jpg`,
  },
  {
    name: 'Canyon des Makis',
    slug: 'canyon-des-makis',
    description: `Le Canyon des Makis est l'une des randonnées emblématiques du sud de Madagascar, au départ de Ranohira aux portes du Parc National de l'Isalo. Cette promenade traverse des prairies immenses et des formations rocheuses avant de révéler des apparitions soudaines de lémuriens catta.

Les makis (lémuriens catta) avec leurs queues annelées noir et blanc sont les vedettes de ce canyon. Habitués à la présence humaine, ils offrent des rencontres mémorables. Le paysage alterne entre parois rocheuses sculptées, végétation luxuriante et points de vue panoramiques.

Un guide local est nécessaire pour cette exploration qui combine marche sportive et observation de la faune. Le canyon abrite également des caméléons, des reptiles et de nombreux oiseaux endémiques.`,
    shortDescription: 'Randonnée emblématique — Rencontres avec les lémuriens catta dans un canyon spectaculaire.',
    city: 'Ranohira',
    region: 'Ihorombe',
    attractionType: 'nature',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 65000,
    visitDuration: '3-5 heures',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Lémuriens catta', 'Formations rocheuses', 'Prairies immenses', 'Guide local', 'Caméléons', 'Vue panoramique'],
    rating: 4.7,
    reviewCount: 345,
    isFeatured: true,
    latitude: -22.5600,
    longitude: 45.3500,
    coverImage: `${A}/isalo/parc-isalo.jpg`,
  },
  {
    name: 'Baie des Dunes',
    slug: 'baie-des-dunes',
    description: `La Baie des Dunes, située à environ 20 km de Diego-Suarez dans le nord de Madagascar, est l'une des plus belles plages sauvages du pays. Son sable blanc immaculé, ses eaux turquoise cristallines et sa côte sauvage en font un véritable paradis pour les amoureux.

La baie est entourée de grottes naturelles creusées dans la roche et de dunes de sable qui lui ont donné son nom. Les fonds marins sont spectaculaires, attirant plongeurs et amateurs de snorkeling avec une vie marine colorée et préservée.

L'accès, un peu aventureux en 4×4 ou à pied, contribue au charme de cette destination encore préservée du tourisme de masse. C'est l'endroit idéal pour une journée de détente absolue face à l'océan.`,
    shortDescription: 'Plage paradisiaque à 20 km de Diego — Sable blanc, grottes et fonds marins spectaculaires.',
    city: 'Diego-Suarez',
    region: 'Diana',
    attractionType: 'plage',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1 journée',
    bestTimeToVisit: 'Avril à Décembre',
    highlights: ['Sable blanc', 'Eaux turquoise', 'Grottes naturelles', 'Snorkeling', 'Côte sauvage', 'Accès aventureux'],
    rating: 4.6,
    reviewCount: 156,
    isFeatured: true,
    latitude: -12.1833,
    longitude: 49.3667,
    coverImage: `${A}/diego-suarez/Plage Ramena et les pirogues-444.jpg`,
  },
  {
    name: 'Réserve d\'Anja',
    slug: 'reserve-anja',
    description: `La Réserve Communautaire d'Anja, située à 15 minutes d'Ambalavao sur la RN7, est un modèle d'écotourisme communautaire et le meilleur endroit pour observer les lémuriens catta à coup sûr. Cette petite réserve de 30 hectares, gérée par les villageois, est accessible de jour comme de nuit.

Les caméléons, lémuriens, insectes multicolores et oiseaux endémiques peuplent cette réserve qui offre de nombreuses opportunités photos. Les lémuriens catta, habitués à la présence humaine, se laissent facilement approcher.

Ce qui rend Anja unique, c'est son modèle : les revenus du tourisme bénéficient directement aux 1 800 habitants des villages environnants, finançant écoles et dispensaires. Visiter Anja, c'est contribuer à la conservation tout en soutenant les communautés locales.`,
    shortDescription: 'Écotourisme communautaire — Lémuriens catta garantis et conservation locale exemplaire.',
    city: 'Ambalavao',
    region: 'Haute Matsiatra',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 25000,
    visitDuration: '1-3 heures',
    bestTimeToVisit: 'Toute l\'année, tôt le matin ou fin d\'après-midi',
    highlights: ['Lémuriens catta', 'Écotourisme', 'Caméléons', 'Visite nocturne', 'Photos garanties', 'Communauté locale'],
    rating: 4.6,
    reviewCount: 534,
    isFeatured: true,
    latitude: -21.8500,
    longitude: 46.9333,
    coverImage: `${A}/faune-flore/Faune de Madagascar-12.jpg`,
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

    // Step 1: Approve ALL existing attractions
    const approvedCount = await prisma.establishment.updateMany({
      where: { type: 'ATTRACTION', moderationStatus: { not: 'approved' } },
      data: { moderationStatus: 'approved' },
    });
    results.push(`[APPROVE] ${approvedCount.count} attractions passées en "approved"`);

    // Step 2: Upsert the 17 incontournables
    for (const item of INCONTOURNABLES) {
      // 1) Try exact slug match first
      let existing = await prisma.establishment.findFirst({
        where: { slug: item.slug },
        include: { attraction: true },
      });

      // 2) If not found, try exact name match
      if (!existing) {
        existing = await prisma.establishment.findFirst({
          where: { type: 'ATTRACTION', name: item.name },
          include: { attraction: true },
        });
      }

      if (existing) {
        // Update existing — keep the EXISTING slug to avoid unique constraint issues
        const updateData: any = {
          name: item.name,
          description: item.description,
          shortDescription: item.shortDescription,
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
        };

        // Only update slug if it doesn't conflict
        if (existing.slug === item.slug) {
          // Same slug, no conflict
        } else {
          const slugConflict = await prisma.establishment.findFirst({
            where: { slug: item.slug, id: { not: existing.id } },
          });
          if (!slugConflict) {
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
              isAccessible: false,
              hasGuide: true,
              hasParking: item.attractionType !== 'ile',
            },
          });
        }

        results.push(`[UPDATE] ${item.name} (slug: ${existing.slug})`);
        updated++;
      } else {
        // Ensure slug is unique before creating
        let finalSlug = item.slug;
        const slugExists = await prisma.establishment.findFirst({ where: { slug: finalSlug } });
        if (slugExists) {
          finalSlug = `${item.slug}-incontournable`;
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
                isAccessible: false,
                hasGuide: true,
                hasParking: item.attractionType !== 'ile',
              },
            },
          },
        });

        results.push(`[CREATE] ${item.name} (slug: ${finalSlug})`);
        created++;
      }
    }

    // Step 3: Get final count
    const totalAttractions = await prisma.establishment.count({
      where: { type: 'ATTRACTION', isActive: true, moderationStatus: 'approved' },
    });

    const featuredCount = await prisma.establishment.count({
      where: { type: 'ATTRACTION', isFeatured: true, moderationStatus: 'approved' },
    });

    return NextResponse.json({
      success: true,
      message: `${created} créées, ${updated} mises à jour, ${approvedCount.count} approuvées`,
      created,
      updated,
      approved: approvedCount.count,
      totalAttractions,
      featuredCount,
      details: results,
    });
  } catch (error: unknown) {
    logger.error('Error seeding incontournables:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
