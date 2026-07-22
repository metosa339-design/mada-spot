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
    // Met à jour le contenu (accents) sans écraser stats ni date de publication.
    await db.article.update({
      where: { slug: data.slug },
      data: {
        title: data.title,
        summary: data.summary,
        content: data.content,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
      },
    });
    console.log(`  MAJ: "${data.title}"`);
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
      title: 'Île Sainte-Marie : le paradis caché de la côte est de Madagascar',
      slug: 'ile-sainte-marie-madagascar-guide',
      categoryId: destinations,
      imageUrl: '/images/highlights/bemaraha.jpg',
      summary: 'Plages désertes, baleines à bosse, épaves de pirates... Découvrez pourquoi Sainte-Marie est la destination préférée des voyageurs en quête d\'authenticité.',
      content: `<h2>Sainte-Marie, l'île aux trésors</h2>
<p>L'île Sainte-Marie (Nosy Boraha) est un joyau caché sur la côte est de Madagascar. Longue de 60 km et large de seulement 5 km, cette île paradisiaque offre des plages de sable blanc, des eaux turquoise et une ambiance décontractée loin du tourisme de masse.</p>

<h2>Quand y aller ?</h2>
<p>La meilleure période est de <strong>juillet à septembre</strong> pour observer les baleines à bosse qui viennent se reproduire dans le canal de Sainte-Marie. Pour la plage et la plongée, <strong>avril à novembre</strong> est idéal.</p>

<h2>Les incontournables</h2>
<ul>
<li><strong>Observation des baleines</strong> : de juillet à septembre, des centaines de baleines à bosse sont visibles depuis la côte</li>
<li><strong>Île aux Nattes</strong> : petite île accessible en pirogue, plages paradisiaques</li>
<li><strong>Cimetière des pirates</strong> : vestige historique de l'époque où Sainte-Marie était un repaire de pirates</li>
<li><strong>Piscine naturelle d'Ambodifotatra</strong> : baignade dans des bassins naturels</li>
<li><strong>Forêt d'Ikalalao</strong> : randonnée pour observer les lémuriens</li>
</ul>

<h2>Comment y accéder ?</h2>
<p>Deux options : vol direct depuis Antananarivo (1h) ou bateau depuis Soanierana-Ivongo (2-3h en vedette rapide). Le bateau est plus aventureux mais offre des vues magnifiques.</p>

<h2>Où dormir et manger ?</h2>
<p>Retrouvez les meilleurs hébergements et restaurants de Sainte-Marie sur <a href="/bons-plans/hotels?search=Sainte-Marie">Mada Spot</a>. Des éco-lodges en bord de plage aux petits hôtels familiaux, il y en a pour tous les budgets.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Diego Suarez et la baie la plus belle du monde',
      slug: 'diego-suarez-baie-madagascar',
      categoryId: destinations,
      imageUrl: '/images/highlights/parc-national-montagne-dambre-430.jpg',
      summary: 'Diego Suarez (Antsiranana) abrite la deuxième plus grande baie du monde. Guide complet : plages, Montagne d\'Ambre, Tsingy Rouges, Mer d\'Émeraude.',
      content: `<h2>Diego Suarez, la capitale du nord</h2>
<p>Antsiranana, plus connue sous le nom de Diego Suarez, est la ville la plus au nord de Madagascar. Sa baie, considérée comme la deuxième plus belle du monde après celle de Rio de Janeiro, offre un panorama à couper le souffle.</p>

<h2>Les sites incontournables</h2>
<h3>La Mer d'Émeraude</h3>
<p>Un lagon aux eaux turquoise accessible en bateau depuis Diego. Sable blanc, eau cristalline, poissons tropicaux — un paradis pour le snorkeling.</p>

<h3>Les Tsingy Rouges</h3>
<p>Formation géologique spectaculaire de terre rouge sculptée par l'érosion. Un paysage lunaire unique au monde, situé à environ 1h de route de Diego.</p>

<h3>Le Parc National de la Montagne d'Ambre</h3>
<p>Forêt tropicale humide abritant des cascades, des lémuriens et une biodiversité exceptionnelle. Accessible en demi-journée depuis Diego.</p>

<h3>Les 3 Baies</h3>
<p>Le circuit des 3 Baies (Baie des Dunes, Baie des Pigeons, Baie des Sakalava) offre des plages sauvages magnifiques et du kitesurf de classe mondiale.</p>

<h2>Guide et transport</h2>
<p>Diego Suarez regorge de guides locaux et de chauffeurs 4x4 pour explorer la région. Trouvez les meilleurs prestataires sur <a href="/bons-plans/prestataires?search=Diego">Mada Spot</a>.</p>

<h2>Où dormir ?</h2>
<p>Des hôtels en centre-ville aux lodges en bord de plage, consultez notre <a href="/bons-plans/hotels?search=Antsiranana">sélection d'hébergements à Diego Suarez</a>.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'La RN7 : le road trip mythique de Madagascar',
      slug: 'rn7-road-trip-madagascar-guide-complet',
      categoryId: guides,
      imageUrl: '/images/Attractions/baobabs/baobab-couche-de-soleil.jpg',
      summary: 'La Route Nationale 7 relie Antananarivo à Tuléar sur 950 km. C\'est le road trip le plus populaire de Madagascar. Voici tout ce qu\'il faut savoir.',
      content: `<h2>La RN7 : 950 km d'émerveillement</h2>
<p>La Route Nationale 7 est l'itinéraire touristique le plus emprunté de Madagascar. De la capitale Antananarivo jusqu'à la côte sud-ouest à Tuléar (Toliara), cette route traverse des paysages incroyablement variés : rizières en terrasses, forêts de pins, savane, massifs rocheux...</p>

<h2>Itinéraire recommandé (7-10 jours)</h2>

<h3>Jour 1-2 : Antananarivo → Antsirabe (170 km)</h3>
<p>Première étape dans la "ville d'eau". Visitez les ateliers de pousse-pousse, les fabriques de bonbons et le lac Tritriva.</p>

<h3>Jour 3-4 : Antsirabe → Ambositra → Ranomafana (250 km)</h3>
<p>Traversez Ambositra, capitale de l'artisanat malgache (marqueterie, sculpture). Puis direction Ranomafana pour son parc national et ses sources thermales.</p>

<h3>Jour 4-5 : Ranomafana → Fianarantsoa → Ambalavao (130 km)</h3>
<p>Visitez Fianarantsoa, la "capitale culturelle", et Ambalavao pour le papier Antemoro et la réserve d'Anja (lémuriens).</p>

<h3>Jour 6-7 : Ambalavao → Parc National d'Isalo (250 km)</h3>
<p>Le clou du voyage ! Randonnées dans les canyons d'Isalo, piscines naturelles, couchers de soleil sur la "Fenêtre de l'Isalo".</p>

<h3>Jour 8-10 : Isalo → Tuléar → Ifaty (250 km)</h3>
<p>Terminez par les plages d'Ifaty, le récif corallien et la forêt de baobabs.</p>

<h2>Budget</h2>
<ul>
<li><strong>Chauffeur-guide + 4x4</strong> : 60-100€/jour (essence incluse)</li>
<li><strong>Hôtels</strong> : 15-80€/nuit selon le standing</li>
<li><strong>Entrées parcs</strong> : 25 000-65 000 Ar par parc</li>
<li><strong>Repas</strong> : 5-15€/repas</li>
</ul>

<h2>Trouvez votre chauffeur-guide</h2>
<p>Un bon chauffeur-guide fait toute la différence sur la RN7. Comparez les prestataires avec avis et photos sur <a href="/bons-plans/prestataires">Mada Spot</a>.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },

    // --- CONSEILS PRATIQUES ---
    {
      title: 'Budget voyage Madagascar 2026 : combien ça coûte vraiment ?',
      slug: 'budget-voyage-madagascar-2026-prix',
      categoryId: conseils,
      imageUrl: '/images/highlights/tsingy-rouge-458.jpg',
      summary: 'Hôtel, repas, transport, excursions... Découvrez le vrai coût d\'un voyage à Madagascar en 2026, avec des exemples concrets pour chaque budget.',
      content: `<h2>Combien coûte un voyage à Madagascar ?</h2>
<p>Madagascar reste l'une des destinations les plus abordables au monde. Mais les prix varient énormément selon votre style de voyage. Voici un guide détaillé pour 2026.</p>

<h2>Hébergement</h2>
<table>
<tr><td><strong>Type</strong></td><td><strong>Prix/nuit</strong></td></tr>
<tr><td>Auberge/guesthouse</td><td>8-20€</td></tr>
<tr><td>Hôtel milieu de gamme</td><td>25-60€</td></tr>
<tr><td>Hôtel de charme / lodge</td><td>60-150€</td></tr>
<tr><td>Resort luxe</td><td>150-400€</td></tr>
</table>
<p>Comparez les prix sur <a href="/bons-plans/hotels">Mada Spot Hotels</a>.</p>

<h2>Nourriture</h2>
<ul>
<li><strong>Gargote locale (hotely)</strong> : 1-3€ le repas complet</li>
<li><strong>Restaurant touristique</strong> : 5-15€</li>
<li><strong>Restaurant gastronomique</strong> : 15-30€</li>
<li><strong>Bière locale (THB)</strong> : 0.50-1.50€</li>
</ul>

<h2>Transport</h2>
<ul>
<li><strong>Taxi-brousse</strong> : 5-15€ pour un long trajet</li>
<li><strong>Location 4x4 + chauffeur</strong> : 50-100€/jour</li>
<li><strong>Vol intérieur</strong> : 100-250€ aller simple</li>
<li><strong>Taxi en ville</strong> : 1-5€</li>
</ul>

<h2>Activités</h2>
<ul>
<li><strong>Entrée parc national</strong> : 10-25€</li>
<li><strong>Guide local (obligatoire dans les parcs)</strong> : 10-25€</li>
<li><strong>Excursion en mer (baleine, snorkeling)</strong> : 30-80€</li>
<li><strong>Plongée</strong> : 35-60€/plongée</li>
</ul>

<h2>Budget total pour 2 semaines</h2>
<ul>
<li><strong>Routard</strong> : 700-1000€ (hors vol international)</li>
<li><strong>Confort</strong> : 1500-2500€</li>
<li><strong>Luxe</strong> : 3000-5000€</li>
</ul>

<p>Optimisez votre budget en comparant les prestataires sur <a href="/bons-plans">Mada Spot</a> — c'est gratuit et sans intermédiaire.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Visa Madagascar 2026 : démarches, prix et conseils',
      slug: 'visa-madagascar-2026-demarches-prix',
      categoryId: conseils,
      imageUrl: '/images/Attractions/nosy-be/nosy-be-vie-311.jpg',
      summary: 'Tout savoir sur le visa pour Madagascar en 2026 : types de visa, tarifs, documents nécessaires et conseils pour éviter les problèmes.',
      content: `<h2>Faut-il un visa pour Madagascar ?</h2>
<p>Oui, un visa est obligatoire pour tous les voyageurs étrangers. La bonne nouvelle : vous pouvez l'obtenir directement à l'arrivée à l'aéroport.</p>

<h2>Types de visa touristique</h2>
<ul>
<li><strong>Visa 30 jours</strong> : 35€ (le plus courant)</li>
<li><strong>Visa 60 jours</strong> : 40€</li>
<li><strong>Visa 90 jours</strong> : 50€ (nécessite parfois une demande préalable)</li>
</ul>

<h2>Documents nécessaires</h2>
<ul>
<li>Passeport valide au moins 6 mois après la date d'entrée</li>
<li>Billet d'avion retour ou de continuation</li>
<li>Justificatif d'hébergement (facultatif mais recommandé)</li>
<li>Photo d'identité (rarement demandée mais au cas où)</li>
<li>Espèces en euros pour payer le visa (le paiement par carte n'est pas toujours disponible)</li>
</ul>

<h2>E-visa : l'option en ligne</h2>
<p>Madagascar propose un système d'e-visa sur <strong>evisamada.gov.mg</strong>. Remplissez le formulaire en ligne, payez, et présentez votre confirmation à l'arrivée. Plus rapide à l'aéroport mais pas toujours fiable — prévoyez un plan B.</p>

<h2>Conseils pratiques</h2>
<ul>
<li>Arrivez avec des euros ou dollars en espèces pour le visa</li>
<li>La file d'attente peut être longue — soyez patient</li>
<li>Gardez votre fiche de visa, elle sera demandée au départ</li>
<li>Pour un séjour de plus de 90 jours, faites une demande à l'ambassade avant le départ</li>
</ul>

<h2>Préparez votre séjour</h2>
<p>Une fois le visa en poche, planifiez vos hébergements et activités sur <a href="/bons-plans">Mada Spot</a>. Contactez directement les prestataires par WhatsApp.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Les 10 arnaques les plus courantes à Madagascar (et comment les éviter)',
      slug: 'arnaques-madagascar-comment-eviter',
      categoryId: conseils,
      imageUrl: '/images/highlights/grotte-ankarana-424.jpg',
      summary: 'Guides non-officiels, faux taxis, prix gonflés... Voici les arnaques les plus courantes à Madagascar et nos conseils pour voyager sereinement.',
      content: `<h2>Voyager malin à Madagascar</h2>
<p>Madagascar est une destination sûre pour les touristes, mais comme partout, quelques arnaques existent. Les connaître à l'avance vous évitera bien des désagréments.</p>

<h2>1. Les faux guides à l'aéroport</h2>
<p>Des personnes se présentent comme des "guides officiels" à la sortie de l'aéroport. <strong>Solution</strong> : réservez votre transfert à l'avance via <a href="/bons-plans/prestataires">un prestataire vérifié sur Mada Spot</a>.</p>

<h2>2. Le prix "vazaha" (étranger)</h2>
<p>Certains commerçants appliquent des prix gonflés pour les touristes. <strong>Solution</strong> : renseignez-vous sur les prix locaux et n'hésitez pas à négocier avec le sourire.</p>

<h2>3. Les taxis sans compteur</h2>
<p>La plupart des taxis n'ont pas de compteur. <strong>Solution</strong> : négociez le prix AVANT de monter. En ville, un trajet ne devrait pas dépasser 10 000-20 000 Ar.</p>

<h2>4. Le change au noir</h2>
<p>Des changeurs de rue proposent des taux attractifs mais comptent mal. <strong>Solution</strong> : changez dans les banques ou bureaux de change officiels.</p>

<h2>5. Les excursions "tout compris" qui ne le sont pas</h2>
<p>Certains tour-opérateurs annoncent un prix tout compris mais ajoutent des frais sur place. <strong>Solution</strong> : demandez un devis détaillé par écrit avant de payer.</p>

<h2>6. Les bijoux en "or" ou "saphir"</h2>
<p>Des vendeurs proposent des pierres précieuses à des prix "incroyables". <strong>Solution</strong> : n'achetez des pierres que chez des joailliers reconnus.</p>

<h2>7. Les faux sites de réservation</h2>
<p>Des sites web imitent des hôtels connus. <strong>Solution</strong> : utilisez des plateformes fiables comme <a href="/bons-plans/hotels">Mada Spot</a> ou contactez directement l'hôtel.</p>

<h2>8. Le "cadeau" qui n'en est pas un</h2>
<p>On vous offre un bracelet ou un objet, puis on réclame de l'argent. <strong>Solution</strong> : déclinez poliment tout cadeau non sollicité.</p>

<h2>9. Les faux policiers</h2>
<p>Rare mais ça arrive : des personnes en civil prétendent être des policiers. <strong>Solution</strong> : demandez à voir la carte professionnelle et proposez d'aller au commissariat.</p>

<h2>10. Le "problème" avec votre hôtel</h2>
<p>Un chauffeur vous dit que votre hôtel est fermé/complet et propose un autre. <strong>Solution</strong> : vérifiez directement auprès de l'hôtel par téléphone.</p>

<h2>Le meilleur conseil</h2>
<p>Réservez vos prestataires à l'avance sur <a href="/bons-plans">Mada Spot</a> : avis vérifiés, contact direct, pas d'intermédiaire. C'est la meilleure protection contre les mauvaises surprises.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Quand partir à Madagascar ? Le guide mois par mois',
      slug: 'quand-partir-madagascar-meilleure-periode',
      categoryId: conseils,
      imageUrl: '/images/Attractions/nosy-be/nosy-lojo-420.jpg',
      summary: 'Saison sèche, saison des pluies, cyclones... Découvrez la meilleure période pour visiter Madagascar selon votre destination et vos activités.',
      content: `<h2>Madagascar : un climat tropical à deux saisons</h2>
<p>Madagascar a deux saisons principales : la saison sèche (avril-octobre) et la saison des pluies (novembre-mars). Mais le climat varie énormément selon les régions.</p>

<h2>Avril à Novembre : la saison sèche (haute saison)</h2>
<p>C'est la meilleure période pour visiter la plupart des régions. Temps sec, températures agréables (20-28°C), routes praticables.</p>

<h2>Guide mois par mois</h2>

<h3>Avril-Mai</h3>
<p>Fin de saison des pluies. Les paysages sont verdoyants, les prix sont bas. Bonne période pour le sud et l'ouest.</p>

<h3>Juin-Août</h3>
<p>Haute saison. Temps sec partout, idéal pour la RN7, les Tsingy, Nosy Be. <strong>Juillet-septembre</strong> : baleines à bosse à Sainte-Marie.</p>

<h3>Septembre-Novembre</h3>
<p>Températures qui remontent, toujours sec. Parfait pour la plage et la plongée. Les lémuriens sont actifs.</p>

<h3>Décembre-Mars</h3>
<p>Saison des pluies. Routes difficiles dans l'ouest (Tsingy inaccessibles). Mais c'est la saison des fruits et les plages de l'est sont belles. <strong>Attention</strong> : risque de cyclones en janvier-février.</p>

<h2>Par destination</h2>
<ul>
<li><strong>Nosy Be</strong> : avril à novembre (plage toute l'année)</li>
<li><strong>Tsingy de Bemaraha</strong> : mai à novembre uniquement</li>
<li><strong>RN7 et Isalo</strong> : avril à novembre</li>
<li><strong>Diego Suarez</strong> : mai à novembre</li>
<li><strong>Sainte-Marie</strong> : baleines juillet-septembre, plage avril-novembre</li>
</ul>

<h2>Réservez au bon moment</h2>
<p>En haute saison (juin-août), les meilleurs hôtels affichent complet rapidement. Réservez à l'avance sur <a href="/bons-plans/hotels">Mada Spot</a> pour garantir votre hébergement.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },

    // --- GUIDES ---
    {
      title: 'Comment trouver un bon guide touristique à Madagascar',
      slug: 'trouver-guide-touristique-madagascar',
      categoryId: guides,
      imageUrl: '/images/highlights/tsingy-bemaraha-415.jpg',
      summary: 'Un bon guide fait toute la différence. Voici comment choisir un guide fiable à Madagascar : certifications, avis, langues, spécialités.',
      content: `<h2>Pourquoi prendre un guide à Madagascar ?</h2>
<p>Un guide local n'est pas un luxe à Madagascar — c'est souvent une nécessité. Il est <strong>obligatoire dans tous les parcs nationaux</strong>, et même ailleurs, un bon guide transforme votre voyage.</p>

<h2>Les avantages d'un guide local</h2>
<ul>
<li>Connaissance approfondie de la faune et la flore</li>
<li>Négociation des prix locaux</li>
<li>Traduction (le français n'est pas parlé partout)</li>
<li>Sécurité et logistique</li>
<li>Accès à des lieux hors des sentiers battus</li>
</ul>

<h2>Comment choisir ?</h2>

<h3>1. Vérifiez les certifications</h3>
<p>Les guides des parcs nationaux doivent être agréés par Madagascar National Parks. Demandez à voir la carte de guide.</p>

<h3>2. Lisez les avis</h3>
<p>Sur <a href="/bons-plans/prestataires">Mada Spot</a>, chaque guide a des avis vérifiés laissés par de vrais voyageurs. C'est le meilleur indicateur de qualité.</p>

<h3>3. Vérifiez les langues parlées</h3>
<p>Assurez-vous que le guide parle votre langue. Le français est courant, l'anglais moins. L'italien, l'allemand et l'espagnol sont plus rares.</p>

<h3>4. Demandez les spécialités</h3>
<p>Certains guides sont spécialisés : ornithologie, trekking, plongée, culture locale. Choisissez en fonction de vos intérêts.</p>

<h3>5. Contactez directement</h3>
<p>Un bon guide répond rapidement et propose un programme personnalisé. Sur Mada Spot, contactez-les directement par WhatsApp.</p>

<h2>Combien ça coûte ?</h2>
<ul>
<li><strong>Guide de parc national</strong> : 20 000-50 000 Ar/circuit</li>
<li><strong>Guide-accompagnateur</strong> : 30-60€/jour</li>
<li><strong>Chauffeur-guide</strong> : 50-100€/jour (avec véhicule)</li>
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
      summary: 'Canyons, piscines naturelles, couchers de soleil époustouflants... Le guide complet pour visiter le Parc National d\'Isalo sur la RN7.',
      content: `<h2>Isalo, le joyau de la RN7</h2>
<p>Le Parc National d'Isalo est le site le plus visité de Madagascar. Et pour cause : ses formations de grès sculptées par l'érosion, ses canyons profonds et ses piscines naturelles offrent des paysages dignes du Grand Canyon américain.</p>

<h2>Les circuits de randonnée</h2>

<h3>Circuit Piscine Naturelle (3-4h)</h3>
<p>Le circuit le plus populaire. Marche à travers les canyons jusqu'à une piscine naturelle d'eau cristalline entourée de palmiers. Baignade possible et recommandée !</p>

<h3>Circuit Canyon des Singes (5-6h)</h3>
<p>Plus sportif. Descente dans un canyon spectaculaire, observation de lémuriens (Sifakas), et piscine bleue. Le plus beau circuit du parc.</p>

<h3>Circuit Namaza (2-3h)</h3>
<p>Circuit facile, idéal pour les familles. Vue panoramique sur le massif et visite d'une grotte funéraire Bara.</p>

<h3>La Fenêtre de l'Isalo</h3>
<p>Point de vue mythique pour le coucher du soleil. Le soleil se couche exactement dans une ouverture naturelle dans la roche. À ne pas manquer.</p>

<h2>Informations pratiques</h2>
<ul>
<li><strong>Droit d'entrée</strong> : 65 000 Ar/adulte</li>
<li><strong>Guide obligatoire</strong> : 50 000-80 000 Ar selon le circuit</li>
<li><strong>Durée</strong> : prévoyez 1 à 2 jours complets</li>
<li><strong>Équipement</strong> : chaussures de randonnée, eau, maillot de bain, crème solaire</li>
</ul>

<h2>Où dormir ?</h2>
<p>La ville-étape est Ranohira, à l'entrée du parc. Retrouvez les hôtels et lodges sur <a href="/bons-plans/hotels?search=Ranohira">Mada Spot</a>.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Top 10 des meilleurs restaurants à Antananarivo',
      slug: 'meilleurs-restaurants-antananarivo-2026',
      categoryId: gastro,
      imageUrl: '/images/highlights/bemaraha.jpg',
      summary: 'La capitale malgache regorge de bonnes adresses. Découvrez notre sélection des 10 meilleurs restaurants d\'Antananarivo pour tous les budgets.',
      content: `<h2>Antananarivo, capitale gastronomique</h2>
<p>Antananarivo (Tana) surprend par la richesse de sa scène culinaire. De la cuisine malgache traditionnelle aux restaurants français, en passant par les adresses fusion, la capitale offre une diversité étonnante.</p>

<h2>Comment nous avons choisi</h2>
<p>Notre sélection est basée sur les avis des voyageurs sur Mada Spot, la qualité des plats, le rapport qualité-prix et l'ambiance.</p>

<h2>Pour la cuisine malgache authentique</h2>
<p>Les "hotely" (petits restaurants locaux) servent les meilleurs plats malgaches : romazava, ravitoto, hen'omby ritra. Comptez 3 000-8 000 Ar pour un repas complet.</p>

<h2>Pour un dîner spécial</h2>
<p>Plusieurs restaurants d'Antananarivo rivalisent avec les meilleures tables européennes. Cuisine française, italienne ou fusion, dans des cadres magnifiques avec vue sur la ville.</p>

<h2>Pour le déjeuner rapide</h2>
<p>Les "snack" et boulangeries-pâtisseries d'Isoraka et Analakely proposent des repas rapides et abordables. Idéal entre deux visites.</p>

<h2>Street food</h2>
<p>Ne manquez pas les mofo gasy (crêpes de riz), les nems, les brochettes de zébu et les beignets de banane vendus dans la rue. Savoureux et bon marché.</p>

<h2>Découvrez toutes les adresses</h2>
<p>Retrouvez la liste complète des restaurants d'Antananarivo avec photos, avis et menus sur <a href="/bons-plans/restaurants?search=Antananarivo">Mada Spot</a>. Filtrez par cuisine, prix et quartier.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Sécurité à Madagascar : ce qu\'il faut savoir en 2026',
      slug: 'securite-madagascar-conseils-voyageurs-2026',
      categoryId: conseils,
      imageUrl: '/images/Attractions/baobabs/avenue-des-baobabs-a-madagascar-130.jpg',
      summary: 'Madagascar est-il dangereux ? Voici un point complet et honnête sur la sécurité pour les voyageurs en 2026.',
      content: `<h2>Madagascar est-il sûr ?</h2>
<p>En résumé : <strong>oui, Madagascar est une destination sûre pour les touristes</strong>. Les Malgaches sont un peuple accueillant et les voyageurs sont généralement bien reçus. Cela dit, comme dans tout pays, il y a des précautions à prendre.</p>

<h2>Les zones touristiques sont sûres</h2>
<p>Nosy Be, la RN7, Diego Suarez, Sainte-Marie, les parcs nationaux — toutes les zones touristiques principales sont fréquentées par des milliers de voyageurs sans problème.</p>

<h2>Précautions basiques</h2>
<ul>
<li>Évitez de marcher seul la nuit dans les grandes villes</li>
<li>Ne montrez pas d'objets de valeur dans la rue</li>
<li>Gardez vos documents importants dans le coffre de l'hôtel</li>
<li>Utilisez un guide local pour les déplacements hors des sentiers battus</li>
<li>Évitez les taxis-brousse de nuit</li>
</ul>

<h2>Santé</h2>
<ul>
<li><strong>Paludisme</strong> : prenez un traitement préventif (Malarone ou doxycycline)</li>
<li><strong>Eau</strong> : ne buvez que de l'eau en bouteille</li>
<li><strong>Soleil</strong> : protection solaire indispensable</li>
<li><strong>Assurance voyage</strong> : obligatoire, avec rapatriement</li>
</ul>

<h2>En cas de problème</h2>
<ul>
<li>Ambassade de France à Antananarivo : +261 20 22 398 98</li>
<li>Police touristique : présente dans les zones touristiques</li>
<li>Numéros d'urgence : 117 (police), 118 (pompiers)</li>
</ul>

<h2>Le meilleur conseil sécurité</h2>
<p>Voyagez avec des prestataires fiables et vérifiés. Sur <a href="/bons-plans/prestataires">Mada Spot</a>, chaque guide et chauffeur a des avis réels laissés par des voyageurs. C'est la meilleure garantie pour un voyage serein.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Observer les baleines à Madagascar : guide complet',
      slug: 'observer-baleines-madagascar-sainte-marie',
      categoryId: guides,
      imageUrl: '/images/Attractions/nosy-be/nosy-be-vie-311.jpg',
      summary: 'Chaque année de juillet à septembre, des centaines de baleines à bosse migrent vers Madagascar. Voici où, quand et comment les observer.',
      content: `<h2>Les baleines à bosse de Madagascar</h2>
<p>Chaque année, de <strong>juillet à septembre</strong>, des centaines de baleines à bosse (Megaptera novaeangliae) quittent les eaux froides de l'Antarctique pour venir se reproduire dans les eaux chaudes de Madagascar. C'est l'un des plus grands spectacles naturels au monde.</p>

<h2>Où les observer ?</h2>

<h3>Île Sainte-Marie (le meilleur spot)</h3>
<p>Le canal entre Sainte-Marie et la grande île est LE lieu d'observation par excellence. Les baleines sont si proches qu'on peut parfois les voir depuis la plage.</p>

<h3>Baie d'Antongil (Fort Dauphin)</h3>
<p>Moins touristique mais tout aussi spectaculaire. La baie est une zone de reproduction privilégiée.</p>

<h3>Nosy Be</h3>
<p>Quelques observations possibles au large, mais moins fréquentes qu'à Sainte-Marie.</p>

<h2>Comment ça se passe ?</h2>
<p>Les excursions durent généralement 3-4 heures en bateau. Un guide spécialisé vous accompagne et identifie les comportements : sauts (breach), frappes de queue, chants sous-marins avec hydrophone.</p>

<h2>Prix</h2>
<ul>
<li><strong>Excursion en bateau</strong> : 30 000-80 000 Ar (15-40€)</li>
<li><strong>Sortie privée</strong> : 100-200€</li>
</ul>

<h2>Règles d'observation</h2>
<ul>
<li>Distance minimale : 100 mètres</li>
<li>Moteur coupé à l'approche</li>
<li>Pas de plongée avec les baleines</li>
<li>Choisissez un opérateur qui respecte ces règles</li>
</ul>

<h2>Réservez votre excursion</h2>
<p>Trouvez les meilleurs opérateurs d'observation de baleines sur <a href="/bons-plans/prestataires?search=baleine">Mada Spot</a>. Vérifiez les avis pour choisir un opérateur sérieux et respectueux.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Les lémuriens de Madagascar : où les voir et comment les protéger',
      slug: 'lemuriens-madagascar-ou-observer',
      categoryId: culture,
      imageUrl: '/images/highlights/tsingy-bemaraha-415.jpg',
      summary: 'Les lémuriens sont les stars de Madagascar. Découvrez les meilleures réserves pour les observer et comment le tourisme aide à les protéger.',
      content: `<h2>Les lémuriens, ambassadeurs de Madagascar</h2>
<p>On ne trouve des lémuriens <strong>nulle part ailleurs au monde</strong> qu'à Madagascar. Ces primates fascinants existent en plus de 100 espèces différentes, du minuscule microcèbe (30g) au grand Indri (9kg).</p>

<h2>Les meilleurs endroits pour les observer</h2>

<h3>Parc National d'Andasibe (Indri Indri)</h3>
<p>À seulement 3h d'Antananarivo, c'est l'endroit idéal pour entendre et voir l'Indri Indri, le plus grand lémurien vivant. Son cri ressemble à un chant de baleine — inoubliable.</p>

<h3>Parc National de Ranomafana</h3>
<p>Forêt tropicale humide abritant 12 espèces de lémuriens, dont le rare lémurien bambou doré. Randonnées de nuit possibles pour voir les espèces nocturnes.</p>

<h3>Réserve d'Anja (Ambalavao)</h3>
<p>Petite réserve communautaire sur la RN7. Les makis catta (lémuriens à queue annelée) sont habitués aux visiteurs et se laissent approcher facilement. Parfait pour les photos.</p>

<h3>Parc National de l'Isalo</h3>
<p>Sifakas (lémuriens danseurs) et makis catta dans un décor de canyons spectaculaire.</p>

<h3>Île aux lémuriens (Nosy Komba)</h3>
<p>Près de Nosy Be, cette petite île abrite des makis noirs qui viennent manger dans votre main. Expérience unique mais touristique.</p>

<h2>Comment le tourisme aide les lémuriens</h2>
<p>Les droits d'entrée des parcs financent la protection des forêts. Les guides locaux sont formés à la conservation. En visitant ces réserves, vous contribuez directement à la survie des lémuriens.</p>

<h2>Règles d'observation</h2>
<ul>
<li>Ne nourrissez pas les lémuriens (sauf dans les réserves prévues à cet effet)</li>
<li>Gardez vos distances</li>
<li>Pas de flash photo</li>
<li>Restez silencieux</li>
</ul>

<h2>Planifiez votre visite</h2>
<p>Trouvez des guides spécialisés en faune sur <a href="/bons-plans/prestataires">Mada Spot</a> et réservez votre hôtel près des parcs nationaux sur <a href="/bons-plans/hotels">notre plateforme</a>.</p>`,
      status: 'published',
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      title: 'Plongée à Madagascar : les 5 meilleurs spots',
      slug: 'plongee-madagascar-meilleurs-spots',
      categoryId: guides,
      imageUrl: '/images/Attractions/nosy-be/nosy-lojo-420.jpg',
      summary: 'Récifs coralliens, tortues, requins-baleines, épaves... Madagascar est un paradis pour la plongée. Voici les 5 spots incontournables.',
      content: `<h2>Madagascar, destination plongée</h2>
<p>Avec plus de 5 000 km de côtes, Madagascar offre certains des plus beaux sites de plongée de l'océan Indien. Eaux chaudes, visibilité excellente et biodiversité marine exceptionnelle.</p>

<h2>1. Nosy Be et ses îles</h2>
<p>Le spot le plus populaire. Nosy Tanikely (réserve marine), Nosy Sakatia, et les îles Mitsio offrent des plongées spectaculaires : tortues, raies manta, requins à pointe blanche, coraux intacts.</p>
<p><strong>Meilleure période</strong> : avril à novembre. <strong>Visibilité</strong> : 15-30m.</p>

<h2>2. Ifaty / Tuléar</h2>
<p>Le Grand Récif de Tuléar est le 3ème plus grand récif corallien au monde. Plongées accessibles à tous les niveaux, riche en poissons tropicaux et coraux.</p>

<h2>3. Île Sainte-Marie</h2>
<p>En plus des baleines (en surface), Sainte-Marie offre des plongées sur épaves de navires pirates et des récifs vierges.</p>

<h2>4. Diego Suarez / Mer d'Émeraude</h2>
<p>Plongées dans la baie de Diego et snorkeling dans la Mer d'Émeraude. Eau cristalline et faune abondante.</p>

<h2>5. Anakao</h2>
<p>Village de pêcheurs au sud de Tuléar. Plongées intimistes loin du tourisme de masse. Requins-baleines de septembre à décembre.</p>

<h2>Prix</h2>
<ul>
<li><strong>Baptême</strong> : 35-50€</li>
<li><strong>Plongée exploratoire</strong> : 30-60€</li>
<li><strong>Formation PADI Open Water</strong> : 300-450€</li>
<li><strong>Snorkeling</strong> : 15-25€</li>
</ul>

<h2>Trouvez votre club de plongée</h2>
<p>Comparez les centres de plongée certifiés sur <a href="/bons-plans/prestataires?search=plongee">Mada Spot</a>. Vérifiez les certifications, les avis et contactez-les par WhatsApp.</p>`,
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
