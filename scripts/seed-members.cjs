const { readMember, writeMember } = require('../lib/members');
(async () => {
  for (const username of ['wakengwapo', 'kdumangas']) {
    const record = await readMember(username);
    if (!record.etag) { await writeMember(record.member, null); console.log('Initialized private account:', username); }
    else console.log('Existing account preserved:', username);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
