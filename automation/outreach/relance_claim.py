"""
Campagne "Revendiquez votre fiche" — Mada Spot
Cible : fiches d'annuaire SANS propriétaire dont on a retrouvé l'e-mail
        (claim_targets.json). Message = votre fiche existe déjà, reprenez le contrôle,
        avec lien DIRECT vers la fiche (bouton "Revendiquer cette fiche").
Canal : Gmail SMTP (hors Brevo). Throttle 200/jour, reprise auto, table claim_log.

Usage:
  python relance_claim.py --test adresse@mail.com   # 1 mail de test (no DB)
  python relance_claim.py                           # envoi réel des pending
"""

import json
import os
import smtplib
import sqlite3
import sys
import time
from datetime import date, datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

BASE_DIR = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
TARGETS_JSON = BASE_DIR + "/claim_targets.json"
DB_FILE = BASE_DIR + "/outreach_tracking.db"
SITE_URL = "https://madaspot.com"
DAILY_LIMIT = 200
DELAY = 4.0
VUES_MOIS = 360


def _env(name):
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
    for line in open(p, encoding="utf-8", errors="ignore"):
        s = line.strip()
        if s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        if k.strip() == name:
            return v.strip().strip('"').strip("'")
    return None


SMTP_HOST = _env("SMTP_HOST") or "smtp.gmail.com"
SMTP_PORT = int(_env("SMTP_PORT") or "587")
SMTP_USER = _env("SMTP_USER") or ""
SMTP_PASS = _env("SMTP_PASS") or ""
SENDER_NAME = "Metosaela — Mada Spot"
REPLY_TO = "contact@madaspot.com"
if not SMTP_USER or not SMTP_PASS:
    raise SystemExit("Missing SMTP_USER/SMTP_PASS in .env")


def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("""CREATE TABLE IF NOT EXISTS claim_log (
        email TEXT PRIMARY KEY, establishment TEXT, status TEXT DEFAULT 'pending',
        sent_at TEXT, error TEXT)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS claim_daily_log (
        date TEXT PRIMARY KEY, sent_count INTEGER DEFAULT 0)""")
    conn.commit()
    return conn


def type_label(t):
    return {"HOTEL": "hôtel", "RESTAURANT": "restaurant",
            "ATTRACTION": "site", "PROVIDER": "activité"}.get(t, "établissement")


def build_email(t):
    name = (t.get("name") or "votre établissement").strip()
    city = (t.get("city") or "").strip()
    region = f" à {city}" if city and city.lower() not in ("non spécifié", "non specifie") else ""
    tlabel = type_label(t.get("type"))
    claim = t.get("claimUrl") or SITE_URL

    subject = f"{name} est déjà sur Mada Spot — reprenez-en le contrôle"

    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">

<div style="padding:24px 0;text-align:center">
  <img src="https://madaspot.com/logo.png" alt="Mada Spot" width="46" height="46" style="border-radius:11px">
</div>

<div style="padding:0 26px">
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Bonjour,</p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Bonne nouvelle : votre {tlabel} <strong>{name}</strong>{region} figure déjà sur
    <strong>Mada Spot</strong>, le guide en ligne des meilleurs spots de Madagascar.
    Sa fiche est <strong>en ligne et consultée par des voyageurs</strong>.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Seul point : <strong>personne ne la gère pour l'instant</strong>. En la
    revendiquant (c'est gratuit), vous pourrez ajouter vos photos, vos tarifs,
    vos coordonnées, et recevoir directement les demandes des voyageurs.
  </p>

  <div style="text-align:center;margin:28px 0">
    <a href="{claim}" style="display:inline-block;padding:15px 32px;background:#ff6b35;color:#ffffff;text-decoration:none;border-radius:11px;font-weight:700;font-size:16px">
      Voir et revendiquer ma fiche &nbsp;&#8594;
    </a>
  </div>

  <p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#334155">
    Sur votre fiche, cliquez sur <strong>« Revendiquer cette fiche »</strong>,
    créez votre compte en 2 minutes, et vous en prenez le contrôle. Les voyageurs
    préparent en ce moment la haute saison (juin‑août) : les fiches Mada Spot ont
    déjà été vues plus de {VUES_MOIS} fois ce mois‑ci.
  </p>

  <p style="font-size:15px;line-height:1.7;margin:0 0 8px;color:#334155">
    Un souci pour revendiquer ? Répondez simplement à cet e-mail, je m'en occupe.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:22px 0 8px">Bien à vous,</p>
  <p style="font-size:16px;line-height:1.5;margin:0 0 2px"><strong>Metosaela RANDRIAMAZAORO</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0 0 2px">Business Developer</p>
  <p style="font-size:14px;color:#64748b;margin:0">Mada Spot — <a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a></p>
</div>

<div style="margin-top:30px;padding:14px 26px;border-top:1px solid #eef2f7">
  <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center">
    Vous recevez ce message car {name} figure dans l'annuaire public du tourisme malgache.
    Pour ne plus recevoir nos messages, répondez avec « STOP ».
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


def main():
    targets = json.load(open(TARGETS_JSON, encoding="utf-8"))
    by_email = {(t.get("email") or "").strip().lower(): t for t in targets}

    if len(sys.argv) >= 3 and sys.argv[1] == "--test":
        dest = sys.argv[2]
        subject, html = build_email(targets[0])
        subject = "[TEST] " + subject
        smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30); smtp.starttls(); smtp.login(SMTP_USER, SMTP_PASS)
        send_email(smtp, dest, "Test", subject, html); smtp.quit()
        print(f"TEST envoyé à {dest} | fiche: {targets[0].get('name')} | sujet: {subject}")
        return

    conn = init_db()
    for t in targets:
        e = (t.get("email") or "").strip().lower()
        if e and "@" in e:
            conn.execute("INSERT OR IGNORE INTO claim_log (email, establishment) VALUES (?,?)", (e, t.get("name")))
    conn.commit()

    today = date.today().isoformat()
    row = conn.execute("SELECT sent_count FROM claim_daily_log WHERE date=?", (today,)).fetchone()
    if not row:
        conn.execute("INSERT INTO claim_daily_log (date, sent_count) VALUES (?,0)", (today,))
        conn.commit(); sent_today = 0
    else:
        sent_today = row[0]
    remaining = DAILY_LIMIT - sent_today

    pending = conn.execute("SELECT email FROM claim_log WHERE status='pending' LIMIT ?", (remaining,)).fetchall()
    counts = dict(conn.execute("SELECT status,COUNT(*) FROM claim_log GROUP BY status").fetchall())
    print("=" * 60)
    print("  CAMPAGNE REVENDICATION — Gmail")
    print(f"  Total {sum(counts.values())} | sent {counts.get('sent',0)} | pending {counts.get('pending',0)} | failed {counts.get('failed',0)}")
    print(f"  À envoyer maintenant: {len(pending)}")
    print("=" * 60)
    if not pending:
        print("Rien à envoyer.")
        return

    smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30); smtp.starttls(); smtp.login(SMTP_USER, SMTP_PASS)
    ok = err = 0
    try:
        for i, (email,) in enumerate(pending):
            t = by_email.get(email)
            if not t:
                conn.execute("UPDATE claim_log SET status='skipped' WHERE email=?", (email,)); continue
            subject, html = build_email(t)
            try:
                send_email(smtp, email, t.get("name"), subject, html)
                conn.execute("UPDATE claim_log SET status='sent', sent_at=? WHERE email=?", (datetime.now().isoformat(), email))
                ok += 1
                conn.execute("UPDATE claim_daily_log SET sent_count=sent_count+1 WHERE date=?", (today,))
                print(f"  [{ok}/{len(pending)}] OK — {t.get('name')[:30]} ({email})")
            except Exception as e:
                conn.execute("UPDATE claim_log SET status='failed', error=? WHERE email=?", (str(e)[:120], email))
                err += 1
                print(f"  [ERR] {email}: {str(e)[:90]}")
            if (i + 1) % 10 == 0:
                conn.commit()
            time.sleep(DELAY)
    finally:
        try: smtp.quit()
        except Exception: pass
    conn.commit()
    print("=" * 60)
    print(f"  Envoyés: {ok} | Erreurs: {err}")
    print("=" * 60)
    conn.close()


if __name__ == "__main__":
    main()
