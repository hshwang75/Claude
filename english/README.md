# 영단어 퀘스트

고양이 선생님과 함께하는 영단어 퀴즈예요. 초등 고학년부터 중학생까지를 위한 360단어(6단계 × 60단어)가 들어 있어요.

## 단계

| 단계 | 이름 | 예 |
| --- | --- | --- |
| Lv.1 | 초등 기초 | apple, happy |
| Lv.2 | 초등 심화 | invite, weather |
| Lv.3 | 중학 기본 | nervous, decide |
| Lv.4 | 중학 심화 | ancient, opinion |
| Lv.5 | 고등 기초 | reluctant, abundant |
| Lv.6 | 도전! | inevitable, unprecedented |

단어마다 뜻, 품사, 새로 쓴 예문과 해석이 있고, 일부는 외우는 꿀팁과 반대말도 있어요.

## 놀이

- **뜻 고르기**: 영어 단어를 보고 알맞은 뜻 4개 중 하나를 골라요.
- **철자 맞추기**: 뜻을 보고 글자 타일을 순서대로 눌러요. 3번 틀리면 다음 글자가 반짝여요.
- **듣고 쓰기**: 소리를 듣고 화면 자판으로 써요. 2번 틀리면 뜻이 보여요.
- **스피드 60초**: 60초 동안 뜻 고르기를 최대한 많이 맞혀요.

맞히면 별을 받고, 연속으로 맞히면(3·5·10연속) 별을 더 받아요. 힌트는 별 1개예요.

## 복습장

틀린 단어는 복습장에 담겨서 **1일 → 3일 → 7일 → 14일** 뒤에 다시 나와요.
날짜가 된 단어를 맞히면 다음 칸으로 가고, 4번 다 맞히면 "외운 단어"가 돼요. 다시 틀리면 처음 칸으로 돌아가요.

## 스티커와 기록

- 퀴즈를 절반 넘게 맞히면(스피드는 8개 이상) 스티커가 한 장씩 앨범에 붙어요(모두 40장).
- 하루 목표는 10단어, 매일 하면 "연속 공부" 날짜가 늘어요.
- 기록은 이 기기의 브라우저에 저장돼요. 다른 기기와는 이어지지 않아요.

## 버튼 위치가 틀어지지 않게 만든 방법

이 앱은 화면을 확대·축소하거나 돌리지 않고 보통 웹 페이지처럼 그려요. 모든 버튼은 진짜 `<button>`이라서, 아이폰을 세로로 들든 가로로 들든 그려진 자리를 누르면 그 버튼이 눌려요. 가로 화면에서는 문제와 답이 양옆으로 나뉘어요.

## 열기

- 인터넷 주소로 열기: 이 저장소에서 GitHub Pages를 켜면 `https://hshwang75.github.io/Claude/english/` 에서 열려요.
- 아이폰 홈 화면에 추가하면 고양이 선생님 아이콘이 생겨요.
- 확인 모드: 주소 끝에 `?debug` 를 붙이면 누른 자리가 빨간 점으로 보이고 아래에 기록이 떠요.

## 만들기 도구

```
python3 english/tools/build.py fonts 글꼴폴더   # 한글을 고친 뒤 글꼴을 다시 자르기
python3 english/tools/build.py stamp            # 버전(한국 시각) 적기
python3 english/tools/build.py page OUT.html    # 미리보기용 한 장짜리 페이지
python3 english/tools/build.py zip 폴더          # itch.io 업로드용 zip
node english/tools/icons.mjs                    # 홈 화면 아이콘 그리기
```

## 출처

- 피아노 소리: [Salamander Grand Piano V3](https://archive.org/details/SalamanderGrandPianoV3) (Alexander Holm), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). MP3는 [Tone.js audio](https://github.com/Tonejs/audio) 저장소에서 가져왔어요.
- 글꼴: [Jua](https://fonts.google.com/specimen/Jua), [Gowun Dodum](https://fonts.google.com/specimen/Gowun+Dodum), [Fredoka](https://fonts.google.com/specimen/Fredoka) — 모두 SIL Open Font License 1.1 (`fonts/OFL-*.txt`). 앱에 쓰는 글자만 잘라서 넣었어요.
- 단어 예문, 그림, 효과음은 이 앱을 위해 새로 만들었어요. 발음은 기기에 들어 있는 영어 음성으로 읽어요.
