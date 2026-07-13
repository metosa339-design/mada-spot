"""
Relance #3 — non-convertis. Angle "done-for-you" : on crée la fiche POUR eux.
Cible : non_convertis3.json. Canal : Brevo. Throttle 300/j. Table relance3_log.
Usage: python relance3.py --test x@y  |  python relance3.py
"""
import json, os, sys, time, sqlite3, hashlib
from datetime import datetime, date
try:
    import requests
except ImportError:
    os.system("pip install requests"); import requests
import socket, urllib3.util.connection as urllib3_cn
urllib3_cn.allowed_gai_family = lambda: socket.AF_INET
import urllib3; urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
SSL_VERIFY = False

def _env(name):
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
    for line in open(p, encoding="utf-8", errors="ignore"):
        s = line.strip()
        if s.startswith("#") or "=" not in s: continue
        k, v = s.split("=", 1)
        if k.strip() == name: return v.strip().strip('"').strip("'")
    return None

BREVO_API_KEY = _env("BREVO_API_KEY") or ""
if not BREVO_API_KEY: raise SystemExit("Missing BREVO_API_KEY")
SENDER_EMAIL = "contact@madaspot.com"; SENDER_NAME = "Metosaela RANDRIAMAZAORO — Mada Spot"
SITE_URL = "https://madaspot.com"
BASE_DIR = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
SRC = BASE_DIR + "/non_convertis3.json"; DB_FILE = BASE_DIR + "/outreach_tracking.db"
DELAY = 1.2; DAILY_LIMIT = 300

def init_db():
    conn = sqlite3.connect(DB_FILE, timeout=30)
    conn.execute("""CREATE TABLE IF NOT EXISTS relance3_log (email TEXT PRIMARY KEY, status TEXT DEFAULT 'pending', sent_at TEXT, error TEXT, unsub TEXT)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS relance3_daily_log (date TEXT PRIMARY KEY, sent_count INTEGER DEFAULT 0)""")
    conn.commit(); return conn

def unsub_token(email): return hashlib.sha256(f"madaspot-unsub-{email}".encode()).hexdigest()[:16]

def import_targets(conn):
    data = json.load(open(SRC, encoding="utf-8")); added = 0
    for x in data:
        em = (x.get("email") or "").strip().lower()
        if not em or "@" not in em: continue
        if conn.execute("INSERT OR IGNORE INTO relance3_log (email, unsub) VALUES (?,?)", (em, unsub_token(em))).rowcount > 0: added += 1
    conn.commit(); return added

def build_email(email, token):
    unsub = f"{SITE_URL}/desinscription?token={token}"
    subject = "Référencez votre établissement sur Mada Spot — visibilité gratuite pour la haute saison"
    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
<div style="padding:24px 0;text-align:center"><img src="https://madaspot.com/logo.png" alt="Mada Spot" width="48" height="48" style="border-radius:12px"></div>
<div style="padding:0 24px">
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Bonjour,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Je me permets de revenir vers vous au sujet de <strong>Mada Spot</strong>
    (<a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a>), le guide en ligne des meilleurs spots de
    Madagascar : hôtels, restaurants, activités et bons plans.
  </p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Nous entrons en <strong>haute saison</strong> (juin‑août) : les voyageurs, locaux et internationaux,
    consultent en ce moment la plateforme pour choisir où séjourner, manger et sortir. Y figurer, c'est
    gagner en visibilité directement auprès d'eux.
  </p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Le référencement de votre établissement est <strong>gratuit</strong> et se fait en quelques minutes
    depuis votre espace : fiche dédiée avec photos, description, coordonnées, carte et avis clients.
  </p>
  <div style="text-align:center;margin:28px 0">
    <a href="{SITE_URL}/inscrire-etablissement" style="display:inline-block;padding:14px 30px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Créer ma fiche sur Mada Spot →</a>
  </div>
  <p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#334155">
    Rejoignez les nombreux établissements déjà référencés. Pour toute question sur la démarche,
    je reste à votre disposition.
  </p>
  <p style="font-size:16px;line-height:1.7;margin:22px 0 4px">Bien cordialement,</p>
  <p style="font-size:16px;margin:0 0 2px"><strong>Metosaela RANDRIAMAZAORO</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0">Business Developer — Mada Spot · <a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a></p>
</div>
<div style="margin-top:36px;padding:16px 24px;border-top:1px solid #e2e8f0">
  <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center">Vous recevez ce message car votre établissement figure dans l'annuaire public du tourisme malgache.<br><a href="{unsub}" style="color:#94a3b8">Se désinscrire</a></p>
</div></div>"""
    return subject, html

def send(to_email, subject, html):
    payload = {"sender": {"name": SENDER_NAME, "email": SENDER_EMAIL}, "to": [{"email": to_email}], "subject": subject, "htmlContent": html, "headers": {"X-Mailin-Tag": "relance3-madaspot-2026"}}
    r = requests.post("https://api.brevo.com/v3/smtp/email", json=payload, headers={"accept":"application/json","content-type":"application/json","api-key":BREVO_API_KEY}, timeout=30, verify=SSL_VERIFY)
    return r.status_code, r.text

def main():
    conn = init_db(); added = import_targets(conn)
    counts = dict(conn.execute("SELECT status,COUNT(*) FROM relance3_log GROUP BY status").fetchall())
    print(f"Cibles: {sum(counts.values())} | envoyés: {counts.get('sent',0)} | en attente: {counts.get('pending',0)} | importés: {added}")
    if len(sys.argv) >= 3 and sys.argv[1] == "--test":
        tok = unsub_token(sys.argv[2]); subj, html = build_email(sys.argv[2], tok); subj = "[TEST] " + subj
        code, resp = send(sys.argv[2], subj, html); print(f"TEST -> {sys.argv[2]} | HTTP {code} | {resp[:140]}"); return
    today = date.today().isoformat()
    row = conn.execute("SELECT sent_count FROM relance3_daily_log WHERE date=?", (today,)).fetchone()
    if not row: conn.execute("INSERT INTO relance3_daily_log (date,sent_count) VALUES (?,0)", (today,)); conn.commit(); sent_today = 0
    else: sent_today = row[0]
    remaining = DAILY_LIMIT - sent_today
    print(f"Aujourd'hui: {sent_today}/{DAILY_LIMIT} (reste {remaining})")
    if remaining <= 0: print("Limite du jour atteinte."); return
    batch = conn.execute("SELECT email,unsub FROM relance3_log WHERE status='pending' LIMIT ?", (remaining,)).fetchall()
    if not batch: print("Rien à envoyer."); return
    print(f">>> Envoi de {len(batch)} relances #3...")
    ok = err = 0
    for i,(email,tok) in enumerate(batch):
        subj, html = build_email(email, tok)
        try:
            code, resp = send(email, subj, html)
            if code in (200,201):
                conn.execute("UPDATE relance3_log SET status='sent',sent_at=? WHERE email=?", (datetime.now().isoformat(), email))
                conn.execute("UPDATE relance3_daily_log SET sent_count=sent_count+1 WHERE date=?", (today,)); ok += 1
                print(f"  [{ok}/{len(batch)}] OK {email}")
            else:
                conn.execute("UPDATE relance3_log SET status='failed',error=? WHERE email=?", (resp[:120], email)); err += 1
                print(f"  [ERR {code}] {email}: {resp[:80]}")
                if "unrecognised IP" in resp: print(">>> IP Brevo bloquée — arrêt."); break
        except Exception as e:
            conn.execute("UPDATE relance3_log SET status='failed',error=? WHERE email=?", (str(e)[:120], email)); err += 1
        if (i+1)%10==0: conn.commit()
        time.sleep(DELAY)
    conn.commit(); print(f"\nEnvoyés: {ok} | Erreurs: {err}"); conn.close()

if __name__ == "__main__":
    main()
