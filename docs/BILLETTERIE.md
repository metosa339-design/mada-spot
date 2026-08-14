# Billetterie digitale MadaSpot

Module de billetterie événementielle intégré au stack existant (Next.js 16 +
Prisma + PostgreSQL + auth maison). Aucune dépendance Supabase : la cohérence
d'authentification et d'ORM du site est préservée.

## Parcours de bout en bout

```
Organisateur                 Client                         Contrôle
────────────                 ──────                         ────────
/organizer/events            /evenements/[slug]             /scan
 └─ crée types de billets      └─ sélecteur + stock direct    └─ préchargement offline (Dexie)
                               └─ « Acheter Web » / WhatsApp   └─ décodage QR (Web Worker)
/organizer/dashboard         /checkout                       └─ code 6 chiffres (secours)
 └─ KPIs, canaux               └─ USSD push, timer 15 min      └─ auto-sync cloud
/organizer/payouts           webhook Mobile Money
 └─ solde, virements           └─ idempotent, commissions     Guichet POS
                               └─ WhatsApp → SMS → PWA         /pos
Admin                        /mes-billets                     └─ vente espèces
/admin/billetterie             └─ QR + code, hors-ligne        └─ crédit portefeuille
 └─ rôles, POS, virements,     └─ revente prix officiel
    litiges, analytics
```

## Modèle de données (Prisma)

- `TicketType` — catégories de billets d'un événement (prix, quotas, `maxPerOrder`, `salesEnd`).
- `TicketOrder` — commande (idempotencyKey unique, commissions, statut de paiement, canal, expiration).
- `EventTicket` — billet nominatif (`qrHash` unique, `securityCode` à 6 chiffres, scan, revente).
- `PosWallet` — portefeuille de caisse d'un vendeur (solde, commissions, plafond).
- `PayoutRequest` — demande de virement organisateur.
- `TicketingConfig` — ligne unique : commissions plateforme/POS, minimum de retrait, TTL réservation.
- Enums : `TicketPaymentStatus`, `TicketPaymentMethod`, `PayoutStatus`. Rôles ajoutés à `UserRole` : `ORGANIZER`, `AGENT`, `POS_VENDOR`.

### Réservation atomique (anti-survente)

Fonctions SQL `reserve_tickets(ticketTypeId, qty)` et `release_tickets(...)`
(`SELECT … FOR UPDATE`), appelées dans la transaction de création de commande.
Migration : `prisma/migrations/20260814120000_add_ticketing/`.

## Rôles

| Rôle | Accès |
|------|-------|
| `CLIENT` | achat, `/mes-billets` |
| `ORGANIZER` | `/organizer/*` (ses événements soumis) |
| `AGENT` | `/scan` (manifeste + sync) |
| `POS_VENDOR` | `/pos` (vente espèces) |
| `ADMIN` | `/admin/billetterie` (tout) |

L'attribution des rôles se fait dans **/admin/billetterie → Rôles**.

## Points d'API principaux

- `POST /api/ticketing/orders` — création de commande (réservation atomique).
- `GET /api/ticketing/orders/[id]` — statut (polling USSD).
- `GET /api/ticketing/orders/[id]/tickets` — billets d'une commande payée.
- `POST /api/ticketing/tickets/[id]/resale` — revente au prix officiel.
- `POST /api/webhooks/mobile-money` — règlement (idempotent, signature HMAC).
- `POST /api/cron/release-expired-orders` — libère les stocks expirés (CRON_SECRET).
- `GET /api/ticketing/scan/manifest` · `POST /api/ticketing/scan/sync` — scanner.
- `/api/organizer/*` — événements, types de billets, dashboard, payouts.
- `/api/pos/*` — événements vendables, vente au guichet.
- `/api/admin/ticketing/*` — users/rôles, pos, payouts, search, refund, tickets, analytics.

## Variables d'environnement (voir `.env.example`)

`MOBILE_MONEY_WEBHOOK_SECRET`, `TICKET_QR_SECRET`, `CRON_SECRET`,
`GREEN_API_URL`, `GREEN_API_TOKEN`, `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER`,
`NEXT_PUBLIC_WHATSAPP_NUMBER`. Toutes optionnelles : dégradation propre en dev.

## Démarrage / démo

```bash
npm install
npx prisma migrate deploy   # applique la migration billetterie
npm run db:seed:ticketing   # organisateur + agent + POS + événement billetté
```

Comptes de démo (mot de passe commun `MadaSpot2026!`) :
`organisateur.demo@madaspot.mg`, `agent.demo@madaspot.mg`, `pos.demo@madaspot.mg`.
Événement : `/evenements/concert-demo-madaspot`.

## Limites connues / à brancher

- **APIs opérateurs réelles** (MVola/Orange/Airtel, Green API, SMS) : intégrées
  via variables d'env, format de payload à adapter à chaque fournisseur.
- **Mesh Bluetooth/Wi-Fi Direct** (scanner) : non implémenté — non fiable en PWA
  navigateur ; l'offline-first + auto-sync le prépare, un vrai mesh exige du natif.
- **Chiffrement au repos** du manifeste scanner : signature d'intégrité fournie ;
  un vrai chiffrement AES nécessiterait une clé d'appareil.
- **Exécution réelle des virements** : le statut EXECUTED est posé par l'admin ;
  le transfert Mobile Money effectif reste à automatiser.
