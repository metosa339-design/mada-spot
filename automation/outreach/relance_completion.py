"""
Relance "complétion de profil" — Mada Spot
Concept : jauge personnalisée « votre fiche est complète à X% » + checklist d'actions.
Cible : tous les comptes < 100% (completion_targets.json).
Canal : Gmail SMTP (hors Brevo). Throttle 250/jour, reprise auto, table completion_log.

Usage:
  python relance_completion.py --test adresse@mail.com   # 1 mail de test (no DB)
  python relance_completion.py                           # envoi réel des pending
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
TARGETS_JSON = BASE_DIR + "/completion_targets.json"
DB_FILE = BASE_DIR + "/outreach_tracking.db"
SITE_URL = "https://madaspot.com"
DASH_URL = "https://madaspot.com/dashboard/etablissement"
DAILY_LIMIT = 250
DELAY = 4.0
VUES_MOIS = 367  # chiffre réel (EstablishmentView ce mois) — preuve sociale honnête


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
    conn.execute("""CREATE TABLE IF NOT EXISTS completion_log (
        email TEXT PRIMARY KEY, pct INTEGER, status TEXT DEFAULT 'pending',
        sent_at TEXT, error TEXT)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS completion_daily_log (
        date TEXT PRIMARY KEY, sent_count INTEGER DEFAULT 0)""")
    conn.commit()
    return conn


def _hook(pct, situation):
    """Phrase d'accroche selon l'avancement."""
    if situation == "no_fiche":
        return ("Votre compte est créé, mais votre établissement n'est pas encore visible "
                "des voyageurs. Une seule étape vous en sépare.")
    if pct >= 80:
        return ("Vous y êtes presque. Il ne reste <strong>qu'une seule action</strong> "
                "pour que votre fiche soit complète à 100%.")
    if pct >= 60:
        return ("Votre fiche est bien partie. Encore deux ou trois détails et elle sera "
                "parfaitement mise en valeur auprès des voyageurs.")
    return ("Votre fiche a besoin de quelques éléments pour ressortir et attirer les voyageurs.")


def _progress_bar(pct):
    fill = max(pct, 6)  # min visuel
    return f"""
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px">
    <tr>
      <td style="font-size:13px;color:#64748b;padding-bottom:6px">Progression de votre fiche</td>
      <td align="right" style="font-size:20px;font-weight:800;color:#ff6b35;padding-bottom:6px">{pct}%</td>
    </tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;border-radius:10px">
    <tr>
      <td width="{fill}%" bgcolor="#ff6b35" style="background:#ff6b35;height:16px;border-radius:10px;font-size:0;line-height:0">&nbsp;</td>
      <td style="font-size:0;line-height:0">&nbsp;</td>
    </tr>
  </table>"""


def _checklist(steps):
    rows = ""
    for s in steps:
        if s["done"]:
            icon = '<span style="color:#16a34a;font-weight:700">&#10003;</span>'
            label = f'<span style="color:#94a3b8;text-decoration:line-through">{s["label"]}</span>'
        else:
            icon = '<span style="color:#ff6b35;font-weight:700">&#9658;</span>'
            lbl = s["label"]
            if s.get("link"):
                lbl = f'<a href="{s["link"]}" style="color:#ff6b35;font-weight:600;text-decoration:none">{lbl}</a>'
            label = f'<strong style="color:#1a1a2e">{lbl}</strong>'
        rows += (f'<tr><td width="26" valign="top" style="padding:7px 0;font-size:16px">{icon}</td>'
                 f'<td style="padding:7px 0;font-size:15px;line-height:1.5">{label}</td></tr>')
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px">{rows}</table>'


def _cta_label(t):
    """Texte du bouton = 1ère action manquante."""
    todo = next((s for s in t.get("steps", []) if not s["done"]), None)
    lbl = (todo["label"] if todo else "").lower()
    if "fiche" in lbl:
        return "Publier ma fiche (5 min)"
    if "photos" in lbl:
        return "Ajouter mes photos"
    if "description" in lbl:
        return "Compléter ma description"
    if "coordonn" in lbl:
        return "Ajouter mes coordonnées"
    return "Compléter ma fiche"


def build_email(t):
    first = (t.get("firstName") or "").strip()
    pct = int(t.get("pct", 20))
    situation = t.get("situation", "no_fiche")
    est = (t.get("establishmentName") or "").strip()
    greeting = f"Bonjour {first}," if first else "Bonjour,"

    if situation == "no_fiche":
        subject = f"{(first+', v') if first else 'V'}otre fiche Mada Spot est prête à {pct}% — il manque l'essentiel"
    elif pct >= 80:
        subject = f"{(first+', i') if first else 'I'}l vous reste 1 étape — {est or 'votre fiche'} est à {pct}%"
    else:
        subject = f"{(first+', v') if first else 'V'}otre fiche {est} est complète à {pct}%"

    nom_fiche = f"<strong>{est}</strong>" if est else "votre établissement"

    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e;background:#ffffff">

<div style="padding:24px 0;text-align:center">
  <img src="https://madaspot.com/logo.png" alt="Mada Spot" width="46" height="46" style="border-radius:11px">
</div>

<div style="padding:0 26px">
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">{greeting}</p>

  <p style="font-size:16px;line-height:1.7;margin:0 0 18px">
    {_hook(pct, situation)}
  </p>

  <div style="background:#fff8f4;border:1px solid #ffe0cf;border-radius:14px;padding:18px 18px 14px;margin:0 0 22px">
    <p style="font-size:14px;margin:0 0 2px;color:#1a1a2e;font-weight:600">{nom_fiche}</p>
    {_progress_bar(pct)}
    {_checklist(t.get("steps", []))}
  </div>

  <div style="text-align:center;margin:26px 0">
    <a href="{t.get('ctaLink') or DASH_URL}" style="display:inline-block;padding:15px 34px;background:#ff6b35;color:#ffffff;text-decoration:none;border-radius:11px;font-weight:700;font-size:16px">
      {_cta_label(t)} &nbsp;&#8594;
    </a>
  </div>

  <p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#334155">
    Pourquoi maintenant ? Les voyageurs préparent en ce moment leurs séjours de
    <strong>juin à août</strong>, la haute saison. Rien que ce mois-ci, les fiches
    Mada Spot ont été consultées <strong>plus de {VUES_MOIS} fois</strong>. Une fiche
    complète (photos + description + contact) est jusqu'à <strong>5 fois plus cliquée</strong>
    qu'une fiche vide.
  </p>

  <p style="font-size:15px;line-height:1.7;margin:0 0 8px;color:#334155">
    Tout se fait depuis votre espace, en quelques minutes : vous gardez la main sur votre fiche
    et pouvez la modifier quand vous voulez. Une question sur la démarche ? Répondez à ce message.
  </p>

  <p style="font-size:16px;line-height:1.7;margin:22px 0 8px">Bien à vous,</p>
  <p style="font-size:16px;line-height:1.5;margin:0 0 2px"><strong>Metosaela RANDRIAMAZAORO</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0 0 2px">Business Developer</p>
  <p style="font-size:14px;color:#64748b;margin:0">Mada Spot — <a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a></p>
</div>

<div style="margin-top:30px;padding:14px 26px;border-top:1px solid #eef2f7">
  <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center">
    Vous recevez ce message car vous avez un compte prestataire sur Mada Spot.
    Pour ne plus recevoir ce type d'e-mail, répondez avec « STOP ».
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
        # un exemple "presque fini" (80%) pour montrer la jauge pleine
        sample = next((t for t in targets if t["pct"] == 80), targets[0])
        subject, html = build_email(sample)
        subject = "[TEST] " + subject
        smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30); smtp.starttls(); smtp.login(SMTP_USER, SMTP_PASS)
        send_email(smtp, dest, "Test", subject, html); smtp.quit()
        print(f"TEST envoyé à {dest} | exemple {sample['pct']}% | sujet: {subject}")
        return

    conn = init_db()
    for t in targets:
        e = (t.get("email") or "").strip().lower()
        if e and "@" in e:
            conn.execute("INSERT OR IGNORE INTO completion_log (email, pct) VALUES (?,?)", (e, t.get("pct")))
    conn.commit()

    today = date.today().isoformat()
    row = conn.execute("SELECT sent_count FROM completion_daily_log WHERE date=?", (today,)).fetchone()
    if not row:
        conn.execute("INSERT INTO completion_daily_log (date, sent_count) VALUES (?,0)", (today,))
        conn.commit(); sent_today = 0
    else:
        sent_today = row[0]
    remaining = DAILY_LIMIT - sent_today

    pending = conn.execute("SELECT email FROM completion_log WHERE status='pending' LIMIT ?", (remaining,)).fetchall()
    counts = dict(conn.execute("SELECT status,COUNT(*) FROM completion_log GROUP BY status").fetchall())
    print("=" * 60)
    print("  RELANCE COMPLÉTION (jauge) — Gmail")
    print(f"  Total {sum(counts.values())} | sent {counts.get('sent',0)} | pending {counts.get('pending',0)} | failed {counts.get('failed',0)}")
    print(f"  À envoyer maintenant: {len(pending)} (déjà {sent_today}/{DAILY_LIMIT} aujourd'hui)")
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
                conn.execute("UPDATE completion_log SET status='skipped' WHERE email=?", (email,)); continue
            subject, html = build_email(t)
            to_name = f"{t.get('firstName','')} {t.get('lastName','')}".strip() or email
            try:
                send_email(smtp, email, to_name, subject, html)
                conn.execute("UPDATE completion_log SET status='sent', sent_at=? WHERE email=?", (datetime.now().isoformat(), email))
                ok += 1
                conn.execute("UPDATE completion_daily_log SET sent_count=sent_count+1 WHERE date=?", (today,))
                print(f"  [{ok}/{len(pending)}] OK — {to_name[:28]} ({email}) {t.get('pct')}%")
            except Exception as e:
                conn.execute("UPDATE completion_log SET status='failed', error=? WHERE email=?", (str(e)[:120], email))
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
