#!/usr/bin/env python3
# Extrait les pièces jointes (photos/logos) des réponses reçues sur contact@madaspot.com,
# les upload sur Cloudinary, et sort la liste par établissement.
# Usage (sur le VPS) : IMAP_PASS='...' python3 scripts/inbox_extract.py
import imaplib, ssl, email, os, re, json, time, hashlib, urllib.request, uuid
from email.utils import parseaddr
from email.header import decode_header

def envfile(path, name):
    try:
        for l in open(path, encoding="utf-8", errors="ignore"):
            s = l.strip()
            if s.startswith(name + "="):
                return s.split("=", 1)[1].strip().strip('"').strip("'")
    except Exception:
        pass
    return None

ENV = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
CLOUD = envfile(ENV, "CLOUDINARY_CLOUD_NAME")
CKEY = envfile(ENV, "CLOUDINARY_API_KEY")
CSEC = envfile(ENV, "CLOUDINARY_API_SECRET")
IMAP_PASS = os.environ.get("IMAP_PASS", "")
U = "contact@madaspot.com"

def dec(v):
    if not v:
        return ""
    return "".join(t.decode(e or "utf-8", "ignore") if isinstance(t, bytes) else t
                   for t, e in decode_header(v))

def cloud_upload(data, folder):
    ts = str(int(time.time()))
    sig = hashlib.sha1(f"folder={folder}&timestamp={ts}{CSEC}".encode()).hexdigest()
    boundary = "----b" + uuid.uuid4().hex
    parts = []
    def field(n, v):
        parts.append(("--%s\r\nContent-Disposition: form-data; name=\"%s\"\r\n\r\n%s\r\n" % (boundary, n, v)).encode())
    field("api_key", CKEY); field("timestamp", ts); field("folder", folder); field("signature", sig)
    parts.append(("--%s\r\nContent-Disposition: form-data; name=\"file\"; filename=\"up\"\r\nContent-Type: application/octet-stream\r\n\r\n" % boundary).encode())
    parts.append(data)
    parts.append(("\r\n--%s--\r\n" % boundary).encode())
    body = b"".join(parts)
    req = urllib.request.Request(
        "https://api.cloudinary.com/v1_1/%s/auto/upload" % CLOUD,
        data=body, method="POST",
        headers={"Content-Type": "multipart/form-data; boundary=%s" % boundary})
    r = urllib.request.urlopen(req, timeout=60, context=ssl.create_default_context())
    return json.load(r).get("secure_url")

def main():
    M = imaplib.IMAP4_SSL("imap.ionos.fr", 993, ssl_context=ssl.create_default_context())
    M.login(U, IMAP_PASS); M.select("INBOX")
    ids = M.search(None, 'SINCE 01-Jun-2026')[1][0].split()
    out = {}
    for i in ids:
        m = email.message_from_bytes(M.fetch(i, "(RFC822)")[1][0][1])
        frm = parseaddr(m.get("From", ""))[1].lower()
        subj = dec(m.get("Subject"))
        if not frm or "brevo" in frm or "mailer-daemon" in frm or "no-reply" in frm:
            continue
        photos = []
        for p in m.walk():
            cd = str(p.get("Content-Disposition") or "")
            ct = p.get_content_type() or ""
            if ("attachment" in cd or "inline" in cd) and (ct.startswith("image/") or ct == "application/pdf"):
                try:
                    data = p.get_payload(decode=True)
                    if data and len(data) > 3000:
                        folder = "madaspot/inbox/" + re.sub(r'[^a-z0-9]', '', frm.split('@')[0])[:20]
                        url = cloud_upload(data, folder)
                        if url:
                            photos.append(url)
                except Exception:
                    pass
        if photos:
            out.setdefault(frm, {"from": frm, "subject": subj[:70], "photos": []})
            out[frm]["photos"] += photos
    M.logout()
    print(json.dumps(list(out.values()), ensure_ascii=False, indent=1))
    print("\n=== %d expediteurs avec photos, %d images uploadees ===" % (
        len(out), sum(len(v["photos"]) for v in out.values())))

if __name__ == "__main__":
    main()
