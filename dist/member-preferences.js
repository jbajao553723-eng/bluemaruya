((root) => {
  const defaults = { quality: '480', motion: true, server: '', theme: 'light' };
  function create(storage) {
    const key = username => { if (!['wakengwapo','kdumangas','guest'].includes(username)) throw new Error('Invalid member'); return `blue-maruya-preferences:${username}`; };
    function read(username) {
      const name = key(username);
      try { const value = JSON.parse(storage.getItem(name) || '{}'); return { quality: ['auto','480','720','1080'].includes(value?.quality) ? value.quality : '480', motion: value?.motion !== false, server: /^[\w.:-]{1,80}$/.test(value?.server || '') ? value.server : '', theme: ['light','dark'].includes(value?.theme) ? value.theme : 'light' }; }
      catch { return { ...defaults }; }
    }
    return { read, save(username, changes) { const value = { ...read(username), ...changes }; if (!['auto','480','720','1080'].includes(value.quality) || typeof value.motion !== 'boolean' || !['light','dark'].includes(value.theme) || (value.server && !/^[\w.:-]{1,80}$/.test(value.server))) return false; try { storage.setItem(key(username), JSON.stringify(value)); return true; } catch { return false; } } };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { create };
  else root.memberPreferencesStore = create({ getItem: key => root.localStorage.getItem(key), setItem: (key,value) => root.localStorage.setItem(key,value) });
})(typeof window !== 'undefined' ? window : globalThis);
