// Mada Spot - Seed Data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Villes principales de Madagascar
const cities = [
  'Antananarivo',
  'Toamasina',
  'Antsirabe',
  'Fianarantsoa',
  'Mahajanga',
  'Toliara',
  'Antsiranana',
  'Ambatondrazaka',
  'Manakara',
  'Nosy Be',
];

// Quartiers d'Antananarivo
const antananarivoDistricts = [
  'Analakely',
  'Antaninarenina',
  'Isoraka',
  'Tsaralalana',
  'Ampefiloha',
  'Ankorondrano',
  '67ha',
  'Ivandry',
  'Andraharo',
  'Ambatobe',
  'Ambohitrarahaba',
  'Talatamaty',
  'Andoharanofotsy',
  'Itaosy',
  'Ankadimbahoaka',
  'Tanjombato',
  'Ambohijanaka',
  'Andavamamba',
  'Anosibe',
  'Isotry',
];

async function main() {
  console.log('🌱 Démarrage du seed Mada Spot...\n');

  // Créer quelques paramètres par défaut
  console.log('⚙️  Création des paramètres...');

  const settings = [
    { key: 'site_name', value: 'Mada Spot', type: 'string' },
    { key: 'site_tagline', value: 'Bons plans à Madagascar', type: 'string' },
    { key: 'contact_email', value: 'contact@madaspot.mg', type: 'string' },
    { key: 'contact_phone', value: '+261 34 00 000 00', type: 'string' },
    { key: 'cities', value: JSON.stringify(cities), type: 'json' },
    { key: 'antananarivo_districts', value: JSON.stringify(antananarivoDistricts), type: 'json' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type },
      create: setting,
    });
  }

  console.log(`  ✅ ${settings.length} paramètres configurés`);

  console.log('\n🎉 Seed terminé avec succès!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
