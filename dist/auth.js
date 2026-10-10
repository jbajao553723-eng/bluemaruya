(() => {
  const screen = document.querySelector('#loginScreen');
  const shell = document.querySelector('#appShell');
  const form = document.querySelector('#loginForm');
  const message = document.querySelector('#loginMessage');
  const submit = document.querySelector('#loginSubmit');
  const password = document.querySelector('#password');
  let signedIn = false;
  let checking = false;
  let member = null;
  let toastTimer;
  const settings = document.querySelector('#settingsDialog');
  const profileForm = document.querySelector('#profileForm');
  const changePasswordForm = document.querySelector('#changePasswordForm');

  function updateMember(data) {
    member = { username: data.username, displayName: data.displayName || data.username };
    const pink = member.username === 'kdumangas';
    document.body.dataset.memberTheme = pink ? 'kristine' : 'waken';
    document.documentElement.dataset.bsTheme = pink ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]').content = pink ? '#fff6fa' : '#090909';
    document.querySelector('#dashboardMemberName').textContent = member.displayName;
    document.querySelector('#memberName').textContent = member.displayName;
    document.querySelector('#memberUsername').textContent = '@' + member.username;
    document.querySelector('#memberWelcome').textContent = 'Welcome, ' + member.displayName;
    document.querySelector('#memberAvatar').textContent = member.displayName.slice(0, 1).toUpperCase();
    document.querySelector('#settingsAvatar').textContent = member.displayName.slice(0, 1).toUpperCase();
    document.querySelector('#settingsMemberName').textContent = member.displayName;
    document.querySelector('#settingsUsername').textContent = '@' + member.username;
  }
  function toast(text) {
    const element = document.querySelector('#toast');
    element.textContent = text; element.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove('visible'), 3500);
  }

  function setMessage(text, error = false) {
    message.textContent = text;
    message.classList.toggle('is-error', error);
  }
  function showLogin(text = '') {
    const wasSignedIn = signedIn;
    signedIn = false;
    member = null;
    delete document.body.dataset.memberTheme;
    document.documentElement.dataset.bsTheme = 'dark';
    document.querySelector('meta[name="theme-color"]').content = '#090909';
    document.querySelector('#memberDashboardIntro').hidden = true;
    changePasswordForm.reset(); profileForm.reset();
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
  function showMember(data) {
    signedIn = true;
    updateMember(data);
    screen.hidden = true;
    shell.hidden = false;
    password.value = '';
    setMessage('');
    window.scrollTo({ top: 0 });
    window.dispatchEvent(new Event('member:signed-in'));
    toast('Welcome, ' + member.displayName);
  }
  async function checkSession() {
    if (checking) return;
    checking = true;
    try {
      const response = await fetch('/api/auth', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.authenticated) {
        if (!signedIn) showMember(data);
        else if (member.username !== data.username) { showLogin(); showMember(data); }
        else updateMember(data);
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
      showMember(data);
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
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const response = await fetch('/api/auth', { method: 'DELETE', credentials: 'same-origin' });
      if (!response.ok) throw new Error();
      window.bootstrap?.Dropdown.getInstance(document.querySelector('.profile-button'))?.hide();
      showLogin();
    } catch {
      document.querySelector('#toast').textContent = 'Could not sign out. Please try again.';
      document.querySelector('#toast').classList.add('visible');
    } finally { button.disabled = false; }
  });
  function settingsMessage(selector, text, error = false) {
    const element = document.querySelector(selector);
    element.textContent = text; element.classList.toggle('is-error', error);
  }
  function closeSettings() { settings.close(); changePasswordForm.reset(); document.body.classList.remove('dialog-open'); }
  document.querySelector('#settingsButton').addEventListener('click', async () => {
    window.bootstrap?.Dropdown.getInstance(document.querySelector('.profile-button'))?.hide();
    await checkSession();
    if (!signedIn) return;
    profileForm.displayName.value = member.displayName;
    changePasswordForm.reset(); settingsMessage('#profileMessage', ''); settingsMessage('#passwordMessage', '');
    settings.showModal(); document.body.classList.add('dialog-open');
  });
  document.querySelector('#closeSettings').addEventListener('click', closeSettings);
  settings.addEventListener('cancel', event => { event.preventDefault(); closeSettings(); });
  settings.addEventListener('click', event => { const rect = settings.getBoundingClientRect(); if (event.target === settings && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeSettings(); });
  async function saveSettings(formElement, selector, body) {
    const button = formElement.querySelector('button[type="submit"]');
    button.disabled = true; settingsMessage(selector, 'Saving…');
    try {
      const response = await fetch('/api/auth', { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (response.status === 401) { showLogin(data.error); return; }
      if (!response.ok) throw new Error(data.error || 'Unable to save. Please try again.');
      updateMember(data); settingsMessage(selector, data.message);
      if (body.action === 'password') changePasswordForm.reset();
      else profileForm.displayName.value = member.displayName;
    } catch (error) { settingsMessage(selector, error.message || 'Unable to save. Please try again.', true); }
    finally { button.disabled = false; }
  }
  profileForm.addEventListener('submit', event => { event.preventDefault(); saveSettings(profileForm, '#profileMessage', { action: 'profile', displayName: profileForm.displayName.value }); });
  changePasswordForm.addEventListener('submit', event => {
    event.preventDefault();
    if (changePasswordForm.newPassword.value !== changePasswordForm.confirmPassword.value) { settingsMessage('#passwordMessage', 'Your new passwords do not match.', true); return; }
    saveSettings(changePasswordForm, '#passwordMessage', { action: 'password', currentPassword: changePasswordForm.currentPassword.value, newPassword: changePasswordForm.newPassword.value });
  });
  window.memberAuth = { isAuthenticated: () => signedIn, currentMember: () => member, expire: () => showLogin('Your session ended. Please sign in again.') };
  // Recheck restored tabs and long-running sessions.
  window.addEventListener('pageshow', event => { if (event.persisted) checkSession(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && signedIn) checkSession(); });
  setInterval(() => { if (signedIn && !document.hidden) checkSession(); }, 5 * 60 * 1000);
  checkSession();
})();
