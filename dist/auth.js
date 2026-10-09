(() => {
  const screen = document.querySelector('#loginScreen');
  const shell = document.querySelector('#appShell');
  const form = document.querySelector('#loginForm');
  const message = document.querySelector('#loginMessage');
  const submit = document.querySelector('#loginSubmit');
  const password = document.querySelector('#password');
  let signedIn = false;
  let checking = false;

  function setMessage(text, error = false) {
    message.textContent = text;
    message.classList.toggle('is-error', error);
  }
  function showLogin(text = '') {
    const wasSignedIn = signedIn;
    signedIn = false;
    screen.hidden = false;
    shell.hidden = true;
    document.body.classList.remove('dialog-open');
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    document.querySelector('#player').removeAttribute('src');
    document.querySelector('#toast').classList.remove('visible');
    password.value = '';
    submit.disabled = false;
    setMessage(text, Boolean(text));
    if (wasSignedIn) window.dispatchEvent(new Event('member:signed-out'));
  }
  function showMember(username) {
    signedIn = true;
    document.querySelector('#memberName').textContent = username;
    screen.hidden = true;
    shell.hidden = false;
    password.value = '';
    setMessage('');
    window.scrollTo({ top: 0 });
    window.dispatchEvent(new Event('member:signed-in'));
  }
  async function checkSession() {
    if (checking) return;
    checking = true;
    try {
      const response = await fetch('/api/auth', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.authenticated) {
        if (!signedIn) showMember(data.username);
      } else showLogin();
    } catch {
      if (!signedIn) showLogin('Unable to connect. Please try signing in again.');
    } finally { checking = false; }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    submit.disabled = true;
    submit.querySelector('span').textContent = 'Signing in…';
    setMessage('');
    try {
      const response = await fetch('/api/auth', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username.value, password: password.value })
      });
      const data = await response.json();
      if (!response.ok || !data.authenticated) throw new Error(data.error || 'Please try again.');
      showMember(data.username);
    } catch (error) {
      setMessage(error.message || 'Unable to sign in. Please try again.', true);
      password.value = '';
      password.focus();
    } finally {
      submit.disabled = false;
      submit.querySelector('span').textContent = 'Sign in';
    }
  });
  document.querySelector('#passwordToggle').addEventListener('click', event => {
    const reveal = password.type === 'password';
    password.type = reveal ? 'text' : 'password';
    event.currentTarget.setAttribute('aria-pressed', reveal);
    event.currentTarget.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
  });
  document.querySelector('#logoutButton').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try {
      const response = await fetch('/api/auth', { method: 'DELETE', credentials: 'same-origin' });
      if (!response.ok) throw new Error();
      window.bootstrap?.Dropdown.getInstance(document.querySelector('.profile-button'))?.hide();
      showLogin();
    } catch {
      document.querySelector('#toast').textContent = 'Could not sign out. Please try again.';
      document.querySelector('#toast').classList.add('visible');
    } finally { event.currentTarget.disabled = false; }
  });
  window.memberAuth = { isAuthenticated: () => signedIn, expire: () => showLogin('Your session ended. Please sign in again.') };
  // Recheck restored tabs and long-running sessions.
  window.addEventListener('pageshow', event => { if (event.persisted) checkSession(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && signedIn) checkSession(); });
  setInterval(() => { if (signedIn && !document.hidden) checkSession(); }, 5 * 60 * 1000);
  checkSession();
})();
