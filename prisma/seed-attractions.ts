import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Les 17 incontournables de Madagascar (correspondant à la landing page)
const madagascarAttractions = [
  {
    name: 'Antananarivo',
    slug: 'antananarivo',
    description: `Antananarivo, affectueusement surnommée "Tana" par ses habitants, est la vibrante capitale de Madagascar, perchée à 1 276 mètres d'altitude sur 12 collines sacrées. Cette ville de plus de 3 millions d'habitants est le cœur battant de la Grande Île, mêlant traditions ancestrales et vie urbaine moderne.

Le Rova, palais royal dominant la ville, témoigne de la grandeur du royaume Merina. Reconstruit après l'incendie de 1995, il offre une vue panoramique époustouflante sur l'ensemble de la capitale et ses rizières environnantes. À ses pieds, le quartier historique de la Haute-Ville dévoile ses ruelles pavées et ses maisons traditionnelles aux toits de tuiles rouges.

Le marché de Zoma, autrefois le plus grand marché en plein air du monde, reste un spectacle fascinant de couleurs, d'odeurs et de sons. Artisanat malgache, épices, vanille de Madagascar, pierres précieuses - tout se trouve ici. Le lac Anosy avec son monument aux morts en forme de pointe d'Ambohimanga offre un havre de paix au cœur de l'effervescence urbaine.

Antananarivo est aussi le point de départ incontournable pour explorer Madagascar : les hauts plateaux, les parcs nationaux et les côtes sont accessibles depuis la capitale.`,
    shortDescription: 'La capitale historique perchée sur 12 collines sacrées, mélange unique de culture royale Merina et de vie urbaine moderne.',
    city: 'Antananarivo',
    district: 'Analamanga',
    region: 'Analamanga',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Avril à Novembre (saison sèche)',
    highlights: ['Palais de la Reine (Rova)', 'Lac Anosy', 'Marché de Zoma', 'Haute-Ville historique', 'Musée des Pirates'],
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.2,
    reviewCount: 156,
    isFeatured: true,
    latitude: -18.8792,
    longitude: 47.5079,
  },
  {
    name: 'Nosy Be',
    slug: 'nosy-be',
    description: `Nosy Be, "la Grande Île" en malgache, est le joyau balnéaire de Madagascar, située au nord-ouest du pays dans le canal du Mozambique. Surnommée "l'île aux parfums" pour ses plantations d'ylang-ylang, de café et de cacao qui embaument l'air tropical, c'est la destination touristique la plus prisée du pays.

Ses plages de sable blanc immaculé, bordées de cocotiers, plongent dans des eaux d'un bleu turquoise hypnotique. La plage d'Andilana, régulièrement classée parmi les plus belles d'Afrique, offre un cadre idyllique pour la baignade et le farniente. Sous la surface, les récifs coralliens abritent une vie marine exceptionnelle : tortues, raies manta, requins-baleines et des centaines d'espèces de poissons tropicaux.

Le Mont Passot, point culminant de l'île à 329 mètres, offre au coucher du soleil un spectacle inoubliable sur les lacs sacrés environnants. La réserve de Lokobe, dernière forêt primaire de l'île, abrite le lémurien noir aux yeux bleus, endémique de Nosy Be.

Les îles satellites - Nosy Komba (l'île aux lémuriens), Nosy Tanikely (réserve marine) et Nosy Iranja (l'île aux tortues) - complètent ce paradis tropical. Hell-Ville, la capitale, conserve un charme colonial avec ses bâtiments historiques et son marché animé.`,
    shortDescription: 'L\'île aux parfums - Paradis tropical avec plages de sable blanc, eaux turquoise et plantations d\'ylang-ylang.',
    city: 'Hell-Ville',
    district: 'Nosy Be',
    region: 'Diana',
    attractionType: 'ile',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '4-7 jours',
    bestTimeToVisit: 'Avril à Décembre (saison sèche)',
    highlights: ['Plage d\'Andilana', 'Mont Passot', 'Nosy Tanikely', 'Réserve de Lokobe', 'Nosy Komba', 'Plantations d\'ylang-ylang'],
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.7,
    reviewCount: 423,
    isFeatured: true,
    latitude: -13.4167,
    longitude: 48.2667,
  },
  {
    name: 'Allée des Baobabs',
    slug: 'allee-des-baobabs',
    description: `L'Allée des Baobabs est sans conteste l'image la plus iconique de Madagascar, un symbole mondialement reconnu de la Grande Île. Située sur la route reliant Morondava à Belon'i Tsiribihina dans la région du Menabe, cette avenue extraordinaire est bordée d'une vingtaine de baobabs Grandidier (Adansonia grandidieri), les plus imposants et les plus majestueux des huit espèces de baobabs au monde.

Ces géants millénaires, certains âgés de plus de 800 ans, s'élèvent jusqu'à 30 mètres de hauteur avec des troncs pouvant atteindre 11 mètres de circonférence. Leur silhouette caractéristique - un tronc massif surmonté de branches ressemblant à des racines - leur vaut le surnom d'"arbres à l'envers", selon la légende malgache qui raconte que Dieu les aurait plantés la tête en bas.

Le moment magique se produit au coucher du soleil, quand les rayons dorés transforment ces colosses en ombres majestueuses se découpant sur un ciel embrasé d'orange et de rose. C'est l'heure où photographes du monde entier capturent cette scène mythique.

Non loin, les "Baobabs Amoureux" - deux arbres entrelacés - sont devenus un symbole romantique. La région abrite également le "Baobab Sacré", un arbre géant vénéré par les locaux qui y déposent des offrandes.`,
    shortDescription: 'Avenue mythique bordée de baobabs millénaires - Le coucher de soleil le plus photographié de Madagascar.',
    city: 'Morondava',
    district: 'Menabe',
    region: 'Menabe',
    attractionType: 'monument_naturel',
    isFree: false,
    entryFeeLocal: 5000,
    entryFeeForeign: 25000,
    visitDuration: '2-3 heures',
    bestTimeToVisit: 'Avril à Novembre, idéalement au coucher de soleil',
    highlights: ['Baobabs Grandidier de 800 ans', 'Coucher de soleil magique', 'Baobabs Amoureux', 'Baobab Sacré', 'Photographie iconique'],
    openingHours: { lundi: '06:00-18:30', mardi: '06:00-18:30', mercredi: '06:00-18:30', jeudi: '06:00-18:30', vendredi: '06:00-18:30', samedi: '06:00-18:30', dimanche: '06:00-18:30' },
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.9,
    reviewCount: 892,
    isFeatured: true,
    latitude: -20.2510,
    longitude: 44.4189,
  },
  {
    name: 'Parc National de l\'Isalo',
    slug: 'parc-isalo',
    description: `Le Parc National de l'Isalo est le joyau géologique de Madagascar, souvent comparé au Grand Canyon américain ou au Colorado. Situé dans la région d'Ihorombe au sud du pays, ce massif de grès ruiniforme de 81 540 hectares offre des paysages à couper le souffle : canyons profonds, formations rocheuses sculptées par des millions d'années d'érosion, piscines naturelles cristallines et une végétation étonnamment variée.

Le parc le plus visité de Madagascar doit sa renommée à la diversité de ses randonnées. Le Canyon des Makis permet d'observer les fameux lémuriens catta avec leurs queues annelées noir et blanc. La Piscine Naturelle, nichée au fond d'un canyon verdoyant, offre une baignade rafraîchissante après une marche sous le soleil. La Piscine Bleue et la Piscine Noire complètent ces oasis de fraîcheur.

La Fenêtre de l'Isalo est le spot incontournable au coucher du soleil : cette arche naturelle encadre parfaitement le disque solaire disparaissant à l'horizon, créant une photo emblématique. Le Canyon des Rats et le Canyon Namaza offrent des randonnées plus sportives avec des paysages lunaires.

La faune est remarquable : 82 espèces d'oiseaux, 33 espèces de reptiles, 14 espèces de mammifères dont 6 lémuriens (sifaka de Verreaux, lémurien catta). La flore inclut des pachypodiums (pieds d'éléphant) et l'aloès de l'Isalo.`,
    shortDescription: 'Le Colorado malgache - Canyons spectaculaires, piscines naturelles et lémuriens dans un décor de western.',
    city: 'Ranohira',
    district: 'Ihorombe',
    region: 'Ihorombe',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 65000,
    visitDuration: '1-3 jours',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Piscine Naturelle', 'Fenêtre de l\'Isalo', 'Canyon des Makis', 'Lémuriens catta', 'Formations de grès', 'Coucher de soleil'],
    openingHours: { lundi: '07:00-16:00', mardi: '07:00-16:00', mercredi: '07:00-16:00', jeudi: '07:00-16:00', vendredi: '07:00-16:00', samedi: '07:00-16:00', dimanche: '07:00-16:00' },
    isAccessible: false,
    hasGuide: true,
    hasParking: true,
    rating: 4.8,
    reviewCount: 1247,
    isFeatured: true,
    latitude: -22.5500,
    longitude: 45.3667,
  },
  {
    name: 'Tsingy de Bemaraha',
    slug: 'tsingy-bemaraha',
    description: `Les Tsingy de Bemaraha constituent l'un des paysages les plus extraordinaires de la planète, inscrit au patrimoine mondial de l'UNESCO depuis 1990. Ce labyrinthe minéral de 157 710 hectares dans la région du Melaky présente un spectacle géologique unique : des forêts d'aiguilles calcaires acérées, sculptées par l'érosion depuis 200 millions d'années, formant une cathédrale de pierre à perte de vue.

Le mot "tsingy" vient du malgache signifiant "là où l'on ne peut marcher pieds nus" - les arêtes calcaires sont si tranchantes qu'elles découperaient instantanément la peau. Les Grands Tsingy offrent les formations les plus spectaculaires avec des pitons pouvant atteindre 45 mètres de hauteur. Les Petits Tsingy, plus accessibles, permettent une première immersion dans ce monde minéral.

L'exploration est une véritable aventure : ponts suspendus au-dessus du vide, via ferrata sur les parois verticales, passages dans des grottes et des canyons étroits. Le vertige fait partie de l'expérience ! Les guides locaux, véritables acrobates, vous accompagnent à travers ce parcours d'obstacles naturel.

Entre les aiguilles de pierre, une forêt sèche abrite 11 espèces de lémuriens dont le sifaka de Decken aux sauts spectaculaires, des caméléons géants et des fossas, le plus grand prédateur de Madagascar. La descente en pirogue dans les gorges de la rivière Manambolo complète l'aventure.`,
    shortDescription: 'Cathédrale de calcaire UNESCO - Aiguilles de 45m, ponts suspendus et via ferrata dans un paysage lunaire.',
    city: 'Bekopaka',
    district: 'Melaky',
    region: 'Melaky',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 35000,
    entryFeeForeign: 75000,
    visitDuration: '2-3 jours',
    bestTimeToVisit: 'Mai à Novembre (routes fermées en saison des pluies)',
    highlights: ['Grands Tsingy', 'Petits Tsingy', 'Ponts suspendus', 'Via ferrata', 'Gorges de Manambolo', 'Sifaka de Decken'],
    openingHours: { lundi: '07:00-16:00', mardi: '07:00-16:00', mercredi: '07:00-16:00', jeudi: '07:00-16:00', vendredi: '07:00-16:00', samedi: '07:00-16:00', dimanche: '07:00-16:00' },
    isAccessible: false,
    hasGuide: true,
    hasParking: true,
    rating: 4.9,
    reviewCount: 567,
    isFeatured: true,
    latitude: -19.1333,
    longitude: 44.8167,
  },
  {
    name: 'Île Sainte-Marie',
    slug: 'ile-sainte-marie',
    description: `L'Île Sainte-Marie (Nosy Boraha en malgache) est un paradis tropical de 63 km de long sur la côte est de Madagascar, bercée par les eaux de l'océan Indien. Cette ancienne terre de pirates est aujourd'hui mondialement célèbre pour un spectacle naturel exceptionnel : la migration des baleines à bosse de juillet à septembre.

Chaque année, plusieurs milliers de ces géants des mers viennent se reproduire et mettre bas dans les eaux chaudes et protégées autour de l'île. Observer une baleine de 15 mètres bondir hors de l'eau ou voir une mère allaiter son baleineau est une expérience inoubliable. Des excursions en bateau permettent d'approcher respectueusement ces majestueux cétacés.

L'histoire de Sainte-Marie est intimement liée aux pirates qui l'utilisaient comme base au XVIIe et XVIIIe siècles. Le cimetière des pirates, où reposent des forbans célèbres, témoigne de cette époque. La légende veut que des trésors restent enfouis sur l'île !

Les plages de sable blanc, bordées de cocotiers, invitent à la détente. Les récifs coralliens offrent des spots de plongée et snorkeling remarquables. La forêt tropicale abrite des orchidées sauvages, des caméléons et des lémuriens. L'Île aux Nattes (Nosy Nato), accessible en pirogue, est un bijou de tranquillité avec ses plages désertes.`,
    shortDescription: 'Sanctuaire des baleines à bosse (juil-sept) - Île paradisiaque avec histoire de pirates et plages désertes.',
    city: 'Ambodifotatra',
    district: 'Analanjirofo',
    region: 'Analanjirofo',
    attractionType: 'ile',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '3-5 jours',
    bestTimeToVisit: 'Juillet à Septembre pour les baleines',
    highlights: ['Baleines à bosse', 'Cimetière des pirates', 'Île aux Nattes', 'Plongée sous-marine', 'Plages paradisiaques', 'Orchidées sauvages'],
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.7,
    reviewCount: 678,
    isFeatured: true,
    latitude: -17.0000,
    longitude: 49.8500,
  },
  {
    name: 'Andasibe-Mantadia',
    slug: 'andasibe-mantadia',
    description: `Le Parc National d'Andasibe-Mantadia est le sanctuaire du plus grand lémurien vivant : l'Indri-Indri (Babakoto). À seulement 3 heures de route d'Antananarivo, cette forêt tropicale humide de 15 480 hectares offre la rencontre la plus émouvante avec la faune malgache.

L'Indri-Indri, mesurant jusqu'à 70 cm et pesant 9 kg, est reconnaissable à son pelage noir et blanc et surtout à son cri envoûtant - un chant territorial qui résonne à travers la forêt et peut s'entendre à 4 km à la ronde. Ce son, décrit comme le plus beau de la nature malgache, est un moment de pure émotion. L'Indri ne survit pas en captivité, le voir ici est donc unique au monde.

Le parc abrite 11 espèces de lémuriens au total, dont le propithèque à diadème, le lémurien bambou gris et le vari roux. La forêt primaire est aussi le royaume de 117 espèces d'oiseaux, 84 espèces de reptiles et d'amphibiens, et d'innombrables orchidées - plus de 100 espèces dont la célèbre orchidée noire.

La réserve de Vakôna, à proximité, permet des rencontres rapprochées avec des lémuriens semi-apprivoisés sur l'Île aux Lémuriens. Les visites nocturnes révèlent un autre monde : lémuriens nocturnes aux grands yeux, caméléons endormis sur les branches et grenouilles multicolores.`,
    shortDescription: 'Royaume de l\'Indri-Indri - Forêt tropicale avec le plus grand lémurien et son cri légendaire.',
    city: 'Andasibe',
    district: 'Alaotra-Mangoro',
    region: 'Alaotra-Mangoro',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 55000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Septembre à Janvier (saison chaude)',
    highlights: ['Indri-Indri', 'Cri territorial unique', 'Forêt tropicale', 'Visite nocturne', 'Orchidées sauvages', 'Île aux Lémuriens'],
    openingHours: { lundi: '06:00-16:00', mardi: '06:00-16:00', mercredi: '06:00-16:00', jeudi: '06:00-16:00', vendredi: '06:00-16:00', samedi: '06:00-16:00', dimanche: '06:00-16:00' },
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.8,
    reviewCount: 956,
    isFeatured: true,
    latitude: -18.9333,
    longitude: 48.4167,
  },
  {
    name: 'Diego Suarez',
    slug: 'diego-suarez',
    description: `Diego Suarez (Antsiranana), nichée au fond de la deuxième plus grande baie du monde après Rio de Janeiro, est la perle du nord de Madagascar. Cette ville cosmopolite, à l'héritage français marqué, est le point de départ d'explorations extraordinaires dans une région aux paysages d'une diversité stupéfiante.

La baie de Diego, longue de 156 km, offre des eaux calmes d'un bleu profond, encadrées par des collines verdoyantes. Le Pain de Sucre, formation rocheuse emblématique dressée au milieu des eaux, évoque son célèbre homologue de Rio. La Mer d'Émeraude, un lagon aux eaux turquoise accessibles en bateau, invite à la baignade et au snorkeling dans un décor de carte postale.

Les Tsingy Rouges, à 1h30 de route, présentent un spectacle géologique unique : des formations d'argile rouge sculptées par l'érosion en aiguilles et cathédrales aux teintes flamboyantes, surtout au lever ou coucher du soleil. Un paysage martien sur Terre !

Le Parc National de la Montagne d'Ambre, forêt de montagne à 30 km de la ville, abrite des cascades majestueuses, une biodiversité exceptionnelle et le plus petit caméléon du monde. Les plages de Ramena et les Trois Baies offrent farniente et sports nautiques.`,
    shortDescription: 'La 2ème plus belle baie du monde - Pain de Sucre, Mer d\'Émeraude et Tsingy Rouges.',
    city: 'Antsiranana',
    district: 'Diana',
    region: 'Diana',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '3-5 jours',
    bestTimeToVisit: 'Avril à Décembre',
    highlights: ['Pain de Sucre', 'Mer d\'Émeraude', 'Tsingy Rouges', 'Montagne d\'Ambre', 'Plage de Ramena', 'Trois Baies'],
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.6,
    reviewCount: 512,
    isFeatured: true,
    latitude: -12.2765,
    longitude: 49.2917,
  },
  {
    name: 'Parc de Ranomafana',
    slug: 'parc-ranomafana',
    description: `Le Parc National de Ranomafana, dont le nom signifie "eau chaude" en malgache, est l'un des joyaux de la biodiversité mondiale, inscrit au patrimoine de l'UNESCO. Cette forêt tropicale humide de 41 600 hectares, située à 400 km au sud-est d'Antananarivo, est célèbre pour la découverte en 1986 du lémurien bambou doré, espèce alors inconnue de la science.

La forêt primaire, drapée de brumes matinales, abrite 12 espèces de lémuriens, dont le lémurien bambou doré (Hapalemur aureus) au pelage roux doré, le propithèque de Milne-Edwards et le microcèbe roux, le plus petit primate du monde. Les cascades qui dévalent les pentes montagneuses créent une symphonie permanente, accompagnée des cris des lémuriens et du chant des 115 espèces d'oiseaux.

Les sources thermales naturelles qui ont donné leur nom au parc invitent à la détente après une randonnée dans la forêt. L'eau, chauffée par l'activité volcanique souterraine, jaillit à 38°C et possède des vertus thérapeutiques reconnues. Les thermes, aménagés non loin du parc, offrent un moment de relaxation bien mérité.

Les visites nocturnes révèlent un monde fascinant : les lémuriens aux grands yeux, les caméléons changeant de couleurs et les grenouilles aux couleurs vives. Le Centre ValBio, station de recherche internationale, mène des études cruciales pour la conservation.`,
    shortDescription: 'Forêt tropicale UNESCO - Sources chaudes et habitat du rare lémurien bambou doré découvert en 1986.',
    city: 'Ranomafana',
    district: 'Vatovavy-Fitovinany',
    region: 'Vatovavy-Fitovinany',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 65000,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Septembre à Décembre',
    highlights: ['Lémurien bambou doré', 'Sources thermales', 'Cascades', 'Forêt primaire', 'Visite nocturne', '12 espèces de lémuriens'],
    openingHours: { lundi: '06:00-16:00', mardi: '06:00-16:00', mercredi: '06:00-16:00', jeudi: '06:00-16:00', vendredi: '06:00-16:00', samedi: '06:00-16:00', dimanche: '06:00-16:00' },
    isAccessible: false,
    hasGuide: true,
    hasParking: true,
    rating: 4.7,
    reviewCount: 834,
    isFeatured: true,
    latitude: -21.2500,
    longitude: 47.4167,
  },
  {
    name: 'Canal des Pangalanes',
    slug: 'canal-pangalanes',
    description: `Le Canal des Pangalanes est l'une des voies navigables les plus extraordinaires du monde : un réseau de lagunes, lacs et canaux artificiels s'étendant sur près de 600 km le long de la côte est de Madagascar, de Tamatave (Toamasina) à Farafangana. Créé à l'époque coloniale française entre 1896 et 1904, il constituait une alternative aux dangers de l'océan Indien.

Naviguer sur les Pangalanes est une expérience hors du temps. Les pirogues traditionnelles (lakana) glissent silencieusement entre les parois de végétation tropicale luxuriante. Des villages de pêcheurs Betsimisaraka apparaissent au détour d'un méandre, leurs maisons sur pilotis reflétées dans les eaux calmes. Le temps s'écoule au rythme des pagaies et des chants des rameurs.

La vie quotidienne des communautés riveraines se dévoile : pêcheurs lançant leurs filets, femmes lavant le linge, enfants jouant dans l'eau, pirogues chargées de régimes de bananes ou de café. C'est la Madagascar authentique, loin des circuits touristiques classiques.

La faune est remarquable : crocodiles du Nil se prélassant sur les berges, lémuriens dans les arbres, martins-pêcheurs aux couleurs vives, hérons et aigrettes. Les orchidées sauvages et les plantes carnivores parsèment les rives. La nuit, le concert des grenouilles est assourdissant.`,
    shortDescription: '600 km de voie navigable côtière - Villages de pêcheurs, pirogues et mangroves dans une Madagascar authentique.',
    city: 'Toamasina',
    district: 'Atsinanana',
    region: 'Atsinanana',
    attractionType: 'nature',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '2-4 jours',
    bestTimeToVisit: 'Avril à Décembre',
    highlights: ['Navigation en pirogue', 'Villages Betsimisaraka', 'Mangroves', 'Crocodiles', 'Vie locale authentique', 'Pêcheurs traditionnels'],
    isAccessible: false,
    hasGuide: true,
    hasParking: true,
    rating: 4.5,
    reviewCount: 287,
    isFeatured: false,
    latitude: -18.1500,
    longitude: 49.4000,
  },
  {
    name: 'Ifaty & Tuléar',
    slug: 'ifaty-tulear',
    description: `Ifaty et Tuléar (Toliara), sur la côte sud-ouest de Madagascar, offrent un contraste saisissant entre désert et océan. Cette région, la plus sèche de l'île, présente des paysages uniques au monde : forêts épineuses de baobabs et didieracées côtoyant des lagons turquoise et des récifs coralliens préservés.

La forêt épineuse d'Ifaty est un écosystème extraterrestre : des plantes bizarres aux formes torturées, couvertes d'épines et de succulentes, ont évolué pendant des millions d'années dans des conditions extrêmes. L'Arboretum d'Antsokay présente plus de 900 espèces de plantes dont 90% sont endémiques de Madagascar. On y croise des baobabs bouteilles, des pachypodiums et le célèbre pieuvre du désert.

Le lagon d'Ifaty, protégé par une barrière de corail de 18 km, est un paradis pour la plongée et le snorkeling. Les eaux cristallines abritent plus de 400 espèces de poissons, des tortues marines, des raies et des dauphins. Les Vezo, peuple de la mer vivant de la pêche depuis des générations, naviguent sur leurs pirogues à balancier au milieu des bancs de thons.

Les couchers de soleil sur le canal du Mozambique sont parmi les plus beaux au monde. À Anakao, village de pêcheurs au sud, les plages de sable blanc immaculé offrent une tranquillité absolue.`,
    shortDescription: 'Récifs coralliens et forêt épineuse - Plongée dans des eaux turquoise et paysages de baobabs uniques.',
    city: 'Toliara',
    district: 'Atsimo-Andrefana',
    region: 'Atsimo-Andrefana',
    attractionType: 'plage',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '3-5 jours',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Récif corallien', 'Forêt épineuse', 'Plongée sous-marine', 'Pêcheurs Vezo', 'Baobabs bouteilles', 'Coucher de soleil'],
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.6,
    reviewCount: 423,
    isFeatured: true,
    latitude: -23.1500,
    longitude: 43.6500,
  },
  {
    name: 'Massif de l\'Andringitra',
    slug: 'massif-andringitra',
    description: `Le Parc National de l'Andringitra est le paradis des randonneurs et alpinistes, abritant le Pic Boby (Pic Imarivolanitra) qui culmine à 2 658 mètres - le deuxième plus haut sommet de Madagascar. Ce massif granitique de 31 160 hectares, classé patrimoine UNESCO, offre des paysages d'une beauté sauvage et des défis sportifs à la hauteur de sa réputation.

L'ascension du Pic Boby est l'aventure ultime à Madagascar. Le sentier traverse des forêts de brume, des prairies d'altitude parsemées de fleurs sauvages et des rochers sculptés par le vent. Au sommet, la vue à 360° embrasse les hauts plateaux, les vallées verdoyantes et, par temps clair, l'océan Indien. Les températures peuvent descendre sous zéro la nuit - c'est le seul endroit de Madagascar où il peut neiger !

Le plateau d'Andohariana, vaste étendue herbeuse à 2 000 m d'altitude, évoque les hautes terres écossaises. La vallée de Tsaranoro, avec ses falaises de 800 m de dénivelé, attire les grimpeurs du monde entier pour ses voies d'escalade exceptionnelles.

Les rizières en terrasses de la région Betsileo, sculptant les flancs des montagnes, créent un paysage agricole d'une beauté incomparable. Les villages traditionnels aux maisons de terre ocre ponctuent ce décor montagnard. Le lémurien catta et le sifaka de Verreaux peuplent les forêts d'altitude.`,
    shortDescription: 'Pic Boby 2 658m, 2ème sommet de Madagascar - Trekking alpin et rizières en terrasses spectaculaires.',
    city: 'Ambalavao',
    district: 'Haute Matsiatra',
    region: 'Haute Matsiatra',
    attractionType: 'montagne',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 65000,
    visitDuration: '2-4 jours',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Pic Boby 2658m', 'Vallée de Tsaranoro', 'Escalade', 'Rizières en terrasses', 'Plateau d\'Andohariana', 'Lever de soleil au sommet'],
    openingHours: { lundi: '06:00-16:00', mardi: '06:00-16:00', mercredi: '06:00-16:00', jeudi: '06:00-16:00', vendredi: '06:00-16:00', samedi: '06:00-16:00', dimanche: '06:00-16:00' },
    isAccessible: false,
    hasGuide: true,
    hasParking: true,
    rating: 4.8,
    reviewCount: 312,
    isFeatured: true,
    latitude: -22.2167,
    longitude: 46.9500,
  },
  {
    name: 'Fort Dauphin',
    slug: 'fort-dauphin',
    description: `Fort-Dauphin (Tôlanaro), à l'extrême sud-est de Madagascar, est une destination où la nature a façonné des paysages d'une diversité extraordinaire. Montagnes plongeant dans l'océan, plages sauvages battues par les rouleaux de l'océan Indien, forêts littorales uniques et réserves naturelles : c'est Madagascar dans toute sa splendeur brute.

La ville, fondée par les Français en 1643, conserve des vestiges de son passé colonial. Le Fort Flacourt, premier établissement français sur la Grande Île, domine la baie. Mais c'est la nature environnante qui fait la renommée de Fort-Dauphin.

Le Pic Saint-Louis (529 m) offre une randonnée accessible avec une vue spectaculaire sur la presqu'île et l'océan. La Réserve de Nahampoana, à 7 km de la ville, permet des rencontres intimes avec des lémuriens semi-apprivoisés dans un jardin botanique luxuriant parsemé de cascades.

Le Parc National d'Andohahela, unique au monde, juxtapose forêt tropicale humide et forêt épineuse sèche de chaque côté d'une crête montagneuse - deux écosystèmes radicalement différents à quelques kilomètres de distance. La baie de Lokaro et ses eaux cristallines, accessibles en bateau, invitent au snorkeling et à la baignade. Evatra et ses plages de surf sauvages attirent les amateurs de vagues.`,
    shortDescription: 'Extrême Sud entre montagnes et océan - Pic Saint-Louis, réserves naturelles et surf sur des plages sauvages.',
    city: 'Tôlanaro',
    district: 'Anosy',
    region: 'Anosy',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '3-5 jours',
    bestTimeToVisit: 'Avril à Décembre',
    highlights: ['Réserve Nahampoana', 'Pic Saint-Louis', 'Surf à Evatra', 'Baie de Lokaro', 'Parc d\'Andohahela', 'Fort Flacourt'],
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.4,
    reviewCount: 234,
    isFeatured: false,
    latitude: -25.0167,
    longitude: 46.9833,
  },
  {
    name: 'Parc National de Masoala',
    slug: 'parc-masoala',
    description: `Le Parc National de Masoala est la plus grande aire protégée de Madagascar avec 240 000 hectares de forêt tropicale primaire intacte sur la presqu'île du même nom, au nord-est du pays. C'est l'un des derniers grands espaces sauvages de la planète, où la nature règne encore en maître absolu.

Cette forêt pluviale, arrosée par plus de 6 000 mm de précipitations annuelles, est l'une des plus riches en biodiversité au monde. Elle abrite 10 espèces de lémuriens dont le mythique Aye-Aye aux doigts squelettiques et le vari roux endémique de la région. Plus de 100 espèces d'oiseaux, 60 espèces de reptiles et des milliers d'invertébrés peuplent ce sanctuaire.

L'accès au parc est une aventure en soi : plusieurs heures de bateau depuis Maroantsetra à travers la baie d'Antongil, puis des sentiers boueux à travers la jungle. C'est précisément cet isolement qui a préservé Masoala des dégradations.

Le kayak de mer le long des côtes rocheuses révèle des plages désertes où les tortues marines viennent pondre. Les récifs coralliens des parcs marins de Nosy Mangabe, Tampolo et Cap Masoala offrent une plongée dans un monde sous-marin préservé. L'île de Nosy Mangabe, réserve spéciale, est le meilleur endroit au monde pour observer l'Aye-Aye en milieu naturel.`,
    shortDescription: 'Plus grande forêt tropicale de Madagascar - Refuge de l\'Aye-Aye et kayak dans des baies vierges.',
    city: 'Maroantsetra',
    district: 'Analanjirofo',
    region: 'Analanjirofo',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 35000,
    entryFeeForeign: 75000,
    visitDuration: '3-5 jours',
    bestTimeToVisit: 'Septembre à Décembre',
    highlights: ['Aye-Aye', 'Forêt primaire', 'Kayak de mer', 'Nosy Mangabe', 'Vari roux', 'Plages désertes'],
    openingHours: { lundi: '06:00-16:00', mardi: '06:00-16:00', mercredi: '06:00-16:00', jeudi: '06:00-16:00', vendredi: '06:00-16:00', samedi: '06:00-16:00', dimanche: '06:00-16:00' },
    isAccessible: false,
    hasGuide: true,
    hasParking: false,
    rating: 4.9,
    reviewCount: 167,
    isFeatured: false,
    latitude: -15.4333,
    longitude: 50.0000,
  },
  {
    name: 'Fianarantsoa',
    slug: 'fianarantsoa',
    description: `Fianarantsoa, "là où l'on apprend le bien" en malgache, est la capitale culturelle et intellectuelle de Madagascar, perchée à 1 200 mètres d'altitude au cœur du pays Betsileo. Cette ville de caractère, souvent appelée la "ville des mille églises", est célèbre pour sa vieille ville pittoresque et le légendaire train FCE.

La Haute-Ville (Antanambao), quartier historique aux ruelles pavées et aux maisons coloniales, offre une atmosphère hors du temps. Ses 500 marches mènent à un panorama époustouflant sur les collines environnantes tapissées de rizières en terrasses. Les nombreuses églises témoignent de l'influence missionnaire : cathédrale catholique, temples protestants, chaque dénomination a son édifice.

Le train FCE (Fianarantsoa-Côte Est) est une expérience unique au monde. Cette ligne ferroviaire de 163 km, construite entre 1926 et 1936, serpente à travers 67 tunnels et 67 ponts, descendant de 1 200 m d'altitude jusqu'à la côte est. Le voyage de 12 heures (officiellement !) traverse des paysages à couper le souffle : forêts, cascades, villages isolés accessibles uniquement par le rail.

La région de Fianarantsoa est aussi le terroir viticole de Madagascar. Les vignobles de haute altitude produisent des vins étonnants, héritage de moines suisses. La visite des caves et la dégustation sont incontournables.`,
    shortDescription: 'Capitale culturelle et légendaire train FCE - Vieille ville historique et vignobles de haute altitude.',
    city: 'Fianarantsoa',
    district: 'Haute Matsiatra',
    region: 'Haute Matsiatra',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Train FCE légendaire', 'Haute-Ville historique', 'Vignobles', 'Rizières en terrasses', 'Cathédrale', 'Vue panoramique'],
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.3,
    reviewCount: 278,
    isFeatured: false,
    latitude: -21.4333,
    longitude: 47.0833,
  },
  {
    name: 'Antsirabe',
    slug: 'antsirabe',
    description: `Antsirabe, la "ville où il y a beaucoup de sel" (référence aux sources minérales), est une charmante station thermale des hauts plateaux à 1 500 mètres d'altitude, à 170 km au sud d'Antananarivo. Surnommée la "Vichy malgache", elle est célèbre pour ses pousse-pousse colorés, ses lacs de cratère et son artisanat réputé.

Les pousse-pousse d'Antsirabe sont une institution ! Ces rickshaws traditionnels aux couleurs vives, tirés par des conducteurs enthousiastes, sont le moyen de transport emblématique de la ville. Une balade en pousse-pousse à travers les larges avenues bordées d'arbres est un moment de pur bonheur nostalgique.

Le Lac Tritriva, à 15 km de la ville, est un bijou naturel niché dans un ancien cratère volcanique. Ses eaux d'un bleu profond, entourées de falaises vertigineuses couvertes de végétation, sont auréolées de légendes romantiques : on raconte que deux amants maudits s'y seraient noyés, se transformant en arbres entrelacés au bord du lac.

Antsirabe est aussi la capitale de l'artisanat malgache. Les ateliers de miniatures en corne de zébu, de broderie, de tissage et de pierres précieuses sont ouverts aux visiteurs. La fabrique de bonbons à la sève de copaïer et les brasseries artisanales (la THB y est née) complètent la visite.`,
    shortDescription: 'La Vichy malgache - Pousse-pousse colorés, lac Tritriva dans un cratère et artisanat renommé.',
    city: 'Antsirabe',
    district: 'Vakinankaratra',
    region: 'Vakinankaratra',
    attractionType: 'ville',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1-2 jours',
    bestTimeToVisit: 'Toute l\'année',
    highlights: ['Pousse-pousse colorés', 'Lac Tritriva', 'Artisanat', 'Sources thermales', 'Lac Andraikiba', 'Ateliers de miniatures'],
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.4,
    reviewCount: 356,
    isFeatured: false,
    latitude: -19.8667,
    longitude: 47.0333,
  },
  {
    name: 'Réserve d\'Anja',
    slug: 'reserve-anja',
    description: `La Réserve Communautaire d'Anja est un modèle d'écotourisme communautaire et le meilleur endroit de Madagascar pour observer les lémuriens catta (Maki) à coup sûr. Située à seulement 12 km d'Ambalavao sur la RN7, cette petite réserve de 30 hectares gérée par les villageois abrite une population florissante de plus de 400 lémuriens catta.

Les lémuriens catta, reconnaissables à leur queue annelée noir et blanc et leurs grands yeux orange cerclés de noir, sont les stars incontestées d'Anja. Habitués à la présence humaine, ils se laissent approcher et photographier facilement, offrant des rencontres mémorables. Les voir sauter de rocher en rocher, queue dressée comme un point d'interrogation, est un spectacle fascinant.

La réserve est dominée par trois massifs rocheux ("Les Trois Sœurs") aux formes étranges, sacrés pour les Betsileo. Des grottes utilisées jadis comme refuges et des tombeaux ancestraux parsèment le paysage. La forêt abrite aussi des caméléons, des serpents et de nombreux oiseaux.

Ce qui rend Anja unique, c'est son modèle de conservation : les revenus du tourisme bénéficient directement aux 1 800 habitants des villages environnants, finançant écoles, dispensaires et projets de développement. Visiter Anja, c'est contribuer concrètement à la préservation des lémuriens tout en soutenant les communautés locales.`,
    shortDescription: 'Écotourisme communautaire - Plus de 400 lémuriens catta garantis et conservation locale exemplaire.',
    city: 'Ambalavao',
    district: 'Haute Matsiatra',
    region: 'Haute Matsiatra',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 25000,
    visitDuration: '1-3 heures',
    bestTimeToVisit: 'Toute l\'année, tôt le matin ou fin d\'après-midi',
    highlights: ['400+ lémuriens catta', 'Écotourisme communautaire', 'Les Trois Sœurs', 'Caméléons', 'Grottes sacrées', 'Visite guidée'],
    openingHours: { lundi: '07:00-17:00', mardi: '07:00-17:00', mercredi: '07:00-17:00', jeudi: '07:00-17:00', vendredi: '07:00-17:00', samedi: '07:00-17:00', dimanche: '07:00-17:00' },
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.6,
    reviewCount: 534,
    isFeatured: true,
    latitude: -21.8500,
    longitude: 46.9333,
  },
];

async function seedAttractions() {
  console.log('🌴 Seeding les 17 destinations incontournables de Madagascar...');
  console.log('');

  for (const attraction of madagascarAttractions) {
    const existing = await prisma.establishment.findFirst({
      where: { slug: attraction.slug },
    });

    if (existing) {
      // Mettre à jour l'attraction existante avec les nouvelles données
      await prisma.establishment.update({
        where: { id: existing.id },
        data: {
          name: attraction.name,
          description: attraction.description,
          shortDescription: attraction.shortDescription,
          city: attraction.city,
          district: attraction.district,
          region: attraction.region,
          rating: attraction.rating,
          reviewCount: attraction.reviewCount,
          isFeatured: attraction.isFeatured,
          latitude: attraction.latitude,
          longitude: attraction.longitude,
          coverImage: `/images/Attractions/${attraction.slug}.jpg`,
          images: JSON.stringify([
            `/images/Attractions/${attraction.slug}-1.jpg`,
            `/images/Attractions/${attraction.slug}-2.jpg`,
            `/images/Attractions/${attraction.slug}-3.jpg`,
          ]),
        },
      });

      await prisma.attraction.update({
        where: { establishmentId: existing.id },
        data: {
          attractionType: attraction.attractionType,
          isFree: attraction.isFree,
          entryFeeLocal: attraction.entryFeeLocal,
          entryFeeForeign: attraction.entryFeeForeign,
          visitDuration: attraction.visitDuration,
          bestTimeToVisit: attraction.bestTimeToVisit,
          highlights: JSON.stringify(attraction.highlights),
          isAccessible: attraction.isAccessible,
          hasGuide: attraction.hasGuide,
          hasParking: attraction.hasParking,
        },
      });

      console.log(`  ✏️  Updated: ${attraction.name}`);
      continue;
    }

    await prisma.establishment.create({
      data: {
        name: attraction.name,
        slug: attraction.slug,
        description: attraction.description,
        shortDescription: attraction.shortDescription,
        city: attraction.city,
        district: attraction.district,
        region: attraction.region,
        type: 'ATTRACTION',
        rating: attraction.rating,
        reviewCount: attraction.reviewCount,
        isFeatured: attraction.isFeatured,
        isActive: true,
        latitude: attraction.latitude,
        longitude: attraction.longitude,
        coverImage: `/images/Attractions/${attraction.slug}.jpg`,
        images: JSON.stringify([
          `/images/Attractions/${attraction.slug}-1.jpg`,
          `/images/Attractions/${attraction.slug}-2.jpg`,
          `/images/Attractions/${attraction.slug}-3.jpg`,
        ]),
        attraction: {
          create: {
            attractionType: attraction.attractionType,
            isFree: attraction.isFree,
            entryFeeLocal: attraction.entryFeeLocal,
            entryFeeForeign: attraction.entryFeeForeign,
            visitDuration: attraction.visitDuration,
            bestTimeToVisit: attraction.bestTimeToVisit,
            highlights: JSON.stringify(attraction.highlights),
            isAccessible: attraction.isAccessible,
            hasGuide: attraction.hasGuide,
            hasParking: attraction.hasParking,
          },
        },
      },
    });

    console.log(`  ✅ Created: ${attraction.name}`);
  }

  console.log('');
  console.log('🎉 Seeding terminé ! 17 destinations ajoutées.');
  console.log('');
  console.log('📍 Liste des destinations:');
  madagascarAttractions.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.name} (${a.city})`);
  });
}

seedAttractions()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { madagascarAttractions };
