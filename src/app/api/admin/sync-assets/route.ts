import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC = path.join(process.cwd(), 'public');
const ATTRACTIONS_DIR = path.join(PUBLIC, 'images', 'Attractions');

// ================================================================
// MAPPING INTELLIGENT : chaque slug → ses dossiers d'images dédiés
// Dossiers EXCLUSIFS = images attribuées UNIQUEMENT à ce lieu
// Dossiers PARTAGÉS = images distribuées intelligemment par pertinence
// ================================================================

interface FolderMapping {
  exclusive: string[];  // Dossiers dont TOUTES les images vont à cette fiche
  shared?: string[];    // Dossiers partagés - sélection par pertinence du nom de fichier
}

const SLUG_MAP: Record<string, FolderMapping> = {
  // ===== DOSSIERS EXCLUSIFS (1 dossier = 1 lieu) =====
  'allee-des-baobabs':             { exclusive: ['baobabs'] },
  'parc-national-isalo':           { exclusive: ['isalo'] },
  'tsingy-de-bemaraha':            { exclusive: ['bemaraha'] },
  'parc-national-ranomafana':      { exclusive: ['ranomafana'] },
  'parc-national-andasibe':        { exclusive: ['andasibe'] },
  'nosy-be':                       { exclusive: ['nosy-be'] },
  'nosy-iranja':                   { exclusive: ['nosy-iranja'] },
  'antananarivo':                  { exclusive: ['antananarivo'] },
  'antsirabe':                     { exclusive: ['antsirabe'] },
  'ambositra-zafimaniry':          { exclusive: ['ambositra'] },
  'canal-des-pangalanes':          { exclusive: ['pangalanes'] },
  'parc-national-masoala':         { exclusive: ['masoala'] },
  'montagne-dambre-diego-suarez':  { exclusive: ['montagne-ambre'] },
  'tsingy-rouge':                  { exclusive: ['tsingy-rouge'] },
  'reserve-ankarana':              { exclusive: ['ankarana'] },
  'fort-dauphin':                  { exclusive: ['fort-dauphin'] },

  // ===== DOSSIERS AVEC SÉLECTION PAR PERTINENCE =====
  // Diego-Suarez zone: distribuer par mots-clés dans le nom de fichier
  'baie-diego-suarez':             { exclusive: [], shared: ['diego-suarez'] },
  'mer-demeraude-diego-suarez':    { exclusive: [], shared: ['diego-suarez'] },
  'montagne-des-francais-diego-suarez': { exclusive: [], shared: ['diego-suarez'] },
  'baie-des-dunes':                { exclusive: [], shared: ['diego-suarez'] },

  // Nosy Be zone
  'nosy-komba-nosy-be':            { exclusive: ['nosy-komba'] },
  'nosy-tanikely-nosy-be':         { exclusive: [] },
  'reserve-lokobe':                { exclusive: [] },
  'requins-baleines-nosy-be':      { exclusive: ['requins-baleines'] },

  // Sainte-Marie zone
  'ile-sainte-marie':              { exclusive: ['sainte-marie'] },
  'ile-aux-nattes':                { exclusive: [] },

  // Ankarana zone - piscines et grottes
  'piscines-ankarana':             { exclusive: ['piscines-ankarana'] },
  'grottes-anjohibe-mahajanga':    { exclusive: [] },

  // Isalo zone
  'canyon-des-makis':              { exclusive: [] },

  // Ifaty zone
  'ifaty-mangily':                 { exclusive: ['ifaty-mangily', 'ifaty'] },
  'reniala-arboretum-ifaty':       { exclusive: [] },

  // Fianarantsoa / train
  'train-fce':                     { exclusive: ['manakara', 'fianarantsoa'] },

  // Antsirabe zone
  'lac-tritriva':                  { exclusive: [] },

  // Culture, faune-flore -> spécifiques par fiche
  'reserve-anja':                  { exclusive: [] },
  'aire-protegee-makay':           { exclusive: [] },
  'descente-tsiribihina':          { exclusive: [] },
  'belo-sur-mer':                  { exclusive: [] },
  'ankazobe':                      { exclusive: [] },
  'trek-zafimaniry':               { exclusive: [] },
  'routes-artisanat-rn1':          { exclusive: ['artisanat-rn1'] },
  'route-nationale-7':             { exclusive: ['rn7'] },
  'reserve-de-berenty':            { exclusive: ['berenty'] },
  'reserve-peyrieras':             { exclusive: ['peyrieras'] },
  'foret-de-kirindy':              { exclusive: ['kirindy-foret'] },

  // Parcs qui n'ont pas encore de dossier dédié
  'parc-national-ankarafantsika':  { exclusive: [] },
  'parc-national-marojejy':        { exclusive: [] },
  'reserve-nahampoana':            { exclusive: [] },
  'rova-manjakamiadana-antananarivo': { exclusive: [] },
  'parc-tsimbazaza-antananarivo':  { exclusive: [] },
  'cirque-rouge-diego-suarez':     { exclusive: [] },
  'anakao-nosy-ve':                { exclusive: [] },

  // Nouveaux dossiers vides
  'foulpointe':                    { exclusive: ['foulpointe'] },
  'ampefy-itasy':                  { exclusive: ['ampefy'] },
  'moraingy-lutte-malgache':       { exclusive: ['moraingy'] },
  'nosy-mangabe':                  { exclusive: ['nosy-mangabe'] },
  'fonderie-ambatolampy':          { exclusive: ['ambatolampy'] },
  'route-vanille-sava':            { exclusive: ['sava-vanille'] },
  'surf-lavanono':                 { exclusive: ['lavanono'] },
  'ilakaka':                       { exclusive: ['ilakaka'] },
  'mofo-gasy':                     { exclusive: ['gastronomie'] },
  'vary-sy-anana':                 { exclusive: [] },
  'famadihana':                    { exclusive: ['famadihana'] },
  'kimony-beach':                  { exclusive: ['kimony-beach'] },
  'falaises-tsaranoro':            { exclusive: ['tsaranoro'] },
  'massif-ankaratra':              { exclusive: ['ankaratra'] },
  'soie-soatanana':                { exclusive: ['soatanana'] },
  'parc-midongy-sud':              { exclusive: ['midongy'] },

  // Vol.2
  'parc-national-zombitse-vohibasia': { exclusive: ['zombitse-vohibasia'] },
  'parc-national-tsimanampesotse':    { exclusive: ['tsimanampesotse'] },
  'parc-national-kirindy-mitea':      { exclusive: ['kirindy-mitea'] },
  'parc-national-baie-de-baly':       { exclusive: ['baie-de-baly'] },
  'tsingy-de-namoroka':               { exclusive: ['namoroka'] },
};

// ================================================================
// Mots-clés pour matcher les images de dossiers partagés
// ================================================================
const KEYWORD_RELEVANCE: Record<string, string[]> = {
  // Diego zone
  'baie-diego-suarez':         ['baie', 'diego', 'suarez', '8246', 'antsiranana', 'port'],
  'mer-demeraude-diego-suarez': ['plage', 'ramena', 'pirogue', 'mer', 'emeraude'],
  'montagne-des-francais-diego-suarez': ['altitude', 'montagne', '1529'],
  'baie-des-dunes':            ['dune', 'plage', '441', 'joffre'],

  // Antananarivo
  'rova-manjakamiadana-antananarivo': ['rova', 'palais', '5', '6'],
  'parc-tsimbazaza-antananarivo': ['parc', '4', '2'],
};

function getImagesFromFolder(folderName: string): string[] {
  const dir = path.join(ATTRACTIONS_DIR, folderName);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f) && f !== '.gitkeep')
    .filter(f => !f.includes('Logo_mada_spot') && !f.includes('Gemini_Generated'))
    .map(f => `/images/Attractions/${folderName}/${f}`);
}

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionId) return apiError('Non autorisé', 401);
  const user = await getSession(sessionId);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const results: string[] = [];
    const globalUsed = new Set<string>(); // Track ALL used images globally

    // Step 1: Get all attractions
    const attractions = await prisma.establishment.findMany({
      where: { type: 'ATTRACTION' },
      select: { id: true, name: true, slug: true, coverImage: true, images: true },
      orderBy: { name: 'asc' },
    });

    // Step 2: First pass - collect all EXCLUSIVE folder images
    const slugToImages = new Map<string, string[]>();

    for (const attr of attractions) {
      const mapping = SLUG_MAP[attr.slug];
      if (!mapping) continue;

      const images: string[] = [];
      for (const folder of mapping.exclusive) {
        const folderImages = getImagesFromFolder(folder);
        images.push(...folderImages);
      }
      slugToImages.set(attr.slug, images);
    }

    // Step 3: For shared folders (diego-suarez, etc.), distribute by keyword relevance
    const sharedFolders = new Set<string>();
    for (const mapping of Object.values(SLUG_MAP)) {
      if (mapping.shared) {
        mapping.shared.forEach(f => sharedFolders.add(f));
      }
    }

    for (const folder of sharedFolders) {
      const allImages = getImagesFromFolder(folder);
      const slugsUsingFolder = Object.entries(SLUG_MAP)
        .filter(([, m]) => m.shared?.includes(folder))
        .map(([slug]) => slug);

      // Distribute images by keyword matching
      for (const img of allImages) {
        const imgLower = img.toLowerCase();
        let bestSlug = '';
        let bestScore = 0;

        for (const slug of slugsUsingFolder) {
          const keywords = KEYWORD_RELEVANCE[slug] || [];
          const score = keywords.filter(kw => imgLower.includes(kw)).length;
          if (score > bestScore) {
            bestScore = score;
            bestSlug = slug;
          }
        }

        if (bestSlug && bestScore > 0) {
          const existing = slugToImages.get(bestSlug) || [];
          existing.push(img);
          slugToImages.set(bestSlug, existing);
        }
      }
    }

    // Step 4: Update database - assign images ensuring NO duplicates
    let updated = 0;

    for (const attr of attractions) {
      let localImages = slugToImages.get(attr.slug) || [];

      // Filter out already used images (global dedup)
      localImages = localImages.filter(img => !globalUsed.has(img));

      if (localImages.length === 0) continue;

      // Pick best cover image (first one that's not already the cover)
      const coverImage = localImages[0];
      const galleryImages = localImages.slice(1);

      // Mark all as used globally
      localImages.forEach(img => globalUsed.add(img));

      // Update DB
      await prisma.establishment.update({
        where: { id: attr.id },
        data: {
          coverImage,
          images: galleryImages.length > 0 ? JSON.stringify(galleryImages) : null,
        },
      });

      results.push(`[SYNC] ${attr.name}: cover + ${galleryImages.length} gallery (${localImages.length} total)`);
      updated++;
    }

    // Step 5: Handle attractions without exclusive folders
    // They keep their current highlights images as cover
    const noExclusive = attractions.filter(a => {
      const images = slugToImages.get(a.slug) || [];
      return images.length === 0;
    });

    for (const attr of noExclusive) {
      // Keep current coverImage from highlights (already set)
      if (attr.coverImage && !globalUsed.has(attr.coverImage)) {
        globalUsed.add(attr.coverImage);
        results.push(`[KEEP] ${attr.name}: ${attr.coverImage} (highlights)`);
      } else if (attr.coverImage) {
        results.push(`[KEEP] ${attr.name}: ${attr.coverImage} (already set)`);
      } else {
        results.push(`[EMPTY] ${attr.name}: pas d'image locale`);
      }
    }

    // Final stats
    const totalImages = await prisma.establishment.count({
      where: { type: 'ATTRACTION', coverImage: { not: null } },
    });

    // Verify no duplicates
    const allCovers = await prisma.establishment.findMany({
      where: { type: 'ATTRACTION' },
      select: { name: true, coverImage: true },
    });
    const coverMap: Record<string, string[]> = {};
    allCovers.forEach(a => {
      const img = a.coverImage || 'NULL';
      if (!coverMap[img]) coverMap[img] = [];
      coverMap[img].push(a.name);
    });
    const dupes = Object.entries(coverMap).filter(([, v]) => v.length > 1);

    return NextResponse.json({
      success: true,
      message: `${updated} fiches synchronisées. ${totalImages}/72 avec images.`,
      updated,
      totalWithImages: totalImages,
      duplicates: dupes.length,
      duplicateDetails: dupes.map(([img, names]) => `${img}: ${names.join(', ')}`),
      details: results,
    });
  } catch (error: unknown) {
    logger.error('Error syncing assets:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
