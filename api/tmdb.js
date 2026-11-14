const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const { memberSession } = require('../lib/members');
const preferencePicks = require('../dist/preferences');

let genreCache = null;
let genreCacheTime = 0;
const responseCache = new Map();
function titleLogo(images) {
  const logos = (images?.logos || []).filter(image => /^\/[\w.-]+\.(png|svg|webp)$/i.test(image.file_path || '') && ['en', null].includes(image.iso_639_1));
  logos.sort((a, b) => Number(b.iso_639_1 === 'en') - Number(a.iso_639_1 === 'en') || Number(b.aspect_ratio >= 1.2) - Number(a.aspect_ratio >= 1.2) || (b.vote_average || 0) - (a.vote_average || 0) || (b.vote_count || 0) - (a.vote_count || 0));
  return logos[0] ? `${IMAGE_BASE}/w500${logos[0].file_path}` : '';
}
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
  if (item.adult) return null;
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
    ...(item.images ? { logo: titleLogo(item.images) } : {}),
    ...(item.credits || item.aggregate_credits ? { cast: ((item.credits || item.aggregate_credits).cast || []).filter(person => !person.adult).slice(0, 12).map(formatPerson) } : {}),
    ...(seasons ? { seasons } : {})
  };
}

function formatPerson(person) {
  return {
    id: person.id, name: person.name,
    image: person.profile_path ? `${IMAGE_BASE}/w185${person.profile_path}` : '',
    character: person.character || person.roles?.map(role => role.character).filter(Boolean).slice(0, 2).join(', ') || '',
    knownFor: (person.known_for || []).filter(title => !title.adult).map(title => title.title || title.name).filter(Boolean).slice(0, 3).join(' · ')
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
  let session;
  try { session = await memberSession(req); if (!session) return send(res, 401, { error: 'Please sign in to browse.' }); }
  catch { return send(res, 503, { error: 'Account services are temporarily unavailable. Please try again.' }); }
  try {
    const mode = String(req.query.mode || 'home');
    if (mode === 'artwork') {
      const type = req.query.type === 'tv' ? 'tv' : 'movie';
      const id = Number(req.query.id);
      if (!Number.isSafeInteger(id) || id < 1) return send(res, 400, { error: 'A valid title ID is required' });
      const images = await tmdb(`/${type}/${id}/images`, { include_image_language: 'en,null' });
      return send(res, 200, { logo: titleLogo(images) });
    }
    const genres = await getGenres();

    if (mode === 'genres') return send(res, 200, { genres });

    if (mode === 'people') {
      const query = String(req.query.query || '').trim().slice(0, 100);
      const payload = await tmdb(query ? '/search/person' : '/person/popular', { query, page: boundedPage(req.query.page), include_adult: false });
      return send(res, 200, { results: (payload.results || []).filter(person => !person.adult && (!person.known_for_department || person.known_for_department === 'Acting')).map(formatPerson), page: payload.page, totalPages: Math.min(payload.total_pages || 1, 500) });
    }

    if (mode === 'person') {
      const id = Number(req.query.id);
      if (!Number.isSafeInteger(id) || id < 1) return send(res, 400, { error: 'A valid actor ID is required' });
      const person = await tmdb(`/person/${id}`, { append_to_response: 'combined_credits' });
      if (person.adult) return send(res, 404, { error: 'Actor unavailable' });
      const credits = [...(person.combined_credits?.cast || [])].filter(title => !title.adult).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      const unique = new Map();
      for (const credit of credits) {
        const title = formatTitle(credit, null, genres);
        if (title && !unique.has(`${title.type}:${title.id}`)) unique.set(`${title.type}:${title.id}`, title);
      }
      return send(res, 200, { person: { ...formatPerson(person), biography: person.biography || '', birthplace: person.place_of_birth || '' }, results: [...unique.values()], page: 1, totalPages: 1 });
    }

    if (mode === 'home') {
      const [trending, movies, tv, preferences] = await Promise.all([
        tmdb('/trending/all/week'),
        tmdb('/movie/popular', { page: 1 }),
        tmdb('/tv/popular', { page: 1 }),
        session.member.username === 'kdumangas'
          ? Promise.all(preferencePicks.map(async pick => {
            try {
              const item = await tmdb(`/movie/${pick.id}`, { append_to_response: 'release_dates' });
              const title = formatTitle(item, 'movie', genres);
              return { ...pick, ...title, image: title.image || pick.image, backdrop: title.backdrop || pick.backdrop };
            } catch { return pick; }
          }))
          : undefined
      ]);
      const trendingTitles = formatList(trending, null, genres);
      const popularMovies = formatList(movies, 'movie', genres);
      const popularTv = formatList(tv, 'tv', genres);
      return send(res, 200, {
        hero: trendingTitles.find(title => title.backdrop) || popularMovies[0],
        trending: trendingTitles,
        movies: popularMovies,
        tv: popularTv,
        ...(preferences ? { preferences } : {})
      });
    }

    if (mode === 'details') {
      const type = req.query.type === 'tv' ? 'tv' : 'movie';
      const id = Number.parseInt(req.query.id, 10);
      if (!Number.isInteger(id) || id < 1) return send(res, 400, { error: 'A valid title ID is required' });
      const append = type === 'movie' ? 'release_dates,credits' : 'content_ratings,aggregate_credits';
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
