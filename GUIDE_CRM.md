# Blueprint CRM complet — Mada Spot

> Rédigé comme une spécification de CRM par un spécialiste. Objectif : lister **tout** ce qu'un CRM complet doit contenir pour Mada Spot, mappé à ce qui existe déjà dans le code, avec l'écart à combler et un ordre de construction.
> Dernière mise à jour : 06/07/2026.

---

## 0. Cadrage : à quoi sert le CRM de Mada Spot

Mada Spot est une **place de marché à deux faces**. Le CRM doit donc gérer **deux relations** :

1. **Les prestataires** (hôtels, restos, activités, prestataires de service) = les **comptes/contacts** au sens CRM. C'est le cœur commercial : les faire venir (prospect), les convertir (inscription), les activer (fiche créée + validée), les fidéliser (fiche à jour, premium, réservations).
2. **Les voyageurs** (`CLIENT`) = les utilisateurs finaux. On les gère surtout côté **support, avis, fidélité, notifications**.

Le CRM est utilisé par l'**équipe commerciale/admin** depuis le back-office (`/admin`). Un prestataire, lui, gère sa propre fiche depuis son **dashboard** (`/dashboard`) — ce n'est pas le CRM, mais le CRM doit refléter et piloter cette activité.

**Le funnel de référence (à instrumenter partout) :**
```
Prospect → Contacté → Engagé → Inscrit (compte) → Fiche créée → Fiche VALIDÉE (admin) → Fiche complète → Actif (réservations/avis) → Premium/Boosté → [Churn]
```
⚠️ Étape souvent oubliée : une fiche créée par un pro naît en `moderationStatus: pending_review` → **invisible tant qu'un admin ne l'a pas approuvée**. Le CRM doit tracker cette étape.

### Légende de l'analyse d'écart
- ✅ **Existe** — modèle + API + UI présents dans le code.
- 🟡 **Partiel** — la donnée/API existe, l'UI ou l'automatisation manque.
- 🔴 **À construire** — rien encore.

---

## 1. Fondations : contacts & vue 360°

**Ce qu'un CRM complet doit contenir :**
- Une **fiche contact unique** par prestataire ET par prospect, avec coordonnées, entreprise, ville, langue, canal préféré, opt-in.
- Une **vue 360°** : timeline de toutes les interactions (e-mails, messages, appels, notes, réservations, avis, changements de statut).
- **Déduplication** (un même établissement ne doit pas exister en double comme prospect + user + fiche).
- **Attribution** : quel commercial « possède » le lead.

**État Mada Spot :**
- ✅ `Prospect` (contact non inscrit) : email/phone/company, ville, pays, locale, `source`, `status`, `score` (0–100), `preferredChannel`, opt-in email/messenger, `ownerId` (admin propriétaire), `convertedToUserId` (lien vers le compte une fois inscrit). Routes `api/admin/crm/prospects`, `.../clients`.
- ✅ `User` (contact inscrit) + `ClientProfile` (companyName, NIF, STAT, ville).
- ✅ `ContactNote` (notes internes, épinglables) — routes `.../crm/notes`.
- 🟡 **Vue 360° / timeline unifiée** : les briques existent (conversations, notes, follow-ups, bookings, reviews) mais **agrégées dans une seule timeline par contact = à assembler** dans l'UI (`CRMSection.tsx`).
- 🔴 **Déduplication prospect↔user↔establishment** : pas de lien automatique prospect→fiche. Il faut relier via l'e-mail (le prospect converti pointe le user ; le user possède la fiche via `claimedByUserId`). À industrialiser (module Doublons existe côté fiches : `DuplicateDetector`).

---

## 2. Pipeline commercial (prospects & leads)

**Ce qu'un CRM complet doit contenir :**
- Des **étapes de pipeline** claires et un **tableau Kanban** (glisser-déposer entre étapes).
- **Lead scoring** (chaud/froid) automatique.
- **Sources** tracées (d'où vient le lead).
- **Conversion** mesurée par étape (taux, temps moyen).

**État Mada Spot :**
- ✅ `ProspectStatus` : `NEW → CONTACTED → ENGAGED → QUALIFIED → CONVERTED` (+ `UNRESPONSIVE`, `UNSUBSCRIBED`, `REJECTED`). C'est déjà un vrai pipeline.
- ✅ `ProspectSource` : `NEWSLETTER`, `CONTACT_FORM`, `CSV_IMPORT`, `MESSENGER`, `MANUAL`, `EVENT`, `REFERRAL`, `OTHER`.
- ✅ `score` (0–100), `contactAttempts`, `lastContactedAt`, `lastInboundAt`, `convertedAt`.
- ✅ Stats : `api/admin/crm/stats`.
- 🟡 **Vue Kanban drag-and-drop** : le statut existe, l'affichage en colonnes déplaçables est à vérifier/finir dans `CRMSection.tsx`.
- 🔴 **Scoring automatique** : le champ `score` existe mais **le calcul automatique** (ouverture e-mail, clic, réponse, visite) est à écrire. Aujourd'hui il est probablement manuel/à 0.
- 🔴 **Rapport de conversion par étape** (funnel analytics) : à construire (voir Module 13).

---

## 3. Segmentation & tags

**Ce qu'un CRM complet doit contenir :**
- **Tags libres** + **segments dynamiques** (filtres sauvegardés : « hôtels Nosy Be sans fiche », « restos inscrits < 50% complétude »).
- Usage des segments comme **cible d'un envoi groupé**.

**État Mada Spot :**
- ✅ `ContactTag` (nom, couleur, description) + `ContactTagAssignment` **polymorphe** (s'applique à un prospect OU un user). Routes `.../crm/tags`.
- 🟡 **Segments dynamiques** (requête sauvegardée) : à construire — aujourd'hui les segments sont des tags manuels. Un vrai CRM calcule le segment en direct (ex. tous les `userType=HOTEL` sans `claimedByUserId`).
- 🔗 Lien direct « segment → campagne » (Module 5) : 🔴 à construire.

---

## 4. Boîte de réception multicanal — RECEVOIR & RÉPONDRE

C'est le cœur de ta demande « recevoir et répondre aux clients ».

**Ce qu'un CRM complet doit contenir :**
- Une **inbox unifiée** qui agrège tous les canaux entrants : e-mail, Messenger, WhatsApp, SMS, chat du site, formulaire de contact.
- Chaque fil = une **conversation** rattachée à un contact, avec statut (ouvert/en attente/fermé), **assignation** à un commercial, marqueur non-lu.
- **Réponse depuis l'outil** (sans quitter le CRM), avec l'historique complet.
- **Pièces jointes**.

**État Mada Spot :**
- ✅ `Conversation` : multicanal (`ConversationChannel` = `EMAIL`, `MESSENGER`, `IN_APP`, `PHONE`, `WHATSAPP`, `SMS`), rattachée à un `User` **ou** un `Prospect`, avec `status` (`OPEN/PENDING/ON_HOLD/CLOSED`), `isUnread`, `assignedToId`, `lastMessagePreview`. Routes `.../crm/conversations`.
- ✅ `ConversationMessage` : `direction` (INBOUND/OUTBOUND), `content`, `attachments` (JSON), `authorAdminId`, statuts d'envoi (`isDelivered/isRead/errorMessage`).
- ✅ **Messenger entrant branché** : webhook `api/webhooks/messenger` + `src/lib/messenger.ts` (Meta), `messengerPsid` sur le prospect.
- ✅ **God Mode** (`GodModeMessaging`) : l'admin peut intervenir dans les conversations, avec audit.
- ✅ **Support inbox** (`AdminSupportInbox`) + tickets (`SupportTicket`).
- 🟡 **E-mail entrant → conversation** : l'inbox `contact@madaspot.com` (IMAP) existe côté scripts d'acquisition mais **n'est pas encore ingérée automatiquement** en `Conversation` INBOUND. À brancher (parser IMAP → créer/rattacher conversation).
- 🔴 **WhatsApp entrant/sortant** : le canal est dans l'enum mais **aucune intégration** (pas d'API WhatsApp Business connectée). Aujourd'hui WhatsApp = manuel depuis ton téléphone.
- 🔴 **Chat du site → conversation** : `BookingChatWidget` existe côté fiche, à relier au fil CRM.

---

## 5. Messagerie groupée / campagnes (envoi de masse)

Ta demande « faire un message groupé ».

**Ce qu'un CRM complet doit contenir :**
- Choisir un **segment** (Module 3) comme cible.
- **Composer** un message (e-mail HTML, ou message Messenger/WhatsApp) avec **variables de personnalisation** (`{prénom}`, `{type}`, `{ville}`).
- **Throttling** (plafond/jour) et respect des **opt-out**.
- **Suivi** : envoyés, ouverts, cliqués, réponses, désinscriptions.
- **A/B testing** de l'objet/message.

**État Mada Spot :**
- ✅ **Toute l'infra d'envoi existe déjà**, mais côté **scripts Python** (`automation/outreach/*.py`), pas dans l'UI admin : Brevo (froid, 300/j), Gmail (interne, 250/j), Resend (transactionnel), personnalisation, throttling, opt-out STOP, suivi SQLite (`outreach_tracking.db`). Voir `GUIDE_PILOTAGE.md`.
- ✅ Newsletter : `api/newsletter`, `NewsletterSubscriber`.
- 🔴 **UI de campagne dans le CRM** : sélectionner un segment → composer → envoyer → voir les stats, **tout dans `/admin`**. Aujourd'hui c'est en ligne de commande. C'est le plus gros chantier « confort » : faire remonter les scripts dans l'interface.
- 🟡 **Tracking ouvertures/clics** : le suivi « envoyé/erreur » existe ; ouvertures et clics par campagne sont à ajouter (pixel + liens trackés — Brevo les fournit déjà côté tableau de bord Brevo).

---

## 6. Séquences & relances automatiques

**Ce qu'un CRM complet doit contenir :**
- **Tâches de relance** avec échéance et responsable.
- **Séquences automatiques** : J+2 si pas de réponse → relance 1, J+5 → relance 2, etc., qui s'arrêtent dès que le contact répond ou convertit.
- **Rappels** (aujourd'hui à faire, en retard).

**État Mada Spot :**
- ✅ `FollowUp` : titre, description, `dueAt`, `status` (`PENDING/DONE/SKIPPED/OVERDUE`), `ownerId`. Routes `.../crm/follow-ups`.
- ✅ Relances manuelles multi-niveaux : `relance_1/2/3`, `relance_sansfiche`, `relance_completion`, `relance_corrige`… (scripts).
- ✅ Relances réservation : `api/cron/booking-relance`.
- 🔴 **Séquences automatiques pilotées par événement** (arrêt auto si réponse/conversion) : à construire (moteur de règles). Aujourd'hui les relances sont déclenchées à la main.
- 🟡 **File de tâches du jour** (« mes relances à faire ») dans l'UI : le modèle existe, l'écran est à finir.

---

## 7. Gestion de chaque fiche (établissement)

Ta demande « gestion de chaque fiche, rajout image, rajout documents ».

**Ce qu'un CRM complet doit contenir :**
- Voir/éditer **chaque fiche** depuis le CRM (au nom du prestataire si besoin).
- **Ajouter des images** (couverture + galerie).
- **Ajouter/valider des documents** (justificatifs légaux).
- **Cycle de vie** : brouillon → en revue → approuvée/refusée.
- **Complétude** (jauge) et **qualité/trust score**.
- Gestion des **doublons** et **fiches fantômes**.

**État Mada Spot :**
- ✅ Édition de fiche (6 onglets) côté pro : `dashboard/etablissement`. Côté admin : `EstablishmentModerationList`, `api/admin/establishments`, édition champ à champ `api/admin/establishments/[id]`.
- ✅ **Images** : `api/upload` → Cloudinary (`madaspot/<type>`), 5 fichiers/lot, couverture + galerie (20) avec légendes.
- ✅ **Documents** : `VerificationDocument` (NIF, STAT, licence, CIN) via `dashboard/verification`, validés par l'admin (`VerificationReview`). Pro « vérifié » à ≥2 docs `VERIFIED`.
- ✅ **Modération** : `moderationStatus` (`pending_review/approved/rejected`), approbation force `isActive=true`.
- ✅ **Fiches fantômes** (`isGhost`) + invitation à revendiquer (Ghost-Hunter, `invitationToken`).
- ✅ **Doublons** : `DuplicateDetector` + `api/admin/duplicates/merge`.
- ✅ **Trust score** : champ `trustScore` + `api/admin/trust-score`.
- 🟡 **Édition de fiche au nom du prestataire depuis le CRM** (impersonation) : `AccountSimulation` + `api/admin/impersonate` existent → à relier au flux CRM.
- 🟡 **Jauge de complétude côté admin** : le calcul existe côté relance (script `completion`), à exposer dans la fiche CRM comme indicateur permanent.

---

## 8. Réservations (voir les réservations en cours & les gérer)

Ta demande « gérer les réservations, voir les réservations en cours ».

**Ce qu'un CRM complet doit contenir :**
- **Liste des réservations** filtrable par statut (en cours, à venir, passées, annulées).
- **Détail** d'une réservation, changement de statut (confirmer/annuler).
- **Calendrier** de disponibilité et **tarifs saisonniers**.
- **Relances** (demande sans réponse) et **avis post-séjour**.

**État Mada Spot :**
- ✅ `Booking` : `checkIn/checkOut`, `status`, `reference` unique, relances auto, lien vers avis. APIs `api/bookings`, `api/dashboard/reservations`, admin `BookingManagement`.
- ✅ Le pro voit/accepte/refuse depuis `dashboard/reservations` (et inline sur le dashboard hôtel : `PATCH /api/dashboard/reservations/{id}`).
- ✅ **Calendrier & dispo** : `dashboard/calendrier`, `api/dashboard/availability`, `Availability`, `SeasonalPricing`, `api/dashboard/pricing`.
- ✅ **Relance réservation** : `api/cron/booking-relance` (relance prestataire + voyageur).
- ✅ **Avis lié à une réservation** : `Booking` ↔ `EstablishmentReview.bookingId` (avis vérifié).
- 🟡 **Vue admin « toutes les réservations en cours »** transversale (tous établissements) : `BookingManagement` existe → vérifier les filtres statut/date.

---

## 9. Avis & réputation

**Ce qu'un CRM complet doit contenir :**
- Collecte d'avis, **réponse du propriétaire**, **modération**, **signalement**.
- Suivi de la **note moyenne** et alertes sur avis négatifs.

**État Mada Spot :**
- ✅ `EstablishmentReview` (note, commentaire, photos, `ownerResponse`), vote utile, signalement (`isFlagged`), modération admin (`ReviewModeration` : publier/masquer/supprimer/lever le flag, audité).
- ✅ Le pro répond depuis `dashboard/avis`.
- 🟡 **Alerte proactive avis négatif** (notif au commercial quand une fiche reçoit ≤2★) : à ajouter.

---

## 10. Marketing & visibilité — promotions, publicités, boosts

Ta demande « faire des promotions, ajouter les publicités, gérer les boosts (qui passe en premier) ».

### 10.1 Promotions
- ✅ `Promotion` + `api/promotions`, `api/establishments/[id]/promotions`, `dashboard/promotions`. Bannières `PromoBanner` / `FomoBanner` sur les fiches. Page publique `/offres`.
- 🟡 **Création de promo depuis le CRM** (au nom d'un pro, ciblée) : à relier.

### 10.2 Publicités
- ✅ `Advertisement` : `position` (top_banner / sidebar_top/middle/bottom / mobile_banner / mobile_square), `format`, `imageUrl`, `linkUrl`, `isActive`, **`priority`** (plus haut = affiché en premier), **planification** `startDate/endDate`, métriques `impressions/clicks`. Composants `TopAdBanner`, routes `api/ads` (+`/click`), admin `api/admin/ads`.
- 🟡 **UI de gestion des pubs** (uploader visuel, planning, stats par emplacement) : à finaliser côté `/admin`.

### 10.3 Boosts / classement (« qui passe en premier »)
C'est le levier de monétisation. Trois leviers déjà en base sur `Establishment` :
- ✅ `isFeatured` (mis en avant), `isPremium` (compte premium), `displayOrder` (ordre manuel), `viewCount`, `trustScore`.
- ✅ **RankingManager** + `api/admin/ranking` : piloter l'ordre d'affichage.
- 🔴 **Offre de boost payante formalisée** : « payez pour passer en tête X jours » — la mécanique technique existe (`isFeatured` + `displayOrder` + planification comme les pubs), mais **le produit commercial** (durée, prix, expiration auto du boost) est à définir et à outiller. Recommandation : un modèle `Boost` (establishmentId, type, startDate, endDate, prix, statut) qui pilote `isFeatured/displayOrder` et **expire tout seul**, sur le modèle de `Advertisement`.

---

## 11. Contenu éditorial — articles, événements, newsletter

Ta demande « faire des publications d'article ».

**Ce qu'un CRM/back-office complet doit contenir :**
- **Éditeur d'articles** (blog) avec brouillon/publication/planification, catégories, SEO, image de couverture.
- **Événements** (agenda).
- **Newsletter**.

**État Mada Spot :**
- ✅ **Blog** : `Article` + `ArticleCategory`, éditeur riche **TipTap**, `BlogManager` (admin), `api/articles`, pages `/blog` + `/blog/[slug]`. Automatisations : `api/cron/enhance-articles`, `sync-rss`, `RSSSource`, IA (`GROQ_API_KEY`, Gemini).
- ✅ **Événements** : `Event` + `EventCalendar` (admin), `api/events`, `/evenements` (+ soumission).
- ✅ **Newsletter** : `api/newsletter`, `NewsletterSubscriber`, section d'inscription sur l'accueil.
- ✅ **Autres contenus Live Ops** : pharmacies de garde, urgences, alertes météo (`LiveOpsPanel`), taux de change, contenus histoire/économie.
- 🟡 **Planification/calendrier éditorial** unifié (voir tout le contenu à venir) : à assembler.

---

## 12. Fidélité & engagement

**Ce qu'un CRM complet doit contenir :**
- Programme de **points/paliers**, **badges**, récompenses.
- Suivi de l'engagement (dernière visite, fréquence).

**État Mada Spot :**
- ✅ `loyaltyPoints`, `LoyaltyTransaction`, `UserBadge`/`BadgeType`, `api/client/loyalty`, `api/dashboard/badges`.
- 🟡 **Paliers/récompenses côté prestataire** (ex. badge « superhost », avantages) : à définir comme offre.

---

## 13. Pilotage — dashboards, analytics, exports, audit

**Ce qu'un CRM complet doit contenir :**
- **Dashboard KPIs** : funnel (prospects→inscrits→fiches→actifs), taux de conversion, activité de l'équipe, revenus (pubs/boosts).
- **Analytics** : vues, clics sortants, tendances de recherche, heatmap.
- **Exports** CSV et **rapports**.
- **Journal d'audit**.

**État Mada Spot :**
- ✅ `AdminDashboardOverview`, `ClickAnalytics`, `SEOTrends`, `AdminHeatmap`, `api/admin/stats` (`/clicks`, `/heatmap`, `/search-trends`), `EstablishmentView`, `OutboundClick`, `SearchLog`, `track-click`.
- ✅ **Exports** : `api/admin/export?type=users|establishments|bookings|reviews`.
- ✅ **Audit** : `AuditLog` + `logAudit` (actions de modération/admin).
- ✅ **Stats de croissance** : `automation/stats.cjs`.
- 🔴 **Dashboard funnel commercial** (prospect→converti par source, avec taux et temps) : les données existent (`Prospect`, statuts, dates), le **tableau de bord dédié est à construire**.
- 🔴 **Revenus** (pubs + boosts + premium) : à suivre dès que le boost payant est formalisé.

---

## 14. Administration, conformité & sécurité

**Ce qu'un CRM complet doit contenir :**
- **Gestion des utilisateurs** (rechercher, bannir, réactiver, impersonation).
- **Rôles & permissions**, **2FA**.
- **Conformité** (RGPD, opt-out, suppression de compte).
- **Anti-fraude / anti-contournement**.
- **Support / tickets**.
- **Import** de données.

**État Mada Spot :**
- ✅ `UserManagement` (bannir/débannir, message direct), **impersonation** (`api/admin/impersonate`), `AccountSimulation`.
- ✅ **Rôles** `CLIENT/ADMIN`, **2FA TOTP admin**, sessions séparées (cookie admin 24 h), rate-limiting, CSRF.
- ✅ **Conformité** : `ComplianceTracker`, opt-out (STOP + `unsubscribedAt`), suppression de compte (`api/auth/delete-account`), `api/admin/audit`, `cleanup`, `purge-archived`.
- ✅ **Anti-contournement** : `MessageScanAlert` + `MessageScanAlerts` (détecte l'échange de coordonnées hors plateforme).
- ✅ **Support** : `SupportTicket` + `SupportTicketManager`.
- ✅ **Import** : `ImportSection`, `api/admin/import/*` (CSV, batches, template), `ImportBatch`.

---

## 15. Récapitulatif — tableau de maturité

| Module | Modèle/API | UI admin | Auto | Verdict |
|---|---|---|---|---|
| 1. Contacts / vue 360° | ✅ | 🟡 | — | timeline à assembler |
| 2. Pipeline prospects | ✅ | 🟡 | 🔴 | Kanban + scoring auto |
| 3. Segmentation/tags | ✅ | 🟡 | 🔴 | segments dynamiques |
| 4. Inbox multicanal | ✅ | ✅ | 🟡 | ingérer e-mail IMAP + WhatsApp |
| 5. Envoi groupé | ✅ (scripts) | 🔴 | 🟡 | remonter dans /admin |
| 6. Relances/séquences | ✅ | 🟡 | 🔴 | moteur de séquences |
| 7. Gestion des fiches | ✅ | ✅ | 🟡 | complétude visible |
| 8. Réservations | ✅ | ✅ | ✅ | ok |
| 9. Avis | ✅ | ✅ | 🟡 | alerte avis négatif |
| 10. Promo/pub/boost | ✅ | 🟡 | 🟡 | **boost payant à formaliser** |
| 11. Articles/contenu | ✅ | ✅ | ✅ | ok |
| 12. Fidélité | ✅ | 🟡 | — | offre prestataire |
| 13. Analytics/pilotage | ✅ | 🟡 | — | **dashboard funnel** |
| 14. Admin/conformité | ✅ | ✅ | ✅ | ok |

**Conclusion de spécialiste :** l'ossature CRM de Mada Spot est **déjà là à ~70 %** (modèles + APIs + back-office riche). Les vrais manques ne sont pas la fondation mais **4 chantiers de valeur** :

---

## 16. Feuille de route priorisée (ce qu'il faut construire)

**P1 — Impact commercial immédiat**
1. **UI de campagne dans /admin** (Module 5) : segment → composer → envoyer (Brevo/Gmail) → stats. Remonte les scripts Python dans l'interface. *C'est ce qui te fait gagner du temps chaque jour.*
2. **Dashboard funnel** (Module 13) : prospect→inscrit→fiche→validée→actif, par source, avec taux. *Pour piloter au chiffre.*

**P2 — Conversion & rétention**
3. **Séquences de relance automatiques** (Module 6) : arrêt auto si réponse/conversion.
4. **Vue 360° / timeline** par contact (Module 1) + **scoring auto** (Module 2).
5. **Ingestion e-mail entrant** `contact@madaspot.com` → conversations (Module 4).

**P3 — Monétisation**
6. **Boost payant formalisé** (Module 10.3) : modèle `Boost` qui pilote `isFeatured/displayOrder` avec expiration auto + suivi des revenus.
7. **UI pubs** complète (uploader, planning, stats par emplacement).

**P4 — Canaux & polish**
8. **WhatsApp** (Module 4) : aujourd'hui manuel ; API WhatsApp Business si le volume le justifie (attention au bannissement en envoi à froid).
9. **Segments dynamiques** + **calendrier éditorial** unifié.

> Règle de com' (rappel, s'applique au CRM) : jamais « on crée la fiche pour vous » ; inciter à créer eux-mêmes ; chiffres réels ; opt-out systématique. Voir `GUIDE_PILOTAGE.md`.
