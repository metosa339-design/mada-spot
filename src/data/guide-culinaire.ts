// Donnees editoriales statiques pour la page Guide Culinaire

export interface TraditionalDish {
  id: string;
  name: string;
  nameMg: string;
  description: string;
  longDescription: string;
  image: string;
  category: 'viande' | 'poisson' | 'legumes' | 'dessert' | 'accompagnement';
  difficulty: 'facile' | 'moyen' | 'difficile';
  keyIngredients: string[];
  restaurantSlugs: { slug: string; name: string }[];
  isFeatured: boolean;
}

export interface LocalProduct {
  name: string;
  description: string;
  funFact: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  products: LocalProduct[];
}

export interface MalagasyMarket {
  name: string;
  location: string;
  specialties: string[];
  bestTime: string;
  description: string;
}

export interface CulinaryExperience {
  id: string;
  title: string;
  description: string;
  image: string;
  highlights: string[];
}

export interface TOCItem {
  id: string;
  label: string;
}

export const tableOfContents: TOCItem[] = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'plats', label: 'Plats Traditionnels' },
  { id: 'produits', label: 'Produits Locaux' },
  { id: 'marches', label: 'Marchés' },
  { id: 'experiences', label: 'Expériences' },
  { id: 'communaute', label: 'Communauté' },
];

export const traditionalDishes: TraditionalDish[] = [
  {
    id: 'romazava',
    name: 'Romazava',
    nameMg: 'Romazava',
    description: 'Le plat national malgache, un ragoût de viande aux brèdes parfumé au gingembre et à l\'ail.',
    longDescription: 'Le Romazava est bien plus qu\'un simple ragoût : c\'est l\'âme de la cuisine malgache. Préparé avec de la viande de zébu (ou bœuf, porc, poulet), des brèdes mafana (feuilles comestibles au goût piquant unique), des tomates, oignons, gingembre et ail, ce plat incarne la convivialité malgache. Servi avec du riz blanc fumant, il est présent sur toutes les tables familiales et dans les gargotes comme les restaurants gastronomiques.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    category: 'viande',
    difficulty: 'moyen',
    keyIngredients: ['Zébu', 'Brèdes mafana', 'Gingembre', 'Tomates'],
    restaurantSlugs: [
      { slug: 'la-varangue-antananarivo', name: 'La Varangue' },
      { slug: 'sakamanga-antananarivo', name: 'Sakamanga' },
    ],
    isFeatured: true,
  },
  {
    id: 'ravitoto',
    name: 'Ravitoto au porc',
    nameMg: 'Henakisoa sy Ravitoto',
    description: 'Feuilles de manioc pilées cuisinées avec du porc et du lait de coco, un classique incontournable.',
    longDescription: 'Le Ravitoto est un plat emblématique des Hauts Plateaux. Les feuilles de manioc sont longuement pilées puis cuites avec de la viande de porc (ou de zébu), du lait de coco, de l\'ail et du gingembre. La cuisson lente de plus d\'une heure donne une texture crémeuse et un goût profond. C\'est un plat de fête, souvent préparé le dimanche en famille.',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    category: 'viande',
    difficulty: 'difficile',
    keyIngredients: ['Feuilles de manioc', 'Porc', 'Lait de coco', 'Ail'],
    restaurantSlugs: [
      { slug: 'cafe-de-la-gare-antananarivo', name: 'Café de la Gare' },
      { slug: 'mamy-gargote-antsirabe', name: 'Mamy Gargote' },
    ],
    isFeatured: true,
  },
  {
    id: 'vary-aminanana',
    name: 'Vary amin\'anana',
    nameMg: 'Vary amin\'anana',
    description: 'Riz aux brèdes, le petit-déjeuner traditionnel malgache, nourrissant et réconfortant.',
    longDescription: 'Le Vary amin\'anana (littéralement "riz aux feuilles") est le petit-déjeuner par excellence à Madagascar. Du riz cuit avec des brèdes (feuilles vertes), assaisonné d\'oignons et parfois accompagné de kitoza (viande séchée fumée). Simple mais profondément satisfaisant, ce plat illustre la place centrale du riz dans la culture malgache, où l\'on dit "manger" se traduit par "manger du riz" (mihinam-bary).',
    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800&q=80',
    category: 'legumes',
    difficulty: 'facile',
    keyIngredients: ['Riz', 'Brèdes', 'Oignons', 'Kitoza'],
    restaurantSlugs: [
      { slug: 'koko-lodge-antananarivo', name: 'KoKo Lodge' },
    ],
    isFeatured: false,
  },
  {
    id: 'masikita',
    name: 'Masikita',
    nameMg: 'Masikita',
    description: 'Brochettes de zébu grillées au charbon, marinées aux épices locales. Le street food roi.',
    longDescription: 'Les Masikita sont les brochettes de rue par excellence à Madagascar. Des morceaux de viande de zébu (ou parfois de porc) marinés dans un mélange d\'épices locales, enfilés sur des tiges et grillés au charbon de bois. On les trouve partout : aux coins des rues, devant les épiceries, sur les marchés. Servies avec un rougail de tomates pimenté, elles sont le snack favori des Malgaches à toute heure.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    category: 'viande',
    difficulty: 'facile',
    keyIngredients: ['Zébu', 'Épices', 'Charbon de bois', 'Rougail'],
    restaurantSlugs: [
      { slug: 'mofo-gasy-stand-rasoa-antananarivo', name: 'Mofo Gasy Stand Rasoa' },
    ],
    isFeatured: false,
  },
  {
    id: 'akoho-sy-voanio',
    name: 'Akoho sy voanio',
    nameMg: 'Akoho sy Voanio',
    description: 'Poulet mijoté au lait de coco et gingembre, spécialité de la côte est.',
    longDescription: 'L\'Akoho sy voanio est une merveille de la cuisine côtière malgache. Du poulet fermier mijoté longuement dans du lait de coco frais, parfumé au gingembre, curcuma et tomates. Ce plat reflète l\'influence des échanges commerciaux avec l\'Asie et l\'océan Indien. Sur la côte est et à Nosy Be, où les cocotiers abondent, c\'est un plat du quotidien aux saveurs exotiques et réconfortantes.',
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&q=80',
    category: 'viande',
    difficulty: 'moyen',
    keyIngredients: ['Poulet', 'Lait de coco', 'Gingembre', 'Curcuma'],
    restaurantSlugs: [
      { slug: 'chez-karon-nosy-be', name: 'Chez Karon' },
      { slug: 'le-deck-nosy-be', name: 'Le Deck' },
    ],
    isFeatured: false,
  },
  {
    id: 'mokary',
    name: 'Mokary',
    nameMg: 'Mokary',
    description: 'Petites galettes de riz au lait de coco, cuites à la poêle. Le goûter malgache.',
    longDescription: 'Les Mokary sont de petites galettes rondes et moelleuses, préparées avec de la farine de riz et du lait de coco. Cuites sur une plaque spéciale en fonte avec des moules ronds, elles sont légèrement sucrées et ont une texture unique, à la fois croustillante à l\'extérieur et fondante à l\'intérieur. On les trouve surtout le matin et à l\'heure du goûter, vendues par des marchandes ambulantes.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
    category: 'dessert',
    difficulty: 'facile',
    keyIngredients: ['Farine de riz', 'Lait de coco', 'Sucre', 'Levure'],
    restaurantSlugs: [
      { slug: 'le-glacier-antananarivo', name: 'Le Glacier' },
    ],
    isFeatured: false,
  },
];

export const productCategories: ProductCategory[] = [
  {
    id: 'cereales',
    name: 'Riz & Céréales',
    icon: 'Wheat',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    products: [
      {
        name: 'Riz (Vary)',
        description: 'Base de tous les repas, cultivé en terrasses',
        funFact: 'Les Malgaches consomment en moyenne 130kg de riz par personne et par an, un record mondial !',
      },
      {
        name: 'Manioc',
        description: 'Racine polyvalente : bouillie, frite ou en feuilles',
        funFact: 'Les feuilles de manioc pilées deviennent le ravitoto, l\'un des plats les plus aimés du pays.',
      },
      {
        name: 'Maïs',
        description: 'Grillé sur les marchés ou en bouillie sucrée',
        funFact: 'Le koba, gâteau traditionnel de riz et cacahuètes enveloppé dans des feuilles de banane, est un incontournable des fêtes.',
      },
    ],
  },
  {
    id: 'fruits',
    name: 'Fruits Tropicaux',
    icon: 'Apple',
    gradient: 'from-emerald-500/20 to-green-500/20',
    products: [
      {
        name: 'Mangue',
        description: 'Juteuse et parfumée, saison de novembre à février',
        funFact: 'Les manguiers bordent les routes nationales et les fruits tombent littéralement dans les mains des passants.',
      },
      {
        name: 'Litchi',
        description: 'Exportation phare de la côte est',
        funFact: 'Madagascar est le 3ème exportateur mondial de litchis, principalement vers l\'Europe en décembre.',
      },
      {
        name: 'Corossol (Corossolier)',
        description: 'Fruit crémeux au goût unique, mélange d\'ananas et fraise',
        funFact: 'Le jus de corossol frais est considéré comme un remède traditionnel et se trouve sur tous les marchés.',
      },
      {
        name: 'Ananas',
        description: 'Extrêmement sucré, variété Victoria',
        funFact: 'L\'ananas Victoria de Madagascar est réputé comme l\'un des plus sucrés au monde.',
      },
    ],
  },
  {
    id: 'epices',
    name: 'Épices & Aromates',
    icon: 'Flame',
    gradient: 'from-orange-500/20 to-red-500/20',
    products: [
      {
        name: 'Vanille',
        description: 'La meilleure au monde, de la région SAVA',
        funFact: 'Madagascar produit 80% de la vanille mondiale. Chaque gousse est pollinisée à la main !',
      },
      {
        name: 'Gingembre',
        description: 'Omniprésent dans la cuisine malgache',
        funFact: 'Le ranon\'apango (eau de riz au gingembre) est la boisson chaude traditionnelle servie en fin de repas.',
      },
      {
        name: 'Poivre sauvage (Voatsiperifery)',
        description: 'Poivre rare cueilli en forêt, notes boisées',
        funFact: 'Le Voatsiperifery pousse uniquement à Madagascar, en forêt tropicale, et se récolte à la main sur des lianes.',
      },
      {
        name: 'Girofle',
        description: 'Cultivé sur la côte est, parfum puissant',
        funFact: 'La côte est de Madagascar sent le girofle à des kilomètres pendant la saison de séchage.',
      },
    ],
  },
  {
    id: 'fruits-mer',
    name: 'Fruits de Mer',
    icon: 'Fish',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    products: [
      {
        name: 'Langouste',
        description: 'Abondante et accessible, surtout dans le Sud',
        funFact: 'À Fort Dauphin ou Tuléar, une langouste grillée coûte souvent moins de 5 euros !',
      },
      {
        name: 'Crevettes',
        description: 'Géantes, pêchées sur la côte ouest',
        funFact: 'Les crevettes de Madagascar sont exportées dans le monde entier et reconnues pour leur qualité exceptionnelle.',
      },
      {
        name: 'Thon',
        description: 'Frais du jour, grillé ou en sashimi',
        funFact: 'Les pêcheurs malgaches utilisent encore des pirogues à balancier traditionnelles pour la pêche au thon.',
      },
      {
        name: 'Crabe des mangroves',
        description: 'Spécialité de Mahajanga et Morondava',
        funFact: 'Le crabe au coco est l\'un des plats signature de la côte ouest, cuit entier dans du lait de coco frais.',
      },
    ],
  },
];

export const malagasyMarkets: MalagasyMarket[] = [
  {
    name: 'Marché d\'Analakely',
    location: 'Antananarivo',
    specialties: ['Fruits', 'Légumes', 'Épices', 'Artisanat'],
    bestTime: 'Tous les jours, matin',
    description: 'Le plus grand marché de la capitale, un labyrinthe de couleurs et de saveurs sur plusieurs étages.',
  },
  {
    name: 'Marché du Zoma',
    location: 'Antananarivo',
    specialties: ['Produits divers', 'Artisanat', 'Textile'],
    bestTime: 'Vendredi',
    description: 'L\'historique marché du vendredi, autrefois le plus grand marché à ciel ouvert du monde.',
  },
  {
    name: 'Talata Volonondry',
    location: 'Talata Volonondry',
    specialties: ['Saucisses', 'Koba', 'Volailles'],
    bestTime: 'Mardi',
    description: 'Marché rural réputé pour ses saucisses artisanales et le koba, gâteau traditionnel de riz.',
  },
  {
    name: 'Marché d\'Ambohitseheno',
    location: 'Ambohitseheno Fiaferana',
    specialties: ['Hira Gasy', 'Charcuterie', 'Spectacles'],
    bestTime: 'Dimanche',
    description: 'Un marché unique où spectacles de Hira Gasy (opéra malgache) accompagnent la vente de charcuterie locale.',
  },
  {
    name: 'Marché d\'Ambalavao',
    location: 'Ambalavao',
    specialties: ['Fromage de chèvre', 'Vins locaux', 'Soie'],
    bestTime: 'Mercredi',
    description: 'Le plus grand marché de zébus de Madagascar, aussi connu pour son fromage artisanal et le papier Antemoro.',
  },
  {
    name: 'Marché d\'Ifaty',
    location: 'Ifaty (Tuléar)',
    specialties: ['Poisson frais', 'Fruits de mer', 'Sculptures bois'],
    bestTime: 'Tous les jours, matin',
    description: 'Marché de pêcheurs où les pirogues débarquent la prise du jour : poissons, poulpes, crevettes.',
  },
  {
    name: 'Marché d\'Antsirabe',
    location: 'Antsirabe',
    specialties: ['Produits laitiers', 'Bières artisanales', 'Fruits'],
    bestTime: 'Tous les jours',
    description: 'La "Vichy malgache" offre un marché riche en produits laitiers et en bières brassées localement.',
  },
  {
    name: 'Marché d\'Antalaha',
    location: 'Antalaha (SAVA)',
    specialties: ['Vanille', 'Cacao', 'Épices'],
    bestTime: 'Saison vanille (juin-sept)',
    description: 'Au cœur de la capitale mondiale de la vanille, ce marché embaume d\'arômes envoûtants.',
  },
];

export const culinaryExperiences: CulinaryExperience[] = [
  {
    id: 'cooking-class',
    title: 'Cours de cuisine traditionnelle',
    description: 'Apprenez à préparer le romazava, le ravitoto et d\'autres classiques malgaches avec un chef local. Utilisation d\'ingrédients frais du marché et découverte des épices endémiques.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
    highlights: ['Préparation du romazava', 'Découverte des brèdes', 'Techniques de pilage', 'Dégustation sur place'],
  },
  {
    id: 'market-tour',
    title: 'Visite de marché avec un chef',
    description: 'Explorez les marchés colorés de Madagascar accompagné d\'un chef qui vous révèle les secrets des ingrédients locaux, comment les choisir et les cuisiner.',
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
    highlights: ['Marché d\'Analakely', 'Sélection des épices', 'Dégustation de fruits', 'Rencontre avec les producteurs'],
  },
  {
    id: 'rhum-arrange',
    title: 'Dégustation de rhum arrangé',
    description: 'Découvrez l\'art du rhum arrangé malgache : fruits tropicaux, vanille, miel, épices macérés dans du rhum local. Chaque famille a sa recette secrète.',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
    highlights: ['Rhum vanille', 'Rhum litchi-gingembre', 'Rhum baobab-miel', 'Secrets de macération'],
  },
  {
    id: 'family-meal',
    title: 'Repas chez l\'habitant',
    description: 'Partagez un repas authentique avec une famille malgache. Découvrez le rythme du "vary sy laoka" (riz et accompagnement), les coutumes à table et la chaleur de l\'hospitalité gasy.',
    image: 'https://images.unsplash.com/photo-1529543544282-ea99407407c1?w=800&q=80',
    highlights: ['Accueil familial', 'Cuisine au feu de bois', 'Traditions à table', 'Partage culturel'],
  },
];
