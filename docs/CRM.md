# CRM Mada Spot

CRM intégré dans l'admin (`/admin` → onglet **CRM**) qui regroupe :

- **Vue d'ensemble** : KPI clients, prospects, conversations, suivis en retard.
- **Boîte de réception unifiée** : email, Facebook Messenger, chat interne, sur le même fil.
- **Clients** : tous les `User` role=CLIENT, avec stats (réservations, conversations, points fidélité).
- **Prospects** : contacts non-inscrits (newsletter, formulaire, import CSV, Messenger).
- **Suivis** : tâches/relances datées.

## Modèles Prisma ajoutés

`Prospect`, `Conversation`, `ConversationMessage`, `ContactTag`, `ContactTagAssignment`, `ContactNote`, `FollowUp`.

## Routes API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/admin/crm/stats` | KPI dashboard CRM |
| GET POST | `/api/admin/crm/clients` | Liste clients enrichis |
| GET POST | `/api/admin/crm/prospects` | Liste / création prospect |
| GET PATCH DELETE | `/api/admin/crm/prospects/[id]` | Détail / màj / suppression |
| POST | `/api/admin/crm/prospects/import` | Import CSV ou import depuis newsletter |
| GET POST | `/api/admin/crm/conversations` | Inbox unifiée multi-canal |
| GET PATCH | `/api/admin/crm/conversations/[id]` | Détail conversation + statut/assignation |
| POST | `/api/admin/crm/conversations/[id]/messages` | **Envoyer un message** (route le canal email/Messenger/chat) |
| GET POST DELETE | `/api/admin/crm/tags` | Tags / segments |
| GET POST PATCH DELETE | `/api/admin/crm/notes` | Notes internes |
| GET POST PATCH DELETE | `/api/admin/crm/follow-ups` | Tâches de relance |
| GET POST | `/api/webhooks/messenger` | Webhook Meta (vérification + réception) |

## Variables d'environnement

Ajoute dans `.env` :

```env
# Facebook Messenger / Meta
META_PAGE_ACCESS_TOKEN="EAAG..."   # Page access token (Meta Business → Pages → Settings → Page Access Tokens)
META_VERIFY_TOKEN="un-secret-de-ton-choix"  # Doit matcher la valeur saisie dans Meta Developer Dashboard
META_APP_SECRET="..."              # Meta App secret — sert à valider la signature X-Hub-Signature-256
META_GRAPH_VERSION="v21.0"         # Optionnel, défaut v21.0
```

### Configuration côté Meta

1. Crée (ou utilise) une App Meta + une Page Facebook liée à Mada Spot.
2. Ajoute le produit **Messenger** à l'app.
3. Configure le **Webhook** :
   - URL: `https://madaspot.com/api/webhooks/messenger`
   - Verify token : la valeur de `META_VERIFY_TOKEN`
   - Subscription fields : `messages`, `messaging_postbacks`, `message_reads`, `message_deliveries`
4. Souscris la page au webhook.
5. Récupère un **Page Access Token** (long-lived) → `META_PAGE_ACCESS_TOKEN`.
6. Récupère l'**App secret** → `META_APP_SECRET`.

## Migration de la base

Après pull du code :

```bash
npx prisma generate
npx prisma migrate dev -n add_crm_models
```

En prod (Postgres déjà en service) :

```bash
npx prisma migrate deploy
```

## Capture des prospects

Sources actuellement câblées :

- **Newsletter** : tout abonné `NewsletterSubscriber` peut être importé en 1 clic dans l'onglet Prospects.
- **Messenger** : tout message reçu sur la page FB crée automatiquement un `Prospect` (avec PSID + nom Facebook) et une `Conversation` MESSENGER.
- **CSV** : import via l'UI (format `email,firstName,lastName,phone,company,city`).
- **Manuel** : création depuis l'admin.

À étendre plus tard :
- Le `ContactForm` (`/api/contact`) pourrait créer un `Prospect` + une `Conversation` EMAIL automatiquement.
- Les emails entrants (`reply-to`) → nécessite un fournisseur inbound (Postmark, SendGrid Inbound Parse, Mailgun Routes).

## Envoi de messages

L'endpoint `POST /api/admin/crm/conversations/[id]/messages` route automatiquement vers :

- **EMAIL** → `sendNotification` (template `message_new`, SMTP existant).
- **MESSENGER** → `sendMessengerMessage` via Send API (`/me/messages`).
- **IN_APP** → crée un `Message` standard (utilise la messagerie déjà en place).

Le statut d'envoi est stocké dans `ConversationMessage.isDelivered` / `errorMessage`.
