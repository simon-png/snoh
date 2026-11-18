const unlockForm = document.querySelector('#unlock-form');
const input = document.querySelector('#page-password');
const button = unlockForm?.querySelector('button');
const message = document.querySelector('#unlock-error');
const sessionKey = 'snoh.latest.decryption-key.v1';
let unlocking = false;

function updateUnlockButton() {
  if (button) button.disabled = unlocking || input.value.length < 2;
}

function setUnlocking(value) {
  unlocking = value;
  input.readOnly = value;
  if (value) unlockForm.setAttribute('aria-busy', 'true');
  else unlockForm.removeAttribute('aria-busy');
  updateUnlockButton();
}

const bytes = text => Uint8Array.from(atob(text), character => character.charCodeAt(0));
const base64 = data => btoa(String.fromCharCode(...new Uint8Array(data)));

async function loadPayload() {
  const response = await fetch('./content.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Content unavailable');
  return response.json();
}

async function decrypt(payload, key) {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes(payload.iv) }, key, bytes(payload.ciphertext)
  );
  return new TextDecoder().decode(plaintext);
}

function showPage(page) {
  input.value = '';
  document.open();
  document.write(page);
  document.close();
}

function clearSavedKey() {
  try { sessionStorage.removeItem(sessionKey); } catch { /* Storage may be unavailable. */ }
}

async function unlockFromSession() {
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(sessionKey)); } catch { return; }
  if (!saved) return;
  if (!window.crypto?.subtle) { clearSavedKey(); return; }
  setUnlocking(true);
  message.textContent = 'Unlocking…';
  let payload;
  try {
    payload = await loadPayload();
  } catch {
    message.textContent = 'Unable to load this page. Please try again.';
    setUnlocking(false);
    return;
  }
  try {
    if (saved.salt !== payload.salt) throw new Error('Content changed');
    const key = await crypto.subtle.importKey('raw', bytes(saved.key), 'AES-GCM', false, ['decrypt']);
    showPage(await decrypt(payload, key));
  } catch {
    clearSavedKey();
    message.textContent = '';
    setUnlocking(false);
  }
}

input?.addEventListener('input', updateUnlockButton);
input?.addEventListener('change', updateUnlockButton);
window.addEventListener('pageshow', updateUnlockButton);
updateUnlockButton();
unlockFromSession();

unlockForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (unlocking || input.value.length < 2) return;
  setUnlocking(true);
  message.textContent = 'Unlocking…';
  let payload;
  try {
    payload = await loadPayload();
  } catch {
    message.textContent = 'Unable to load this page. Please try again.';
    setUnlocking(false);
    return;
  }
  try {
    if (!window.crypto?.subtle) throw new Error('HTTPS required');
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(input.value), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: bytes(payload.salt), iterations: payload.iterations, hash: 'SHA-256' },
      material, { name: 'AES-GCM', length: 256 }, true, ['decrypt']
    );
    const page = await decrypt(payload, key);
    // Save only this document's derived key, not the password or decrypted HTML.
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({
        salt: payload.salt, key: base64(await crypto.subtle.exportKey('raw', key))
      }));
    } catch { /* Unlock still works when storage is unavailable. */ }
    showPage(page);
  } catch {
    message.textContent = window.crypto?.subtle ? 'Incorrect password. Please try again.' : 'Open this page over HTTPS to unlock it.';
    input.value = '';
    input.focus();
    setUnlocking(false);
  }
});
