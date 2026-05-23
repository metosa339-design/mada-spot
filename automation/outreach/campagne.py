"""
Campagne Outreach MadaSpot — Envoi personnalisé via Brevo
- Lit campagne_madaspot_contacts.csv (5000+ contacts)
- Personnalise chaque email avec {name}, {type}, {city}
- Throttling progressif : J1=50, J2=100, J3=200, puis 300/jour
- Track envois dans SQLite (sent, failed, date)
- Reprend où il s'est arrêté si interrompu
- Lien désinscription unique
"""

import csv
import json
import time
import sqlite3
import hashlib
import os
import sys
from datetime import datetime, date

try:
    import requests
except ImportError:
    os.system("pip install requests")
    import requests

# Force IPv4 — Brevo whitelist IPv6 unstable (suffix changes per session)
import socket
import urllib3.util.connection as urllib3_cn
urllib3_cn.allowed_gai_family = lambda: socket.AF_INET

# Load BREVO_API_KEY from project .env (gitignored). Manual parsing because
# the .env file may contain non-UTF-8 bytes from Windows editors.
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

try:
    import certifi
    CA_BUNDLE = certifi.where()
except ImportError:
    os.system("pip install certifi")
    import certifi
    CA_BUNDLE = certifi.where()

# Local antivirus/proxy intercepts TLS with a malformed CA chain — verify disabled
# for outbound Brevo calls only. Safe on this dev box (MITM = own machine).
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
SSL_VERIFY = False

# ============================================================
# CONFIGURATION
# ============================================================
BREVO_API_KEY = _load_env_var(_ENV_PATH, "BREVO_API_KEY") or ""
if not BREVO_API_KEY:
    raise SystemExit(f"Missing BREVO_API_KEY in {_ENV_PATH}. Aborting.")
SENDER_EMAIL = "contact@madaspot.com"
SENDER_NAME = "Metosaela — Mada Spot"

BASE_DIR = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
CSV_FILE = BASE_DIR + "/campagne_madaspot_contacts.csv"
DB_FILE = BASE_DIR + "/outreach_tracking.db"

SITE_URL = "https://madaspot.com"
DELAY_BETWEEN_EMAILS = 1.2  # seconds

# Throttling progressif
DAILY_LIMITS = {
    1: 50,    # Jour 1
    2: 100,   # Jour 2
    3: 200,   # Jour 3
}
DEFAULT_DAILY_LIMIT = 300  # Jour 4+

# ============================================================
# DATABASE SETUP
# ============================================================
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            email TEXT PRIMARY KEY,
            name TEXT,
            type TEXT,
            city TEXT,
            status TEXT DEFAULT 'pending',
            sent_at TEXT,
            error TEXT,
            unsubscribe_token TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS daily_log (
            date TEXT PRIMARY KEY,
            sent_count INTEGER DEFAULT 0,
            day_number INTEGER DEFAULT 1
        )
    """)
    conn.commit()
    return conn


def get_unsubscribe_token(email):
    return hashlib.sha256(f"madaspot-unsub-{email}".encode()).hexdigest()[:16]


# ============================================================
# LOAD CONTACTS
# ============================================================
def load_contacts_to_db(conn):
    c = conn.cursor()
    added = 0
    with open(CSV_FILE, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            email = (row.get("email") or "").strip().lower()
            if not email or "@" not in email or email.endswith(".f") or email == "none":
                continue
            name = (row.get("name") or "").strip()
            typ = (row.get("type") or "").strip()
            city = (row.get("city") or "").strip()
            token = get_unsubscribe_token(email)
            try:
                c.execute(
                    "INSERT OR IGNORE INTO contacts (email, name, type, city, unsubscribe_token) VALUES (?, ?, ?, ?, ?)",
                    (email, name, typ, city, token),
                )
                if c.rowcount > 0:
                    added += 1
            except Exception:
                pass
    conn.commit()
    return added


# ============================================================
# EMAIL TEMPLATE
# ============================================================
def build_email(name, typ, city, unsub_url):
    # Determine type phrase
    type_phrases = {
        "hotel": "votre hôtel",
        "hebergement": "votre hébergement",
        "restaurant": "votre restaurant",
        "tour operateur": "votre agence de voyage",
        "agence de voyage": "votre agence",
        "guide": "vos services de guide",
        "plongee": "votre centre de plongée",
        "plongée": "votre centre de plongée",
        "transport": "votre service de transport",
        "location voiture": "votre service de location",
        "croisiere": "votre service de croisière",
        "villa": "votre villa",
        "spa": "votre espace bien-être",
        "ecotourisme": "votre activité écotouristique",
        "peche": "votre activité de pêche",
        "sport": "votre activité sportive",
        "attraction": "votre attraction",
        "institution": "votre organisme",
    }

    type_phrase = "votre établissement"
    for key, val in type_phrases.items():
        if key in (typ or "").lower():
            type_phrase = val
            break

    region_phrase = ""
    if city and city.lower() not in ("non spécifié", "non specifie", ""):
        region_phrase = f" à {city}"

    display_name = name if name else "votre établissement"

    subject = f"{display_name} — Référencez-vous gratuitement sur Mada Spot"

    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">

<div style="padding:24px 0;text-align:center">
  <img src="https://madaspot.com/logo.png" alt="Mada Spot" width="48" height="48" style="border-radius:12px">
</div>

<div style="padding:0 24px">
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Bonjour,</p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Je suis Metosaela de <strong>Mada Spot</strong> (<a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a>), le guide en ligne dédié aux meilleurs spots de Madagascar : hôtels, restaurants, activités, bons plans.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    <strong>{display_name}</strong> — {type_phrase}{region_phrase} — pourrait intéresser nos visiteurs (touristes locaux et internationaux qui cherchent des prestataires de confiance).
  </p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Le référencement est <strong>100% gratuit</strong> : fiche dédiée avec photos, description, contact direct, carte interactive et avis clients vérifiés.
  </p>

  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:24px 0">
    <p style="font-size:15px;margin:0 0 12px;font-weight:600;color:#1a1a2e">Deux options pour vous référencer :</p>
    <p style="font-size:15px;line-height:1.7;margin:0 0 8px">
      👉 <a href="{SITE_URL}/inscrire-etablissement" style="color:#ff6b35;font-weight:600">Créer votre fiche en 5 minutes</a>
    </p>
    <p style="font-size:15px;line-height:1.7;margin:0">
      👉 Ou répondez à cet email avec votre logo + 2-3 photos, on s'occupe de tout
    </p>
  </div>

  <p style="font-size:16px;line-height:1.7;margin:0 0 8px">
    <strong>+190 établissements</strong> sont déjà référencés et reçoivent des contacts de voyageurs chaque semaine.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:24px 0 8px">Très belle journée,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 4px"><strong>Metosaela</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0">Mada Spot — <a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a></p>
</div>

<div style="margin-top:40px;padding:16px 24px;border-top:1px solid #e2e8f0">
  <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center">
    Vous recevez ce message car {display_name} figure dans l'annuaire public du tourisme malgache.<br>
    <a href="{unsub_url}" style="color:#94a3b8">Se désinscrire</a>
  </p>
</div>

</div>"""

    return subject, html


# ============================================================
# SEND EMAIL
# ============================================================
def send_email(to_email, to_name, subject, html):
    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": to_email, "name": to_name or to_email}],
        "subject": subject,
        "htmlContent": html,
        "headers": {"X-Mailin-Tag": "outreach-madaspot-2026"},
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
# DAILY LIMIT
# ============================================================
def get_daily_limit(conn):
    c = conn.cursor()
    today = date.today().isoformat()

    c.execute("SELECT sent_count, day_number FROM daily_log WHERE date = ?", (today,))
    row = c.fetchone()

    if row:
        sent_today = row[0]
        day_num = row[1]
    else:
        # New day — figure out day number
        c.execute("SELECT COUNT(*) FROM daily_log")
        total_days = c.fetchone()[0]
        day_num = total_days + 1
        c.execute(
            "INSERT INTO daily_log (date, sent_count, day_number) VALUES (?, 0, ?)",
            (today, day_num),
        )
        conn.commit()
        sent_today = 0

    limit = DAILY_LIMITS.get(day_num, DEFAULT_DAILY_LIMIT)
    return sent_today, limit, day_num


def increment_daily_count(conn):
    today = date.today().isoformat()
    c = conn.cursor()
    c.execute(
        "UPDATE daily_log SET sent_count = sent_count + 1 WHERE date = ?", (today,)
    )
    conn.commit()


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 60)
    print("  CAMPAGNE OUTREACH MADASPOT")
    print("  Email personnalisé via Brevo")
    print("=" * 60)

    conn = init_db()

    # Load contacts
    print("\nChargement des contacts...")
    added = load_contacts_to_db(conn)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM contacts")
    total = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM contacts WHERE status = 'sent'")
    sent = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM contacts WHERE status = 'pending'")
    pending = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM contacts WHERE status = 'unsubscribed'")
    unsub = c.fetchone()[0]

    print(f"  Total en base: {total}")
    print(f"  Déjà envoyés: {sent}")
    print(f"  En attente: {pending}")
    print(f"  Désinscrits: {unsub}")
    if added > 0:
        print(f"  Nouveaux importés: {added}")

    sent_today, daily_limit, day_num = get_daily_limit(conn)
    remaining_today = daily_limit - sent_today

    print(f"\n  Jour #{day_num} — Limite: {daily_limit}/jour")
    print(f"  Envoyés aujourd'hui: {sent_today}/{daily_limit}")
    print(f"  Restant aujourd'hui: {remaining_today}")
    print()

    if remaining_today <= 0:
        print("Limite quotidienne atteinte. Relancez demain.")
        conn.close()
        return

    if pending == 0:
        print("Tous les contacts ont été envoyés ! Campagne terminée.")
        conn.close()
        return

    # Fetch pending contacts
    c.execute(
        "SELECT email, name, type, city, unsubscribe_token FROM contacts WHERE status = 'pending' LIMIT ?",
        (remaining_today,),
    )
    batch = c.fetchall()

    print(f">>> Envoi de {len(batch)} emails personnalisés...\n")

    ok = 0
    err = 0

    for i, (email, name, typ, city, token) in enumerate(batch):
        unsub_url = f"{SITE_URL}/desinscription?token={token}"
        subject, html = build_email(name, typ, city, unsub_url)

        try:
            status, response = send_email(email, name, subject, html)
            if status in (200, 201):
                c.execute(
                    "UPDATE contacts SET status = 'sent', sent_at = ? WHERE email = ?",
                    (datetime.now().isoformat(), email),
                )
                ok += 1
                increment_daily_count(conn)
                display = (name or email)[:35]
                print(f"  [{ok}/{len(batch)}] OK — {display} ({email})")
            else:
                error_msg = response[:100]
                c.execute(
                    "UPDATE contacts SET status = 'failed', error = ? WHERE email = ?",
                    (error_msg, email),
                )
                err += 1
                print(f"  [ERR {status}] {email}: {error_msg}")
        except Exception as e:
            c.execute(
                "UPDATE contacts SET status = 'failed', error = ? WHERE email = ?",
                (str(e)[:100], email),
            )
            err += 1
            print(f"  [EXC] {email}: {e}")

        # Save every 10 emails
        if (i + 1) % 10 == 0:
            conn.commit()

        time.sleep(DELAY_BETWEEN_EMAILS)

    conn.commit()

    # Final stats
    c.execute("SELECT COUNT(*) FROM contacts WHERE status = 'sent'")
    total_sent = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM contacts WHERE status = 'pending'")
    total_pending = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM contacts WHERE status = 'failed'")
    total_failed = c.fetchone()[0]

    print()
    print("=" * 60)
    print(f"  Envoyés maintenant: {ok}")
    print(f"  Erreurs: {err}")
    print(f"  Total envoyés (cumul): {total_sent}")
    print(f"  Restants: {total_pending}")
    print(f"  Échecs: {total_failed}")
    if total_pending > 0:
        days_left = total_pending // DEFAULT_DAILY_LIMIT + 1
        print(f"  Jours restants: ~{days_left}")
    else:
        print("  CAMPAGNE TERMINÉE !")
    print("=" * 60)

    conn.close()


if __name__ == "__main__":
    main()
