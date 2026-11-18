// Scope initialization so the decrypted document can run this script again.
(() => {
// All content remains visible without JavaScript. Enhance galleries progressively.
document.querySelectorAll('.gallery').forEach(gallery => {
  const slides = [...gallery.querySelectorAll('figure')];
  if (slides.length < 2) return;
  let current = 0;
  gallery.classList.add('enhanced');
  const controls = document.createElement('div');
  controls.className = 'gallery-controls';
  const previous = document.createElement('button');
  previous.type = 'button'; previous.className = 'gallery-previous';
  previous.setAttribute('aria-label', 'Previous image');
  previous.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg>';
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
  const next = document.createElement('button');
  next.type = 'button'; next.className = 'gallery-next';
  next.setAttribute('aria-label', 'Next image');
  next.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m10 5 7 7-7 7"/></svg>';
  const show = index => {
    const changed = index !== current;
    const direction = index > current ? 1 : -1;
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.getAnimations?.().forEach(animation => animation.cancel());
      slide.hidden = i !== current;
    });
    if (changed && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      slides[current].animate?.([
        { opacity: 0, transform: `translateX(${direction * 20}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 400, easing: 'ease-out' });
    }
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

// Reveal a persistent return control after roughly one and a half viewports.
const backTop = document.querySelector('.back-top');
if (backTop) {
  backTop.classList.add('back-top-floating');
  let scrollUpdatePending = false;
  const updateBackTop = () => {
    backTop.hidden = window.scrollY < window.innerHeight * 1.5;
    scrollUpdatePending = false;
  };
  const scheduleBackTop = () => {
    if (!scrollUpdatePending) {
      scrollUpdatePending = true;
      window.requestAnimationFrame(updateBackTop);
    }
  };
  window.addEventListener('scroll', scheduleBackTop, { passive: true });
  window.addEventListener('resize', scheduleBackTop);
  window.addEventListener('pageshow', scheduleBackTop);
  backTop.addEventListener('click', event => {
    event.preventDefault();
    const target = document.querySelector('.site-header a');
    target?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
  updateBackTop();
}

// Animate containers without changing their reserved layout space.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('image-reveal-pending');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: `0px 0px -${Math.round(window.innerHeight * 0.30)}px 0px` });
  document.querySelectorAll('.case-body figure:not(.gallery figure):not(.embedded-deck-figure), .case-body .gallery, .project-image').forEach(element => {
    if (element.getBoundingClientRect().top < window.innerHeight * 0.70 && element.getBoundingClientRect().bottom > 0) return;
    element.classList.add('image-reveal', 'image-reveal-pending');
    observer.observe(element);
  });
}
// The encrypted presentations report their stacked heights from isolated frames.
const embeddedDecks = [...document.querySelectorAll('iframe[data-resize-deck]')];
if (embeddedDecks.length) {
  window.addEventListener('message', event => {
    const frame = embeddedDecks.find(deck => event.source === deck.contentWindow);
    if (!frame || event.data?.type !== 'embedded-deck-height') return;
    const height = Number(event.data.height);
    if (Number.isFinite(height) && height > 0 && height < 50000) frame.style.height = `${Math.ceil(height)}px`;
  });
  embeddedDecks.forEach(frame => {
    new ResizeObserver(() => {
      if (frame.getBoundingClientRect().width >= 760) frame.style.height = '';
    }).observe(frame);
  });
}
})();
