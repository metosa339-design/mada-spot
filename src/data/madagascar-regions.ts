// Données géographiques de Madagascar et types d'attractions

export const PROVINCES = [
  'Antananarivo',
  'Fianarantsoa',
  'Toamasina',
  'Mahajanga',
  'Toliara',
  'Antsiranana',
] as const;

export const REGIONS: Record<string, string[]> = {
  Antananarivo: ['Analamanga', 'Bongolava', 'Itasy', 'Vakinankaratra'],
  Fianarantsoa: ["Amoron'i Mania", 'Atsimo-Atsinanana', 'Haute Matsiatra', 'Ihorombe', 'Vatovavy'],
  Toamasina: ['Alaotra-Mangoro', 'Analanjirofo', 'Atsinanana'],
  Mahajanga: ['Betsiboka', 'Boeny', 'Melaky', 'Sofia'],
  Toliara: ['Androy', 'Anosy', 'Atsimo-Andrefana', 'Menabe'],
  Antsiranana: ['Diana', 'Sava'],
};

export const CITIES_BY_REGION: Record<string, string[]> = {
  // Antananarivo
  Analamanga: ['Antananarivo', 'Ambohidratrimo', 'Ankazobe', 'Anjozorobe', 'Manjakandriana'],
  Bongolava: ['Tsiroanomandidy', 'Fenoarivobe'],
  Itasy: ['Miarinarivo', 'Arivonimamo', 'Soavinandriana'],
  Vakinankaratra: ['Antsirabe', 'Ambatolampy', 'Betafo', 'Faratsiho'],

  // Fianarantsoa
  "Amoron'i Mania": ['Ambositra', 'Fandriana', 'Manandriana'],
  'Atsimo-Atsinanana': ['Farafangana', 'Vangaindrano', 'Midongy du Sud'],
  'Haute Matsiatra': ['Fianarantsoa', 'Ambalavao', 'Ambohimahasoa'],
  Ihorombe: ['Ihosy', 'Ivohibe', 'Iakora'],
  Vatovavy: ['Mananjary', 'Nosy Varika', 'Ifanadiana'],

  // Toamasina
  'Alaotra-Mangoro': ['Ambatondrazaka', 'Moramanga', 'Andilamena', 'Amparafaravola'],
  Analanjirofo: ['Fénérive Est', 'Maroantsetra', 'Mananara Nord', 'Sainte-Marie'],
  Atsinanana: ['Toamasina', 'Brickaville', 'Vatomandry', 'Mahanoro'],

  // Mahajanga
  Betsiboka: ['Maevatanana', 'Kandreho', 'Tsaratanana'],
  Boeny: ['Mahajanga', 'Ambato-Boeni', 'Marovoay', 'Mitsinjo', 'Soalala'],
  Melaky: ['Maintirano', 'Antsalova', 'Besalampy', 'Ambatomainty'],
  Sofia: ['Antsohihy', 'Port-Bergé', 'Mandritsara', 'Befandriana-Nord', 'Bealanana'],

  // Toliara
  Androy: ['Ambovombe', 'Bekily', 'Tsihombe'],
  Anosy: ['Fort-Dauphin', 'Amboasary-Sud', 'Betroka'],
  'Atsimo-Andrefana': ['Toliara', 'Morondava', 'Ankazoabo', 'Betioky', 'Sakaraha'],
  Menabe: ['Morondava', 'Belo sur Tsiribihina', 'Miandrivazo', 'Mahabo'],

  // Antsiranana
  Diana: ['Antsiranana', 'Nosy Be', 'Ambanja', 'Ambilobe'],
  Sava: ['Sambava', 'Antalaha', 'Vohémar', 'Andapa'],
};

export const ATTRACTION_TYPES = [
  { value: 'park', label: 'Parc' },
  { value: 'beach', label: 'Plage' },
  { value: 'waterfall', label: 'Cascade' },
  { value: 'museum', label: 'Musée' },
  { value: 'historical', label: 'Site historique' },
  { value: 'viewpoint', label: 'Point de vue' },
  { value: 'reserve', label: 'Réserve naturelle' },
  { value: 'nature', label: 'Site naturel' },
  { value: 'ile', label: 'Île' },
  { value: 'parc_national', label: 'Parc national' },
  { value: 'monument_naturel', label: 'Monument naturel' },
  { value: 'ville', label: 'Ville / Village remarquable' },
  { value: 'autre', label: 'Autre' },
] as const;
