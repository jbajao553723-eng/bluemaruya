// Local viewing history is keyed by immutable account username, never display name.
((root) => {
  const accounts = ['wakengwapo', 'kdumangas'];
  const key = username => {
    if (!accounts.includes(username)) throw new Error('A signed-in member is required');
    return `blue-maruya-history:${username}`;
  };
  function normalize(entry) {
    if (!entry || !Number.isSafeInteger(entry.id) || entry.id < 1 || !['movie', 'tv'].includes(entry.type) || typeof entry.title !== 'string' || !entry.title.trim()) return null;
    const text = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';
    const asset = value => typeof value === 'string' && (/^[\w.-]+\.(jpg|jpeg|png|webp)$/.test(value) || /^https:\/\/image\.tmdb\.org\/t\/p\/(w\d+|original)\/[\w.-]+\.(jpg|jpeg|png|webp)$/.test(value)) ? value : '';
    return {
      id: entry.id, type: entry.type, title: text(entry.title, 200),
      year: Number.isInteger(entry.year) ? entry.year : null,
      genres: Array.isArray(entry.genres) ? entry.genres.filter(item => typeof item === 'string').slice(0, 8).map(item => item.slice(0, 50)) : [],
      runtime: text(entry.runtime, 40), rating: text(entry.rating, 30), description: text(entry.description, 2500),
      image: asset(entry.image), backdrop: asset(entry.backdrop),
      ...(Array.isArray(entry.seasons) ? { seasons: entry.seasons.slice(0, 100).map(count => Number.isInteger(count) && count > 0 ? Math.min(count, 1000) : 1) } : {}),
      watchedAt: Number.isFinite(entry.watchedAt) && entry.watchedAt > 0 ? entry.watchedAt : 0,
      season: Math.max(1, Math.min(Number.parseInt(entry.season, 10) || 1, 100)),
      episode: Math.max(1, Math.min(Number.parseInt(entry.episode, 10) || 1, 1000))
    };
  }
  function create(storage) {
    function read(username) {
      const name = key(username);
      try {
        const records = JSON.parse(storage.getItem(name) || '[]');
        if (!Array.isArray(records)) return [];
        const unique = new Map();
        records.map(normalize).filter(Boolean).sort((a, b) => b.watchedAt - a.watchedAt).forEach(entry => { const id = `${entry.type}:${entry.id}`; if (!unique.has(id)) unique.set(id, entry); });
        return [...unique.values()].slice(0, 24);
      } catch { return []; }
    }
    function write(username, entries) { try { storage.setItem(key(username), JSON.stringify(entries)); return true; } catch { return false; } }
    return {
      read,
      record(username, movie, season = 1, episode = 1, now = Date.now()) {
        const entry = normalize({ ...movie, season, episode, watchedAt: now });
        if (!entry) return false;
        const entries = read(username).filter(item => item.id !== entry.id || item.type !== entry.type);
        return write(username, [entry, ...entries].slice(0, 24));
      },
      remove(username, movie) { return write(username, read(username).filter(item => item.id !== movie.id || item.type !== movie.type)); }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { create, normalize };
  else root.watchHistory = create({ getItem: name => root.localStorage.getItem(name), setItem: (name, value) => root.localStorage.setItem(name, value) });
})(typeof window !== 'undefined' ? window : globalThis);
