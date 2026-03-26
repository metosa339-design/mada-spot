# MadaSpot — Architecture Complète

## 1. Vue d'ensemble du Système

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MADA SPOT — ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Visiteur    │    │   Client     │    │  Prestataire │    │    Admin     │       │
│  │  (Public)    │    │  (Voyageur)  │    │  (Pro)       │    │  (Contrôle) │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                   │               │
│         ▼                   ▼                   ▼                   ▼               │
│  ┌──────────────────────────────────────────────────────────────────────────┐       │
│  │                        NEXT.JS 16 (App Router)                          │       │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐    │       │
│  │  │  Pages    │  │    API    │  │Middleware  │  │   Static Assets   │    │       │
│  │  │  (SSR)    │  │  Routes   │  │  (Auth)   │  │  (PWA/SW/Icons)   │    │       │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └───────────────────┘    │       │
│  │        │               │              │                                  │       │
│  │        ▼               ▼              ▼                                  │       │
│  │  ┌──────────────────────────────────────────────────────────┐           │       │
│  │  │                    SERVICES INTERNES                      │           │       │
│  │  │  ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────────┐  │           │       │
│  │  │  │  Auth  │ │ CSRF │ │Audit │ │Cache │ │ Rate Limit │  │           │       │
│  │  │  └────────┘ └──────┘ └──────┘ └──────┘ └────────────┘  │           │       │
│  │  └──────────────────────────┬───────────────────────────────┘           │       │
│  └─────────────────────────────┼────────────────────────────────────────────┘       │
│                                │                                                    │
│                                ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────┐       │
│  │                     PRISMA ORM (5.22)                                    │       │
│  │              40 Modèles — 13 Enums — Relations FK                        │       │
│  └──────────────────────────────┬───────────────────────────────────────────┘       │
│                                │                                                    │
│                                ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────┐       │
│  │                  PostgreSQL (Neon Cloud)                                  │       │
│  └──────────────────────────────────────────────────────────────────────────┘       │
│                                                                                     │
│  ┌─────────────┐  ┌────────────────┐  ┌─────────────┐  ┌──────────────────┐       │
│  │  Nominatim  │  │  Leaflet Maps  │  │  Web Push   │  │  Sharp (Images)  │       │
│  │ (Geocoding) │  │ (Carte interac)│  │ (Notif Push)│  │  (Traitement)    │       │
│  └─────────────┘  └────────────────┘  └─────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture des Pages (Routes)

```
src/app/
│
├── page.tsx ─────────────────────────── / (Homepage)
├── layout.tsx ───────────────────────── Layout racine (Header, Footer, Providers)
│
├── (auth)/ ──────────────────────────── Route Group: Authentification
│   ├── login/page.tsx ──────────────── /login
│   ├── register-client/page.tsx ────── /register-client
│   ├── forgot-password/page.tsx ────── /forgot-password
│   └── reset-password/page.tsx ─────── /reset-password
│
├── register/page.tsx ────────────────── /register (inscription prestataire)
│
├── admin/ ───────────────────────────── Zone Admin
│   ├── login/page.tsx ──────────────── /admin/login
│   ├── page.tsx ────────────────────── /admin (Control Center — 20 tabs SPA)
│   ├── dashboard/page.tsx ──────────── /admin/dashboard
│   └── automation/page.tsx ─────────── /admin/automation
│
├── client/ ──────────────────────────── Dashboard Client (Voyageur)
│   ├── page.tsx ────────────────────── /client
│   ├── bookings/page.tsx ───────────── /client/bookings
│   ├── bookings/[id]/review/page.tsx── /client/bookings/:id/review
│   ├── favorites/page.tsx ──────────── /client/favorites
│   ├── fidelite/page.tsx ───────────── /client/fidelite (points loyauté)
│   ├── messagerie/page.tsx ─────────── /client/messagerie
│   ├── publications/page.tsx ───────── /client/publications
│   └── settings/page.tsx ───────────── /client/settings
│
├── dashboard/ ───────────────────────── Dashboard Prestataire (Pro)
│   ├── page.tsx ────────────────────── /dashboard
│   ├── etablissement/page.tsx ──────── /dashboard/etablissement
│   ├── reservations/page.tsx ───────── /dashboard/reservations
│   ├── calendrier/page.tsx ─────────── /dashboard/calendrier
│   ├── messagerie/page.tsx ─────────── /dashboard/messagerie
│   ├── avis/page.tsx ───────────────── /dashboard/avis
│   ├── tarifs/page.tsx ─────────────── /dashboard/tarifs
│   ├── promotions/page.tsx ─────────── /dashboard/promotions
│   ├── statistiques/page.tsx ───────── /dashboard/statistiques
│   ├── parametres/page.tsx ─────────── /dashboard/parametres
│   └── verification/page.tsx ───────── /dashboard/verification (NIF/STAT)
│
├── bons-plans/ ──────────────────────── Annuaire Public
│   ├── page.tsx ────────────────────── /bons-plans
│   ├── hotels/page.tsx ─────────────── /bons-plans/hotels
│   ├── hotels/[slug]/page.tsx ──────── /bons-plans/hotels/:slug
│   ├── restaurants/page.tsx ────────── /bons-plans/restaurants
│   ├── restaurants/[slug]/page.tsx ─── /bons-plans/restaurants/:slug
│   ├── attractions/page.tsx ────────── /bons-plans/attractions
│   ├── attractions/[slug]/page.tsx ─── /bons-plans/attractions/:slug
│   ├── prestataires/page.tsx ───────── /bons-plans/prestataires
│   ├── prestataires/[slug]/page.tsx ── /bons-plans/prestataires/:slug
│   ├── carte/page.tsx ──────────────── /bons-plans/carte (carte interactive)
│   ├── guide-culinaire/page.tsx ────── /bons-plans/guide-culinaire
│   ├── offres/page.tsx ─────────────── /bons-plans/offres (promotions)
│   ├── avis/[estId]/page.tsx ───────── /bons-plans/avis/:estId
│   └── lieu/[slug]/page.tsx ────────── /bons-plans/lieu/:slug
│
├── evenements/ ──────────────────────── Événements
│   ├── page.tsx ────────────────────── /evenements
│   ├── [slug]/page.tsx ─────────────── /evenements/:slug
│   └── soumettre/page.tsx ──────────── /evenements/soumettre
│
├── search/page.tsx ──────────────────── /search (recherche globale)
├── pharmacies/page.tsx ──────────────── /pharmacies
├── urgences/page.tsx ────────────────── /urgences (contacts urgence)
│
├── publier-lieu/page.tsx ────────────── /publier-lieu (contribuer lieu)
├── publier-avis/page.tsx ────────────── /publier-avis
│
├── a-propos/page.tsx ────────────────── /a-propos
├── contact/page.tsx ─────────────────── /contact
├── aide/page.tsx ────────────────────── /aide
├── faq/page.tsx ─────────────────────── /faq
├── comment-ca-marche/page.tsx ───────── /comment-ca-marche
├── cgu/page.tsx ─────────────────────── /cgu
├── mentions-legales/page.tsx ────────── /mentions-legales
├── politique-confidentialite/page.tsx── /politique-confidentialite
└── offline/page.tsx ─────────────────── /offline (PWA hors ligne)
```

---

## 3. Architecture des APIs

```
src/app/api/
│
├── ═══════════════════════ AUTHENTIFICATION ═══════════════════════
│
├── auth/
│   ├── login/route.ts ──────────── POST   Connexion (email/phone + password)
│   ├── register/route.ts ───────── POST   Inscription
│   ├── logout/route.ts ─────────── POST   Déconnexion
│   ├── session/route.ts ────────── GET    Vérifier session
│   ├── forgot-password/route.ts ── POST   Demande reset password
│   ├── reset-password/route.ts ─── POST   Reset password avec token
│   ├── change-password/route.ts ── PUT    Changer mot de passe
│   ├── delete-account/route.ts ─── DELETE Supprimer compte
│   └── verify-email/route.ts ──── GET/POST Vérification email
│
├── csrf/route.ts ────────────────── GET    Obtenir token CSRF
│
├── ═══════════════════════ ADMIN (50+ routes) ═══════════════════════
│
├── admin/
│   ├── login/route.ts ──────────── POST   Login admin
│   ├── logout/route.ts ─────────── POST   Logout admin
│   ├── session/route.ts ────────── GET    Session admin
│   │
│   ├── ─── Gestion Contenu ───
│   ├── establishments/route.ts ─── GET/PATCH  Liste/modifier établissements
│   ├── establishments/[id]/route── GET/PATCH/DELETE  Détail établissement
│   ├── articles/route.ts ──────── GET/POST   Articles
│   ├── articles/[id]/route.ts ─── GET/PATCH/DELETE  Article par ID
│   ├── events/route.ts ────────── GET/POST   Événements
│   ├── events/[id]/route.ts ──── PATCH/DELETE  Événement par ID
│   ├── ads/route.ts ───────────── GET/POST   Publicités
│   ├── ads/[id]/route.ts ──────── GET/PATCH/DELETE  Pub par ID
│   ├── vlogs/route.ts ─────────── GET/POST   Vlogs
│   ├── media/route.ts ─────────── GET/POST   Médiathèque
│   ├── media/[id]/route.ts ────── DELETE  Supprimer média
│   │
│   ├── ─── Modération ───
│   ├── moderation/pipeline/route── GET    Pipeline de modération
│   ├── moderation/ghost/route.ts── POST   Gestion lieux fantômes
│   ├── claims/route.ts ────────── GET    Revendications
│   ├── reviews/route.ts ───────── GET    Avis à modérer
│   ├── verification/route.ts ──── GET/PUT  Documents NIF/STAT
│   ├── compliance/route.ts ────── GET    Suivi conformité
│   │
│   ├── ─── Utilisateurs ───
│   ├── users/route.ts ─────────── GET/PUT  Liste/ban/unban users
│   ├── impersonate/route.ts ───── POST   Simulation compte
│   │
│   ├── ─── Messagerie ───
│   ├── messages/route.ts ──────── GET    Conversations
│   ├── messages/intervene/route── POST   Intervention God Mode
│   │
│   ├── ─── Stats & Outils ───
│   ├── stats/route.ts ─────────── GET    Statistiques globales
│   ├── stats/heatmap/route.ts ─── GET    Heatmap Madagascar
│   ├── audit/route.ts ─────────── GET    Journal d'audit
│   ├── ranking/route.ts ───────── GET/PUT  Classement établissements
│   ├── bookings/route.ts ──────── GET    Réservations
│   ├── categories/route.ts ────── GET    Catégories
│   ├── cleanup/route.ts ───────── POST   Nettoyage BDD
│   ├── export/route.ts ────────── GET    Export CSV
│   │
│   ├── ─── Import & Seeds ───
│   ├── import/establishments/route GET/POST Import CSV
│   ├── import/template/route.ts ── GET    Template CSV
│   ├── import/batches/route.ts ─── GET    Historique imports
│   ├── seed*/route.ts ─────────── POST   Seeds données (×9)
│   │
│   ├── ─── Contenu Spécialisé ───
│   ├── pharmacies/route.ts ────── GET/POST   Pharmacies
│   ├── pharmacies/[id]/route.ts ── PATCH/DELETE
│   ├── emergency-contacts/route── GET/POST   Contacts urgence
│   ├── emergency-contacts/[id]─── PATCH/DELETE
│   ├── history/route.ts ───────── GET/POST   Histoire
│   ├── history/[id]/route.ts ──── PATCH/DELETE
│   ├── economy/resources/route ── GET/POST   Ressources éco
│   ├── economy/resources/[id] ─── PATCH/DELETE
│   ├── weather-alerts/route.ts ── GET/POST   Alertes météo
│   ├── weather-alerts/[id]────── PATCH/DELETE
│   ├── jobs/route.ts ──────────── GET/POST   Offres emploi
│   ├── jobs/[id]/route.ts ─────── GET/PATCH/DELETE
│   │
│   ├── ─── Images ───
│   ├── attraction-images/route ── GET/POST   Images attractions
│   ├── fix-images/route.ts ────── POST   Fix URLs images
│   ├── fix-images-v2/route.ts ─── POST   Fix v2
│   └── sync-assets/route.ts ──── POST   Sync assets
│
├── ══════════════════════ PUBLIC / CLIENT ═══════════════════════
│
├── bons-plans/
│   ├── establishments/route.ts ── GET    Liste tous établissements
│   ├── establishments/[id]/claim─ POST   Revendiquer fiche
│   ├── hotels/route.ts ──────── GET    Liste hôtels
│   ├── hotels/[slug]/route.ts ── GET    Détail hôtel
│   ├── hotels/submit/route.ts ── POST   Soumettre hôtel
│   ├── restaurants/route.ts ──── GET    Liste restaurants
│   ├── restaurants/[slug]/route── GET    Détail restaurant
│   ├── restaurants/submit/route── POST   Soumettre restaurant
│   ├── attractions/route.ts ──── GET    Liste attractions
│   ├── attractions/[slug]/route── GET    Détail attraction
│   ├── attractions/submit/route── POST   Soumettre attraction
│   ├── prestataires/route.ts ─── GET    Liste prestataires
│   ├── prestataires/[slug]/route─ GET    Détail prestataire
│   ├── prestataires/submit/route─ POST   Soumettre prestataire
│   └── map/route.ts ──────────── GET    Données carte
│
├── establishments/
│   ├── [id]/reviews/route.ts ──── GET/POST  Avis par établissement
│   ├── [id]/reviews/[rId]/route── GET/PATCH Détail avis
│   ├── [id]/reviews/[rId]/report─ POST   Signaler avis
│   ├── [id]/reviews/[rId]/vote── POST   Voter avis (utile/inutile)
│   ├── [id]/bookings/route.ts ── GET/POST  Réservations
│   ├── [id]/availability/route ── GET    Disponibilité calendrier
│   ├── [id]/promotions/route.ts── GET    Promotions actives
│   ├── [id]/fomo/route.ts ────── GET    Données FOMO
│   ├── [id]/manage/route.ts ──── PATCH  Gérer (propriétaire)
│   ├── favorites/route.ts ────── GET    Mes favoris
│   ├── ghost/route.ts ────────── GET    Lieux fantômes
│   └── my/route.ts ───────────── GET    Mon établissement
│
├── bookings/
│   ├── route.ts ──────────────── GET/POST  Réservations
│   ├── [id]/route.ts ─────────── GET/PATCH Détail réservation
│   ├── [id]/review/route.ts ──── POST   Laisser avis post-séjour
│   └── reviewable/route.ts ───── GET    Réservations à noter
│
├── client/
│   ├── dashboard/route.ts ────── GET    Dashboard client
│   ├── favorites/route.ts ────── GET/POST Favoris
│   ├── loyalty/route.ts ──────── GET    Points fidélité
│   ├── notification-preferences── GET/PATCH Préf. notifications
│   ├── profile/route.ts ──────── GET/PATCH Profil
│   └── publications/route.ts ─── GET    Mes publications
│
├── dashboard/ (Pro)
│   ├── establishment/route.ts ─── GET/PATCH Mon établissement
│   ├── stats/route.ts ────────── GET    Mes stats
│   ├── stats/analytics/route.ts── GET    Analytics détaillées
│   ├── messages/route.ts ──────── GET/POST Messages
│   ├── reservations/route.ts ──── GET/POST Réservations
│   ├── availability/route.ts ──── GET/PATCH Disponibilité
│   ├── pricing/route.ts ──────── GET/PATCH Tarifs
│   ├── promotions/route.ts ────── GET/POST Promotions
│   ├── calendar/route.ts ──────── GET/POST Calendrier
│   ├── reviews/route.ts ──────── GET/POST Avis
│   ├── quick-replies/route.ts ─── GET/POST Réponses rapides
│   ├── badges/route.ts ────────── GET    Badges
│   └── verification/route.ts ──── GET/POST Documents vérification
│
├── ══════════════════════ SERVICES PUBLICS ═══════════════════════
│
├── search/route.ts ────────────── GET    Recherche globale
├── events/route.ts ────────────── GET    Événements
├── events/[slug]/route.ts ─────── GET    Détail événement
├── articles/route.ts ──────────── GET    Articles/Actualités
├── trending/route.ts ──────────── GET    Tendances
├── promotions/route.ts ────────── GET    Promotions publiques
├── pharmacies/route.ts ────────── GET    Pharmacies de garde
├── emergency-contacts/route.ts ── GET    Contacts urgence
├── jobs/route.ts ──────────────── GET    Offres emploi
├── exchange-rates/route.ts ────── GET    Taux de change
├── discover/famous/route.ts ──── GET    Découvrir Madagascar
├── history/timeline/route.ts ──── GET    Frise chronologique
├── history/events/route.ts ────── GET    Événements historiques
├── history/leaders/route.ts ───── GET    Figures historiques
├── history/today/route.ts ─────── GET    Ce jour dans l'histoire
├── economy/indicators/route.ts ── GET    Indicateurs économiques
├── economy/resources/route.ts ─── GET    Ressources minières
├── economy/exports/route.ts ──── GET    Produits d'export
├── weather/alerts/route.ts ────── GET    Alertes météo
├── ads/route.ts ───────────────── GET    Publicités
├── ads/click/route.ts ─────────── POST   Clic pub
│
├── ═══════════════════════ INFRASTRUCTURE ═══════════════════════
│
├── upload/route.ts ────────────── POST   Upload fichiers
├── transform-image/route.ts ──── POST   Transformation images (Sharp)
├── image-proxy/route.ts ───────── GET    Proxy images externes
├── og/route.tsx ───────────────── GET    Open Graph images
├── notifications/route.ts ─────── GET/PATCH Notifications
├── messages/route.ts ──────────── GET/POST Messages
├── messages/presence/route.ts ─── POST   Présence en ligne
├── messages/typing/route.ts ──── POST   Indicateur frappe
├── push/subscribe/route.ts ────── POST   Abonnement push
├── push/vapid-key/route.ts ────── GET    Clé VAPID
├── newsletter/route.ts ────────── POST   Inscription newsletter
├── contact/route.ts ───────────── POST   Formulaire contact
├── email/send/route.ts ────────── POST   Envoi email
├── health/route.ts ────────────── GET    Healthcheck
│
├── ═══════════════════════ CRON JOBS ═══════════════════════
│
└── cron/
    ├── publish/route.ts ───────── POST   Publier articles programmés
    ├── enhance-articles/route.ts── POST   Enrichir articles IA
    ├── fix-images/route.ts ────── POST   Corriger images cassées
    ├── regenerate-images/route.ts─ POST   Régénérer images
    ├── sync-rss/route.ts ──────── POST   Sync flux RSS
    ├── scheduler/route.ts ─────── POST   Planificateur tâches
    └── status/route.ts ────────── GET    Statut des jobs
```

---

## 4. Flux d'Authentification

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FLUX AUTHENTIFICATION                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐                                                           │
│  │ Visiteur │                                                           │
│  └────┬─────┘                                                           │
│       │                                                                  │
│       ▼                                                                  │
│  GET /api/csrf ──────────► Token HMAC-SHA256 (1h expiry)                │
│       │                    Format: <timestamp>.<random>.<signature>      │
│       │                                                                  │
│       ├──── INSCRIPTION ────────────────────────────────────────────┐   │
│       │                                                              │   │
│       │  POST /api/auth/register                                     │   │
│       │  Body: { email?, phone?, password, firstName,                │   │
│       │         lastName, userType?, csrfToken }                     │   │
│       │         │                                                    │   │
│       │         ▼                                                    │   │
│       │  ┌─────────────────┐                                        │   │
│       │  │ Rate Limit 10/15m│                                        │   │
│       │  │ CSRF Verify     │                                        │   │
│       │  │ Zod Validate    │                                        │   │
│       │  │ Duplicate Check │                                        │   │
│       │  │ bcrypt(12 rounds)│                                        │   │
│       │  └────────┬────────┘                                        │   │
│       │           ▼                                                  │   │
│       │  Prisma Transaction:                                         │   │
│       │    1. CREATE User                                            │   │
│       │    2. CREATE ClientProfile (si CLIENT)                       │   │
│       │    3. CREATE Session (token 64-hex, 7 jours)                 │   │
│       │           │                                                  │   │
│       │           ▼                                                  │   │
│       │  Set-Cookie: mada-spot-session=<token>                       │   │
│       │  HttpOnly | Secure | SameSite=Lax | MaxAge=7d               │   │
│       │                                                              │   │
│       ├──── CONNEXION ──────────────────────────────────────────────┘   │
│       │                                                                  │
│       │  POST /api/auth/login                                           │
│       │  Body: { identifier (email|phone), password, csrfToken }        │
│       │         │                                                        │
│       │         ▼                                                        │
│       │  Rate Limit → CSRF → Zod → DB lookup → bcrypt verify            │
│       │  → Check isActive/isBanned → Session rotation (même device)      │
│       │  → CREATE Session → Set-Cookie                                   │
│       │                                                                  │
│       ├──── CONNEXION ADMIN ────────────────────────────────────────┐   │
│       │                                                              │   │
│       │  POST /api/admin/login                                       │   │
│       │  Body: { username (email|phone), password, csrfToken }       │   │
│       │         │                                                    │   │
│       │         ▼                                                    │   │
│       │  Rate Limit → CSRF → Zod → validateCredentials()             │   │
│       │  (role=ADMIN requis) → DELETE old admin sessions              │   │
│       │  → CREATE Session (24h, deviceInfo='admin-panel')             │   │
│       │  → Audit Log → Set-Cookie: mada-spot-admin-session            │   │
│       │                                                              │   │
│       └──────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                     MIDDLEWARE (middleware.ts)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Chaque requête HTTP :                                                  │
│                                                                         │
│  /admin/* (sauf /admin/login)                                           │
│    └─► Cookie "mada-spot-admin-session" requis                          │
│        └─► Absent ? → Redirect /admin/login?redirect=<path>            │
│                                                                         │
│  /client | /dashboard | /establishment                                  │
│    └─► Cookie "mada-spot-session" requis                                │
│        └─► Absent ? → Redirect /login?redirect=<path>                  │
│                                                                         │
│  /login | /register | /register-client | /forgot-password               │
│    └─► Cookie "mada-spot-session" présent ?                             │
│        └─► Oui → Redirect /client (déjà connecté)                      │
│                                                                         │
│  Headers sécurité sur toutes les réponses :                             │
│    X-Content-Type-Options: nosniff                                      │
│    X-Frame-Options: DENY                                                │
│    Content-Security-Policy: strict                                      │
│    Strict-Transport-Security: max-age=31536000                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Schéma Base de Données (Relations)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCHÉMA BASE DE DONNÉES — 40 MODÈLES                  │
├─────────────────────────────────────────────────────────────────────────┤

                         ┌──────────────┐
                         │     User     │
                         │──────────────│
                         │ id (PK)      │
                         │ email?       │
                         │ phone?       │
                         │ password     │
                         │ role (enum)  │   CLIENT | ADMIN
                         │ userType?    │   HOTEL | RESTAURANT | ATTRACTION | PROVIDER
                         │ firstName    │
                         │ lastName     │
                         │ avatar?      │
                         │ isActive     │
                         │ isBanned     │
                         │ loyaltyPoints│
                         └──────┬───────┘
                                │
          ┌─────────┬───────────┼────────────┬──────────────┬──────────┐
          │         │           │            │              │          │
          ▼         ▼           ▼            ▼              ▼          ▼
   ┌──────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐
   │ Session  │ │Notific.│ │ Booking │ │ Message  │ │Verif.Doc │ │ClientProf.│
   │──────────│ │────────│ │─────────│ │──────────│ │──────────│ │───────────│
   │ token    │ │ type   │ │ checkIn │ │ content  │ │ docType  │ │ city      │
   │ expires  │ │ title  │ │ checkOut│ │ sender   │ │ docUrl   │ │ address   │
   │ device   │ │ isRead │ │ status  │ │ receiver │ │ status   │ │ nif/stat  │
   └──────────┘ └────────┘ │ total$  │ │ estab.?  │ │ reviewed │ └───────────┘
                           │ ref     │ │ isRead   │ │ note     │
                           └────┬────┘ └──────────┘ └──────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │  Establ.     │
                        │  Review      │
                        │──────────────│
                        │ rating       │
                        │ comment      │
                        │ images       │
                        │ isVerified   │
                        │ ownerResp.   │
                        └──────────────┘


                    ┌───────────────────────┐
                    │    Establishment      │
                    │───────────────────────│
                    │ id (PK)               │
                    │ type (enum)           │  HOTEL | RESTAURANT | ATTRACTION | PROVIDER
                    │ name / slug           │
                    │ description           │
                    │ city / region         │
                    │ lat / lng             │
                    │ phone / email         │
                    │ coverImage / images   │
                    │ rating / reviewCount  │
                    │ viewCount             │
                    │ displayOrder          │  ← Classement manuel
                    │ isFeatured / isPremium│
                    │ isActive / isClaimed  │
                    │ isGhost               │
                    │ moderationStatus      │
                    │ dataSource            │
                    └───────────┬───────────┘
                                │
          ┌─────────┬───────────┼───────────┬──────────────┐
          │         │           │           │              │
          ▼         ▼           ▼           ▼              ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
   │  Hotel   │ │Restaurant│ │Attraction│ │ Provider │ │ (Relations)  │
   │──────────│ │──────────│ │──────────│ │──────────│ │──────────────│
   │ starRat. │ │ category │ │ type     │ │ service  │ │ Reviews[]    │
   │ amenities│ │ cuisine  │ │ isFree   │ │ languages│ │ Bookings[]   │
   │ checkIn  │ │ priceRang│ │ entryFee │ │ priceRang│ │ Claims[]     │
   │ checkOut │ │ menuImg  │ │ duration │ │ priceFrom│ │ Favorites[]  │
   │ hours    │ │ delivery │ │ bestTime │ │ vehicleT.│ │ Messages[]   │
   │          │ │ takeaway │ │ guide    │ │ certifs  │ │ Views[]      │
   │ roomTypes│ │ special. │ │ highligh.│ │ zone     │ │ Events[]     │
   │    │     │ └──────────┘ └──────────┘ └──────────┘ │ Promotions[] │
   │    ▼     │                                         │ Seasonal$[]  │
   │ RoomType │                                         │ Availab.[]   │
   │ name     │                                         └──────────────┘
   │ capacity │
   │ price    │
   └──────────┘


    ═══════════════════ MODÈLES INDÉPENDANTS ═══════════════════

    ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────┐
    │  Article   │  │   Event    │  │  Pharmacy    │  │ Emergency  │
    │────────────│  │────────────│  │──────────────│  │ Contact    │
    │ title/slug │  │ title/slug │  │ name         │  │────────────│
    │ content    │  │ startDate  │  │ city         │  │ name       │
    │ category   │  │ endDate    │  │ isOnGuard    │  │ phone      │
    │ status     │  │ city       │  │ guardDate    │  │ type       │
    │ isFromRSS  │  │ category   │  └──────────────┘  │ is24h      │
    │ isFeatured │  │ status     │                     └────────────┘
    │ publishedAt│  │ organizer  │
    └────────────┘  └────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │HistoricalEra │  │HistoricalEvt │  │HistoricalFig │
    │──────────────│  │──────────────│  │──────────────│
    │ name/slug    │  │ title        │  │ name         │
    │ startYear    │  │ year         │  │ title        │
    │ endYear      │  │ month/day    │  │ birthYear    │
    │ events[]     │  │ era (FK)     │  │ deathYear    │
    │ figures[]    │  └──────────────┘  │ era (FK)     │
    └──────────────┘                    └──────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  EcoIndicator│  │ExportProduct │  │MiningResource│
    │──────────────│  │──────────────│  │──────────────│
    │ name/type    │  │ name/category│  │ name/type    │
    │ value        │  │ annualValue  │  │ region       │
    │ unit         │  │ worldRanking │  │ worldRank    │
    └──────────────┘  └──────────────┘  └──────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Advertisement│  │WeatherAlert  │  │    Job       │
    │──────────────│  │──────────────│  │──────────────│
    │ position     │  │ type/level   │  │ title        │
    │ imageUrl     │  │ regions      │  │ company      │
    │ impressions  │  │ startDate    │  │ salary       │
    │ clicks       │  │ isActive     │  │ location     │
    └──────────────┘  └──────────────┘  └──────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  FamousThing │  │  AuditLog    │  │  Setting     │
    │──────────────│  │──────────────│  │──────────────│
    │ name/slug    │  │ userId       │  │ key (unique) │
    │ category     │  │ action       │  │ value        │
    │ endemic      │  │ entityType   │  │ type         │
    │ isFeatured   │  │ entityId     │  └──────────────┘
    └──────────────┘  │ details      │
                      └──────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  ImportBatch │  │  RSSSource   │  │ScheduledTask │
    │──────────────│  │──────────────│  │──────────────│
    │ source       │  │ name/url     │  │ type         │
    │ totalRecords │  │ autoPublish  │  │ status       │
    │ successCount │  │ lastFetched  │  │ duration     │
    │ status       │  │ articleCount │  │ error        │
    └──────────────┘  └──────────────┘  └──────────────┘

    ┌──────────────────┐  ┌──────────────┐  ┌────────────────┐
    │EditorialContent  │  │    City       │  │ ExchangeRate   │
    │──────────────────│  │──────────────│  │────────────────│
    │ type/title/slug  │  │ name/slug    │  │ baseCurrency   │
    │ content          │  │ region       │  │ targetCurrency  │
    │ budgetMin/Max    │  │ hotelCount   │  │ rate           │
    │ status           │  │ rest.Count   │  └────────────────┘
    └──────────────────┘  └──────────────┘

    ┌──────────────────┐  ┌──────────────────┐
    │  Newsletter      │  │  ArticleCategory │
    │  Subscriber      │  │──────────────────│
    │──────────────────│  │ name/slug        │
    │ email (unique)   │  │ color            │
    │ isActive         │  │ articles[]       │
    └──────────────────┘  └──────────────────┘
```

---

## 6. Architecture des Composants

```
src/components/
│
├── ════════════════════ ADMIN (23 composants) ════════════════════
│
├── admin/
│   │
│   ├── AdminDashboardOverview.tsx ─── KPIs + Charts + Queue Modération + Heatmap
│   │   └── AdminHeatmap.tsx ───────── Leaflet (dynamic, SSR=false) cercles proportionnels
│   │
│   ├── ModerationPipeline.tsx ─────── 3 sous-tabs:
│   │   ├── Validation Fiches ──────── Pending review + docs
│   │   ├── Ghost Management ───────── Promouvoir/Fusionner
│   │   └── Audit Reviews ─────────── Flagged/Hidden
│   │
│   ├── EstablishmentModerationList── Liste + actions (approve/reject/feature)
│   ├── EstablishmentEditor.tsx ────── Formulaire édition fiche
│   ├── ClaimsModeration.tsx ───────── Revendications pending
│   ├── ReviewModeration.tsx ───────── Avis à modérer
│   ├── BookingManagement.tsx ──────── Réservations plateforme
│   │
│   ├── UserManagement.tsx ─────────── Liste users par type + KPIs + ban/message
│   ├── VerificationReview.tsx ─────── NIF/STAT/CIN approve/reject + notes
│   ├── ComplianceTracker.tsx ──────── 3 sections conformité
│   ├── RankingManager.tsx ─────────── Classement manuel + batch save
│   │
│   ├── EventCalendar.tsx ──────────── Grille mois CSS + approve/reject
│   ├── ImageManager.tsx ───────────── CRUD images attractions
│   ├── ImportSection.tsx ──────────── Import CSV + historique
│   ├── ExchangeRateManager.tsx ────── Taux MGA/EUR/USD
│   │
│   ├── AdminSupportInbox.tsx ──────── Visualiseur conversations (lecture seule)
│   ├── GodModeMessaging.tsx ───────── Intervention + message direct
│   ├── AccountSimulation.tsx ──────── Recherche user + "voir en tant que"
│   ├── DBCleanupTool.tsx ──────────── Nettoyage BDD (dry-run)
│   ├── AuditLog.tsx ───────────────── Journal d'audit
│   │
│   ├── ArticleEditor.tsx ──────────── Éditeur articles
│   ├── MediaLibrary.tsx ───────────── Médiathèque
│   │
│   └── editor/
│       ├── RichTextEditor.tsx ─────── TipTap 3
│       ├── ImageUploader.tsx ──────── Upload images dans éditeur
│       ├── LayoutPicker.tsx ───────── Choix layout article
│       └── ArticlePreview.tsx ─────── Preview article
│
├── ═══════════════ BONS PLANS / ANNUAIRE (28 composants) ═══════════════
│
├── bons-plans/
│   ├── CategorizedGallery.tsx ─────── Hero + Thumbnails + Lightbox
│   ├── EstablishmentBentoCard.tsx ─── Carte bento (liste)
│   ├── BentoGrid.tsx ──────────────── Grille bento responsive
│   ├── BookingChatWidget.tsx ──────── Widget réservation flottant
│   ├── ReservationButton.tsx ──────── Bouton réservation
│   ├── ClaimButton.tsx ────────────── Bouton "Revendiquer"
│   ├── ReviewForm.tsx ─────────────── Formulaire avis
│   ├── ReviewPreview.tsx ──────────── Aperçu avis
│   ├── ReviewVoteButtons.tsx ──────── Utile/Pas utile
│   ├── ReviewImageGallery.tsx ─────── Galerie images avis
│   ├── ReviewPhotoUpload.tsx ──────── Upload photo dans avis
│   ├── ReportReviewDialog.tsx ─────── Dialog signalement
│   ├── FomoBanner.tsx ─────────────── "X personnes regardent"
│   ├── PromoBanner.tsx ────────────── Bannière promotion
│   ├── GhostBanner.tsx ────────────── Bannière lieu fantôme
│   ├── GhostEstablishmentForm.tsx ─── Formulaire lieu fantôme
│   ├── OpenCloseBadge.tsx ─────────── Badge ouvert/fermé
│   ├── ContributorBadge.tsx ───────── Badge contributeur
│   ├── OwnerBio.tsx ───────────────── Bio propriétaire
│   ├── AccessInfo.tsx ─────────────── Infos accès
│   ├── ServiceIcons.tsx ───────────── Icônes services
│   ├── SocialLinks.tsx ────────────── Liens sociaux
│   ├── EnhancedContactButtons.tsx ─── Boutons contact améliorés
│   ├── SourceAttribution.tsx ──────── Attribution source données
│   ├── WeatherAlertBanner.tsx ─────── Alerte météo
│   ├── BreadcrumbJsonLd.tsx ───────── Schema.org breadcrumb
│   └── EstablishmentJsonLd.tsx ────── Schema.org establishment
│
├── ═══════════════════ CHAT (7 composants) ═══════════════════
│
├── chat/
│   ├── ChatInterface.tsx ──────────── Interface chat complète
│   ├── ThreadList.tsx ─────────────── Liste conversations
│   ├── MessageBubble.tsx ──────────── Bulle message
│   ├── TypingIndicator.tsx ────────── Indicateur "en train d'écrire"
│   ├── OnlineStatus.tsx ───────────── Badge en ligne/hors ligne
│   ├── useChatMessages.ts ────────── Hook messages temps réel
│   └── types.ts ───────────────────── Types TypeScript
│
├── ═════════════════ DASHBOARD PRO (4 composants) ═════════════════
│
├── dashboard/
│   ├── DashboardSidebar.tsx ───────── Sidebar navigation
│   ├── QuickActionBar.tsx ─────────── Barre actions rapides
│   ├── ReservationTable.tsx ───────── Tableau réservations
│   └── RoomTypeLegend.tsx ─────────── Légende types chambres
│
├── ═══════════════════ EVENTS (4 composants) ═══════════════════
│
├── events/
│   ├── EventCalendar.tsx ──────────── Calendrier événements (public)
│   ├── EventCard.tsx ──────────────── Carte événement
│   ├── EventFilters.tsx ───────────── Filtres catégorie/ville
│   └── EventForm.tsx ──────────────── Formulaire soumission
│
├── ═══════════════════ MAPS (5 composants) ═══════════════════
│
├── maps/
│   ├── InteractiveFullMap.tsx ─────── Carte pleine page (Leaflet)
│   ├── AttractionsMap.tsx ─────────── Carte attractions (markers)
│   ├── MapLocationPicker.tsx ──────── Sélecteur lieu (Nominatim)
│   ├── DirectionsWidget.tsx ───────── Widget itinéraire
│   └── TransportInfo.tsx ──────────── Infos transport
│
├── ═══════════════════ SEARCH (4 composants) ═══════════════════
│
├── search/
│   ├── SearchFilters.tsx ──────────── Filtres avancés
│   ├── SearchResultCard.tsx ───────── Carte résultat
│   ├── SearchPagination.tsx ───────── Pagination
│   └── ActiveFilterChips.tsx ──────── Chips filtres actifs
│
├── ═══════════════════ UI (24 composants) ═══════════════════
│
├── ui/
│   ├── AnimatedButton.tsx ─────────── Bouton animé (Framer Motion)
│   ├── AnimatedGradientText.tsx ───── Texte gradient animé
│   ├── BentoHero.tsx ──────────────── Hero section bento
│   ├── Breadcrumbs.tsx ────────────── Fil d'Ariane
│   ├── CurrencyToggle.tsx ─────────── Toggle MGA/EUR/USD
│   ├── CustomCursor.tsx ───────────── Curseur custom
│   ├── LazyCustomCursor.tsx ───────── Curseur lazy-loaded
│   ├── EmptyState.tsx ─────────────── État vide
│   ├── EstablishmentFavoriteButton── Favori établissement
│   ├── FavoriteButton.tsx ─────────── Bouton favori générique
│   ├── ImageWithFallback.tsx ──────── Image avec fallback
│   ├── LanguageToggle.tsx ─────────── Toggle FR/EN
│   ├── Lightbox.tsx ───────────────── Lightbox images plein écran
│   ├── NotificationBell.tsx ───────── Cloche notifications
│   ├── PhoneInput.tsx ─────────────── Input téléphone (+261)
│   ├── ScrollReveal.tsx ───────────── Animation au scroll
│   ├── SkillBadges.tsx ────────────── Badges compétences
│   ├── SkipToContent.tsx ──────────── Accessibilité skip link
│   ├── StarRating.tsx ─────────────── Étoiles notation
│   ├── SuccessTicker.tsx ──────────── Ticker défilant
│   ├── ThemeToggle.tsx ────────────── Dark/Light toggle
│   ├── VerifiedBadge.tsx ──────────── Badge vérifié
│   └── AvailabilityBadge.tsx ──────── Badge disponibilité
│
├── ═══════════════════ LAYOUT (2 composants) ═══════════════════
│
├── layout/
│   ├── Header.tsx ─────────────────── Header principal
│   └── Footer.tsx ─────────────────── Footer principal
│
├── seo/
│   └── OrganizationJsonLd.tsx ─────── Schema.org organisation
│
├── ═══════════════════ ROOT (15 composants) ═══════════════════
│
├── AdSidebar.tsx ──────────────────── Sidebar publicités
├── TopAdBanner.tsx ────────────────── Bannière pub top
├── CookieConsent.tsx ──────────────── Consentement cookies
├── FloatingEmergencyButton.tsx ────── Bouton urgence flottant
├── GoogleAnalytics.tsx ────────────── GA4 tracking
├── HoroscopeSection.tsx ───────────── Section horoscope
├── HtmlLangUpdater.tsx ────────────── Mise à jour lang HTML
├── JobsSection.tsx ────────────────── Section emplois
├── PushPermissionBanner.tsx ───────── Demande permission push
├── RecipeSection.tsx ──────────────── Section recettes
├── ServiceWorkerRegister.tsx ──────── Enregistrement SW (PWA)
├── Skeleton.tsx ───────────────────── Skeleton loading
├── TrendingSection.tsx ────────────── Section tendances
└── Footer.tsx ─────────────────────── Footer (doublon?)
```

---

## 7. Architecture Hooks / Contexts / Providers

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT & HOOKS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─── Providers (src/providers/) ─────────────────────────────┐ │
│  │                                                             │ │
│  │  QueryProvider.tsx ──── TanStack React Query (cache API)    │ │
│  │  ThemeProvider.tsx ──── next-themes (dark/light)            │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─── Contexts (src/contexts/) ───────────────────────────────┐ │
│  │                                                             │ │
│  │  CurrencyContext.tsx ── MGA / EUR / USD toggle + conversion │ │
│  │  LanguageContext.tsx ── FR / EN + i18n translations         │ │
│  │  ToastContext.tsx ───── Notifications toast (success/error) │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─── Store (src/store/) ─────────────────────────────────────┐ │
│  │                                                             │ │
│  │  useStore.ts ──── Zustand (état global minimal)             │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─── Hooks (src/hooks/) ─────────────────────────────────────┐ │
│  │                                                             │ │
│  │  useCsrf.ts ──────────── Token CSRF (auto-refresh 45min)   │ │
│  │  useNotifications.ts ─── Polling notifications (5s/30s)     │ │
│  │  useNotificationToasts── Toast sur nouvelle notification    │ │
│  │  useMessageChannel.ts ── Channel messages temps réel        │ │
│  │  useOpenStatus.ts ────── Calcul ouvert/fermé                │ │
│  │  usePushSubscription.ts─ Abonnement Web Push                │ │
│  │  useSearchFilters.ts ─── Filtres URL search params          │ │
│  │  useTimeAgo.ts ────────── "Il y a 5 min" relatif            │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─── i18n (src/i18n/) ──────────────────────────────────────┐  │
│  │                                                             │ │
│  │  index.ts ──────────── Setup i18n                           │ │
│  │  translations/fr.ts ── Français (par défaut)                │ │
│  │  translations/en.ts ── English                              │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Admin Control Center — 20 Tabs

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    ADMIN CONTROL CENTER (/admin)                         │
│                    20 Tabs — Dynamic Imports — SPA                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SIDEBAR                          CONTENU                                │
│  ┌──────────────────┐             ┌─────────────────────────────────┐   │
│  │                  │             │                                 │   │
│  │ 1. Tableau Bord  │──────────►  │  AdminDashboardOverview         │   │
│  │    (LayoutDash)  │             │  ├── KPIs (users, estab, msgs)  │   │
│  │                  │             │  ├── Growth charts (stacked)    │   │
│  │ 2. Modération    │──────────►  │  ├── Moderation queue          │   │
│  │    (ClipCheck)   │             │  └── AdminHeatmap (Leaflet)    │   │
│  │                  │             │                                 │   │
│  │ 3. Établissements│──────────►  │  EstablishmentModerationList   │   │
│  │    (Building2)   │             │                                 │   │
│  │                  │             │  ModerationPipeline             │   │
│  │ 4. Revendications│──────────►  │  ├── Validation Fiches          │   │
│  │    (Flag)        │             │  ├── Ghost Management           │   │
│  │                  │             │  └── Audit Reviews              │   │
│  │ 5. Avis          │──────────►  │                                 │   │
│  │    (MessageSq)   │             │  ClaimsModeration               │   │
│  │                  │             │  ReviewModeration                │   │
│  │ 6. Réservations  │──────────►  │  BookingManagement              │   │
│  │    (Calendar)    │             │                                 │   │
│  │                  │             │  EventCalendar (grille mois)    │   │
│  │ 7. Événements    │──────────►  │                                 │   │
│  │    (Calendar)    │             │  ImageManager                   │   │
│  │                  │             │                                 │   │
│  │ 8. Images        │──────────►  │  AdminSupportInbox (lecture)    │   │
│  │    (ImageIcon)   │             │                                 │   │
│  │                  │             │  GodModeMessaging               │   │
│  │ 9. Support       │──────────►  │  ├── Intervention thread        │   │
│  │    (Headphones)  │             │  └── Message direct             │   │
│  │                  │             │                                 │   │
│  │ 10. God Mode     │──────────►  │  UserManagement                 │   │
│  │     (Shield)     │             │  ├── Tabs par type              │   │
│  │                  │             │  ├── KPIs (total, new, banned)  │   │
│  │ 11. Utilisateurs │──────────►  │  ├── Ban/Unban                  │   │
│  │     (Users)      │             │  └── Message direct             │   │
│  │                  │             │                                 │   │
│  │ 12. Vérification │──────────►  │  VerificationReview             │   │
│  │     (ShieldCheck)│             │  ├── NIF / STAT / CIN / Licence │   │
│  │                  │             │  └── Approve / Reject + notes   │   │
│  │ 13. Import       │──────────►  │                                 │   │
│  │     (BarChart3)  │             │  ImportSection (CSV)            │   │
│  │                  │             │                                 │   │
│  │ 14. Classement   │──────────►  │  RankingManager                 │   │
│  │     (Trophy)     │             │  ├── Ordre affichage manuel     │   │
│  │                  │             │  ├── Up/Down + numéro           │   │
│  │ 15. Conformité   │──────────►  │  └── Featured toggle            │   │
│  │     (ShieldAlert)│             │                                 │   │
│  │                  │             │  ComplianceTracker               │   │
│  │ 16. Simulation   │──────────►  │  ├── Nouveaux inscrits          │   │
│  │     (Eye)        │             │  ├── Conformité docs            │   │
│  │                  │             │  └── Qualité fiches              │   │
│  │ 17. Nettoyage    │──────────►  │                                 │   │
│  │     (Trash2)     │             │  AccountSimulation              │   │
│  │                  │             │  DBCleanupTool (dry-run)        │   │
│  │ 18. Devises      │──────────►  │  ExchangeRateManager            │   │
│  │     (FileText)   │             │                                 │   │
│  │                  │             │  AuditLog                       │   │
│  │ 19. Audit        │──────────►  │                                 │   │
│  │     (FileText)   │             │  Stats + Export CSV             │   │
│  │                  │             │                                 │   │
│  │ 20. Statistiques │──────────►  │                                 │   │
│  │     (BarChart3)  │             │                                 │   │
│  │                  │             │                                 │   │
│  └──────────────────┘             └─────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Stack Technique

```
┌──────────────────────────────────────────────────────────────────┐
│                        STACK TECHNIQUE                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FRONTEND                                                        │
│  ├── Next.js 16 ──────────── App Router, SSR, Dynamic Imports    │
│  ├── React 19 ────────────── Server & Client Components          │
│  ├── TailwindCSS 4 ──────── Utility-first (PostCSS plugin)      │
│  ├── Framer Motion 12 ───── Animations, transitions              │
│  ├── Lucide React ────────── Icônes SVG                          │
│  ├── React-Leaflet 5 ────── Cartes interactives                  │
│  ├── TipTap 3 ───────────── Rich text editor                     │
│  ├── React Dropzone ──────── Upload drag & drop                  │
│  ├── date-fns ────────────── Manipulation dates                  │
│  └── next-themes ─────────── Dark/Light mode                     │
│                                                                   │
│  STATE                                                           │
│  ├── Zustand 5 ───────────── Store global minimal                │
│  ├── TanStack Query 5 ───── Cache serveur, mutations             │
│  └── React Context ───────── Currency, Language, Toast            │
│                                                                   │
│  BACKEND                                                         │
│  ├── Next.js API Routes ──── ~150 endpoints                      │
│  ├── Prisma 5.22 ─────────── ORM (40 modèles, 13 enums)         │
│  ├── PostgreSQL (Neon) ──── Cloud serverless                     │
│  ├── bcryptjs ─────────────── Hashing passwords                  │
│  ├── Sharp ────────────────── Traitement images                  │
│  ├── web-push ─────────────── Push notifications                 │
│  ├── Zod 4 ────────────────── Validation données                 │
│  └── Custom Auth ──────────── Cookie sessions (pas NextAuth)     │
│                                                                   │
│  INFRASTRUCTURE                                                  │
│  ├── Render.com ───────────── Déploiement (render.yaml)          │
│  ├── Neon ─────────────────── PostgreSQL serverless              │
│  ├── PWA ──────────────────── Service Worker, manifest.json      │
│  └── Nominatim ────────────── Géocodage (API publique)           │
│                                                                   │
│  OUTILS DEV                                                      │
│  ├── TypeScript 5 ─────────── Typage strict                     │
│  ├── ESLint 9 ─────────────── Linting                           │
│  ├── Prisma CLI ───────────── Migrations, generate               │
│  └── Python (automation/) ── Scraping articles                   │
│                                                                   │
│  SÉCURITÉ                                                        │
│  ├── CSRF tokens ──────────── HMAC-SHA256, 1h expiry             │
│  ├── Rate limiting ────────── In-memory (auth: 10/15min)         │
│  ├── CSP headers ──────────── Content-Security-Policy strict     │
│  ├── HttpOnly cookies ─────── Sessions non-accessibles JS        │
│  └── Audit logging ───────── Toutes actions admin tracées        │
│                                                                   │
│  DONNÉES STATIQUES (src/data/)                                   │
│  ├── guide-culinaire.ts ──── Données gastronomiques              │
│  ├── horoscope.ts ─────────── Horoscope du jour                  │
│  ├── madagascar-regions.ts ── Régions/villes Madagascar          │
│  ├── recipes.ts ───────────── Recettes malgaches                 │
│  └── registration-types.ts ── Types inscription                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. Flux Réservation (Booking Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUX RÉSERVATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client (Voyageur)                    Prestataire (Pro)          │
│  ────────────────                     ─────────────────          │
│                                                                  │
│  1. Voir fiche établissement                                     │
│     /bons-plans/hotels/[slug]                                    │
│         │                                                        │
│         ▼                                                        │
│  2. Vérifier disponibilité                                       │
│     GET /api/establishments/[id]/availability                    │
│     → Seules réservations "confirmed" bloquent le calendrier     │
│         │                                                        │
│         ▼                                                        │
│  3. Créer réservation                                            │
│     POST /api/establishments/[id]/bookings                       │
│     → status = "pending"                                         │
│     → Notification BOOKING_NEW → Prestataire                     │
│         │                                    │                   │
│         │                                    ▼                   │
│         │                          4. Voir réservation            │
│         │                             /dashboard/reservations     │
│         │                                    │                   │
│         │                                    ├── Accepter         │
│         │                                    │   status→confirmed │
│         │                                    │   Notif→Client     │
│         │                                    │   BOOKING_CONFIRMED│
│         │                                    │                   │
│         │                                    └── Refuser          │
│         │                                        status→cancelled │
│         │                                        Notif→Client     │
│         │                                        BOOKING_CANCELLED│
│         │                                                        │
│         ▼                                                        │
│  5. Client voit notification                                     │
│     useNotifications (polling 5s)                                │
│         │                                                        │
│         ▼                                                        │
│  6. Après séjour — Laisser un avis                               │
│     /client/bookings/[id]/review                                 │
│     POST /api/bookings/[id]/review                               │
│     → Points fidélité (REVIEW_POSTED)                            │
│     → Notif REVIEW_NEW → Prestataire                             │
│         │                                    │                   │
│         │                                    ▼                   │
│         │                          7. Répondre à l'avis           │
│         │                             /dashboard/avis             │
│         │                             ownerResponse               │
│         │                                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Résumé Chiffré

```
┌────────────────────────────────────────────────┐
│            MADA SPOT EN CHIFFRES               │
├────────────────────────────────────────────────┤
│                                                │
│  Pages (routes)          ~65                   │
│  API Endpoints           ~150                  │
│  Composants React        ~115                  │
│  Modèles Prisma          40                    │
│  Enums Prisma            13                    │
│  Hooks custom            8                     │
│  Contexts React          3                     │
│  Admin Tabs              20                    │
│  Langues (i18n)          2 (FR/EN)             │
│  Devises supportées      3 (MGA/EUR/USD)       │
│  Types établissements    4 (Hotel/Resto/Attr/Prov)│
│  Rôles utilisateurs      2 (CLIENT/ADMIN)      │
│  Types utilisateurs      4 (+ null = voyageur) │
│  Types prestataire       10 services           │
│                                                │
└────────────────────────────────────────────────┘
```
