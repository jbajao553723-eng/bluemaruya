const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const { memberSession } = require('../lib/members');

let genreCache = null;
let genreCacheTime = 0;
const responseCache = new Map();
function normalizedGenre(name, type) {
  const value = String(name || '').toLowerCase();
  return ({'sci-fi': type === 'tv' ? 'sci-fi & fantasy' : 'science fiction', action: type === 'tv' ? 'action & adventure' : 'action', adventure: type === 'tv' ? 'action & adventure' : 'adventure', fantasy: type === 'tv' ? 'sci-fi & fantasy' : 'fantasy', war: type === 'tv' ? 'war & politics' : 'war'})[value] || value;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function boundedPage(value) {
  const page = Number.parseInt(value, 10) || 1;
  return Math.min(Math.max(page, 1), 500);
}

function runtimeLabel(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function certification(item, type) {
  if (type === 'movie') {
    const countries = item.release_dates?.results || [];
    const country = countries.find(entry => entry.iso_3166_1 === 'PH') || countries.find(entry => entry.iso_3166_1 === 'US');
    return country?.release_dates?.find(entry => entry.certification)?.certification || '';
  }
  const countries = item.content_ratings?.results || [];
  return (countries.find(entry => entry.iso_3166_1 === 'PH') || countries.find(entry => entry.iso_3166_1 === 'US'))?.rating || '';
}

function formatTitle(item, typeHint, genresByType) {
  const type = item.media_type === 'tv' || item.media_type === 'movie' ? item.media_type : typeHint;
  if (type !== 'movie' && type !== 'tv') return null;
  const date = type === 'tv' ? item.first_air_date : item.release_date;
  const genres = item.genres?.map(genre => genre.name) || (item.genre_ids || []).map(id => genresByType?.[type]?.[id]).filter(Boolean);
  const seasons = type === 'tv' && Array.isArray(item.seasons)
    ? item.seasons.filter(season => season.season_number > 0).map(season => season.episode_count)
    : undefined;
  const seasonCount = seasons?.length || item.number_of_seasons;

  return {
    id: item.id,
    type,
    title: type === 'tv' ? item.name : item.title,
    year: date ? Number(date.slice(0, 4)) : null,
    genres,
    runtime: type === 'movie' ? runtimeLabel(item.runtime) : seasonCount ? `${seasonCount} season${seasonCount === 1 ? '' : 's'}` : 'Series',
    rating: certification(item, type) || (item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : ''),
    image: item.poster_path ? `${IMAGE_BASE}/w500${item.poster_path}` : '',
    backdrop: item.backdrop_path ? `${IMAGE_BASE}/w1280${item.backdrop_path}` : '',
    description: item.overview || 'No description is available for this title yet.',
    ...(seasons ? { seasons } : {})
  };
}

async function tmdb(path, params = {}) {
  const token = process.env.TMDB_BEARER_TOKEN;
  if (!token) throw new Error('TMDB_BEARER_TOKEN is not configured');
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('language', 'en-US');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  const cached = responseCache.get(url.href);
  if (cached && cached.until > Date.now()) return cached.data;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`TMDB request failed (${response.status}): ${message.slice(0, 180)}`);
  }
  const data = await response.json();
  if (responseCache.size >= 150) responseCache.delete(responseCache.keys().next().value);
  responseCache.set(url.href, { data, until: Date.now() + 5 * 60 * 1000 });
  return data;
}

async function getGenres() {
  if (genreCache && Date.now() - genreCacheTime < 6 * 60 * 60 * 1000) return genreCache;
  const [movies, tv] = await Promise.all([tmdb('/genre/movie/list'), tmdb('/genre/tv/list')]);
  genreCache = {
    movie: Object.fromEntries(movies.genres.map(genre => [genre.id, genre.name])),
    tv: Object.fromEntries(tv.genres.map(genre => [genre.id, genre.name]))
  };
  genreCacheTime = Date.now();
  return genreCache;
}

function formatList(payload, type, genres) {
  return (payload.results || []).map(item => formatTitle(item, type, genres)).filter(Boolean);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'private, no-store');
  try { if (!await memberSession(req)) return send(res, 401, { error: 'Please sign in to browse.' }); }
  catch { return send(res, 503, { error: 'Account services are temporarily unavailable. Please try again.' }); }
  try {
    const mode = String(req.query.mode || 'home');
    const genres = await getGenres();

    if (mode === 'home') {
      const [trending, movies, tv] = await Promise.all([
        tmdb('/trending/all/week'),
        tmdb('/movie/popular', { page: 1 }),
        tmdb('/tv/popular', { page: 1 })
      ]);
      const trendingTitles = formatList(trending, null, genres);
      const popularMovies = formatList(movies, 'movie', genres);
      const popularTv = formatList(tv, 'tv', genres);
      return send(res, 200, {
        hero: trendingTitles.find(title => title.backdrop) || popularMovies[0],
        trending: trendingTitles,
        movies: popularMovies,
        tv: popularTv
      });
    }

    if (mode === 'details') {
      const type = req.query.type === 'tv' ? 'tv' : 'movie';
      const id = Number.parseInt(req.query.id, 10);
      if (!Number.isInteger(id) || id < 1) return send(res, 400, { error: 'A valid title ID is required' });
      const append = type === 'movie' ? 'release_dates' : 'content_ratings';
      const item = await tmdb(`/${type}/${id}`, { append_to_response: append });
      return send(res, 200, { result: formatTitle(item, type, genres) });
    }

    const page = boundedPage(req.query.page);
    if (mode === 'search') {
      const query = String(req.query.query || '').trim().slice(0, 100);
      if (query.length < 2) return send(res, 200, { results: [], page: 1, totalPages: 1 });
      const searchType = ['movie', 'tv'].includes(req.query.type) ? req.query.type : 'multi';
      const payload = await tmdb(`/search/${searchType}`, { query, page, include_adult: false });
      const genreName = String(req.query.genre || '');
      return send(res, 200, {
        results: formatList(payload, searchType === 'multi' ? null : searchType, genres).filter(title => !genreName || title.genres.some(name => name.toLowerCase() === normalizedGenre(genreName, title.type))),
        page: payload.page,
        totalPages: Math.min(payload.total_pages || 1, 500)
      });
    }

    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const genreName = String(req.query.genre || '').trim().toLowerCase();
    const genreEntry = Object.entries(genres[type]).find(([, name]) => name.toLowerCase() === normalizedGenre(genreName, type));
    if (genreName && !genreEntry) return send(res, 200, { results: [], page: 1, totalPages: 1 });
    const payload = await tmdb(`/discover/${type}`, {
      page,
      include_adult: false,
      include_video: false,
      sort_by: 'popularity.desc',
      with_genres: genreEntry?.[0]
    });
    return send(res, 200, {
      results: formatList(payload, type, genres),
      page: payload.page,
      totalPages: Math.min(payload.total_pages || 1, 500)
    });
  } catch (error) {
    console.error(error);
    return send(res, 502, { error: 'The movie catalog is temporarily unavailable.' });
  }
};
