/**
 * Génère le Cahier de Charge Fonctionnel de MadaSpot
 * Usage: npx tsx scripts/generate-cahier-de-charge.ts
 * Output: MadaSpot_Cahier_de_Charge.docx
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle,
  PageBreak, TabStopType, TabStopPosition,
  ShadingType, convertInchesToTwip,
  Header, Footer, PageNumber, NumberFormat,
  TableOfContents,
} from 'docx'
import * as fs from 'fs'

// ─── COULEURS ───
const ORANGE = 'ff6b35'
const DARK = '080810'
const GRAY = '666666'
const LIGHT_GRAY = 'f5f5f5'
const WHITE = 'ffffff'
const TABLE_HEADER_BG = 'ff6b35'
const TABLE_ALT_BG = 'fff5f0'

// ─── HELPERS ───
function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: DARK, font: 'Calibri' })],
  })
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 26, color: ORANGE, font: 'Calibri' })],
  })
}

function heading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: DARK, font: 'Calibri' })],
  })
}

function para(text: string, opts?: { bold?: boolean; italic?: boolean; color?: string }): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({
      text,
      size: 20,
      font: 'Calibri',
      bold: opts?.bold,
      italics: opts?.italic,
      color: opts?.color || '333333',
    })],
  })
}

function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, font: 'Calibri', color: '333333' })],
  })
}

function bulletBold(label: string, desc: string, level = 0): Paragraph {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: label + ' — ', size: 20, font: 'Calibri', bold: true, color: DARK }),
      new TextRun({ text: desc, size: 20, font: 'Calibri', color: '333333' }),
    ],
  })
}

function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: 200 }, children: [] })
}

function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] })
}

function tableHeaderCell(text: string): TableCell {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: TABLE_HEADER_BG },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 18, font: 'Calibri', color: WHITE })],
    })],
    width: { size: 100, type: WidthType.AUTO },
  })
}

function tableCell(text: string, alt = false): TableCell {
  return new TableCell({
    shading: alt ? { type: ShadingType.SOLID, color: TABLE_ALT_BG } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text, size: 18, font: 'Calibri', color: '333333' })],
    })],
    width: { size: 100, type: WidthType.AUTO },
  })
}

function makeTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => tableHeaderCell(h)) }),
      ...rows.map((row, i) =>
        new TableRow({ children: row.map(cell => tableCell(cell, i % 2 === 1)) })
      ),
    ],
  })
}

// ─── SECTIONS DU DOCUMENT ───

function sectionCoverPage(): Paragraph[] {
  return [
    spacer(), spacer(), spacer(), spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 28, color: ORANGE, font: 'Calibri' })],
    }),
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'MADA SPOT', size: 56, bold: true, color: DARK, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Plateforme Touristique de Madagascar', size: 28, color: ORANGE, font: 'Calibri' })],
    }),
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 28, color: ORANGE, font: 'Calibri' })],
    }),
    spacer(), spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'CAHIER DE CHARGE FONCTIONNEL', size: 36, bold: true, color: DARK, font: 'Calibri' })],
    }),
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Document décrivant l\'intégralité des fonctionnalités,', size: 22, color: GRAY, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'pages, APIs, composants et rôles de la plateforme', size: 22, color: GRAY, font: 'Calibri' })],
    }),
    spacer(), spacer(), spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      children: [new TextRun({ text: `Version 1.0 — ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`, size: 22, color: GRAY, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      children: [new TextRun({ text: 'Stack: Next.js 16 · React 19 · Prisma · PostgreSQL · TailwindCSS 4', size: 18, color: GRAY, font: 'Calibri' })],
    }),
    pageBreak(),
  ]
}

function sectionSommaire(): Paragraph[] {
  return [
    heading1('Sommaire'),
    spacer(),
    ...[
      '1. Présentation Générale',
      '2. Architecture Technique',
      '3. Rôles Utilisateurs',
      '4. Pages Front Office (Public)',
      '5. Espace Client (Voyageur)',
      '6. Espace Prestataire (Professionnel)',
      '7. Espace Administrateur (20 modules)',
      '8. Système de Réservation',
      '9. Messagerie en Temps Réel',
      '10. Système de Notifications',
      '11. Système d\'Avis et Notes',
      '12. Vérification & Conformité',
      '13. Contenu Éditorial & Informations',
      '14. Recherche & Cartes Interactives',
      '15. SEO, PWA & Performance',
      '16. Catalogue Complet des APIs (~150 endpoints)',
      '17. Schéma Base de Données (40 modèles)',
      '18. Sécurité & Protection des Données',
    ].map(item => para(item, { color: DARK })),
    pageBreak(),
  ]
}

function section1(): Paragraph[] {
  return [
    heading1('1. Présentation Générale'),
    heading2('1.1 Description du Projet'),
    para('MadaSpot est une plateforme web complète dédiée au tourisme à Madagascar. Elle met en relation les voyageurs (clients) avec les prestataires touristiques (hôtels, restaurants, attractions, prestataires de services) et offre un portail d\'informations riche sur Madagascar (histoire, économie, pharmacies, urgences, événements, météo).'),
    spacer(),
    heading2('1.2 Objectifs'),
    bullet('Offrir un annuaire complet des établissements touristiques de Madagascar'),
    bullet('Permettre la réservation en ligne (hôtels, restaurants, attractions, prestataires)'),
    bullet('Faciliter la communication entre voyageurs et prestataires via messagerie temps réel'),
    bullet('Fournir un système d\'avis et de notation vérifiés'),
    bullet('Proposer du contenu éditorial (articles, guides, événements, recettes)'),
    bullet('Informer sur les services pratiques (pharmacies de garde, urgences, météo, taux de change)'),
    bullet('Offrir un tableau de bord complet pour les prestataires (gestion réservations, tarifs, statistiques)'),
    bullet('Fournir un centre de contrôle administrateur puissant avec 20 modules'),
    spacer(),
    heading2('1.3 Public Cible'),
    makeTable(
      ['Profil', 'Description', 'Accès'],
      [
        ['Visiteur (non inscrit)', 'Tout internaute — consulte l\'annuaire, les articles, les infos pratiques', 'Pages publiques uniquement'],
        ['Client (Voyageur)', 'Inscrit comme voyageur — réserve, envoie des messages, laisse des avis, gère ses favoris', '/client/* — Dashboard voyageur'],
        ['Prestataire (Pro)', 'Inscrit comme professionnel (hôtel, restaurant, attraction, prestataire) — gère son établissement, ses réservations, ses tarifs', '/dashboard/* — Dashboard pro'],
        ['Administrateur', 'Rôle ADMIN — accès total au centre de contrôle, modération, gestion utilisateurs, statistiques', '/admin — Control Center (20 tabs)'],
      ]
    ),
    pageBreak(),
  ]
}

function section2(): Paragraph[] {
  return [
    heading1('2. Architecture Technique'),
    heading2('2.1 Stack Frontend'),
    makeTable(
      ['Technologie', 'Version', 'Rôle'],
      [
        ['Next.js', '16.0.10', 'Framework React — App Router, SSR, API Routes, Dynamic Imports'],
        ['React', '19.2.1', 'Bibliothèque UI — Server & Client Components'],
        ['TailwindCSS', '4', 'Framework CSS utility-first (via PostCSS)'],
        ['Framer Motion', '12', 'Animations et transitions fluides'],
        ['Lucide React', '0.561', 'Icônes SVG modulaires'],
        ['React-Leaflet', '5.0', 'Cartes interactives (Leaflet)'],
        ['TipTap', '3.16', 'Éditeur de texte riche (articles)'],
        ['Zustand', '5.0', 'Store global minimal'],
        ['TanStack React Query', '5.90', 'Cache serveur, mutations, polling'],
        ['next-themes', '0.4', 'Gestion thème dark/light'],
        ['date-fns', '4.1', 'Manipulation de dates'],
        ['React Dropzone', '14.3', 'Upload fichiers drag & drop'],
      ]
    ),
    spacer(),
    heading2('2.2 Stack Backend'),
    makeTable(
      ['Technologie', 'Version', 'Rôle'],
      [
        ['Next.js API Routes', '16', '~150 endpoints REST'],
        ['Prisma', '5.22', 'ORM — 40 modèles, 13 enums, relations'],
        ['PostgreSQL (Neon)', 'Cloud', 'Base de données relationnelle serverless'],
        ['bcryptjs', '3.0', 'Hashing sécurisé des mots de passe (12 rounds)'],
        ['Sharp', '0.34', 'Traitement et optimisation d\'images côté serveur'],
        ['web-push', '3.6', 'Notifications push navigateur'],
        ['Zod', '4.2', 'Validation des données entrantes'],
      ]
    ),
    spacer(),
    heading2('2.3 Infrastructure'),
    bullet('Hébergement : Render.com (render.yaml)'),
    bullet('Base de données : Neon (PostgreSQL serverless cloud)'),
    bullet('PWA : Service Worker + manifest.json (mode hors ligne)'),
    bullet('Géocodage : Nominatim (API publique OpenStreetMap)'),
    bullet('i18n : Français (défaut) + Anglais'),
    bullet('Devises : MGA (Ariary), EUR, USD — conversion dynamique'),
    pageBreak(),
  ]
}

function section3(): Paragraph[] {
  return [
    heading1('3. Rôles Utilisateurs & Permissions'),
    heading2('3.1 Visiteur (Non inscrit)'),
    para('Accès en lecture seule aux pages publiques :'),
    bullet('Consulter l\'annuaire (hôtels, restaurants, attractions, prestataires)'),
    bullet('Voir les fiches détaillées et les avis'),
    bullet('Utiliser la recherche globale et la carte interactive'),
    bullet('Lire les articles, événements, informations pratiques'),
    bullet('Consulter les pharmacies de garde et contacts d\'urgence'),
    bullet('Voir les taux de change et alertes météo'),
    spacer(),
    heading2('3.2 Client — Voyageur (role: CLIENT, userType: null)'),
    para('Après inscription avec email/téléphone + mot de passe :'),
    bullet('Toutes les fonctionnalités du visiteur'),
    bullet('Réserver un établissement (hôtel, restaurant, attraction, prestataire)'),
    bullet('Envoyer des messages aux prestataires (chat temps réel)'),
    bullet('Laisser des avis avec photos et notes (1-5 étoiles)'),
    bullet('Gérer ses favoris'),
    bullet('Cumuler des points de fidélité (réservation, avis, favoris)'),
    bullet('Gérer ses préférences de notifications'),
    bullet('Recevoir des notifications push (confirmation réservation, nouveau message)'),
    bullet('Publier des lieux et des avis'),
    spacer(),
    heading2('3.3 Prestataire — Professionnel (role: CLIENT, userType: HOTEL|RESTAURANT|ATTRACTION|PROVIDER)'),
    para('Inscription spéciale avec choix du type d\'établissement :'),
    bullet('Toutes les fonctionnalités du client'),
    bullet('Créer et gérer sa fiche établissement (infos, photos, menu, galerie)'),
    bullet('Gérer ses réservations (accepter, refuser, confirmer)'),
    bullet('Gérer son calendrier de disponibilité'),
    bullet('Configurer ses tarifs et tarifs saisonniers'),
    bullet('Créer des promotions'),
    bullet('Répondre aux avis clients'),
    bullet('Consulter ses statistiques (vues, réservations, revenus, analytics)'),
    bullet('Soumettre des documents de vérification (NIF, STAT, licence, CIN)'),
    bullet('Gérer des réponses rapides pré-enregistrées'),
    bullet('Revendiquer une fiche existante (claiming)'),
    spacer(),
    heading2('3.4 Administrateur (role: ADMIN)'),
    para('Accès complet au Centre de Contrôle Admin (/admin) avec 20 modules :'),
    bullet('Tableau de bord avec KPIs, graphiques, heatmap Madagascar'),
    bullet('Modération des fiches, avis, revendications, images'),
    bullet('Gestion complète des utilisateurs (liste, ban, message direct)'),
    bullet('Vérification des documents NIF/STAT/CIN (approuver/rejeter)'),
    bullet('Suivi de conformité des nouveaux inscrits'),
    bullet('Classement manuel des établissements (ranking)'),
    bullet('Calendrier des événements (approuver/rejeter)'),
    bullet('Messagerie God Mode (intervenir dans les conversations, messages directs)'),
    bullet('Simulation de compte utilisateur'),
    bullet('Nettoyage de base de données (dry-run)'),
    bullet('Import/Export CSV'),
    bullet('Gestion des taux de change, publicités, articles, vlogs, pharmacies, urgences'),
    bullet('Journal d\'audit complet de toutes les actions'),
    pageBreak(),
  ]
}

function section4(): Paragraph[] {
  return [
    heading1('4. Pages Front Office (Public)'),
    heading2('4.1 Page d\'Accueil'),
    bulletBold('URL', '/'),
    bulletBold('Rôle', 'Landing page principale — présentation de la plateforme, établissements mis en avant, articles récents, section tendances, recettes, horoscope, offres d\'emploi'),
    bulletBold('Composants', 'BentoHero, TrendingSection, RecipeSection, HoroscopeSection, JobsSection, SuccessTicker, AdSidebar, TopAdBanner'),
    spacer(),
    heading2('4.2 Annuaire Bons Plans'),
    heading3('4.2.1 Page Index Bons Plans'),
    bulletBold('URL', '/bons-plans'),
    bulletBold('Rôle', 'Point d\'entrée de l\'annuaire — catégories (hôtels, restaurants, attractions, prestataires), recherche rapide, promotions actives'),
    spacer(),
    heading3('4.2.2 Hôtels'),
    bulletBold('URL', '/bons-plans/hotels'),
    bulletBold('Rôle', 'Liste paginée des hôtels avec filtres (ville, standing, prix, équipements). Tri par displayOrder → featured → rating'),
    bulletBold('URL détail', '/bons-plans/hotels/[slug]'),
    bulletBold('Rôle détail', 'Fiche complète : galerie photos (CategorizedGallery), description, types de chambres, tarifs, carte GPS, avis, promotions, disponibilité, bouton réservation, contact, liens sociaux, banner FOMO, météo'),
    spacer(),
    heading3('4.2.3 Restaurants'),
    bulletBold('URL', '/bons-plans/restaurants'),
    bulletBold('Rôle', 'Liste paginée des restaurants avec filtres (ville, catégorie: gargote/lounge/café/fast-food, cuisine, prix). Tri identique'),
    bulletBold('URL détail', '/bons-plans/restaurants/[slug]'),
    bulletBold('Rôle détail', 'Fiche complète : galerie, menu (images), spécialités, horaires, services (livraison, WiFi, parking, générateur), avis, réservation'),
    spacer(),
    heading3('4.2.4 Attractions'),
    bulletBold('URL', '/bons-plans/attractions'),
    bulletBold('Rôle', 'Liste des attractions touristiques avec filtres (ville, type, gratuit/payant). Carte des attractions'),
    bulletBold('URL détail', '/bons-plans/attractions/[slug]'),
    bulletBold('Rôle détail', 'Fiche : galerie, entrée (tarif local/étranger), durée visite, meilleure saison, guide disponible, points forts (highlights)'),
    spacer(),
    heading3('4.2.5 Prestataires de Services'),
    bulletBold('URL', '/bons-plans/prestataires'),
    bulletBold('Rôle', 'Liste des prestataires (guides, chauffeurs, agences, photographes, bateaux, etc.) avec filtres'),
    bulletBold('URL détail', '/bons-plans/prestataires/[slug]'),
    bulletBold('Rôle détail', 'Fiche : galerie (CategorizedGallery avec lightbox), type de service, langues parlées, zone d\'opération, véhicule, certifications, avis, contact'),
    spacer(),
    heading3('4.2.6 Carte Interactive'),
    bulletBold('URL', '/bons-plans/carte'),
    bulletBold('Rôle', 'Carte pleine page (Leaflet) avec tous les établissements géolocalisés, clusters, filtres par type, popup avec résumé et lien vers fiche'),
    spacer(),
    heading3('4.2.7 Guide Culinaire'),
    bulletBold('URL', '/bons-plans/guide-culinaire'),
    bulletBold('Rôle', 'Guide des plats et spécialités culinaires malgaches'),
    spacer(),
    heading3('4.2.8 Offres & Promotions'),
    bulletBold('URL', '/bons-plans/offres'),
    bulletBold('Rôle', 'Liste des promotions actives de tous les établissements'),
    spacer(),
    heading2('4.3 Événements'),
    bulletBold('URL', '/evenements'),
    bulletBold('Rôle', 'Calendrier des événements à Madagascar (festivals, culturels, sportifs, nature, marchés). Filtres par catégorie et ville'),
    bulletBold('URL détail', '/evenements/[slug]'),
    bulletBold('Rôle détail', 'Détail événement : dates, lieu, organisateur, description'),
    bulletBold('URL soumettre', '/evenements/soumettre'),
    bulletBold('Rôle soumettre', 'Formulaire de soumission d\'un événement (statut pending, validé par admin)'),
    spacer(),
    heading2('4.4 Recherche'),
    bulletBold('URL', '/search'),
    bulletBold('Rôle', 'Recherche globale multi-critères — établissements, événements. Filtres avancés (type, ville, prix, note, services). Pagination, chips filtres actifs'),
    spacer(),
    heading2('4.5 Informations Pratiques'),
    heading3('4.5.1 Pharmacies de Garde'),
    bulletBold('URL', '/pharmacies'),
    bulletBold('Rôle', 'Liste des pharmacies par ville avec indication de garde, horaires, contact, géolocalisation'),
    heading3('4.5.2 Contacts d\'Urgence'),
    bulletBold('URL', '/urgences'),
    bulletBold('Rôle', 'Numéros d\'urgence (police, pompiers, SAMU, ambassades) par ville, disponibilité 24h'),
    spacer(),
    heading2('4.6 Pages Statiques'),
    makeTable(
      ['URL', 'Titre', 'Rôle'],
      [
        ['/a-propos', 'À Propos', 'Présentation de MadaSpot, équipe, mission'],
        ['/contact', 'Contact', 'Formulaire de contact (envoi email)'],
        ['/aide', 'Aide', 'Centre d\'aide et FAQ'],
        ['/faq', 'FAQ', 'Questions fréquemment posées'],
        ['/comment-ca-marche', 'Comment ça marche', 'Guide d\'utilisation de la plateforme'],
        ['/cgu', 'CGU', 'Conditions générales d\'utilisation'],
        ['/mentions-legales', 'Mentions Légales', 'Mentions légales obligatoires'],
        ['/politique-confidentialite', 'Politique Confidentialité', 'RGPD et protection des données'],
        ['/offline', 'Hors Ligne', 'Page PWA affichée quand pas de connexion'],
      ]
    ),
    spacer(),
    heading2('4.7 Authentification'),
    makeTable(
      ['URL', 'Rôle'],
      [
        ['/login', 'Connexion par email ou téléphone + mot de passe'],
        ['/register', 'Inscription prestataire (choix type: hôtel, restaurant, attraction, prestataire)'],
        ['/register-client', 'Inscription voyageur (client simple)'],
        ['/forgot-password', 'Demande de réinitialisation mot de passe (envoi email)'],
        ['/reset-password', 'Page de saisie du nouveau mot de passe (via token)'],
      ]
    ),
    spacer(),
    heading2('4.8 Contribution'),
    bulletBold('/publier-lieu', 'Formulaire pour soumettre un nouveau lieu (ghost establishment). Statut pending, validé par admin'),
    bulletBold('/publier-avis', 'Formulaire pour publier un avis sur un établissement'),
    pageBreak(),
  ]
}

function section5(): Paragraph[] {
  return [
    heading1('5. Espace Client — Dashboard Voyageur'),
    para('Accessible après connexion. Protégé par middleware (cookie mada-spot-session requis). URL de base : /client'),
    spacer(),
    heading2('5.1 Tableau de Bord Client'),
    bulletBold('URL', '/client'),
    bulletBold('Rôle', 'Vue d\'ensemble : réservations récentes, favoris, points fidélité, messages non lus, notifications'),
    spacer(),
    heading2('5.2 Mes Réservations'),
    bulletBold('URL', '/client/bookings'),
    bulletBold('Rôle', 'Liste de toutes les réservations (pending, confirmed, cancelled, completed). Détails de chaque réservation, possibilité d\'annuler'),
    bulletBold('URL review', '/client/bookings/[id]/review'),
    bulletBold('Rôle review', 'Laisser un avis après un séjour confirmé — note 1-5 étoiles, commentaire, photos. Points fidélité attribués'),
    spacer(),
    heading2('5.3 Mes Favoris'),
    bulletBold('URL', '/client/favorites'),
    bulletBold('Rôle', 'Liste des établissements mis en favoris. Ajout/suppression depuis les fiches. Points fidélité pour le premier ajout'),
    spacer(),
    heading2('5.4 Programme Fidélité'),
    bulletBold('URL', '/client/fidelite'),
    bulletBold('Rôle', 'Solde de points, historique des transactions (BOOKING_COMPLETE, REVIEW_POSTED, FAVORITE_ADDED, BONUS). Système de paliers'),
    spacer(),
    heading2('5.5 Messagerie'),
    bulletBold('URL', '/client/messagerie'),
    bulletBold('Rôle', 'Interface de chat temps réel avec les prestataires. Liste des conversations (threads), bulles de messages, indicateur de frappe, statut en ligne/hors ligne, réponses rapides'),
    spacer(),
    heading2('5.6 Mes Publications'),
    bulletBold('URL', '/client/publications'),
    bulletBold('Rôle', 'Liste des lieux et avis publiés par le client'),
    spacer(),
    heading2('5.7 Paramètres'),
    bulletBold('URL', '/client/settings'),
    bulletBold('Rôle', 'Profil (nom, avatar, ville, contact), changement de mot de passe, préférences de notifications (email, push, SMS par type), suppression de compte'),
    pageBreak(),
  ]
}

function section6(): Paragraph[] {
  return [
    heading1('6. Espace Prestataire — Dashboard Professionnel'),
    para('Accessible après inscription prestataire. Protégé par middleware. URL de base : /dashboard'),
    spacer(),
    heading2('6.1 Tableau de Bord Pro'),
    bulletBold('URL', '/dashboard'),
    bulletBold('Rôle', 'Vue d\'ensemble : réservations du jour, messages non lus, note moyenne, vues récentes, chiffres clés'),
    spacer(),
    heading2('6.2 Mon Établissement'),
    bulletBold('URL', '/dashboard/etablissement'),
    bulletBold('Rôle', 'Formulaire complet de gestion de la fiche : nom, description, adresse, coordonnées GPS (carte Nominatim), téléphone, email, site web, réseaux sociaux, photo de couverture, galerie d\'images, images menu (restaurant), horaires d\'ouverture, équipements/services'),
    bulletBold('Upload', 'Upload multi-fichiers avec CSRF token, traitement batch par 5, stockage /uploads/'),
    spacer(),
    heading2('6.3 Réservations'),
    bulletBold('URL', '/dashboard/reservations'),
    bulletBold('Rôle', 'Liste des réservations reçues. Actions : accepter (→ confirmed + notification client), refuser (→ cancelled + notification client). Filtres par statut et date. Tableau avec détails client, dates, nombre de personnes, demandes spéciales'),
    spacer(),
    heading2('6.4 Calendrier'),
    bulletBold('URL', '/dashboard/calendrier'),
    bulletBold('Rôle', 'Vue calendrier mensuelle des réservations et disponibilités. Bloquer/débloquer des dates manuellement. Vue par type de chambre (hôtels)'),
    spacer(),
    heading2('6.5 Messagerie Pro'),
    bulletBold('URL', '/dashboard/messagerie'),
    bulletBold('Rôle', 'Chat temps réel avec les clients. Liste des conversations, messages, indicateurs de frappe et présence. Réponses rapides pré-enregistrées'),
    spacer(),
    heading2('6.6 Gestion des Avis'),
    bulletBold('URL', '/dashboard/avis'),
    bulletBold('Rôle', 'Liste des avis reçus sur l\'établissement. Possibilité de répondre à chaque avis (ownerResponse). Signalement d\'avis inappropriés'),
    spacer(),
    heading2('6.7 Tarification'),
    bulletBold('URL', '/dashboard/tarifs'),
    bulletBold('Rôle', 'Gestion des tarifs de base et saisonniers. Configuration des multiplicateurs de prix par période (haute/basse saison). Types de chambres et prix (hôtels)'),
    spacer(),
    heading2('6.8 Promotions'),
    bulletBold('URL', '/dashboard/promotions'),
    bulletBold('Rôle', 'Créer, modifier, activer/désactiver des promotions (titre, description, % réduction, dates début/fin)'),
    spacer(),
    heading2('6.9 Statistiques'),
    bulletBold('URL', '/dashboard/statistiques'),
    bulletBold('Rôle', 'Analytics détaillées : vues par jour/semaine/mois, réservations, taux de conversion, sources de trafic, graphiques de tendance'),
    spacer(),
    heading2('6.10 Vérification Documents'),
    bulletBold('URL', '/dashboard/verification'),
    bulletBold('Rôle', 'Soumettre les documents légaux pour vérification par l\'admin : NIF (Numéro d\'Identification Fiscale), Carte STAT, Licence d\'exploitation, Pièce d\'identité (CIN). Suivi du statut de chaque document (En attente / Vérifié / Rejeté)'),
    spacer(),
    heading2('6.11 Paramètres'),
    bulletBold('URL', '/dashboard/parametres'),
    bulletBold('Rôle', 'Profil prestataire, changement de mot de passe, préférences de notifications'),
    pageBreak(),
  ]
}

function section7(): Paragraph[] {
  return [
    heading1('7. Espace Administrateur — Centre de Contrôle'),
    para('Accessible via /admin après connexion admin. Session séparée (cookie mada-spot-admin-session, 24h). 20 modules en tabs, chargement dynamique.'),
    spacer(),
    heading2('7.1 Tableau de Bord'),
    bulletBold('Tab', 'dashboard'),
    bulletBold('Composant', 'AdminDashboardOverview'),
    bullet('KPIs temps réel : total utilisateurs, établissements, messages, réservations'),
    bullet('Graphique croissance utilisateurs par type (stacked bar chart)'),
    bullet('Graphique tendance messages'),
    bullet('File d\'attente modération (fiches pending, avis signalés, revendications)'),
    bullet('Heatmap Madagascar (Leaflet) — cercles proportionnels par nombre de vues par ville'),
    spacer(),
    heading2('7.2 Pipeline de Modération'),
    bulletBold('Tab', 'moderation'),
    bulletBold('Composant', 'ModerationPipeline'),
    bullet('Sous-tab 1 — Validation Fiches : fiches en pending_review avec documents, actions approuver/rejeter'),
    bullet('Sous-tab 2 — Ghost Management : lieux fantômes soumis par les utilisateurs, promouvoir en fiche réelle ou fusionner'),
    bullet('Sous-tab 3 — Audit Reviews : avis signalés (flagged) et cachés (hidden), modération'),
    spacer(),
    heading2('7.3 Gestion des Établissements'),
    bulletBold('Tab', 'establishments'),
    bulletBold('Composant', 'EstablishmentModerationList'),
    bullet('Liste complète des établissements avec filtres (type, ville, statut modération)'),
    bullet('Actions : approuver, rejeter, mettre en vedette (featured), supprimer'),
    bullet('Édition de fiche (inline)'),
    spacer(),
    heading2('7.4 Revendications'),
    bulletBold('Tab', 'claims'),
    bulletBold('Composant', 'ClaimsModeration'),
    bullet('Liste des demandes de revendication de fiches par les propriétaires'),
    bullet('Détails : nom, email, téléphone, rôle, preuve, documents'),
    bullet('Actions : approuver (→ fiche claimed, propriétaire lié), rejeter avec motif'),
    spacer(),
    heading2('7.5 Modération des Avis'),
    bulletBold('Tab', 'reviews'),
    bulletBold('Composant', 'ReviewModeration'),
    bullet('Liste des avis signalés, non publiés ou à modérer'),
    bullet('Actions : publier, cacher, supprimer'),
    spacer(),
    heading2('7.6 Gestion des Réservations'),
    bulletBold('Tab', 'bookings'),
    bulletBold('Composant', 'BookingManagement'),
    bullet('Vue globale de toutes les réservations de la plateforme'),
    bullet('Filtres par statut, établissement, date'),
    spacer(),
    heading2('7.7 Calendrier des Événements'),
    bulletBold('Tab', 'events'),
    bulletBold('Composant', 'EventCalendar'),
    bullet('Grille calendrier mensuel (CSS Grid) avec événements positionnés'),
    bullet('Filtres par catégorie et statut'),
    bullet('Panel détail avec actions approuver/rejeter un événement soumis'),
    spacer(),
    heading2('7.8 Gestion des Images'),
    bulletBold('Tab', 'images'),
    bulletBold('Composant', 'ImageManager'),
    bullet('CRUD images pour les attractions et établissements'),
    bullet('Upload, suppression, réorganisation'),
    spacer(),
    heading2('7.9 Support — Messagerie'),
    bulletBold('Tab', 'support'),
    bulletBold('Composant', 'AdminSupportInbox'),
    bullet('Visualiseur en lecture seule de toutes les conversations entre utilisateurs'),
    bullet('Recherche par utilisateur, filtres par date'),
    spacer(),
    heading2('7.10 God Mode — Intervention'),
    bulletBold('Tab', 'godmode'),
    bulletBold('Composant', 'GodModeMessaging'),
    bullet('Intervention dans les conversations existantes (envoyer un message au nom du système)'),
    bullet('Message direct à n\'importe quel utilisateur (recherche par nom/email/phone)'),
    bullet('Raison d\'audit obligatoire pour chaque intervention'),
    bullet('Tout est tracé dans l\'AuditLog'),
    spacer(),
    heading2('7.11 Gestion des Utilisateurs'),
    bulletBold('Tab', 'users'),
    bulletBold('Composant', 'UserManagement'),
    bullet('Tabs par type : Tous, Voyageurs, Hôtels, Restaurants, Attractions, Prestataires'),
    bullet('KPIs : total users, nouveaux cette semaine, bannés, prestataires'),
    bullet('Tableau : avatar, nom, email/phone, type, date inscription, statut, documents vérifiés'),
    bullet('Actions : voir profil, envoyer message direct, bannir/débannir avec motif, activer/désactiver'),
    bullet('Recherche et filtres (statut, date)'),
    bullet('Pagination'),
    spacer(),
    heading2('7.12 Vérification des Documents'),
    bulletBold('Tab', 'verification'),
    bulletBold('Composant', 'VerificationReview'),
    bullet('KPIs : documents en attente, vérifiés, rejetés'),
    bullet('Filtres par statut (En attente / Vérifié / Rejeté) et recherche'),
    bullet('Liste des documents soumis : type (NIF, STAT, Licence, CIN), utilisateur, date'),
    bullet('Preview du document (image ou PDF)'),
    bullet('Actions : Approuver ou Rejeter avec note obligatoire'),
    bullet('Notification automatique envoyée au prestataire'),
    spacer(),
    heading2('7.13 Import de Données'),
    bulletBold('Tab', 'import'),
    bulletBold('Composant', 'ImportSection'),
    bullet('Import d\'établissements par fichier CSV'),
    bullet('Template CSV téléchargeable'),
    bullet('Historique des imports (batch) avec taux de succès/erreur'),
    spacer(),
    heading2('7.14 Classement des Établissements'),
    bulletBold('Tab', 'ranking'),
    bulletBold('Composant', 'RankingManager'),
    bullet('Filtrage par type (Hôtel, Restaurant, Attraction, Prestataire) et par ville'),
    bullet('Liste ordonnée avec flèches monter/descendre'),
    bullet('Numéro d\'ordre éditable en cliquant dessus'),
    bullet('Bouton "Auto-numéroter" pour attribution automatique'),
    bullet('Toggle "Featured" (étoile) par établissement'),
    bullet('Sauvegarde en batch (un seul PUT pour toutes les positions)'),
    bullet('Tri dans le front office : displayOrder DESC → isFeatured DESC → rating DESC'),
    spacer(),
    heading2('7.15 Suivi de Conformité'),
    bulletBold('Tab', 'nonconformity'),
    bulletBold('Composant', 'ComplianceTracker'),
    bullet('Section 1 — Inscriptions récentes : comptes créés dans les 7/30/90 derniers jours, progression profil (%)'),
    bullet('Section 2 — Conformité Documents : prestataires sans NIF/STAT soumis, taux de conformité'),
    bullet('Section 3 — Qualité des Fiches : établissements avec problèmes (pas de cover, pas d\'images, description trop courte, pas de GPS, pas de téléphone)'),
    bullet('Badges visuels rouge/orange/vert'),
    spacer(),
    heading2('7.16 Simulation de Compte'),
    bulletBold('Tab', 'simulation'),
    bulletBold('Composant', 'AccountSimulation'),
    bullet('Recherche d\'utilisateur par nom, email, téléphone'),
    bullet('Carte profil avec toutes les infos, stats, établissement lié'),
    bullet('Bouton "Voir en tant que" → log audit + navigation vers dashboard utilisateur'),
    spacer(),
    heading2('7.17 Nettoyage Base de Données'),
    bulletBold('Tab', 'cleanup'),
    bulletBold('Composant', 'DBCleanupTool'),
    bullet('Catégories : comptes inactifs, vieux messages, anciennes vues, ancien audit'),
    bullet('Mode dry-run (preview) : affiche ce qui serait supprimé sans supprimer'),
    bullet('Mode exécution : suppression réelle avec confirmation'),
    spacer(),
    heading2('7.18 Gestion des Devises'),
    bulletBold('Tab', 'exchange'),
    bulletBold('Composant', 'ExchangeRateManager'),
    bullet('Configuration des taux MGA/EUR, MGA/USD, EUR/USD'),
    spacer(),
    heading2('7.19 Journal d\'Audit'),
    bulletBold('Tab', 'audit'),
    bulletBold('Composant', 'AuditLog'),
    bullet('Log de TOUTES les actions admin : login, modification, suppression, ban, message, intervention'),
    bullet('Filtres par action, type d\'entité, utilisateur, date'),
    bullet('Détails : qui, quoi, quand, IP, user-agent'),
    spacer(),
    heading2('7.20 Statistiques & Export'),
    bulletBold('Tab', 'stats'),
    bullet('Export CSV : Utilisateurs, Établissements, Réservations, Avis'),
    bullet('Statistiques globales de la plateforme'),
    pageBreak(),
  ]
}

function section8(): Paragraph[] {
  return [
    heading1('8. Système de Réservation'),
    heading2('8.1 Flux Complet'),
    para('Le processus de réservation suit un workflow en 6 étapes :'),
    spacer(),
    bulletBold('Étape 1 — Consultation', 'Le client visite la fiche d\'un établissement et consulte les disponibilités via le calendrier. Seules les réservations confirmées bloquent des dates.'),
    bulletBold('Étape 2 — Réservation', 'Le client remplit le formulaire : dates (checkIn/checkOut), nombre de personnes, type de chambre (hôtels), demandes spéciales. La réservation est créée en statut "pending".'),
    bulletBold('Étape 3 — Notification', 'Le prestataire reçoit une notification BOOKING_NEW (push + in-app).'),
    bulletBold('Étape 4 — Décision', 'Le prestataire accepte (→ confirmed) ou refuse (→ cancelled) la réservation. Le client reçoit une notification BOOKING_CONFIRMED ou BOOKING_CANCELLED.'),
    bulletBold('Étape 5 — Séjour', 'Le client profite de son séjour. Le statut passe à "completed" après la date.'),
    bulletBold('Étape 6 — Avis', 'Après un séjour complété, le client peut laisser un avis (1-5 étoiles, commentaire, photos). Le prestataire peut répondre. Le client gagne des points fidélité.'),
    spacer(),
    heading2('8.2 Statuts de Réservation'),
    makeTable(
      ['Statut', 'Description', 'Action déclenchante'],
      [
        ['pending', 'Réservation en attente de validation', 'Création par le client'],
        ['confirmed', 'Acceptée par le prestataire', 'Action prestataire "Accepter"'],
        ['cancelled', 'Refusée ou annulée', 'Action prestataire "Refuser" ou client "Annuler"'],
        ['completed', 'Séjour terminé', 'Automatique après la date de checkout'],
      ]
    ),
    spacer(),
    heading2('8.3 Référence Unique'),
    para('Chaque réservation reçoit une référence unique (champ "reference" dans Booking). Format généré automatiquement pour le suivi.'),
    pageBreak(),
  ]
}

function section9(): Paragraph[] {
  return [
    heading1('9. Messagerie en Temps Réel'),
    heading2('9.1 Architecture'),
    bullet('Communication bidirectionnelle entre clients et prestataires'),
    bullet('Chaque conversation est liée à un établissement (optionnel)'),
    bullet('Messages stockés dans le modèle Message (senderId, receiverId, content, isRead)'),
    bullet('Polling pour les nouveaux messages'),
    spacer(),
    heading2('9.2 Fonctionnalités'),
    bullet('Liste des conversations (threads) triées par date'),
    bullet('Bulles de messages avec horodatage'),
    bullet('Indicateur de frappe en temps réel (TypingIndicator)'),
    bullet('Statut en ligne/hors ligne (OnlineStatus via UserPresence)'),
    bullet('Marquer comme lu (isRead + readAt)'),
    bullet('Réponses rapides pré-enregistrées (QuickReply)'),
    spacer(),
    heading2('9.3 God Mode Admin'),
    bullet('L\'admin peut lire toutes les conversations (AdminSupportInbox)'),
    bullet('L\'admin peut intervenir dans une conversation existante (GodModeMessaging)'),
    bullet('L\'admin peut envoyer un message direct à n\'importe quel utilisateur'),
    bullet('Chaque intervention requiert une raison d\'audit'),
    bullet('Tout est tracé dans l\'AuditLog'),
    pageBreak(),
  ]
}

function section10(): Paragraph[] {
  return [
    heading1('10. Système de Notifications'),
    heading2('10.1 Types de Notifications'),
    makeTable(
      ['Type', 'Description', 'Destinataire'],
      [
        ['SYSTEM', 'Message système (vérification doc, admin)', 'Tout utilisateur'],
        ['BOOKING_NEW', 'Nouvelle réservation reçue', 'Prestataire'],
        ['BOOKING_CONFIRMED', 'Réservation acceptée', 'Client'],
        ['BOOKING_CANCELLED', 'Réservation refusée/annulée', 'Client'],
        ['BOOKING_COMPLETED', 'Séjour terminé', 'Client'],
        ['REVIEW_NEW', 'Nouvel avis reçu', 'Prestataire'],
        ['MESSAGE_NEW', 'Nouveau message', 'Destinataire'],
        ['CLAIM_SUBMITTED', 'Revendication soumise', 'Admin'],
        ['CLAIM_APPROVED', 'Revendication approuvée', 'Prestataire'],
        ['CLAIM_REJECTED', 'Revendication rejetée', 'Prestataire'],
        ['IMPORT_COMPLETED', 'Import CSV terminé', 'Admin'],
        ['EVENT_NEW', 'Nouvel événement soumis', 'Admin'],
        ['GHOST_CREATED', 'Lieu fantôme soumis', 'Admin'],
      ]
    ),
    spacer(),
    heading2('10.2 Canaux de Livraison'),
    bullet('In-app : badge compteur (NotificationBell), dropdown avec liste, polling toutes les 5-30 secondes'),
    bullet('Push navigateur : via Web Push API (VAPID keys), inscription via PushSubscription'),
    bullet('Email : envoi via POST /api/email/send pour certains événements'),
    spacer(),
    heading2('10.3 Préférences'),
    para('Chaque utilisateur peut configurer ses préférences de notifications (/client/settings) — activer/désactiver par type et par canal.'),
    pageBreak(),
  ]
}

function section11(): Paragraph[] {
  return [
    heading1('11. Système d\'Avis et Notes'),
    heading2('11.1 Création d\'un Avis'),
    bullet('Un client connecté peut laisser un avis sur n\'importe quel établissement'),
    bullet('Après une réservation complétée, l\'avis est "vérifié" (isVerified=true)'),
    bullet('Champs : note 1-5 étoiles, titre, commentaire, images (upload)'),
    bullet('Points fidélité attribués (REVIEW_POSTED)'),
    spacer(),
    heading2('11.2 Modération'),
    bullet('Les avis peuvent être signalés par les utilisateurs (ReportReviewDialog)'),
    bullet('Un avis signalé passe en isFlagged=true avec flagReason'),
    bullet('L\'admin modère via ReviewModeration et ModerationPipeline (Audit Reviews)'),
    bullet('Actions admin : publier, cacher, supprimer'),
    spacer(),
    heading2('11.3 Votes'),
    bullet('Les utilisateurs peuvent voter "utile" ou "pas utile" sur chaque avis'),
    bullet('Compteurs helpfulCount / unhelpfulCount'),
    bullet('Un utilisateur ne peut voter qu\'une fois par avis (unique constraint)'),
    spacer(),
    heading2('11.4 Réponse du Propriétaire'),
    bullet('Le prestataire peut répondre à un avis via son dashboard'),
    bullet('Champ ownerResponse affiché sous l\'avis'),
    pageBreak(),
  ]
}

function section12(): Paragraph[] {
  return [
    heading1('12. Vérification & Conformité'),
    heading2('12.1 Documents de Vérification'),
    para('Les prestataires doivent soumettre 4 types de documents pour être vérifiés :'),
    makeTable(
      ['Document', 'Description', 'Obligatoire'],
      [
        ['NIF', 'Numéro d\'Identification Fiscale', 'Oui pour les entreprises'],
        ['Carte STAT', 'Carte statistique de l\'entreprise', 'Oui pour les entreprises'],
        ['Licence d\'exploitation', 'Autorisation d\'exercer (tourisme, restauration)', 'Selon activité'],
        ['Pièce d\'identité (CIN)', 'Carte d\'identité du responsable', 'Oui'],
      ]
    ),
    spacer(),
    heading2('12.2 Workflow de Vérification'),
    bullet('Le prestataire upload un document via /dashboard/verification'),
    bullet('Le document est créé en statut PENDING dans VerificationDocument'),
    bullet('L\'admin voit les documents dans l\'onglet "Vérification" du Control Center'),
    bullet('L\'admin peut prévisualiser le document (image ou PDF)'),
    bullet('L\'admin approuve (VERIFIED) ou rejette (REJECTED) avec une note explicative'),
    bullet('Une notification SYSTEM est envoyée au prestataire'),
    bullet('L\'action est tracée dans l\'AuditLog'),
    spacer(),
    heading2('12.3 Suivi de Conformité'),
    para('Le module ComplianceTracker suit automatiquement :'),
    bullet('Nouveaux inscrits : progression du profil (email + phone + avatar + nom + email vérifié = 5×20%)'),
    bullet('Conformité documentaire : % de prestataires ayant soumis tous les documents requis'),
    bullet('Qualité des fiches : détection automatique des problèmes (pas de couverture, pas d\'images, description < 50 caractères, pas de GPS, pas de téléphone)'),
    pageBreak(),
  ]
}

function section13(): Paragraph[] {
  return [
    heading1('13. Contenu Éditorial & Informations'),
    heading2('13.1 Articles / Actualités'),
    bullet('Système complet d\'articles avec éditeur TipTap (rich text)'),
    bullet('Catégories d\'articles (ArticleCategory) avec couleurs'),
    bullet('Statuts : draft, published, scheduled'),
    bullet('Support RSS : import automatique depuis des flux RSS (RSSSource)'),
    bullet('Enrichissement IA : amélioration automatique du contenu'),
    bullet('Layouts multiples, images additionnelles, mise en vedette, breaking news'),
    spacer(),
    heading2('13.2 Événements'),
    bullet('Calendrier d\'événements à Madagascar (festivals, culturels, sportifs, nature, marchés)'),
    bullet('Soumission par les utilisateurs (statut PENDING → validation admin)'),
    bullet('Événements récurrents supportés (recurrenceRule)'),
    bullet('Lien optionnel à un établissement'),
    spacer(),
    heading2('13.3 Pharmacies de Garde'),
    bullet('Base de données des pharmacies par ville'),
    bullet('Indicateur de garde (isOnGuard) avec date de garde'),
    bullet('Horaires d\'ouverture, géolocalisation'),
    spacer(),
    heading2('13.4 Contacts d\'Urgence'),
    bullet('Numéros d\'urgence par type (police, pompiers, SAMU, ambassade, hôpital)'),
    bullet('Par ville, avec indication 24h/7j'),
    spacer(),
    heading2('13.5 Histoire de Madagascar'),
    bullet('Ères historiques (HistoricalEra) avec frise chronologique'),
    bullet('Événements historiques (HistoricalEvent) datés'),
    bullet('Figures historiques (HistoricalFigure)'),
    bullet('"Ce jour dans l\'histoire" — événements par jour/mois'),
    spacer(),
    heading2('13.6 Économie'),
    bullet('Indicateurs économiques (EconomicIndicator) : PIB, inflation, taux, etc.'),
    bullet('Produits d\'exportation (ExportProduct) : vanille, girofle, litchi, etc. avec classement mondial'),
    bullet('Ressources minières (MiningResource) : ilménite, nickel, cobalt, etc.'),
    spacer(),
    heading2('13.7 Découvrir Madagascar'),
    bullet('FamousThing : faune/flore endémique, culture, traditions'),
    bullet('Horoscope du jour'),
    bullet('Recettes malgaches'),
    bullet('Offres d\'emploi (Job)'),
    spacer(),
    heading2('13.8 Météo & Alertes'),
    bullet('Alertes météo par région (WeatherAlert) avec niveaux de gravité'),
    spacer(),
    heading2('13.9 Publicités'),
    bullet('Système publicitaire : bannières par position (top, sidebar)'),
    bullet('Tracking impressions et clics'),
    bullet('Dates de début/fin, priorité'),
    pageBreak(),
  ]
}

function section14(): Paragraph[] {
  return [
    heading1('14. Recherche & Cartes Interactives'),
    heading2('14.1 Recherche Globale'),
    bulletBold('URL', '/search'),
    bullet('Recherche full-text sur les établissements (nom, description, ville)'),
    bullet('Filtres avancés : type, ville, fourchette de prix, note minimum, services'),
    bullet('Chips de filtres actifs avec suppression unitaire'),
    bullet('Pagination des résultats'),
    bullet('Cartes résultats avec photo, note, type, ville, badge vérifié'),
    spacer(),
    heading2('14.2 Carte Interactive'),
    bulletBold('URL', '/bons-plans/carte'),
    bullet('Carte pleine page avec Leaflet + React-Leaflet'),
    bullet('Marqueurs pour chaque établissement géolocalisé'),
    bullet('Clustering automatique (MarkerCluster) pour les zones denses'),
    bullet('Filtres par type d\'établissement'),
    bullet('Popup au clic : photo, nom, type, note, lien vers fiche'),
    spacer(),
    heading2('14.3 Sélecteur de Lieu (MapLocationPicker)'),
    bullet('Utilisé dans le formulaire de création d\'établissement'),
    bullet('Recherche d\'adresse via Nominatim (API OpenStreetMap)'),
    bullet('Recherche en 2 passes : d\'abord avec suffixe "Madagascar" et countrycodes=mg, puis sans'),
    bullet('Bounding box Madagascar pour prioriser les résultats'),
    bullet('Message "Aucun résultat" avec suggestion de cliquer sur la carte'),
    bullet('Clic sur la carte pour placer le marqueur manuellement'),
    spacer(),
    heading2('14.4 Heatmap Admin'),
    bullet('Carte Leaflet avec tuiles sombres (dark theme)'),
    bullet('Cercles proportionnels par ville selon le nombre de vues'),
    bullet('Données via /api/admin/stats/heatmap'),
    pageBreak(),
  ]
}

function section15(): Paragraph[] {
  return [
    heading1('15. SEO, PWA & Performance'),
    heading2('15.1 SEO'),
    bullet('SSR (Server-Side Rendering) via Next.js App Router'),
    bullet('Metadata dynamique par page (metaTitle, metaDescription)'),
    bullet('JSON-LD Schema.org : OrganizationJsonLd, EstablishmentJsonLd, BreadcrumbJsonLd'),
    bullet('Open Graph images générées dynamiquement (/api/og)'),
    bullet('Sitemap automatique (sitemap.ts)'),
    bullet('Robots.txt (robots.ts)'),
    bullet('Slugs SEO-friendly pour toutes les entités'),
    spacer(),
    heading2('15.2 PWA (Progressive Web App)'),
    bullet('manifest.json avec icônes, thème, mode standalone'),
    bullet('Service Worker (sw.js) pour le cache hors ligne'),
    bullet('Page /offline dédiée quand pas de connexion'),
    bullet('Push notifications via Web Push API (VAPID)'),
    bullet('Enregistrement automatique du SW (ServiceWorkerRegister)'),
    spacer(),
    heading2('15.3 Performance'),
    bullet('Dynamic imports pour le code splitting (tous les composants admin)'),
    bullet('Images optimisées avec Next.js Image + Sharp'),
    bullet('Proxy d\'images externes (/api/image-proxy)'),
    bullet('Lazy loading des cartes Leaflet (dynamic, ssr: false)'),
    bullet('React Query pour le cache côté client'),
    bullet('Skeleton loading pour les états de chargement'),
    pageBreak(),
  ]
}

function section16(): Paragraph[] {
  const apiTable = (title: string, rows: string[][]) => [
    heading3(title),
    makeTable(['Méthode', 'URL', 'Description', 'Auth'], rows),
    spacer(),
  ]

  return [
    heading1('16. Catalogue Complet des APIs'),
    para('L\'application expose environ 150 endpoints REST via Next.js API Routes.'),
    spacer(),
    ...apiTable('16.1 Authentification', [
      ['POST', '/api/auth/register', 'Inscription utilisateur', 'Non + CSRF'],
      ['POST', '/api/auth/login', 'Connexion (email/phone + password)', 'Non + CSRF'],
      ['POST', '/api/auth/logout', 'Déconnexion (supprime session)', 'Session'],
      ['GET', '/api/auth/session', 'Vérifier session active', 'Cookie'],
      ['POST', '/api/auth/forgot-password', 'Demande reset password', 'Non'],
      ['POST', '/api/auth/reset-password', 'Reset password avec token', 'Token'],
      ['PUT', '/api/auth/change-password', 'Changer mot de passe', 'Session + CSRF'],
      ['DELETE', '/api/auth/delete-account', 'Supprimer compte', 'Session + CSRF'],
      ['POST/GET', '/api/auth/verify-email', 'Vérification email', 'Token'],
      ['GET', '/api/csrf', 'Obtenir token CSRF', 'Non'],
    ]),
    ...apiTable('16.2 Admin — Authentification', [
      ['POST', '/api/admin/login', 'Login admin', 'Non + CSRF'],
      ['POST', '/api/admin/logout', 'Logout admin', 'Admin'],
      ['GET', '/api/admin/session', 'Session admin', 'Cookie'],
    ]),
    ...apiTable('16.3 Admin — Gestion Contenu', [
      ['GET/PATCH', '/api/admin/establishments', 'Liste/modifier établissements', 'Admin'],
      ['GET/PATCH/DELETE', '/api/admin/establishments/[id]', 'Détail établissement', 'Admin'],
      ['GET/POST', '/api/admin/articles', 'Articles', 'Admin'],
      ['GET/PATCH/DELETE', '/api/admin/articles/[id]', 'Article par ID', 'Admin'],
      ['GET/POST', '/api/admin/events', 'Événements', 'Admin'],
      ['PATCH/DELETE', '/api/admin/events/[id]', 'Événement par ID', 'Admin'],
      ['GET/POST', '/api/admin/ads', 'Publicités', 'Admin'],
      ['GET/POST', '/api/admin/vlogs', 'Vlogs', 'Admin'],
      ['GET/POST', '/api/admin/media', 'Médiathèque', 'Admin'],
    ]),
    ...apiTable('16.4 Admin — Modération', [
      ['GET', '/api/admin/moderation/pipeline', 'Pipeline de modération', 'Admin'],
      ['POST', '/api/admin/moderation/ghost', 'Gestion lieux fantômes', 'Admin'],
      ['GET', '/api/admin/claims', 'Revendications', 'Admin'],
      ['GET', '/api/admin/reviews', 'Avis à modérer', 'Admin'],
      ['GET/PUT', '/api/admin/verification', 'Documents NIF/STAT', 'Admin'],
      ['GET', '/api/admin/compliance', 'Suivi conformité', 'Admin'],
    ]),
    ...apiTable('16.5 Admin — Utilisateurs & Messages', [
      ['GET/PUT', '/api/admin/users', 'Liste/ban/unban users', 'Admin'],
      ['POST', '/api/admin/impersonate', 'Simulation compte', 'Admin'],
      ['GET', '/api/admin/messages', 'Conversations', 'Admin'],
      ['POST', '/api/admin/messages/intervene', 'Intervention God Mode', 'Admin'],
    ]),
    ...apiTable('16.6 Admin — Stats & Outils', [
      ['GET', '/api/admin/stats', 'Statistiques globales', 'Admin'],
      ['GET', '/api/admin/stats/heatmap', 'Heatmap Madagascar', 'Admin'],
      ['GET', '/api/admin/audit', 'Journal d\'audit', 'Admin'],
      ['GET/PUT', '/api/admin/ranking', 'Classement établissements', 'Admin'],
      ['GET', '/api/admin/bookings', 'Réservations', 'Admin'],
      ['POST', '/api/admin/cleanup', 'Nettoyage BDD', 'Admin'],
      ['GET', '/api/admin/export', 'Export CSV', 'Admin'],
    ]),
    ...apiTable('16.7 Admin — Contenu Spécialisé', [
      ['GET/POST', '/api/admin/pharmacies', 'Pharmacies', 'Admin'],
      ['GET/POST', '/api/admin/emergency-contacts', 'Contacts urgence', 'Admin'],
      ['GET/POST', '/api/admin/history', 'Histoire', 'Admin'],
      ['GET/POST', '/api/admin/economy/resources', 'Ressources éco', 'Admin'],
      ['GET/POST', '/api/admin/weather-alerts', 'Alertes météo', 'Admin'],
      ['GET/POST', '/api/admin/jobs', 'Offres emploi', 'Admin'],
    ]),
    ...apiTable('16.8 Annuaire Public (Bons Plans)', [
      ['GET', '/api/bons-plans/hotels', 'Liste hôtels (paginée, filtrée)', 'Non'],
      ['GET', '/api/bons-plans/hotels/[slug]', 'Détail hôtel', 'Non'],
      ['POST', '/api/bons-plans/hotels/submit', 'Soumettre un hôtel', 'Session'],
      ['GET', '/api/bons-plans/restaurants', 'Liste restaurants', 'Non'],
      ['GET', '/api/bons-plans/restaurants/[slug]', 'Détail restaurant', 'Non'],
      ['GET', '/api/bons-plans/attractions', 'Liste attractions', 'Non'],
      ['GET', '/api/bons-plans/attractions/[slug]', 'Détail attraction', 'Non'],
      ['GET', '/api/bons-plans/prestataires', 'Liste prestataires', 'Non'],
      ['GET', '/api/bons-plans/prestataires/[slug]', 'Détail prestataire', 'Non'],
      ['GET', '/api/bons-plans/map', 'Données carte', 'Non'],
      ['POST', '/api/bons-plans/establishments/[id]/claim', 'Revendiquer fiche', 'Session'],
    ]),
    ...apiTable('16.9 Établissements — Détail', [
      ['GET/POST', '/api/establishments/[id]/reviews', 'Avis', 'GET:Non, POST:Session'],
      ['POST', '/api/establishments/[id]/reviews/[rId]/report', 'Signaler avis', 'Session'],
      ['POST', '/api/establishments/[id]/reviews/[rId]/vote', 'Voter avis', 'Session'],
      ['GET/POST', '/api/establishments/[id]/bookings', 'Réservations', 'Session'],
      ['GET', '/api/establishments/[id]/availability', 'Disponibilité', 'Non'],
      ['GET', '/api/establishments/[id]/promotions', 'Promotions', 'Non'],
      ['GET', '/api/establishments/[id]/fomo', 'Données FOMO', 'Non'],
    ]),
    ...apiTable('16.10 Client', [
      ['GET', '/api/client/dashboard', 'Dashboard client', 'Session'],
      ['GET/POST', '/api/client/favorites', 'Favoris', 'Session'],
      ['GET', '/api/client/loyalty', 'Points fidélité', 'Session'],
      ['GET/PATCH', '/api/client/profile', 'Profil', 'Session'],
      ['GET/PATCH', '/api/client/notification-preferences', 'Préf. notifications', 'Session'],
    ]),
    ...apiTable('16.11 Dashboard Pro', [
      ['GET/PATCH', '/api/dashboard/establishment', 'Mon établissement', 'Session'],
      ['GET/POST', '/api/dashboard/reservations', 'Mes réservations', 'Session'],
      ['GET/PATCH', '/api/dashboard/availability', 'Disponibilité', 'Session'],
      ['GET/PATCH', '/api/dashboard/pricing', 'Tarifs', 'Session'],
      ['GET/POST', '/api/dashboard/promotions', 'Promotions', 'Session'],
      ['GET/POST', '/api/dashboard/messages', 'Messages', 'Session'],
      ['GET/POST', '/api/dashboard/reviews', 'Avis', 'Session'],
      ['GET/POST', '/api/dashboard/calendar', 'Calendrier', 'Session'],
      ['GET', '/api/dashboard/stats', 'Statistiques', 'Session'],
      ['GET/POST', '/api/dashboard/verification', 'Documents', 'Session'],
      ['GET/POST', '/api/dashboard/quick-replies', 'Réponses rapides', 'Session'],
    ]),
    ...apiTable('16.12 Infrastructure', [
      ['POST', '/api/upload', 'Upload fichiers', 'Session + CSRF'],
      ['GET', '/api/notifications', 'Notifications', 'Session'],
      ['GET/POST', '/api/messages', 'Messages', 'Session'],
      ['POST', '/api/push/subscribe', 'Abonnement push', 'Session'],
      ['GET', '/api/search', 'Recherche globale', 'Non'],
      ['GET', '/api/events', 'Événements', 'Non'],
      ['GET', '/api/articles', 'Articles', 'Non'],
      ['GET', '/api/exchange-rates', 'Taux de change', 'Non'],
      ['GET', '/api/pharmacies', 'Pharmacies', 'Non'],
      ['GET', '/api/emergency-contacts', 'Urgences', 'Non'],
      ['GET', '/api/health', 'Healthcheck', 'Non'],
    ]),
    pageBreak(),
  ]
}

function section17(): Paragraph[] {
  const models: [string, string, string[]][] = [
    ['User', 'Utilisateur de la plateforme (client ou admin)', [
      'id, email?, phone?, password, role (CLIENT|ADMIN), userType? (HOTEL|RESTAURANT|ATTRACTION|PROVIDER)',
      'firstName, lastName, avatar?, emailVerified, phoneVerified, isActive, isBanned, banReason?',
      'loyaltyPoints, notificationPreferences (JSON), lastLoginAt?, createdAt, updatedAt',
      'Relations: sessions[], notifications[], bookings[], favorites[], messages[], verificationDocuments[], reviews[], presence',
    ]],
    ['Session', 'Session de connexion (user ou admin)', [
      'id, userId (FK→User), token (unique, 64-hex), deviceInfo?, ipAddress?, expiresAt',
      'Admin sessions: deviceInfo="admin-panel", durée 24h. User sessions: 7 jours',
    ]],
    ['Establishment', 'Établissement touristique (hôtel, restaurant, attraction, prestataire)', [
      'id, type (enum), name, slug (unique), description, shortDescription, nameEn, descriptionEn',
      'address, city, district, region, latitude, longitude, phone, phone2, email, website',
      'facebook, instagram, whatsapp, coverImage, images (JSON array)',
      'rating, reviewCount, viewCount, displayOrder (classement manuel), isActive, isFeatured, isPremium',
      'dataSource, sourceUrl, moderationStatus, isClaimed, claimedByUserId, isGhost, createdByUserId',
      'Relations: hotel?, restaurant?, attraction?, provider?, reviews[], bookings[], claims[], events[], promotions[]',
    ]],
    ['Hotel', 'Extension hôtel (1:1 avec Establishment)', [
      'starRating, hotelType, amenities (JSON), checkInTime, checkOutTime, openingHours (JSON)',
      'Relations: roomTypes[]',
    ]],
    ['RoomType', 'Type de chambre d\'un hôtel', [
      'name, description, capacity, pricePerNight, priceWeekend, amenities (JSON), images (JSON), isAvailable',
    ]],
    ['Restaurant', 'Extension restaurant (1:1 avec Establishment)', [
      'category (GARGOTE|RESTAURANT|LOUNGE|CAFE|FAST_FOOD|STREET_FOOD), cuisineTypes (JSON)',
      'priceRange (BUDGET|MODERATE|UPSCALE|LUXURY), menuImages (JSON), menuPdfUrl',
      'hasDelivery, hasTakeaway, hasReservation, hasParking, hasWifi, hasGenerator',
      'specialties (JSON), avgMainCourse, avgBeer',
    ]],
    ['Attraction', 'Extension attraction (1:1 avec Establishment)', [
      'attractionType, isFree, entryFeeForeign, entryFeeLocal, visitDuration',
      'bestTimeToVisit, bestSeason, isAccessible, hasGuide, hasParking, hasRestaurant',
      'highlights (JSON), isAvailable',
    ]],
    ['Provider', 'Extension prestataire (1:1 avec Establishment)', [
      'serviceType (GUIDE|DRIVER|TOUR_OPERATOR|CAR_RENTAL|PHOTOGRAPHER|TRANSLATOR|TRAVEL_AGENCY|TRANSFER|BOAT_EXCURSION|OTHER)',
      'languages (JSON), experience, priceRange, priceFrom, priceTo, priceUnit',
      'operatingZone (JSON), vehicleType, vehicleCapacity, licenseNumber, certifications (JSON)',
    ]],
    ['Booking', 'Réservation', [
      'establishmentId, userId, bookingType, checkIn, checkOut, guestCount, roomTypeId?',
      'specialRequests, guestName, guestEmail, guestPhone, totalPrice, currency (MGA)',
      'status (pending|confirmed|cancelled|completed), reference (unique)',
      'confirmedAt, confirmedBy, cancelledAt, cancelReason',
    ]],
    ['EstablishmentReview', 'Avis sur un établissement', [
      'establishmentId, userId?, authorName?, rating (1-5), title?, comment, images (JSON)',
      'bookingId? (unique — lie avis à réservation), isVerified, isPublished, isFlagged, flagReason',
      'helpfulCount, unhelpfulCount, ownerResponse?, respondedAt?',
    ]],
    ['Message', 'Message entre utilisateurs', [
      'senderId, receiverId, establishmentId?, content, isRead, readAt?, createdAt',
    ]],
    ['Notification', 'Notification in-app', [
      'userId, type (13 types enum), title, message, entityType?, entityId?, isRead, readAt?',
    ]],
    ['VerificationDocument', 'Document de vérification prestataire', [
      'userId, documentType (NIF|STAT|LICENCE|CIN), documentUrl, status (PENDING|VERIFIED|REJECTED)',
      'reviewedAt?, reviewedBy?, note? (commentaire admin)',
    ]],
    ['EstablishmentClaim', 'Revendication de fiche', [
      'establishmentId, claimantName, claimantEmail, claimantPhone, claimantRole',
      'proofDescription, proofDocuments (JSON), status (PENDING|APPROVED|REJECTED)',
      'reviewedAt, reviewedBy, rejectionReason',
    ]],
    ['Event', 'Événement', [
      'title, slug, description, startDate, endDate, location, city, region',
      'category (FESTIVAL|CULTURAL|SPORT|NATURE|MARKET|OTHER), coverImage, organizer',
      'isRecurring, recurrenceRule, status (PENDING|APPROVED|REJECTED)',
    ]],
    ['Article', 'Article / Actualité', [
      'title, slug, summary, content, imageUrl, additionalImages (JSON)',
      'sourceName, sourceUrl, isFromRSS, isAiEnhanced, status, isFeatured, isBreaking',
      'layoutFormat, scheduledAt, publishedAt, categoryId',
    ]],
    ['AuditLog', 'Journal d\'audit des actions admin', [
      'userId, action, entityType, entityId, details (JSON), ipAddress, userAgent, createdAt',
    ]],
    ['Promotion', 'Promotion sur un établissement', [
      'establishmentId, title, description, discountPercent, startDate, endDate, isActive',
    ]],
    ['ExchangeRate', 'Taux de change', ['baseCurrency, targetCurrency, rate, source, fetchedAt']],
    ['Pharmacy', 'Pharmacie', ['name, city, district, address, phone, isOnGuard, guardDate, openingHours']],
    ['EmergencyContact', 'Contact d\'urgence', ['name, phone, type, city, address, is24h']],
    ['Job', 'Offre d\'emploi', ['title, company, companyLogo, description, location, salary, type, url']],
    ['City', 'Ville de Madagascar', ['name, slug, region, description, hotelCount, restaurantCount, attractionCount, providerCount']],
  ]

  return [
    heading1('17. Schéma Base de Données'),
    para('La base de données PostgreSQL (Neon) contient 40 modèles Prisma et 13 enums. Voici les principaux modèles :'),
    spacer(),
    ...models.flatMap(([name, desc, fields]) => [
      heading3(name),
      para(desc, { italic: true, color: GRAY }),
      ...fields.map(f => bullet(f)),
      spacer(),
    ]),
    pageBreak(),
  ]
}

function section18(): Paragraph[] {
  return [
    heading1('18. Sécurité & Protection des Données'),
    heading2('18.1 Authentification'),
    bullet('Système custom (pas NextAuth) basé sur cookies HttpOnly'),
    bullet('Mots de passe hashés avec bcrypt (12 rounds de salage)'),
    bullet('Sessions stockées en base (modèle Session) avec token unique 64 caractères hex'),
    bullet('Durée session : 7 jours (user), 24h (admin)'),
    bullet('Rotation de session à la connexion (suppression des anciennes sessions du même device)'),
    bullet('Validation de force du mot de passe : minimum 8 caractères, majuscule, minuscule, chiffre'),
    spacer(),
    heading2('18.2 CSRF (Cross-Site Request Forgery)'),
    bullet('Tokens CSRF stateless signés avec HMAC-SHA256'),
    bullet('Format : <timestamp_base36>.<random_16hex>.<signature_16char>'),
    bullet('Expiration : 1 heure'),
    bullet('Refresh automatique côté client toutes les 45 minutes (hook useCsrf)'),
    bullet('Requis sur : login, register, change-password, delete-account, upload'),
    spacer(),
    heading2('18.3 Rate Limiting'),
    makeTable(
      ['Bucket', 'Fenêtre', 'Max Requêtes', 'Usage'],
      [
        ['auth', '15 min', '10', 'Login, register, forgot-password'],
        ['api', '1 min', '100', 'APIs générales'],
        ['read', '1 min', '200', 'Lectures'],
        ['write', '1 min', '30', 'Écritures'],
        ['public', '1 min', '300', 'APIs publiques'],
        ['cron', '1 min', '10', 'Jobs cron'],
      ]
    ),
    spacer(),
    heading2('18.4 Headers de Sécurité'),
    bullet('X-Content-Type-Options: nosniff'),
    bullet('X-Frame-Options: DENY'),
    bullet('Content-Security-Policy: strict (script-src self, style-src self unsafe-inline)'),
    bullet('Strict-Transport-Security: max-age=31536000; includeSubDomains'),
    bullet('Cross-Origin-Opener-Policy: same-origin'),
    bullet('Cross-Origin-Resource-Policy: same-origin'),
    spacer(),
    heading2('18.5 Audit & Traçabilité'),
    bullet('Toutes les actions administratives sont enregistrées dans AuditLog'),
    bullet('Champs tracés : userId, action, entityType, entityId, details (JSON), IP, user-agent'),
    bullet('Actions tracées : login, ban/unban, approve/reject, intervention message, simulation, cleanup, import'),
    bullet('Consultable via l\'onglet "Audit" du Centre de Contrôle Admin'),
    spacer(),
    heading2('18.6 Protection des Données'),
    bullet('Cookies HttpOnly (non accessibles en JavaScript)'),
    bullet('Cookies Secure en production (HTTPS uniquement)'),
    bullet('SameSite=Lax pour la protection CSRF native'),
    bullet('Suppression en cascade (onDelete: Cascade) pour les données utilisateur'),
    bullet('Possibilité de suppression de compte avec confirmation par mot de passe'),
    bullet('Page politique de confidentialité (/politique-confidentialite)'),
    spacer(), spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 28, color: ORANGE, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: 'FIN DU DOCUMENT', size: 24, bold: true, color: DARK, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: `MadaSpot — Cahier de Charge Fonctionnel — ${new Date().toLocaleDateString('fr-FR')}`, size: 18, color: GRAY, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 28, color: ORANGE, font: 'Calibri' })],
    }),
  ]
}

// ─── GÉNÉRATION DU DOCUMENT ───
async function main() {
  console.log('Génération du Cahier de Charge MadaSpot...')

  const doc = new Document({
    creator: 'MadaSpot',
    title: 'MadaSpot — Cahier de Charge Fonctionnel',
    description: 'Document décrivant l\'intégralité des fonctionnalités de la plateforme MadaSpot',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20 },
        },
      },
    },
    numbering: {
      config: [{
        reference: 'default-bullet',
        levels: [
          { level: 0, format: NumberFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } } },
          { level: 1, format: NumberFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.25) } } } },
        ],
      }],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.2),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'MadaSpot — Cahier de Charge Fonctionnel', size: 16, color: GRAY, font: 'Calibri', italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 16, color: GRAY, font: 'Calibri' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY, font: 'Calibri' }),
              new TextRun({ text: ' / ', size: 16, color: GRAY, font: 'Calibri' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GRAY, font: 'Calibri' }),
            ],
          })],
        }),
      },
      children: [
        ...sectionCoverPage(),
        ...sectionSommaire(),
        ...section1(),
        ...section2(),
        ...section3(),
        ...section4(),
        ...section5(),
        ...section6(),
        ...section7(),
        ...section8(),
        ...section9(),
        ...section10(),
        ...section11(),
        ...section12(),
        ...section13(),
        ...section14(),
        ...section15(),
        ...section16(),
        ...section17(),
        ...section18(),
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  const outputPath = 'MadaSpot_Cahier_de_Charge.docx'
  fs.writeFileSync(outputPath, buffer)
  console.log(`✓ Document généré : ${outputPath}`)
  console.log(`  Taille : ${(buffer.length / 1024).toFixed(1)} Ko`)
}

main().catch(console.error)
