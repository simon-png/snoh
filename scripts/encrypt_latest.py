"""Encrypt local work for publication. Requires cryptography locally only."""
import base64, getpass, hashlib, json, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import build

def encrypt(password):
    if not password:
        raise ValueError('Password must not be empty')
    source = (build.ROOT / 'private/latest.html').read_text()
    # Private images must be embedded, not copied to public assets.
    if '<img' in source or '<script' in source or '<iframe' in source:
        raise ValueError('Review embedded media before encryption; private media must not be public URLs')
    body = build.localize(source, '../')
    body += '<section class="read-next wrap"><h2>Read next</h2>' + build.cards(build.SITE['projects'][:2], '../') + '</section>'
    page = build.layout('Upselling the future', body, root='../', latest=True, noindex=True,
                        description='Protected work in progress.')
    salt, iv = os.urandom(16), os.urandom(12)
    rounds = 600000
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, rounds, 32)
    encode = lambda b: base64.b64encode(b).decode()
    payload = {'version': 1, 'iterations': rounds, 'salt': encode(salt), 'iv': encode(iv),
               'ciphertext': encode(AESGCM(key).encrypt(iv, page.encode(), None))}
    (build.ROOT / 'content/latest.encrypted.json').write_text(json.dumps(payload) + '\n')
    print('Encrypted latest page; password and plaintext were not written to public files.')

if __name__ == '__main__':
    password = getpass.getpass('Password: ')
    if password != getpass.getpass('Confirm password: '):
        raise SystemExit('Passwords did not match')
    encrypt(password)
