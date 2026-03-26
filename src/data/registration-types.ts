// Catalogue complet des types et sous-types pour l'inscription

export interface SubType {
  value: string
  label: string
  description: string
}

export interface RegistrationCategory {
  type: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER'
  label: string
  description: string
  icon: string // lucide icon name
  gradient: string
  subtypes: SubType[]
}

export const REGISTRATION_CATEGORIES: RegistrationCategory[] = [
  {
    type: 'HOTEL',
    label: 'Hébergement',
    description: 'Hôtels, lodges, villas, bungalows et tout type d\'hébergement',
    icon: 'Hotel',
    gradient: 'from-blue-500 to-cyan-500',
    subtypes: [
      { value: 'hotel', label: 'Hôtel', description: 'Établissement hôtelier classique' },
      { value: 'boutique-hotel', label: 'Hôtel boutique', description: 'Hôtel de charme à taille humaine' },
      { value: 'resort', label: 'Resort', description: 'Complexe hôtelier tout inclus' },
      { value: 'palace', label: 'Palace', description: 'Hébergement de grand luxe' },
      { value: 'guesthouse', label: 'Maison d\'hôtes', description: 'Accueil chez l\'habitant amélioré' },
      { value: 'chambres-dhotes', label: 'Chambres d\'hôtes', description: 'Chambre chez le propriétaire avec petit-déjeuner' },
      { value: 'auberge', label: 'Auberge', description: 'Hébergement convivial et abordable' },
      { value: 'hostel', label: 'Auberge de jeunesse', description: 'Hébergement collectif économique' },
      { value: 'lodge', label: 'Lodge', description: 'Hébergement en pleine nature' },
      { value: 'safari-lodge', label: 'Safari lodge', description: 'Lodge en brousse ou réserve' },
      { value: 'ecolodge', label: 'Écolodge', description: 'Hébergement écologique et durable' },
      { value: 'villa', label: 'Villa', description: 'Maison de vacances privée' },
      { value: 'bungalow', label: 'Bungalow', description: 'Petit logement indépendant' },
      { value: 'overwater-bungalow', label: 'Bungalow sur pilotis', description: 'Bungalow au-dessus de l\'eau' },
      { value: 'treehouse', label: 'Cabane dans les arbres', description: 'Hébergement perché insolite' },
      { value: 'apart-hotel', label: 'Appart-hôtel', description: 'Appartement avec services hôteliers' },
      { value: 'pension', label: 'Pension', description: 'Hébergement familial avec repas' },
      { value: 'motel', label: 'Motel', description: 'Hébergement de passage en bord de route' },
      { value: 'camping', label: 'Camping', description: 'Emplacement en plein air avec tentes ou caravanes' },
      { value: 'farm-stay', label: 'Séjour à la ferme', description: 'Hébergement rural chez un agriculteur' },
      { value: 'maison-campagne', label: 'Maison de campagne', description: 'Location saisonnière en milieu rural' },
      { value: 'riad', label: 'Riad / Maison traditionnelle', description: 'Hébergement de style traditionnel' },
      { value: 'autre-hebergement', label: 'Autre', description: 'Autre type d\'hébergement' },
    ],
  },
  {
    type: 'RESTAURANT',
    label: 'Restaurant',
    description: 'Restaurants, cafés, lounges et street food',
    icon: 'UtensilsCrossed',
    gradient: 'from-orange-500 to-red-500',
    subtypes: [
      // Ces valeurs DOIVENT correspondre à l'enum Prisma RestaurantCategory
      { value: 'RESTAURANT', label: 'Restaurant', description: 'Restaurant classique avec service à table' },
      { value: 'GARGOTE', label: 'Gargote', description: 'Petit restaurant populaire malgache' },
      { value: 'LOUNGE', label: 'Lounge', description: 'Bar-restaurant avec ambiance lounge' },
      { value: 'CAFE', label: 'Café', description: 'Café, salon de thé, pâtisserie' },
      { value: 'FAST_FOOD', label: 'Fast food', description: 'Restauration rapide' },
      { value: 'STREET_FOOD', label: 'Street food', description: 'Cuisine de rue' },
    ],
  },
  {
    type: 'ATTRACTION',
    label: 'Attraction',
    description: 'Sites touristiques, parcs, plages, réserves et lieux culturels',
    icon: 'Mountain',
    gradient: 'from-green-500 to-emerald-500',
    subtypes: [
      { value: 'park', label: 'Parc', description: 'Parc urbain ou de loisirs' },
      { value: 'parc_national', label: 'Parc national', description: 'Parc national protégé' },
      { value: 'reserve', label: 'Réserve naturelle', description: 'Réserve ou aire protégée' },
      { value: 'beach', label: 'Plage', description: 'Plage de sable ou crique' },
      { value: 'waterfall', label: 'Cascade', description: 'Cascade ou chute d\'eau' },
      { value: 'lake', label: 'Lac', description: 'Lac ou plan d\'eau naturel' },
      { value: 'river', label: 'Rivière', description: 'Rivière, fleuve ou cours d\'eau' },
      { value: 'ile', label: 'Île', description: 'Île ou îlot' },
      { value: 'canyon', label: 'Canyon', description: 'Gorge, canyon ou tsingy' },
      { value: 'volcano', label: 'Volcan', description: 'Site volcanique' },
      { value: 'cave', label: 'Grotte', description: 'Grotte ou caverne' },
      { value: 'viewpoint', label: 'Point de vue', description: 'Belvédère ou panorama' },
      { value: 'monument_naturel', label: 'Monument naturel', description: 'Formation géologique remarquable' },
      { value: 'nature', label: 'Site naturel', description: 'Autre site naturel' },
      { value: 'coral_reef', label: 'Récif corallien', description: 'Récif ou spot snorkeling' },
      { value: 'mangrove', label: 'Mangrove', description: 'Forêt de mangrove' },
      { value: 'rice_fields', label: 'Rizières', description: 'Rizières en terrasse' },
      { value: 'baobab', label: 'Allée des baobabs', description: 'Site de baobabs' },
      { value: 'lemur_park', label: 'Parc à lémuriens', description: 'Réserve ou parc de lémuriens' },
      { value: 'botanical_garden', label: 'Jardin botanique', description: 'Jardin botanique ou arboretum' },
      { value: 'museum', label: 'Musée', description: 'Musée ou exposition' },
      { value: 'historical', label: 'Site historique', description: 'Patrimoine historique ou ruines' },
      { value: 'sacred_site', label: 'Site sacré', description: 'Lieu sacré ou spirituel' },
      { value: 'cultural_village', label: 'Village culturel', description: 'Village à découvrir' },
      { value: 'market', label: 'Marché', description: 'Marché local ou artisanal' },
      { value: 'ville', label: 'Ville remarquable', description: 'Ville ou village à visiter' },
      { value: 'hot_spring', label: 'Source thermale', description: 'Source chaude naturelle' },
      { value: 'diving_site', label: 'Site de plongée', description: 'Spot de plongée sous-marine' },
      { value: 'surf_spot', label: 'Spot de surf', description: 'Vague et spot de surf' },
      { value: 'trekking_trail', label: 'Sentier de trek', description: 'Randonnée ou trek' },
      { value: 'adventure_park', label: 'Parc d\'aventure', description: 'Accrobranche, tyrolienne, etc.' },
      { value: 'sports_complex', label: 'Complexe sportif', description: 'Installation sportive ou stade' },
      { value: 'theatre', label: 'Théâtre / Salle de spectacle', description: 'Lieu de spectacle' },
      { value: 'art_gallery', label: 'Galerie d\'art', description: 'Galerie ou espace artistique' },
      { value: 'observatory', label: 'Observatoire', description: 'Observatoire astronomique ou naturel' },
      { value: 'autre-attraction', label: 'Autre', description: 'Autre type d\'attraction' },
    ],
  },
  {
    type: 'PROVIDER',
    label: 'Prestataire',
    description: 'Guides, transports, agences de voyage et services touristiques',
    icon: 'Briefcase',
    gradient: 'from-purple-500 to-pink-500',
    subtypes: [
      // Ces valeurs DOIVENT correspondre à l'enum Prisma ProviderServiceType
      { value: 'GUIDE', label: 'Guide touristique', description: 'Guide local ou national certifié' },
      { value: 'DRIVER', label: 'Chauffeur / Transport', description: 'Chauffeur privé ou navette' },
      { value: 'TOUR_OPERATOR', label: 'Tour-opérateur', description: 'Organisation de circuits et séjours' },
      { value: 'CAR_RENTAL', label: 'Location de véhicules', description: 'Voitures, motos, vélos, quads' },
      { value: 'TRAVEL_AGENCY', label: 'Agence de voyage', description: 'Billetterie et réservation de voyages' },
      { value: 'TRANSFER', label: 'Transfert aéroport', description: 'Navette aéroport et gare' },
      { value: 'BOAT_EXCURSION', label: 'Excursion en bateau', description: 'Balades en mer, pirogue, catamaran' },
      { value: 'PHOTOGRAPHER', label: 'Photographe', description: 'Photographe de voyage ou événementiel' },
      { value: 'TRANSLATOR', label: 'Traducteur / Interprète', description: 'Traduction et accompagnement linguistique' },
      { value: 'OTHER', label: 'Autre prestataire', description: 'Autre service touristique' },
    ],
  },
]

// Helper pour récupérer une catégorie par type
export function getCategoryByType(type: string): RegistrationCategory | undefined {
  return REGISTRATION_CATEGORIES.find((c) => c.type === type)
}

// Helper pour récupérer un sous-type
export function getSubtype(type: string, subtypeValue: string): SubType | undefined {
  const category = getCategoryByType(type)
  return category?.subtypes.find((s) => s.value === subtypeValue)
}
