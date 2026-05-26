"""
Relance ciblée : 22 propriétaires de fiches publiées SANS photo.
Email court, lien direct vers le dashboard pour qu'ils ajoutent eux-mêmes.
Envoi via Brevo. Pas de throttle complexe (22 emails = ~30 sec).
"""

import json
import os
import sqlite3
import sys
import time
from datetime import date, datetime

try:
    import requests
except ImportError:
    os.system("pip install requests")
    import requests

# Force IPv4 + bypass MITM SSL
import socket
import urllib3.util.connection as urllib3_cn
urllib3_cn.allowed_gai_family = lambda: socket.AF_INET
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_DIR = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
TARGETS_JSON = BASE_DIR + "/no_photo_owners.json"
LOG_DB = BASE_DIR + "/outreach_tracking.db"
SITE_URL = "https://madaspot.com"

def _load_env_var(env_path, var_name):
    try:
        with open(env_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                if k.strip() == var_name:
                    return v.strip().strip('"').strip("'")
    except FileNotFoundError:
        return None
    return None

_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
BREVO_API_KEY = _load_env_var(_ENV_PATH, "BREVO_API_KEY") or ""
if not BREVO_API_KEY:
    raise SystemExit("Missing BREVO_API_KEY in .env")

SENDER_EMAIL = "contact@madaspot.com"
SENDER_NAME = "Metosaela — Mada Spot"


def init_log():
    conn = sqlite3.connect(LOG_DB)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS no_photo_reminder_log (
            email TEXT PRIMARY KEY,
            establishment TEXT,
            status TEXT,
            sent_at TEXT,
            error TEXT
        )
    """)
    conn.commit()
    return conn


def already_sent(conn, email):
    row = conn.execute(
        "SELECT 1 FROM no_photo_reminder_log WHERE email=? AND status='sent'",
        (email,),
    ).fetchone()
    return row is not None


def build_email(first_name, est_name, est_type, city):
    type_phrases = {
        "HOTEL": "Votre établissement",
        "RESTAURANT": "Votre restaurant",
        "ATTRACTION": "Votre site",
        "PROVIDER": "Votre activité",
    }
    type_phrase = type_phrases.get(est_type, "Votre fiche")
    greeting = f"Bonjour {first_name}," if first_name else "Bonjour,"
    region = f" à {city}" if city else ""

    subject = f"{est_name} — Votre fiche est en ligne, ajoutez vos photos"

    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">

<div style="padding:24px 0;text-align:center">
  <img src="https://madaspot.com/logo.png" alt="Mada Spot" width="44" height="44" style="border-radius:10px">
</div>

<div style="padding:0 24px">
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">{greeting}</p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Bonne nouvelle, votre fiche <strong>{est_name}</strong>{region} est bien publiée sur Mada Spot.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Petit point d'attention : elle n'a pas encore de photos. C'est le critère
    n° 1 qui décide un voyageur à cliquer — les fiches avec photos reçoivent
    jusqu'à 5 fois plus de visites.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    {type_phrase} mérite d'être vue. Connectez-vous à votre dashboard et
    ajoutez 3 à 5 photos en quelques minutes :
  </p>

  <div style="text-align:center;margin:28px 0">
    <a href="{SITE_URL}/dashboard/etablissement"
       style="display:inline-block;padding:14px 28px;background:#ff6b35;color:#ffffff;
              text-decoration:none;border-radius:10px;font-weight:600">
      Ajouter mes photos →
    </a>
  </div>

  <p style="font-size:14px;line-height:1.7;margin:0 0 8px;color:#64748b">
    Conseil rapide : une photo extérieure, une intérieure et une vue
    suffisent à transformer votre fiche.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:24px 0 8px">Bonne saison à venir,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 4px"><strong>Metosaela</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0">
    Mada Spot — <a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a>
  </p>
</div>

<div style="margin-top:32px;padding:14px 24px;border-top:1px solid #e2e8f0">
  <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center">
    Vous recevez ce message car vous êtes inscrit sur Mada Spot avec une
    fiche établissement publiée.
  </p>
</div>

</div>"""
    return subject, html


def send_brevo(to_email, to_name, subject, html):
    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": to_email, "name": to_name or to_email}],
        "subject": subject,
        "htmlContent": html,
        "headers": {"X-Mailin-Tag": "relance-no-photo-2026"},
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
    }
    r = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        json=payload, headers=headers, timeout=30, verify=False,
    )
    return r.status_code, r.text


def main():
    if not os.path.exists(TARGETS_JSON):
        raise SystemExit(f"Missing {TARGETS_JSON} — run scripts/_dump_no_photo_owners.mjs first")
    with open(TARGETS_JSON, "r", encoding="utf-8") as f:
        targets = json.load(f)

    print("=" * 60)
    print(f"  RELANCE NO-PHOTO — {len(targets)} owners")
    print("=" * 60)

    conn = init_log()
    ok, err, skipped = 0, 0, 0

    for t in targets:
        email = t["email"]
        if already_sent(conn, email):
            skipped += 1
            continue
        subject, html = build_email(
            t.get("firstName", ""),
            t["establishmentName"],
            t["establishmentType"],
            t.get("city"),
        )
        to_name = f"{t.get('firstName','')} {t.get('lastName','')}".strip() or t["establishmentName"]
        try:
            status, response = send_brevo(email, to_name, subject, html)
            if status in (200, 201):
                conn.execute(
                    "INSERT OR REPLACE INTO no_photo_reminder_log "
                    "(email, establishment, status, sent_at) VALUES (?, ?, 'sent', ?)",
                    (email, t["establishmentName"], datetime.now().isoformat()),
                )
                ok += 1
                print(f"  [OK] {t['establishmentName']} ({email})")
            else:
                conn.execute(
                    "INSERT OR REPLACE INTO no_photo_reminder_log "
                    "(email, establishment, status, error) VALUES (?, ?, 'failed', ?)",
                    (email, t["establishmentName"], response[:200]),
                )
                err += 1
                print(f"  [ERR {status}] {email}: {response[:120]}")
        except Exception as e:
            err += 1
            print(f"  [EXC] {email}: {e}")
        conn.commit()
        time.sleep(1.2)

    print()
    print("=" * 60)
    print(f"  Envoyés: {ok}    Erreurs: {err}    Skippés (déjà envoyés): {skipped}")
    print("=" * 60)
    conn.close()


if __name__ == "__main__":
    main()
