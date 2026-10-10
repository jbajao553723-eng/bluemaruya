(() => {
  const screen = document.querySelector('#loginScreen');
  const slides = [...screen.querySelectorAll('.login-bg-slide')];
  const dots = [...screen.querySelectorAll('[data-login-photo]')];
  const counter = document.querySelector('#loginPhotoCounter');
  const pause = document.querySelector('#loginPhotoPause');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, paused = motion.matches, timer;
  function schedule() {
    clearTimeout(timer);
    if (!paused && !document.hidden && !screen.hidden) timer = setTimeout(() => select((index + 1) % slides.length), 7000);
  }
  function updatePause() {
    screen.querySelector('.login-scene').classList.toggle('is-paused', paused);
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Resume background rotation' : 'Pause background rotation');
    pause.textContent = paused ? '▷' : 'Ⅱ';
  }
  function select(next) {
    index = next;
    slides.forEach((slide, i) => slide.classList.toggle('is-current', i === index));
    dots.forEach((dot, i) => { dot.classList.toggle('is-current', i === index); dot.setAttribute('aria-pressed', String(i === index)); });
    counter.replaceChildren(document.createTextNode(String(index + 1).padStart(2, '0') + ' '));
    const total = document.createElement('span'); total.textContent = '/ 04'; counter.append(total);
    schedule();
  }
  pause.addEventListener('click', () => { paused = !paused; updatePause(); schedule(); });
  document.querySelector('#loginPhotoNext').addEventListener('click', () => select((index + 1) % slides.length));
  dots.forEach((dot, i) => dot.addEventListener('click', () => select(i)));
  document.addEventListener('visibilitychange', schedule);
  new MutationObserver(schedule).observe(screen, { attributes: true, attributeFilter: ['hidden'] });
  motion.addEventListener('change', event => { paused = event.matches; updatePause(); schedule(); });
  updatePause(); schedule();
})();
