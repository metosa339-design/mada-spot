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
    title: 'Top 10 des plus beaux hotels a Nosy Be en 2026',
    slug: 'top-10-hotels-nosy-be-2026',
    categorySlug: 'guides-voyage',
    imageUrl: '/images/Attractions/nosy-be/nosy-lojo-420.jpg',
    summary: 'Decouvrez notre selection des meilleurs hotels a Nosy Be, l\'ile aux parfums de Madagascar. Du luxe 5 etoiles aux eco-lodges authentiques.',
    content: `<h2>Nosy Be, la perle de Madagascar</h2>
<p>Nosy Be est la destination balneaire numero un de Madagascar. Chaque annee, des milliers de voyageurs du monde entier viennent profiter de ses plages paradisiaques, de sa faune marine exceptionnelle et de sa culture unique.</p>

<h2>Comment choisir son hotel a Nosy Be ?</h2>
<p>Le choix d'un hotel depend de plusieurs criteres : votre budget, le type d'experience recherchee, la localisation et les services proposes. Voici nos criteres de selection :</p>
<ul>
<li><strong>Emplacement</strong> : proximite de la plage, accessibilite</li>
<li><strong>Rapport qualite-prix</strong> : ce que vous obtenez pour votre budget</li>
<li><strong>Avis clients</strong> : la satisfaction reelle des voyageurs</li>
<li><strong>Services</strong> : restaurant, excursions, transferts</li>
</ul>

<h2>Notre selection</h2>
<p>Retrouvez tous les hotels de Nosy Be avec photos, avis et prix sur <a href="/bons-plans/hotels?city=Nosy Be">Mada Spot</a>. Comparez et choisissez l'hebergement ideal pour votre sejour.</p>

<h3>Les eco-lodges</h3>
<p>Pour les voyageurs en quete d'authenticite, les eco-lodges de Nosy Be offrent une experience immersive au coeur de la nature malgache. Bungalows en bois, cuisine locale, et excursions personnalisees.</p>

<h3>Les hotels de charme</h3>
<p>A mi-chemin entre le luxe et l'authenticite, les hotels de charme proposent un service personnalise dans un cadre soigne. Parfait pour les couples et les voyageurs exigeants.</p>

<h2>Quand partir a Nosy Be ?</h2>
<p>La meilleure periode pour visiter Nosy Be est d'avril a novembre (saison seche). Les temperatures oscillent entre 25 et 32°C, ideales pour profiter des plages et des excursions en mer.</p>

<h2>Reservez malin</h2>
<p>Sur Mada Spot, vous pouvez comparer les prix, lire les avis verifies et contacter directement les hotels par WhatsApp. C'est gratuit et sans intermediaire.</p>`,
  },
  {
    title: 'Les Tsingy de Bemaraha : guide complet pour visiter ce site UNESCO',
    slug: 'guide-tsingy-bemaraha-madagascar',
    categorySlug: 'destinations',
    imageUrl: '/images/highlights/tsingy-bemaraha-415.jpg',
    summary: 'Tout ce que vous devez savoir pour visiter les Tsingy de Bemaraha : acces, meilleure periode, guides locaux et hebergements a proximite.',
    content: `<h2>Un tresor geologique unique au monde</h2>
<p>Les Tsingy de Bemaraha, classes au patrimoine mondial de l'UNESCO, sont l'une des formations geologiques les plus spectaculaires de la planete. Ces forets de pierres calcaires aceres s'etendent sur plus de 150 000 hectares dans l'ouest de Madagascar.</p>

<h2>Comment y acceder ?</h2>
<p>L'acces aux Tsingy se fait depuis la ville de Morondava. Comptez environ 8 a 10 heures de route en 4x4. La route est aventureuse mais le spectacle en vaut largement la chandelle.</p>
<ul>
<li><strong>Depuis Antananarivo</strong> : vol jusqu'a Morondava, puis 4x4</li>
<li><strong>Depuis Morondava</strong> : 200 km de piste, traversee du fleuve Manambolo en bac</li>
<li><strong>Periode recommandee</strong> : mai a novembre (pistes impraticables en saison des pluies)</li>
</ul>

<h2>Que voir et faire ?</h2>
<p>Le parc offre plusieurs circuits de difficulte variable :</p>
<ul>
<li><strong>Petit Tsingy</strong> : circuit facile, accessible a tous, 2h</li>
<li><strong>Grand Tsingy</strong> : circuit sportif avec via ferrata, ponts suspendus, 4-5h</li>
<li><strong>Gorge de Manambolo</strong> : balade en pirogue dans les gorges</li>
</ul>

<h2>Trouver un guide</h2>
<p>Un guide local est obligatoire pour visiter le parc. Trouvez les meilleurs guides et prestataires de la region sur <a href="/bons-plans/prestataires">Mada Spot</a>.</p>

<h2>Ou dormir ?</h2>
<p>Plusieurs lodges et campements se trouvent a l'entree du parc a Bekopaka. Consultez notre <a href="/bons-plans/hotels?search=Bekopaka">liste d'hebergements</a> pour comparer les options.</p>`,
  },
  {
    title: '5 plats malgaches a gouter absolument lors de votre voyage',
    slug: '5-plats-malgaches-incontournables',
    categorySlug: 'gastronomie',
    imageUrl: '/images/highlights/grotte-ankarana-424.jpg',
    summary: 'La cuisine malgache est riche et variee. Decouvrez les 5 plats traditionnels que tout voyageur doit gouter a Madagascar.',
    content: `<h2>La gastronomie malgache, un tresor meconnu</h2>
<p>La cuisine de Madagascar est un melange unique d'influences africaines, asiatiques et europeennes. Le riz (vary) est la base de chaque repas, accompagne de plats savoureux appeles "laoka".</p>

<h2>1. Le Romazava</h2>
<p>Le plat national malgache. C'est un bouillon de viande (zebu ou porc) avec des bredes (feuilles vertes), des tomates et des epices. Simple mais delicieux, on le trouve dans chaque restaurant local.</p>

<h2>2. Le Ravitoto</h2>
<p>Des feuilles de manioc pilees, cuisinees avec du porc ou du zebu et de la noix de coco. Un plat riche et savoureux, typiquement malgache.</p>

<h2>3. Le Hen'omby ritra</h2>
<p>Du zebu miote longuement jusqu'a ce que la viande soit fondante. Servi avec du riz blanc et du "rougail" (sauce tomate pimentee). Un regal pour les amateurs de viande.</p>

<h2>4. Les Mofo gasy</h2>
<p>Ces petites crepes de riz cuites dans des moules en fonte sont le petit-dejeuner typique des Malgaches. Sucrees ou salees, on les trouve partout dans les marches.</p>

<h2>5. Le Achard de legumes</h2>
<p>Des legumes (mangue verte, citron, haricots) marines dans du vinaigre avec du curcuma et du piment. L'accompagnement parfait pour tout repas malgache.</p>

<h2>Ou manger ?</h2>
<p>Decouvrez les meilleurs restaurants de Madagascar sur <a href="/bons-plans/restaurants">Mada Spot</a>. Filtrez par ville, cuisine et avis pour trouver le restaurant ideal.</p>`,
  },
  {
    title: 'Comment preparer son voyage a Madagascar : checklist complete',
    slug: 'preparer-voyage-madagascar-checklist',
    categorySlug: 'conseils-pratiques',
    imageUrl: '/images/Attractions/baobabs/avenue-des-baobabs-a-madagascar-130.jpg',
    summary: 'Visa, vaccins, budget, valise... Tout ce qu\'il faut savoir et preparer avant de partir a Madagascar.',
    content: `<h2>Madagascar : une destination qui se prepare</h2>
<p>Partir a Madagascar ne s'improvise pas. Entre les formalites administratives, les precautions sante et la logistique sur place, une bonne preparation est essentielle pour profiter pleinement de votre voyage.</p>

<h2>Formalites</h2>
<ul>
<li><strong>Passeport</strong> : valide au moins 6 mois apres la date de retour</li>
<li><strong>Visa</strong> : obligatoire, disponible a l'arrivee a l'aeroport (environ 35€ pour 30 jours)</li>
<li><strong>Billet retour</strong> : exige a l'entree du territoire</li>
</ul>

<h2>Sante</h2>
<ul>
<li><strong>Vaccins</strong> : fievre jaune (si provenance zone endemique), hepatite A et B recommandes</li>
<li><strong>Paludisme</strong> : traitement antipaludeen fortement recommande</li>
<li><strong>Assurance voyage</strong> : indispensable, avec couverture rapatriement</li>
</ul>

<h2>Budget</h2>
<p>Madagascar est une destination abordable :</p>
<ul>
<li><strong>Budget routard</strong> : 25-40€/jour (hotel simple + repas local + transport)</li>
<li><strong>Budget confort</strong> : 60-100€/jour (bon hotel + restaurant + excursions)</li>
<li><strong>Budget luxe</strong> : 150€+/jour (lodge haut de gamme + guide prive)</li>
</ul>

<h2>Que mettre dans sa valise ?</h2>
<ul>
<li>Vetements legers et couvrants (protection soleil et moustiques)</li>
<li>Bonnes chaussures de marche</li>
<li>Creme solaire et anti-moustique</li>
<li>Lampe frontale (coupures de courant frequentes)</li>
<li>Medicaments de base</li>
<li>Adaptateur electrique (prises francaises)</li>
</ul>

<h2>Trouvez vos prestataires</h2>
<p>Reservez vos hotels, guides et excursions sur <a href="/bons-plans">Mada Spot</a> avant votre depart. Contactez directement les prestataires par WhatsApp pour organiser votre sejour.</p>`,
  },
  {
    title: 'L\'Allee des Baobabs : tout savoir sur le site le plus photographie de Madagascar',
    slug: 'allee-des-baobabs-madagascar-guide',
    categorySlug: 'destinations',
    imageUrl: '/images/Attractions/baobabs/baobab-couche-de-soleil.jpg',
    summary: 'L\'Allee des Baobabs pres de Morondava est le site le plus iconique de Madagascar. Guide complet : acces, meilleur moment, photos.',
    content: `<h2>L'icone de Madagascar</h2>
<p>L'Allee des Baobabs est sans doute l'image la plus connue de Madagascar. Cette rangee majestueuse de baobabs de Grandidier borde la route de terre entre Morondava et Belon'i Tsiribihina, offrant un spectacle inoubliable, surtout au coucher du soleil.</p>

<h2>Informations pratiques</h2>
<ul>
<li><strong>Localisation</strong> : 20 km au nord de Morondava, sur la RN8</li>
<li><strong>Acces</strong> : en voiture ou 4x4 depuis Morondava (30 min)</li>
<li><strong>Entree</strong> : participation libre (don aux communautes locales)</li>
<li><strong>Meilleur moment</strong> : coucher du soleil (17h-18h), lever du soleil</li>
</ul>

<h2>Le meilleur moment pour la photo</h2>
<p>Les photographes du monde entier viennent capturer la lumiere doree du coucher de soleil filtrant entre les baobabs. Arrivez au moins 1h avant le coucher pour choisir votre angle et profiter de la lumiere changeante.</p>

<h2>Les baobabs de Madagascar</h2>
<p>Madagascar abrite 6 des 8 especes de baobabs au monde. L'Allee des Baobabs est composee principalement de <em>Adansonia grandidieri</em>, l'espece la plus majestueuse pouvant atteindre 30 metres de haut et vivre plus de 800 ans.</p>

<h2>Combiner avec d'autres visites</h2>
<p>L'Allee des Baobabs se combine parfaitement avec :</p>
<ul>
<li>Les <a href="/blog/guide-tsingy-bemaraha-madagascar">Tsingy de Bemaraha</a> (2 jours de plus)</li>
<li>La descente du Tsiribihina en pirogue</li>
<li>La plage de Morondava</li>
</ul>

<h2>Trouver un guide et un chauffeur</h2>
<p>Pour organiser votre visite de l'Allee des Baobabs et des sites environnants, trouvez des <a href="/bons-plans/prestataires?search=Morondava">guides et chauffeurs a Morondava</a> sur Mada Spot.</p>`,
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

  console.log('\nCreating articles...');
  for (const article of articles) {
    const existing = await db.article.findUnique({ where: { slug: article.slug } });
    if (existing) {
      console.log(`  Article "${article.title}" already exists, skipping`);
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
