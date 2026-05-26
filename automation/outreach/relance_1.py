"""
Relance #1 — Mada Spot
Cible : contacts ayant reçu le 1er email mais sans fiche publiée sur le site.
Canal : Gmail SMTP via spotmada5@gmail.com (app password dans .env).
Throttle : 300/jour. Reprise auto si interrompu.
Angle : pic de recherches voyageurs juin/juillet/août, ton non accusatoire.
"""

import csv
import json
import os
import smtplib
import sqlite3
import time
from datetime import date, datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

# ============================================================
# CONFIG
# ============================================================
BASE_DIR = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
DB_FILE = BASE_DIR + "/outreach_tracking.db"
OWNERS_JSON = BASE_DIR + "/owner_emails.json"

SITE_URL = "https://madaspot.com"
DAILY_LIMIT = 300
DELAY_BETWEEN_EMAILS = 4.0  # Gmail : plus prudent que Brevo (limite 500/j)

# Load Gmail credentials from project .env (gitignored)
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
SMTP_HOST = _load_env_var(_ENV_PATH, "SMTP_HOST") or "smtp.gmail.com"
SMTP_PORT = int(_load_env_var(_ENV_PATH, "SMTP_PORT") or "587")
SMTP_USER = _load_env_var(_ENV_PATH, "SMTP_USER") or ""
SMTP_PASS = _load_env_var(_ENV_PATH, "SMTP_PASS") or ""
SENDER_NAME = "Metosaela — Mada Spot"
REPLY_TO = "contact@madaspot.com"

if not SMTP_USER or not SMTP_PASS:
    raise SystemExit("Missing SMTP_USER/SMTP_PASS in .env. Aborting.")

# ============================================================
# DB SETUP — table dédiée pour ne pas toucher à `contacts`
# ============================================================
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS relance_1_contacts (
            email TEXT PRIMARY KEY,
            name TEXT,
            type TEXT,
            city TEXT,
            status TEXT DEFAULT 'pending',
            sent_at TEXT,
            error TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS relance_1_daily_log (
            date TEXT PRIMARY KEY,
            sent_count INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    return conn


# ============================================================
# IMPORT TARGETS (cross-check avec Neon)
# ============================================================
def import_targets(conn):
    if not os.path.exists(OWNERS_JSON):
        raise SystemExit(
            f"Missing {OWNERS_JSON}. Run "
            f"`node scripts/_dump_owner_emails.mjs` from the project root first."
        )
    with open(OWNERS_JSON, "r", encoding="utf-8") as f:
        owner_emails = set(json.load(f))

    c = conn.cursor()
    # Pull all `sent` from the original campaign that are NOT site owners
    c.execute("SELECT email, name, type, city FROM contacts WHERE status='sent'")
    sent_rows = c.fetchall()

    added = 0
    for email, name, typ, city in sent_rows:
        if email.lower() in owner_emails:
            continue  # already a site owner — skip
        try:
            c.execute(
                "INSERT OR IGNORE INTO relance_1_contacts (email, name, type, city) VALUES (?, ?, ?, ?)",
                (email, name, typ, city),
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
# SEND EMAIL VIA GMAIL SMTP
# ============================================================
def send_email(smtp, to_email, to_name, subject, html):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((SENDER_NAME, SMTP_USER))
    msg["To"] = formataddr((to_name or to_email, to_email))
    msg["Reply-To"] = REPLY_TO
    msg.attach(MIMEText(html, "html", "utf-8"))
    smtp.sendmail(SMTP_USER, [to_email], msg.as_string())


# ============================================================
# DAILY LIMIT
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
    print("  RELANCE #1 MADA SPOT — Pic juin-août")
    print("  Canal : Gmail SMTP")
    print("=" * 60)

    conn = init_db()

    print("\nImport des cibles (cross-check Brevo sent <-> Neon owners)...")
    added = import_targets(conn)

    c = conn.cursor()
    c.execute("SELECT status, COUNT(*) FROM relance_1_contacts GROUP BY status")
    counts = dict(c.fetchall())
    total = sum(counts.values())
    print(f"  Total cibles: {total}")
    print(f"  Déjà envoyés: {counts.get('sent', 0)}")
    print(f"  En attente: {counts.get('pending', 0)}")
    print(f"  Échecs: {counts.get('failed', 0)}")
    if added > 0:
        print(f"  Nouveaux importés: {added}")

    sent_today = get_daily_state(conn)
    remaining_today = DAILY_LIMIT - sent_today
    print(f"\n  Envoyés aujourd'hui: {sent_today}/{DAILY_LIMIT}")
    print(f"  Restant aujourd'hui: {remaining_today}")

    if remaining_today <= 0:
        print("\nLimite quotidienne atteinte. Relancez demain.")
        conn.close()
        return

    pending = counts.get("pending", 0)
    if pending == 0:
        print("\nTous les contacts ont été relancés !")
        conn.close()
        return

    # Fetch pending batch
    c.execute(
        "SELECT email, name, type, city FROM relance_1_contacts WHERE status='pending' LIMIT ?",
        (remaining_today,),
    )
    batch = c.fetchall()

    print(f"\n>>> Envoi de {len(batch)} relances via {SMTP_USER}...\n")

    # Connexion SMTP unique pour tout le batch
    smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
    smtp.starttls()
    smtp.login(SMTP_USER, SMTP_PASS)

    ok = 0
    err = 0
    try:
        for i, (email, name, typ, city) in enumerate(batch):
            subject, html = build_email(name, typ, city)
            try:
                send_email(smtp, email, name, subject, html)
                c.execute(
                    "UPDATE relance_1_contacts SET status='sent', sent_at=? WHERE email=?",
                    (datetime.now().isoformat(), email),
                )
                ok += 1
                increment_daily(conn)
                display = (name or email)[:35]
                print(f"  [{ok}/{len(batch)}] OK — {display} ({email})")
            except Exception as e:
                error_msg = str(e)[:120]
                c.execute(
                    "UPDATE relance_1_contacts SET status='failed', error=? WHERE email=?",
                    (error_msg, email),
                )
                err += 1
                print(f"  [ERR] {email}: {error_msg}")

            if (i + 1) % 10 == 0:
                conn.commit()

            time.sleep(DELAY_BETWEEN_EMAILS)
    finally:
        try:
            smtp.quit()
        except Exception:
            pass

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
