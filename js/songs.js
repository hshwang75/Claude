/* Songs. Short tunes are written out here; whole pieces live in songs/<id>.js.
   Each note is written as name+octave (C4 is middle 도) with an optional length in
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
    // Whole pieces made from Mutopia Project scores by scripts/import_scores.py.
    // The notes are in songs/<id>.js and load when the song is chosen. length is minutes:seconds.
    { id: 'farmer', title: '즐거운 농부', composer: '슈만', level: 2, doodle: 'sun', color: '--c-fa', score: true, length: '0:48' },
    { id: 'schubertlullaby', title: '슈베르트 자장가', composer: '슈베르트', level: 2, doodle: 'moon', color: '--c-si', score: true, length: '0:40' },
    { id: 'soldiers', title: '나무 병정 행진', composer: '차이콥스키', level: 2, doodle: 'star', color: '--c-do', score: true, length: '0:40' },
    { id: 'minuet', title: '미뉴에트', composer: '바흐', level: 2, doodle: 'flower', color: '--c-do', score: true, length: '1:36' },
    { id: 'elise', title: '엘리제를 위하여', composer: '베토벤', level: 3, doodle: 'heart', color: '--c-si', score: true, length: '2:35' },
    { id: 'turkish', title: '터키 행진곡', composer: '모차르트', level: 3, doodle: 'note', color: '--c-re', score: true, length: '3:35' },
    // The piano part of 송어 ripples quickly under the tune: slower, and the piano kept soft.
    { id: 'trout', title: '송어', composer: '슈베르트', level: 2, doodle: 'cloud', color: '--c-sol', score: true, length: '2:42', speed: 0.75, accomp: 0.45 },
    { id: 'danube', title: '아름답고 푸른 도나우', composer: '요한 슈트라우스', level: 2, doodle: 'cloud', color: '--c-sol', score: true, length: '0:39' },
    { id: 'mountain', title: '산속 마왕의 궁전', composer: '그리그', level: 3, doodle: 'moon', color: '--c-la', score: true, length: '2:36' },
    { id: 'entertainer', title: '엔터테이너', composer: '스콧 조플린', level: 3, doodle: 'note', color: '--c-mi', score: true, length: '4:12' },
    { id: 'puppy', title: '강아지 왈츠', composer: '쇼팽', level: 3, doodle: 'heart', color: '--c-do', score: true, length: '1:29' },
    { id: 'military', title: '군대 행진곡', composer: '슈베르트', level: 3, doodle: 'star', color: '--c-re', score: true, length: '4:32' },
    { id: 'gymnopedie', title: '짐노페디 1번', composer: '사티', level: 2, doodle: 'cloud', color: '--c-la', score: true, length: '3:23' },
    { id: 'traumerei', title: '트로이메라이', composer: '슈만', level: 2, doodle: 'moon', color: '--c-si', score: true, length: '1:50' },
    { id: 'arabesque', title: '아라베스크', composer: '부르크뮐러', level: 2, doodle: 'flower', color: '--c-fa', score: true, length: '0:43' },
    { id: 'sonatina', title: '소나티네', composer: '클레멘티', level: 3, doodle: 'note', color: '--c-mi', score: true, length: '1:56' },
    { id: 'sonatafacile', title: '피아노 소나타 16번', composer: '모차르트', level: 3, doodle: 'star', color: '--c-sol', score: true, length: '4:25' },
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
  all.forEach((s) => {
    if (!s.notes) return;
    s.parsed = parse(s.notes);
    const secs = Math.round(s.parsed.reduce((t, n) => t + n.beats, 0) * 60 / s.bpm);
    s.length = s.length || `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  });
  window.SONGS = all;
})();
