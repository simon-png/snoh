// All content remains visible without JavaScript. Enhance galleries progressively.
document.querySelectorAll('.gallery').forEach(gallery => {
  const slides = [...gallery.querySelectorAll('figure')];
  if (slides.length < 2) return;
  let current = 0;
  gallery.classList.add('enhanced');
  const controls = document.createElement('div');
  controls.className = 'gallery-controls';
  const previous = document.createElement('button');
  previous.type = 'button'; previous.textContent = '← Previous';
  const status = document.createElement('span');
  status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
  const next = document.createElement('button');
  next.type = 'button'; next.textContent = 'Next →';
  const show = index => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    status.textContent = `${current + 1} / ${slides.length}`;
  };
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  controls.append(previous, status, next); gallery.append(controls); show(0);
});

// Keep the footer link as a fallback when modal dialogs are unavailable.
const connectDialog = document.querySelector('#connect-dialog');
if (connectDialog && typeof connectDialog.showModal === 'function') {
  let connectTrigger;
  document.querySelectorAll('[data-connect]').forEach(trigger => {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'connect-dialog');
    trigger.addEventListener('click', event => {
      event.preventDefault();
      connectTrigger = trigger;
      connectDialog.showModal();
      document.documentElement.classList.add('connect-open');
    });
  });
  connectDialog.querySelector('.connect-close').addEventListener('click', () => connectDialog.close());
  connectDialog.addEventListener('click', event => {
    const bounds = connectDialog.getBoundingClientRect();
    if (event.target === connectDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) connectDialog.close();
  });
  connectDialog.addEventListener('close', () => {
    document.documentElement.classList.remove('connect-open');
    connectTrigger?.focus({ preventScroll: true });
  });
}
