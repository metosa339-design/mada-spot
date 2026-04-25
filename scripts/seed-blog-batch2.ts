import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db = prisma as any;

async function getCategoryId(slug: string): Promise<string | null> {
  const cat = await db.articleCategory.findUnique({ where: { slug } });
  return cat?.id || null;
}

async function createArticle(data: any) {
  const existing = await db.article.findUnique({ where: { slug: data.slug } });
  if (existing) {
    console.log(`  Skip: "${data.title}" (existe deja)`);
    return;
  }
  await db.article.create({ data });
  console.log(`  OK: "${data.title}"`);
}

async function seed() {
  const guides = await getCategoryId('guides-voyage');
  const destinations = await getCategoryId('destinations');
  const conseils = await getCategoryId('conseils-pratiques');
  const gastro = await getCategoryId('gastronomie');
  const culture = await getCategoryId('culture');

  const articles = [
    // --- DESTINATIONS ---
    {
      title: 'Ile Sainte-Marie : le paradis cache de la cote est de Madagascar',
      slug: 'ile-sainte-marie-madagascar-guide',
      categoryId: destinations,
      imageUrl: '/images/highlights/bemaraha.jpg',
      summary: 'Plages desertes, baleines a bosse, epaves de pirates... Decouvrez pourquoi Sainte-Marie est la destination preferee des voyageurs en quete d\'authenticite.',
      content: `<h2>Sainte-Marie, l'ile aux tresors</h2>
<p>L'ile Sainte-Marie (Nosy Boraha) est un joyau cache sur la cote est de Madagascar. Longue de 60 km et large de seulement 5 km, cette ile paradisiaque offre des plages de sable blanc, des eaux turquoise et une ambiance decontractee loin du tourisme de masse.</p>

<h2>Quand y aller ?</h2>
<p>La meilleure periode est de <strong>juillet a septembre</strong> pour observer les baleines a bosse qui viennent se reproduire dans le canal de Sainte-Marie. Pour la plage et la plongee, <strong>avril a novembre</strong> est ideal.</p>

<h2>Les incontournables</h2>
<ul>
<li><strong>Observation des baleines</strong> : de juillet a septembre, des centaines de baleines a bosse sont visibles depuis la cote</li>
<li><strong>Ile aux Nattes</strong> : petite ile accessible en pirogue, plages paradisiaques</li>
<li><strong>Cimetiere des pirates</strong> : vestige historique de l'epoque ou Sainte-Marie etait un repaire de pirates</li>
<li><strong>Piscine naturelle d'Ambodifotatra</strong> : baignade dans des bassins naturels</li>
<li><strong>Foret d'Ikalalao</strong> : randonnee pour observer les lemuriens</li>
</ul>

<h2>Comment y acceder ?</h2>
<p>Deux options : vol direct depuis Antananarivo (1h) ou bateau depuis Soanierana-Ivongo (2-3h en vedette rapide). Le bateau est plus aventureux mais offre des vues magnifiques.</p>

<h2>Ou dormir et manger ?</h2>
<p>Retrouvez les meilleurs hebergements et restaurants de Sainte-Marie sur <a href="/bons-plans/hotels?search=Sainte-Marie">Mada Spot</a>. Des eco-lodges en bord de plage aux petits hotels familiaux, il y en a pour tous les budgets.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Diego Suarez et la baie la plus belle du monde',
      slug: 'diego-suarez-baie-madagascar',
      categoryId: destinations,
      imageUrl: '/images/highlights/parc-national-montagne-dambre-430.jpg',
      summary: 'Diego Suarez (Antsiranana) abrite la deuxieme plus grande baie du monde. Guide complet : plages, Montagne d\'Ambre, Tsingy Rouges, Mer d\'Emeraude.',
      content: `<h2>Diego Suarez, la capitale du nord</h2>
<p>Antsiranana, plus connue sous le nom de Diego Suarez, est la ville la plus au nord de Madagascar. Sa baie, consideree comme la deuxieme plus belle du monde apres celle de Rio de Janeiro, offre un panorama a couper le souffle.</p>

<h2>Les sites incontournables</h2>
<h3>La Mer d'Emeraude</h3>
<p>Un lagon aux eaux turquoise accessible en bateau depuis Diego. Sable blanc, eau cristalline, poissons tropicaux — un paradis pour le snorkeling.</p>

<h3>Les Tsingy Rouges</h3>
<p>Formation geologique spectaculaire de terre rouge sculptee par l'erosion. Un paysage lunaire unique au monde, situe a environ 1h de route de Diego.</p>

<h3>Le Parc National de la Montagne d'Ambre</h3>
<p>Foret tropicale humide abritant des cascades, des lemuriens et une biodiversite exceptionnelle. Accessible en demi-journee depuis Diego.</p>

<h3>Les 3 Baies</h3>
<p>Le circuit des 3 Baies (Baie des Dunes, Baie des Pigeons, Baie des Sakalava) offre des plages sauvages magnifiques et du kitesurf de classe mondiale.</p>

<h2>Guide et transport</h2>
<p>Diego Suarez regorge de guides locaux et de chauffeurs 4x4 pour explorer la region. Trouvez les meilleurs prestataires sur <a href="/bons-plans/prestataires?search=Diego">Mada Spot</a>.</p>

<h2>Ou dormir ?</h2>
<p>Des hotels en centre-ville aux lodges en bord de plage, consultez notre <a href="/bons-plans/hotels?search=Antsiranana">selection d'hebergements a Diego Suarez</a>.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'La RN7 : le road trip mythique de Madagascar',
      slug: 'rn7-road-trip-madagascar-guide-complet',
      categoryId: guides,
      imageUrl: '/images/Attractions/baobabs/baobab-couche-de-soleil.jpg',
      summary: 'La Route Nationale 7 relie Antananarivo a Tulear sur 950 km. C\'est le road trip le plus populaire de Madagascar. Voici tout ce qu\'il faut savoir.',
      content: `<h2>La RN7 : 950 km d'emerveillement</h2>
<p>La Route Nationale 7 est l'itineraire touristique le plus emprunte de Madagascar. De la capitale Antananarivo jusqu'a la cote sud-ouest a Tulear (Toliara), cette route traverse des paysages incroyablement varies : rizieres en terrasses, forets de pins, savane, massifs rocheux...</p>

<h2>Itineraire recommande (7-10 jours)</h2>

<h3>Jour 1-2 : Antananarivo → Antsirabe (170 km)</h3>
<p>Premiere etape dans la "ville d'eau". Visitez les ateliers de pousse-pousse, les fabriques de bonbons et le lac Tritriva.</p>

<h3>Jour 3-4 : Antsirabe → Ambositra → Ranomafana (250 km)</h3>
<p>Traversez Ambositra, capitale de l'artisanat malgache (marqueterie, sculpture). Puis direction Ranomafana pour son parc national et ses sources thermales.</p>

<h3>Jour 4-5 : Ranomafana → Fianarantsoa → Ambalavao (130 km)</h3>
<p>Visitez Fianarantsoa, la "capitale culturelle", et Ambalavao pour le papier Antemoro et la reserve d'Anja (lemuriens).</p>

<h3>Jour 6-7 : Ambalavao → Parc National d'Isalo (250 km)</h3>
<p>Le clou du voyage ! Randonnees dans les canyons d'Isalo, piscines naturelles, couchers de soleil sur la "Fenetre de l'Isalo".</p>

<h3>Jour 8-10 : Isalo → Tulear → Ifaty (250 km)</h3>
<p>Terminez par les plages d'Ifaty, le recif corallien et la foret de baobabs.</p>

<h2>Budget</h2>
<ul>
<li><strong>Chauffeur-guide + 4x4</strong> : 60-100€/jour (essence incluse)</li>
<li><strong>Hotels</strong> : 15-80€/nuit selon le standing</li>
<li><strong>Entrees parcs</strong> : 25 000-65 000 Ar par parc</li>
<li><strong>Repas</strong> : 5-15€/repas</li>
</ul>

<h2>Trouvez votre chauffeur-guide</h2>
<p>Un bon chauffeur-guide fait toute la difference sur la RN7. Comparez les prestataires avec avis et photos sur <a href="/bons-plans/prestataires">Mada Spot</a>.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },

    // --- CONSEILS PRATIQUES ---
    {
      title: 'Budget voyage Madagascar 2026 : combien ca coute vraiment ?',
      slug: 'budget-voyage-madagascar-2026-prix',
      categoryId: conseils,
      imageUrl: '/images/highlights/tsingy-rouge-458.jpg',
      summary: 'Hotel, repas, transport, excursions... Decouvrez le vrai cout d\'un voyage a Madagascar en 2026, avec des exemples concrets pour chaque budget.',
      content: `<h2>Combien coute un voyage a Madagascar ?</h2>
<p>Madagascar reste l'une des destinations les plus abordables au monde. Mais les prix varient enormement selon votre style de voyage. Voici un guide detaille pour 2026.</p>

<h2>Hebergement</h2>
<table>
<tr><td><strong>Type</strong></td><td><strong>Prix/nuit</strong></td></tr>
<tr><td>Auberge/guesthouse</td><td>8-20€</td></tr>
<tr><td>Hotel milieu de gamme</td><td>25-60€</td></tr>
<tr><td>Hotel de charme / lodge</td><td>60-150€</td></tr>
<tr><td>Resort luxe</td><td>150-400€</td></tr>
</table>
<p>Comparez les prix sur <a href="/bons-plans/hotels">Mada Spot Hotels</a>.</p>

<h2>Nourriture</h2>
<ul>
<li><strong>Gargote locale (hotely)</strong> : 1-3€ le repas complet</li>
<li><strong>Restaurant touristique</strong> : 5-15€</li>
<li><strong>Restaurant gastronomique</strong> : 15-30€</li>
<li><strong>Biere locale (THB)</strong> : 0.50-1.50€</li>
</ul>

<h2>Transport</h2>
<ul>
<li><strong>Taxi-brousse</strong> : 5-15€ pour un long trajet</li>
<li><strong>Location 4x4 + chauffeur</strong> : 50-100€/jour</li>
<li><strong>Vol interieur</strong> : 100-250€ aller simple</li>
<li><strong>Taxi en ville</strong> : 1-5€</li>
</ul>

<h2>Activites</h2>
<ul>
<li><strong>Entree parc national</strong> : 10-25€</li>
<li><strong>Guide local (obligatoire dans les parcs)</strong> : 10-25€</li>
<li><strong>Excursion en mer (baleine, snorkeling)</strong> : 30-80€</li>
<li><strong>Plongee</strong> : 35-60€/plongee</li>
</ul>

<h2>Budget total pour 2 semaines</h2>
<ul>
<li><strong>Routard</strong> : 700-1000€ (hors vol international)</li>
<li><strong>Confort</strong> : 1500-2500€</li>
<li><strong>Luxe</strong> : 3000-5000€</li>
</ul>

<p>Optimisez votre budget en comparant les prestataires sur <a href="/bons-plans">Mada Spot</a> — c'est gratuit et sans intermediaire.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Visa Madagascar 2026 : demarches, prix et conseils',
      slug: 'visa-madagascar-2026-demarches-prix',
      categoryId: conseils,
      imageUrl: '/images/Attractions/nosy-be/nosy-be-vie-311.jpg',
      summary: 'Tout savoir sur le visa pour Madagascar en 2026 : types de visa, tarifs, documents necessaires et conseils pour eviter les problemes.',
      content: `<h2>Faut-il un visa pour Madagascar ?</h2>
<p>Oui, un visa est obligatoire pour tous les voyageurs etrangers. La bonne nouvelle : vous pouvez l'obtenir directement a l'arrivee a l'aeroport.</p>

<h2>Types de visa touristique</h2>
<ul>
<li><strong>Visa 30 jours</strong> : 35€ (le plus courant)</li>
<li><strong>Visa 60 jours</strong> : 40€</li>
<li><strong>Visa 90 jours</strong> : 50€ (necessite parfois une demande prealable)</li>
</ul>

<h2>Documents necessaires</h2>
<ul>
<li>Passeport valide au moins 6 mois apres la date d'entree</li>
<li>Billet d'avion retour ou de continuation</li>
<li>Justificatif d'hebergement (facultatif mais recommande)</li>
<li>Photo d'identite (rarement demandee mais au cas ou)</li>
<li>Especes en euros pour payer le visa (le paiement par carte n'est pas toujours disponible)</li>
</ul>

<h2>E-visa : l'option en ligne</h2>
<p>Madagascar propose un systeme d'e-visa sur <strong>evisamada.gov.mg</strong>. Remplissez le formulaire en ligne, payez, et presentez votre confirmation a l'arrivee. Plus rapide a l'aeroport mais pas toujours fiable — prevoyez un plan B.</p>

<h2>Conseils pratiques</h2>
<ul>
<li>Arrivez avec des euros ou dollars en especes pour le visa</li>
<li>La file d'attente peut etre longue — soyez patient</li>
<li>Gardez votre fiche de visa, elle sera demandee au depart</li>
<li>Pour un sejour de plus de 90 jours, faites une demande a l'ambassade avant le depart</li>
</ul>

<h2>Preparez votre sejour</h2>
<p>Une fois le visa en poche, planifiez vos hebergements et activites sur <a href="/bons-plans">Mada Spot</a>. Contactez directement les prestataires par WhatsApp.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Les 10 arnaques les plus courantes a Madagascar (et comment les eviter)',
      slug: 'arnaques-madagascar-comment-eviter',
      categoryId: conseils,
      imageUrl: '/images/highlights/grotte-ankarana-424.jpg',
      summary: 'Guides non-officiels, faux taxis, prix gonfles... Voici les arnaques les plus courantes a Madagascar et nos conseils pour voyager sereinement.',
      content: `<h2>Voyager malin a Madagascar</h2>
<p>Madagascar est une destination sure pour les touristes, mais comme partout, quelques arnaques existent. Les connaitre a l'avance vous evitera bien des desagrements.</p>

<h2>1. Les faux guides a l'aeroport</h2>
<p>Des personnes se presentent comme des "guides officiels" a la sortie de l'aeroport. <strong>Solution</strong> : reservez votre transfert a l'avance via <a href="/bons-plans/prestataires">un prestataire verifie sur Mada Spot</a>.</p>

<h2>2. Le prix "vazaha" (etranger)</h2>
<p>Certains commercants appliquent des prix gonfles pour les touristes. <strong>Solution</strong> : renseignez-vous sur les prix locaux et n'hesitez pas a negocier avec le sourire.</p>

<h2>3. Les taxis sans compteur</h2>
<p>La plupart des taxis n'ont pas de compteur. <strong>Solution</strong> : negociez le prix AVANT de monter. En ville, un trajet ne devrait pas depasser 10 000-20 000 Ar.</p>

<h2>4. Le change au noir</h2>
<p>Des changeurs de rue proposent des taux attractifs mais comptent mal. <strong>Solution</strong> : changez dans les banques ou bureaux de change officiels.</p>

<h2>5. Les excursions "tout compris" qui ne le sont pas</h2>
<p>Certains tour-operateurs annoncent un prix tout compris mais ajoutent des frais sur place. <strong>Solution</strong> : demandez un devis detaille par ecrit avant de payer.</p>

<h2>6. Les bijoux en "or" ou "saphir"</h2>
<p>Des vendeurs proposent des pierres precieuses a des prix "incroyables". <strong>Solution</strong> : n'achetez des pierres que chez des joailliers reconnus.</p>

<h2>7. Les faux sites de reservation</h2>
<p>Des sites web imitent des hotels connus. <strong>Solution</strong> : utilisez des plateformes fiables comme <a href="/bons-plans/hotels">Mada Spot</a> ou contactez directement l'hotel.</p>

<h2>8. Le "cadeau" qui n'en est pas un</h2>
<p>On vous offre un bracelet ou un objet, puis on reclame de l'argent. <strong>Solution</strong> : declinez poliment tout cadeau non sollicite.</p>

<h2>9. Les faux policiers</h2>
<p>Rare mais ca arrive : des personnes en civil pretendent etre des policiers. <strong>Solution</strong> : demandez a voir la carte professionnelle et proposez d'aller au commissariat.</p>

<h2>10. Le "probleme" avec votre hotel</h2>
<p>Un chauffeur vous dit que votre hotel est ferme/complet et propose un autre. <strong>Solution</strong> : verifiez directement aupres de l'hotel par telephone.</p>

<h2>Le meilleur conseil</h2>
<p>Reservez vos prestataires a l'avance sur <a href="/bons-plans">Mada Spot</a> : avis verifies, contact direct, pas d'intermediaire. C'est la meilleure protection contre les mauvaises surprises.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Quand partir a Madagascar ? Le guide mois par mois',
      slug: 'quand-partir-madagascar-meilleure-periode',
      categoryId: conseils,
      imageUrl: '/images/Attractions/nosy-be/nosy-lojo-420.jpg',
      summary: 'Saison seche, saison des pluies, cyclones... Decouvrez la meilleure periode pour visiter Madagascar selon votre destination et vos activites.',
      content: `<h2>Madagascar : un climat tropical a deux saisons</h2>
<p>Madagascar a deux saisons principales : la saison seche (avril-octobre) et la saison des pluies (novembre-mars). Mais le climat varie enormement selon les regions.</p>

<h2>Avril a Novembre : la saison seche (haute saison)</h2>
<p>C'est la meilleure periode pour visiter la plupart des regions. Temps sec, temperatures agreables (20-28°C), routes praticables.</p>

<h2>Guide mois par mois</h2>

<h3>Avril-Mai</h3>
<p>Fin de saison des pluies. Les paysages sont verdoyants, les prix sont bas. Bonne periode pour le sud et l'ouest.</p>

<h3>Juin-Aout</h3>
<p>Haute saison. Temps sec partout, ideal pour la RN7, les Tsingy, Nosy Be. <strong>Juillet-septembre</strong> : baleines a bosse a Sainte-Marie.</p>

<h3>Septembre-Novembre</h3>
<p>Temperatures qui remontent, toujours sec. Parfait pour la plage et la plongee. Les lemuriens sont actifs.</p>

<h3>Decembre-Mars</h3>
<p>Saison des pluies. Routes difficiles dans l'ouest (Tsingy inaccessibles). Mais c'est la saison des fruits et les plages de l'est sont belles. <strong>Attention</strong> : risque de cyclones en janvier-fevrier.</p>

<h2>Par destination</h2>
<ul>
<li><strong>Nosy Be</strong> : avril a novembre (plage toute l'annee)</li>
<li><strong>Tsingy de Bemaraha</strong> : mai a novembre uniquement</li>
<li><strong>RN7 et Isalo</strong> : avril a novembre</li>
<li><strong>Diego Suarez</strong> : mai a novembre</li>
<li><strong>Sainte-Marie</strong> : baleines juillet-septembre, plage avril-novembre</li>
</ul>

<h2>Reservez au bon moment</h2>
<p>En haute saison (juin-aout), les meilleurs hotels affichent complet rapidement. Reservez a l'avance sur <a href="/bons-plans/hotels">Mada Spot</a> pour garantir votre hebergement.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },

    // --- GUIDES ---
    {
      title: 'Comment trouver un bon guide touristique a Madagascar',
      slug: 'trouver-guide-touristique-madagascar',
      categoryId: guides,
      imageUrl: '/images/highlights/tsingy-bemaraha-415.jpg',
      summary: 'Un bon guide fait toute la difference. Voici comment choisir un guide fiable a Madagascar : certifications, avis, langues, specialites.',
      content: `<h2>Pourquoi prendre un guide a Madagascar ?</h2>
<p>Un guide local n'est pas un luxe a Madagascar — c'est souvent une necessite. Il est <strong>obligatoire dans tous les parcs nationaux</strong>, et meme ailleurs, un bon guide transforme votre voyage.</p>

<h2>Les avantages d'un guide local</h2>
<ul>
<li>Connaissance approfondie de la faune et la flore</li>
<li>Negociation des prix locaux</li>
<li>Traduction (le francais n'est pas parle partout)</li>
<li>Securite et logistique</li>
<li>Acces a des lieux hors des sentiers battus</li>
</ul>

<h2>Comment choisir ?</h2>

<h3>1. Verifiez les certifications</h3>
<p>Les guides des parcs nationaux doivent etre agrees par Madagascar National Parks. Demandez a voir la carte de guide.</p>

<h3>2. Lisez les avis</h3>
<p>Sur <a href="/bons-plans/prestataires">Mada Spot</a>, chaque guide a des avis verifies laissez par de vrais voyageurs. C'est le meilleur indicateur de qualite.</p>

<h3>3. Verifiez les langues parlees</h3>
<p>Assurez-vous que le guide parle votre langue. Le francais est courant, l'anglais moins. L'italien, l'allemand et l'espagnol sont plus rares.</p>

<h3>4. Demandez les specialites</h3>
<p>Certains guides sont specialises : ornithologie, trekking, plongee, culture locale. Choisissez en fonction de vos interets.</p>

<h3>5. Contactez directement</h3>
<p>Un bon guide repond rapidement et propose un programme personalise. Sur Mada Spot, contactez-les directement par WhatsApp.</p>

<h2>Combien ca coute ?</h2>
<ul>
<li><strong>Guide de parc national</strong> : 20 000-50 000 Ar/circuit</li>
<li><strong>Guide-accompagnateur</strong> : 30-60€/jour</li>
<li><strong>Chauffeur-guide</strong> : 50-100€/jour (avec vehicule)</li>
</ul>

<h2>Trouvez votre guide</h2>
<p>Comparez les guides de toute Madagascar sur <a href="/bons-plans/prestataires">Mada Spot</a> : photos, avis, langues, tarifs. Tout est transparent.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Parc National d\'Isalo : le Grand Canyon de Madagascar',
      slug: 'parc-national-isalo-guide-randonnee',
      categoryId: destinations,
      imageUrl: '/images/Attractions/isalo/piscine-naturelle-isalo-144.jpg',
      summary: 'Canyons, piscines naturelles, couchers de soleil epoustouflants... Le guide complet pour visiter le Parc National d\'Isalo sur la RN7.',
      content: `<h2>Isalo, le joyau de la RN7</h2>
<p>Le Parc National d'Isalo est le site le plus visite de Madagascar. Et pour cause : ses formations de gres sculptees par l'erosion, ses canyons profonds et ses piscines naturelles offrent des paysages dignes du Grand Canyon americain.</p>

<h2>Les circuits de randonnee</h2>

<h3>Circuit Piscine Naturelle (3-4h)</h3>
<p>Le circuit le plus populaire. Marche a travers les canyons jusqu'a une piscine naturelle d'eau cristalline entouree de palmiers. Baignade possible et recommandee !</p>

<h3>Circuit Canyon des Singes (5-6h)</h3>
<p>Plus sportif. Descente dans un canyon spectaculaire, observation de lemuriens (Sifakas), et piscine bleue. Le plus beau circuit du parc.</p>

<h3>Circuit Namaza (2-3h)</h3>
<p>Circuit facile, ideal pour les familles. Vue panoramique sur le massif et visite d'une grotte funeraire Bara.</p>

<h3>La Fenetre de l'Isalo</h3>
<p>Point de vue mythique pour le coucher du soleil. Le soleil se couche exactement dans une ouverture naturelle dans la roche. A ne pas manquer.</p>

<h2>Informations pratiques</h2>
<ul>
<li><strong>Droit d'entree</strong> : 65 000 Ar/adulte</li>
<li><strong>Guide obligatoire</strong> : 50 000-80 000 Ar selon le circuit</li>
<li><strong>Duree</strong> : prevoyez 1 a 2 jours complets</li>
<li><strong>Equipement</strong> : chaussures de randonnee, eau, maillot de bain, creme solaire</li>
</ul>

<h2>Ou dormir ?</h2>
<p>La ville-etape est Ranohira, a l'entree du parc. Retrouvez les hotels et lodges sur <a href="/bons-plans/hotels?search=Ranohira">Mada Spot</a>.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Top 10 des meilleurs restaurants a Antananarivo',
      slug: 'meilleurs-restaurants-antananarivo-2026',
      categoryId: gastro,
      imageUrl: '/images/highlights/bemaraha.jpg',
      summary: 'La capitale malgache regorge de bonnes adresses. Decouvrez notre selection des 10 meilleurs restaurants d\'Antananarivo pour tous les budgets.',
      content: `<h2>Antananarivo, capitale gastronomique</h2>
<p>Antananarivo (Tana) surprend par la richesse de sa scene culinaire. De la cuisine malgache traditionnelle aux restaurants francais, en passant par les adresses fusion, la capitale offre une diversite etonnante.</p>

<h2>Comment nous avons choisi</h2>
<p>Notre selection est basee sur les avis des voyageurs sur Mada Spot, la qualite des plats, le rapport qualite-prix et l'ambiance.</p>

<h2>Pour la cuisine malgache authentique</h2>
<p>Les "hotely" (petits restaurants locaux) servent les meilleurs plats malgaches : romazava, ravitoto, hen'omby ritra. Comptez 3 000-8 000 Ar pour un repas complet.</p>

<h2>Pour un diner special</h2>
<p>Plusieurs restaurants d'Antananarivo rivalisent avec les meilleures tables europeennes. Cuisine francaise, italienne ou fusion, dans des cadres magnifiques avec vue sur la ville.</p>

<h2>Pour le dejeuner rapide</h2>
<p>Les "snack" et boulangeries-patisseries d'Isoraka et Analakely proposent des repas rapides et abordables. Ideal entre deux visites.</p>

<h2>Street food</h2>
<p>Ne manquez pas les mofo gasy (crepes de riz), les nems, les brochettes de zebu et les beignets de banane vendus dans la rue. Savoureux et bon marche.</p>

<h2>Decouvrez toutes les adresses</h2>
<p>Retrouvez la liste complete des restaurants d'Antananarivo avec photos, avis et menus sur <a href="/bons-plans/restaurants?search=Antananarivo">Mada Spot</a>. Filtrez par cuisine, prix et quartier.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Securite a Madagascar : ce qu\'il faut savoir en 2026',
      slug: 'securite-madagascar-conseils-voyageurs-2026',
      categoryId: conseils,
      imageUrl: '/images/Attractions/baobabs/avenue-des-baobabs-a-madagascar-130.jpg',
      summary: 'Madagascar est-il dangereux ? Voici un point complet et honnete sur la securite pour les voyageurs en 2026.',
      content: `<h2>Madagascar est-il sur ?</h2>
<p>En resume : <strong>oui, Madagascar est une destination sure pour les touristes</strong>. Les Malgaches sont un peuple accueillant et les voyageurs sont generalement bien recus. Cela dit, comme dans tout pays, il y a des precautions a prendre.</p>

<h2>Les zones touristiques sont sures</h2>
<p>Nosy Be, la RN7, Diego Suarez, Sainte-Marie, les parcs nationaux — toutes les zones touristiques principales sont frequentees par des milliers de voyageurs sans probleme.</p>

<h2>Precautions basiques</h2>
<ul>
<li>Evitez de marcher seul la nuit dans les grandes villes</li>
<li>Ne montrez pas d'objets de valeur dans la rue</li>
<li>Gardez vos documents importants dans le coffre de l'hotel</li>
<li>Utilisez un guide local pour les deplacements hors des sentiers battus</li>
<li>Evitez les taxis-brousse de nuit</li>
</ul>

<h2>Sante</h2>
<ul>
<li><strong>Paludisme</strong> : prenez un traitement preventif (Malarone ou doxycycline)</li>
<li><strong>Eau</strong> : ne buvez que de l'eau en bouteille</li>
<li><strong>Soleil</strong> : protection solaire indispensable</li>
<li><strong>Assurance voyage</strong> : obligatoire, avec rapatriement</li>
</ul>

<h2>En cas de probleme</h2>
<ul>
<li>Ambassade de France a Antananarivo : +261 20 22 398 98</li>
<li>Police touristique : presente dans les zones touristiques</li>
<li>Numeros d'urgence : 117 (police), 118 (pompiers)</li>
</ul>

<h2>Le meilleur conseil securite</h2>
<p>Voyagez avec des prestataires fiables et verifies. Sur <a href="/bons-plans/prestataires">Mada Spot</a>, chaque guide et chauffeur a des avis reels laisses par des voyageurs. C'est la meilleure garantie pour un voyage serein.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Observer les baleines a Madagascar : guide complet',
      slug: 'observer-baleines-madagascar-sainte-marie',
      categoryId: guides,
      imageUrl: '/images/Attractions/nosy-be/nosy-be-vie-311.jpg',
      summary: 'Chaque annee de juillet a septembre, des centaines de baleines a bosse migrent vers Madagascar. Voici ou, quand et comment les observer.',
      content: `<h2>Les baleines a bosse de Madagascar</h2>
<p>Chaque annee, de <strong>juillet a septembre</strong>, des centaines de baleines a bosse (Megaptera novaeangliae) quittent les eaux froides de l'Antarctique pour venir se reproduire dans les eaux chaudes de Madagascar. C'est l'un des plus grands spectacles naturels au monde.</p>

<h2>Ou les observer ?</h2>

<h3>Ile Sainte-Marie (le meilleur spot)</h3>
<p>Le canal entre Sainte-Marie et la grande ile est LE lieu d'observation par excellence. Les baleines sont si proches qu'on peut parfois les voir depuis la plage.</p>

<h3>Baie d'Antongil (Fort Dauphin)</h3>
<p>Moins touristique mais tout aussi spectaculaire. La baie est une zone de reproduction privilegiee.</p>

<h3>Nosy Be</h3>
<p>Quelques observations possibles au large, mais moins frequentes qu'a Sainte-Marie.</p>

<h2>Comment ca se passe ?</h2>
<p>Les excursions durent generalement 3-4 heures en bateau. Un guide specialise vous accompagne et identifie les comportements : sauts (breach), frappes de queue, chants sous-marins avec hydrophone.</p>

<h2>Prix</h2>
<ul>
<li><strong>Excursion en bateau</strong> : 30 000-80 000 Ar (15-40€)</li>
<li><strong>Sortie privee</strong> : 100-200€</li>
</ul>

<h2>Regles d'observation</h2>
<ul>
<li>Distance minimale : 100 metres</li>
<li>Moteur coupe a l'approche</li>
<li>Pas de plongee avec les baleines</li>
<li>Choisissez un operateur qui respecte ces regles</li>
</ul>

<h2>Reservez votre excursion</h2>
<p>Trouvez les meilleurs operateurs d'observation de baleines sur <a href="/bons-plans/prestataires?search=baleine">Mada Spot</a>. Verifiez les avis pour choisir un operateur serieux et respectueux.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Les lemuriens de Madagascar : ou les voir et comment les proteger',
      slug: 'lemuriens-madagascar-ou-observer',
      categoryId: culture,
      imageUrl: '/images/highlights/tsingy-bemaraha-415.jpg',
      summary: 'Les lemuriens sont les stars de Madagascar. Decouvrez les meilleures reserves pour les observer et comment le tourisme aide a les proteger.',
      content: `<h2>Les lemuriens, ambassadeurs de Madagascar</h2>
<p>On ne trouve des lemuriens <strong>nulle part ailleurs au monde</strong> qu'a Madagascar. Ces primates fascinants existent en plus de 100 especes differentes, du minuscule microcebe (30g) au grand Indri (9kg).</p>

<h2>Les meilleurs endroits pour les observer</h2>

<h3>Parc National d'Andasibe (Indri Indri)</h3>
<p>A seulement 3h d'Antananarivo, c'est l'endroit ideal pour entendre et voir l'Indri Indri, le plus grand lemurien vivant. Son cri ressemble a un chant de baleine — inoubliable.</p>

<h3>Parc National de Ranomafana</h3>
<p>Foret tropicale humide abritant 12 especes de lemuriens, dont le rare lemurien bambou dore. Randonnees de nuit possibles pour voir les especes nocturnes.</p>

<h3>Reserve d'Anja (Ambalavao)</h3>
<p>Petite reserve communautaire sur la RN7. Les makis catta (lemuriens a queue annee) sont habituees aux visiteurs et se laissent approcher facilement. Parfait pour les photos.</p>

<h3>Parc National de l'Isalo</h3>
<p>Sifakas (lemuriens danseurs) et makis catta dans un decor de canyons spectaculaire.</p>

<h3>Ile aux lemuriens (Nosy Komba)</h3>
<p>Pres de Nosy Be, cette petite ile abrite des makis noirs qui viennent manger dans votre main. Experience unique mais touristique.</p>

<h2>Comment le tourisme aide les lemuriens</h2>
<p>Les droits d'entree des parcs financent la protection des forets. Les guides locaux sont formes a la conservation. En visitant ces reserves, vous contribuez directement a la survie des lemuriens.</p>

<h2>Regles d'observation</h2>
<ul>
<li>Ne nourrissez pas les lemuriens (sauf dans les reserves prevues a cet effet)</li>
<li>Gardez vos distances</li>
<li>Pas de flash photo</li>
<li>Restez silencieux</li>
</ul>

<h2>Planifiez votre visite</h2>
<p>Trouvez des guides specialises en faune sur <a href="/bons-plans/prestataires">Mada Spot</a> et reservez votre hotel pres des parcs nationaux sur <a href="/bons-plans/hotels">notre plateforme</a>.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Plongee a Madagascar : les 5 meilleurs spots',
      slug: 'plongee-madagascar-meilleurs-spots',
      categoryId: guides,
      imageUrl: '/images/Attractions/nosy-be/nosy-lojo-420.jpg',
      summary: 'Recifs coralliens, tortues, requins-baleines, epaves... Madagascar est un paradis pour la plongee. Voici les 5 spots incontournables.',
      content: `<h2>Madagascar, destination plongee</h2>
<p>Avec plus de 5 000 km de cotes, Madagascar offre certains des plus beaux sites de plongee de l'ocean Indien. Eaux chaudes, visibilite excellente et biodiversite marine exceptionnelle.</p>

<h2>1. Nosy Be et ses iles</h2>
<p>Le spot le plus populaire. Nosy Tanikely (reserve marine), Nosy Sakatia, et les iles Mitsio offrent des plongees spectaculaires : tortues, raies manta, requins a pointe blanche, coraux intacts.</p>
<p><strong>Meilleure periode</strong> : avril a novembre. <strong>Visibilite</strong> : 15-30m.</p>

<h2>2. Ifaty / Tulear</h2>
<p>Le Grand Recif de Tulear est le 3eme plus grand recif corallien au monde. Plongees accessibles a tous les niveaux, riche en poissons tropicaux et coraux.</p>

<h2>3. Ile Sainte-Marie</h2>
<p>En plus des baleines (en surface), Sainte-Marie offre des plongees sur epaves de navires pirates et des recifs vierges.</p>

<h2>4. Diego Suarez / Mer d'Emeraude</h2>
<p>Plongees dans la baie de Diego et snorkeling dans la Mer d'Emeraude. Eau cristalline et faune abondante.</p>

<h2>5. Anakao</h2>
<p>Village de pecheurs au sud de Tulear. Plongees intimistes loin du tourisme de masse. Requins-baleines de septembre a decembre.</p>

<h2>Prix</h2>
<ul>
<li><strong>Bapteme</strong> : 35-50€</li>
<li><strong>Plongee exploratoire</strong> : 30-60€</li>
<li><strong>Formation PADI Open Water</strong> : 300-450€</li>
<li><strong>Snorkeling</strong> : 15-25€</li>
</ul>

<h2>Trouvez votre club de plongee</h2>
<p>Comparez les centres de plongee certifies sur <a href="/bons-plans/prestataires?search=plongee">Mada Spot</a>. Verifiez les certifications, les avis et contactez-les par WhatsApp.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
  ];

  console.log(`Creating ${articles.length} articles...`);
  for (const article of articles) {
    await createArticle(article);
  }

  console.log('\nDone!');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
