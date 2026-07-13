"""
Mail "c'est corrige, reessayez" aux prospects qui avaient bute (upload/formulaire).
Cible : corrige_targets.json. Canal : Brevo. Table corrige_log.
Usage: python relance_corrige.py --test x@y  |  python relance_corrige.py
"""
import json, os, sys, time, sqlite3
from datetime import datetime, date
try:
    import requests
except ImportError:
    os.system("pip install requests"); import requests
import socket, urllib3.util.connection as urllib3_cn
urllib3_cn.allowed_gai_family = lambda: socket.AF_INET
import urllib3; urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def _env(name):
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
    for line in open(p, encoding="utf-8", errors="ignore"):
        s = line.strip()
        if s.startswith("#") or "=" not in s: continue
        k, v = s.split("=", 1)
        if k.strip() == name: return v.strip().strip('"').strip("'")
    return None

BREVO_API_KEY = _env("BREVO_API_KEY") or ""
SENDER_EMAIL = "contact@madaspot.com"; SENDER_NAME = "Metosaela RANDRIAMAZAORO — Mada Spot"
SITE_URL = "https://madaspot.com"
BASE_DIR = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
SRC = BASE_DIR + "/corrige_targets.json"; DB_FILE = BASE_DIR + "/outreach_tracking.db"
DELAY = 1.2

def init_db():
    conn = sqlite3.connect(DB_FILE, timeout=30)
    conn.execute("CREATE TABLE IF NOT EXISTS corrige_log (email TEXT PRIMARY KEY, status TEXT DEFAULT 'pending', sent_at TEXT, error TEXT)")
    conn.commit(); return conn

def build_email():
    subject = "Mada Spot — le souci d'inscription est corrigé, vous pouvez finaliser votre fiche"
    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
<div style="padding:24px 0;text-align:center"><img src="https://madaspot.com/logo.png" alt="Mada Spot" width="48" height="48" style="border-radius:12px"></div>
<div style="padding:0 24px">
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Bonjour,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Vous avez récemment souhaité référencer votre établissement sur <strong>Mada Spot</strong> et vous avez
    rencontré une difficulté (ajout des photos, formulaire). Toutes nos excuses — <strong>ce problème est
    maintenant corrigé.</strong>
  </p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Vous pouvez finaliser votre fiche en quelques minutes : l'ajout des photos fonctionne désormais normalement.
  </p>
  <div style="text-align:center;margin:26px 0">
    <a href="{SITE_URL}/inscrire-etablissement" style="display:inline-block;padding:14px 30px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Finaliser ma fiche →</a>
  </div>
  <p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#334155">
    Si vous nous aviez déjà envoyé vos photos par e-mail : vous pouvez soit les ajouter vous‑même (vous gardez
    la main sur votre fiche), soit simplement répondre à ce message et nous nous en occupons.
  </p>
  <p style="font-size:16px;line-height:1.7;margin:22px 0 4px">Merci de votre patience, et à très vite sur Mada Spot.</p>
  <p style="font-size:16px;margin:0 0 2px"><strong>Metosaela RANDRIAMAZAORO</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0">Business Developer — Mada Spot · <a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a></p>
</div></div>"""
    return subject, html

def send(to_email, subject, html):
    payload = {"sender": {"name": SENDER_NAME, "email": SENDER_EMAIL}, "to": [{"email": to_email}],
               "subject": subject, "htmlContent": html, "headers": {"X-Mailin-Tag": "corrige-madaspot-2026"}}
    r = requests.post("https://api.brevo.com/v3/smtp/email", json=payload,
                      headers={"accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY},
                      timeout=30, verify=False)
    return r.status_code, r.text

def main():
    conn = init_db()
    targets = json.load(open(SRC, encoding="utf-8"))
    for e in targets:
        e = e.strip().lower()
        if e and "@" in e: conn.execute("INSERT OR IGNORE INTO corrige_log (email) VALUES (?)", (e,))
    conn.commit()
    subject, html = build_email()
    if len(sys.argv) >= 3 and sys.argv[1] == "--test":
        code, resp = send(sys.argv[2], "[TEST] " + subject, html)
        print(f"TEST -> {sys.argv[2]} | HTTP {code} | {resp[:140]}"); return
    pending = conn.execute("SELECT email FROM corrige_log WHERE status='pending'").fetchall()
    print(f"À envoyer: {len(pending)}")
    ok = err = 0
    for (email,) in pending:
        code, resp = send(email, subject, html)
        if code in (200, 201):
            conn.execute("UPDATE corrige_log SET status='sent', sent_at=? WHERE email=?", (datetime.now().isoformat(), email)); ok += 1
            print(f"  [{ok}/{len(pending)}] OK {email}")
        else:
            conn.execute("UPDATE corrige_log SET status='failed', error=? WHERE email=?", (resp[:120], email)); err += 1
            print(f"  [ERR {code}] {email}: {resp[:80]}")
            if "unrecognised IP" in resp: print(">>> IP Brevo bloquée — arrêt."); break
        conn.commit(); time.sleep(DELAY)
    print(f"\nEnvoyés: {ok} | Erreurs: {err}")
    conn.close()

if __name__ == "__main__":
    main()
