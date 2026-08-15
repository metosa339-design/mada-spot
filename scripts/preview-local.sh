#!/usr/bin/env bash
# =============================================================================
# Mada Spot — Aperçu local de la billetterie, en une commande.
#
#   bash scripts/preview-local.sh
#
# Ce script prépare une base PostgreSQL, applique le schéma + les fonctions
# atomiques de billetterie, injecte des données de démo, puis lance l'app.
# Ouvre ensuite  http://localhost:3000  dans ton navigateur.
#
# Base de données :
#   - Si DATABASE_URL est défini, il est utilisé tel quel.
#   - Sinon, si Docker est disponible, un PostgreSQL 16 local est démarré
#     (docker-compose.preview.yml).
#   - Sinon, le script s'arrête en expliquant quoi faire.
#
# Compte admin (optionnel) : définis ADMIN_EMAIL et ADMIN_PASSWORD pour créer
# un administrateur et accéder à /admin/billetterie.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
info() { printf '\033[36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[32m✅ %s\033[0m\n' "$*"; }
warn() { printf '\033[33m⚠ %s\033[0m\n' "$*"; }

# --- 1) Base de données -------------------------------------------------------
if [[ -z "${DATABASE_URL:-}" ]]; then
  if command -v docker >/dev/null 2>&1; then
    info "Démarrage d'un PostgreSQL local via Docker…"
    docker compose -f docker-compose.preview.yml up -d
    info "Attente de la disponibilité de la base…"
    for i in $(seq 1 30); do
      if docker exec madaspot-preview-db pg_isready -U mada -d mada_spot >/dev/null 2>&1; then break; fi
      sleep 1
    done
    export DATABASE_URL="postgresql://mada:mada@localhost:5432/mada_spot"
    export DIRECT_DATABASE_URL="$DATABASE_URL"
    ok "Base prête : $DATABASE_URL"
  else
    warn "DATABASE_URL non défini et Docker introuvable."
    echo "   Fournis une base PostgreSQL, par exemple :"
    echo "   DATABASE_URL='postgresql://user:pass@localhost:5432/mada_spot' bash scripts/preview-local.sh"
    exit 1
  fi
else
  export DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"
  ok "Utilisation de DATABASE_URL fourni."
fi

# --- 2) Dépendances + client Prisma ------------------------------------------
if [[ ! -d node_modules ]]; then
  info "Installation des dépendances (npm install)…"
  npm install
fi
info "Génération du client Prisma…"
npx prisma generate >/dev/null

# --- 3) Schéma + fonctions atomiques -----------------------------------------
info "Synchronisation du schéma (prisma db push)…"
npx prisma db push --skip-generate

info "Application des fonctions SQL de billetterie (reserve_tickets/release_tickets)…"
FUNCS_SQL="$(sed -n '/CONTRAINTE LIGNE UNIQUE/,$p' prisma/migrations/20260814120000_add_ticketing/migration.sql)"
if command -v psql >/dev/null 2>&1; then
  # psql gère nativement le plpgsql multi-instructions (dollar-quoting).
  printf '%s\n' "$FUNCS_SQL" | psql "$DATABASE_URL" >/dev/null
elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q madaspot-preview-db; then
  printf '%s\n' "$FUNCS_SQL" | docker exec -i madaspot-preview-db psql -U mada -d mada_spot >/dev/null
else
  printf '%s\n' "$FUNCS_SQL" | npx --yes prisma db execute --stdin --url "$DATABASE_URL" >/dev/null
fi
ok "Fonctions atomiques en place."

# --- 4) Données de démo -------------------------------------------------------
info "Injection des données de démo (organisateur, agent, POS, événement)…"
npm run db:seed:ticketing

# --- 5) Admin (optionnel) -----------------------------------------------------
if [[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
  info "Création/mise à jour du compte admin ${ADMIN_EMAIL}…"
  npx tsx scripts/set-admin-password.ts || warn "Création admin ignorée."
else
  warn "ADMIN_EMAIL/ADMIN_PASSWORD non fournis → régie /admin/billetterie non accessible."
  echo "   Pour l'activer : ADMIN_EMAIL='toi@mg' ADMIN_PASSWORD='MotDePasseFort123!' bash scripts/preview-local.sh"
fi

# --- 6) Build + démarrage -----------------------------------------------------
info "Build de production…"
npm run build

cat <<BANNER

──────────────────────────────────────────────────────────────
  Aperçu prêt →  http://localhost:${PORT}
──────────────────────────────────────────────────────────────
  Événement billetté : http://localhost:${PORT}/evenements/concert-demo-madaspot
  Comptes de démo (mot de passe : MadaSpot2026!)
    • Organisateur : organisateur.demo@madaspot.mg   → /organizer
    • Agent (scan) : agent.demo@madaspot.mg           → /scan
    • Vendeur POS  : pos.demo@madaspot.mg             → /pos
$( [[ -n "${ADMIN_EMAIL:-}" ]] && echo "    • Admin        : ${ADMIN_EMAIL}                     → /admin/billetterie" )
──────────────────────────────────────────────────────────────

BANNER

info "Démarrage du serveur (Ctrl+C pour arrêter)…"
exec npm run start -- -p "$PORT"
