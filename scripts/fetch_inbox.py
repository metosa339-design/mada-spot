#!/usr/bin/env python3
"""Lit la boîte contact@madaspot (IMAP) et injecte les e-mails entrants dans le CRM
via POST /api/admin/crm/ingest-email (dédup par Message-ID côté serveur).
Ne modifie PAS l'état lu/non-lu (select readonly). Cron recommandé : toutes les 10 min.
Lit la config depuis /root/mada-spot/.env (IMAP_* + EMAIL_SECRET).
"""
import email
import imaplib
import json
import os
import ssl
import sys
import urllib.request
from datetime import datetime, timedelta
from email.header import decode_header
from email.utils import parseaddr

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
APP_URL = os.environ.get("APP_URL", "http://localhost:3000")


def load_env():
    cfg = {}
    try:
        for line in open(ENV_PATH, encoding="utf-8", errors="ignore"):
            s = line.strip()
            if s.startswith("#") or "=" not in s:
                continue
            k, v = s.split("=", 1)
            cfg[k.strip()] = v.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return cfg


def decode_str(raw):
    if not raw:
        return ""
    parts = decode_header(raw)
    out = ""
    for txt, enc in parts:
        if isinstance(txt, bytes):
            try:
                out += txt.decode(enc or "utf-8", errors="ignore")
            except Exception:
                out += txt.decode("utf-8", errors="ignore")
        else:
            out += txt
    return out


def get_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = str(part.get("Content-Disposition") or "")
            if ctype == "text/plain" and "attachment" not in disp:
                try:
                    return part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="ignore")
                except Exception:
                    continue
        # fallback html
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                try:
                    import re
                    html = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="ignore")
                    return re.sub(r"<[^>]+>", " ", html)
                except Exception:
                    continue
        return ""
    try:
        return msg.get_payload(decode=True).decode(msg.get_content_charset() or "utf-8", errors="ignore")
    except Exception:
        return str(msg.get_payload())


def post_ingest(secret, frm, from_name, subject, text, message_id, received_at):
    payload = json.dumps({
        "secret": secret,
        "from": frm,
        "fromName": from_name,
        "subject": subject,
        "text": text[:5000],
        "messageId": message_id,
        "receivedAt": received_at,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{APP_URL}/api/admin/crm/ingest-email",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status
    except Exception as e:
        return f"ERR {e}"


def main():
    cfg = load_env()
    host = cfg.get("IMAP_HOST", "imap.ionos.fr")
    port = int(cfg.get("IMAP_PORT", "993"))
    user = cfg.get("IMAP_USER")
    pwd = cfg.get("IMAP_PASS")
    secret = cfg.get("EMAIL_SECRET")
    if not user or not pwd or not secret:
        print(f"[{datetime.now()}] config manquante (IMAP_USER/IMAP_PASS/EMAIL_SECRET)")
        sys.exit(1)

    ctx = ssl.create_default_context()
    M = imaplib.IMAP4_SSL(host, port, ssl_context=ctx)
    M.login(user, pwd)
    M.select("INBOX", readonly=True)  # readonly = ne change pas l'état lu/non-lu

    full = "--all" in sys.argv
    if full:
        typ, data = M.search(None, "ALL")
    else:
        since = (datetime.utcnow() - timedelta(days=3)).strftime("%d-%b-%Y")
        typ, data = M.search(None, f'(SINCE {since})')
    ids = data[0].split() if data and data[0] else []
    cap = 3000 if full else 100

    ok = dedup = err = 0
    for num in ids[-cap:]:  # borne de sécurité
        typ, msg_data = M.fetch(num, "(BODY.PEEK[])")
        if not msg_data or not msg_data[0]:
            continue
        msg = email.message_from_bytes(msg_data[0][1])
        from_name, frm = parseaddr(msg.get("From", ""))
        if not frm:
            continue
        subject = decode_str(msg.get("Subject", ""))
        message_id = (msg.get("Message-ID") or "").strip() or None
        body = get_body(msg).strip()
        if not body:
            body = subject or "(message sans contenu texte)"  # évite le rejet des e-mails HTML sans texte
        date_hdr = msg.get("Date")
        try:
            received = email.utils.parsedate_to_datetime(date_hdr).isoformat()
        except Exception:
            received = datetime.utcnow().isoformat()

        status = post_ingest(secret, frm.lower(), decode_str(from_name), subject, body, message_id, received)
        if status in (200, 201):
            ok += 1
        elif status == 200:
            dedup += 1
        else:
            err += 1

    M.logout()
    print(f"[{datetime.now()}] IMAP {len(ids)} msgs ({'tout' if full else '3j'}) -> ingérés/ok:{ok} erreurs:{err}")


if __name__ == "__main__":
    main()
