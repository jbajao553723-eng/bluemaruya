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
const state={view:'home',genre:'all',query:'',items:[],home:null,saved:new Map(),selected:null,playing:null,page:1,totalPages:1,loading:false,request:0};
let toastTimer;
let searchTimer;

function assetUrl(value){if(!value)return 'assets/noir-hero.png';return /^https?:\/\//.test(value)?value:`assets/${value}`;}
function escapeHtml(value){return String(value??'').replace(/[&<>"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]));}
function remember(items){for(const movie of items||[]){if(movie?.id&&movie?.type){const saved=state.saved.get(keyFor(movie));if(saved)state.saved.set(keyFor(movie),{...saved,...movie});}}}
const savedKey=()=>`blue-maruya-list:${window.memberAuth.currentMember()?.username||'guest'}`;
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
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2400);}
function toggleSave(movie){const key=keyFor(movie);const removed=state.saved.has(key);removed?state.saved.delete(key):state.saved.set(key,movie);persistSaved();notify(removed?'Removed from your list':'Added to your list');if(state.view==='saved')state.items=[...state.saved.values()];render();updateSaveButtons();}
function updateSaveButtons(){
  const hero=state.featured||state.home?.hero||fallbackCatalog[0];
  const heroSaved=state.saved.has(keyFor(hero));
  $('#heroSave').innerHTML=heroSaved?icons.check:icons.plus;
  $('#heroSave').setAttribute('aria-pressed',heroSaved);
  $('#heroSave').setAttribute('aria-label',`${heroSaved?'Remove':'Add'} ${hero.title} ${heroSaved?'from':'to'} my list`);
  $('#listCount').textContent=state.saved.size;$('#listCount').hidden=!state.saved.size;
  if(state.selected){const selectedSaved=state.saved.has(keyFor(state.selected));$('#detailSave').textContent=selectedSaved?'✓ In my list':'Add to my list';$('#detailSave').setAttribute('aria-pressed',selectedSaved);}
}

function createCard(movie){
  const article=document.createElement('article');article.className='movie-card';
  article.innerHTML=`<button class="poster-button" aria-label="Details for ${escapeHtml(movie.title)}"><img src="${escapeHtml(assetUrl(movie.image))}" alt="${escapeHtml(movie.title)} poster" loading="lazy" width="300" height="450"><span class="media-badge">${movie.type==='tv'?'SERIES':'MOVIE'}</span><span class="poster-play">${icons.play}</span></button><div class="card-bottom"><div><button class="card-title">${escapeHtml(movie.title)}</button><p class="card-meta">${escapeHtml(movie.year||'Coming soon')} <span aria-hidden="true">·</span> ${escapeHtml(movie.genres?.[0]||'Featured')}</p></div><button class="card-save" aria-label="${state.saved.has(keyFor(movie))?'Remove':'Add'} ${escapeHtml(movie.title)} ${state.saved.has(keyFor(movie))?'from':'to'} my list" aria-pressed="${state.saved.has(keyFor(movie))}">${state.saved.has(keyFor(movie))?icons.check:icons.plus}</button></div>`;
  article.querySelector('.poster-button').onclick=()=>openDetails(movie);
  const image=article.querySelector('img');
  image.addEventListener('error',()=>{if(!image.dataset.fallback){image.dataset.fallback='true';image.src='assets/noir-hero.png';}});
  if(movie.preferenceLabel){const mood=document.createElement('span');mood.className='preference-mood';mood.textContent=movie.mood;article.append(mood);const label=document.createElement('span');label.className='preference-label';label.textContent=movie.preferenceLabel;article.querySelector('.poster-button').append(label);}
  if(movie.rating?.startsWith('★')){const score=document.createElement('span');score.className='score-badge';score.textContent=movie.rating;article.querySelector('.poster-button').append(score);}
  article.querySelector('.card-title').onclick=()=>openDetails(movie);
  article.querySelector('.card-save').onclick=()=>toggleSave(movie);
  return article;
}
function createShelf(title,subtitle,movies,ranked=false){
  if(!movies?.length)return;
  const section=document.createElement('section');section.className=`shelf${ranked?' ranked':''}`;
  section.innerHTML=`<div class="shelf-heading"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><div class="rail-controls"><button class="icon-button" aria-label="Previous titles in ${escapeHtml(title)}">${icons.left}</button><button class="icon-button" aria-label="Next titles in ${escapeHtml(title)}">${icons.right}</button></div></div><div class="rail"></div>`;
  const rail=section.querySelector('.rail');
  movies.forEach((movie,index)=>{const card=createCard(movie);if(ranked){const wrap=document.createElement('div');wrap.className='rank-card';const rank=document.createElement('span');rank.className='rank-number';rank.setAttribute('aria-hidden','true');rank.textContent=String(index+1);wrap.append(rank,card);rail.append(wrap);}else rail.append(card);});
  const[left,right]=section.querySelectorAll('.rail-controls button');
  left.onclick=()=>rail.scrollBy({left:-rail.clientWidth*.8,behavior:'smooth'});right.onclick=()=>rail.scrollBy({left:rail.clientWidth*.8,behavior:'smooth'});
  function controls(){left.disabled=rail.scrollLeft<2;right.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-3;}
  rail.addEventListener('scroll',controls,{passive:true});$('#shelves').append(section);requestAnimationFrame(controls);
  return section;
}

function createPreferences(){
  const section=createShelf('Preferences','Your comfort classics, fairy tales, and favorite heroes.',preferenceMovies());
  if(!section)return;
  section.id='preferences';section.classList.add('preferences-shelf');
  const heading=section.querySelector('.shelf-heading>div');
  const eyebrow=document.createElement('span');eyebrow.className='preferences-eyebrow';eyebrow.textContent='♡ PICKED JUST FOR YOU';heading.prepend(eyebrow);
  section.setAttribute('aria-label','Your movie preferences');
}

function updateHero(movie){
  if(!movie)return;
  state.featured=movie;
  window.cinema.updateBackdrop(assetUrl(movie.backdrop||movie.image));
  const content=$('.hero-content');content.classList.toggle('long-title',movie.title.length>17);content.classList.toggle('very-long-title',movie.title.length>30);
  $('#heroTitle').textContent=movie.title;
  $('.hero-meta').replaceChildren(...[movie.year,movie.rating,movie.runtime,movie.genres?.[0]].filter(Boolean).map((label,index)=>{const span=document.createElement('span');span.textContent=label;if(index===1)span.className='certificate';return span;}));
  $('.hero-description').textContent=movie.description;
  updateSaveButtons();
}
function renderGrid(items){const grid=$('#catalogGrid');grid.replaceChildren(...items.map(movie=>{const column=document.createElement('div');column.className='col';column.append(createCard(movie));return column;}));}
function matchesGenre(movie){if(state.genre==='all')return true;const aliases={'Sci-Fi':['Science Fiction','Sci-Fi','Sci-Fi & Fantasy'],'Action':['Action','Action & Adventure'],'Adventure':['Adventure','Action & Adventure'],'Fantasy':['Fantasy','Sci-Fi & Fantasy'],'War':['War','War & Politics']};return movie.genres?.some(genre=>(aliases[state.genre]||[state.genre]).includes(genre));}
function filterSaved(){const query=state.query.toLowerCase().trim();return [...state.saved.values()].filter(movie=>matchesGenre(movie)&&(!query||`${movie.title} ${movie.year} ${(movie.genres||[]).join(' ')}`.toLowerCase().includes(query)));}
function render(){
  const homeMode=state.view==='home'&&!state.query.trim()&&state.genre==='all';
  $('#memberDashboardIntro').hidden=!homeMode||!isKristine();
  $('#home').hidden=!homeMode;$('#browse').style.marginTop=homeMode?'':'110px';
  $('#shelves').replaceChildren();$('#catalogGrid').replaceChildren();
  const items=state.view==='saved'?filterSaved():state.items;
  if(homeMode){
    const home=state.home;
    createShelf('Top 10 movies','The big-screen favorites everyone is watching.',(home?.movies||fallbackCatalog.filter(movie=>movie.type==='movie')).slice(0,10),true);
    createShelf('Trending now','The movies and series everyone is talking about.',home?.trending||fallbackCatalog.slice(0,8));
    if(isKristine())createPreferences();
    createShelf('Popular series','Your next series obsession.',home?.tv||fallbackCatalog.filter(movie=>movie.type==='tv'));
    $('#browseTitle').textContent=isKristine()?'A good story for every mood.':'Find something you’ll love.';
  }else{
    renderGrid(items);
    $('#browseTitle').textContent=state.query.trim()?`Results for “${state.query.trim()}”`:({movie:'Explore popular movies.',tv:'Find your next series.',saved:'Your next watches, all here.',home:'Explore the collection.'}[state.view]);
  }
  const hasItems=homeMode||items.length>0;
  $('#empty').hidden=hasItems||state.loading;
  $('#emptyTitle').textContent=state.view==='saved'&&!state.saved.size?'Your list starts with a good story.':'No matches just yet.';
  $('#emptyText').textContent=state.view==='saved'&&!state.saved.size?'Tap the + on a title to save it here. Your list stays on this device.':'Try a different title or explore another genre.';
  $('#catalogStatus').hidden=!state.loading;$('#catalogStatusText').textContent=state.loading?'Finding your next favorite…':'';
  $('#loadMore').hidden=homeMode||state.view==='saved'||state.loading||state.page>=state.totalPages;
  updateSaveButtons();
  window.cinema.observe();
}

async function requestCatalog(parameters){const response=await fetch(`/api/tmdb?${new URLSearchParams(parameters)}`,{credentials:'same-origin'});if(response.status===401){window.memberAuth.expire();throw new Error('Session ended');}if(!response.ok)throw new Error('Catalog request failed');return response.json();}
async function loadHome(){
  const request=++state.request;state.loading=true;render();
  try{const data=await requestCatalog({mode:'home'});if(request!==state.request)return;state.home=data;remember([data.hero,...data.trending,...data.movies,...data.tv,...(data.preferences||[])]);setHomeSlides();}
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
  if(state.view==='saved'){++state.request;state.items=filterSaved();state.loading=false;render();return;}
  const request=++state.request;const page=append?state.page+1:1;state.loading=true;render();
  try{
    const parameters=state.query.trim()?{mode:'search',query:state.query.trim(),type:state.view==='home'?'all':state.view,genre:state.genre==='all'?'':state.genre,page}:{mode:'discover',type:state.view==='tv'?'tv':'movie',genre:state.genre==='all'?'':state.genre,page};
    const data=await requestCatalog(parameters);if(request!==state.request)return;
    state.items=append?[...state.items,...data.results]:data.results;state.page=data.page;state.totalPages=data.totalPages;remember(data.results);
  }catch{if(request!==state.request)return;if(!append)state.items=[];notify('Could not load more titles. Please try again.');}
  finally{if(request===state.request){state.loading=false;render();}}
}
function setGenre(genre){state.genre=genre;$('#genre').value=genre;document.querySelectorAll('[data-genre]').forEach(button=>{const active=button.dataset.genre===genre;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);});if(state.view==='home'&&genre!=='all')state.view='movie';syncNavigation();if(state.view==='home'&&!state.query.trim())loadHome();else loadCollection();}
function syncNavigation(){document.querySelectorAll('[data-view]').forEach(button=>{const active=button.dataset.view===state.view;button.classList.toggle('active',active);active?button.setAttribute('aria-current','page'):button.removeAttribute('aria-current');});}
function setView(view){clearTimeout(searchTimer);state.view=view;state.items=[];state.query='';state.genre='all';$('#searchInput').value='';$('#searchForm').classList.remove('open');$('#searchToggle').setAttribute('aria-expanded','false');$('#genre').value='all';document.querySelectorAll('[data-genre]').forEach(button=>{const active=button.dataset.genre==='all';button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);});syncNavigation();if(view==='home')loadHome();else loadCollection();window.scrollTo({top:0,behavior:'smooth'});}

function fillDetails(movie){
  $('#detailTitle').textContent=movie.title;$('#detailType').textContent=movie.type==='tv'?'SERIES':'MOVIE';
  $('#detailPoster').src=assetUrl(movie.backdrop||movie.image);$('#detailPoster').alt=`${movie.title} artwork`;
  $('#detailMeta').replaceChildren(...[movie.year,movie.rating,movie.runtime,...(movie.genres||[])].filter(Boolean).map(label=>{const span=document.createElement('span');span.textContent=label;return span;}));
  $('#detailDescription').textContent=movie.description;$('#detailFootnote').textContent=movie.type==='tv'?'Choose a season and episode in the player.':'Movie information supplied by TMDB.';updateSaveButtons();
}
async function fetchDetails(movie){try{const data=await requestCatalog({mode:'details',type:movie.type,id:movie.id});return data.result||movie;}catch{return movie;}}
async function openDetails(movie){state.selected=movie;fillDetails(movie);$('#details').showModal();document.body.classList.add('dialog-open');const detailed=await fetchDetails(movie);if(state.selected&&keyFor(state.selected)===keyFor(movie)){state.selected=detailed;fillDetails(detailed);if(state.saved.has(keyFor(detailed))){state.saved.set(keyFor(detailed),detailed);persistSaved();}}}
function closeDetails(){$('#details').close();document.body.classList.remove('dialog-open');}
async function openPlayer(movie){
  if(!window.memberAuth.isAuthenticated())return;
  const detailed=movie.type==='tv'&&!movie.seasons?await fetchDetails(movie):movie;state.playing=detailed;closeDetails();$('#playerTitle').textContent=detailed.title;$('#episodeControls').hidden=detailed.type!=='tv';
  if(detailed.type==='tv'){$('#seasonSelect').replaceChildren(...(detailed.seasons||[1]).map((_,index)=>new Option(String(index+1),String(index+1))));populateEpisodes();}
  loadPlayer();$('#playerDialog').showModal();document.body.classList.add('dialog-open');
}
function populateEpisodes(){const season=Number($('#seasonSelect').value)||1;const episodeCount=state.playing.seasons?.[season-1]||1;$('#episodeSelect').replaceChildren(...Array.from({length:episodeCount},(_,index)=>new Option(String(index+1),String(index+1))));}
function buildEmbedUrl(movie,season=1,episode=1){const base='https://cinesrc.st/embed';return movie.type==='tv'?`${base}/tv/${movie.id}?s=${season}&e=${episode}`:`${base}/movie/${movie.id}`;}
function loadPlayer(){const movie=state.playing;const season=Number($('#seasonSelect').value)||1;const episode=Number($('#episodeSelect').value)||1;const url=buildEmbedUrl(movie,season,episode);$('#playerLoading').hidden=false;$('#playerLoading p').textContent=movie.type==='tv'?'Opening your episode…':'Opening your movie…';$('#playerType').textContent=movie.type==='tv'?`NOW WATCHING · SEASON ${season} · EPISODE ${episode}`:'NOW WATCHING';$('#player').title=`${movie.title}${movie.type==='tv'?` - Season ${season}, Episode ${episode}`:''} video player`;$('#player').src=url;}
function closePlayer(){$(`#playerDialog`).close();$('#player').removeAttribute('src');state.playing=null;document.body.classList.remove('dialog-open');}

document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>setView(button.dataset.view));
document.querySelectorAll('[data-genre]').forEach(button=>button.onclick=()=>setGenre(button.dataset.genre));
$('#genre').onchange=event=>setGenre(event.target.value);
$('#searchForm').onsubmit=event=>event.preventDefault();
$('#searchInput').oninput=event=>{state.query=event.target.value;state.items=[];++state.request;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{if(state.view==='saved'){render();return;}if(!state.query.trim()&&state.view==='home')loadHome();else loadCollection();},350);};
$('#searchToggle').onclick=()=>{const open=$('#searchForm').classList.toggle('open');$('#searchToggle').setAttribute('aria-expanded',open);if(open)$('#searchInput').focus();};
$('#resetFilters').onclick=()=>setView('home');$('#loadMore').onclick=()=>loadCollection({append:true});
$('#heroPlay').onclick=()=>openPlayer(state.featured||fallbackCatalog[0]);$('#heroInfo').onclick=()=>openDetails(state.featured||fallbackCatalog[0]);$('#heroSave').onclick=()=>toggleSave(state.featured||fallbackCatalog[0]);
$('#detailSave').onclick=()=>toggleSave(state.selected);$('#detailPlay').onclick=()=>openPlayer(state.selected);$('#closeDetails').onclick=closeDetails;$('#closePlayer').onclick=closePlayer;
$('#seasonSelect').onchange=()=>{populateEpisodes();loadPlayer();};$('#episodeSelect').onchange=loadPlayer;$('#player').onload=()=>{$('#playerLoading').hidden=true;};
for(const[selector,close]of[['#details',closeDetails],['#playerDialog',closePlayer]]){const dialog=$(selector);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('click',event=>{const rect=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))close();});}
document.querySelectorAll('.wordmark').forEach(link=>link.onclick=()=>setView('home'));addEventListener('scroll',()=>$('#nav').classList.toggle('scrolled',scrollY>20),{passive:true});

window.addEventListener('cinema:feature',event=>updateHero(event.detail));
window.addEventListener('member:signed-in',()=>{loadSaved();setView('home');});
window.addEventListener('member:signed-out',()=>{++state.request;clearTimeout(searchTimer);window.cinema.stop();state.selected=null;state.playing=null;state.loading=false;state.home=null;state.items=[];state.saved.clear();state.query='';$('#searchInput').value='';});
if(window.memberAuth.isAuthenticated()){loadSaved();setView('home');}
