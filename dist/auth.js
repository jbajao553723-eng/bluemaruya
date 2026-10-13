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
  let authGeneration = 0;
  let toastTimer;
  const settings = document.querySelector('#settingsDialog');
  const profileForm = document.querySelector('#profileForm');
  const changePasswordForm = document.querySelector('#changePasswordForm');
  const rememberUsername = document.querySelector('#rememberUsername');
  const profileChoices = [...document.querySelectorAll('[data-login-member]')];
  function selectProfile(username) {
    profileChoices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.loginMember === username)));
    document.body.dataset.loginMember = username === 'kdumangas' ? 'kristine' : 'waken';
  }
  try { const saved = localStorage.getItem('blue-maruya-login-username'); if (['wakengwapo','kdumangas'].includes(saved)) { form.username.value = saved; rememberUsername.checked = true; selectProfile(saved); } } catch {}
  profileChoices.forEach(button => button.addEventListener('click', () => { form.username.value = button.dataset.loginMember; selectProfile(form.username.value); password.focus(); }));
  form.username.addEventListener('input', () => selectProfile(form.username.value.trim()));
  password.addEventListener('keyup', event => { document.querySelector('#capsLockHint').hidden = !event.getModifierState?.('CapsLock'); });
  password.addEventListener('blur', () => { document.querySelector('#capsLockHint').hidden = true; });
  async function authFetch(options = {}) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), options.method ? 20000 : 12000);
    try { return await fetch('/api/auth', { credentials: 'same-origin', cache: 'no-store', ...options, signal: controller.signal }); }
    catch (error) { if (error.name === 'AbortError') throw new Error('The connection is taking too long. Please try again.'); throw new Error('Unable to connect. Check your connection and try again.'); }
    finally { clearTimeout(timer); }
  }
  function applyPreferences() {
    if (!member) return;
    const prefs = window.memberPreferencesStore.read(member.username);
    document.body.dataset.motion = prefs.motion ? 'on' : 'off';
    window.cinema.setMotion(prefs.motion);
  }

  function updateMember(data) {
    member = { username: data.username, displayName: data.displayName || data.username };
    const pink = member.username === 'kdumangas';
    document.body.dataset.memberTheme = pink ? 'kristine' : 'waken';
    document.documentElement.dataset.bsTheme = pink ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]').content = pink ? '#fff6fa' : '#090909';
    document.querySelector('#dashboardMemberName').textContent = member.displayName;
    document.querySelector('#wakenDisplayName').textContent = member.displayName;
    document.querySelector('#memberName').textContent = member.displayName;
    document.querySelector('#memberUsername').textContent = '@' + member.username;
    document.querySelector('#memberWelcome').textContent = 'Welcome, ' + member.displayName;
    document.querySelector('#memberAvatar').textContent = member.displayName.slice(0, 1).toUpperCase();
    document.querySelector('#settingsAvatar').textContent = member.displayName.slice(0, 1).toUpperCase();
    document.querySelector('#settingsMemberName').textContent = member.displayName;
    document.querySelector('#settingsUsername').textContent = '@' + member.username;
    applyPreferences();
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
    ++authGeneration;
    member = null;
    delete document.body.dataset.memberTheme;
    delete document.body.dataset.motion;
    window.cinema.setMotion(true);
    document.documentElement.dataset.bsTheme = 'dark';
    document.querySelector('meta[name="theme-color"]').content = '#090909';
    document.querySelector('#memberDashboardIntro').hidden = true;
    document.querySelector('#wakenDashboardIntro').hidden = true;
    changePasswordForm.reset(); profileForm.reset();
    screen.hidden = false;
    shell.hidden = true;
    document.body.classList.remove('dialog-open');
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    document.querySelector('#player').removeAttribute('src');
    document.querySelector('#toast').classList.remove('visible');
    password.value = '';
    password.type = 'password'; document.querySelector('#passwordToggle').setAttribute('aria-pressed','false'); document.querySelector('#passwordToggle').setAttribute('aria-label','Show password');
    submit.disabled = false;
    setMessage(text, Boolean(text));
    if (wasSignedIn) window.scrollTo({top:0,behavior:'instant'});
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
    const generation = authGeneration;
    try {
      const response = await authFetch();
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (generation !== authGeneration) return;
      if (data.authenticated) {
        if (!signedIn) showMember(data);
        else if (member.username !== data.username) { showLogin(); showMember(data); }
        else updateMember(data);
      } else showLogin();
    } catch (error) {
      if (generation === authGeneration && !signedIn) showLogin(error.message || 'Unable to connect. Please try signing in again.');
    } finally { checking = false; }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    ++authGeneration;
    submit.disabled = true;
    form.setAttribute('aria-busy','true');
    submit.querySelector('span').textContent = 'Signing in…';
    setMessage('');
    try {
      const response = await authFetch({
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username.value, password: password.value })
      });
      const data = await response.json();
      if (!response.ok || !data.authenticated) throw new Error(data.error || 'Please try again.');
      try { if (rememberUsername.checked) localStorage.setItem('blue-maruya-login-username', data.username); else localStorage.removeItem('blue-maruya-login-username'); } catch {}
      showMember(data);
    } catch (error) {
      setMessage(error.message || 'Unable to sign in. Please try again.', true);
      password.value = '';
      password.focus();
    } finally {
      submit.disabled = false;
      form.setAttribute('aria-busy','false');
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
      const response = await authFetch({ method: 'DELETE' });
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
    const preferences = window.memberPreferencesStore.read(member.username);
    document.querySelector('#preferredQuality').value = preferences.quality;
    document.querySelector('#enableMotion').checked = preferences.motion;
    settingsMessage('#experienceMessage','');
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
      const response = await authFetch({ method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
  document.querySelector('#experienceForm').addEventListener('submit', event => { event.preventDefault(); if(!member)return; const saved = window.memberPreferencesStore.save(member.username,{quality:document.querySelector('#preferredQuality').value,motion:document.querySelector('#enableMotion').checked}); if(saved)applyPreferences(); settingsMessage('#experienceMessage',saved?'Your preferences have been saved.':'Preferences could not be saved on this device.',!saved); });
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
