# Runbook — migration Neon → PostgreSQL sur le VPS

## Pourquoi

Le VPS fait tourner Next.js en continu sous PM2 avec un pool Prisma persistant. Neon
facture du temps de calcul et met l'endpoint en veille au bout de cinq minutes sans
activité : un serveur toujours allumé ne s'endort jamais, donc consomme près de 720 h
de compute par mois quand le plan Free en alloue environ 192. Le quota tombe à zéro
une dizaine de jours après chaque reset, et le site se vide.

Héberger Postgres sur la même machine que l'application supprime le quota, supprime
la panne mensuelle, et fait tomber la latence de ~100 ms (aller-retour vers
`us-east-1`) à ~1 ms par requête.

## Prérequis

- Accès SSH root au VPS `82.165.65.111`.
- **La base Neon doit répondre** : impossible de dumper une base dont le quota est
  épuisé. Il faut donc être dans une fenêtre où le quota est disponible (après un
  reset de cycle, ou pendant un mois payant).
- Une fenêtre calme, idéalement la nuit à Madagascar.

## Étape 1 — Installer PostgreSQL sur le VPS

```bash
apt update && apt install -y postgresql postgresql-contrib
systemctl enable --now postgresql
psql --version   # noter la version majeure, doit être >= 14
```

Créer la base et le rôle applicatif :

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE madaspot WITH LOGIN PASSWORD 'REMPLACER_PAR_UN_MOT_DE_PASSE_FORT';
CREATE DATABASE madaspot OWNER madaspot;
GRANT ALL PRIVILEGES ON DATABASE madaspot TO madaspot;
SQL
```

Postgres n'écoute que sur `localhost` par défaut : le laisser ainsi. Aucune règle de
pare-feu à ouvrir, l'application tourne sur la même machine.

## Étape 2 — Dumper Neon

Toujours utiliser `DIRECT_DATABASE_URL` (l'URL **sans** `-pooler`) : `pg_dump` ne
fonctionne pas correctement à travers pgbouncer.

```bash
cd /root/mada-spot
export NEON_URL="$(grep '^DIRECT_DATABASE_URL' .env | cut -d'"' -f2)"
pg_dump "$NEON_URL" --no-owner --no-acl --format=custom -f /root/neon-$(date +%F).dump
ls -lh /root/neon-*.dump   # vérifier que la taille est plausible, pas quelques Ko
```

Si `pg_dump` refuse pour cause de version, installer le client correspondant à la
version majeure de Neon plutôt que de forcer.

## Étape 3 — Restaurer en local

```bash
pg_restore --no-owner --no-acl -U madaspot -h localhost -d madaspot /root/neon-*.dump
```

Contrôle immédiat, sur les tables qui portent le contenu visible :

```bash
psql -U madaspot -h localhost -d madaspot -c \
  'SELECT (SELECT count(*) FROM "Establishment") AS etabs,
          (SELECT count(*) FROM "User") AS users,
          (SELECT count(*) FROM "Article") AS articles;'
```

Comparer avec les mêmes comptages sur Neon **avant** de basculer. Si un chiffre ne
correspond pas, ne pas continuer.

## Étape 4 — Basculer l'application

Sauvegarder l'ancien `.env` d'abord, c'est le chemin de retour arrière :

```bash
cd /root/mada-spot
cp .env .env.neon-backup
```

Remplacer les deux URLs. Sur une base locale, pooler et direct pointent au même
endroit :

```
DATABASE_URL="postgresql://madaspot:MOT_DE_PASSE@localhost:5432/madaspot?schema=public&connection_limit=10"
DIRECT_DATABASE_URL="postgresql://madaspot:MOT_DE_PASSE@localhost:5432/madaspot?schema=public"
```

Aligner le schéma, rebuilder, relancer :

```bash
npx prisma migrate deploy
npm run build
pm2 reload madaspot
pm2 logs madaspot --lines 40
```

## Étape 5 — Vérifier

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://madaspot.com/api/bons-plans/establishments?limit=1
curl -s -o /dev/null -w '%{http_code}\n' https://madaspot.com/hotels
```

Les deux doivent renvoyer `200`, et `/hotels` afficher des fiches. Vérifier aussi une
connexion utilisateur et l'accès à `/admin`, qui sont les chemins les plus sensibles
au schéma.

## Retour arrière

Si quelque chose cloche, la bascule se défait en deux commandes :

```bash
cd /root/mada-spot && cp .env.neon-backup .env && pm2 reload madaspot
```

La base Neon reste intacte pendant toute l'opération : rien n'y est supprimé. Garder
le projet Neon vivant une ou deux semaines après la migration, le temps de se
rassurer, avant de le supprimer.

## Étape 6 — Sauvegardes (à ne pas sauter)

Neon gérait les sauvegardes. En auto-hébergeant, cette responsabilité revient au VPS.
Sans cette étape, la migration troque une panne mensuelle prévisible contre un risque
de perte totale de données.

```bash
cat > /root/backup-db.sh <<'EOF'
#!/bin/bash
set -euo pipefail
DEST=/root/backups
mkdir -p "$DEST"
pg_dump -U madaspot -h localhost -d madaspot --format=custom \
  -f "$DEST/madaspot-$(date +%F).dump"
find "$DEST" -name 'madaspot-*.dump' -mtime +14 -delete
EOF
chmod +x /root/backup-db.sh
(crontab -l 2>/dev/null; echo "15 3 * * * /root/backup-db.sh >> /var/log/madaspot-backup.log 2>&1") | crontab -
```

Une sauvegarde qui n'a jamais été restaurée n'est pas une sauvegarde : tester une
restauration sur une base jetable dans le mois qui suit.

## Suivi

Le cron CRM (`/root/cron-crm.sh`, 05:30) et le job de sauvegarde tournent tous deux
sur la même base désormais locale. Surveiller l'espace disque du VPS, qui devient le
facteur limitant à la place du quota de compute.
