// API Route — Assigner les images aux établissements
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';

import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const A = '/images/Attractions';

// =============================================
// ATTRACTIONS UNIQUEMENT — images locales réelles de Madagascar
// =============================================
const ATTRACTION_IMAGES: Record<string, string> = {
  'allee-des-baobabs-morondava': `${A}/baobabs/allee-des-baobabs.jpg`,
  'tsingy-de-bemaraha': `${A}/bemaraha/bemaraha.jpg`,
  'parc-national-isalo': `${A}/isalo/Piscine Naturelle Isalo-144.jpg`,
  'parc-national-andasibe': `${A}/andasibe/Andasibe et les Gidro-312.jpg`,
  'parc-national-ranomafana': `${A}/ranomafana/parc-ranomafana.jpg`,
  'reserve-ankarana-diego-suarez': `${A}/ankarana/Tsingy Ankarana.jpg`,
  'nosy-iranja': `${A}/nosy-iranja/Nosy Iranja Madagascar-142.jpg`,
  'nosy-iranja-nosy-be': `${A}/nosy-iranja/Nosy Iranja Madagascar-142.jpg`,
  'mer-demeraude-diego-suarez': `${A}/diego-suarez/Plage Ramena et les pirogues-444.jpg`,
  'montagne-dambre-diego-suarez': `${A}/montagne-ambre/Parc National Montagne d'Ambre.jpg`,
  'reserve-lokobe-nosy-be': `${A}/faune-flore/Gidro.jpg`,
  'tsingy-rouge-diego-suarez': `${A}/tsingy-rouge/Tsingy rouge-462.jpg`,
  'cirque-rouge-diego-suarez': `${A}/tsingy-rouge/Tsingy rouge-458.jpg`,
  'rova-manjakamiadana-antananarivo': `${A}/antananarivo/antananarivo.jpg`,
  'nosy-tanikely-nosy-be': `${A}/nosy-be/Nosy Be, Madagascar-201.jpg`,
  'nosy-komba-nosy-be': `${A}/nosy-be/Nosy Lojo-421.jpg`,
  'lac-tritriva-antsirabe': `${A}/antsirabe/lac tritriva.jpg`,
  'montagne-des-francais-diego-suarez': `${A}/diego-suarez/003A1529 altitude-437.jpg`,
  'reserve-de-berenty': `${A}/faune-flore/Lémurien Sifaka – Madagascar2.jpg`,
  'parc-national-masoala': `${A}/masoala/parc-masoala.jpg`,
  'parc-national-marojejy': `${A}/faune-flore/Varika-370.jpg`,
  'foret-de-kirindy-morondava': `${A}/faune-flore/Faune de Madagascar-12.jpg`,
  'ile-aux-nattes-sainte-marie': `${A}/sainte-marie/ile-sainte-marie.jpg`,
  'parc-tsimbazaza-antananarivo': `${A}/antananarivo/antananarivo-1.jpg`,
  'massif-du-makay': `${A}/divers/massif-andringitra.jpg`,
  'anakao-nosy-ve-tulear': `${A}/paysages/Plage, Madagascar-202.jpg`,
  'canal-des-pangalanes': `${A}/pangalanes/canal-pangalanes.jpg`,
  'train-fce-fianarantsoa-manakara': `${A}/manakara/Rary Manakara-263.jpg`,
  'descente-tsiribihina': `${A}/pangalanes/canal-pangalanes-1.jpg`,
  'grottes-anjohibe-mahajanga': `${A}/ankarana/Grotte Ankarana-478.jpg`,
  'ambositra-zafimaniry': `${A}/ambositra/Sculpture zafimaniry ambositra-339.jpg`,
  'reniala-arboretum-ifaty': `${A}/ifaty/ifaty-tulear.jpg`,
  'parc-national-ankarafantsika': `${A}/faune-flore/Vintsy.jpg`,
  'parc-national-zombitse-vohibasia': `${A}/faune-flore/caméléon.jpg`,
};

// =============================================
// HOTELS — photos Unsplash d'hôtels/hébergements
// =============================================
const HOTEL_IMAGES: Record<string, string> = {
  // Antananarivo
  'carlton-madagascar-antananarivo': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  'hotel-colbert-antananarivo': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
  'hotel-carlton-antananarivo': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  'hotel-palissandre-spa-antananarivo': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
  'palissandre-hotel-spa-antananarivo': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
  'citizen-guesthouse-antananarivo': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
  'tamboho-hotel-antananarivo': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
  'lokanga-boutique-hotel-antananarivo': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
  'les-3-metis-antananarivo': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
  'radisson-blu-antananarivo': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
  'relais-des-plateaux-antananarivo': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
  'le-louvre-hotel-spa-antananarivo': 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
  // Nosy Be
  'ravintsara-wellness-hotel-nosy-be': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
  'constance-tsarabanjina-nosy-be': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
  'chez-maggie-nosy-be': 'https://images.unsplash.com/photo-1499793983394-12f66e37e7fe?w=800&q=80',
  'vanila-hotel-spa-nosy-be': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
  'ravintsara-wellness-nosy-be': 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
  'tsara-komba-lodge-nosy-komba': 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
  'royal-andilana-nosy-be': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
  'lheure-bleue-nosy-be': 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
  // Diego Suarez
  'hotel-allamanda-diego-suarez': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  'domaine-de-fontenay-diego-suarez': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
  'nature-lodge-joffreville': 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
  'nature-lodge-diego-suarez': 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
  'allamanda-hotel-diego-suarez': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
  'le-grand-hotel-diego-suarez': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  'mantasaly-resort-diego-suarez': 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
  'le-suarez-hotel-diego-suarez': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
  // Antsirabe
  'hotel-des-thermes-antsirabe': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
  'couleur-cafe-antsirabe': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
  // Sainte-Marie
  'mantis-soanambo-sainte-marie': 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
  'princesse-bora-sainte-marie': 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
  'boraha-village-sainte-marie': 'https://images.unsplash.com/photo-1499793983394-12f66e37e7fe?w=800&q=80',
  // Ranomafana
  'setam-lodge-ranomafana': 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
  'hotel-thermal-ranomafana': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
  // Fianarantsoa
  'hotel-zomatel-fianarantsoa': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
  'la-riziere-fianarantsoa': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
  'tsara-guest-house-fianarantsoa': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
  // Fort-Dauphin
  'hotel-talinjoo-fort-dauphin': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
  'talinjoo-hotel-fort-dauphin': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
  // Morondava
  'palissandre-cote-ouest-morondava': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
  // Mahajanga
  'coco-lodge-majunga': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
  'antsanitia-resort-mahajanga': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
  // Toamasina
  'hotel-neptune-toamasina': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
  // Andasibe
  'mantadia-lodge-andasibe': 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
  'vakona-forest-lodge-andasibe': 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
  // Ifaty / Tulear
  'bakuba-lodge-ifaty': 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
  'le-paradisier-ifaty': 'https://images.unsplash.com/photo-1582719508461-905c673771eb?w=800&q=80',
  'salary-bay-southwest': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'salary-bay-madagascar': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'victory-hotel-tulear': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
  // Anakao
  'anakao-ocean-lodge': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  // Anjajavy
  'anjajavy-le-lodge': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
  // Isalo
  'isalo-rock-lodge-ranohira': 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80',
  'relais-de-la-reine-isalo': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
};

// =============================================
// RESTAURANTS — photos Unsplash de restaurants/cuisine
// =============================================
const RESTAURANT_IMAGES: Record<string, string> = {
  // Antananarivo
  'sakamanga-antananarivo': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'cafe-de-la-gare-antananarivo': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  'marais-restaurant-antananarivo': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  'nerone-ristorante-antananarivo': 'https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=800&q=80',
  'batavia-antananarivo': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  'shangri-la-antananarivo': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80',
  'koko-lodge-antananarivo': 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&q=80',
  'le-carnivore-antananarivo': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  'le-petit-verdot-antananarivo': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  'la-plantation-antananarivo': 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&q=80',
  'le-phare-divandry-antananarivo': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'la-compagnie-des-voyageurs-antananarivo': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'le-carre-antananarivo': 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&q=80',
  'le-buffet-du-jardin-antananarivo': 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80',
  'chez-arnaud-antananarivo': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'la-ribaudiere-antananarivo': 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&q=80',
  'la-boussole-antananarivo': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'chez-mariette-antananarivo': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'la-table-dhote-antananarivo': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'toko-telo-antananarivo': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  'chocolaterie-robert-antananarivo': 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80',
  'kudeta-antananarivo': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'le-rossini-antananarivo': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  'le-glacier-antananarivo': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  'la-varangue-antananarivo': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'mofo-gasy-stand-rasoa-antananarivo': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  'pizza-tana-express-antananarivo': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  // Nosy Be
  'le-deck-nosy-be': 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80',
  'la-table-dalexandre-nosy-be': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  'le-phare-nosy-be': 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
  'chez-angeline-nosy-be': 'https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=800&q=80',
  'karibo-restaurant-nosy-be': 'https://images.unsplash.com/photo-1528698827591-e19cef51a699?w=800&q=80',
  'chez-karon-nosy-be': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80',
  // Diego Suarez
  'le-libertalia-diego-suarez': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'abakao-restaurant-diego-suarez': 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80',
  'le-tsara-be-diego-suarez': 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80',
  // Antsirabe
  'restaurant-zandina-antsirabe': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  'le-champierre-antsirabe': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'mamy-gargote-antsirabe': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'o-bord-du-lac-antsirabe': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
  // Fort-Dauphin
  'chez-jacqueline-fort-dauphin': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  // Tulear
  'chez-alain-toliara': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  'le-jardin-du-sud-tulear': 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&q=80',
  'chez-lorenzo-ifaty': 'https://images.unsplash.com/photo-1528698827591-e19cef51a699?w=800&q=80',
  // Mahajanga
  'le-quai-ouest-mahajanga': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  'le-barracuda-mahajanga': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  // Sainte-Marie
  'idylle-beach-sainte-marie': 'https://images.unsplash.com/photo-1528698827591-e19cef51a699?w=800&q=80',
};

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionId) return apiError('Non autorisé', 401);
  const user = await getSession(sessionId);
  if (!user) return apiError('Non autorisé', 401);

  try {
    let updated = 0;
    let skipped = 0;
    const details: string[] = [];

    const ALL_IMAGES = { ...ATTRACTION_IMAGES, ...HOTEL_IMAGES, ...RESTAURANT_IMAGES };

    for (const [slug, coverImage] of Object.entries(ALL_IMAGES)) {
      const establishment = await prisma.establishment.findFirst({
        where: { slug },
      });

      if (!establishment) {
        skipped++;
        details.push(`[SKIP] ${slug} — non trouvé`);
        continue;
      }

      await prisma.establishment.update({
        where: { id: establishment.id },
        data: { coverImage },
      });
      updated++;
      details.push(`[OK] ${establishment.name} — ${coverImage.substring(0, 60)}...`);
    }

    return NextResponse.json({
      success: true,
      message: `${updated} images mises à jour, ${skipped} non trouvés`,
      updated,
      skipped,
      details,
    });
  } catch (error) {
    logger.error('Error fixing images:', error);
    return apiError('Erreur serveur', 500);
  }
}
