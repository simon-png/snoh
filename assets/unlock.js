const unlockForm = document.querySelector('#unlock-form');
const input = document.querySelector('#page-password');
const button = unlockForm?.querySelector('button');
let unlocking = false;
function updateUnlockButton() {
  if (button) button.disabled = unlocking || input.value.length < 2;
}
input?.addEventListener('input', updateUnlockButton);
input?.addEventListener('change', updateUnlockButton);
window.addEventListener('pageshow', updateUnlockButton);
updateUnlockButton();
unlockForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const message = document.querySelector('#unlock-error');
  if (unlocking || input.value.length < 2) return;
  unlocking = true;
  input.readOnly = true;
  unlockForm.setAttribute('aria-busy', 'true');
  updateUnlockButton();
  message.textContent = 'Unlocking…';
  let payload;
  try {
    const response = await fetch('./content.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Content unavailable');
    payload = await response.json();
  } catch {
    message.textContent = 'Unable to load this page. Please try again.';
    finishUnlock();
    return;
  }
  try {
    if (!window.crypto?.subtle) throw new Error('HTTPS required');
    const bytes = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(input.value), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(payload.salt), iterations: payload.iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(payload.iv) }, key, bytes(payload.ciphertext));
    input.value = '';
    // Authenticated, locally authored HTML; never store the password or decrypted page.
    document.open();
    document.write(new TextDecoder().decode(plaintext));
    document.close();
  } catch {
    message.textContent = window.crypto?.subtle ? 'Incorrect password. Please try again.' : 'Open this page over HTTPS to unlock it.';
    input.value = '';
    input.focus();
    finishUnlock();
  }
});

function finishUnlock() {
  unlocking = false;
  input.readOnly = false;
  unlockForm.removeAttribute('aria-busy');
  updateUnlockButton();
}
