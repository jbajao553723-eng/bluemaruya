(() => {
  const dialog = document.querySelector('#installDialog');
  const status = document.querySelector('#installStatus');
  const action = document.querySelector('#installAction');
  const standalone = matchMedia('(display-mode: standalone)');
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let promptEvent = null;
  let returnFocus = null;
  let installed = standalone.matches || navigator.standalone === true;
  function render() {
    document.querySelectorAll('[data-install]').forEach(button => { button.querySelector('[data-install-label]').textContent = installed ? 'App installed' : 'Get the app'; });
    document.querySelector('#installIOS').hidden = installed || !ios;
    document.querySelector('#installOther').hidden = installed || ios || !!promptEvent;
    action.hidden = installed || !promptEvent;
    status.textContent = installed ? 'You’re using blue maruya as an app.' : promptEvent ? 'Add blue maruya to your device for a dedicated app window.' : ios ? 'Add blue maruya to your iPhone or iPad Home Screen.' : 'Install from your browser’s menu when available.';
  }
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); promptEvent = event; render(); });
  window.addEventListener('appinstalled', () => { installed = true; promptEvent = null; render(); });
  standalone.addEventListener('change', event => { installed = event.matches || navigator.standalone === true; render(); });
  document.querySelectorAll('[data-install]').forEach(button => button.addEventListener('click', () => {
    returnFocus = button; render(); dialog.showModal(); document.body.classList.add('dialog-open');
  }));
  function close() { dialog.close(); if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open'); returnFocus?.focus(); }
  document.querySelector('#closeInstall').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  action.addEventListener('click', async () => {
    const event = promptEvent; if (!event) return;
    promptEvent = null; action.disabled = true;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      render();
      status.textContent = choice.outcome === 'accepted' ? 'Installation requested. Follow your browser’s next step.' : 'Installation dismissed. You can keep using blue maruya in this browser.';
    } catch { render(); status.textContent = 'The install prompt could not open. Try your browser’s install menu.'; }
    finally { action.disabled = false; }
  });
  render();
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
})();
