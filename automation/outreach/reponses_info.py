"""Reponses personnalisees aux info-seekers + prospects chauds. Canal Brevo. Table reponses_log."""
import os, sys, time, sqlite3
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
DB = "C:/Users/ISIM NICE/Desktop/campagne madaspot/outreach_tracking.db"

# email -> note specifique (ou "")
TARGETS = {
    "jeancharles1974@gmail.com": "Pour répondre précisément à votre question : le référencement est <strong>entièrement gratuit</strong>, il n'y a aucun coût ni frais caché.",
    "contact@tianaina.com": "Concernant les avis clients : ils font partie de la plateforme (ils rassurent les voyageurs), mais vous gardez la pleine maîtrise du contenu de votre fiche. Écrivez-moi si vous souhaitez qu'on en discute pour votre cas.",
    "mic@nocommentbar.mg": "Vous pouvez créer une fiche distincte pour chacun de vos établissements (No Comment Bar, Chez Papa, La Petite Brasserie).",
    "meatingbbqstation@gmail.com": "",
    "contact@prestige-travel.mg": "",
    "mareva.nosybe@gmail.com": "",
    "contact@lahimena-tours.com": "Avec plaisir pour un échange : répondez-moi avec un créneau qui vous convient et votre numéro WhatsApp.",
    "aherintsainatsiky1@gmail.com": "Oui, c'est bien 100% gratuit, sans abonnement ni engagement. Vous pouvez voir des fiches déjà en ligne directement sur madaspot.com (rubrique Restaurants / Hôtels).",
    "heninkaja.services@gmail.com": "",
    "com@as-guesthouse-antananarivo.com": "Notre audience : voyageurs locaux et internationaux préparant leur séjour. Le référencement gratuit est sans durée limite ni option payante imposée, et la mise en avant se fait selon la complétude et la qualité de la fiche.",
}

def build(extra):
    block = f'<p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#334155">{extra}</p>' if extra else ""
    return f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
<div style="padding:24px 0;text-align:center"><img src="https://madaspot.com/logo.png" width="46" height="46" style="border-radius:11px" alt="Mada Spot"></div>
<div style="padding:0 24px">
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Bonjour,</p>
  <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Merci pour votre message et votre intérêt pour <strong>Mada Spot</strong>. Voici l'essentiel :</p>
  <ul style="font-size:15px;line-height:1.8;margin:0 0 16px;padding-left:20px;color:#334155">
    <li><strong>Mada Spot</strong> est le guide en ligne des meilleurs spots de Madagascar (hôtels, restaurants, activités), consulté par des voyageurs locaux et internationaux.</li>
    <li>Le référencement est <strong>100% gratuit</strong> : sans abonnement, sans frais caché, sans engagement.</li>
    <li>Vous gardez la <strong>maîtrise totale de votre fiche</strong> (photos, description, coordonnées), modifiable à tout moment.</li>
  </ul>
  {block}
  <div style="text-align:center;margin:26px 0">
    <a href="{SITE}/inscrire-etablissement" style="display:inline-block;padding:14px 30px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Créer ma fiche (5 min) →</a>
  </div>
  <p style="font-size:15px;line-height:1.7;margin:0 0 8px;color:#334155">Le formulaire vient d'être amélioré (ajout de photos plus fluide). Je reste à votre entière disposition pour toute question.</p>
  <p style="font-size:16px;line-height:1.7;margin:22px 0 4px">Bien cordialement,</p>
  <p style="font-size:16px;margin:0 0 2px"><strong>Metosaela RANDRIAMAZAORO</strong></p>
  <p style="font-size:14px;color:#64748b;margin:0">Business Developer — Mada Spot · <a href="{SITE}" style="color:#ff6b35">madaspot.com</a></p>
</div></div>"""

def send(to, subj, html):
    r = requests.post("https://api.brevo.com/v3/smtp/email",
        json={"sender": {"name": "Metosaela RANDRIAMAZAORO — Mada Spot", "email": "contact@madaspot.com"},
              "to": [{"email": to}], "subject": subj, "htmlContent": html, "headers": {"X-Mailin-Tag": "reponses-info-2026"}},
        headers={"accept": "application/json", "content-type": "application/json", "api-key": KEY}, timeout=30, verify=False)
    return r.status_code, r.text

def main():
    conn = sqlite3.connect(DB, timeout=30)
    conn.execute("CREATE TABLE IF NOT EXISTS reponses_log (email TEXT PRIMARY KEY, status TEXT, sent_at TEXT)")
    conn.commit()
    subj = "Votre référencement sur Mada Spot — réponse à votre message"
    if len(sys.argv) >= 3 and sys.argv[1] == "--test":
        code, resp = send(sys.argv[2], "[TEST] " + subj, build(TARGETS.get("contact@tianaina.com")))
        print(f"TEST {sys.argv[2]} -> {code} {resp[:120]}"); return
    ok = err = 0
    for email, extra in TARGETS.items():
        if conn.execute("SELECT 1 FROM reponses_log WHERE email=? AND status='sent'", (email,)).fetchone():
            continue
        code, resp = send(email, subj, build(extra))
        if code in (200, 201):
            conn.execute("INSERT OR REPLACE INTO reponses_log VALUES (?, 'sent', ?)", (email, datetime.now().isoformat())); ok += 1
            print(f"  OK {email}")
        else:
            print(f"  ERR {code} {email}: {resp[:80]}")
            if "unrecognised IP" in resp: break
        conn.commit(); time.sleep(1.2)
    print(f"\nEnvoyés: {ok} | Erreurs: {err}")
    conn.close()

if __name__ == "__main__":
    main()
