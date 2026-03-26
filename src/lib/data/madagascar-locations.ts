// Les 22 régions de Madagascar avec leurs villes et quartiers principaux

export interface District {
  name: string;
  quartiers: string[];
}

export interface City {
  name: string;
  districts: District[];
}

export interface Region {
  name: string;
  code: string;
  cities: City[];
}

export const madagascarRegions: Region[] = [
  {
    name: "Analamanga",
    code: "ANA",
    cities: [
      {
        name: "Antananarivo",
        districts: [
          { name: "Antananarivo Renivohitra", quartiers: ["Analakely", "Isoraka", "Antaninarenina", "Ambohijatovo", "Ampefiloha", "67Ha", "Ankadifotsy", "Mahamasina", "Ankorondrano", "Andraharo", "Ambanidia", "Ankatso"] },
          { name: "Antananarivo Atsimondrano", quartiers: ["Itaosy", "Andoharanofotsy", "Tanjombato", "Ambohijanaka", "Andranonahoatra", "Soavimasoandro"] },
          { name: "Antananarivo Avaradrano", quartiers: ["Ivato", "Ambohidratrimo", "Talatamaty", "Ambohimanga", "Sabotsy Namehana", "Ankadikely Ilafy"] }
        ]
      },
      {
        name: "Ankazobe",
        districts: [{ name: "Ankazobe Centre", quartiers: ["Centre-ville", "Fihaonana"] }]
      },
      {
        name: "Anjozorobe",
        districts: [{ name: "Anjozorobe Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Manjakandriana",
        districts: [{ name: "Manjakandriana Centre", quartiers: ["Centre-ville", "Ambatomanga"] }]
      }
    ]
  },
  {
    name: "Vakinankaratra",
    code: "VAK",
    cities: [
      {
        name: "Antsirabe",
        districts: [
          { name: "Antsirabe I", quartiers: ["Centre-ville", "Antsenakely", "Mahazina", "Ambohimandroso"] },
          { name: "Antsirabe II", quartiers: ["Vinaninkarena", "Ambano", "Belazao"] }
        ]
      },
      {
        name: "Ambatolampy",
        districts: [{ name: "Ambatolampy Centre", quartiers: ["Centre-ville", "Behenjy"] }]
      },
      {
        name: "Betafo",
        districts: [{ name: "Betafo Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Itasy",
    code: "ITA",
    cities: [
      {
        name: "Miarinarivo",
        districts: [{ name: "Miarinarivo Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Arivonimamo",
        districts: [{ name: "Arivonimamo Centre", quartiers: ["Centre-ville", "Ambohitrambo"] }]
      },
      {
        name: "Soavinandriana",
        districts: [{ name: "Soavinandriana Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Bongolava",
    code: "BON",
    cities: [
      {
        name: "Tsiroanomandidy",
        districts: [{ name: "Tsiroanomandidy Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Fenoarivobe",
        districts: [{ name: "Fenoarivobe Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Haute Matsiatra",
    code: "HMA",
    cities: [
      {
        name: "Fianarantsoa",
        districts: [
          { name: "Fianarantsoa I", quartiers: ["Tanana Ambony", "Tsianolondroa", "Ankadinandriana", "Ivory"] },
          { name: "Fianarantsoa II", quartiers: ["Mahamanina", "Andrainjato"] }
        ]
      },
      {
        name: "Ambohimahasoa",
        districts: [{ name: "Ambohimahasoa Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Ambalavao",
        districts: [{ name: "Ambalavao Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Amoron'i Mania",
    code: "AMO",
    cities: [
      {
        name: "Ambositra",
        districts: [{ name: "Ambositra Centre", quartiers: ["Centre-ville", "Antsenakely", "Sandrandahy"] }]
      },
      {
        name: "Fandriana",
        districts: [{ name: "Fandriana Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Vatovavy",
    code: "VAT",
    cities: [
      {
        name: "Manakara",
        districts: [{ name: "Manakara Centre", quartiers: ["Centre-ville", "Tanambao", "Mangarivotra"] }]
      },
      {
        name: "Nosy Varika",
        districts: [{ name: "Nosy Varika Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Fitovinany",
    code: "FIT",
    cities: [
      {
        name: "Mananjary",
        districts: [{ name: "Mananjary Centre", quartiers: ["Centre-ville", "Antsenavolo"] }]
      },
      {
        name: "Ifanadiana",
        districts: [{ name: "Ifanadiana Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Atsimo-Atsinanana",
    code: "AAT",
    cities: [
      {
        name: "Farafangana",
        districts: [{ name: "Farafangana Centre", quartiers: ["Centre-ville", "Ambohigogo"] }]
      },
      {
        name: "Vangaindrano",
        districts: [{ name: "Vangaindrano Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Ihorombe",
    code: "IHO",
    cities: [
      {
        name: "Ihosy",
        districts: [{ name: "Ihosy Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Ivohibe",
        districts: [{ name: "Ivohibe Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Menabe",
    code: "MEN",
    cities: [
      {
        name: "Morondava",
        districts: [{ name: "Morondava Centre", quartiers: ["Centre-ville", "Nosy Kely", "Avaradrova"] }]
      },
      {
        name: "Belo sur Tsiribihina",
        districts: [{ name: "Belo Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Miandrivazo",
        districts: [{ name: "Miandrivazo Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Atsimo-Andrefana",
    code: "AAN",
    cities: [
      {
        name: "Toliara",
        districts: [
          { name: "Toliara I", quartiers: ["Centre-ville", "Mahavatse", "Tsimenatse", "Anketa", "Besakoa"] },
          { name: "Toliara II", quartiers: ["Belalanda", "Miary", "Ankilimalinika"] }
        ]
      },
      {
        name: "Sakaraha",
        districts: [{ name: "Sakaraha Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Betioky Sud",
        districts: [{ name: "Betioky Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Androy",
    code: "AND",
    cities: [
      {
        name: "Ambovombe",
        districts: [{ name: "Ambovombe Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Bekily",
        districts: [{ name: "Bekily Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Anosy",
    code: "ANO",
    cities: [
      {
        name: "Taolagnaro (Fort-Dauphin)",
        districts: [{ name: "Taolagnaro Centre", quartiers: ["Centre-ville", "Amboanato", "Esokaka", "Libanona"] }]
      },
      {
        name: "Amboasary-Sud",
        districts: [{ name: "Amboasary Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Atsinanana",
    code: "ATS",
    cities: [
      {
        name: "Toamasina",
        districts: [
          { name: "Toamasina I", quartiers: ["Centre-ville", "Morarano", "Tanambao V", "Anjoma", "Ampasimazava"] },
          { name: "Toamasina II", quartiers: ["Ambatofotsy", "Ankirihiry"] }
        ]
      },
      {
        name: "Brickaville",
        districts: [{ name: "Brickaville Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Analanjirofo",
    code: "ANJ",
    cities: [
      {
        name: "Fenoarivo Atsinanana",
        districts: [{ name: "Fenoarivo Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Sainte-Marie",
        districts: [{ name: "Ambodifotatra", quartiers: ["Centre-ville", "La Crique"] }]
      },
      {
        name: "Maroantsetra",
        districts: [{ name: "Maroantsetra Centre", quartiers: ["Centre-ville", "Anandrivola"] }]
      }
    ]
  },
  {
    name: "Alaotra-Mangoro",
    code: "ALA",
    cities: [
      {
        name: "Ambatondrazaka",
        districts: [{ name: "Ambatondrazaka Centre", quartiers: ["Centre-ville", "Antanifotsy"] }]
      },
      {
        name: "Moramanga",
        districts: [{ name: "Moramanga Centre", quartiers: ["Centre-ville", "Ambohibary"] }]
      },
      {
        name: "Andilamena",
        districts: [{ name: "Andilamena Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Boeny",
    code: "BOE",
    cities: [
      {
        name: "Mahajanga",
        districts: [
          { name: "Mahajanga I", quartiers: ["Centre-ville", "Mahabibo", "Ambalavato", "Tsaramandroso", "Manga"] },
          { name: "Mahajanga II", quartiers: ["Amborovy", "Belobaka"] }
        ]
      },
      {
        name: "Marovoay",
        districts: [{ name: "Marovoay Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Sofia",
    code: "SOF",
    cities: [
      {
        name: "Antsohihy",
        districts: [{ name: "Antsohihy Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Port-Bergé",
        districts: [{ name: "Port-Bergé Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Mandritsara",
        districts: [{ name: "Mandritsara Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Betsiboka",
    code: "BET",
    cities: [
      {
        name: "Maevatanana",
        districts: [{ name: "Maevatanana Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Tsaratanana",
        districts: [{ name: "Tsaratanana Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Melaky",
    code: "MEL",
    cities: [
      {
        name: "Maintirano",
        districts: [{ name: "Maintirano Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Besalampy",
        districts: [{ name: "Besalampy Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  },
  {
    name: "Diana",
    code: "DIA",
    cities: [
      {
        name: "Antsiranana (Diego-Suarez)",
        districts: [
          { name: "Antsiranana I", quartiers: ["Centre-ville", "Tanambao", "Scama", "Lazaret"] },
          { name: "Antsiranana II", quartiers: ["Ramena", "Joffre Ville"] }
        ]
      },
      {
        name: "Nosy Be",
        districts: [{ name: "Hell-Ville", quartiers: ["Centre-ville", "Ambatoloaka", "Madirokely", "Andilana"] }]
      },
      {
        name: "Ambanja",
        districts: [{ name: "Ambanja Centre", quartiers: ["Centre-ville", "Ambalavelona"] }]
      }
    ]
  },
  {
    name: "Sava",
    code: "SAV",
    cities: [
      {
        name: "Sambava",
        districts: [{ name: "Sambava Centre", quartiers: ["Centre-ville", "Tanambao"] }]
      },
      {
        name: "Antalaha",
        districts: [{ name: "Antalaha Centre", quartiers: ["Centre-ville", "Antanambaon'Antehiala"] }]
      },
      {
        name: "Vohemar",
        districts: [{ name: "Vohemar Centre", quartiers: ["Centre-ville"] }]
      },
      {
        name: "Andapa",
        districts: [{ name: "Andapa Centre", quartiers: ["Centre-ville"] }]
      }
    ]
  }
];

// Helper functions
export function getAllRegions(): string[] {
  return madagascarRegions.map(r => r.name);
}

export function getCitiesByRegion(regionName: string): string[] {
  const region = madagascarRegions.find(r => r.name === regionName);
  return region ? region.cities.map(c => c.name) : [];
}

export function getDistrictsByCity(regionName: string, cityName: string): string[] {
  const region = madagascarRegions.find(r => r.name === regionName);
  if (!region) return [];
  const city = region.cities.find(c => c.name === cityName);
  return city ? city.districts.map(d => d.name) : [];
}

export function getQuartiersByDistrict(regionName: string, cityName: string, districtName: string): string[] {
  const region = madagascarRegions.find(r => r.name === regionName);
  if (!region) return [];
  const city = region.cities.find(c => c.name === cityName);
  if (!city) return [];
  const district = city.districts.find(d => d.name === districtName);
  return district ? district.quartiers : [];
}

// Catégories de services avec questions prédéfinies
export const serviceCategories = [
  { id: 'electricien', name: 'Électricien', universe: 'btp-maison' },
  { id: 'plombier', name: 'Plombier', universe: 'btp-maison' },
  { id: 'macon', name: 'Maçon', universe: 'btp-maison' },
  { id: 'peintre', name: 'Peintre', universe: 'btp-maison' },
  { id: 'menuisier', name: 'Menuisier', universe: 'btp-maison' },
  { id: 'climatisation', name: 'Froid & Climatisation', universe: 'btp-maison' },
  { id: 'carreleur', name: 'Carreleur', universe: 'btp-maison' },
  { id: 'dev-web', name: 'Développeur Web', universe: 'tech-digital' },
  { id: 'graphiste', name: 'Graphiste', universe: 'tech-digital' },
  { id: 'community-manager', name: 'Community Manager', universe: 'tech-digital' },
  { id: 'photographe', name: 'Photographe', universe: 'evenementiel' },
  { id: 'traiteur', name: 'Traiteur', universe: 'evenementiel' },
  { id: 'dj', name: 'DJ', universe: 'evenementiel' },
  { id: 'decorateur', name: 'Décorateur', universe: 'evenementiel' },
  { id: 'comptable', name: 'Comptable', universe: 'services-pro' },
  { id: 'traducteur', name: 'Traducteur', universe: 'services-pro' },
  { id: 'coursier', name: 'Coursier', universe: 'services-pro' },
  { id: 'prof-francais', name: 'Prof de Français', universe: 'education' },
  { id: 'prof-maths', name: 'Prof de Maths', universe: 'education' },
  { id: 'prof-musique', name: 'Prof de Musique', universe: 'education' },
];

// Questions QQOQCP prédéfinies pour le profil
export const profileQuestions = {
  quoi: {
    label: "Que proposez-vous ?",
    placeholder: "Décrivez vos services principaux...",
    hint: "Ex: Installation électrique, dépannage, mise aux normes..."
  },
  qui: {
    label: "Pour qui ?",
    placeholder: "Particuliers, entreprises, les deux ?",
    hint: "Ex: Particuliers et petites entreprises"
  },
  comment: {
    label: "Comment travaillez-vous ?",
    placeholder: "Votre méthode de travail...",
    hint: "Ex: Je me déplace pour un diagnostic gratuit, puis je fournis un devis détaillé"
  },
  combien: {
    label: "Tarification",
    placeholder: "Comment facturez-vous ?",
    hint: "Ex: Forfait à partir de 50 000 Ar, ou tarif horaire selon complexité"
  },
  quand: {
    label: "Disponibilité",
    placeholder: "Vos horaires et jours de travail...",
    hint: "Ex: Du lundi au samedi, 8h-18h. Urgences le dimanche."
  },
  ou: {
    label: "Zone d'intervention",
    placeholder: "Où intervenez-vous ?",
    hint: "Sélectionnez vos zones ci-dessous"
  }
};

// Options de disponibilité
export const availabilityOptions = [
  { id: 'immediat', label: 'Disponible immédiatement' },
  { id: 'semaine', label: 'Disponible cette semaine' },
  { id: 'rdv', label: 'Sur rendez-vous uniquement' },
  { id: 'weekend', label: 'Disponible le weekend' },
  { id: 'urgence', label: 'Urgences acceptées' },
];

// Options de déplacement
export const mobilityOptions = [
  { id: 'quartier', label: 'Mon quartier uniquement', radius: 2 },
  { id: 'ville', label: 'Toute ma ville', radius: 10 },
  { id: 'region', label: 'Toute ma région', radius: 50 },
  { id: 'national', label: 'Tout Madagascar', radius: 0 },
];
