"""
Relance conformité — via l'endpoint interne de l'app (Resend en prod).
Canal "membres" habituel : POST https://madaspot.com/api/email/send (EMAIL_SECRET).
PAS Brevo, PAS Gmail. Réutilise non_conforme_owners.json + table conformite_log.

Usage:
  python relance_conformite_resend.py --test meto@rhreflex.com   # 1 mail de test (no DB)
  python relance_conformite_resend.py                            # envoi réel des pending
"""

import json
import os
import sqlite3
import ssl
import sys
import time
import urllib.request
from datetime import date, datetime

BASE_DIR = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
TARGETS_JSON = BASE_DIR + "/non_conforme_owners.json"
DB_FILE = BASE_DIR + "/outreach_tracking.db"
SITE_URL = "https://madaspot.com"
ENDPOINT = "https://madaspot.com/api/email/send"
DAILY_LIMIT = 200
DELAY = 1.5


def _load_env_var(name):
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
    for line in open(p, encoding="utf-8", errors="ignore"):
        s = line.strip()
        if s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        if k.strip() == name:
            return v.strip().strip('"').strip("'")
    return None


EMAIL_SECRET = _load_env_var("EMAIL_SECRET") or ""
if not EMAIL_SECRET:
    raise SystemExit("Missing EMAIL_SECRET in .env")

# On transmet EMAIL_SECRET : la connexion DOIT être chiffrée ET vérifiée.
# Le poste a un proxy TLS local (antivirus) dont le CA est dans le magasin
# Windows ; truststore valide la chaîne via ce magasin système (pas de bypass).
import truststore
_CTX = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)


def missing_phrase(missing):
    labels = {
        "photos": "des photos",
        "description": "une description",
        "contact": "vos coordonnées (téléphone ou e-mail)",
    }
    parts = [labels.get(m, m) for m in missing]
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return parts[0] + " et " + parts[1]
    return ", ".join(parts[:-1]) + " et " + parts[-1]


def build_email(t):
    first = (t.get("firstName") or "").strip()
    greeting = f"Bonjour {first}," if first else "Bonjour,"
    if t.get("situation") == "no_fiche":
        subject = f"{(first + ', v') if first else 'V'}otre fiche Mada Spot n'est pas encore en ligne"
        body = f"""
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">{greeting}</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Merci d'avoir créé votre compte sur Mada Spot. En vérifiant, je vois qu'il
    vous reste une dernière étape : votre établissement n'a pas encore de fiche
    publiée, il n'apparaît donc pas encore auprès des voyageurs.
  </p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Créer votre fiche prend environ 5 minutes, c'est gratuit, et c'est ce qui
    rend votre compte complet :
  </p>
  <div style="text-align:center;margin:28px 0">
    <a href="{SITE_URL}/dashboard/etablissement" style="display:inline-block;padding:14px 28px;background:#ff6b35;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600">Créer ma fiche</a>
  </div>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Si c'est plus simple, répondez à cet e-mail avec le nom de votre
    établissement, votre logo et 2-3 photos : je crée la fiche pour vous.
  </p>
"""
    else:
        est = t.get("establishmentName") or "votre établissement"
        manque = missing_phrase(t.get("missing", []))
        subject = f"{est} — il manque {manque} pour finaliser votre fiche"
        body = f"""
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">{greeting}</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Votre fiche <strong>{est}</strong> est bien en ligne sur Mada Spot, merci !
    Pour qu'elle soit complète et qu'elle ressorte au mieux auprès des
    voyageurs, il manque encore <strong>{manque}</strong>.
  </p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    C'est rapide à ajouter depuis votre espace, et ça change beaucoup le nombre
    de visites que reçoit une fiche :
  </p>
  <div style="text-align:center;margin:28px 0">
    <a href="{SITE_URL}/dashboard/etablissement" style="display:inline-block;padding:14px 28px;background:#ff6b35;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600">Compléter ma fiche</a>
  </div>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Vous pouvez aussi me répondre directement avec les éléments manquants,
    je m'occupe de la mise à jour.
  </p>
"""
    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
<div style="padding:24px 0;text-align:center"><img src="https://madaspot.com/logo.png" alt="Mada Spot" width="44" height="44" style="border-radius:10px"></div>
<div style="padding:0 24px">
{body}
  <p style="font-size:16px;line-height:1.7;margin:24px 0 8px">Bien à vous,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 4px"><strong>Metosaela</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0">Mada Spot — <a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a></p>
</div>
<div style="margin-top:32px;padding:14px 24px;border-top:1px solid #e2e8f0">
  <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center">Vous recevez ce message car vous avez un compte prestataire sur Mada Spot.</p>
</div>
</div>"""
    return subject, html


def send_via_app(to_email, subject, html):
    payload = json.dumps({"to": to_email, "subject": subject, "html": html, "secret": EMAIL_SECRET}).encode("utf-8")
    req = urllib.request.Request(ENDPOINT, data=payload, method="POST", headers={
        "Content-Type": "application/json",
        "Accept": "application/json",
        # Cloudflare protège madaspot.com et bloque le UA par défaut d'urllib.
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    })
    try:
        r = urllib.request.urlopen(req, timeout=30, context=_CTX)
        return r.status, r.read().decode("utf-8", "ignore")[:200]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "ignore")[:200]


def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("""CREATE TABLE IF NOT EXISTS conformite_log (
        email TEXT PRIMARY KEY, situation TEXT, status TEXT DEFAULT 'pending',
        sent_at TEXT, error TEXT)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS conformite_daily_log (
        date TEXT PRIMARY KEY, sent_count INTEGER DEFAULT 0)""")
    conn.commit()
    return conn


def main():
    targets = json.load(open(TARGETS_JSON, encoding="utf-8"))
    by_email = {(t.get("email") or "").strip().lower(): t for t in targets}

    # --- mode test : 1 mail, pas de DB ---
    if len(sys.argv) >= 3 and sys.argv[1] == "--test":
        dest = sys.argv[2]
        sample = next((t for t in targets if t["situation"] == "incomplete"), targets[0])
        subject, html = build_email(sample)
        subject = "[TEST] " + subject
        code, resp = send_via_app(dest, subject, html)
        print(f"TEST -> {dest} | HTTP {code} | {resp}")
        return

    conn = init_db()
    # importe les cibles
    for t in targets:
        e = (t.get("email") or "").strip().lower()
        if e and "@" in e:
            conn.execute("INSERT OR IGNORE INTO conformite_log (email, situation) VALUES (?,?)", (e, t.get("situation", "")))
    conn.commit()

    today = date.today().isoformat()
    row = conn.execute("SELECT sent_count FROM conformite_daily_log WHERE date=?", (today,)).fetchone()
    if not row:
        conn.execute("INSERT INTO conformite_daily_log (date, sent_count) VALUES (?,0)", (today,))
        conn.commit()
        sent_today = 0
    else:
        sent_today = row[0]
    remaining = DAILY_LIMIT - sent_today

    pending = conn.execute("SELECT email FROM conformite_log WHERE status='pending' LIMIT ?", (remaining,)).fetchall()
    counts = dict(conn.execute("SELECT status,COUNT(*) FROM conformite_log GROUP BY status").fetchall())
    print("=" * 60)
    print("  RELANCE CONFORMITÉ — via app (Resend prod)")
    print(f"  Total {sum(counts.values())} | envoyés {counts.get('sent',0)} | pending {counts.get('pending',0)} | échecs {counts.get('failed',0)}")
    print(f"  À envoyer maintenant: {len(pending)}")
    print("=" * 60)
    if not pending:
        print("Rien à envoyer.")
        return

    ok = err = 0
    for i, (email,) in enumerate(pending):
        t = by_email.get(email, {"email": email, "situation": "no_fiche", "missing": ["fiche"]})
        subject, html = build_email(t)
        code, resp = send_via_app(email, subject, html)
        if code in (200, 201):
            conn.execute("UPDATE conformite_log SET status='sent', sent_at=? WHERE email=?", (datetime.now().isoformat(), email))
            ok += 1
            conn.execute("UPDATE conformite_daily_log SET sent_count=sent_count+1 WHERE date=?", (today,))
            print(f"  [{ok}/{len(pending)}] OK — {email} [{t.get('situation')}]")
        else:
            conn.execute("UPDATE conformite_log SET status='failed', error=? WHERE email=?", (f"{code}:{resp}"[:150], email))
            err += 1
            print(f"  [ERR {code}] {email}: {resp}")
        if (i + 1) % 10 == 0:
            conn.commit()
        time.sleep(DELAY)
    conn.commit()
    print("=" * 60)
    print(f"  Envoyés: {ok} | Erreurs: {err}")
    print("=" * 60)
    conn.close()


if __name__ == "__main__":
    main()
