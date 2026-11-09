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
