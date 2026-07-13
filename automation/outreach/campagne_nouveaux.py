"""
Campagne outreach NOUVEAUX leads (annuaire pro + websearch) — via Brevo.
Cible : leads_neufs_master.json (prospects froids jamais contactés).
Message : "Référencez gratuitement votre établissement sur Mada Spot".
Throttle progressif (segment froid) : J1=50, J2=100, J3=200, puis 300/j.
Table dédiée nouveaux_leads. Reprise auto. Lien désinscription.

Usage:
  python campagne_nouveaux.py --import   # importe le JSON en base, n'envoie rien
  python campagne_nouveaux.py --test x@y # 1 mail de test
  python campagne_nouveaux.py            # envoi réel (throttlé)
"""
import csv, json, os, sys, time, sqlite3, hashlib
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
SENDER_EMAIL = "contact@madaspot.com"
SENDER_NAME = "Metosaela RANDRIAMAZAORO — Mada Spot"
SITE_URL = "https://madaspot.com"

BASE_DIR = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
LEADS_JSON = BASE_DIR + "/leads_neufs_master.json"
DB_FILE = BASE_DIR + "/outreach_tracking.db"
DELAY = 1.2
DAILY_LIMITS = {1: 50, 2: 100, 3: 200}
DEFAULT_DAILY_LIMIT = 300


def init_db():
    conn = sqlite3.connect(DB_FILE, timeout=30)
    conn.execute("""CREATE TABLE IF NOT EXISTS nouveaux_leads (
        email TEXT PRIMARY KEY, name TEXT, ville TEXT, cat TEXT, sous TEXT,
        status TEXT DEFAULT 'pending', sent_at TEXT, error TEXT, unsub TEXT)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS nouveaux_daily_log (
        date TEXT PRIMARY KEY, sent_count INTEGER DEFAULT 0, day_number INTEGER DEFAULT 1)""")
    conn.commit(); return conn


def unsub_token(email):
    return hashlib.sha256(f"madaspot-unsub-{email}".encode()).hexdigest()[:16]


def import_leads(conn):
    leads = json.load(open(LEADS_JSON, encoding="utf-8"))
    added = 0
    for x in leads:
        em = (x.get("email") or "").strip().lower()
        if not em or "@" not in em: continue
        cur = conn.execute(
            "INSERT OR IGNORE INTO nouveaux_leads (email,name,ville,cat,sous,unsub) VALUES (?,?,?,?,?,?)",
            (em, x.get("name", ""), x.get("ville", ""), x.get("cat", ""), x.get("sous", ""), unsub_token(em)))
        if cur.rowcount > 0: added += 1
    conn.commit(); return added, len(leads)


def type_phrase(cat, sous):
    s = (sous or "").lower(); c = (cat or "").lower()
    if "hôtel" in s or "hotel" in s: return "votre hôtel"
    if "restaur" in s: return "votre restaurant"
    if "café" in s or "salon de thé" in s: return "votre établissement"
    if "bar" in s or "lounge" in s: return "votre bar"
    if "pizzeria" in s: return "votre pizzeria"
    if "patiss" in s: return "votre pâtisserie"
    if "traiteur" in s: return "votre service traiteur"
    if "transport" in c or "voiture" in s or "transfert" in s or "navette" in s: return "votre service de transport"
    if "spa" in s or "bien" in s: return "votre espace bien-être"
    if "artisan" in s or "souvenir" in s: return "votre boutique"
    if "loisir" in c or "loisir" in s or "divertiss" in c: return "votre activité"
    if "art" in c or "culture" in c: return "votre établissement"
    return "votre établissement"


def build_email(row):
    email, name, ville, cat, sous, _t = row
    tp = type_phrase(cat, sous)
    display = name if name else "votre établissement"
    region = f" à {ville}" if ville and ville.lower() not in ("", "non spécifié") else ""
    unsub = f"{SITE_URL}/desinscription?token={_t}"
    subject = f"{display} — référencez-vous gratuitement sur Mada Spot"
    html = f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
<div style="padding:24px 0;text-align:center"><img src="https://madaspot.com/logo.png" alt="Mada Spot" width="48" height="48" style="border-radius:12px"></div>
<div style="padding:0 24px">
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Bonjour,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Je suis Metosaela, de <strong>Mada Spot</strong> (<a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a>),
    le guide en ligne des meilleurs spots de Madagascar : hôtels, restaurants, activités, bons plans.
  </p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    <strong>{display}</strong> — {tp}{region} — a tout à fait sa place auprès de nos visiteurs
    (voyageurs locaux et internationaux à la recherche de prestataires de confiance).
  </p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Le référencement est <strong>100% gratuit</strong> : fiche dédiée avec photos, description,
    contact direct, carte et avis clients.
  </p>
  <div style="text-align:center;margin:26px 0">
    <a href="{SITE_URL}/inscrire-etablissement" style="display:inline-block;padding:14px 28px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Référencer mon établissement →</a>
  </div>
  <p style="font-size:16px;line-height:1.7;margin:0 0 8px">Ou répondez simplement à cet e-mail avec votre logo + 2-3 photos, on s'occupe de tout.</p>
  <p style="font-size:16px;line-height:1.7;margin:22px 0 4px">Bien à vous,</p>
  <p style="font-size:16px;margin:0 0 2px"><strong>Metosaela RANDRIAMAZAORO</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0">Business Developer — Mada Spot · <a href="{SITE_URL}" style="color:#ff6b35">madaspot.com</a></p>
</div>
<div style="margin-top:36px;padding:16px 24px;border-top:1px solid #e2e8f0">
  <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center">
    Vous recevez ce message car {display} figure dans l'annuaire public des professionnels malgaches.<br>
    <a href="{unsub}" style="color:#94a3b8">Se désinscrire</a></p>
</div></div>"""
    return subject, html


def send(to_email, to_name, subject, html):
    payload = {"sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
               "to": [{"email": to_email, "name": to_name or to_email}],
               "subject": subject, "htmlContent": html,
               "headers": {"X-Mailin-Tag": "nouveaux-leads-2026"}}
    r = requests.post("https://api.brevo.com/v3/smtp/email", json=payload,
                      headers={"accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY},
                      timeout=30, verify=SSL_VERIFY)
    return r.status_code, r.text


def daily_state(conn):
    today = date.today().isoformat()
    row = conn.execute("SELECT sent_count,day_number FROM nouveaux_daily_log WHERE date=?", (today,)).fetchone()
    if row: return row[0], DAILY_LIMITS.get(row[1], DEFAULT_DAILY_LIMIT)
    n = conn.execute("SELECT COUNT(*) FROM nouveaux_daily_log").fetchone()[0] + 1
    conn.execute("INSERT INTO nouveaux_daily_log (date,sent_count,day_number) VALUES (?,0,?)", (today, n)); conn.commit()
    return 0, DAILY_LIMITS.get(n, DEFAULT_DAILY_LIMIT)


def main():
    conn = init_db()
    added, total = import_leads(conn)
    counts = dict(conn.execute("SELECT status,COUNT(*) FROM nouveaux_leads GROUP BY status").fetchall())
    print(f"Leads en base: {sum(counts.values())} | envoyés: {counts.get('sent',0)} | en attente: {counts.get('pending',0)} | nouveaux importés: {added}")

    if len(sys.argv) >= 2 and sys.argv[1] == "--import":
        print("Import seul, aucun envoi."); return
    if len(sys.argv) >= 3 and sys.argv[1] == "--test":
        row = conn.execute("SELECT email,name,ville,cat,sous,unsub FROM nouveaux_leads LIMIT 1").fetchone()
        subj, html = build_email(row); subj = "[TEST] " + subj
        code, resp = send(sys.argv[2], row[1], subj, html)
        print(f"TEST -> {sys.argv[2]} | HTTP {code} | {resp[:150]}"); return

    sent_today, limit = daily_state(conn)
    remaining = limit - sent_today
    today = date.today().isoformat()
    print(f"Aujourd'hui: {sent_today}/{limit} (reste {remaining})")
    if remaining <= 0: print("Limite du jour atteinte."); return
    batch = conn.execute("SELECT email,name,ville,cat,sous,unsub FROM nouveaux_leads WHERE status='pending' LIMIT ?", (remaining,)).fetchall()
    if not batch: print("Rien à envoyer."); return
    print(f">>> Envoi de {len(batch)} e-mails...")
    ok = err = 0
    for i, row in enumerate(batch):
        email = row[0]
        subj, html = build_email(row)
        try:
            code, resp = send(email, row[1], subj, html)
            if code in (200, 201):
                conn.execute("UPDATE nouveaux_leads SET status='sent',sent_at=? WHERE email=?", (datetime.now().isoformat(), email))
                conn.execute("UPDATE nouveaux_daily_log SET sent_count=sent_count+1 WHERE date=?", (today,))
                ok += 1; print(f"  [{ok}/{len(batch)}] OK {email}")
            else:
                conn.execute("UPDATE nouveaux_leads SET status='failed',error=? WHERE email=?", (resp[:120], email))
                err += 1; print(f"  [ERR {code}] {email}: {resp[:90]}")
                if "unrecognised IP" in resp: print("\n>>> IP Brevo non autorisée — arrêt. Autorise l'IP puis relance."); break
        except Exception as e:
            conn.execute("UPDATE nouveaux_leads SET status='failed',error=? WHERE email=?", (str(e)[:120], email)); err += 1
        if (i + 1) % 10 == 0: conn.commit()
        time.sleep(DELAY)
    conn.commit()
    print(f"\nEnvoyés: {ok} | Erreurs: {err}")
    conn.close()


if __name__ == "__main__":
    main()
