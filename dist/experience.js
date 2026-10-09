(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let slides = [], index = 0, timer = null, paused = reduceMotion.matches, hovered = false, focused = false, generation = 0;
  const hero = document.querySelector('#home');
  const dots = document.querySelector('#heroDots');
  const pause = document.querySelector('#heroPause');

  function shouldRotate() { return !paused && !hovered && !focused && !document.hidden && !hero.hidden && window.memberAuth?.isAuthenticated(); }
  function schedule() {
    clearTimeout(timer);
    if (slides.length > 1 && shouldRotate()) timer = setTimeout(() => select((index + 1) % slides.length), 9000);
  }
  function select(next) {
    if (!slides.length) return;
    index = next;
    window.dispatchEvent(new CustomEvent('cinema:feature', { detail: slides[index] }));
    document.querySelector('#heroPosition').textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    [...dots.children].forEach((dot, position) => {
      dot.classList.toggle('active', position === index);
      dot.setAttribute('aria-pressed', position === index);
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
    updateBackdrop,
    setSlides(titles) {
      slides = titles.filter(title => title.backdrop).slice(0, 5);
      if (!slides.length) slides = titles.slice(0, 1);
      dots.replaceChildren(...slides.map((title, position) => {
        const dot = document.createElement('button');
        dot.className = 'hero-dot';
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
    stop() { clearTimeout(timer); generation++; }
  };
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.setAttribute('aria-pressed', paused);
    pause.setAttribute('aria-label', paused ? 'Resume featured rotation' : 'Pause featured rotation');
    pause.textContent = paused ? '▷' : 'Ⅱ';
    schedule();
  });
  document.querySelector('#heroNext').addEventListener('click', () => select((index + 1) % slides.length));
  hero.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  hero.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  hero.addEventListener('focusin', () => { focused = true; schedule(); });
  hero.addEventListener('focusout', event => { if (!hero.contains(event.relatedTarget)) { focused = false; schedule(); } });
  document.addEventListener('visibilitychange', schedule);
  reduceMotion.addEventListener('change', event => {
    paused = event.matches;
    pause.setAttribute('aria-pressed', paused);
    pause.setAttribute('aria-label', paused ? 'Resume featured rotation' : 'Pause featured rotation');
    pause.textContent = paused ? '▷' : 'Ⅱ';
    schedule();
  });
  const top = document.querySelector('#backTop');
  window.addEventListener('scroll', () => { top.hidden = window.scrollY < 650; }, { passive: true });
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' }));
  document.querySelectorAll('.current-year').forEach(element => element.textContent = new Date().getFullYear());
})();
