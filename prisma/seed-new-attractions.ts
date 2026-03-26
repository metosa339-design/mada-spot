import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nouvelles attractions à ajouter depuis le PDF
const newAttractions = [
  {
    name: 'Parc National de la Montagne d\'Ambre',
    slug: 'montagne-ambre',
    description: `Le Parc National de la Montagne d'Ambre est un joyau de biodiversité situé à seulement 30 km au sud de Diego Suarez (Antsiranana). Ce massif volcanique culminant à 1 475 mètres offre un contraste saisissant avec les paysages arides du nord de Madagascar, abritant une forêt tropicale humide luxuriante alimentée par des sources et des cascades spectaculaires.

La Cascade Sacrée, accessible par un sentier facile de 2h, est un lieu de pèlerinage pour les populations locales. La Grande Cascade, plus impressionnante encore, nécessite une randonnée de 4h à travers une végétation dense. Le Lac Maudit, niché dans un ancien cratère, est entouré de mystères et de légendes locales.

Le parc abrite une biodiversité exceptionnelle : 77 espèces d'oiseaux dont le Courol bleu, 7 espèces de lémuriens dont le Lémurien couronné, 25 espèces de mammifères, et une incroyable diversité de caméléons dont le minuscule Brookesia, l'un des plus petits reptiles au monde.

La température fraîche (16-25°C toute l'année) et la possibilité de pluie même en saison sèche créent un microclimat unique. Les cascades sont particulièrement spectaculaires après les pluies.`,
    shortDescription: 'Forêt tropicale humide et cascades spectaculaires à 30km de Diego Suarez - Un oasis de fraîcheur dans le nord aride.',
    city: 'Antsiranana',
    district: 'Antsiranana',
    region: 'Diana',
    attractionType: 'parc_national',
    isFree: false,
    entryFeeLocal: 25000,
    entryFeeForeign: 55000,
    visitDuration: '2-6 heures',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Cascade Sacrée', 'Grande Cascade', 'Lac Maudit', 'Lémurien couronné', 'Caméléon Brookesia', 'Forêt tropicale humide'],
    openingHours: { monday: { open: '07:00', close: '17:00' }, tuesday: { open: '07:00', close: '17:00' }, wednesday: { open: '07:00', close: '17:00' }, thursday: { open: '07:00', close: '17:00' }, friday: { open: '07:00', close: '17:00' }, saturday: { open: '07:00', close: '17:00' }, sunday: { open: '07:00', close: '17:00' } },
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.6,
    reviewCount: 312,
    isFeatured: true,
    latitude: -12.5167,
    longitude: 49.1500,
  },
  {
    name: 'Réserve Spéciale d\'Ankarana',
    slug: 'reserve-ankarana',
    description: `La Réserve Spéciale d'Ankarana est un territoire sauvage de 18 225 hectares situé entre Diego Suarez et Ambanja, à 108 km de Diego. Ce massif calcaire spectaculaire abrite les fameux Tsingy - formations rocheuses acérées sculptées par l'érosion - ainsi qu'un réseau souterrain de grottes parmi les plus vastes de l'Afrique.

Les Petits Tsingy offrent une introduction accessible à ces formations uniques, tandis que le Grand Circuit de 2-3 jours permet d'explorer les zones les plus sauvages. Les grottes, dont certaines abritent des millions de chauves-souris, constituent un monde souterrain fascinant avec stalactites et stalagmites.

La réserve est le refuge de 11 espèces de lémuriens, dont le rare Propithèque couronné et le Lémurien couronné de Sanford. Le Fossa, plus grand prédateur de Madagascar, y chasse la nuit. Les crocodiles du Nil habitent les rivières souterraines et les lacs des grottes.

Attention : certaines formations calcaires sont fragiles et sacrées (fady). Les échelles verticales et passages étroits demandent une bonne condition physique. L'équipement spéléo (lampe frontale, gants) est indispensable.`,
    shortDescription: 'Tsingy spectaculaires et grottes mystérieuses - Un labyrinthe de calcaire entre Diego et Ambanja.',
    city: 'Anivorano Nord',
    district: 'Antsiranana',
    region: 'Diana',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 30000,
    entryFeeForeign: 65000,
    visitDuration: '1/2 journée à 3 jours',
    bestTimeToVisit: 'Mai à Novembre',
    highlights: ['Petits Tsingy', 'Grottes des Chauves-souris', 'Grand Circuit', 'Propithèque couronné', 'Rivières souterraines', 'Crocodiles du Nil'],
    openingHours: { monday: { open: '06:00', close: '17:00' }, tuesday: { open: '06:00', close: '17:00' }, wednesday: { open: '06:00', close: '17:00' }, thursday: { open: '06:00', close: '17:00' }, friday: { open: '06:00', close: '17:00' }, saturday: { open: '06:00', close: '17:00' }, sunday: { open: '06:00', close: '17:00' } },
    isAccessible: false,
    hasGuide: true,
    hasParking: true,
    rating: 4.7,
    reviewCount: 445,
    isFeatured: true,
    latitude: -12.9500,
    longitude: 49.1167,
  },
  {
    name: 'Anakao',
    slug: 'anakao',
    description: `Anakao est un authentique village de pêcheurs Vezo situé sur la côte sud-ouest de Madagascar, accessible uniquement par bateau depuis Tuléar (1h30 à 2h de traversée). Cette destination préservée du tourisme de masse offre une immersion dans la vie traditionnelle des "nomades de la mer".

Les plages de sable blanc immaculé s'étendent à perte de vue, bordées par un lagon turquoise protégé par une barrière de corail. L'absence de route maintient Anakao dans un isolement bienheureux où le temps semble suspendu. Les pirogues à balancier des pêcheurs animent le littoral au lever et au coucher du soleil.

L'excursion vers Nosy Ve, petite île au large, permet d'observer une colonie de Fous à pieds rouges, oiseaux marins rares et spectaculaires. Le snorkeling et la plongée révèlent des récifs coralliens préservés peuplés de poissons tropicaux multicolores.

La voile traditionnelle en pirogue, le kayak de mer et la pêche avec les locaux complètent les activités. Les couchers de soleil sur le canal du Mozambique sont parmi les plus beaux de Madagascar. Note importante : pas de distributeur bancaire - prévoir des espèces.`,
    shortDescription: 'Village de pêcheurs Vezo authentique - Plages désertes et immersion dans la vie traditionnelle.',
    city: 'Anakao',
    district: 'Toliara',
    region: 'Atsimo-Andrefana',
    attractionType: 'plage',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '2-4 jours',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Plages vierges', 'Village Vezo', 'Nosy Ve (Fous à pieds rouges)', 'Pirogue traditionnelle', 'Snorkeling', 'Coucher de soleil'],
    isAccessible: false,
    hasGuide: true,
    hasParking: false,
    rating: 4.5,
    reviewCount: 234,
    isFeatured: false,
    latitude: -23.6833,
    longitude: 43.6500,
  },
  {
    name: 'Massif du Makay',
    slug: 'massif-makay',
    description: `Le Massif du Makay est l'une des dernières terres vierges de Madagascar, un labyrinthe de canyons profonds et de plateaux isolés s'étendant sur 4 000 km² dans le sud-ouest de l'île. Découvert scientifiquement seulement en 2007, ce sanctuaire naturel reste l'une des régions les moins explorées de la planète.

L'accès depuis Beroroha nécessite plusieurs jours de piste en 4x4 puis de trekking. Les expéditions durent minimum 7 jours et vont jusqu'à 15 jours pour les circuits complets. L'organisation via une agence spécialisée est obligatoire : guides, porteurs, cuisinier, matériel de camping et nourriture sont inclus.

Les canyons vertigineux aux parois de grès rouge abritent des forêts-galeries préservées où vivent des espèces endémiques rares. Les cours d'eau cristallins serpentent entre des falaises sculptées par des millions d'années d'érosion. Le bivouac chaque nuit sous un ciel étoilé d'une pureté exceptionnelle fait partie de l'expérience.

Zone totalement isolée sans réseau téléphonique, le Makay demande une excellente condition physique et un goût pour l'aventure authentique. C'est une expérience transformatrice pour ceux qui osent s'y aventurer.`,
    shortDescription: 'Dernière terre vierge - Expédition aventure dans un labyrinthe de canyons inexplorés.',
    city: 'Beroroha',
    district: 'Atsimo-Andrefana',
    region: 'Atsimo-Andrefana',
    attractionType: 'montagne',
    isFree: false,
    entryFeeLocal: 100000,
    entryFeeForeign: 250000,
    visitDuration: '7-15 jours',
    bestTimeToVisit: 'Mai à Octobre',
    highlights: ['Canyons vertigineux', 'Forêts-galeries', 'Espèces endémiques rares', 'Bivouac sous les étoiles', 'Trekking aventure', 'Nature vierge'],
    isAccessible: false,
    hasGuide: true,
    hasParking: false,
    rating: 4.9,
    reviewCount: 89,
    isFeatured: true,
    latitude: -21.7000,
    longitude: 45.0500,
  },
  {
    name: 'Train FCE Fianarantsoa-Manakara',
    slug: 'train-fce',
    description: `Le Train FCE (Fianarantsoa-Côte Est) est une aventure ferroviaire légendaire reliant les hauts plateaux à la côte est de Madagascar sur 163 km. Ce voyage de 10 à 14 heures traverse des paysages à couper le souffle : forêts tropicales, cascades, rizières en terrasses, ponts vertigineux et tunnels creusés à la main au début du 20ème siècle.

Construit entre 1926 et 1936 par des milliers d'ouvriers, ce chemin de fer est un chef-d'œuvre d'ingénierie coloniale avec 67 gares, 48 tunnels et 67 ponts. Le train s'arrête dans chaque village, permettant aux passagers d'acheter fruits, en-cas et artisanat local - une immersion totale dans la vie quotidienne malgache.

Les départs ont lieu généralement les mardis et samedis depuis Fianarantsoa (7h00), avec retour de Manakara les mercredis et dimanches. La 1ère classe offre des sièges plus confortables mais l'ambiance authentique se trouve en 2ème classe, au milieu des familles malgaches.

Les retards sont fréquents et font partie du charme. Prévoir nourriture, eau et patience ! L'arrivée à Manakara, port de la côte est, permet de poursuivre vers le Canal des Pangalanes. Une expérience pittoresque et inoubliable.`,
    shortDescription: 'Voyage ferroviaire légendaire - 163km à travers forêts, cascades et 48 tunnels historiques.',
    city: 'Fianarantsoa',
    district: 'Haute Matsiatra',
    region: 'Haute Matsiatra',
    attractionType: 'site_historique',
    isFree: false,
    entryFeeLocal: 8000,
    entryFeeForeign: 15000,
    visitDuration: '10-14 heures',
    bestTimeToVisit: 'Toute l\'année',
    highlights: ['48 tunnels historiques', '67 ponts', 'Forêts tropicales', 'Villages authentiques', 'Rizières en terrasses', 'Ambiance locale'],
    openingHours: { tuesday: { open: '07:00', close: '21:00' }, saturday: { open: '07:00', close: '21:00' } },
    isAccessible: true,
    hasGuide: false,
    hasParking: true,
    rating: 4.4,
    reviewCount: 567,
    isFeatured: true,
    latitude: -21.4333,
    longitude: 47.0833,
  },
  {
    name: 'Nosy Tanikely',
    slug: 'nosy-tanikely',
    description: `Nosy Tanikely est une réserve marine protégée située à 30 minutes en bateau de Nosy Be, considérée comme l'un des meilleurs spots de snorkeling de tout l'océan Indien. Cette petite île paradisiaque de 3 hectares abrite une biodiversité sous-marine exceptionnelle dans des eaux d'une clarté cristalline.

Les récifs coralliens multicolores regorgent de vie : poissons-clowns dans leurs anémones, poissons-papillons, mérous, raies, tortues de mer et parfois même des requins de récif inoffensifs. Les eaux peu profondes (2 à 10 mètres) permettent une observation facile même pour les débutants.

Sur l'île, un petit sentier mène au phare offrant une vue panoramique sur l'archipel de Nosy Be. Des lémuriens introduits vivent dans la végétation et se laissent approcher. La plage de sable blanc est parfaite pour un pique-nique après le snorkeling.

L'entrée dans la réserve est payante (droit de conservation) et les activités sont réglementées : interdiction de toucher ou nourrir les animaux, pas de pêche, pas de déchets. Les excursions d'une journée depuis Nosy Be incluent généralement le déjeuner sur l'île.`,
    shortDescription: 'Réserve marine exceptionnelle - Le meilleur snorkeling de l\'océan Indien près de Nosy Be.',
    city: 'Nosy Be',
    district: 'Nosy Be',
    region: 'Diana',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 15000,
    entryFeeForeign: 45000,
    visitDuration: '1 journée',
    bestTimeToVisit: 'Avril à Décembre',
    highlights: ['Snorkeling exceptionnel', 'Tortues de mer', 'Récifs coralliens', 'Poissons tropicaux', 'Phare panoramique', 'Plage paradisiaque'],
    openingHours: { monday: { open: '08:00', close: '16:00' }, tuesday: { open: '08:00', close: '16:00' }, wednesday: { open: '08:00', close: '16:00' }, thursday: { open: '08:00', close: '16:00' }, friday: { open: '08:00', close: '16:00' }, saturday: { open: '08:00', close: '16:00' }, sunday: { open: '08:00', close: '16:00' } },
    isAccessible: true,
    hasGuide: true,
    hasParking: false,
    rating: 4.8,
    reviewCount: 723,
    isFeatured: true,
    latitude: -13.4833,
    longitude: 48.2333,
  },
  {
    name: 'Nosy Komba',
    slug: 'nosy-komba',
    description: `Nosy Komba, "l'île aux lémuriens", est une perle volcanique située à 20 minutes en bateau de Nosy Be. Cette île montagneuse de 25 km² culminant à 622 mètres est célèbre pour sa population de Lémuriens noirs (Eulemur macaco) semi-apprivoisés qui descendent des arbres pour interagir avec les visiteurs.

Le village d'Ampangorina, point d'arrivée des bateaux, est un concentré de charme malgache avec ses cases traditionnelles, ses broderies artisanales réputées dans tout Madagascar et ses sculpteurs sur bois. Les nappes brodées main de Nosy Komba sont des souvenirs prisés.

Une randonnée de 2 heures permet d'atteindre le sommet du volcan endormi, offrant une vue spectaculaire sur l'archipel de Nosy Be, la mer d'Émeraude et les côtes de Madagascar. Le chemin traverse une forêt dense où vivent les lémuriens, caméléons et de nombreux oiseaux endémiques.

Les plages de sable noir volcanique contrastent avec les eaux turquoise. Le snorkeling révèle des fonds marins préservés. L'île, sans routes ni véhicules, a conservé une authenticité rare. L'électricité n'est arrivée que récemment dans certains villages.`,
    shortDescription: 'L\'île aux lémuriens - Rencontre avec les Lémuriens noirs et artisanat brodé traditionnel.',
    city: 'Nosy Komba',
    district: 'Nosy Be',
    region: 'Diana',
    attractionType: 'ile',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1/2 journée à 2 jours',
    bestTimeToVisit: 'Avril à Décembre',
    highlights: ['Lémuriens noirs', 'Broderies artisanales', 'Village Ampangorina', 'Randonnée volcan', 'Plages de sable noir', 'Snorkeling'],
    isAccessible: true,
    hasGuide: true,
    hasParking: false,
    rating: 4.6,
    reviewCount: 534,
    isFeatured: false,
    latitude: -13.4500,
    longitude: 48.3500,
  },
  {
    name: 'Nosy Iranja',
    slug: 'nosy-iranja',
    description: `Nosy Iranja, "l'île aux tortues", est sans doute la plus photogénique de l'archipel de Nosy Be. À marée basse, un extraordinaire banc de sable blanc d'1,5 km relie deux îles paradisiaques, créant un spectacle naturel époustouflant qui figure parmi les plus belles plages du monde.

Nosy Iranja Be (grande île) abrite un village de pêcheurs traditionnel et un phare colonial offrant une vue à 360° sur l'océan Indien. Nosy Iranja Kely (petite île) est une plage déserte bordée de cocotiers où les tortues marines viennent pondre de novembre à mars.

Les eaux cristallines aux dégradés de bleu et turquoise sont idéales pour le snorkeling et la baignade. Les récifs coralliens abritent une vie marine colorée. Le sable blanc immaculé, presque fluorescent au soleil, crée un contraste saisissant.

L'excursion d'une journée depuis Nosy Be (1h30 de bateau) inclut généralement le déjeuner de fruits de mer frais. Le timing est crucial : le banc de sable n'est accessible qu'à marée basse. Vérifier les horaires de marée avant de réserver !`,
    shortDescription: 'L\'île aux tortues - Deux îles reliées par un banc de sable spectaculaire à marée basse.',
    city: 'Nosy Iranja',
    district: 'Nosy Be',
    region: 'Diana',
    attractionType: 'ile',
    isFree: false,
    entryFeeLocal: 20000,
    entryFeeForeign: 50000,
    visitDuration: '1 journée',
    bestTimeToVisit: 'Avril à Décembre',
    highlights: ['Banc de sable à marée basse', 'Ponte des tortues', 'Phare colonial', 'Plage paradisiaque', 'Snorkeling', 'Village de pêcheurs'],
    isAccessible: true,
    hasGuide: true,
    hasParking: false,
    rating: 4.9,
    reviewCount: 612,
    isFeatured: true,
    latitude: -13.2833,
    longitude: 47.9500,
  },
  {
    name: 'Île aux Nattes',
    slug: 'ile-aux-nattes',
    description: `L'Île aux Nattes (Nosy Nato) est un petit paradis tropical de 3 km² situé à 5 minutes en pirogue de l'Île Sainte-Marie. Interdite aux véhicules motorisés, cette île préservée se parcourt à pied ou en vélo sur des sentiers sablonneux bordés de cocotiers et de badamiers.

L'ambiance décontractée et hors du temps attire les voyageurs en quête d'authenticité. Les plages de sable blanc bordées d'eaux turquoise sont parmi les plus belles de Madagascar. La Piscine Naturelle, cuvette rocheuse remplie d'eau de mer cristalline, est un spot de snorkeling prisé.

Les bungalows pieds dans l'eau et petits hôtels familiaux offrent un hébergement simple mais charmant. Le soir, les restaurants de plage servent du poisson et des langoustes grillées face au coucher de soleil.

L'île est un sanctuaire pour les orchidées sauvages qui fleurissent de septembre à décembre. Les lémuriens nocturnes s'observent avec un guide la nuit. Le phare, construit au 19ème siècle, offre un panorama sur l'océan. Une excursion à la journée depuis Sainte-Marie est possible, mais passer une nuit est recommandé.`,
    shortDescription: 'Petit paradis sans voiture - Plages idylliques et ambiance décontractée à 5 minutes de Sainte-Marie.',
    city: 'Île aux Nattes',
    district: 'Sainte-Marie',
    region: 'Analanjirofo',
    attractionType: 'ile',
    isFree: true,
    entryFeeLocal: 0,
    entryFeeForeign: 0,
    visitDuration: '1-3 jours',
    bestTimeToVisit: 'Septembre à Décembre',
    highlights: ['Piscine Naturelle', 'Plages vierges', 'Sans voiture', 'Orchidées sauvages', 'Phare historique', 'Coucher de soleil'],
    isAccessible: true,
    hasGuide: true,
    hasParking: false,
    rating: 4.7,
    reviewCount: 389,
    isFeatured: false,
    latitude: -17.1000,
    longitude: 49.8667,
  },
  {
    name: 'Réserve de Reniala',
    slug: 'reserve-reniala',
    description: `La Réserve de Reniala est un trésor botanique unique situé près d'Ifaty, à 27 km au nord de Tuléar. Ce petit sanctuaire de forêt épineuse sèche protège une concentration exceptionnelle de baobabs, dont le rare Baobab de Grandidier et le spectaculaire "Baobab bouteille" (Adansonia rubrostipa) au tronc enflé.

Le sentier balisé d'1 à 2 heures traverse un paysage surréaliste où les silhouettes torturées des baobabs côtoient les Didiereaceae, plantes succulentes endémiques hérissées d'épines ressemblant à des cactus géants. Cette "forêt épineuse" est unique au monde, ne se trouvant que dans le sud-ouest de Madagascar.

L'avifaune est remarquable : le Coua huppé, le Vanga à queue rousse et plusieurs espèces endémiques attirent les ornithologues. Les tortues radiées, emblème du sud malgache, se cachent dans les sous-bois. Les caméléons et geckos ajoutent à la biodiversité.

Le coucher de soleil sur les baobabs offre un spectacle photographique exceptionnel. Les guides locaux, formés à l'écotourisme, partagent leurs connaissances sur les usages traditionnels des plantes. L'entrée modique (3€) soutient la communauté et la conservation.`,
    shortDescription: 'Forêt de baobabs unique - Baobabs bouteilles et forêt épineuse surréaliste près de Tuléar.',
    city: 'Ifaty',
    district: 'Toliara',
    region: 'Atsimo-Andrefana',
    attractionType: 'reserve',
    isFree: false,
    entryFeeLocal: 10000,
    entryFeeForeign: 15000,
    visitDuration: '1-2 heures',
    bestTimeToVisit: 'Avril à Novembre',
    highlights: ['Baobabs bouteilles', 'Forêt épineuse', 'Tortues radiées', 'Oiseaux endémiques', 'Coucher de soleil', 'Écotourisme communautaire'],
    openingHours: { monday: { open: '06:00', close: '18:00' }, tuesday: { open: '06:00', close: '18:00' }, wednesday: { open: '06:00', close: '18:00' }, thursday: { open: '06:00', close: '18:00' }, friday: { open: '06:00', close: '18:00' }, saturday: { open: '06:00', close: '18:00' }, sunday: { open: '06:00', close: '18:00' } },
    isAccessible: true,
    hasGuide: true,
    hasParking: true,
    rating: 4.5,
    reviewCount: 267,
    isFeatured: false,
    latitude: -23.1333,
    longitude: 43.6167,
  },
];

async function seedNewAttractions() {
  console.log('🌴 Ajout des nouvelles attractions de Madagascar...');
  console.log('');

  let created = 0;
  let updated = 0;

  for (const attraction of newAttractions) {
    const existing = await prisma.establishment.findFirst({
      where: { slug: attraction.slug },
    });

    if (existing) {
      // Mettre à jour l'attraction existante
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

      console.log(`  ✏️  Mis à jour: ${attraction.name}`);
      updated++;
    } else {
      // Créer une nouvelle attraction
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

      console.log(`  ✅ Créé: ${attraction.name}`);
      created++;
    }
  }

  console.log('');
  console.log(`🎉 Terminé ! ${created} nouvelles attractions créées, ${updated} mises à jour.`);
  console.log('');
  console.log('📍 Liste des attractions ajoutées:');
  newAttractions.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.name} (${a.city})`);
  });
}

seedNewAttractions()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { newAttractions };
