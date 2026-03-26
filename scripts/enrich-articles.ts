// Enrich article content - multiply content by 3x with more details
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Contexte Madagascar pour enrichir les articles
const MADAGASCAR_CONTEXT = {
  politique: {
    institutions: ['Présidence de la République', 'Assemblée Nationale', 'Sénat', 'Haute Cour Constitutionnelle', 'Conseil des Ministres'],
    villes: ['Antananarivo', 'Toamasina', 'Antsirabe', 'Fianarantsoa', 'Mahajanga', 'Toliara', 'Antsiranana'],
    themes: ['gouvernance', 'décentralisation', 'réformes institutionnelles', 'dialogue national', 'réconciliation', 'élections', 'démocratie'],
  },
  economie: {
    secteurs: ['agriculture', 'mines', 'tourisme', 'textile', 'pêche', 'artisanat', 'services'],
    indicateurs: ['PIB', 'inflation', 'taux de change', 'exportations', 'importations', 'investissements directs étrangers'],
    partenaires: ['Banque Mondiale', 'FMI', 'Union Européenne', 'SADC', 'COI'],
  },
  societe: {
    themes: ['éducation', 'santé', 'emploi', 'jeunesse', 'femmes', 'environnement', 'infrastructures'],
    defis: ['pauvreté', 'accès aux soins', 'scolarisation', 'électrification rurale', 'eau potable'],
  },
};

// Templates pour enrichir le contenu
const ENRICHMENT_TEMPLATES = {
  introduction: [
    "Cette situation s'inscrit dans un contexte plus large de développement national à Madagascar.",
    "Les observateurs suivent de près l'évolution de cette affaire qui pourrait avoir des répercussions importantes.",
    "Cette annonce intervient dans un contexte de transformation majeure pour le pays.",
  ],
  contexte: [
    "Pour mieux comprendre les enjeux, il convient de rappeler le contexte historique et socio-économique de Madagascar.",
    "Cette décision s'inscrit dans la continuité des efforts entrepris par les autorités ces dernières années.",
    "Les experts soulignent l'importance de cette évolution pour l'avenir du pays.",
  ],
  impact: [
    "Les répercussions de cette décision pourraient être significatives pour la population malgache.",
    "Cette mesure devrait avoir des effets positifs sur le développement économique et social.",
    "Les analystes anticipent des changements importants dans les mois à venir.",
  ],
  perspectives: [
    "À l'avenir, plusieurs scénarios sont envisageables selon l'évolution de la situation.",
    "Les prochaines semaines seront déterminantes pour mesurer l'impact réel de ces mesures.",
    "La communauté internationale suit avec attention l'évolution de cette situation à Madagascar.",
  ],
  conclusion: [
    "En définitive, cette actualité témoigne de la dynamique de changement en cours à Madagascar.",
    "Cette évolution marque une étape importante dans le parcours de développement du pays.",
    "Les Malgaches restent attentifs aux prochaines annonces des autorités.",
  ],
};

// Fonction pour extraire les mots-clés du titre
function extractKeywords(title: string): string[] {
  const stopWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'à', 'au', 'aux', 'pour', 'par', 'sur', 'dans', 'avec', 'ce', 'cette', 'ces', 'son', 'sa', 'ses', 'qui', 'que', 'quoi', 'dont', 'où'];
  return title
    .toLowerCase()
    .split(/[\s,.:;!?()]+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
}

// Fonction pour détecter la catégorie thématique
function detectCategory(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase();

  if (text.match(/ministre|gouvernement|président|député|sénat|élection|politique|loi|décret/)) return 'politique';
  if (text.match(/économie|pib|croissance|investissement|commerce|export|import|business|entreprise/)) return 'economie';
  if (text.match(/football|sport|barea|match|championnat|athlète/)) return 'sport';
  if (text.match(/culture|festival|musique|art|tradition|patrimoine/)) return 'culture';
  if (text.match(/santé|hôpital|médecin|maladie|vaccination|épidémie/)) return 'sante';
  if (text.match(/éducation|école|université|étudiant|enseignant/)) return 'education';
  if (text.match(/environnement|forêt|climat|biodiversité|reboisement/)) return 'environnement';

  return 'societe';
}

// Fonction pour générer du contenu enrichi
function enrichContent(title: string, originalContent: string): string {
  const keywords = extractKeywords(title);
  const category = detectCategory(title, originalContent);

  // Nettoyer le contenu original
  const cleanContent = originalContent.trim();
  const paragraphs = cleanContent.split(/\n\n+/).filter(p => p.trim());

  // Si le contenu est déjà long, ne pas l'enrichir
  if (cleanContent.length > 2000) {
    return cleanContent;
  }

  const enrichedParts: string[] = [];

  // 1. Paragraphe d'introduction enrichi
  enrichedParts.push(paragraphs[0] || cleanContent);

  // 2. Ajouter du contexte
  const contextIntro = ENRICHMENT_TEMPLATES.contexte[Math.floor(Math.random() * ENRICHMENT_TEMPLATES.contexte.length)];
  enrichedParts.push(`\n\n${contextIntro}`);

  // 3. Développement avec contexte Madagascar
  if (category === 'politique') {
    const institutions = MADAGASCAR_CONTEXT.politique.institutions;
    const ville = MADAGASCAR_CONTEXT.politique.villes[Math.floor(Math.random() * MADAGASCAR_CONTEXT.politique.villes.length)];
    enrichedParts.push(`\n\nSelon les informations recueillies auprès des ${institutions[Math.floor(Math.random() * institutions.length)]}, cette décision fait partie d'une stratégie globale visant à renforcer la gouvernance et améliorer les services publics. Les autorités locales de ${ville} et des autres régions ont été informées des nouvelles directives.`);

    enrichedParts.push(`\n\nLes observateurs politiques notent que cette initiative s'inscrit dans le cadre des réformes institutionnelles en cours. Le dialogue entre les différentes parties prenantes reste essentiel pour garantir la mise en œuvre effective de ces mesures. La société civile et les partenaires techniques et financiers suivent attentivement l'évolution de la situation.`);
  } else if (category === 'economie') {
    const secteur = MADAGASCAR_CONTEXT.economie.secteurs[Math.floor(Math.random() * MADAGASCAR_CONTEXT.economie.secteurs.length)];
    const partenaire = MADAGASCAR_CONTEXT.economie.partenaires[Math.floor(Math.random() * MADAGASCAR_CONTEXT.economie.partenaires.length)];
    enrichedParts.push(`\n\nCette évolution économique concerne particulièrement le secteur ${secteur}, qui représente une part importante de l'économie malgache. Les experts du ${partenaire} ont salué les efforts entrepris par Madagascar pour améliorer son climat des affaires et attirer davantage d'investissements.`);

    enrichedParts.push(`\n\nLes indicateurs économiques récents montrent une tendance encourageante, bien que des défis persistent. La diversification économique et le développement des infrastructures restent des priorités pour soutenir une croissance inclusive et durable. Les opérateurs économiques locaux et internationaux expriment un intérêt croissant pour le marché malgache.`);
  } else {
    enrichedParts.push(`\n\nCette situation reflète les enjeux de développement auxquels fait face Madagascar. La Grande Île, avec ses 27 millions d'habitants, s'efforce de relever les défis liés à l'amélioration des conditions de vie de sa population. Les programmes mis en place visent à renforcer les services de base et à promouvoir un développement équitable dans toutes les régions.`);

    enrichedParts.push(`\n\nLes communautés locales jouent un rôle crucial dans la mise en œuvre de ces initiatives. La participation citoyenne et l'engagement des acteurs de la société civile contribuent à garantir que les actions entreprises répondent aux besoins réels de la population. Les résultats obtenus jusqu'ici encouragent la poursuite des efforts dans cette direction.`);
  }

  // 4. Ajouter les paragraphes originaux restants
  if (paragraphs.length > 1) {
    enrichedParts.push(`\n\n${paragraphs.slice(1).join('\n\n')}`);
  }

  // 5. Ajouter l'impact et les perspectives
  const impact = ENRICHMENT_TEMPLATES.impact[Math.floor(Math.random() * ENRICHMENT_TEMPLATES.impact.length)];
  enrichedParts.push(`\n\n${impact}`);

  // 6. Détails supplémentaires basés sur les mots-clés
  if (keywords.length > 0) {
    const keywordContext = `Les termes clés de cette actualité - ${keywords.slice(0, 3).join(', ')} - illustrent les enjeux majeurs de cette période pour Madagascar. Les décideurs et les citoyens suivent avec attention les développements liés à ces questions qui touchent directement le quotidien de la population.`;
    enrichedParts.push(`\n\n${keywordContext}`);
  }

  // 7. Perspectives futures
  const perspectives = ENRICHMENT_TEMPLATES.perspectives[Math.floor(Math.random() * ENRICHMENT_TEMPLATES.perspectives.length)];
  enrichedParts.push(`\n\n${perspectives}`);

  // 8. Conclusion
  const conclusion = ENRICHMENT_TEMPLATES.conclusion[Math.floor(Math.random() * ENRICHMENT_TEMPLATES.conclusion.length)];
  enrichedParts.push(`\n\n${conclusion}`);

  // 9. Note finale avec mots-clés pour SEO
  enrichedParts.push(`\n\n**Mots-clés:** ${keywords.slice(0, 5).join(', ')}, Madagascar, actualités, ${new Date().getFullYear()}`);

  return enrichedParts.join('');
}

// Fonction pour enrichir le résumé
function enrichSummary(title: string, originalSummary: string | null, content: string): string {
  if (originalSummary && originalSummary.length > 200) {
    return originalSummary;
  }

  const baseSummary = originalSummary || content.substring(0, 200);
  const category = detectCategory(title, content);

  let contextAddition = '';
  switch (category) {
    case 'politique':
      contextAddition = ' Cette actualité s\'inscrit dans le contexte des réformes institutionnelles en cours à Madagascar.';
      break;
    case 'economie':
      contextAddition = ' Cette évolution économique témoigne de la dynamique de développement à Madagascar.';
      break;
    default:
      contextAddition = ' Cette information reflète les enjeux actuels auxquels fait face la société malgache.';
  }

  return baseSummary.trim() + contextAddition;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Enrichissement du contenu des articles (x3)');
  console.log('='.repeat(60));
  console.log('');

  // Récupérer tous les articles publiés
  const articles = await prisma.article.findMany({
    where: {
      status: 'published',
    },
    select: {
      id: true,
      title: true,
      content: true,
      summary: true,
    },
  });

  console.log(`Trouvé ${articles.length} articles à enrichir\n`);

  let enriched = 0;
  let skipped = 0;

  for (const article of articles) {
    const originalLength = article.content.length;

    // Skip si déjà long
    if (originalLength > 2000) {
      console.log(`[SKIP] "${article.title.substring(0, 40)}..." - déjà ${originalLength} caractères`);
      skipped++;
      continue;
    }

    // Enrichir le contenu
    const enrichedContent = enrichContent(article.title, article.content);
    const enrichedSummary = enrichSummary(article.title, article.summary, article.content);

    // Mettre à jour l'article
    await prisma.article.update({
      where: { id: article.id },
      data: {
        content: enrichedContent,
        summary: enrichedSummary,
      },
    });

    const newLength = enrichedContent.length;
    const ratio = (newLength / originalLength).toFixed(1);

    console.log(`[OK] "${article.title.substring(0, 40)}..." - ${originalLength} -> ${newLength} caractères (x${ratio})`);
    enriched++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Enrichis: ${enriched} articles`);
  console.log(`Ignorés: ${skipped} articles (déjà longs)`);
  console.log('='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
