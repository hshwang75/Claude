/* Songs. Each note is written as name+octave (C4 is middle 도) with an optional length in
   beats after a colon: "E5:.5" is half a beat, no length means one beat, "R" is a rest.
   "|" marks bar lines and is only there to make the music easier to read. */
(function () {
  'use strict';

  const SONGS = [
    {
      id: 'twinkle', title: '작은 별', composer: '모차르트', level: 1, doodle: 'star', color: '--c-mi', bpm: 100,
      notes: `C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2 |
              G4 G4 F4 F4 | E4 E4 D4:2 | G4 G4 F4 F4 | E4 E4 D4:2 |
              C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2`,
    },
    {
      id: 'home', title: '꿈속의 고향', composer: '드보르자크', level: 1, doodle: 'house', color: '--c-fa', bpm: 72,
      notes: `E4:1.5 G4:.5 G4:2 | E4:1.5 D4:.5 C4:2 | D4 E4 G4 E4 | D4:4 |
              E4:1.5 G4:.5 G4:2 | E4:1.5 D4:.5 C4:2 | D4 E4 D4:1.5 C4:.5 | C4:4`,
    },
    {
      id: 'joy', title: '환희의 송가', composer: '베토벤', level: 2, doodle: 'sun', color: '--c-re', bpm: 116,
      notes: `E5 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | E5:1.5 D5:.5 D5:2 |
              E5 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | D5:1.5 C5:.5 C5:2 |
              D5 D5 E5 C5 | D5 E5:.5 F5:.5 E5 C5 | D5 E5:.5 F5:.5 E5 D5 | C5 D5 G4:2 |
              E5 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | D5:1.5 C5:.5 C5:2`,
    },
    {
      id: 'lullaby', title: '자장가', composer: '브람스', level: 2, doodle: 'moon', color: '--c-la', bpm: 84,
      notes: `E4:.5 E4:.5 | G4:2 E4:.5 E4:.5 | G4:2 E4:.5 G4:.5 | C5 B4:1.5 A4:.5 | A4 G4 D4:.5 E4:.5 |
              F4 D4 D4:.5 E4:.5 | F4:2 D4:.5 F4:.5 | B4:.5 A4:.5 G4 B4 | C5:2 C4:.5 C4:.5 |
              C5:2 A4:.5 F4:.5 | G4:2 E4:.5 C4:.5 | F4 G4 A4 | G4:2 C4:.5 C4:.5 |
              C5:2 A4:.5 F4:.5 | G4:2 E4:.5 C4:.5 | F4 E4 D4 | C4:3`,
    },
    {
      id: 'minuet', title: '미뉴에트', composer: '바흐', level: 3, doodle: 'flower', color: '--c-do', bpm: 108,
      notes: `D5 G4:.5 A4:.5 B4:.5 C5:.5 | D5 G4 G4 | E5 C5:.5 D5:.5 E5:.5 F#5:.5 | G5 G4 G4 |
              C5 D5:.5 C5:.5 B4:.5 A4:.5 | B4 C5:.5 B4:.5 A4:.5 G4:.5 | F#4 G4:.5 A4:.5 B4:.5 G4:.5 | A4:3 |
              D5 G4:.5 A4:.5 B4:.5 C5:.5 | D5 G4 G4 | E5 C5:.5 D5:.5 E5:.5 F#5:.5 | G5 G4 G4 |
              C5 D5:.5 C5:.5 B4:.5 A4:.5 | B4 C5:.5 B4:.5 A4:.5 G4:.5 | A4 B4:.5 A4:.5 G4:.5 F#4:.5 | G4:3`,
    },
    {
      id: 'elise', title: '엘리제를 위하여', composer: '베토벤', level: 3, doodle: 'heart', color: '--c-si', bpm: 66,
      notes: `E5:.25 D#5:.25 | E5:.25 D#5:.25 E5:.25 B4:.25 D5:.25 C5:.25 | A4:.75 C4:.25 E4:.25 A4:.25 |
              B4:.75 E4:.25 G#4:.25 B4:.25 | C5:.75 E4:.25 E5:.25 D#5:.25 |
              E5:.25 D#5:.25 E5:.25 B4:.25 D5:.25 C5:.25 | A4:.75 C4:.25 E4:.25 A4:.25 |
              B4:.75 E4:.25 C5:.25 B4:.25 | A4:1.5`,
    },
  ];

  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function parse(text) {
    return text.split(/\s+/).filter((t) => t && t !== '|').map((tokn) => {
      const [name, len] = tokn.split(':');
      const beats = len ? parseFloat(len) : 1;
      if (name === 'R') return { midi: null, beats };
      const m = /^([A-G])(#?)(\d)$/.exec(name);
      if (!m) throw new Error('Unknown note: ' + tokn);
      return { midi: 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] ? 1 : 0), beats };
    });
  }

  // Family-build songs from songs-family.js come first in the menu.
  const all = [...(window.SONGS_EXTRA || []), ...SONGS];
  all.forEach((s) => { s.parsed = parse(s.notes); });
  window.SONGS = all;
})();
