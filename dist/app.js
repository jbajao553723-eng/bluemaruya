const fallbackCatalog = [
  {id:1084242,type:'movie',title:'Zootopia 2',year:2025,genres:['Animation','Adventure','Comedy'],runtime:'1h 48m',rating:'PG',image:'zootopia-2.jpg',backdrop:'zootopia-hero.jpg',description:'Judy Hopps and Nick Wilde follow a mysterious reptile into unfamiliar corners of Zootopia, where their partnership faces a brand-new test.'},
  {id:693134,type:'movie',title:'Dune: Part Two',year:2024,genres:['Sci-Fi','Adventure','Drama'],runtime:'2h 47m',rating:'PG-13',image:'dune-2.jpg',description:'Paul Atreides joins Chani and the Fremen on a journey across Arrakis, confronting the future that only he can see.'},
  {id:157336,type:'movie',title:'Interstellar',year:2014,genres:['Sci-Fi','Adventure','Drama'],runtime:'2h 49m',rating:'PG-13',image:'interstellar.jpg',description:'With Earth facing an uncertain future, a team of explorers travels beyond the solar system in search of a new home for humanity.'},
  {id:27205,type:'movie',title:'Inception',year:2010,genres:['Sci-Fi','Action','Thriller'],runtime:'2h 28m',rating:'PG-13',image:'inception.jpg',description:'A skilled thief enters dreams to steal secrets. His next assignment asks him to do the impossible: plant an idea instead.'},
  {id:155,type:'movie',title:'The Dark Knight',year:2008,genres:['Action','Crime','Thriller'],runtime:'2h 32m',rating:'PG-13',image:'dark-knight.jpg',description:'Batman faces a criminal mastermind whose escalating chaos puts Gotham and its heroes to the ultimate test.'},
  {id:569094,type:'movie',title:'Spider-Man: Across the Spider-Verse',year:2023,genres:['Animation','Action','Adventure'],runtime:'2h 20m',rating:'PG',image:'spider-verse.jpg',description:'Miles Morales crosses into the multiverse and meets a whole society of Spider-People, each with their own idea of what it means to be a hero.'},
  {id:120467,type:'movie',title:'The Grand Budapest Hotel',year:2014,genres:['Comedy','Adventure','Drama'],runtime:'1h 40m',rating:'R',image:'grand-budapest.png',description:'A legendary concierge and his young protégé become entangled in a stolen painting, a family fortune, and a wonderfully improbable adventure.'},
  {id:545611,type:'movie',title:'Everything Everywhere All at Once',year:2022,genres:['Sci-Fi','Comedy','Action'],runtime:'2h 19m',rating:'R',image:'everything-everywhere.jpg',description:'An exhausted laundromat owner is pulled into a wild adventure across parallel worlds, where saving everything starts with the people closest to her.'},
  {id:1396,type:'tv',title:'Breaking Bad',year:2008,genres:['Crime','Drama','Thriller'],runtime:'5 seasons',rating:'TV-MA',image:'breaking-bad.jpg',seasons:[7,13,13,13,16],description:'A chemistry teacher and a former student enter the drug trade, setting off a transformation with consequences neither can escape.'},
  {id:66732,type:'tv',title:'Stranger Things',year:2016,genres:['Sci-Fi','Mystery','Horror'],runtime:'Series',rating:'TV-14',image:'stranger-things.jpg',seasons:[8,9,8,9],description:'When a young boy disappears in a small Indiana town, his friends uncover secret experiments and a strange world just beneath their own.'},
  {id:100088,type:'tv',title:'The Last of Us',year:2023,genres:['Drama','Adventure','Thriller'],runtime:'Series',rating:'TV-MA',image:'last-of-us.png',seasons:[9,7],description:'In a world changed by a devastating infection, a hardened survivor and a teenage girl journey across America together.'}
];

const icons={play:'<svg viewBox="0 0 24 24" class="fill-icon"><path d="m8 4 13 8-13 8z"/></svg>',plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',left:'<svg viewBox="0 0 24 24"><path d="m14 5-7 7 7 7"/></svg>',right:'<svg viewBox="0 0 24 24"><path d="m10 5 7 7-7 7"/></svg>'};
const $=selector=>document.querySelector(selector);
const keyFor=movie=>`${movie.type}:${movie.id}`;
const isKristine=()=>window.memberAuth.currentMember()?.username==='kdumangas';
const preferenceMovies=()=>state.home?.preferences?.length?state.home.preferences:window.memberPreferences;
const state={person:null,error:'',view:'home',genre:'all',query:'',searchScope:'all',sort:'default',items:[],home:null,saved:new Map(),recent:[],selected:null,playing:null,page:1,totalPages:1,loading:false,request:0,logoRequest:0,suggestRequest:0,suggestIndex:-1};
const logoCache=new Map();
const playback={owner:'',time:0,duration:0,savedAt:0,server:'',persistedServer:'',pendingSeek:false,targetTime:0,request:0};
const playbackMonitor=window.playerKit.createMonitor(setPlaybackStatus);
let toastTimer;
let searchTimer;
let suggestTimer;

function assetUrl(value){if(!value)return 'assets/noir-hero.png';return /^https?:\/\//.test(value)?value:`assets/${value}`;}
function escapeHtml(value){return String(value??'').replace(/[&<>"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]));}
function remember(items){for(const movie of items||[]){if(movie?.id&&movie?.type){const saved=state.saved.get(keyFor(movie));if(saved)state.saved.set(keyFor(movie),{...saved,...movie});}}}
const savedKey=()=>`blue-maruya-list:${window.memberAuth.currentMember()?.username||'guest'}`;
const recentSearchKey=()=>`blue-maruya-searches:${window.memberAuth.currentMember()?.username||'guest'}`;
function readRecentSearches(){
  try{
    const parsed=JSON.parse(localStorage.getItem(recentSearchKey())||'[]');
    return Array.isArray(parsed)?parsed.filter(item=>typeof item==='string'&&item.trim().length>=2).slice(0,6):[];
  }catch{return [];}
}
function saveRecentSearch(term){
  const clean=String(term||'').trim().slice(0,80);
  if(clean.length<2)return;
  try{
    const next=[clean,...readRecentSearches().filter(item=>item.toLowerCase()!==clean.toLowerCase())].slice(0,6);
    localStorage.setItem(recentSearchKey(),JSON.stringify(next));
  }catch{}
}
function removeRecentSearch(term){
  try{
    const next=readRecentSearches().filter(item=>item.toLowerCase()!==String(term).toLowerCase());
    localStorage.setItem(recentSearchKey(),JSON.stringify(next));
  }catch{}
}
function clearRecentSearches(){try{localStorage.removeItem(recentSearchKey());}catch{}}
function persistSaved(){try{localStorage.setItem(savedKey(),JSON.stringify([...state.saved.values()]));}catch{}}
function loadSaved(){
  state.saved.clear();
  try{
    const legacy=window.memberAuth.currentMember()?.username==='wakengwapo'?localStorage.getItem('blue-maruya-list'):null;
    const saved=JSON.parse(localStorage.getItem(savedKey())||legacy||'[]');
    if(Array.isArray(saved))for(const entry of saved){
      const movie=typeof entry==='number'?fallbackCatalog.find(item=>item.id===entry):entry;
      if(movie?.id&&movie?.type)state.saved.set(keyFor(movie),movie);
    }
    persistSaved();
  }catch{}
}
function loadRecent(){state.recent=window.watchHistory.read(window.memberAuth.currentMember().username);}
function removeRecent(movie){if(window.watchHistory.remove(window.memberAuth.currentMember().username,movie)){loadRecent();render();notify('Removed from recently watched');}else notify('Unable to update history on this device.');}
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2400);}
function toggleSave(movie){const key=keyFor(movie);const removed=state.saved.has(key);removed?state.saved.delete(key):state.saved.set(key,movie);persistSaved();notify(removed?'Removed from your list':'Added to your list');if(state.view==='saved')state.items=[...state.saved.values()];render();updateSaveButtons();}
function updateSaveButtons(){
  const hero=state.featured||state.home?.hero||fallbackCatalog[0];
  const heroSaved=state.saved.has(keyFor(hero));
  $('#heroSave').innerHTML=heroSaved?icons.check:icons.plus;
  $('#heroSave').setAttribute('aria-pressed',heroSaved);
  $('#heroSave').setAttribute('aria-label',`${heroSaved?'Remove':'Add'} ${hero.title} ${heroSaved?'from':'to'} my list`);
  $('#listCount').textContent=state.saved.size;$('#listCount').hidden=!state.saved.size;
  requestAnimationFrame(updateNavIndicator);
  $('#dashboardSavedCount').textContent=state.saved.size;$('#dashboardRecentCount').textContent=state.recent.length;
  if(state.selected){const selectedSaved=state.saved.has(keyFor(state.selected));$('#detailSave').textContent=selectedSaved?'✓ In my list':'Add to my list';$('#detailSave').setAttribute('aria-pressed',selectedSaved);}
}

function createCard(movie,{recent=false,landscape=false,top10=false}={}){
  const wide=landscape||recent;
  const article=document.createElement('article');
  article.className=`movie-card ${wide?'landscape-card':'poster-card'}${wide&&!movie.backdrop?' no-backdrop':''}`;
  const art=wide?assetUrl(movie.backdrop||movie.image):assetUrl(movie.image);
  const saved=state.saved.has(keyFor(movie));
  const subtitleParts=[movie.year||'Coming soon',movie.genres?.[0]||(movie.type==='tv'?'Series':'Movie')].filter(Boolean);
  article.innerHTML=`<div class="poster-wrap"><button class="poster-button" aria-label="Details for ${escapeHtml(movie.title)}"><img src="${escapeHtml(art)}" alt="${escapeHtml(movie.title)} poster" loading="lazy" width="${wide?480:300}" height="${wide?270:450}"><span class="media-badge">${movie.type==='tv'?'SERIES':'MOVIE'}</span>${top10?'<span class="top10-badge" aria-hidden="true"><small>TOP</small>10</span>':''}<span class="poster-play">${icons.play}</span></button><div class="card-hover-actions"><button class="card-quick-play" aria-label="${recent&&movie.type==='tv'?'Resume':'Play'} ${escapeHtml(movie.title)}${recent&&movie.type==='tv'?` season ${movie.season}, episode ${movie.episode}`:''}">${icons.play}</button><button class="card-save" aria-label="${saved?'Remove':'Add'} ${escapeHtml(movie.title)} ${saved?'from':'to'} my list" aria-pressed="${saved}">${saved?icons.check:icons.plus}</button></div></div><div class="card-bottom"><button class="card-title">${escapeHtml(movie.title)}</button><p class="card-meta">${subtitleParts.map(escapeHtml).join(' <span aria-hidden="true">·</span> ')}</p></div>`;
  article.querySelector('.poster-button').onclick=()=>openDetails(movie);
  const image=article.querySelector('img');
  image.addEventListener('error',()=>{if(!image.dataset.fallback){image.dataset.fallback='true';image.src='assets/noir-hero.png';}});
  if(movie.preferenceLabel){const mood=document.createElement('span');mood.className='preference-mood';mood.textContent=movie.mood;article.append(mood);const label=document.createElement('span');label.className='preference-label';label.textContent=movie.preferenceLabel;article.querySelector('.poster-button').append(label);}
  if(movie.rating?.startsWith('★')){const score=document.createElement('span');score.className='score-badge';score.textContent=movie.rating;article.querySelector('.poster-button').append(score);}
  article.querySelector('.card-title').onclick=()=>openDetails(movie);
  article.querySelector('.card-save').onclick=()=>toggleSave(movie);
  article.querySelector('.card-quick-play').onclick=()=>openPlayer(movie,recent?movie:null);
  if(recent){
    article.classList.add('recent-card');image.src=assetUrl(movie.backdrop||movie.image);
    const meta=article.querySelector('.card-meta');meta.textContent=(movie.type==='tv'?`S${movie.season} · E${movie.episode}`:`${movie.year||'Movie'}`)+(movie.time>15&&!movie.completed?` · Resume ${timeLabel(movie.time)}`:' · Play again');
    if(movie.duration>0){const progress=document.createElement('span');progress.className='watch-progress';progress.setAttribute('aria-label',`${Math.min(100,Math.round(movie.time/movie.duration*100))}% watched`);const fill=document.createElement('span');fill.style.width=`${Math.min(100,movie.time/movie.duration*100)}%`;progress.append(fill);article.querySelector('.poster-button').append(progress);}
    const stamp=document.createElement('span');stamp.className='watched-stamp';stamp.textContent=recentLabel(movie.watchedAt);article.querySelector('.poster-button').append(stamp);
    const remove=document.createElement('button');remove.className='history-remove';remove.textContent='×';remove.setAttribute('aria-label',`Remove ${movie.title} from recently watched`);remove.onclick=()=>removeRecent(movie);article.querySelector('.poster-wrap').append(remove);
  }
  return article;
}
function recentLabel(timestamp){const days=Math.max(0,Math.floor((Date.now()-timestamp)/86400000));return days===0?'Today':days===1?'Yesterday':days<7?`${days} days ago`:new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(timestamp));}
function timeLabel(time){const seconds=Math.floor(time||0);return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
function createShelf(title,subtitle,movies,ranked=false,options={}){
  if(!movies?.length)return;
  const section=document.createElement('section');section.className=`shelf${ranked?' ranked':''}`;
  const seeAllMarkup=options.seeAllView?`<button class="shelf-see-all" type="button" data-see-all="${escapeHtml(options.seeAllView)}"><span>See all</span>${icons.right}</button>`:'';
  section.innerHTML=`<div class="shelf-heading"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div>${seeAllMarkup}</div><div class="rail-wrap"><button class="rail-arrow prev" aria-label="Previous titles in ${escapeHtml(title)}">${icons.left}</button><div class="rail"></div><button class="rail-arrow next" aria-label="Next titles in ${escapeHtml(title)}">${icons.right}</button></div>`;
  const seeAllBtn=section.querySelector('.shelf-see-all');
  if(seeAllBtn)seeAllBtn.onclick=()=>setView(options.seeAllView);
  const rail=section.querySelector('.rail');
  const top10Set=options.top10Keys||new Set();
  movies.forEach((movie,index)=>{const card=createCard(movie,{...options,landscape:ranked?false:options.landscape,top10:!ranked&&top10Set.has(keyFor(movie))});if(ranked){const wrap=document.createElement('div');wrap.className='rank-card';const rank=document.createElement('span');rank.className='rank-number';rank.setAttribute('aria-hidden','true');rank.textContent=String(index+1);wrap.append(rank,card);rail.append(wrap);}else rail.append(card);});
  const left=section.querySelector('.rail-arrow.prev');
  const right=section.querySelector('.rail-arrow.next');
  left.onclick=()=>rail.scrollBy({left:-rail.clientWidth*.85,behavior:'smooth'});right.onclick=()=>rail.scrollBy({left:rail.clientWidth*.85,behavior:'smooth'});
  function controls(){left.disabled=rail.scrollLeft<2;right.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-3;}
  rail.addEventListener('scroll',controls,{passive:true});$('#shelves').append(section);requestAnimationFrame(controls);
  return section;
}
function createRecentShelf(){
  if(state.recent.length){const section=createShelf('Recently Watched','Your latest picks on this device. Jump back into a movie or your last episode.',state.recent,false,{recent:true,landscape:true,seeAllView:'recent'});section.classList.add('recent-shelf');}
  else{
    const section=document.createElement('section');section.className='recent-empty';section.innerHTML='<span class="recent-empty-icon"><svg><use href="#i-clock"/></svg></span><div><h2>Recently Watched</h2><p>Your movie nights will appear here. History is private to your account on this device.</p></div><button class="button button-secondary">Find a movie <svg><use href="#i-arrow"/></svg></button>';section.querySelector('button').onclick=()=>setView('movie');$('#shelves').append(section);
  }
}

function createPreferences(){
  const section=createShelf('Preferences','Your comfort classics, fairy tales, and favorite heroes.',preferenceMovies());
  if(!section)return;
  section.id='preferences';section.classList.add('preferences-shelf');
  const heading=section.querySelector('.shelf-heading>div');
  const eyebrow=document.createElement('span');eyebrow.className='preferences-eyebrow';eyebrow.textContent='♡ PICKED JUST FOR YOU';heading.prepend(eyebrow);
  section.setAttribute('aria-label','Your movie preferences');
}

function createSkeletonGrid(count,actors=false){
  const fragment=document.createDocumentFragment();
  for(let i=0;i<count;i++){
    const el=document.createElement('div');
    el.className=actors?'skeleton-card skeleton-actor':'col skeleton-card';
    el.setAttribute('aria-hidden','true');
    el.innerHTML='<div class="skeleton-art"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div>';
    fragment.append(el);
  }
  return fragment;
}

function updateHero(movie){
  if(!movie)return;
  const changed=!state.featured||keyFor(state.featured)!==keyFor(movie);
  state.featured=movie;
  window.cinema.updateBackdrop(assetUrl(movie.backdrop||movie.image));
  const content=$('.hero-content');content.classList.toggle('long-title',movie.title.length>17);content.classList.toggle('very-long-title',movie.title.length>30);
  if(changed){content.classList.remove('is-entering');void content.offsetWidth;content.classList.add('is-entering');}
  const kindText=$('#heroKindText');if(kindText)kindText.textContent=movie.type==='tv'?'SERIES':'FILM';
  $('#heroTitleText').textContent=movie.title;
  const request=++state.logoRequest;$('#heroTitle').classList.remove('has-title-logo');$('#heroLogo').hidden=true;$('#heroLogo').removeAttribute('src');
  loadTitleLogo(movie,request);
  const trendingList=state.home?.trending||fallbackCatalog;
  const rankIndex=trendingList.findIndex(item=>keyFor(item)===keyFor(movie));
  const heroRank=$('#heroRank');
  if(heroRank){heroRank.hidden=rankIndex<0||rankIndex>=10;if(!heroRank.hidden)$('#heroRankText').textContent=`#${rankIndex+1} in ${movie.type==='tv'?'Series':'Movies'} Today`;}
  const maturity=$('#heroMaturity');
  if(maturity){maturity.textContent=movie.rating||'';maturity.hidden=!movie.rating;}
  $('.hero-meta').replaceChildren(...[movie.year,movie.rating,movie.runtime,movie.genres?.[0]].filter(Boolean).map((label,index)=>{const span=document.createElement('span');span.textContent=label;if(index===1)span.className='certificate';return span;}));
  $('.hero-description').textContent=movie.description;
  updateSaveButtons();
}
async function loadTitleLogo(movie,request){
  const owner=window.memberAuth.currentMember()?.username;const key=keyFor(movie);
  try{
    if(!logoCache.has(key))logoCache.set(key,requestCatalog({mode:'artwork',type:movie.type,id:movie.id}).then(data=>data.logo||'').catch(()=>{logoCache.delete(key);return '';}));
    const src=await logoCache.get(key);
    if(!src||!/^https:\/\/image\.tmdb\.org\/t\/p\/(w500|original)\/[\w.-]+\.(png|svg|webp)$/i.test(src))return;
    const image=new Image();image.onload=()=>{if(request!==state.logoRequest||owner!==window.memberAuth.currentMember()?.username||!window.memberAuth.isAuthenticated())return;$('#heroLogo').src=src;$('#heroLogo').hidden=false;$('#heroTitle').classList.add('has-title-logo');};image.src=src;
  }catch{}
}
function sortedItems(items){const sorted=[...items];if(state.sort==='title')sorted.sort((a,b)=>a.title.localeCompare(b.title));else if(state.sort==='year')sorted.sort((a,b)=>(b.year||0)-(a.year||0));else if(state.sort==='rating')sorted.sort((a,b)=>ratingScore(b)-ratingScore(a));return sorted;}
function ratingScore(movie){return movie.rating?.startsWith('★')?Number.parseFloat(movie.rating.slice(1))||0:0;}
function renderGrid(items){
  const grid=$('#catalogGrid');
  grid.classList.toggle('history-grid',state.view==='recent');
  grid.classList.toggle('is-mixed-search',Boolean(state.query.trim())&&['home','saved','recent','actor'].includes(state.view));
  grid.replaceChildren(...sortedItems(items).map((movie,index)=>{
    const column=document.createElement('div');
    column.className='col';
    column.style.setProperty('--stagger',String(Math.min(index,12)));
    column.append(createCard(movie,{recent:state.view==='recent',landscape:true}));
    return column;
  }));
}
function matchesGenre(movie){if(state.genre==='all')return true;const aliases={'Sci-Fi':['Science Fiction','Sci-Fi','Sci-Fi & Fantasy'],'Action':['Action','Action & Adventure'],'Adventure':['Adventure','Action & Adventure'],'Fantasy':['Fantasy','Sci-Fi & Fantasy'],'War':['War','War & Politics']};return movie.genres?.some(genre=>(aliases[state.genre]||[state.genre]).includes(genre));}
function filterSaved(){const query=state.query.toLowerCase().trim();return [...state.saved.values()].filter(movie=>matchesGenre(movie)&&(!query||`${movie.title} ${movie.year} ${(movie.genres||[]).join(' ')}`.toLowerCase().includes(query)));}
function filterRecent(){const query=state.query.toLowerCase().trim();return state.recent.filter(movie=>matchesGenre(movie)&&(!query||`${movie.title} ${movie.year} ${(movie.genres||[]).join(' ')}`.toLowerCase().includes(query)));}

function syncSearchInputs(value){
  const text=String(value??'');
  if($('#searchInput')&&$('#searchInput').value!==text)$('#searchInput').value=text;
  if($('#dashboardSearchInput')&&$('#dashboardSearchInput').value!==text)$('#dashboardSearchInput').value=text;
  if($('#searchClear'))$('#searchClear').hidden=!text.length;
  if($('#dashboardSearchClear'))$('#dashboardSearchClear').hidden=!text.length;
}
function syncSearchScope(scope){
  state.searchScope=scope;
  document.querySelectorAll('[data-search-scope]').forEach(button=>{
    const active=button.dataset.searchScope===scope;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  const placeholders={all:'Search movies, series, or actors…',movie:'Search movies by title…',tv:'Search TV series by title…',actors:'Search actors by name…'};
  if($('#dashboardSearchInput'))$('#dashboardSearchInput').placeholder=placeholders[scope]||placeholders.all;
}
function syncResultScopeButtons(){
  const activeView=['home','movie','tv','actors'].includes(state.view)?state.view:'home';
  document.querySelectorAll('[data-result-scope]').forEach(button=>{
    const active=button.dataset.resultScope===activeView;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
}

function render(){
  const homeMode=state.view==='home'&&!state.query.trim()&&state.genre==='all';
  const peopleMode=state.view==='actors';
  const hasSearchQuery=Boolean(state.query.trim());
  $('#nav').classList.toggle('is-solid',!homeMode);
  $('#browse').dataset.home=String(homeMode);
  $('#dashboardSearchHub').hidden=!homeMode;
  $('#actorGrid').hidden=!peopleMode;$('#surpriseButton').hidden=!homeMode;$('#loadMore').firstChild.textContent=peopleMode?'More actors ':'More stories ';
  $('#actorGrid').replaceChildren();
  $('#actorProfile').hidden=state.view!=='actor';
  $('#catalogError').hidden=!state.error;
  $('#catalogErrorText').textContent=state.error;
  $('.genre-control').hidden=peopleMode;
  $('.genre-chips').hidden=peopleMode;
  $('#continueShelf').replaceChildren(); $('#continueShelf').hidden=true;
  $('#memberDashboardIntro').hidden=true;
  $('#wakenDashboardIntro').hidden=!homeMode;
  $('#sortWrap').hidden=homeMode||peopleMode;
  $('#activeSearchBar').hidden=!hasSearchQuery||!['home','movie','tv','actors'].includes(state.view);
  if(!$('#activeSearchBar').hidden)syncResultScopeButtons();
  $('#home').hidden=!homeMode;$('#browse').style.marginTop=homeMode?'':'110px';
  $('#shelves').replaceChildren();$('#catalogGrid').replaceChildren();
  const items=state.view==='saved'?filterSaved():state.view==='recent'?filterRecent():state.view==='actor'?state.items.filter(movie=>matchesGenre(movie)&&(!state.query.trim()||movie.title.toLowerCase().includes(state.query.trim().toLowerCase()))):state.items;
  $('#collectionCount').textContent=`${items.length} ${items.length===1?'title':'titles'}`;
  if(homeMode){
    const home=state.home;
    const trending=home?.trending||fallbackCatalog.slice(0,10);
    const moviesList=home?.movies||fallbackCatalog.filter(movie=>movie.type==='movie');
    const tvList=home?.tv||fallbackCatalog.filter(movie=>movie.type==='tv');
    const top10Keys=new Set(trending.slice(0,10).map(keyFor));
    const unfinished=state.recent.filter(movie=>movie.time>15&&!movie.completed);
    if(unfinished.length){const shelf=createShelf('Continue Watching','Right back to your saved moment.',unfinished,false,{recent:true,landscape:true});shelf.classList.add('recent-shelf');$('#continueShelf').append(shelf);$('#continueShelf').hidden=false;}
    createShelf('Trending Now','The movies and series everyone is talking about.',trending,false,{landscape:true,top10Keys});
    if(state.saved.size)createShelf('My List','Your saved movies and series.',[...state.saved.values()],false,{landscape:true,top10Keys,seeAllView:'saved'});
    createShelf('Top 10 Today','Most-watched titles right now.',trending.slice(0,10),true);
    createShelf('Popular Movies','Explore popular movies.',moviesList,false,{landscape:true,top10Keys,seeAllView:'movie'});
    if(isKristine())createPreferences();
    createShelf('Popular Series','Your next series obsession.',tvList,false,{landscape:true,top10Keys,seeAllView:'tv'});
    createRecentShelf();
    document.querySelectorAll('#continueShelf .shelf, #shelves .shelf').forEach((shelf,index)=>shelf.style.setProperty('--stagger',String(Math.min(index,6))));
    $('#browseTitle').textContent=isKristine()?'A good story for every mood.':'Find something you’ll love.';
  }else{
    if(state.loading&&!items.length){
      if(peopleMode)$('#actorGrid').append(createSkeletonGrid(10,true));
      else $('#catalogGrid').append(createSkeletonGrid(8,false));
    }else if(peopleMode){
      $('#actorGrid').replaceChildren(...items.map((person,index)=>{const card=createActorCard(person);card.style.setProperty('--stagger',String(Math.min(index,12)));return card;}));
    }else{
      renderGrid(items);
    }
    const scopeLabel={home:'',movie:' in Movies',tv:' in Series',actors:' in Actors'}[state.view]||'';
    $('#browseTitle').textContent=state.query.trim()?`Results for “${state.query.trim()}”${scopeLabel}`:({movie:'Movies',tv:'Series',saved:'My List',recent:'Recently Watched',actors:'Actors',actor:state.person?`Starring ${state.person.name}`:'Actor filmography',home:'Explore'}[state.view]);
  }
  const hasItems=homeMode||items.length>0;
  $('#empty').hidden=hasItems||state.loading||!!state.error;
  $('#emptyTitle').textContent=state.view==='saved'&&!state.saved.size?'Your list starts with a good story.':'No matches just yet.';
  $('#emptyText').textContent=state.view==='saved'&&!state.saved.size?'Tap the + on a title to save it here. Your list stays on this device.':'Try a different title or explore another genre.';
  if(peopleMode){$('#emptyTitle').textContent='No actors found.';$('#emptyText').textContent='Try another name or clear your search to explore popular actors.';}
  if(state.view==='recent'&&!state.recent.length){$('#emptyTitle').textContent='Your next movie night starts here.';$('#emptyText').textContent='Start a movie or episode and it will appear here. Your history stays separate for each account on this device.';}
  $('#catalogStatus').hidden=!state.loading||(!homeMode&&!items.length);$('#catalogStatusText').textContent=state.loading?'Finding your next favorite…':'';
  $('#loadMore').hidden=homeMode||['saved','recent'].includes(state.view)||state.loading||state.page>=state.totalPages;
  updateSaveButtons();
  $('#dashboardDock').hidden=!homeMode;
  const unfinished=state.recent.find(movie=>movie.time>15&&!movie.completed);$('#resumeLatest').disabled=!unfinished;$('#resumeLatestLabel').textContent=unfinished?`Resume ${unfinished.title}`:'Your next story starts here';
  window.cinema.observe();
}

async function requestCatalog(parameters){const owner=window.memberAuth.currentMember()?.username;const response=await fetch(`/api/tmdb?${new URLSearchParams(parameters)}`,{credentials:'same-origin',signal:AbortSignal.timeout(20000)});if(response.status===401){if(owner===window.memberAuth.currentMember()?.username)window.memberAuth.expire();throw new Error('Session ended');}if(!response.ok)throw new Error('Catalog request failed');return response.json();}
async function loadHome(){
  if(state.home&&Date.now()-(state.homeLoadedAt||0)<120000){++state.request;state.loading=false;setHomeSlides();render();return;}
  const request=++state.request;state.error='';state.loading=true;render();
  try{const data=await requestCatalog({mode:'home'});if(request!==state.request)return;state.home=data;state.homeLoadedAt=Date.now();remember([data.hero,...data.trending,...data.movies,...data.tv,...(data.preferences||[])]);setHomeSlides();}
  catch{if(request!==state.request||!window.memberAuth.isAuthenticated())return;state.home={hero:fallbackCatalog[0],trending:fallbackCatalog.slice(0,8),movies:fallbackCatalog.filter(movie=>movie.type==='movie'),tv:fallbackCatalog.filter(movie=>movie.type==='tv')};setHomeSlides();notify('Live catalog unavailable. Showing our collection.');}
  finally{if(request===state.request){state.loading=false;render();}}
}
function setHomeSlides(){
  if(isKristine()){
    const picks=preferenceMovies();
    window.cinema.setSlides([...picks].sort((a,b)=>(b.id===38757)-(a.id===38757)));
  }else window.cinema.setSlides([state.home.hero,...state.home.trending.filter(movie=>keyFor(movie)!==keyFor(state.home.hero))]);
}
async function loadCollection({append=false}={}){
  if(state.view==='actor'){render();return;}
  if(['saved','recent'].includes(state.view)){++state.request;state.loading=false;render();return;}
  const request=++state.request;const page=append?state.page+1:1;state.error='';state.loading=true;if(!append){state.items=[];state.page=1;state.totalPages=1;}render();
  try{
    const parameters=state.view==='actors'?{mode:'people',query:state.query.trim(),page}:state.query.trim()?{mode:'search',query:state.query.trim(),type:state.view==='home'?'all':state.view,genre:state.genre==='all'?'':state.genre,page}:{mode:'discover',type:state.view==='tv'?'tv':'movie',genre:state.genre==='all'?'':state.genre,page};
    const data=await requestCatalog(parameters);if(request!==state.request)return;
    state.items=append?[...new Map([...state.items,...data.results].map(item=>[state.view==='actors'?item.id:keyFor(item),item])).values()]:data.results;state.page=data.page;state.totalPages=data.totalPages;remember(data.results);
  }catch{if(request!==state.request)return;if(!append)state.items=[];state.error=state.view==='actors'?'Actor discovery is temporarily unavailable. Try again in a moment.':'The live catalog is temporarily unavailable. Try again in a moment.';}
  finally{if(request===state.request){state.loading=false;render();}}
}
function pulseNavProgress(){
  const bar=$('#navProgress');if(!bar)return;
  bar.classList.remove('is-running');void bar.offsetWidth;bar.classList.add('is-running');
}
function animateViewTransition(){
  for(const target of [$('#home'),$('#dashboardSearchHub'),$('#continueShelf'),$('#browse')]){
    if(!target||target.hidden)continue;
    target.classList.remove('view-animate');void target.offsetWidth;target.classList.add('view-animate');
  }
}
function updateNavIndicator(){
  const indicator=$('#navIndicator');const nav=$('.nav-links');const active=$('.nav-links .nav-link.active');
  if(!indicator||!nav||!active){if(indicator)indicator.classList.remove('is-ready');return;}
  const navRect=nav.getBoundingClientRect();const btnRect=active.getBoundingClientRect();
  if(!btnRect.width)return;
  if(window.innerWidth<768){
    const pillWidth=Math.min(36,Math.max(22,btnRect.width*0.45));
    const offset=btnRect.left-navRect.left+(btnRect.width-pillWidth)/2;
    indicator.style.width=`${pillWidth}px`;
    indicator.style.transform=`translateX(${offset}px)`;
    indicator.classList.add('is-ready');
    return;
  }
  indicator.style.width=`${btnRect.width}px`;
  indicator.style.transform=`translateX(${btnRect.left-navRect.left}px)`;
  indicator.classList.add('is-ready');
}
function setGenre(genre){
  closeSuggestions();
  state.error='';state.genre=genre;$('#genre').value=genre;
  document.querySelectorAll('[data-genre]').forEach(button=>{const active=button.dataset.genre===genre;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);});
  if(state.view==='home'&&genre!=='all'){state.view=tvGenres.includes(genre)&&!movieGenres.includes(genre)?'tv':'movie';configureGenres(state.view);$('#genre').value=genre;}
  syncNavigation();pulseNavProgress();
  if(state.view==='home'&&!state.query.trim())loadHome();else loadCollection();
  animateViewTransition();
  window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function syncNavigation(){document.querySelectorAll('.nav-links [data-view]').forEach(button=>{const active=button.dataset.view===(state.view==='actor'?'actors':state.view);button.classList.toggle('active',active);active?button.setAttribute('aria-current','page'):button.removeAttribute('aria-current');});requestAnimationFrame(updateNavIndicator);}
function setView(view){
  clearTimeout(searchTimer);clearTimeout(suggestTimer);closeSuggestions();
  state.error='';state.person=null;state.view=view;configureGenres(view);
  $('#searchInput').placeholder=view==='actors'?'Search actors by name':'Search movies, series…';
  $('#searchInput').setAttribute('aria-label',view==='actors'?'Search actors':'Search movies and series');
  state.items=[];state.query='';state.genre='all';state.sort='default';$('#sortSelect').value='default';
  syncSearchInputs('');
  if(view==='home')syncSearchScope('all');
  else if(['movie','tv','actors'].includes(view))syncSearchScope(view);
  $('#searchForm').classList.remove('open');$('#searchToggle').setAttribute('aria-expanded','false');
  $('#genre').value='all';
  document.querySelectorAll('[data-genre]').forEach(button=>{const active=button.dataset.genre==='all';button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);});
  syncNavigation();pulseNavProgress();
  if(view==='home')loadHome();else loadCollection();
  animateViewTransition();
  window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}

/* ---------- Live Search & Instant Suggestions ---------- */
function localCatalogPool(){
  const map=new Map();
  const sources=[...(state.home?.trending||[]),...(state.home?.movies||[]),...(state.home?.tv||[]),...(state.home?.preferences||[]),...state.saved.values(),...state.recent,...fallbackCatalog];
  for(const item of sources){
    if(item?.id&&item?.type&&!map.has(keyFor(item)))map.set(keyFor(item),item);
  }
  return [...map.values()];
}
function localQuickMatches(query,scope){
  if(scope==='actors')return [];
  const q=query.toLowerCase();
  return localCatalogPool().filter(item=>{
    if((scope==='movie'||scope==='tv')&&item.type!==scope)return false;
    return `${item.title} ${item.year||''} ${(item.genres||[]).join(' ')}`.toLowerCase().includes(q);
  }).slice(0,5);
}
function closeSuggestions(){
  const panel=$('#searchSuggestions');
  if(!panel)return;
  panel.hidden=true;
  panel.replaceChildren();
  state.suggestIndex=-1;
  $('#dashboardSearchBox')?.classList.remove('has-suggestions');
}
function updateSuggestionHighlight(){
  const items=[...document.querySelectorAll('#searchSuggestions .suggestion-item')];
  items.forEach((el,i)=>el.classList.toggle('is-highlighted',i===state.suggestIndex));
  if(state.suggestIndex>=0&&items[state.suggestIndex])items[state.suggestIndex].scrollIntoView({block:'nearest'});
}
function renderEmptySuggestions(panel,query){
  panel.replaceChildren();
  if(query.length===1){
    const hint=document.createElement('p');
    hint.className='suggestion-hint';
    hint.textContent='Type one more letter to search the full catalog…';
    panel.append(hint);
    const locals=localQuickMatches(query,state.searchScope);
    if(locals.length)appendTitleSuggestions(panel,locals,false);
    return;
  }
  const recents=readRecentSearches();
  if(recents.length){
    const group=document.createElement('div');group.className='suggestion-group';
    const header=document.createElement('div');header.className='suggestion-group-head';
    header.innerHTML='<span>Recent searches</span><button type="button" class="suggestion-clear-all">Clear</button>';
    header.querySelector('.suggestion-clear-all').onclick=()=>{clearRecentSearches();renderEmptySuggestions(panel,'');};
    const chips=document.createElement('div');chips.className='suggestion-chips';
    for(const term of recents){
      const wrap=document.createElement('span');wrap.className='recent-chip-wrap';
      const btn=document.createElement('button');btn.type='button';btn.className='suggestion-chip';btn.textContent=term;
      btn.onclick=()=>executeSearch(term,state.searchScope);
      const del=document.createElement('button');del.type='button';del.className='recent-chip-del';del.setAttribute('aria-label',`Remove ${term}`);del.textContent='×';
      del.onclick=e=>{e.stopPropagation();removeRecentSearch(term);renderEmptySuggestions(panel,'');};
      wrap.append(btn,del);chips.append(wrap);
    }
    group.append(header,chips);panel.append(group);
  }
  const trending=(state.home?.trending||fallbackCatalog).slice(0,6);
  if(trending.length){
    const group=document.createElement('div');group.className='suggestion-group';
    const header=document.createElement('div');header.className='suggestion-group-head';
    header.innerHTML='<span>Trending right now</span>';
    const chips=document.createElement('div');chips.className='suggestion-chips';
    for(const item of trending){
      const btn=document.createElement('button');btn.type='button';btn.className='suggestion-chip is-trending';
      btn.textContent=item.title;
      btn.onclick=()=>{closeSuggestions();openDetails(item);};
      chips.append(btn);
    }
    group.append(header,chips);panel.append(group);
  }
}
function appendTitleSuggestions(panel,results,isActors){
  const list=document.createElement('div');list.className='suggestion-list';
  for(const item of results.slice(0,6)){
    const row=document.createElement('div');row.className='suggestion-item';row.setAttribute('role','option');
    if(isActors){
      const thumb=item.image?`<img src="${escapeHtml(item.image)}" alt="" loading="lazy">`:`<span class="suggestion-initials">${escapeHtml(item.name.split(' ').map(p=>p[0]).slice(0,2).join(''))}</span>`;
      row.innerHTML=`<button type="button" class="suggestion-main"><span class="suggestion-thumb is-actor">${thumb}</span><span class="suggestion-info"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.knownFor||'Actor')}</small></span><span class="suggestion-tag">ACTOR</span></button>`;
      row.querySelector('.suggestion-main').onclick=()=>{closeSuggestions();openActor(item);};
    }else{
      const art=assetUrl(item.image||item.backdrop);
      const meta=[item.year,item.rating,item.genres?.[0]].filter(Boolean).join(' · ');
      row.innerHTML=`<button type="button" class="suggestion-main"><span class="suggestion-thumb"><img src="${escapeHtml(art)}" alt="" loading="lazy"></span><span class="suggestion-info"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(meta||(item.type==='tv'?'Series':'Movie'))}</small></span><span class="suggestion-tag">${item.type==='tv'?'SERIES':'MOVIE'}</span></button><button type="button" class="suggestion-play" aria-label="Play ${escapeHtml(item.title)}">${icons.play}</button>`;
      const img=row.querySelector('img');
      img.addEventListener('error',()=>{if(!img.dataset.fallback){img.dataset.fallback='true';img.src='assets/noir-hero.png';}});
      row.querySelector('.suggestion-main').onclick=()=>{closeSuggestions();openDetails(item);};
      row.querySelector('.suggestion-play').onclick=e=>{e.stopPropagation();closeSuggestions();openPlayer(item);};
    }
    list.append(row);
  }
  panel.append(list);
}
function renderLiveSuggestions(query,results,isActors,loading=false){
  const panel=$('#searchSuggestions');
  if(!panel)return;
  panel.replaceChildren();
  state.suggestIndex=-1;
  if(results.length){
    appendTitleSuggestions(panel,results,isActors);
  }else if(loading){
    const status=document.createElement('p');status.className='suggestion-hint is-loading';
    status.innerHTML='<span class="spinner"></span><span>Searching catalog…</span>';
    panel.append(status);
  }else{
    const empty=document.createElement('p');empty.className='suggestion-hint';
    empty.textContent=`No quick matches for “${query}”. Press Search to browse all.`;
    panel.append(empty);
  }
  const footer=document.createElement('button');
  footer.type='button';footer.className='suggestion-footer suggestion-item';
  footer.innerHTML=`<svg aria-hidden="true"><use href="#i-search"/></svg><span>See all results for “<strong>${escapeHtml(query)}</strong>”</span>`;
  footer.onclick=()=>executeSearch(query,state.searchScope);
  panel.append(footer);
  panel.hidden=false;
  $('#dashboardSearchBox')?.classList.add('has-suggestions');
}
function triggerLiveSuggestions(rawQuery){
  const panel=$('#searchSuggestions');
  if(!panel||$('#dashboardSearchHub').hidden)return;
  const query=String(rawQuery||'').trim();
  clearTimeout(suggestTimer);
  const req=++state.suggestRequest;
  if(query.length<2){
    renderEmptySuggestions(panel,query);
    panel.hidden=!panel.childElementCount;
    $('#dashboardSearchBox')?.classList.toggle('has-suggestions',!panel.hidden);
    return;
  }
  const isActors=state.searchScope==='actors';
  const locals=localQuickMatches(query,state.searchScope);
  renderLiveSuggestions(query,locals,isActors,true);
  suggestTimer=setTimeout(async()=>{
    try{
      const params=isActors?{mode:'people',query,page:1}:{mode:'search',query,type:state.searchScope==='all'?'all':state.searchScope,page:1};
      const data=await requestCatalog(params);
      if(req!==state.suggestRequest||$('#dashboardSearchHub').hidden)return;
      const merged=isActors?(data.results||[]):[...new Map([...(data.results||[]),...locals].map(item=>[keyFor(item),item])).values()];
      remember(data.results);
      renderLiveSuggestions(query,merged,isActors,false);
    }catch{
      if(req!==state.suggestRequest||$('#dashboardSearchHub').hidden)return;
      renderLiveSuggestions(query,locals,isActors,false);
    }
  },220);
}
function executeSearch(rawQuery,scopeOverride=null){
  clearTimeout(searchTimer);clearTimeout(suggestTimer);
  const query=String(rawQuery??'').trim();
  if(!query){
    notify('Type a movie, series, or actor name to search.');
    const target=$('#dashboardSearchHub').hidden?$('#searchInput'):$('#dashboardSearchInput');
    target?.focus();
    return;
  }
  const localOnly=['saved','recent','actor'].includes(state.view)&&!scopeOverride;
  if(!localOnly&&query.length<2){
    notify('Enter at least 2 characters to search.');
    return;
  }
  closeSuggestions();
  saveRecentSearch(query);
  const scope=scopeOverride||(state.view==='actors'?'actors':state.view==='movie'?'movie':state.view==='tv'?'tv':'all');
  if(!localOnly){
    state.person=null;
    state.view=scope==='all'?'home':scope;
    configureGenres(state.view);
    syncSearchScope(scope);
    syncNavigation();
  }
  state.query=query;
  state.error='';
  state.items=[];
  syncSearchInputs(query);
  $('#searchForm').classList.remove('open');
  $('#searchToggle').setAttribute('aria-expanded','false');
  pulseNavProgress();
  if(localOnly)render();
  else loadCollection();
  animateViewTransition();
  window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function clearActiveSearch(){
  clearTimeout(searchTimer);clearTimeout(suggestTimer);closeSuggestions();
  state.query='';
  state.error='';
  syncSearchInputs('');
  if(state.view==='home'&&state.genre==='all'){loadHome();}
  else if(['saved','recent','actor'].includes(state.view)){render();}
  else{loadCollection();}
}

function fillDetails(movie){
  $('#detailTitle').textContent=movie.title;$('#detailType').textContent=movie.type==='tv'?'SERIES':'MOVIE';
  $('#detailPoster').src=assetUrl(movie.backdrop||movie.image);$('#detailPoster').alt=`${movie.title} artwork`;
  $('#detailMeta').replaceChildren(...[movie.year,movie.rating,movie.runtime,...(movie.genres||[])].filter(Boolean).map(label=>{const span=document.createElement('span');span.textContent=label;return span;}));
  $('#detailCast').replaceChildren(...(movie.cast||[]).map(person=>createActorCard(person,true)));$('#detailCastSection').hidden=!movie.cast?.length;$('#detailDescription').textContent=movie.description;$('#detailFootnote').textContent=movie.type==='tv'?'Choose a season and episode in the player.':'Movie information supplied by TMDB.';updateSaveButtons();
}
async function fetchDetails(movie){try{const data=await requestCatalog({mode:'details',type:movie.type,id:movie.id});return data.result||movie;}catch{return movie;}}
async function openDetails(movie){state.selected=movie;fillDetails(movie);$('#details').showModal();document.body.classList.add('dialog-open');const detailed=await fetchDetails(movie);if(state.selected&&keyFor(state.selected)===keyFor(movie)){state.selected=detailed;fillDetails(detailed);if(state.saved.has(keyFor(detailed))){state.saved.set(keyFor(detailed),detailed);persistSaved();}}}
function closeDetails(){$('#details').close();document.body.classList.remove('dialog-open');}
async function openPlayer(movie,resume=null){
  if(!window.memberAuth.isAuthenticated())return;
  if($('#playerDialog').open&&state.playing&&keyFor(state.playing)===keyFor(movie))return;
  const request=++playback.request;
  const owner=window.memberAuth.currentMember().username;
  resume ||= state.recent.find(item=>keyFor(item)===keyFor(movie));
  closeDetails();$('#playerTitle').textContent=movie.title;$('#playerLoading').hidden=false;$('#playerLoading p').textContent=movie.type==='tv'?'Getting your episode ready…':'Opening your player…';setPlaybackStatus('connecting');
  if(!$('#playerDialog').open)$('#playerDialog').showModal();document.body.classList.add('dialog-open');$('#playerDialog').setAttribute('aria-busy','true');
  $('#playerDialog').querySelectorAll('button,select').forEach(element=>{if(element.id!=='closePlayer')element.disabled=true;});
  const detailed=movie.type==='tv'&&!movie.seasons?await fetchDetails(movie):movie;
  if(request!==playback.request||!window.memberAuth.isAuthenticated()||owner!==window.memberAuth.currentMember()?.username)return;
  state.playing=detailed;closeDetails();$('#playerTitle').textContent=detailed.title;$('#episodeControls').hidden=detailed.type!=='tv';
  if(detailed.type==='tv'){$('#seasonSelect').replaceChildren(...(detailed.seasons?.length?detailed.seasons:[1]).map((_,index)=>new Option(String(index+1),String(index+1))));$('#seasonSelect').value=String(Math.min(resume?.season||1,detailed.seasons?.length||1));populateEpisodes();$('#episodeSelect').value=String(Math.min(resume?.episode||1,$('#episodeSelect').options.length));}
  const prefs=window.memberPreferencesStore.read(owner);$('#playerQuality').value=prefs.quality;
  $('#playerDialog').setAttribute('aria-busy','false');$('#playerDialog').querySelectorAll('button,select').forEach(element=>{element.disabled=false;});
  loadPlayer({time:resume?.completed?0:resume?.time||0,duration:resume?.duration||0});
}
function populateEpisodes(){const season=Number($('#seasonSelect').value)||1;const episodeCount=state.playing.seasons?.[season-1]||1;$('#episodeSelect').replaceChildren(...Array.from({length:episodeCount},(_,index)=>new Option(String(index+1),String(index+1))));}
function setPlaybackStatus(phase){
  const labels={connecting:'Opening player',finding:'Finding a stream',ready:'Ready · press Play if needed',playing:'Playing',paused:'Paused',slow:'Taking longer than usual',error:'Stream could not start',ended:'Finished'};
  $('#playerStatus').dataset.phase=phase;$('#playerStatusText').textContent=labels[phase]||'Opening player';
  $('#playbackNotice').hidden=!['slow','error'].includes(phase);
  $('#playbackNoticeText').textContent=phase==='error'?'The provider reported a stream error. Retry the connection or request 480p.':'No playback progress has been detected yet. Press Play in the video, or try the recovery controls below.';
  if(phase==='error')$('#playerLoading').hidden=true;
}
function loadPlayer({time=0,duration=0,fresh=false}={}){
  if(!state.playing||!window.memberAuth.isAuthenticated())return;
  const movie=state.playing;const owner=window.memberAuth.currentMember().username;const season=Number($('#seasonSelect').value)||1;const episode=Number($('#episodeSelect').value)||1;
  Object.assign(playback,{owner,time,duration,savedAt:0,server:'',pendingSeek:time>0,targetTime:time});
  const prefs=window.memberPreferencesStore.read(owner);const url=window.playerKit.buildUrl(movie,{season,episode,time,quality:$('#playerQuality').value,server:prefs.server,fresh,pink:isKristine()});
  $('#playerLoading').hidden=false;$('#playerLoading p').textContent='Opening your player…';$('#playerType').textContent=movie.type==='tv'?`NOW WATCHING · SEASON ${season} · EPISODE ${episode}`:'NOW WATCHING';
  $('#player').title=`${movie.title}${movie.type==='tv'?` - Season ${season}, Episode ${episode}`:''} video player`;playbackMonitor.begin(time);$('#player').src=url;
  if(window.watchHistory.record(owner,{...movie,time,duration,completed:false},season,episode)){loadRecent();updateSaveButtons();}else notify('History could not be saved on this device.');
  updateNextEpisode();
}
function updateNextEpisode(){const lastEpisode=$('#episodeSelect').selectedIndex>=($('#episodeSelect').options.length-1);const lastSeason=$('#seasonSelect').selectedIndex>=($('#seasonSelect').options.length-1);$('#nextEpisode').disabled=lastEpisode&&lastSeason;}
function savePlayback(force=false,completed=false){
  if(!state.playing||playback.owner!==window.memberAuth.currentMember()?.username||!window.memberAuth.isAuthenticated())return;
  if(!force&&Date.now()-playback.savedAt<10000)return;
  playback.savedAt=Date.now();window.watchHistory.progress(playback.owner,state.playing,playback.time,playback.duration,completed);
}
function closePlayer(){savePlayback(true);++playback.request;playbackMonitor.stop();$('#playerDialog').close();$('#player').removeAttribute('src');state.playing=null;playback.owner='';document.body.classList.remove('dialog-open');if(window.memberAuth.isAuthenticated()){loadRecent();render();}}
function changeQuality(quality){const username=window.memberAuth.currentMember()?.username;if(!username)return;$('#playerQuality').value=quality;window.memberPreferencesStore.save(username,{quality});loadPlayer({time:playback.time,duration:playback.duration});}
window.addEventListener('message',event=>{
  if(!state.playing||!$('#playerDialog').open||playback.owner!==window.memberAuth.currentMember()?.username)return;
  const data=window.playerKit.parseEvent(event,$('#player').contentWindow);if(!data)return;
  if(data.type==='cinesrc:seeked')playback.pendingSeek=false;
  if(data.type==='cinesrc:timeupdate'&&playback.pendingSeek&&data.time!==undefined){if(data.time+5<playback.targetTime)return;playback.pendingSeek=false;}
  playbackMonitor.accept(data);
  if(data.time!==undefined)playback.time=data.time;if(data.duration!==undefined)playback.duration=data.duration;
  if(data.server)playback.server=data.server;
  if((data.type==='cinesrc:play'||data.type==='cinesrc:timeupdate'&&playbackMonitor.phase()==='playing')&&playback.server&&playback.server!==playback.persistedServer){window.memberPreferencesStore.save(playback.owner,{server:playback.server});playback.persistedServer=playback.server;}
  if(['cinesrc:timeupdate','cinesrc:seeked','cinesrc:pause'].includes(data.type))savePlayback(data.type!=='cinesrc:timeupdate');
  if(data.type==='cinesrc:ended')savePlayback(true,true);
  if(data.type==='cinesrc:close')closePlayer();
  if(data.type==='cinesrc:nextepisode'&&state.playing.type==='tv'&&data.season&&data.episode){
    savePlayback(true);
    if(data.season>$('#seasonSelect').options.length)return;
    $('#seasonSelect').value=String(data.season);populateEpisodes();if(data.episode>$('#episodeSelect').options.length)return;$('#episodeSelect').value=String(data.episode);
    if(data.internalNavigation){Object.assign(playback,{time:0,duration:0,savedAt:0});window.watchHistory.record(playback.owner,state.playing,data.season,data.episode);$('#playerType').textContent=`NOW WATCHING · SEASON ${data.season} · EPISODE ${data.episode}`;updateNextEpisode();playbackMonitor.begin();playbackMonitor.frameLoaded();}
    else loadPlayer();
  }
});

document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>setView(button.dataset.view));
document.querySelectorAll('[data-genre]').forEach(button=>button.onclick=()=>setGenre(button.dataset.genre));
document.querySelectorAll('[data-quick-genre]').forEach(button=>button.onclick=()=>setGenre(button.dataset.quickGenre));
document.querySelectorAll('[data-search-scope]').forEach(button=>button.onclick=()=>{
  syncSearchScope(button.dataset.searchScope);
  if(document.activeElement===$('#dashboardSearchInput')||!$('#searchSuggestions').hidden){
    triggerLiveSuggestions($('#dashboardSearchInput').value);
  }
});
document.querySelectorAll('[data-result-scope]').forEach(button=>button.onclick=()=>{
  const targetView=button.dataset.resultScope;
  if(targetView===state.view)return;
  state.view=targetView;
  configureGenres(targetView);
  syncSearchScope(targetView==='home'?'all':targetView);
  syncNavigation();
  pulseNavProgress();
  loadCollection();
  animateViewTransition();
});
$('#genre').onchange=event=>setGenre(event.target.value);

/* Header search form */
$('#searchForm').onsubmit=event=>{event.preventDefault();executeSearch($('#searchInput').value);};
$('#searchInput').oninput=event=>{
  const value=event.target.value;
  syncSearchInputs(value);
  state.query=value;
  const trimmed=value.trim();
  clearTimeout(searchTimer);
  if(['saved','recent','actor'].includes(state.view)){searchTimer=setTimeout(()=>render(),200);return;}
  if(!trimmed){
    if(state.view==='home'&&state.genre==='all')loadHome();
    else loadCollection();
    return;
  }
  if(trimmed.length<2)return;
  state.items=[];++state.request;
  searchTimer=setTimeout(()=>{saveRecentSearch(trimmed);loadCollection();},320);
};
$('#searchClear').onclick=()=>{clearActiveSearch();$('#searchInput').focus();};

/* Dashboard search hub */
$('#dashboardSearchForm').onsubmit=event=>{
  event.preventDefault();
  executeSearch($('#dashboardSearchInput').value,state.searchScope);
};
$('#dashboardSearchInput').addEventListener('focus',()=>triggerLiveSuggestions($('#dashboardSearchInput').value));
$('#dashboardSearchInput').addEventListener('input',event=>{
  syncSearchInputs(event.target.value);
  triggerLiveSuggestions(event.target.value);
});
$('#dashboardSearchInput').addEventListener('keydown',event=>{
  const items=[...document.querySelectorAll('#searchSuggestions .suggestion-item')];
  if(event.key==='Escape'){closeSuggestions();$('#dashboardSearchInput').blur();return;}
  if(!items.length||$('#searchSuggestions').hidden)return;
  if(event.key==='ArrowDown'){event.preventDefault();state.suggestIndex=(state.suggestIndex+1)%items.length;updateSuggestionHighlight();}
  else if(event.key==='ArrowUp'){event.preventDefault();state.suggestIndex=(state.suggestIndex-1+items.length)%items.length;updateSuggestionHighlight();}
  else if(event.key==='Enter'&&state.suggestIndex>=0){
    event.preventDefault();
    const target=items[state.suggestIndex];
    const mainBtn=target.querySelector('.suggestion-main')||target;
    mainBtn.click();
  }
});
$('#dashboardSearchClear').onclick=()=>{syncSearchInputs('');triggerLiveSuggestions('');$('#dashboardSearchInput').focus();};
$('#clearSearchBanner').onclick=clearActiveSearch;

$('#sortSelect').onchange=event=>{state.sort=event.target.value;render();};
function surpriseMovie(){const pool=[...(state.home?.movies||fallbackCatalog.filter(movie=>movie.type==='movie')),...state.saved.values()].filter(movie=>movie.type==='movie');const unseen=pool.filter(movie=>!state.recent.some(entry=>keyFor(entry)===keyFor(movie)));const choices=unseen.length?unseen:pool;openDetails(choices[Math.floor(Math.random()*choices.length)]);}
$('#surpriseButton').onclick=surpriseMovie;$('#dockSurprise').onclick=surpriseMovie;if($('#heroShuffle'))$('#heroShuffle').onclick=surpriseMovie;if($('#hubSurprise'))$('#hubSurprise').onclick=surpriseMovie;
$('#resumeLatest').onclick=()=>{const movie=state.recent.find(item=>item.time>15&&!item.completed);if(movie)openPlayer(movie,movie);};
$('#searchToggle').onclick=()=>{
  closeSuggestions();
  const open=$('#searchForm').classList.toggle('open');
  $('#searchToggle').setAttribute('aria-expanded',open);
  if(open){$('#searchInput').focus();}
  else if(state.query){clearActiveSearch();}
};
document.addEventListener('click',event=>{
  if(!event.target.closest('.search-area')&&$('#searchForm').classList.contains('open')&&!$('#searchInput').value.trim()){
    $('#searchForm').classList.remove('open');$('#searchToggle').setAttribute('aria-expanded','false');
  }
  if(!event.target.closest('#dashboardSearchBox')&&!$('#searchSuggestions').hidden){
    closeSuggestions();
  }
});
$('#searchInput').addEventListener('keydown',event=>{if(event.key==='Escape'){$('#searchForm').classList.remove('open');$('#searchToggle').setAttribute('aria-expanded','false');$('#searchToggle').focus();}});
$('#resetFilters').onclick=()=>setView(state.view==='actors'?'actors':'home');$('#retryCatalog').onclick=()=>{if(state.view==='actor'&&state.person)openActor(state.person);else if(state.view==='home'&&!state.query.trim()&&state.genre==='all'){state.home=null;loadHome();}else loadCollection();};$('#loadMore').onclick=()=>loadCollection({append:true});
$('#heroPlay').onclick=()=>openPlayer(state.featured||fallbackCatalog[0]);$('#heroInfo').onclick=()=>openDetails(state.featured||fallbackCatalog[0]);$('#heroSave').onclick=()=>toggleSave(state.featured||fallbackCatalog[0]);
$('#detailSave').onclick=()=>toggleSave(state.selected);$('#detailPlay').onclick=()=>openPlayer(state.selected);$('#closeDetails').onclick=closeDetails;$('#closePlayer').onclick=closePlayer;
$('#seasonSelect').onchange=()=>{savePlayback(true);populateEpisodes();loadPlayer();};$('#episodeSelect').onchange=()=>{savePlayback(true);loadPlayer();};$('#player').onload=()=>{if(state.playing){$('#playerLoading').hidden=true;playbackMonitor.frameLoaded();}};
$('#playerQuality').onchange=event=>changeQuality(event.target.value);
$('#retryPlayer').onclick=()=>loadPlayer({time:playback.time,duration:playback.duration,fresh:true});$('#try480').onclick=()=>changeQuality('480');$('#restartPlayer').onclick=()=>loadPlayer({time:0,duration:playback.duration});
$('#pressPlay').onclick=()=>$('#player').contentWindow?.postMessage({type:'cinesrc:command',command:'play',args:[]},window.playerKit.ORIGIN);
$('#nextEpisode').onclick=()=>{savePlayback(true);if($('#episodeSelect').selectedIndex<$('#episodeSelect').options.length-1)$('#episodeSelect').selectedIndex++;else if($('#seasonSelect').selectedIndex<$('#seasonSelect').options.length-1){$('#seasonSelect').selectedIndex++;populateEpisodes();}loadPlayer();};
for(const[selector,close]of[['#details',closeDetails],['#playerDialog',closePlayer]]){const dialog=$(selector);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('click',event=>{const rect=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))close();});}
document.querySelectorAll('.wordmark').forEach(link=>link.onclick=event=>{if(window.memberAuth.isAuthenticated()){event.preventDefault();setView('home');}});addEventListener('scroll',()=>$('#nav').classList.toggle('scrolled',scrollY>20),{passive:true});addEventListener('resize',updateNavIndicator,{passive:true});document.fonts?.ready.then(updateNavIndicator);

window.addEventListener('cinema:feature',event=>updateHero(event.detail));
window.addEventListener('member:signed-in',()=>{loadSaved();loadRecent();setView('home');});
window.addEventListener('member:signed-out',()=>{++state.request;++state.logoRequest;++state.suggestRequest;++playback.request;playbackMonitor.stop();playback.owner='';clearTimeout(searchTimer);clearTimeout(suggestTimer);closeSuggestions();window.cinema.stop();state.selected=null;state.playing=null;state.featured=null;state.loading=false;state.home=null;state.person=null;state.error='';state.items=[];$('#actorProfile').replaceChildren();$('#actorGrid').replaceChildren();state.recent=[];state.saved.clear();state.query='';syncSearchInputs('');syncSearchScope('all');});
document.addEventListener('keydown',event=>{
  if(!window.memberAuth.isAuthenticated()||document.querySelector('dialog[open]')||event.ctrlKey||event.metaKey||event.altKey||/input|textarea|select/i.test(event.target.tagName))return;
  if(event.key==='/'){
    event.preventDefault();
    if(!$('#dashboardSearchHub').hidden){
      $('#dashboardSearchInput').scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      $('#dashboardSearchInput').focus();
    }else{
      $('#searchForm').classList.add('open');$('#searchToggle').setAttribute('aria-expanded','true');$('#searchInput').focus();
    }
  }
});
window.addEventListener('storage',event=>{if(window.memberAuth.isAuthenticated()&&event.key===`blue-maruya-history:${window.memberAuth.currentMember().username}`){loadRecent();render();}});

const movieGenres=['Action','Adventure','Animation','Comedy','Crime','Documentary','Drama','Family','Fantasy','History','Horror','Music','Mystery','Romance','Sci-Fi','Thriller','TV Movie','War','Western'];
const tvGenres=['Action','Animation','Comedy','Crime','Documentary','Drama','Family','Kids','Mystery','News','Reality','Sci-Fi','Soap','Talk','War','Western'];
function configureGenres(view){
  const genres=view==='tv'?tvGenres:view==='movie'?movieGenres:[...new Set([...movieGenres,...tvGenres])].sort();
  $('#genre').replaceChildren(new Option('All genres','all'),...genres.map(name=>new Option(name,name)));
  document.querySelectorAll('[data-genre]').forEach(button=>button.hidden=button.dataset.genre!=='all'&&!genres.includes(button.dataset.genre));
}
function createActorCard(person,compact=false){
  const button=document.createElement('button');button.className=compact?'actor-card cast-card':'actor-card';button.type='button';
  button.setAttribute('aria-label','Explore '+person.name);
  const portrait=document.createElement('span');portrait.className='actor-portrait';
  const fallback=document.createElement('span');fallback.className='actor-initials';fallback.setAttribute('aria-hidden','true');fallback.textContent=person.name.split(' ').map(part=>part[0]).slice(0,2).join('');portrait.append(fallback);
  if(person.image){const img=document.createElement('img');img.src=person.image;img.alt='';img.loading='lazy';img.width=185;img.height=278;img.onerror=()=>img.remove();portrait.append(img);}
  const name=document.createElement('strong');name.textContent=person.name;
  const sub=document.createElement('small');sub.textContent=person.character||person.knownFor||'Explore filmography';
  button.append(portrait,name,sub);button.onclick=()=>{if($('#details').open)closeDetails();openActor(person);};return button;
}
async function openActor(person){
  clearTimeout(searchTimer);clearTimeout(suggestTimer);closeSuggestions();
  state.view='actor';state.person=person;state.items=[];state.query='';state.genre='all';state.sort='default';state.page=1;state.totalPages=1;state.error='';state.loading=true;
  syncSearchInputs('');$('#searchInput').placeholder='Search this filmography';$('#searchInput').setAttribute('aria-label','Search this filmography');$('#sortSelect').value='default';configureGenres('actor');syncNavigation();
  document.querySelectorAll('[data-genre]').forEach(button=>{const active=button.dataset.genre==='all';button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);});
  function profile(value){
    const back=document.createElement('button');back.className='button button-secondary';back.textContent='Back to actors';back.onclick=()=>setView('actors');
    const name=document.createElement('h2');name.textContent=value.name;
    const bio=document.createElement('p');bio.textContent=value.biography||'Explore movies and series featuring '+value.name+'.';
    const text=document.createElement('div');text.append(back,name,bio);$('#actorProfile').replaceChildren(text);
  }
  profile(person);pulseNavProgress();render();animateViewTransition();window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});const request=++state.request;
  try{const data=await requestCatalog({mode:'person',id:person.id});if(request!==state.request)return;state.person=data.person;state.items=data.results;profile(data.person);}
  catch{if(request!==state.request)return;state.error='This filmography could not load. Please try again.';}
  finally{if(request===state.request){state.loading=false;render();}}
}

if(window.memberAuth.isAuthenticated()){loadSaved();loadRecent();setView('home');}
