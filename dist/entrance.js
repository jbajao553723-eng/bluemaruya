(() => {
  const intro = document.querySelector('#brandIntro');
  const profileGate = document.querySelector('#profileGate');
  const loginScreen = document.querySelector('#loginScreen');
  const profileButtons = [...document.querySelectorAll('[data-profile-target]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let introComplete = false;
  let selectedProfile = '';
  let introTimer;

  function presentAuthState() {
    if (!introComplete || document.body.dataset.authState === 'checking') return;
    const signedIn = document.body.dataset.authState === 'signed-in';
    profileGate.hidden = signedIn || Boolean(selectedProfile);
    if (!signedIn) loginScreen.hidden = !selectedProfile;
  }

  function finishIntro() {
    if (introComplete) return;
    introComplete = true;
    clearTimeout(introTimer);
    intro.classList.add('is-leaving');
    const delay = reducedMotion.matches ? 80 : 360;
    setTimeout(() => { intro.hidden = true; presentAuthState(); }, delay);
  }

  function chooseProfile(username) {
    selectedProfile = username;
    document.querySelector(`[data-login-member="${username}"]`)?.click();
    profileGate.hidden = true;
    loginScreen.hidden = false;
    requestAnimationFrame(() => document.querySelector('#password').focus());
  }

  profileButtons.forEach(button => button.addEventListener('click', () => chooseProfile(button.dataset.profileTarget)));
  document.querySelector('#backToProfiles').addEventListener('click', () => {
    selectedProfile = '';
    loginScreen.hidden = true;
    profileGate.hidden = false;
    profileButtons[0]?.focus();
  });
  document.querySelector('#skipIntro').addEventListener('click', finishIntro);
  window.addEventListener('auth:state', presentAuthState);
  window.addEventListener('member:signed-out', () => { selectedProfile = ''; presentAuthState(); });

  const menuButton = document.querySelector('#profileMenuButton');
  const menu = document.querySelector('#memberMenu');
  const closeMenu = () => { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); };
  menuButton.addEventListener('click', event => {
    event.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', event => { if (event.target.closest('button')) closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.profile-menu-wrap')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); } });
  window.profileMenu = { close: closeMenu };

  introTimer = setTimeout(finishIntro, reducedMotion.matches ? 350 : 2400);
})();
