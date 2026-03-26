import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';

import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const A = '/images/Attractions';
const H = '/images/highlights';

// ================================================================
// MAPPING COMPLET : slug → meilleure image locale disponible
// Vérification minutieuse de toutes les 72 attractions
// ================================================================
const IMAGE_MAP: Record<string, { coverImage: string; images?: string[] }> = {
  // ===== Attractions avec images correctes (pas de changement) =====
  'allee-des-baobabs': {
    coverImage: `${A}/baobabs/allee-des-baobabs.jpg`,
    images: [
      `${A}/baobabs/allee-des-baobabs-1.jpg`,
      `${A}/baobabs/allee-des-baobabs-2.jpg`,
      `${A}/baobabs/allee-des-baobabs-3.jpg`,
      `${A}/baobabs/Avenue des baobabs à Madagascar-130.jpg`,
      `${A}/baobabs/Baobab-couche de soleil.jpg`,
      `${A}/baobabs/Coucher de soleil-baobab-335.jpg`,
    ],
  },

  // ===== ISALO — images isalo disponibles =====
  'parc-national-isalo': {
    coverImage: `${A}/isalo/Piscine Naturelle Isalo-144.jpg`,
    images: [
      `${A}/isalo/parc-isalo.jpg`,
      `${A}/isalo/Parc National d'Isalo, au sud-ouest de Madagascar (15)-378.jpg`,
      `${A}/isalo/route nationale 7 Isalo.jpg`,
      `${A}/isalo/RN7 pk – 54 IHOSY-376.jpg`,
    ],
  },

  // ===== TSINGY DE BEMARAHA =====
  'tsingy-de-bemaraha': {
    coverImage: `${A}/bemaraha/bemaraha.jpg`,
    images: [
      `${A}/bemaraha/tsingy-bemaraha.jpg`,
      `${A}/bemaraha/Tsingy Bemaraha-415.jpg`,
      `${A}/bemaraha/Tsingy Bemaraha-416.jpg`,
      `${A}/bemaraha/Tsingy Bemaraha-417.jpg`,
      `${A}/bemaraha/Tsingy de Bemahara-330.jpg`,
      `${A}/bemaraha/Tsingy De Bemaraha-260.jpg`,
    ],
  },

  // ===== RANOMAFANA =====
  'parc-national-ranomafana': {
    coverImage: `${A}/ranomafana/parc-ranomafana.jpg`,
  },

  // ===== RÉSERVE D'ANJA — utiliser la vraie image anja =====
  'reserve-anja': {
    coverImage: `${A}/divers/reserve-anja.jpg`,
    images: [`${A}/divers/reserve-anja3.png`],
  },

  // ===== ANDASIBE =====
  'parc-national-andasibe': {
    coverImage: `${A}/andasibe/andasibe-mantadia.jpg`,
    images: [
      `${A}/andasibe/Andasibe et les Gidro-312.jpg`,
      `${A}/andasibe/Andasibe-386.jpg`,
      `${A}/andasibe/andasibe-mantadia-1.jpg`,
      `${A}/andasibe/andasibe-mantadia-2.jpg`,
      `${A}/andasibe/andasibe-mantadia-3.jpg`,
    ],
  },

  // ===== ANKARANA =====
  'reserve-ankarana': {
    coverImage: `${A}/ankarana/Tsingy Ankarana.jpg`,
    images: [
      `${A}/ankarana/ankarana.jpg`,
      `${A}/ankarana/ankarana-1.jpg`,
      `${A}/ankarana/ankarana-2.jpg`,
      `${A}/ankarana/Ankarana-469.jpg`,
      `${A}/ankarana/Paysage Ankarana-473.jpg`,
    ],
  },

  // ===== TSINGY ROUGE =====
  'tsingy-rouge': {
    coverImage: `${A}/tsingy-rouge/Tsingy rouge-462.jpg`,
    images: [
      `${A}/tsingy-rouge/Tsingy rouge-458.jpg`,
      `${A}/tsingy-rouge/Tsingy rouge-459.jpg`,
      `${A}/tsingy-rouge/Tsingy rouge-465.jpg`,
    ],
  },

  // ===== NOSY BE =====
  'nosy-be': {
    coverImage: `${A}/nosy-be/Nosy Be, Madagascar-201.jpg`,
    images: [
      `${A}/nosy-be/nosy-be.jpg`,
      `${A}/nosy-be/nosy-be-1.jpg`,
      `${A}/nosy-be/nosy-be-2.jpg`,
      `${A}/nosy-be/nosy-be-3.jpg`,
      `${A}/nosy-be/nosy-be-4.jpg`,
      `${A}/nosy-be/Nosy be-photo-365.jpg`,
    ],
  },

  // ===== NOSY IRANJA =====
  'nosy-iranja': {
    coverImage: `${A}/nosy-iranja/Nosy Iranja Madagascar-142.jpg`,
  },

  // ===== ÎLE SAINTE-MARIE =====
  'ile-sainte-marie': {
    coverImage: `${A}/sainte-marie/ile-sainte-marie.jpg`,
    images: [`${A}/sainte-marie/ile-sainte-marie-1.jpg`],
  },

  // ===== ÎLE AUX NATTES — utiliser la 2ème image sainte-marie =====
  'ile-aux-nattes': {
    coverImage: `${A}/sainte-marie/ile-sainte-marie-1.jpg`,
  },

  // ===== BAIE DE DIEGO-SUAREZ =====
  'baie-diego-suarez': {
    coverImage: `${A}/diego-suarez/003A8246-440.jpg`,
    images: [
      `${A}/diego-suarez/diego-suarez.jpg`,
      `${A}/diego-suarez/diego-suarez-1.jpg`,
      `${A}/diego-suarez/Diego-Suarez-441.jpg`,
    ],
  },

  // ===== MER D'ÉMERAUDE — image plage Diego =====
  'mer-demeraude-diego-suarez': {
    coverImage: `${A}/diego-suarez/Plage Ramena et les pirogues-444.jpg`,
  },

  // ===== MONTAGNE DES FRANÇAIS =====
  'montagne-des-francais-diego-suarez': {
    coverImage: `${A}/diego-suarez/003A1529 altitude-437.jpg`,
  },

  // ===== BAIE DES DUNES =====
  'baie-des-dunes': {
    coverImage: `${A}/diego-suarez/Plage Ramena et les pirogues-444.jpg`,
  },

  // ===== CIRQUE ROUGE — tsingy rouge image plus adaptée =====
  'cirque-rouge-diego-suarez': {
    coverImage: `${A}/tsingy-rouge/Tsingy rouge-458.jpg`,
  },

  // ===== ANTANANARIVO =====
  'antananarivo': {
    coverImage: `${A}/antananarivo/antananarivo.jpg`,
    images: [
      `${A}/antananarivo/antananarivo-1.jpg`,
      `${A}/antananarivo/antananarivo-2.jpg`,
      `${A}/antananarivo/antananarivo4.png`,
      `${A}/antananarivo/antananarivo5.png`,
      `${A}/antananarivo/antananarivo6.png`,
    ],
  },

  // ===== ROVA DE MANJAKAMIADANA — utiliser image palais highlights =====
  'rova-manjakamiadana-antananarivo': {
    coverImage: `${H}/palais.jpg`,
  },

  // ===== PARC TSIMBAZAZA =====
  'parc-tsimbazaza-antananarivo': {
    coverImage: `${A}/antananarivo/antananarivo-2.jpg`,
  },

  // ===== ANTSIRABE =====
  'antsirabe': {
    coverImage: `${A}/antsirabe/antsirabe.jpg`,
    images: [
      `${A}/antsirabe/antsirabe-1.jpg`,
      `${A}/antsirabe/antsirabe-2.jpg`,
      `${A}/antsirabe/antsirabe-3.jpg`,
      `${A}/antsirabe/antsirabe-4.jpg`,
      `${A}/antsirabe/source-thermal.png`,
    ],
  },

  // ===== LAC TRITRIVA =====
  'lac-tritriva': {
    coverImage: `${A}/antsirabe/lac tritriva.jpg`,
  },

  // ===== AMBOSITRA ET ZAFIMANIRY =====
  'ambositra-zafimaniry': {
    coverImage: `${A}/ambositra/Sculpture zafimaniry ambositra-339.jpg`,
    images: [
      `${A}/ambositra/Art Malagasy zafimaniry ambositra-336.jpg`,
      `${A}/ambositra/artisanat.jpg`,
      `${A}/ambositra/Charrue de boeuf Ambositra-454.jpg`,
    ],
  },

  // ===== TREK ZAFIMANIRY =====
  'trek-zafimaniry': {
    coverImage: `${A}/ambositra/Art Malagasy zafimaniry ambositra-336.jpg`,
    images: [`${A}/ambositra/artisanat.jpg`],
  },

  // ===== CANAL DES PANGALANES =====
  'canal-des-pangalanes': {
    coverImage: `${A}/pangalanes/canal-pangalanes.jpg`,
    images: [
      `${A}/pangalanes/canal-pangalanes-1.jpg`,
      `${A}/pangalanes/canal-pangalanes-2.jpg`,
      `${A}/pangalanes/canal-pangalanes-3.jpg`,
    ],
  },

  // ===== DESCENTE TSIRIBIHINA — image pirogue/rivière =====
  'descente-tsiribihina': {
    coverImage: `${A}/culture/Pirogue-426.jpg`,
  },

  // ===== BELO SUR MER =====
  'belo-sur-mer': {
    coverImage: `${A}/culture/Pecheur-385.jpg`,
  },

  // ===== TRAIN FCE =====
  'train-fce': {
    coverImage: `${H}/train.jpg`,
    images: [`${A}/manakara/Rary Manakara-263.jpg`],
  },

  // ===== MASOALA =====
  'parc-national-masoala': {
    coverImage: `${A}/masoala/parc-masoala.jpg`,
    images: [
      `${A}/masoala/parc-masoala-1.jpg`,
      `${A}/masoala/parc-masoala-2.jpg`,
      `${A}/masoala/parc-masoala-3.jpg`,
    ],
  },

  // ===== RESERVE LOKOBE =====
  'reserve-lokobe': {
    coverImage: `${H}/foret.jpg`,
  },

  // ===== ANAKAO ET NOSY VE — image plage =====
  'anakao-nosy-ve': {
    coverImage: `${H}/plage.jpg`,
  },

  // ===== MONTAGNE D'AMBRE =====
  'montagne-dambre-diego-suarez': {
    coverImage: `${A}/montagne-ambre/Parc National Montagne d'Ambre.jpg`,
    images: [
      `${A}/montagne-ambre/Montagne d'Ambre-393.jpg`,
      `${A}/montagne-ambre/Montagne d'Ambre394.jpg`,
      `${A}/montagne-ambre/Mt Ambre1-360.jpg`,
      `${A}/montagne-ambre/Nature de Montagne d'ambre-452.jpg`,
      `${A}/montagne-ambre/Parc National Montagne d'Ambre-430.jpg`,
      `${A}/montagne-ambre/Parc National Montagne d'Ambre-431.jpg`,
      `${A}/montagne-ambre/Parc National Montagne d'Ambre-432.jpg`,
    ],
  },

  // ===== FORT-DAUPHIN =====
  'fort-dauphin': {
    coverImage: `${A}/fort-dauphin/fort-dauphin.jpg`,
    images: [
      `${A}/fort-dauphin/fort-dauphin-1.jpg`,
      `${A}/fort-dauphin/fort-dauphin13.png`,
    ],
  },

  // ===== IFATY-MANGILY =====
  'ifaty-mangily': {
    coverImage: `${A}/ifaty/ifaty-tulear.jpg`,
    images: [`${A}/ifaty/ifatytulear.png`],
  },

  // ===== RENIALA ARBORETUM =====
  'reniala-arboretum-ifaty': {
    coverImage: `${A}/ifaty/ifatytulear.png`,
  },

  // ===== GROTTES D'ANJOHIBE — image grotte Ankarana =====
  'grottes-anjohibe-mahajanga': {
    coverImage: `${A}/ankarana/Grotte Ankarana-424.jpg`,
    images: [`${A}/ankarana/Grotte Ankarana-478.jpg`],
  },

  // ===== FIANARANTSOA =====
  // (pas directement lié mais utilisable pour le train FCE ou RN7)

  // ===== MAROJEJY — image forêt/randonnée =====
  'parc-national-marojejy': {
    coverImage: `${H}/randonnee.jpg`,
  },

  // ===== ANKARAFANTSIKA =====
  'parc-national-ankarafantsika': {
    coverImage: `${H}/lac.jpg`,
  },

  // ===== CANYON DES MAKIS — image isalo canyon =====
  'canyon-des-makis': {
    coverImage: `${H}/canyon.jpg`,
    images: [`${A}/isalo/parc-isalo.jpg`],
  },

  // ===== ANKAZOBE — image rizières/culture =====
  'ankazobe': {
    coverImage: `${H}/rizieres.jpg`,
  },

  // ===== AIRE PROTÉGÉE DU MAKAY =====
  'aire-protegee-makay': {
    coverImage: `${A}/divers/massif-andringitra.jpg`,
  },

  // ===== FALAISES DE TSARANORO — image massif andringitra =====
  'falaises-tsaranoro': {
    coverImage: `${H}/montagne.jpg`,
  },

  // ===== MASSIF DE L'ANKARATRA — image montagne =====
  'massif-ankaratra': {
    coverImage: `${H}/montagne.jpg`,
  },

  // ===== KIMONY BEACH =====
  'kimony-beach': {
    coverImage: `${H}/sunset.jpg`,
  },

  // ===== PISCINES NATURELLES ANKARANA =====
  'piscines-ankarana': {
    coverImage: `${A}/ankarana/Lac ankarana.jpg`,
    images: [
      `${A}/ankarana/La grotte Ankarana-470.jpg`,
      `${A}/ankarana/La grotte Ankarana-471.jpg`,
    ],
  },

  // ===== REQUINS-BALEINES — image baleine =====
  'requins-baleines-nosy-be': {
    coverImage: `${H}/baleine.jpg`,
    images: [`${A}/faune-flore/Baleine-391.jpg`],
  },

  // ===== NOSY KOMBA — image nosy-be =====
  'nosy-komba-nosy-be': {
    coverImage: `${A}/nosy-be/nosy-be-1.jpg`,
    images: [
      `${A}/nosy-be/Nosy be -Vie-311.jpg`,
      `${A}/nosy-be/Nosy be-photo-365.jpg`,
    ],
  },

  // ===== NOSY TANIKELY =====
  'nosy-tanikely-nosy-be': {
    coverImage: `${H}/plongee.jpg`,
    images: [`${A}/nosy-be/nosy-be-2.jpg`],
  },

  // ===== ZOMBITSE-VOHIBASIA — image caméléon (parc à reptiles) =====
  'parc-national-zombitse-vohibasia': {
    coverImage: `${H}/biodiversite.jpg`,
  },

  // ===== FORÊT DE KIRINDY — image faune =====
  'foret-de-kirindy': {
    coverImage: `${H}/indri.jpg`,
  },

  // ===== RÉSERVE DE BERENTY — image lémurien =====
  'reserve-de-berenty': {
    coverImage: `${H}/lemur.jpg`,
  },

  // ===== RESERVE PEYRIERAS — image caméléon =====
  'reserve-peyrieras': {
    coverImage: `${A}/faune-flore/caméléon.jpg`,
    images: [`${A}/faune-flore/Lézard.jpg`],
  },

  // ===== RÉSERVE NAHAMPOANA =====
  'reserve-nahampoana': {
    coverImage: `${A}/faune-flore/Lémurien Sifaka – Madagascar2.jpg`,
  },

  // ===== FAMADIHANA — culture/festivité =====
  'famadihana': {
    coverImage: `${H}/village.jpg`,
  },

  // ===== ROUTES DE L'ARTISANAT =====
  'routes-artisanat-rn1': {
    coverImage: `${H}/artisanat.jpg`,
    images: [`${A}/culture/Sculpture Malagasy-334.jpg`],
  },

  // ===== RN7 — image route =====
  'route-nationale-7': {
    coverImage: `${A}/isalo/route nationale 7 Isalo.jpg`,
    images: [
      `${A}/isalo/RN7 pk – 54 IHOSY-376.jpg`,
      `${A}/fianarantsoa/fianarantsoa.jpg`,
    ],
  },

  // ===== SURF LAVANONO =====
  'surf-lavanono': {
    coverImage: `${H}/surf.jpg`,
  },

  // ===== ROUTE DE LA VANILLE =====
  'route-vanille-sava': {
    coverImage: `${H}/ylang-ylang.jpg`,
  },

  // ===== MOFO GASY =====
  'mofo-gasy': {
    coverImage: `${H}/marche.jpg`,
  },

  // ===== VARY SY ANANA =====
  'vary-sy-anana': {
    coverImage: `${H}/marche.jpg`,
  },

  // ===== NOSY MANGABE — image forêt =====
  'nosy-mangabe': {
    coverImage: `${H}/mangrove.jpg`,
  },

  // ===== FONDERIE AMBATOLAMPY =====
  'fonderie-ambatolampy': {
    coverImage: `${H}/artisanat.jpg`,
  },

  // ===== SOIE DE SOATANANA =====
  'soie-soatanana': {
    coverImage: `${H}/artisanat.jpg`,
  },

  // ===== ILAKAKA =====
  'ilakaka': {
    coverImage: `${H}/paysage -340.jpg`,
  },

  // ===== AMPEFY ITASY — image cascade/lac =====
  'ampefy-itasy': {
    coverImage: `${H}/cascade.jpg`,
  },

  // ===== FOULPOINTE — image plage =====
  'foulpointe': {
    coverImage: `${H}/plage.jpg`,
  },

  // ===== MORAINGY =====
  'moraingy-lutte-malgache': {
    coverImage: `${H}/pecheur.jpg`,
  },

  // ===== MIDONGY DU SUD =====
  'parc-midongy-sud': {
    coverImage: `${H}/foret.jpg`,
  },

  // ===== TSINGY DE NAMOROKA =====
  'tsingy-de-namoroka': {
    coverImage: `${H}/tsingy.jpg`,
  },

  // ===== PARC KIRINDY MITEA =====
  'parc-national-kirindy-mitea': {
    coverImage: `${H}/foret.jpg`,
  },

  // ===== BAIE DE BALY =====
  'parc-national-baie-de-baly': {
    coverImage: `${H}/mangrove.jpg`,
  },

  // ===== TSIMANAMPESOTSE =====
  'parc-national-tsimanampesotse': {
    coverImage: `${H}/lac.jpg`,
  },

  // ===== CORAIL IFATY =====
  // (réserve Reniala déjà assigné plus haut)
};

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionId) return apiError('Non autorisé', 401);
  const user = await getSession(sessionId);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const results: string[] = [];
    let updated = 0;
    let skipped = 0;

    const attractions = await prisma.establishment.findMany({
      where: { type: 'ATTRACTION' },
      select: { id: true, slug: true, name: true, coverImage: true },
    });

    for (const attr of attractions) {
      const mapping = IMAGE_MAP[attr.slug];
      if (!mapping) {
        results.push(`[SKIP] ${attr.name} (${attr.slug}) — pas dans le mapping`);
        skipped++;
        continue;
      }

      const updateData: Record<string, unknown> = {
        coverImage: mapping.coverImage,
      };

      if (mapping.images) {
        updateData.images = JSON.stringify(mapping.images);
      }

      await prisma.establishment.update({
        where: { id: attr.id },
        data: updateData,
      });

      const changed = attr.coverImage !== mapping.coverImage ? 'CHANGED' : 'OK';
      results.push(`[${changed}] ${attr.name} → ${mapping.coverImage}`);
      updated++;
    }

    return NextResponse.json({
      success: true,
      message: `${updated} images mises à jour, ${skipped} ignorées`,
      updated,
      skipped,
      total: attractions.length,
      details: results,
    });
  } catch (error: unknown) {
    logger.error('Error fixing images v2:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
