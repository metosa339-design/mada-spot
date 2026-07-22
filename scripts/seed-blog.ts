// Run with: npx tsx scripts/seed-blog.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db = prisma as any;

const categories = [
  { name: 'Guides de voyage', slug: 'guides-voyage', color: '#3b82f6', order: 1 },
  { name: 'Destinations', slug: 'destinations', color: '#22c55e', order: 2 },
  { name: 'Conseils pratiques', slug: 'conseils-pratiques', color: '#f97316', order: 3 },
  { name: 'Gastronomie', slug: 'gastronomie', color: '#ef4444', order: 4 },
  { name: 'Culture', slug: 'culture', color: '#8b5cf6', order: 5 },
];

const articles = [
  {
    title: 'Top 10 des plus beaux hôtels à Nosy Be en 2026',
    slug: 'top-10-hotels-nosy-be-2026',
    categorySlug: 'guides-voyage',
    imageUrl: '/images/Attractions/nosy-be/nosy-lojo-420.jpg',
    summary: 'Découvrez notre sélection des meilleurs hôtels à Nosy Be, l\'île aux parfums de Madagascar. Du luxe 5 étoiles aux éco-lodges authentiques.',
    content: `<h2>Nosy Be, la perle de Madagascar</h2>
<p>Nosy Be est la destination balnéaire numéro un de Madagascar. Chaque année, des milliers de voyageurs du monde entier viennent profiter de ses plages paradisiaques, de sa faune marine exceptionnelle et de sa culture unique.</p>

<h2>Comment choisir son hôtel à Nosy Be ?</h2>
<p>Le choix d'un hôtel dépend de plusieurs critères : votre budget, le type d'expérience recherchée, la localisation et les services proposés. Voici nos critères de sélection :</p>
<ul>
<li><strong>Emplacement</strong> : proximité de la plage, accessibilité</li>
<li><strong>Rapport qualité-prix</strong> : ce que vous obtenez pour votre budget</li>
<li><strong>Avis clients</strong> : la satisfaction réelle des voyageurs</li>
<li><strong>Services</strong> : restaurant, excursions, transferts</li>
</ul>

<h2>Notre sélection</h2>
<p>Retrouvez tous les hôtels de Nosy Be avec photos, avis et prix sur <a href="/bons-plans/hotels?city=Nosy Be">Mada Spot</a>. Comparez et choisissez l'hébergement idéal pour votre séjour.</p>

<h3>Les éco-lodges</h3>
<p>Pour les voyageurs en quête d'authenticité, les éco-lodges de Nosy Be offrent une expérience immersive au cœur de la nature malgache. Bungalows en bois, cuisine locale, et excursions personnalisées.</p>

<h3>Les hôtels de charme</h3>
<p>À mi-chemin entre le luxe et l'authenticité, les hôtels de charme proposent un service personnalisé dans un cadre soigné. Parfait pour les couples et les voyageurs exigeants.</p>

<h2>Quand partir à Nosy Be ?</h2>
<p>La meilleure période pour visiter Nosy Be est d'avril à novembre (saison sèche). Les températures oscillent entre 25 et 32°C, idéales pour profiter des plages et des excursions en mer.</p>

<h2>Réservez malin</h2>
<p>Sur Mada Spot, vous pouvez comparer les prix, lire les avis vérifiés et contacter directement les hôtels par WhatsApp. C'est gratuit et sans intermédiaire.</p>`,
  },
  {
    title: 'Les Tsingy de Bemaraha : guide complet pour visiter ce site UNESCO',
    slug: 'guide-tsingy-bemaraha-madagascar',
    categorySlug: 'destinations',
    imageUrl: '/images/highlights/tsingy-bemaraha-415.jpg',
    summary: 'Tout ce que vous devez savoir pour visiter les Tsingy de Bemaraha : accès, meilleure période, guides locaux et hébergements à proximité.',
    content: `<h2>Un trésor géologique unique au monde</h2>
<p>Les Tsingy de Bemaraha, classés au patrimoine mondial de l'UNESCO, sont l'une des formations géologiques les plus spectaculaires de la planète. Ces forêts de pierres calcaires acérées s'étendent sur plus de 150 000 hectares dans l'ouest de Madagascar.</p>

<h2>Comment y accéder ?</h2>
<p>L'accès aux Tsingy se fait depuis la ville de Morondava. Comptez environ 8 à 10 heures de route en 4x4. La route est aventureuse mais le spectacle en vaut largement la chandelle.</p>
<ul>
<li><strong>Depuis Antananarivo</strong> : vol jusqu'à Morondava, puis 4x4</li>
<li><strong>Depuis Morondava</strong> : 200 km de piste, traversée du fleuve Manambolo en bac</li>
<li><strong>Période recommandée</strong> : mai à novembre (pistes impraticables en saison des pluies)</li>
</ul>

<h2>Que voir et faire ?</h2>
<p>Le parc offre plusieurs circuits de difficulté variable :</p>
<ul>
<li><strong>Petit Tsingy</strong> : circuit facile, accessible à tous, 2h</li>
<li><strong>Grand Tsingy</strong> : circuit sportif avec via ferrata, ponts suspendus, 4-5h</li>
<li><strong>Gorge de Manambolo</strong> : balade en pirogue dans les gorges</li>
</ul>

<h2>Trouver un guide</h2>
<p>Un guide local est obligatoire pour visiter le parc. Trouvez les meilleurs guides et prestataires de la région sur <a href="/bons-plans/prestataires">Mada Spot</a>.</p>

<h2>Où dormir ?</h2>
<p>Plusieurs lodges et campements se trouvent à l'entrée du parc à Bekopaka. Consultez notre <a href="/bons-plans/hotels?search=Bekopaka">liste d'hébergements</a> pour comparer les options.</p>`,
  },
  {
    title: '5 plats malgaches à goûter absolument lors de votre voyage',
    slug: '5-plats-malgaches-incontournables',
    categorySlug: 'gastronomie',
    imageUrl: '/images/highlights/grotte-ankarana-424.jpg',
    summary: 'La cuisine malgache est riche et variée. Découvrez les 5 plats traditionnels que tout voyageur doit goûter à Madagascar.',
    content: `<h2>La gastronomie malgache, un trésor méconnu</h2>
<p>La cuisine de Madagascar est un mélange unique d'influences africaines, asiatiques et européennes. Le riz (vary) est la base de chaque repas, accompagné de plats savoureux appelés "laoka".</p>

<h2>1. Le Romazava</h2>
<p>Le plat national malgache. C'est un bouillon de viande (zébu ou porc) avec des brèdes (feuilles vertes), des tomates et des épices. Simple mais délicieux, on le trouve dans chaque restaurant local.</p>

<h2>2. Le Ravitoto</h2>
<p>Des feuilles de manioc pilées, cuisinées avec du porc ou du zébu et de la noix de coco. Un plat riche et savoureux, typiquement malgache.</p>

<h2>3. Le Hen'omby ritra</h2>
<p>Du zébu mijoté longuement jusqu'à ce que la viande soit fondante. Servi avec du riz blanc et du "rougail" (sauce tomate pimentée). Un régal pour les amateurs de viande.</p>

<h2>4. Les Mofo gasy</h2>
<p>Ces petites crêpes de riz cuites dans des moules en fonte sont le petit-déjeuner typique des Malgaches. Sucrées ou salées, on les trouve partout dans les marchés.</p>

<h2>5. Le Achard de légumes</h2>
<p>Des légumes (mangue verte, citron, haricots) marinés dans du vinaigre avec du curcuma et du piment. L'accompagnement parfait pour tout repas malgache.</p>

<h2>Où manger ?</h2>
<p>Découvrez les meilleurs restaurants de Madagascar sur <a href="/bons-plans/restaurants">Mada Spot</a>. Filtrez par ville, cuisine et avis pour trouver le restaurant idéal.</p>`,
  },
  {
    title: 'Comment préparer son voyage à Madagascar : checklist complète',
    slug: 'preparer-voyage-madagascar-checklist',
    categorySlug: 'conseils-pratiques',
    imageUrl: '/images/Attractions/baobabs/avenue-des-baobabs-a-madagascar-130.jpg',
    summary: 'Visa, vaccins, budget, valise... Tout ce qu\'il faut savoir et préparer avant de partir à Madagascar.',
    content: `<h2>Madagascar : une destination qui se prépare</h2>
<p>Partir à Madagascar ne s'improvise pas. Entre les formalités administratives, les précautions santé et la logistique sur place, une bonne préparation est essentielle pour profiter pleinement de votre voyage.</p>

<h2>Formalités</h2>
<ul>
<li><strong>Passeport</strong> : valide au moins 6 mois après la date de retour</li>
<li><strong>Visa</strong> : obligatoire, disponible à l'arrivée à l'aéroport (environ 35€ pour 30 jours)</li>
<li><strong>Billet retour</strong> : exigé à l'entrée du territoire</li>
</ul>

<h2>Santé</h2>
<ul>
<li><strong>Vaccins</strong> : fièvre jaune (si provenance zone endémique), hépatite A et B recommandés</li>
<li><strong>Paludisme</strong> : traitement antipaludéen fortement recommandé</li>
<li><strong>Assurance voyage</strong> : indispensable, avec couverture rapatriement</li>
</ul>

<h2>Budget</h2>
<p>Madagascar est une destination abordable :</p>
<ul>
<li><strong>Budget routard</strong> : 25-40€/jour (hôtel simple + repas local + transport)</li>
<li><strong>Budget confort</strong> : 60-100€/jour (bon hôtel + restaurant + excursions)</li>
<li><strong>Budget luxe</strong> : 150€+/jour (lodge haut de gamme + guide privé)</li>
</ul>

<h2>Que mettre dans sa valise ?</h2>
<ul>
<li>Vêtements légers et couvrants (protection soleil et moustiques)</li>
<li>Bonnes chaussures de marche</li>
<li>Crème solaire et anti-moustique</li>
<li>Lampe frontale (coupures de courant fréquentes)</li>
<li>Médicaments de base</li>
<li>Adaptateur électrique (prises françaises)</li>
</ul>

<h2>Trouvez vos prestataires</h2>
<p>Réservez vos hôtels, guides et excursions sur <a href="/bons-plans">Mada Spot</a> avant votre départ. Contactez directement les prestataires par WhatsApp pour organiser votre séjour.</p>`,
  },
  {
    title: 'L\'Allée des Baobabs : tout savoir sur le site le plus photographié de Madagascar',
    slug: 'allee-des-baobabs-madagascar-guide',
    categorySlug: 'destinations',
    imageUrl: '/images/Attractions/baobabs/baobab-couche-de-soleil.jpg',
    summary: 'L\'Allée des Baobabs près de Morondava est le site le plus iconique de Madagascar. Guide complet : accès, meilleur moment, photos.',
    content: `<h2>L'icône de Madagascar</h2>
<p>L'Allée des Baobabs est sans doute l'image la plus connue de Madagascar. Cette rangée majestueuse de baobabs de Grandidier borde la route de terre entre Morondava et Belon'i Tsiribihina, offrant un spectacle inoubliable, surtout au coucher du soleil.</p>

<h2>Informations pratiques</h2>
<ul>
<li><strong>Localisation</strong> : 20 km au nord de Morondava, sur la RN8</li>
<li><strong>Accès</strong> : en voiture ou 4x4 depuis Morondava (30 min)</li>
<li><strong>Entrée</strong> : participation libre (don aux communautés locales)</li>
<li><strong>Meilleur moment</strong> : coucher du soleil (17h-18h), lever du soleil</li>
</ul>

<h2>Le meilleur moment pour la photo</h2>
<p>Les photographes du monde entier viennent capturer la lumière dorée du coucher de soleil filtrant entre les baobabs. Arrivez au moins 1h avant le coucher pour choisir votre angle et profiter de la lumière changeante.</p>

<h2>Les baobabs de Madagascar</h2>
<p>Madagascar abrite 6 des 8 espèces de baobabs au monde. L'Allée des Baobabs est composée principalement d'<em>Adansonia grandidieri</em>, l'espèce la plus majestueuse pouvant atteindre 30 mètres de haut et vivre plus de 800 ans.</p>

<h2>Combiner avec d'autres visites</h2>
<p>L'Allée des Baobabs se combine parfaitement avec :</p>
<ul>
<li>Les <a href="/blog/guide-tsingy-bemaraha-madagascar">Tsingy de Bemaraha</a> (2 jours de plus)</li>
<li>La descente du Tsiribihina en pirogue</li>
<li>La plage de Morondava</li>
</ul>

<h2>Trouver un guide et un chauffeur</h2>
<p>Pour organiser votre visite de l'Allée des Baobabs et des sites environnants, trouvez des <a href="/bons-plans/prestataires?search=Morondava">guides et chauffeurs à Morondava</a> sur Mada Spot.</p>`,
  },
];

async function seed() {
  console.log('Creating categories...');
  const catMap: Record<string, string> = {};

  for (const cat of categories) {
    const existing = await db.articleCategory.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      catMap[cat.slug] = existing.id;
      console.log(`  Category "${cat.name}" already exists`);
    } else {
      const created = await db.articleCategory.create({ data: cat });
      catMap[cat.slug] = created.id;
      console.log(`  Created category "${cat.name}"`);
    }
  }

  console.log('\nUpserting articles...');
  for (const article of articles) {
    const existing = await db.article.findUnique({ where: { slug: article.slug } });
    if (existing) {
      // Met à jour le contenu (titre/résumé/contenu avec accents) sans écraser
      // les stats ni la date de publication d'origine.
      await db.article.update({
        where: { slug: article.slug },
        data: {
          title: article.title,
          summary: article.summary,
          content: article.content,
          imageUrl: article.imageUrl,
          categoryId: catMap[article.categorySlug] || null,
        },
      });
      console.log(`  Updated article "${article.title}"`);
      continue;
    }

    await db.article.create({
      data: {
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        imageUrl: article.imageUrl,
        categoryId: catMap[article.categorySlug] || null,
        status: 'published',
        publishedAt: new Date(),
        isFeatured: article.slug === 'top-10-hotels-nosy-be-2026',
      },
    });
    console.log(`  Created article "${article.title}"`);
  }

  console.log('\nDone! Blog seeded with 5 articles.');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
