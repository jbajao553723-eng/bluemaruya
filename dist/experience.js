(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let slides = [], index = 0, timer = null, paused = reduceMotion.matches, hovered = false, focused = false, generation = 0, motionEnabled = true;
  const hero = document.querySelector('#home');
  const heroArt = hero?.querySelector('.hero-art');
  const dots = document.querySelector('#heroDots');
  const pause = document.querySelector('#heroPause');

  function renderPauseIcon() {
    if (!pause) return;
    pause.setAttribute('aria-pressed', paused);
    pause.setAttribute('aria-label', paused ? 'Resume featured rotation' : 'Pause featured rotation');
    pause.innerHTML = `<svg${paused ? ' class="fill-icon"' : ''}><use href="${paused ? '#i-play' : '#i-pause'}"/></svg>`;
  }

  function shouldRotate() {
    return motionEnabled && !paused && !hovered && !focused && !document.hidden && !hero.hidden && !document.body.classList.contains('dialog-open') && window.memberAuth?.isAuthenticated();
  }

  function syncRotationState() {
    const active = slides.length > 1 && shouldRotate();
    hero?.classList.toggle('is-rotating', active);
    hero?.classList.toggle('is-paused', !active);
  }

  function restartDotProgress() {
    const activeDot = dots?.querySelector('.hero-dot.active');
    if (!activeDot) return;
    activeDot.classList.remove('is-progressing');
    void activeDot.offsetWidth;
    if (slides.length > 1 && shouldRotate()) activeDot.classList.add('is-progressing');
  }

  function schedule() {
    clearTimeout(timer);
    syncRotationState();
    if (slides.length > 1 && shouldRotate()) {
      restartDotProgress();
      timer = setTimeout(() => { if (shouldRotate()) select((index + 1) % slides.length); }, 9000);
    }
  }

  function select(next) {
    if (!slides.length) return;
    index = ((next % slides.length) + slides.length) % slides.length;
    window.dispatchEvent(new CustomEvent('cinema:feature', { detail: slides[index] }));
    document.querySelector('#heroPosition').textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    [...dots.children].forEach((dot, position) => {
      const isActive = position === index;
      dot.classList.toggle('active', isActive);
      dot.classList.remove('is-progressing');
      dot.setAttribute('aria-pressed', isActive);
    });
    schedule();
  }

  function updateBackdrop(src) {
    const images = [...document.querySelectorAll('.hero-image')];
    const active = images.find(image => image.classList.contains('is-active')) || images[0];
    if (active.getAttribute('src') === src) return;
    const next = images.find(image => image !== active);
    const current = ++generation;
    const preload = new Image();
    preload.onload = () => {
      if (current !== generation) return;
      next.src = src;
      next.classList.add('is-active');
      active.classList.remove('is-active');
    };
    preload.src = src;
  }

  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .06 }) : null;

  window.cinema = {
    setMotion(enabled) {
      motionEnabled = enabled;
      pause.disabled = !enabled;
      if (!enabled && heroArt) heroArt.style.removeProperty('--hero-shift');
      schedule();
    },
    updateBackdrop,
    setSlides(titles) {
      slides = titles.filter(title => title.backdrop).slice(0, 5);
      if (!slides.length) slides = titles.slice(0, 1);
      dots.replaceChildren(...slides.map((title, position) => {
        const dot = document.createElement('button');
        dot.className = 'hero-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Feature ' + title.title);
        dot.onclick = () => select(position);
        return dot;
      }));
      select(0);
      pause.hidden = slides.length < 2;
      document.querySelector('#heroNext').hidden = slides.length < 2;
    },
    observe() {
      if (revealObserver && !reduceMotion.matches) document.querySelectorAll('.shelf,.catalog-grid>.col').forEach(element => {
        element.classList.add('reveal-ready');
        revealObserver.observe(element);
      });
      schedule();
    },
    stop() { clearTimeout(timer); generation++; hero?.classList.remove('is-rotating'); }
  };

  renderPauseIcon();
  pause.addEventListener('click', () => {
    paused = !paused;
    renderPauseIcon();
    schedule();
  });
  document.querySelector('#heroNext').addEventListener('click', () => select(index + 1));

  // Touch swipe gestures for mobile hero slider
  let touchStartX = 0, touchStartY = 0, touchActive = false;
  hero.addEventListener('touchstart', event => {
    if (slides.length < 2 || event.touches.length !== 1) return;
    if (event.target.closest('button, a, input, select')) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchActive = true;
  }, { passive: true });
  hero.addEventListener('touchend', event => {
    if (!touchActive || !event.changedTouches.length) return;
    touchActive = false;
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      select(dx < 0 ? index + 1 : index - 1);
    }
  }, { passive: true });
  hero.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });

  // Subtle GPU-accelerated scroll parallax on the hero backdrop
  let parallaxFrame = 0;
  function updateParallax() {
    parallaxFrame = 0;
    if (!heroArt || !motionEnabled || reduceMotion.matches || hero.hidden) return;
    const y = Math.min(window.scrollY, 520);
    heroArt.style.setProperty('--hero-shift', `${(y * 0.14).toFixed(1)}px`);
  }
  window.addEventListener('scroll', () => {
    if (!parallaxFrame && motionEnabled && !reduceMotion.matches && !hero.hidden) {
      parallaxFrame = requestAnimationFrame(updateParallax);
    }
  }, { passive: true });

  hero.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  hero.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  hero.addEventListener('focusin', () => { focused = true; schedule(); });
  hero.addEventListener('focusout', event => { if (!hero.contains(event.relatedTarget)) { focused = false; schedule(); } });
  document.addEventListener('visibilitychange', schedule);
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  reduceMotion.addEventListener('change', event => {
    paused = event.matches;
    renderPauseIcon();
    if (event.matches && heroArt) heroArt.style.removeProperty('--hero-shift');
    schedule();
  });
  const top = document.querySelector('#backTop');
  window.addEventListener('scroll', () => { top.hidden = window.scrollY < 520; }, { passive: true });
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' }));
  document.querySelectorAll('.current-year').forEach(element => element.textContent = new Date().getFullYear());
})();
