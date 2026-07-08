# Manuel d'onboarding — Mada Spot

> Pour une personne qui arrive sur le projet sans rien connaître. À lire dans l'ordre.
> Dernière mise à jour : 06/07/2026.

---

## 1. C'est quoi Mada Spot

Mada Spot est le **guide en ligne des bons spots de Madagascar** : hôtels, restaurants, activités/attractions, et prestataires de services (guides, chauffeurs, agences…). Le site est consulté par des voyageurs locaux et internationaux qui préparent leur séjour.

Trois familles d'utilisateurs :
- **Voyageurs** (rôle `CLIENT`) : cherchent, consultent, laissent des avis, réservent, gèrent des favoris.
- **Prestataires** (un `CLIENT` avec un `userType` HOTEL/RESTAURANT/ATTRACTION/PROVIDER) : créent et gèrent leur **fiche** établissement via un tableau de bord.
- **Admins** (rôle `ADMIN`) : modèrent le contenu, gèrent les revendications, les utilisateurs, la CRM, les imports, etc. via un « Control Center ».

Le modèle économique : le référencement est **gratuit** pour les prestataires. L'enjeu produit central = faire créer et compléter des **fiches** de qualité.

C'est une grosse plateforme (~210 routes API) : au-delà de l'annuaire, il y a réservations, messagerie, avis, blog, événements, pharmacies de garde, urgences, météo, taux de change, contenus histoire/économie, notifications push, et une CRM interne.

---

## 2. La stack technique

| Couche | Techno |
|---|---|
| Framework | **Next.js 16** (App Router, React 19), TypeScript |
| Style | **Tailwind CSS v4** |
| Base de données | **PostgreSQL (Neon serverless)** via **Prisma ORM** |
| Auth | **Maison** : sessions en base + cookie httpOnly, `bcryptjs`. **Pas de next-auth.** |
| Images | **Cloudinary** (fallback disque local en dev) |
| E-mail | **Resend** (principal), relais HTTP ou **nodemailer/SMTP** en secours |
| Cartes | **Leaflet** (+ markercluster) ; **Three.js** pour une carte 3D optionnelle |
| Éditeur riche | TipTap |
| Notifications | **web-push** (VAPID) |
| État client | Zustand + React Query (`@tanstack/react-query`) |
| Animations | framer-motion |
| Thème | next-themes (clair/sombre) |

---

## 3. Démarrer en local

Prérequis : Node.js (cible Node 20), npm, une base PostgreSQL (Neon ou local).

```bash
# 1. Dépendances (postinstall lance prisma generate)
npm install

# 2. Variables d'environnement
cp .env.example .env      # puis remplir (au minimum DATABASE_URL + DIRECT_DATABASE_URL)

# 3. Client Prisma
npx prisma generate

# 4. Créer le schéma en base
npm run db:push           # pousse le schéma (sans historique de migration)
#   ou   npm run db:migrate   pour utiliser les migrations

# 5. Données de départ
npm run db:seed           # exécute prisma/seed.ts

# 6. Lancer le serveur de dev
npm run dev               # http://localhost:3000
```

Autres commandes utiles :
- `npm run build` → `prisma generate && next build` (⚠️ les erreurs TypeScript sont **ignorées au build**, voir §14).
- `npm start` → serveur de prod.
- `npm run db:studio` → **Prisma Studio**, explorateur visuel de la base (très pratique pour inspecter/éditer les données).
- `npm run lint` → ESLint.

Notes dev :
- Sans les variables `CLOUDINARY_*`, les uploads tombent sur le disque (`public/uploads/`) — OK en local.
- Sans variables e-mail, les envois sont juste loggés en console (`queued:true`).
- Sans `VAPID_*`, le push est désactivé silencieusement.
- `NEXT_PUBLIC_SITE_URL` doit pointer sur `http://localhost:3000` pour que les appels internes `/api/email/send` fonctionnent.

Il n'y a **pas de vrai README** (juste `# MadaSpot`) : ce fichier tient lieu de doc.

---

## 4. Architecture du code

```
prisma/schema.prisma        ← TOUT le modèle de données (2100+ lignes)
prisma/seed.ts              ← données initiales
src/app/                    ← pages + API (App Router)
  page.tsx                  ← page d'accueil
  layout.tsx                ← layout racine (providers, SEO, fonts)
  (bons-plans)/             ← groupe : catalogue public (/hotels, /restaurants, …)
  bons-plans/               ← route réelle /bons-plans (hub + fiches ghost + avis)
  (auth)/                   ← login, register, mot de passe oublié
  dashboard/                ← espace prestataire
  client/                   ← espace voyageur
  admin/                    ← Control Center admin (page unique multi-onglets)
  api/                      ← ~210 route handlers REST
src/components/             ← composants (layout/, home/, bons-plans/, dashboard/, admin/, maps/, ui/)
src/lib/                    ← logique métier (auth/, data/, email.ts, push.ts, csrf.ts, …)
src/contexts/, src/providers/, src/hooks/, src/i18n/   ← state, thème, langue, traductions
automation/                ← scripts de croissance/outreach + stats.cjs (voir §13)
```

⚠️ Un dossier `.claude/worktrees/agent-*/` peut contenir une **copie** du code (worktree d'agent). Ce n'est pas l'app vivante — toujours travailler dans `src/` à la racine.

---

## 5. Le modèle de données (Prisma)

Tout est dans `prisma/schema.prisma`. Chaque modèle a un `id` en `cuid()` et généralement `createdAt`/`updatedAt`.

### Modèles clés

- **User** — tout compte humain (voyageur, prestataire, admin). Champs : `email?`/`phone?` (uniques), `password` (hash bcrypt), `role` (`CLIENT`|`ADMIN`), `userType?` (le type de pro), `isActive`, `isBanned`, `emailVerified`, `isVerified`, `loyaltyPoints`, `totpSecret/totpEnabled` (2FA admin).
- **Session** — le mécanisme d'auth : `token` (hex 32 octets), `expiresAt`. Le cookie porte ce token.
- **Establishment** — LE modèle central (une fiche). Voir détail ci-dessous.
- **Hotel / Restaurant / Attraction / Provider** — tables filles 1:1 selon le `type`, avec les champs spécifiques (étoiles & chambres pour Hotel, cuisine & menu pour Restaurant, etc.).
- **EstablishmentReview** — avis (note 1–5, commentaire, photos, réponse du propriétaire).
- **EstablishmentClaim** — demande de revendication d'une fiche existante.
- **Booking**, **Message**, **Notification**, **PushSubscription**, **VerificationDocument**, **EstablishmentView**, **OutboundClick**…
- Contenu éditorial/SEO : `Article`, `Event`, `Pharmacy`, `WeatherAlert`, `HistoricalEra/Event/Figure`, `EconomicIndicator`, etc.
- **CRM interne** : `Prospect`, `Conversation`, `ContactTag`, `FollowUp`…

### L'objet Establishment (le cœur)

Champs importants : `type`, `name`, `slug` (unique), `description` (+ variantes `*En` pour l'anglais), localisation (`city`, `region`, `latitude`, `longitude`), contact (`phone`, `email`, `whatsapp`, réseaux), média (`coverImage`, `images` = tableau JSON, `gallery`), notes (`rating`, `reviewCount`).

Champs de **statut/cycle de vie** (à bien comprendre) :
- `isActive` — visible publiquement ou non.
- **`moderationStatus`** (string : `pending_review` | `approved` | `rejected`).
- `isClaimed` + **`claimedByUserId`** — la fiche a un **propriétaire** (un pro l'a revendiquée).
- `isGhost` + **`createdByUserId`** — fiche « fantôme » créée par un voyageur.
- `dataSource` (`manual` / `csv_import` / `user_contribution` / …), `isFeatured`, `isPremium`, `trustScore`.

### Distinction cruciale : `createdByUserId` vs `claimedByUserId`

- **`createdByUserId`** = « qui a **ajouté** ce lieu au site » (une fiche fantôme créée par un voyageur, `isGhost=true`).
- **`claimedByUserId`** = « quel pro **possède/gère** ce lieu maintenant » (revendication approuvée, `isClaimed=true`).

Une fiche peut avoir les deux, l'un, ou aucun (ex. un import CSV admin n'a ni l'un ni l'autre).

> Dans les scripts de suivi (voir §13), une fiche est comptée **« revendiquée »** dès qu'elle a un `claimedByUserId` ou un `createdByUserId`.

### Enums principaux
- `UserRole` : `CLIENT`, `ADMIN` (les 2 seuls rôles).
- `UserType` / `EstablishmentType` : `HOTEL`, `RESTAURANT`, `ATTRACTION`, `PROVIDER`.
- `ProviderServiceType` : `GUIDE`, `DRIVER`, `TOUR_OPERATOR`, `CAR_RENTAL`, `TRAVEL_AGENCY`, …
- `RestaurantCategory`, `PriceRange`, `ClaimStatus` (`PENDING`/`APPROVED`/`REJECTED`), `VerificationStatus`.

⚠️ `moderationStatus` et `Booking.status` sont des **strings libres**, pas des enums → gare aux fautes de frappe.

---

## 6. Authentification & rôles

Toute la logique est dans `src/lib/auth/` (réexporté par `index.ts`).

- **Mots de passe** : `bcryptjs`, 12 rounds (`password.ts`). Force minimale : 8 caractères, maj+min+chiffre.
- **Sessions en base, PAS de JWT** (`session.ts`) : un token aléatoire stocké dans la table `Session`, expiration 7 jours, transmis via un cookie **httpOnly `mada-spot-session`**.
- **Routes** (`src/app/api/auth/`) : `register` (auto-login à l'inscription), `login` (supprime les anciennes sessions = session unique), `logout`, `session` (qui suis-je), `forgot-password` (token 1 h + e-mail), `reset-password`, `change-password`, `delete-account`, `otp/send`, `otp/verify`.
- **Protection** :
  - Côté **API** : helpers `getAuthUser`, `requireAuth`, `requireRole`, `requireAdmin`, `requireVerified` (`src/lib/auth/middleware.ts`). C'est **là que la sécurité réelle est appliquée**.
  - Côté **page** : contrôle **client** (pas de `middleware.ts` Next). Le layout dashboard/admin appelle `/api/auth/session` au montage et redirige si non connecté.

### Admin = système de session parallèle
- Cookie séparé **`mada-spot-admin-session`** (24 h), logique dans `admin-session.ts`.
- Login admin (`api/admin/login`) : rate-limit strict, audit log, et **2FA TOTP** si activée (setup/verify/disable sous `api/admin/2fa/`).
- Les routes admin s'autorisent via `checkAdminAuth` (cookie admin) **ou** `requireAdmin` (user `role===ADMIN`).

---

## 7. Le site public

Framework : App Router, français par défaut avec bascule anglaise. Les **route groups** (dossiers entre parenthèses) organisent sans ajouter de segment d'URL.

### Pages principales
- **Accueil** (`src/app/page.tsx`) : hero de recherche (`HeroClean`), destinations populaires, recommandations (featured), « pourquoi Mada Spot », témoignages, newsletter, bannière pro.
- **Catalogue** — groupe `(bons-plans)/` → URLs à la racine :
  - `/hotels`, `/restaurants`, `/attractions`, `/prestataires` (+ `/[slug]` pour le détail).
  - `/carte` (carte plein écran), `/offres` (promos), `/guide-culinaire`.
- **Fiche détail** : `/{catégorie}/{slug}` (ex. `/hotels/le-louvre-antananarivo`). Server component en **ISR** (revalidation 1 h), SEO + JSON-LD, puis composant client riche (galerie, équipements, chambres, avis, contact, carte).
- `/search` : moteur de recherche global (filtres synchronisés à l'URL, appel `/api/search` débounce 300 ms).
- Autres : `/blog`, `/evenements`, `/pharmacies`, `/urgences`, `/publier-lieu`, `/publier-avis`, **`/inscrire-etablissement`** (inscription pro), `/comment-ca-marche`, `/a-propos`, `/faq`, `/contact`, pages légales (`/cgu`, `/mentions-legales`, `/politique-confidentialite`).

### Catégories
Pas de route dynamique `/category/[type]` : les 4 types ont chacun une route dédiée. Le filtrage se fait côté client via des paramètres d'URL (ville, recherche, prix, équipements, tri, pagination).

### Langues (i18n maison)
- `LanguageContext` : locale `fr`/`en` (persistée en `localStorage`), helper `t(fr, en)` pour le **contenu de la base** (champs `nameEn`/`descriptionEn`).
- `src/i18n/translations/{fr,en}.ts` : dictionnaires de l'**UI**, via le hook `useTrans('section')`.
- Bascule : `LanguageToggle` (pilule FR/EN dans le header).

### Thème
`next-themes`, attribut `data-theme`, défaut clair. En pratique beaucoup de pages publiques codent la palette claire en dur (accent orange `#FF6B35`, bleu hero `#003B95`).

### Cartes
- **Leaflet** (principal) : `/carte` via `InteractiveFullMap.tsx`, marqueurs clusterisés par type, données `/api/bons-plans/map`.
- **Three.js** (optionnel, si `NEXT_PUBLIC_ENABLE_3D=true`) : carte 3D stylisée de Madagascar.

---

## 8. Le tableau de bord prestataire (`src/app/dashboard/`)

Espace privé du pro. Le layout vérifie la session (`/api/auth/session`) et redirige vers `/login` sinon (la vérification e-mail est **non bloquante** : simple bandeau).

Sous-pages : accueil (KPIs), **mon établissement** (`etablissement/`), réservations, avis, calendrier, messagerie, promotions, tarifs, statistiques, paramètres, vérification (documents légaux).

### La fiche établissement (`dashboard/etablissement/page.tsx`) — l'écran le plus important
Formulaire à onglets (`?tab=`) :
1. **general** : catégorie (verrouillée sur le `userType` du compte), nom, description, ville, région, adresse, coordonnées GPS (+ bouton géolocalisation). Si HOTEL : étoiles, horaires check-in/out.
2. **photos** : image de couverture + galerie (jusqu'à 20, avec légendes).
3. **equipements** : wifi, parking, piscine, groupe électrogène, clim, etc.
4. **horaires** : horaires par jour + jours fériés.
5. **contact** : téléphones, e-mail, site, réseaux sociaux.
6. **menu** (restaurants) : types de cuisine, photos de menu, options livraison/à emporter.

**Upload photos** : via `POST /api/upload` par lots de 5 (limite de l'API), avec un token CSRF (`useCsrf()`).

**Création/édition** : `POST /api/dashboard/establishment` (créer) ou `PUT` (modifier). Validation : nom + ville réels obligatoires.

> **⚠️ Point clé pour l'acquisition :** une fiche créée par un prestataire naît en **`moderationStatus: 'pending_review'`**. Elle n'est **visible publiquement qu'après validation admin** (qui passe le statut à `approved` et `isActive=true`). Donc « compte créé → fiche créée → **fiche validée** → en ligne ». Ne pas oublier l'étape de modération quand on suit la conversion.

---

## 9. L'espace admin (`src/app/admin/`)

Un « Control Center » = **une seule page** (`admin/page.tsx`) avec ~30 onglets chargés à la demande, changés côté client (pas de routing). Auth via `/api/admin/session` (ou user `role===ADMIN`), sinon redirection `/admin/login`.

Onglets (composants dans `src/components/admin/`) :
- **Modération** (`ModerationPipeline`) : validation des fiches, lieux fantômes, audit avis & photos.
- **Établissements** (`EstablishmentModerationList`) : approuver/refuser les fiches.
- **Revendications** (`ClaimsModeration`), **Avis** (`ReviewModeration`), **Réservations**.
- **CRM**, **Utilisateurs** (bannir, messagerie directe), **Vérification** (docs légaux).
- **Import** (CSV, batches), **Classement**, **Conformité**, **Doublons**, **Nettoyage**.
- **God Mode** (intervenir dans les conversations, avec audit), **Simulation/Impersonation**.
- **Live Ops** (pharmacies de garde, urgences, alertes météo), **Analytics clics**, **SEO**, **Devises**, **Audit**, **Support**.
- **Stats** : export CSV via `/api/admin/export?type=users|establishments|bookings|reviews`.

---

## 10. Workflows transverses

### Modération des fiches (`moderationStatus`)
- Fiche pro (dashboard) → `pending_review`. Fiche admin → `approved` direct. Lieu fantôme (voyageur) → `isGhost=true`.
- L'admin approuve/refuse via `PUT /api/admin/establishments {id, moderationStatus}` :
  - `approved` force `isActive=true` (visible) ; `rejected` force `isActive=false`.

### Revendications (claims)
1. Sur une fiche publique non revendiquée, bouton **« Revendiquer cette fiche »** (`ClaimButton.tsx`) → formulaire (nom, e-mail, tél, rôle, preuve) → `POST /api/bons-plans/establishments/{id}/claim` (crée un `EstablishmentClaim` `PENDING` + notifie les admins).
2. L'admin approuve via `PUT /api/admin/claims {claimId, action:'approve'}` → la fiche passe `isClaimed=true` + `claimedByUserId` = le user dont l'e-mail correspond ; les autres claims en attente sont auto-refusés.
3. Une fois approuvée, la fiche apparaît dans `/api/dashboard/establishment` du pro → il peut la gérer.

### Avis
- Soumission publique (`POST /api/establishments/[id]/reviews`) : note 1–5, commentaire ≥10 car., ≤3 photos, CSRF requis. **Publié immédiatement** (`isPublished=true`, pas de pré-modération). Recalcule la moyenne, notifie le propriétaire (in-app + push + e-mail).
- Le pro répond depuis `dashboard/avis` (`POST /api/dashboard/reviews`).
- Signalement : `.../report` (met `isFlagged`). L'admin modère (`ReviewModeration`) : publier/masquer/supprimer/lever le signalement (tout est audité).

### Vérification des documents (distincte de la modération de fiche)
Le pro upload NIF/STAT/licence/CIN (`dashboard/verification`), l'admin approuve dans `VerificationReview`. Pro « vérifié » dès **≥2 documents** au statut `VERIFIED`.

---

## 11. La couche API (`src/app/api/`)

~210 handlers. La plupart des écritures exigent : auth + **token CSRF** (`/api/csrf` en émet un) + rate-limiting. Grands groupes :

- **auth/** : login, register, logout, session, forgot/reset/change-password, otp.
- **admin/** : login/2fa/session + tout le back-office (establishments, claims, reviews, users, crm, moderation, import, export, stats, seed…). Les routes `seed*` sont bloquées hors dev.
- **bons-plans/** : le catalogue public par catégorie (`hotels`/`restaurants`/`attractions`/`prestataires` + `[slug]`), `map`, `search`, `geo-search`, `trending`, et la **revendication** de fiche.
- **dashboard/** : establishment, stats, reservations, calendar, availability, pricing, promotions, reviews, messages, badges, verification.
- **client/** : espace voyageur (favoris, fidélité, publications, préférences).
- **establishments/** : reviews (+ vote/report), availability, bookings, promotions, favorites, ghost.
- **upload** : uploader multi-fichiers (Cloudinary). **email/send** : dispatcher e-mail. **push/** : VAPID + subscribe.
- **cron/** & **automation/** : tâches planifiées (protégées par `AUTOMATION_API_KEY`/`CRON_SECRET`).
- Contenu public : articles, events, history, economy, pharmacies, emergency-contacts, weather, exchange-rates, jobs, ads, notifications, geocode, track-click, health, webhooks/messenger.

---

## 12. E-mail, images, push, config

### E-mail (`src/lib/email.ts` + `api/email/send`)
`sendEmail()` **ne poste pas directement** : il envoie `{to, subject, html, secret}` à `/api/email/send`, qui essaie dans l'ordre : **Resend** (`RESEND_API_KEY`) → relais HTTP (`SMTP_API_URL`) → **SMTP nodemailer** → sinon log console. `EMAIL_SECRET` protège l'endpoint (401 sinon) pour ne pas en faire un relais ouvert. E-mails envoyés : reset mot de passe, OTP, contact, notifications (réservations, messages, avis, fidélité, claims).

### Images (`api/upload/route.ts`)
Auth + CSRF, max 5 fichiers/requête. Si `CLOUDINARY_*` présents → upload Cloudinary (`madaspot/<type>`, `secure_url`). Sinon → disque `public/uploads/<type>/`. Types : images (10 Mo), vidéo (100 Mo), audio (25 Mo), docs (50 Mo).

### Push (`src/lib/push.ts`)
web-push/VAPID (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). Endpoints `push/vapid-key` et `push/subscribe`. Abonnements en table `PushSubscription`. Utilisé pour les nouveaux avis/réservations.

### Variables d'environnement (`.env`)
- **Base** : `DATABASE_URL` (poolée), `DIRECT_DATABASE_URL` (migrations).
- **URLs** : `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXTAUTH_URL`.
- **Secrets** : `NEXTAUTH_SECRET`, `CSRF_SECRET`, `EMAIL_SECRET`, `ADMIN_EMAIL`.
- **E-mail** : `RESEND_API_KEY`, `RESEND_FROM`, `SMTP_*`, `SMTP_API_URL`.
- **Cloudinary** : `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **Push** : `VAPID_*`. **IA/images** (option) : `REPLICATE_API_TOKEN`, `STABILITY_API_KEY`, `PIXABAY_API_KEY`, `PEXELS_API_KEY`.
- **IA/news** : `GROQ_API_KEY`, `GOOGLE_GEMINI_API_KEY`.
- **Automation** : `AUTOMATION_API_KEY`, `AUTOMATION_ENABLED`, `CRON_SECRET`.
- **Meta/Messenger** : `META_PAGE_ACCESS_TOKEN`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_GRAPH_VERSION`.

> `.env.example` omet les groupes `CLOUDINARY_*`, `VAPID_*`, `META_*` — les ajouter à la main.

---

## 13. Déploiement & infra

| Brique | Détail |
|---|---|
| **Base** | Neon (Postgres serverless). Quota de calcul gratuit **mensuel**, reset le 1er. Site lent en fin de mois = quota. |
| **Hébergement** | VPS **IONOS `82.165.65.111`** (user `root`). App gérée par **PM2** (`madaspot`) dans `/root/mada-spot`. Reverse proxy **nginx** (HTTP/2, cert Let's Encrypt). RAM ~1 Go → le build peut manquer de mémoire. |
| **CDN** | **Cloudflare** devant le domaine. |
| **Images** | Cloudinary (`dh1ksozbx`). |

**Déployer une modif :**
```bash
ssh root@82.165.65.111
cd /root/mada-spot && git pull && npm run build && pm2 reload madaspot
```
(Il n'y a pas de CI de déploiement ; le CI ne fait que `tsc` + `eslint`.)

---

## 14. Croissance / acquisition (le travail quotidien actuel)

Un système d'e-mailing (Brevo, Gmail, Resend) sert à faire venir des prestataires et à débloquer le funnel « inscrit mais sans fiche ». **Tout est documenté à part** dans :

- `Desktop/campagne madaspot/GUIDE_PILOTAGE.md` — canaux, scripts, base de suivi, routine quotidienne, dépannage.
- `automation/stats.cjs` — voir les chiffres : `node automation/stats.cjs` (inscriptions, fiches avec/sans propriétaire).
- `automation/outreach/*.py` — les campagnes (relances froides + relances internes).
- `Desktop/campagne madaspot/outreach_tracking.db` — SQLite de suivi des envois.

Règles de com' : **jamais** « on crée la fiche pour vous » (les inciter à la créer eux-mêmes), élargir le funnel plutôt que relancer, chiffres réels uniquement, opt-out STOP.

---

## 15. Pièges connus (gotchas)

- **Build ignore les erreurs TypeScript** (`next.config.ts` → `typescript.ignoreBuildErrors:true`). Le typage est vérifié en CI, pas au build. Ne pas croire qu'un build vert = pas d'erreur de type.
- **Fiche pro = `pending_review`** à la création → invisible tant qu'un admin ne l'a pas approuvée. Étape facile à oublier dans le suivi de conversion.
- **`moderationStatus` / `Booking.status` sont des strings** (pas d'enum) → risque de typo silencieuse.
- **Protection des pages = côté client** ; la vraie sécurité est dans les routes API. Ne jamais supposer qu'une page est protégée sans guard API.
- **Deux systèmes de session** (user `mada-spot-session` vs admin `mada-spot-admin-session`) — ne pas les confondre.
- **`images`/`gallery`/`amenities` sont des colonnes JSON stockées en String** → toujours parser/sérialiser.
- **Copie worktree** sous `.claude/worktrees/` : ignorer, travailler dans `src/`.
- **Upload : 5 fichiers max par requête** → le front découpe en lots.
- **Antivirus local casse parfois le TLS** des scripts d'envoi → relancer ou lancer depuis le VPS.

---

## 16. Par où commencer (checklist du 1er jour)

1. `npm install` puis lancer en local (`npm run dev`) avec une base de test.
2. Ouvrir **Prisma Studio** (`npm run db:studio`) et explorer `User` et `Establishment`.
3. Lire `prisma/schema.prisma` (au moins User, Establishment + tables filles, EstablishmentClaim, EstablishmentReview).
4. Créer un compte pro sur le site local, créer une fiche via `/dashboard/etablissement`, observer qu'elle naît `pending_review`.
5. Se connecter en admin (`/admin`), l'approuver, la voir passer en ligne.
6. Parcourir `src/lib/auth/` (comment marche la session) et `src/app/api/upload/route.ts` (comment marche l'upload).
7. Lire `GUIDE_PILOTAGE.md` pour la partie acquisition, lancer `node automation/stats.cjs`.
