# 크레용 피아노

아이들이 휴대폰으로 치는 크레용 그림 피아노예요. 화면 대부분이 건반이고, 누르면 진짜 피아노 소리가 나요.

- **건반 놀이:** 건반을 누르면 그 음의 색으로 크레파스가 칠해지고 하트, 별, 꽃, 음표가 올라가요. 여러 손가락으로 동시에 쳐도 되고, 손가락을 미끄러뜨리면 글리산도처럼 이어서 쳐져요.
- **노래 듣기:** 건반이 저절로 쳐지면서 노래가 나와요.
- **따라치기:** 다음에 칠 건반이 그 음의 색으로 깜빡이고 별이 통통 튀어요. 끝까지 치면 "참 잘했어요" 도장이 찍혀요.
- **이름표:** 도레미, C D E, 이름 없음 중에서 고를 수 있어요.
- **휴대폰 방향:** 세워서 들어도 화면이 옆으로 돌아가서, 휴대폰을 눕히면 바로 가로 화면이 돼요.

## 들어 있는 노래

| 노래 | 작곡가 | 어려움 |
| --- | --- | --- |
| 넌 할 수 있어 (가족용에만 있어요) | 동요 | ★★ |
| 작은 별 | 모차르트 | ★ |
| 꿈속의 고향 | 드보르자크 | ★ |
| 환희의 송가 | 베토벤 | ★★ |
| 자장가 | 브람스 | ★★ |
| 미뉴에트 | 바흐 | ★★★ |
| 엘리제를 위하여 | 베토벤 | ★★★ |

## 내 컴퓨터에서 실행하기

1. 이 브랜치를 ZIP으로 내려받아 압축을 풀어요.
   (GitHub 저장소 화면에서 **Code → Download ZIP**)
2. 폴더 안의 `index.html`을 더블클릭해요.
3. 크롬, 엣지, 사파리 같은 브라우저가 열리면 **시작하기**를 눌러요.

컴퓨터 키보드로도 칠 수 있어요. `A S D F G H J K L ; '`가 흰 건반(도부터), `W E T Y U O P`가 검은 건반이에요.

## 무료 게임 사이트(itch.io)에 올리기

`dist` 폴더에 두 가지 묶음이 있어요.

- `crayon-piano-itch.zip` (**공개용**): 저작권이 끝난 클래식 6곡만 들어 있어요. 누구나 보는 곳에는 이걸 올려요.
- `crayon-piano-family.zip` (**가족용**): "넌 할 수 있어"처럼 저작권이 남아 있는 곡(`js/songs-family.js`)도 들어 있어요. 작곡가의 허락 없이 공개하면 안 되니, 올린다면 itch.io에서 **Restricted**(비밀번호로 잠금)로 두세요.

압축을 풀지 말고 zip 파일 그대로 올려요.

1. [itch.io](https://itch.io)에 가입하고 로그인해요.
2. 오른쪽 위 내 이름 메뉴에서 **Upload new project**를 눌러요.
3. **Title**에 `크레용 피아노`를 쓰고, **Kind of project**는 **HTML**을 골라요.
4. **Uploads**에서 zip 파일을 올리고 **This file will be played in the browser**에 체크해요.
5. **Embed options**에서 다음처럼 정해요.
   - **Mobile friendly** 체크, **Orientation**은 **Landscape**
   - **Fullscreen button** 체크
   - 휴대폰에서 꽉 차게 보이려면 **Click to launch in fullscreen**도 체크
6. **Pricing**은 **No payments**(무료)로 둬요.
7. 처음에는 **Visibility**를 **Draft**로 저장해서 직접 확인하고, 괜찮으면 **Public**으로 바꿔요.

## 고칠 때 쓰는 명령

```bash
python3 scripts/build.py samples   # 피아노 녹음을 바꿨을 때: 폴더에서 열기용 samples.js 다시 만들기
python3 scripts/build.py zip       # dist의 공개용, 가족용 zip 다시 만들기
```

새 노래는 `js/songs.js`에 넣어요. 저작권이 남아 있는 곡은 `js/songs-family.js`에 넣으면 공개용 묶음에서 자동으로 빠져요. 음 이름 뒤에 박자를 붙여 써요(`C4`는 가운데 도, `E5:.5`는 반 박자, 박자를 안 쓰면 한 박자, `R`은 쉼표).

## 만든 재료

- 피아노 소리: Salamander Grand Piano V3, Alexander Holm, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) (자세한 내용은 `audio/piano/README.md`)
- 글꼴: [Gaegu](https://fonts.google.com/specimen/Gaegu) (SIL Open Font License), Google Fonts에서 불러와요.
- 그림(곰돌이, 토끼, 꽃, 건반 등)은 모두 코드로 그린 크레용 그림이에요.
- `js/songs.js`의 노래는 모두 저작권이 끝난 클래식 곡의 멜로디예요. `js/songs-family.js`의 곡은 저작권이 남아 있어서 가족용에만 넣었어요.
