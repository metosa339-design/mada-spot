"""
Relance #1 via Brevo (au lieu de Gmail).
Réutilise les cibles déjà importées dans `relance_1_contacts` (2287 contacts).
Throttle 300/jour. Reprend où il s'est arrêté.
"""

import os
import sqlite3
import time
from datetime import date, datetime

try:
    import requests
except ImportError:
    os.system("pip install requests")
    import requests

# Force IPv4 (Brevo whitelist IPv6 unstable)
import socket
import urllib3.util.connection as urllib3_cn
urllib3_cn.allowed_gai_family = lambda: socket.AF_INET

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
SSL_VERIFY = False  # local MITM proxy bypass

# ============================================================
# CONFIG
# ============================================================
BASE_DIR = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
DB_FILE = BASE_DIR + "/outreach_tracking.db"
SITE_URL = "https://madaspot.com"
DAILY_LIMIT = 300
DELAY_BETWEEN_EMAILS = 1.2

# Load BREVO_API_KEY from .env
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
    raise SystemExit("Missing BREVO_API_KEY in .env. Aborting.")

SENDER_EMAIL = "contact@madaspot.com"
SENDER_NAME = "Metosaela — Mada Spot"


# ============================================================
# EMAIL TEMPLATE
# ============================================================
def build_email(name, typ, city):
    type_phrases = {
        "hotel": "Votre hôtel",
        "hebergement": "Votre hébergement",
        "restaurant": "Votre restaurant",
        "tour operateur": "Votre agence",
        "agence de voyage": "Votre agence",
        "guide": "Vos services de guide",
        "plongee": "Votre centre de plongée",
        "plongée": "Votre centre de plongée",
        "transport": "Votre service de transport",
        "location voiture": "Votre service de location",
        "croisiere": "Votre service de croisière",
        "villa": "Votre villa",
        "spa": "Votre espace bien-être",
        "ecotourisme": "Votre activité écotouristique",
        "peche": "Votre activité de pêche",
        "sport": "Votre activité sportive",
        "attraction": "Votre attraction",
        "institution": "Votre organisme",
    }
    type_phrase = "Votre établissement"
    for key, val in type_phrases.items():
        if key in (typ or "").lower():
            type_phrase = val
            break

    region_phrase = ""
    if city and city.lower() not in ("non spécifié", "non specifie", ""):
        region_phrase = f" à {city}"

    display_name = name if name else "votre établissement"
    subject = f"{display_name} — Pic de recherches voyageurs pour juin-août"

    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">

<div style="padding:24px 0;text-align:center">
  <img src="https://madaspot.com/logo.png" alt="Mada Spot" width="48" height="48" style="border-radius:12px">
</div>

<div style="padding:0 24px">
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Bonjour,</p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Petit suivi de mon précédent message — pas de souci si vous ne l'avez pas vu passer.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    En mai, beaucoup de voyageurs finalisent leur séjour à Madagascar pour juin, juillet et août.
    Ils viennent sur Mada Spot pour repérer hôtels, restaurants, guides et agences, puis contactent
    directement ceux qu'ils choisissent.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    <strong>{type_phrase}{region_phrase}</strong> y a tout à fait sa place. Le référencement reste
    100% gratuit, 5 minutes à remplir :
  </p>

  <div style="text-align:center;margin:24px 0">
    <a href="{SITE_URL}/inscrire-etablissement" style="display:inline-block;padding:14px 28px;background:#ff6b35;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600">
      Référencer mon établissement →
    </a>
  </div>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Ou répondez simplement à ce mail avec votre logo + 2-3 photos — on s'occupe de tout côté Mada Spot.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:24px 0 8px">Bonne saison à venir,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 4px"><strong>Metosaela</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0">Mada Spot — <a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a></p>
</div>

<div style="margin-top:40px;padding:16px 24px;border-top:1px solid #e2e8f0">
  <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center">
    Vous recevez ce message car {display_name} figure dans l'annuaire public du tourisme malgache.<br>
    Pour ne plus recevoir nos messages, répondez avec "STOP".
  </p>
</div>

</div>"""
    return subject, html


# ============================================================
# SEND VIA BREVO
# ============================================================
def send_email(to_email, to_name, subject, html):
    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": to_email, "name": to_name or to_email}],
        "subject": subject,
        "htmlContent": html,
        "headers": {"X-Mailin-Tag": "relance-1-madaspot-2026"},
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
    }
    resp = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        json=payload,
        headers=headers,
        timeout=30,
        verify=SSL_VERIFY,
    )
    return resp.status_code, resp.text


# ============================================================
# DAILY
# ============================================================
def get_daily_state(conn):
    today = date.today().isoformat()
    c = conn.cursor()
    c.execute("SELECT sent_count FROM relance_1_daily_log WHERE date = ?", (today,))
    row = c.fetchone()
    if row:
        return row[0]
    c.execute("INSERT INTO relance_1_daily_log (date, sent_count) VALUES (?, 0)", (today,))
    conn.commit()
    return 0


def increment_daily(conn):
    today = date.today().isoformat()
    conn.cursor().execute(
        "UPDATE relance_1_daily_log SET sent_count = sent_count + 1 WHERE date = ?", (today,)
    )
    conn.commit()


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 60)
    print("  RELANCE #1 MADA SPOT — Brevo")
    print("=" * 60)

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute("SELECT status, COUNT(*) FROM relance_1_contacts GROUP BY status")
    counts = dict(c.fetchall())
    total = sum(counts.values())
    print(f"\n  Total cibles: {total}")
    print(f"  Déjà relancés: {counts.get('sent', 0)}")
    print(f"  En attente: {counts.get('pending', 0)}")
    print(f"  Échecs: {counts.get('failed', 0)}")

    sent_today = get_daily_state(conn)
    remaining_today = DAILY_LIMIT - sent_today
    print(f"\n  Envoyés aujourd'hui: {sent_today}/{DAILY_LIMIT}")
    print(f"  Restant aujourd'hui: {remaining_today}")

    if remaining_today <= 0:
        print("\nLimite quotidienne atteinte.")
        conn.close()
        return

    pending = counts.get("pending", 0)
    if pending == 0:
        print("\nTous les contacts ont été relancés !")
        conn.close()
        return

    c.execute(
        "SELECT email, name, type, city FROM relance_1_contacts WHERE status='pending' LIMIT ?",
        (remaining_today,),
    )
    batch = c.fetchall()
    print(f"\n>>> Envoi de {len(batch)} relances via Brevo...\n")

    ok = 0
    err = 0
    for i, (email, name, typ, city) in enumerate(batch):
        subject, html = build_email(name, typ, city)
        try:
            status, response = send_email(email, name, subject, html)
            if status in (200, 201):
                c.execute(
                    "UPDATE relance_1_contacts SET status='sent', sent_at=? WHERE email=?",
                    (datetime.now().isoformat(), email),
                )
                ok += 1
                increment_daily(conn)
                display = (name or email)[:35]
                print(f"  [{ok}/{len(batch)}] OK — {display} ({email})")
            else:
                error_msg = response[:120]
                c.execute(
                    "UPDATE relance_1_contacts SET status='failed', error=? WHERE email=?",
                    (error_msg, email),
                )
                err += 1
                print(f"  [ERR {status}] {email}: {error_msg}")
        except Exception as e:
            c.execute(
                "UPDATE relance_1_contacts SET status='failed', error=? WHERE email=?",
                (str(e)[:120], email),
            )
            err += 1
            print(f"  [EXC] {email}: {e}")

        if (i + 1) % 10 == 0:
            conn.commit()
        time.sleep(DELAY_BETWEEN_EMAILS)

    conn.commit()

    c.execute("SELECT COUNT(*) FROM relance_1_contacts WHERE status='sent'")
    total_sent = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM relance_1_contacts WHERE status='pending'")
    total_pending = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM relance_1_contacts WHERE status='failed'")
    total_failed = c.fetchone()[0]

    print()
    print("=" * 60)
    print(f"  Envoyés maintenant: {ok}")
    print(f"  Erreurs: {err}")
    print(f"  Total relances (cumul): {total_sent}")
    print(f"  Restants: {total_pending}")
    print(f"  Échecs: {total_failed}")
    if total_pending > 0:
        days_left = total_pending // DAILY_LIMIT + 1
        print(f"  Jours restants: ~{days_left}")
    else:
        print("  RELANCE #1 TERMINÉE !")
    print("=" * 60)

    conn.close()


if __name__ == "__main__":
    main()
