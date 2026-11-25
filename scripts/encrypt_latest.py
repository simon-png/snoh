"""Encrypt local work for publication. Requires cryptography locally only."""
import base64, getpass, hashlib, html, json, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import build

def embed_private_image(body, source_file, placeholder, alt, width, height):
    image = (build.ROOT / 'private' / source_file).read_bytes()
    if not image.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError(source_file + ' must be a PNG')
    source = 'data:image/png;base64,' + base64.b64encode(image).decode()
    figure = ('<figure class="private-image-figure"><img src="' + source + '" alt="' +
              html.escape(alt, quote=True) + '" width="' + str(width) + '" height="' +
              str(height) + '" loading="lazy" decoding="async"></figure>')
    if body.count(placeholder) != 1:
        raise ValueError('Could not find the ' + source_file + ' placeholder exactly once')
    return body.replace(placeholder, figure)

def embed_presentation(body, source_file, placeholder, frame_id, title, resize_on_mobile=True, activate_on_click=False):
    presentation = (build.ROOT / 'private' / source_file).read_text()
    # The source lives outside Git. Each sandboxed frame has an opaque origin.
    presentation = presentation.replace('  if (location.hash !== h) history.replaceState(null, "", h);', '')
    resize_script = '''<script>
function reportHeight() {
  if (window.innerWidth < 760) {
    parent.postMessage({type: 'embedded-deck-height', height: document.documentElement.scrollHeight}, '*');
  }
}
new ResizeObserver(reportHeight).observe(document.querySelector('.viewport') || document.body);
window.addEventListener('load', reportHeight);
window.addEventListener('resize', reportHeight);
</script>'''
    if resize_on_mobile:
        presentation = presentation.replace('</body>', resize_script + '</body>')
    resize_attribute = ' data-resize-deck' if resize_on_mobile else ''
    figure_class = 'embedded-deck-figure board-activation-needed' if activate_on_click else 'embedded-deck-figure'
    inactive_attributes = ' aria-hidden="true" tabindex="-1"' if activate_on_click else ''
    activation_button = ('<button class="board-activation" type="button"><span>Click to explore board</span></button>'
                         if activate_on_click else '')
    frame = '<figure class="' + figure_class + '"><iframe id="' + frame_id + '"' + resize_attribute + inactive_attributes + ' title="' + html.escape(title, quote=True) + '" sandbox="allow-scripts" loading="lazy" srcdoc="' + html.escape(presentation, quote=True) + '"></iframe>' + activation_button + '</figure>'
    if body.count(placeholder) != 1:
        raise ValueError('Could not find the ' + title + ' placeholder exactly once')
    return body.replace(placeholder, frame)

def encrypt(password):
    if not password:
        raise ValueError('Password must not be empty')
    source = (build.ROOT / 'private/latest.html').read_text()
    # Private images must be embedded, not copied to public assets.
    if '<img' in source or '<script' in source or '<iframe' in source:
        raise ValueError('Review embedded media before encryption; private media must not be public URLs')
    body = build.localize(source, '../')
    body += '<section class="read-next wrap"><h2>Read next</h2>' + build.cards(build.SITE['projects'][:2], '../') + '</section>'
    body = embed_private_image(body, 'current-upsells-model.png',
                               '<figure><div class="img-placeholder">Image: The old upsells interface (blurred) or a diagram of the one-event-per-shirt-size workaround</div></figure>',
                               'Diagram showing three upsells created as separate events for each game in a ten-game season',
                               1918, 1068)
    body = embed_private_image(body, 'notebook-lm.png',
                               '<figure><div class="img-placeholder">Image: The NotebookLM notebook and its sources (blurred)</div></figure>',
                               'NotebookLM notebook showing research sources and cited user needs for offers management',
                               1546, 1136)
    body = embed_presentation(body, 'north-star.html',
                              '<figure><div class="img-placeholder">Image: Grid of the ten principle titles</div></figure>',
                              'north-star-frame', 'Future Upsells - North Star Principles')
    body = embed_presentation(body, 'now-next.html',
                              '<figure><div class="img-placeholder">Image: The backcasting board: five years out, two years out, six months out and today</div></figure>',
                              'now-next-frame', 'Offers Now and Next presentation')
    body = embed_presentation(body, 'stock-index.html',
                              '<figure><div class="img-placeholder">Image: The Product › Parent offer › Offer model</div></figure>',
                              'stock-index-frame', 'Why Product, Parent Offer and Offer presentation',
                              resize_on_mobile=False)
    body = embed_presentation(body, 'miro-ia.html',
                              '<figure><div class="img-placeholder">Image: The Miro IA, redrawn</div></figure>',
                              'miro-ia-frame', 'Target experience information architecture diagram',
                              resize_on_mobile=False, activate_on_click=True)
    body = embed_presentation(body, 'ditto.html',
                              '<figure><div class="img-placeholder">Image: Before / after — 2–3 hours vs under 20 minutes</div></figure>',
                              'ditto-frame', 'How Ditto Works diagram')
    body = embed_presentation(body, 'ai-native-design-delivery.html',
                              '<!-- AI-Native Design to Delivery diagram -->',
                              'ai-native-design-delivery-frame', 'AI-Native Design to Delivery diagram',
                              resize_on_mobile=False)
    body = embed_presentation(body, 'discovery-effort-risk.html',
                              '<!-- Discovery Effort to Risk diagram -->',
                              'discovery-effort-risk-frame', 'Discovery Effort to Risk diagram',
                              resize_on_mobile=False)
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
