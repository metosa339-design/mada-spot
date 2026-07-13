"""
Relance conformité des comptes — Mada Spot
Cible : comptes inscrits non conformes (lus depuis non_conforme_owners.json) :
  - situation 'no_fiche'   : compte pro créé mais aucune fiche.
  - situation 'incomplete' : fiche en ligne mais photos/description/contact manquants.
Canal : Gmail SMTP via spotmada5@gmail.com (PAS Brevo).
Message personnalisé selon ce qui manque. Throttle 200/jour, reprise auto.
"""

import json
import os
import smtplib
import sqlite3
import time
from datetime import date, datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

BASE_DIR = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
TARGETS_JSON = BASE_DIR + "/non_conforme_owners.json"
DB_FILE = BASE_DIR + "/outreach_tracking.db"
SITE_URL = "https://madaspot.com"
DAILY_LIMIT = 200            # marge sous la limite Gmail (~500/j)
DELAY_BETWEEN_EMAILS = 4.0


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


def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS conformite_log (
            email TEXT PRIMARY KEY,
            situation TEXT,
            status TEXT DEFAULT 'pending',
            sent_at TEXT,
            error TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS conformite_daily_log (
            date TEXT PRIMARY KEY,
            sent_count INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    return conn


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
        subject = f"{first + ', v' if first else 'V'}otre fiche Mada Spot n'est pas encore en ligne"
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
    <a href="{SITE_URL}/dashboard/etablissement"
       style="display:inline-block;padding:14px 28px;background:#ff6b35;color:#ffffff;
              text-decoration:none;border-radius:10px;font-weight:600">
      Créer ma fiche →
    </a>
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
    <a href="{SITE_URL}/dashboard/etablissement"
       style="display:inline-block;padding:14px 28px;background:#ff6b35;color:#ffffff;
              text-decoration:none;border-radius:10px;font-weight:600">
      Compléter ma fiche →
    </a>
  </div>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Vous pouvez aussi me répondre directement avec les éléments manquants,
    je m'occupe de la mise à jour.
  </p>
"""

    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">

<div style="padding:24px 0;text-align:center">
  <img src="https://madaspot.com/logo.png" alt="Mada Spot" width="44" height="44" style="border-radius:10px">
</div>

<div style="padding:0 24px">
{body}
  <p style="font-size:16px;line-height:1.7;margin:24px 0 8px">Bien à vous,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 4px"><strong>Metosaela</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0">
    Mada Spot — <a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a>
  </p>
</div>

<div style="margin-top:32px;padding:14px 24px;border-top:1px solid #e2e8f0">
  <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center">
    Vous recevez ce message car vous avez un compte prestataire sur Mada Spot.
    Pour ne plus recevoir nos messages, répondez avec "STOP".
  </p>
</div>

</div>"""
    return subject, html


def send_email(smtp, to_email, to_name, subject, html):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((SENDER_NAME, SMTP_USER))
    msg["To"] = formataddr((to_name or to_email, to_email))
    msg["Reply-To"] = REPLY_TO
    msg.attach(MIMEText(html, "html", "utf-8"))
    smtp.sendmail(SMTP_USER, [to_email], msg.as_string())


def get_daily_state(conn):
    today = date.today().isoformat()
    row = conn.execute(
        "SELECT sent_count FROM conformite_daily_log WHERE date=?", (today,)
    ).fetchone()
    if row:
        return row[0]
    conn.execute("INSERT INTO conformite_daily_log (date, sent_count) VALUES (?, 0)", (today,))
    conn.commit()
    return 0


def increment_daily(conn):
    today = date.today().isoformat()
    conn.execute(
        "UPDATE conformite_daily_log SET sent_count = sent_count + 1 WHERE date=?", (today,)
    )
    conn.commit()


def load_targets(conn):
    with open(TARGETS_JSON, "r", encoding="utf-8") as f:
        targets = json.load(f)
    added = 0
    for t in targets:
        email = (t.get("email") or "").strip().lower()
        if not email or "@" not in email:
            continue
        cur = conn.execute(
            "INSERT OR IGNORE INTO conformite_log (email, situation) VALUES (?, ?)",
            (email, t.get("situation", "")),
        )
        if cur.rowcount > 0:
            added += 1
    conn.commit()
    return targets, added


def main():
    print("=" * 60)
    print("  RELANCE CONFORMITÉ — Gmail SMTP")
    print("=" * 60)

    conn = init_db()
    targets, added = load_targets(conn)
    by_email = {(t.get("email") or "").strip().lower(): t for t in targets}

    counts = dict(conn.execute(
        "SELECT status, COUNT(*) FROM conformite_log GROUP BY status"
    ).fetchall())
    print(f"\n  Total cibles: {sum(counts.values())}")
    print(f"  Déjà envoyés: {counts.get('sent', 0)}")
    print(f"  En attente: {counts.get('pending', 0)}")
    print(f"  Échecs: {counts.get('failed', 0)}")
    if added:
        print(f"  Nouveaux importés: {added}")

    sent_today = get_daily_state(conn)
    remaining = DAILY_LIMIT - sent_today
    print(f"\n  Envoyés aujourd'hui: {sent_today}/{DAILY_LIMIT}")
    print(f"  Restant aujourd'hui: {remaining}")

    if remaining <= 0:
        print("\nLimite quotidienne atteinte.")
        conn.close()
        return

    rows = conn.execute(
        "SELECT email FROM conformite_log WHERE status='pending' LIMIT ?", (remaining,)
    ).fetchall()
    if not rows:
        print("\nTous les comptes ont été relancés !")
        conn.close()
        return

    print(f"\n>>> Envoi de {len(rows)} e-mails via {SMTP_USER}...\n")

    smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
    smtp.starttls()
    smtp.login(SMTP_USER, SMTP_PASS)

    ok = err = 0
    try:
        for i, (email,) in enumerate(rows):
            t = by_email.get(email, {"email": email, "situation": "no_fiche", "missing": ["fiche"]})
            subject, html = build_email(t)
            to_name = f"{t.get('firstName','')} {t.get('lastName','')}".strip() or email
            try:
                send_email(smtp, email, to_name, subject, html)
                conn.execute(
                    "UPDATE conformite_log SET status='sent', sent_at=? WHERE email=?",
                    (datetime.now().isoformat(), email),
                )
                ok += 1
                increment_daily(conn)
                print(f"  [{ok}/{len(rows)}] OK — {to_name[:30]} ({email}) [{t.get('situation')}]")
            except Exception as e:
                conn.execute(
                    "UPDATE conformite_log SET status='failed', error=? WHERE email=?",
                    (str(e)[:120], email),
                )
                err += 1
                print(f"  [ERR] {email}: {str(e)[:100]}")
            if (i + 1) % 10 == 0:
                conn.commit()
            time.sleep(DELAY_BETWEEN_EMAILS)
    finally:
        try:
            smtp.quit()
        except Exception:
            pass

    conn.commit()
    total_sent = conn.execute("SELECT COUNT(*) FROM conformite_log WHERE status='sent'").fetchone()[0]
    total_pending = conn.execute("SELECT COUNT(*) FROM conformite_log WHERE status='pending'").fetchone()[0]
    print()
    print("=" * 60)
    print(f"  Envoyés maintenant: {ok}    Erreurs: {err}")
    print(f"  Total envoyés (cumul): {total_sent}    Restants: {total_pending}")
    print("=" * 60)
    conn.close()


if __name__ == "__main__":
    main()
