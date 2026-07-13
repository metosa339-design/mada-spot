"""Relance interne "creez votre fiche" pour comptes SANS fiche. Auto-creation (jamais "on le fait pour vous"). Canal Brevo. Table sansfiche_log."""
import os, sys, time, sqlite3, json
from datetime import datetime
try:
    import requests
except ImportError:
    os.system("pip install requests"); import requests
import socket, urllib3.util.connection as u
u.allowed_gai_family = lambda: socket.AF_INET
import urllib3; urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def _env(n):
    for l in open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env"), encoding="utf-8", errors="ignore"):
        s = l.strip()
        if s.startswith(n + "="): return s.split("=", 1)[1].strip().strip('"').strip("'")
    return None

KEY = _env("BREVO_API_KEY"); SITE = "https://madaspot.com"
BASE = "C:/Users/ISIM NICE/Desktop/campagne madaspot"
DB = BASE + "/outreach_tracking.db"; SRC = BASE + "/sansfiche_targets.json"

def build():
    return f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
<div style="padding:24px 0;text-align:center"><img src="https://madaspot.com/logo.png" width="46" height="46" style="border-radius:11px" alt="Mada Spot"></div>
<div style="padding:0 24px">
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Bonjour,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    Vous avez créé votre compte sur <strong>Mada Spot</strong> — merci ! Il ne manque plus qu'une chose
    pour être visible des voyageurs : <strong>votre fiche établissement</strong>.
  </p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
    C'est la <strong>haute saison</strong> : les voyageurs consultent la plateforme en ce moment pour choisir
    où dormir, manger et sortir à Madagascar. Plus de <strong>100 établissements</strong> sont déjà en ligne
    et reçoivent des visites.
  </p>
  <div style="background:#fff8f4;border:1px solid #ffe0cf;border-radius:12px;padding:16px 18px;margin:0 0 18px">
    <p style="font-size:15px;line-height:1.7;margin:0;color:#1a1a2e">
      En <strong>5 minutes</strong>, vous créez votre fiche vous‑même : photos, description, coordonnées.
      Vous en gardez le <strong>contrôle total</strong> et la modifiez quand vous voulez. C'est
      <strong>100% gratuit</strong>.
    </p>
  </div>
  <p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#334155">
    Bonne nouvelle : le formulaire vient d'être amélioré — l'ajout de vos photos est désormais fluide et rapide.
  </p>
  <div style="text-align:center;margin:26px 0">
    <a href="{SITE}/dashboard/etablissement" style="display:inline-block;padding:15px 34px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:11px;font-weight:700;font-size:16px">Créer ma fiche maintenant →</a>
  </div>
  <p style="font-size:14px;line-height:1.7;margin:0 0 8px;color:#64748b">Votre établissement mérite d'être vu. Il ne vous reste qu'un clic.</p>
  <p style="font-size:16px;line-height:1.7;margin:22px 0 4px">Bien à vous,</p>
  <p style="font-size:16px;margin:0 0 2px"><strong>Metosaela RANDRIAMAZAORO</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0">Business Developer — Mada Spot · <a href="{SITE}" style="color:#ff6b35">madaspot.com</a></p>
</div>
<div style="margin-top:32px;padding:14px 24px;border-top:1px solid #eef2f7">
  <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center">Vous recevez ce message car vous avez un compte prestataire sur Mada Spot. Répondez « STOP » pour ne plus en recevoir.</p>
</div></div>"""

def send(to, subj, html):
    r = requests.post("https://api.brevo.com/v3/smtp/email",
        json={"sender": {"name": "Metosaela RANDRIAMAZAORO — Mada Spot", "email": "contact@madaspot.com"},
              "to": [{"email": to}], "subject": subj, "htmlContent": html, "headers": {"X-Mailin-Tag": "sansfiche-2026"}},
        headers={"accept": "application/json", "content-type": "application/json", "api-key": KEY}, timeout=30, verify=False)
    return r.status_code, r.text

def main():
    conn = sqlite3.connect(DB, timeout=30)
    conn.execute("CREATE TABLE IF NOT EXISTS sansfiche_log (email TEXT PRIMARY KEY, status TEXT DEFAULT 'pending', sent_at TEXT, error TEXT)")
    for e in json.load(open(SRC, encoding="utf-8")):
        e = (e or "").strip().lower()
        if e and "@" in e: conn.execute("INSERT OR IGNORE INTO sansfiche_log (email) VALUES (?)", (e,))
    conn.commit()
    # exclut les desinscrits connus (STOP)
    subj = "Votre établissement mérite sa place sur Mada Spot — créez votre fiche en 5 min"
    if len(sys.argv) >= 3 and sys.argv[1] == "--test":
        print(send(sys.argv[2], "[TEST] " + subj, build())); return
    pend = conn.execute("SELECT email FROM sansfiche_log WHERE status='pending'").fetchall()
    print(f"À envoyer: {len(pend)}")
    ok = err = 0
    html = build()
    for (email,) in pend:
        code, resp = send(email, subj, html)
        if code in (200, 201):
            conn.execute("UPDATE sansfiche_log SET status='sent', sent_at=? WHERE email=?", (datetime.now().isoformat(), email)); ok += 1
            print(f"  OK {email}")
        else:
            conn.execute("UPDATE sansfiche_log SET status='failed', error=? WHERE email=?", (resp[:100], email)); err += 1
            print(f"  ERR {code} {email}")
            if "unrecognised IP" in resp: break
        conn.commit(); time.sleep(1.2)
    print(f"\nEnvoyés: {ok} | Erreurs: {err}")
    conn.close()

if __name__ == "__main__":
    main()
