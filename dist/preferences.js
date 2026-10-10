// Shared curated picks: public movie metadata only, never account credentials.
((root) => {
  const picks = [
    { id: 808, type: 'movie', title: 'Shrek', year: 2001, genres: ['Animation', 'Comedy', 'Fantasy'], runtime: '1h 30m', image: 'preference-shrek.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/w0eKUOEog2ImtktCHAMUZws8qif.jpg', preferenceLabel: 'Shrek', mood: 'Fairy-tale comfort', description: 'An unlikely hero, a talkative donkey, and a fairy-tale adventure with a little attitude.' },
    { id: 38757, type: 'movie', title: 'Tangled', year: 2010, genres: ['Animation', 'Family', 'Adventure'], runtime: '1h 40m', image: 'preference-tangled.jpg', backdrop: 'preference-tangled-backdrop.jpg', preferenceLabel: 'Rapunzel', mood: 'A little lantern magic', description: 'Rapunzel leaves her tower with Flynn Rider to chase the floating lights and discover a world beyond her window.' },
    { id: 10020, type: 'movie', title: 'Beauty and the Beast', year: 1991, genres: ['Romance', 'Family', 'Animation'], runtime: '1h 24m', image: 'preference-beauty-and-the-beast.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/fW4ZCoEZRBqLAJGFQ2g5AdAfPQR.jpg', preferenceLabel: 'Beauty and the Beast', mood: 'An enchanted love story', description: 'Belle discovers an enchanted castle and a prince whose true beauty is hidden beneath a spell.' },
    { id: 10674, type: 'movie', title: 'Mulan', year: 1998, genres: ['Animation', 'Family', 'Adventure'], runtime: '1h 28m', image: 'preference-mulan.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/mUYV0ZdsDEliGaQahcQH1F3grsP.jpg', preferenceLabel: 'Mulan', mood: 'Brave-heart energy', description: 'Mulan takes her father’s place in the army and finds the courage to become her own kind of hero.' },
    { id: 24428, type: 'movie', title: 'The Avengers', year: 2012, genres: ['Science Fiction', 'Action', 'Adventure'], runtime: '2h 23m', image: 'preference-avengers.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg', preferenceLabel: 'Avengers', mood: 'Big superhero energy', description: 'Earth’s mightiest heroes come together to protect the world from a threat no one hero can face alone.' }
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = picks;
  else root.memberPreferences = picks;
})(typeof window !== 'undefined' ? window : globalThis);
