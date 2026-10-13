// CineSrc's documented public embed contract. Never read the cross-origin frame.
((root) => {
  const ORIGIN = 'https://cinesrc.st';
  const qualityOptions = ['auto', '480', '720', '1080'];
  const boundTime = value => Number.isFinite(value) && value >= 0 && value <= 86400 ? value : 0;
  function buildUrl(movie, options = {}) {
    if (!Number.isSafeInteger(movie?.id) || movie.id < 1 || !['movie', 'tv'].includes(movie.type)) throw new Error('Invalid movie');
    const url = new URL(`${ORIGIN}/embed/${movie.type}/${movie.id}`);
    if (movie.type === 'tv') {
      url.searchParams.set('s', String(Math.max(1, Math.min(Number.parseInt(options.season, 10) || 1, 100))));
      url.searchParams.set('e', String(Math.max(1, Math.min(Number.parseInt(options.episode, 10) || 1, 1000))));
    }
    const quality = qualityOptions.includes(options.quality) ? options.quality : '480';
    if (quality !== 'auto') url.searchParams.set('quality', quality);
    url.searchParams.set('autoplay', 'true');
    url.searchParams.set('autonext', 'false');
    url.searchParams.set('controls', 'true');
    url.searchParams.set('back', 'close');
    url.searchParams.set('color', options.pink ? '#b92f76' : '#f51a3a');
    const time = Math.floor(boundTime(options.time));
    if (time > 0) { url.searchParams.set('t', String(time)); url.searchParams.set('continueprompt', 'false'); }
    if (!options.fresh && /^[\w.:-]{1,80}$/.test(options.server || '')) {
      url.searchParams.set('prioritize', 'true'); url.searchParams.set('lastserver', options.server);
    } else url.searchParams.set('prioritize', 'false');
    return url.href;
  }
  function parseEvent(event, frameWindow) {
    if (event.origin !== ORIGIN || !frameWindow || event.source !== frameWindow) return null;
    let data = event.data;
    if (typeof data === 'string') { if (data.length > 4096) return null; try { data = JSON.parse(data); } catch { return null; } }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const allowed = ['ready','play','pause','timeupdate','seeked','loadedmetadata','ended','sourceused','error','nextepisode','close'];
    if (!allowed.includes(String(data.type).replace(/^cinesrc:/, '')) || !String(data.type).startsWith('cinesrc:')) return null;
    const result = { type: data.type };
    if (Number.isFinite(data.currentTime) && data.currentTime >= 0 && data.currentTime <= 86400) result.time = data.currentTime;
    if (Number.isFinite(data.duration) && data.duration > 0 && data.duration <= 86400) result.duration = data.duration;
    if (/^[\w.:-]{1,80}$/.test(data.sourceId || '')) result.server = data.sourceId;
    if (Number.isInteger(data.season) && data.season >= 1 && data.season <= 100) result.season = data.season;
    if (Number.isInteger(data.episode) && data.episode >= 1 && data.episode <= 1000) result.episode = data.episode;
    result.internalNavigation = data.internalNavigation === true;
    return result;
  }
  function createMonitor(onChange, clock = {}) {
    const now = clock.now || Date.now;
    const schedule = clock.setTimeout || setTimeout;
    const cancel = clock.clearTimeout || clearTimeout;
    let timer, phase = 'idle', previousTime = -1, lastAdvance = 0, started = false, active = false;
    function set(next) { if (phase !== next) { phase = next; onChange(next); } }
    function arm(delay = 30000) {
      cancel(timer); timer = schedule(() => {
        if (!active || ['paused','ended','error'].includes(phase)) return;
        if (!started || now() - lastAdvance >= 25000) set('slow');
        else arm(25000);
      }, delay);
    }
    return {
      begin(initialTime = 0) { cancel(timer); active = true; started = false; previousTime = boundTime(initialTime); lastAdvance = now(); phase = 'idle'; set('connecting'); arm(); },
      frameLoaded() { if (active && phase === 'connecting') set('finding'); },
      accept(event) {
        if (!active) return;
        if (event.type === 'cinesrc:ready') { if (!started) set('ready'); }
        if (event.type === 'cinesrc:loadedmetadata') { set('ready'); arm(); }
        if (event.type === 'cinesrc:play') { started = true; lastAdvance = now(); set('playing'); arm(25000); }
        if (event.type === 'cinesrc:pause') { cancel(timer); set('paused'); }
        if (event.type === 'cinesrc:timeupdate' && event.time !== undefined && event.time > previousTime) {
          previousTime = event.time; lastAdvance = now();
          if (phase !== 'paused') { started = true; set('playing'); arm(25000); }
        }
        if (event.type === 'cinesrc:seeked' && event.time !== undefined) { previousTime = event.time; lastAdvance = now(); if (phase !== 'paused') arm(25000); }
        if (event.type === 'cinesrc:error') { cancel(timer); set('error'); }
        if (event.type === 'cinesrc:ended') { cancel(timer); set('ended'); }
      },
      stop() { active = false; cancel(timer); phase = 'idle'; },
      phase: () => phase
    };
  }
  const api = { ORIGIN, qualityOptions, buildUrl, parseEvent, createMonitor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.playerKit = api;
})(typeof window !== 'undefined' ? window : globalThis);
