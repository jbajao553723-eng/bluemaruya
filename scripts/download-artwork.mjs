import {mkdir,writeFile,stat} from 'node:fs/promises';
const images={
  'zootopia-2.jpg':'https://upload.wikimedia.org/wikipedia/en/6/6a/Zootopia_2_%282025_film%29.jpg',
  'dune-2.jpg':'https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg',
  'interstellar.jpg':'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg',
  'inception.jpg':'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg',
  'dark-knight.jpg':'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg',
  'spider-verse.jpg':'https://upload.wikimedia.org/wikipedia/en/b/b4/Spider-Man-_Across_the_Spider-Verse_poster.jpg',
  'grand-budapest.png':'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Grand_Budapest_Hotel.png',
  'everything-everywhere.jpg':'https://upload.wikimedia.org/wikipedia/en/1/1e/Everything_Everywhere_All_at_Once.jpg',
  'breaking-bad.jpg':'https://upload.wikimedia.org/wikipedia/en/6/61/BreakingBadS1DVD.jpg',
  'stranger-things.jpg':'https://upload.wikimedia.org/wikipedia/en/b/b1/Stranger_Things_season_1.jpg',
  'last-of-us.png':'https://upload.wikimedia.org/wikipedia/en/3/3e/The_Last_of_Us_season_1_Blu-ray.png',
  'zootopia-hero.jpg':'https://d23.com/app/uploads/2026/03/IMAGE-3_Zootopia-2.jpg',
  'preference-shrek.jpg':'https://image.tmdb.org/t/p/w500/iB64vpL3dIObOtMZgX3RqdVdQDc.jpg',
  'preference-tangled.jpg':'https://image.tmdb.org/t/p/w500/ym7Kst6a4uodryxqbGOxmewF235.jpg',
  'preference-beauty-and-the-beast.jpg':'https://image.tmdb.org/t/p/w500/hUJ0UvQ5tgE2Z9WpfuduVSdiCiU.jpg',
  'preference-mulan.jpg':'https://image.tmdb.org/t/p/w500/jAbexAtB0aSfP5Ay4TpWHARyVnG.jpg',
  'preference-avengers.jpg':'https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg',
  'preference-tangled-backdrop.jpg':'https://image.tmdb.org/t/p/w1280/cWczNud8Y8i8ab0Z4bxos4myWYO.jpg'
};
await mkdir('dist/assets',{recursive:true});
for(const[file,url]of Object.entries(images)){
  if(await stat(`dist/assets/${file}`).then(s=>s.size>1000).catch(()=>false))continue;
  let response;
  for(let attempt=0;attempt<3;attempt++){
    response=await fetch(url,{headers:{'User-Agent':'Bluemaruya-UI/1.0 (movie catalog prototype)'}});
    if(response.ok)break;
    await new Promise(resolve=>setTimeout(resolve,2000*(attempt+1)));
  }
  if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw new Error(`Artwork download failed for ${file}: ${response.status}`);
  await writeFile(`dist/assets/${file}`,Buffer.from(await response.arrayBuffer()));console.log(`Saved ${file}`);
  await new Promise(resolve=>setTimeout(resolve,500));
}
