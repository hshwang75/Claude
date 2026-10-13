# itch.io 페이지에 넣을 것 (영단어 퀘스트)

## 기본 설정

| 항목 | 넣을 값 |
| --- | --- |
| Title | 영단어 퀘스트 |
| Short description or tagline | 고양이 선생님과 함께하는 영단어 600 퀴즈 |
| Classification | Games |
| Kind of project | HTML |
| Release status | Released |
| Pricing | No payments |
| Uploads | `vocab-quest-버전.zip` → **This file will be played in the browser** 체크 (예전 zip은 지우기) |
| Embed options | **Embed in page**, Viewport **480 × 780** |
| Frame options | **Mobile friendly** 체크 → Orientation **Portrait**, **Fullscreen button** 체크, **Enable scrollbars** 체크 |
| Cover image | `english/itch/cover.png` (1260×1000, itch 목록의 섬네일로도 쓰여요) |
| Screenshots | `english/itch/shot-1-home.png` ~ `shot-4-pictures.png` |
| Genre | Educational |
| Tags | english, vocabulary, quiz, educational, kids, cats |
| Visibility | 먼저 Draft로 저장해서 확인 → Public |

## Description (그대로 붙여 넣기)

```
영단어 퀘스트 🐱

고양이 선생님과 함께 영단어 600개를 놀이처럼 익혀요.
초등학교 고학년부터 중학생까지, 휴대폰으로 바로 해요.

• 6단계 600단어: 초등 기초 · 초등 심화 · 중학 기본 · 중학 심화 · 고등 기초 · 도전!
• 네 가지 놀이: 뜻 고르기, 철자 맞추기, 듣고 쓰기, 스피드 60초
• 단어마다 뜻에 맞는 그림, 새로 쓴 예문과 해석, 외우는 꿀팁
• 자연스러운 목소리로 녹음한 단어와 예문 발음, 천천히 듣기
• 맞히면 반짝이는 별과 오르골 소리, 연속으로 맞히면 보너스 별
• 틀린 단어는 복습장에 담겨 1일 · 3일 · 7일 · 14일 뒤에 다시 나와요
• 퀴즈를 절반 넘게 맞히면 스티커가 한 장씩, 모두 40장
• 기록 코드로 내 기록을 보관하고 다른 기기에서 이어 하기

기록은 이 브라우저에 저장돼요. 스티커 화면의 "기록 코드 복사"로 보관해 두면
다른 기기나 기록이 지워진 뒤에도 그대로 되살릴 수 있어요.

만든 재료
• 피아노 소리: Salamander Grand Piano V3, Alexander Holm (CC BY 3.0)
• 발음 녹음: Kokoro-82M 음성 모델 (Apache 2.0)
• 글꼴: Jua, Gowun Dodum, Fredoka (SIL Open Font License)
• 단어 예문, 그림, 효과음은 이 앱을 위해 새로 만들었어요.
```

## 그림 다시 만들기

앱을 고친 뒤 커버와 스크린샷을 새로 뽑으려면:

```
node english/tools/itch.mjs
```
