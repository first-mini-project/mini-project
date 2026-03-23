/**
 * storybook.js — StoryModal 스타일 (좌: 배경+그림, 우: 텍스트+내비)
 */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  // 1. 세계관 테마 시스템
  // ═══════════════════════════════════════════════════════════════════════
  const SCENE_THEMES = [
    { re: /space|planet|galaxy|star.*shine|nebula|cosmic|universe|spaceship|alien/,
      type: 'space',
      sky: 'radial-gradient(ellipse at 40% 20%, #1a1a4e 0%, #0d0d2b 55%, #050510 100%)' },
    { re: /underwater|ocean|sea|deep.*sea|coral|aqua|mermaid|bubble.*palace|sea.*kingdom/,
      type: 'ocean',
      sky: 'linear-gradient(to bottom, #006994 0%, #004d6e 45%, #002a40 100%)' },
    { re: /cloud.*kingdom|cotton.*candy.*cloud|sky.*castle|rainbow.*bridge|fluffy.*cloud|cloud.*palace|sky.*kingdom|above.*cloud/,
      type: 'cloudkingdom',
      sky: 'linear-gradient(to bottom, #74b9ff 0%, #a8d8f0 40%, #e0f4ff 100%)' },
    { re: /forest|enchanted.*tree|magical.*tree|mushroom.*village|fairy.*forest|glowing.*mushroom|tree.*house|ancient.*forest/,
      type: 'forest',
      sky: 'linear-gradient(to bottom, #0d3d0d 0%, #1a6e1a 40%, #228b22 100%)' },
    { re: /snow|ice.*palace|aurora|frozen|polar|ice.*castle|snowflake|icy/,
      type: 'ice',
      sky: 'linear-gradient(to bottom, #1a3a5c 0%, #2d6699 40%, #87b5d9 100%)' },
    { re: /lava|volcano|fire.*dragon|flame.*island|magma|hot.*lava|erupting/,
      type: 'volcano',
      sky: 'linear-gradient(to bottom, #1a0800 0%, #4a1400 35%, #8b2800 70%, #b84400 100%)' },
    { re: /circus|sparkling.*tent|acrobat|performer|ringmaster|magic.*circus|big.*top/,
      type: 'circus',
      sky: 'linear-gradient(135deg, #1a0033 0%, #33006b 35%, #660099 65%, #9900cc 100%)' },
    { re: /castle|magic.*library|tower.*castle|knight.*castle|dragon.*castle|enchanted.*castle|stone.*castle/,
      type: 'castle',
      sky: 'linear-gradient(to bottom, #0d001a 0%, #2d0050 45%, #4a0080 100%)' },
    { re: /candy|chocolate.*river|marshmallow|cookie.*road|sweet.*land|candy.*land|sugar/,
      type: 'candy',
      sky: 'linear-gradient(135deg, #ff6eb4 0%, #ff9ecc 35%, #ffcce6 65%, #fff0f8 100%)' },
    { re: /moon.*rabbit|moonlight.*meadow|silver.*river|moon.*village|lunar.*surface|moon.*crater/,
      type: 'moon',
      sky: 'radial-gradient(ellipse at 30% 15%, #0f0f33 0%, #1a1a4e 50%, #080820 100%)' },
    { re: /pirate|treasure.*island|tropical.*island|hidden.*cave|sailing.*ship|treasure.*cave/,
      type: 'pirate',
      sky: 'linear-gradient(to bottom, #0077b6 0%, #0096c7 35%, #00b4d8 70%, #48cae4 100%)' },
    { re: /flower|spring.*petal|petal.*carpet|butterfly.*carriage|blossom|spring.*blooming|floral/,
      type: 'flower',
      sky: 'linear-gradient(to bottom, #87ceeb 0%, #c8eeff 40%, #e8f5ff 100%)' },
    { re: /amusement|carousel|magic.*roller|mirror.*maze|funfair|roller.*coaster|spinning/,
      type: 'amusement',
      sky: 'linear-gradient(135deg, #1a003d 0%, #33007a 40%, #6600cc 80%, #9933ff 100%)' },
    { re: /jungle|prehistoric|ancient.*ruin|dinosaur|tropical.*jungle|giant.*jungle|wild.*dinosaur/,
      type: 'jungle',
      sky: 'linear-gradient(to bottom, #1a4d1a 0%, #2d7a2d 40%, #3d8a3d 100%)' },
    { re: /meadow|sunny.*village|cheerful.*village|village.*square|festival|spring.*village|green.*field/,
      type: 'meadow',
      sky: 'linear-gradient(to bottom, #4facfe 0%, #87ceeb 45%, #b8e4ff 100%)' },
  ];

  const DECO_HTML = {
    space:        `<div class="deco s1"></div><div class="deco s2"></div><div class="deco s3"></div><div class="deco s4"></div><div class="deco s5"></div>`,
    moon:         `<div class="deco s1"></div><div class="deco s2"></div><div class="deco s3"></div><div class="deco moon-orb"></div>`,
    ocean:        `<div class="deco b1"></div><div class="deco b2"></div><div class="deco b3"></div><div class="deco wave-deco"></div>`,
    cloudkingdom: `<div class="deco c1"></div><div class="deco c2"></div><div class="deco c3"></div>`,
    ice:          `<div class="deco snow1"></div><div class="deco snow2"></div><div class="deco snow3"></div><div class="deco aurora-line"></div>`,
    circus:       `<div class="deco sp1"></div><div class="deco sp2"></div><div class="deco sp3"></div><div class="deco sp4"></div>`,
    flower:       ``,
    default:      ``,
  };

  const KW_THEME = {
    '별':'space','달':'moon','우주':'space','우주선':'space','외계인':'space','로봇':'space',
    '바다':'ocean','물고기':'ocean','펭귄':'ice','거북이':'ocean','오리':'ocean','배':'ocean',
    '나무':'forest','숲':'forest','곰':'forest','여우':'forest','새':'forest','개구리':'forest',
    '꽃':'flower','나비':'flower','딸기':'flower',
    '구름':'cloudkingdom','번개':'cloudkingdom','비':'ocean',
    '하늘':'meadow','무지개':'meadow','태양':'meadow',
    '산':'meadow','기차':'meadow','자동차':'meadow',
    '집':'meadow','토끼':'meadow','고양이':'meadow',
    '강아지':'meadow','풍선':'meadow',
    '눈':'ice','눈사람':'ice',
    '성':'castle','왕관':'castle','마법지팡이':'castle',
    '케이크':'candy','아이스크림':'candy','도넛':'candy','사탕':'candy','초콜릿':'candy',
    '사과':'meadow','수박':'meadow','바나나':'jungle',
    '포도':'meadow','당근':'meadow',
    '사자':'jungle','코끼리':'jungle','원숭이':'jungle','호랑이':'jungle','기린':'jungle',
    '돼지':'meadow','소':'meadow','말':'meadow','돌':'meadow','자전거':'meadow','안경':'meadow','모자':'meadow','피자':'meadow','햄버거':'meadow','빵':'meadow','치즈':'meadow',
  };

  function getTheme(bgText, kwList) {
    const t = (bgText || '').toLowerCase();
    if (t) {
      for (const th of SCENE_THEMES) if (th.re.test(t)) return th;
    }
    for (const kw of (kwList || [])) {
      const typeName = KW_THEME[kw];
      if (typeName) {
        const th = SCENE_THEMES.find(x => x.type === typeName);
        if (th) return th;
      }
    }
    return SCENE_THEMES.find(x => x.type === 'meadow');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. 누끼 — Canvas로 흰 배경 제거
  // ═══════════════════════════════════════════════════════════════════════
  function makeNukkiDataURL(img) {
    const w = img.naturalWidth  || 400;
    const h = img.naturalHeight || 400;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const px = imageData.data;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      if (brightness > 248)       px[i + 3] = 0;
      else if (brightness > 215)  px[i + 3] = Math.round((248 - brightness) / 33 * 220);
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  function loadNukki(drawing) {
    if (!drawing || !drawing.file_path) return Promise.resolve(drawing);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        try { resolve({ ...drawing, nukkiUrl: makeNukkiDataURL(img) }); }
        catch (e) { resolve(drawing); }
      };
      img.onerror = () => resolve(drawing);
      img.src = '/' + drawing.file_path.replace(/^\/+/, '');
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. 배경 이미지
  // ═══════════════════════════════════════════════════════════════════════
  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h) % 999983;
  }

  function buildBgUrl(bgText) {
    if (!bgText) return null;
    const prompt = bgText
      + ', children storybook illustration, watercolor art style, soft pastel colors,'
      + ' magical whimsical background scenery, no characters, no people, no animals, no text';
    return 'https://image.pollinations.ai/prompt/'
      + encodeURIComponent(prompt)
      + '?width=512&height=768&nologo=true&seed=' + hashCode(bgText);
  }

  function bgImgTag(scene, preferBgOnly) {
    let url = null;
    // preferBgOnly=true: 표지처럼 드로잉 오버레이가 별도로 있을 때 merged_image 스킵
    if (!preferBgOnly && scene && scene.merged_image) {
      url = '/' + scene.merged_image;
    } else if (scene && scene.bg_image) {
      url = '/' + scene.bg_image;
    } else if (scene && scene.bg) {
      url = buildBgUrl(scene.bg);
    }
    if (!url) return '';
    return `<img class="scene-bg-img" src="${url}" alt=""
                 onerror="this.style.display='none'"
                 onload="this.style.opacity='1'">`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. 그림 배치 로직
  // ═══════════════════════════════════════════════════════════════════════
  const SKY_KW = new Set(['별', '달', '구름', '무지개', '태양', '나비', '풍선', '새', '비행기', '우주선', '번개', '비']);

  // 텍스트 맥락에서 "땅에 내려온" 하늘 키워드 감지
  const GROUNDED_PHRASES = ['내려왔', '떨어졌', '땅에', '바닥에', '앞에 놓', '손에 들', '품에', '가져', '주웠', '발견했'];
  // 텍스트 맥락에서 "하늘로 올라간" ground 키워드 감지
  const FLOATING_PHRASES = ['하늘로', '공중에', '둥실', '날아', '떠올라', '위로 올라', '하늘 위'];

  function isSky(d, sceneText) {
    if (!d) return false;
    const isSkyKw = SKY_KW.has(d.korean);
    if (!sceneText) return isSkyKw;

    // 하늘 키워드인데 "땅에 내려온" 맥락 → ground로 배치
    if (isSkyKw) {
      for (const sent of sceneText.split(/[.!?。\n]/)) {
        if (!sent.includes(d.korean)) continue;
        if (GROUNDED_PHRASES.some(p => sent.includes(p))) return false;
      }
      return true;
    }
    // ground 키워드인데 "하늘로 올라간" 맥락 → sky로 배치
    for (const sent of sceneText.split(/[.!?。\n]/)) {
      if (!sent.includes(d.korean)) continue;
      if (FLOATING_PHRASES.some(p => sent.includes(p))) return true;
    }
    return false;
  }

  // 수중 장면 감지 (bg 영어 텍스트 기준)
  const UNDERWATER_KEYS = ['underwater','ocean floor','coral','deep sea','submarine','sea bottom','seabed','beneath the sea','under the sea','undersea'];
  function isUnderwater(bgText) {
    const bg = (bgText || '').toLowerCase();
    return UNDERWATER_KEYS.some(k => bg.includes(k));
  }

  // 상상/소원 문맥 감지 — 키워드가 현재 장면에 없지만 꿈꾸는 대상으로 언급되는 경우
  const DREAM_VERBS = ['상상','소원','꿈','꿈꾸','보고 싶','만져보','닿고 싶','갖고 싶','원했','바랐','그리웠'];
  function isDreamContext(kw, sceneText) {
    if (!kw || !sceneText) return false;
    for (const sent of sceneText.split(/[.!?。\n]/)) {
      if (!sent.includes(kw)) continue;
      if (DREAM_VERBS.some(v => sent.includes(v))) return true;
    }
    return false;
  }

  // 스토리 텍스트에서 키워드의 크기/거리/강조 감지
  // 1.5(매우 크게) / 1.2(가까이/강조) / 0.75(작게) / 0.6(멀리) / 1.0(보통)
  const SIZE_BIG   = ['거대한','커다란','엄청나게','크고','크다란','온 하늘','가득','넓게','웅장한','엄청 큰','아주 큰','굉장히 큰','거대하게','우뚝','당당하게','웅장하게'];
  const SIZE_SMALL = ['작은','조그만','조그마한','작고','아담한','아주 작은','귀엽고 작은','조그맣게','미니'];
  // 거리감 — 멀리 있으면 작게, 가까이 있으면 크게
  const DIST_FAR   = ['멀리서','저 멀리','멀리 보이는','저편에','저 멀리서','멀리 떨어진','멀리서 바라','뒤에 숨','구석에'];
  const DIST_NEAR  = ['가까이','바로 앞에','눈앞에','코앞에','다가왔','앞으로 다가','바짝','손에 닿을'];
  // 주인공/클라이맥스 강조 — 주인공 역할이면 크게
  const PROMINENT  = ['주인공','중심에','한가운데','가운데에 서','활짝 펼쳐','용감하게 나','힘차게 달려'];

  function getDrawingScale(kw, sceneText) {
    if (!kw || !sceneText) return 1.0;
    for (const sent of sceneText.split(/[.!?。\n]/)) {
      if (!sent.includes(kw)) continue;
      if (SIZE_BIG.some(w => sent.includes(w)))   return 1.5;
      if (PROMINENT.some(w => sent.includes(w)))  return 1.3;
      if (DIST_NEAR.some(w => sent.includes(w)))  return 1.2;
      if (SIZE_SMALL.some(w => sent.includes(w))) return 0.75;
      if (DIST_FAR.some(w => sent.includes(w)))   return 0.6;
    }
    return 1.0;
  }

  // 알려진 동사/오매칭 패턴 (해당 키워드가 다른 의미로 쓰이는 복합어)
  const BAD_PATTERNS = {
    '달': ['달리', '달래', '달랑', '달갑', '달콤', '달성'],
    '집': ['집합', '집중', '집단', '집결', '집착'],
    '배': ['배우', '배추', '배반'],
    '별': ['별로', '별명', '별나', '별말'],
    '산': ['산책', '산만', '산뜻'],
    '꽃': ['꽃잎', '꽃봉', '꽃길', '꽃망울', '꽃가루'],
    '나무': ['나무라'],
  };

  // 오매칭 패턴 제거 후 키워드 포함 여부 확인
  function containsWord(text, keyword) {
    if (!keyword || !text.includes(keyword)) return false;
    let t = text;
    for (const bad of (BAD_PATTERNS[keyword] || [])) {
      t = t.split(bad).join('▪'); // 나쁜 패턴을 무효 문자로 대체
    }
    return t.includes(keyword);
  }

  function mentioned(sceneText, allDrawings) {
    const t = sceneText || '';
    return allDrawings.filter(d => d.korean && containsWord(t, d.korean));
  }

  function mapToScenes(allDrawings, scenes, count) {
    const result = Array.from({ length: count }, (_, i) => {
      const sceneText = scenes && scenes[i] ? (scenes[i].text || '') : '';
      const hit = mentioned(sceneText, allDrawings);
      if (hit.length >= 2) return { primary: hit[0], secondary: hit[1] };
      if (hit.length === 1) return { primary: hit[0], secondary: null };
      return { primary: null, secondary: null };
    });

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. HTML 빌더 (왼쪽 페이지)
  // ═══════════════════════════════════════════════════════════════════════
  function drawingSrc(d) {
    return d.nukkiUrl || ('/' + d.file_path.replace(/^\/+/, ''));
  }

  function groundStageHTML(d, extraClass, scale = 1.0) {
    const isSub  = extraClass === 'ground-sub' || extraClass === 'ground-pair-r';
    const isPair = extraClass === 'ground-pair-l' || extraClass === 'ground-pair-r';
    const imgCls = isSub ? 'drawing-img sub-img' : 'drawing-img';
    // vh 기반 크기 — 화면 크기에 비례 (scale 수식어 반영)
    // ground-pair-l: 기본 38vh, ground-pair-r/sub: 32vh, 단독: 44vh
    const baseH = isPair
      ? (extraClass === 'ground-pair-l' ? 38 : 32)
      : (isSub ? 32 : 44);
    const h = (baseH * scale).toFixed(1);
    const sizeStyle = `style="max-height:${h}vh"`;
    // ground-pair 클래스는 'ground' 없이 독립 사용 (CSS right:0 충돌 방지)
    const stageClass = isPair
      ? `drawing-stage ${extraClass}`
      : `drawing-stage ground${extraClass ? ' ' + extraClass : ''}`;
    return `<div class="${stageClass}">
      ${drawingImgTag(d, imgCls, sizeStyle)}
      <div class="drawing-shadow${isSub ? ' small' : ''}"></div>
    </div>`;
  }

  function skyStageHTML(d, posClass, scale = 1.0) {
    // sky-right(구석)는 조금 작게, 중앙 sky는 더 크게
    const baseH = (posClass === 'sky-right' || posClass === 'sky-right dream') ? 32 : 30;
    const h = (baseH * scale).toFixed(1);
    const sizeStyle = `style="max-height:${h}vh"`;
    return `<div class="drawing-stage ${posClass || 'sky'}">
      ${drawingImgTag(d, 'drawing-img sky-img', sizeStyle)}
    </div>`;
  }

  // drawingImgTag에 sizeStyle 파라미터 추가
  function drawingImgTag(d, cls, sizeStyle = '') {
    if (!d) return '';
    if (d.file_path) {
      return `<img src="${drawingSrc(d)}" alt="${d.korean || ''}"
                   class="${cls}" ${sizeStyle} onerror="this.style.display='none'">`;
    }
    return `<div class="drawing-emoji-fallback">${d.emoji || '🎨'}</div>`;
  }

  function makeDrawingPageHTML(primary, secondary, scene) {
    const bgText   = scene && scene.bg   ? scene.bg   : '';
    const sceneText = scene && scene.text ? scene.text : '';
    const kwList = [
      ...(primary   ? [primary.korean]   : []),
      ...(secondary ? [secondary.korean] : []),
      ...keywords,
    ];
    const theme = getTheme(bgText, kwList);
    const deco  = DECO_HTML[theme.type] || '';

    // 스토리 텍스트 기반 그림 크기 계산
    const pScale = getDrawingScale(primary   && primary.korean,   sceneText);
    // secondary는 primary 스케일의 85% 상한을 두어 항상 primary보다 작게 유지
    const sScaleRaw = getDrawingScale(secondary && secondary.korean, sceneText);
    const sScale = Math.min(sScaleRaw, pScale * 0.85);

    // 장면 맥락 분석
    const underwater = isUnderwater(bgText);
    // 하늘 그림을 '꿈꾸는 효과'로 보여줄지 결정:
    // 수중 배경이거나, 텍스트에서 상상/소원 문맥으로 언급될 때
    function skyClass(d) {
      if (!isSky(d, sceneText)) return null;
      if (underwater || isDreamContext(d.korean, sceneText)) return 'dream';
      return 'sky';
    }

    let html = `<div class="scene-sky" style="background:${theme.sky};">${bgImgTag(scene, true)}</div>
      ${deco}
      <div class="scene-vignette"></div>`;

    if (!primary && !secondary) {
      // 그림 없음
    } else if (!secondary) {
      const pc = skyClass(primary);
      html += pc ? skyStageHTML(primary, pc, pScale)
                 : groundStageHTML(primary, '', pScale);
    } else {
      const pSkyClass = skyClass(primary);
      const sSkyClass = skyClass(secondary);
      if (!pSkyClass && sSkyClass) {
        html += groundStageHTML(primary, '', pScale) + skyStageHTML(secondary, sSkyClass, sScale);
      } else if (pSkyClass && !sSkyClass) {
        html += groundStageHTML(secondary, '', sScale) + skyStageHTML(primary, pSkyClass, pScale);
      } else if (!pSkyClass && !sSkyClass) {
        // 두 지상 그림 → 나란히 배치 (주인공 왼쪽, 보조 오른쪽)
        html += groundStageHTML(primary, 'ground-pair-l', pScale) + groundStageHTML(secondary, 'ground-pair-r', sScale);
      } else {
        // secondary가 dream 맥락이면 sky-right에도 dream 효과 적용
        const secSkyClass = (sSkyClass === 'dream') ? 'sky-right dream' : 'sky-right';
        html += skyStageHTML(primary, pSkyClass, pScale) + skyStageHTML(secondary, secSkyClass, sScale);
      }
    }
    return html;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. 데이터 파싱
  // ═══════════════════════════════════════════════════════════════════════
  const SD         = JSON.parse(document.getElementById('story-data').textContent);
  const drawings   = SD.drawings   || [];
  const scenes     = SD.scene_data || null;
  const keywords   = SD.keywords   || [];
  const layoutData = SD.layout_data || null;

  let paragraphs = [];
  if (scenes && scenes.length) {
    paragraphs = scenes.map(s => s.text || '').filter(Boolean);
  } else {
    paragraphs = SD.content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length < 2)
      paragraphs = SD.content.split(/\n/).map(p => p.trim()).filter(Boolean);
  }

  const numContent = Math.max(1, paragraphs.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 7. 비동기 초기화
  // ═══════════════════════════════════════════════════════════════════════
  Promise.all(drawings.map(loadNukki)).then(pDrawings => {

    // 배경 프리로드
    if (scenes) {
      let delay = 0;
      scenes.forEach(s => {
        if (s && s.bg && !s.bg_image) {
          const url = buildBgUrl(s.bg);
          setTimeout(() => { const img = new Image(); img.src = url; }, delay);
          delay += 1500;
        }
      });
    }

    // ── 페이지 배열 구성 ────────────────────────────────────────────────
    const pages = [];

    function makeCoverLeftHTML(covScene) {
      const theme = getTheme(covScene ? covScene.bg : '', keywords);
      const deco  = DECO_HTML[theme.type] || '';
      // 표지는 병합된 이미지가 있더라도, 사용자의 그림을 더 크게 강조하기 위해
      // 원본 드로잉(누끼)을 위에 띄우는 방식을 유지하거나, 병합 이미지를 배경으로 씁니다.
      // 여기선 'AI 배경이 아닌 사용자 그림이 메인'이라는 요청에 따라 배경 투명도를 낮추거나 드로잉을 강조합니다.
      
      return `<div class="scene-sky" style="background:${theme.sky}; opacity: 0.6;">${bgImgTag(covScene, true)}</div>
        ${deco}
        <div class="scene-vignette"></div>
        <div class="cover-title-overlay">
          <div class="cover-title-text">${SD.title}</div>
        </div>`;
    }

    function makeCoverRightHTML() {
      return `<div style="display:flex;flex-direction:column;gap:14px;width:100%;">
        <h1 class="book-main-title">${SD.title}</h1>
        <div class="tts-row">
          <button class="tts-play-btn" id="tts-play-btn">
            <span id="tts-play-icon">▶</span>
          </button>
          <span style="font-size:0.9rem;color:#666;">🔊 동화 읽어주기</span>
        </div>
        <div class="keywords-row">
          ${keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
        </div>
        <p class="cover-hint">다음 ▶ 버튼을 눌러 페이지를 넘겨봐요!</p>
      </div>`;
    }

    function makeMoralLeftDrawingsHTML(drawingsList) {
      const bgImgHtml = `<img src="/static/images/sketchbook.png" alt="스케치북" style="position:absolute;inset:0;width:100%;height:100%;object-fit:fill;z-index:1;" onerror="this.style.display='none'">`;
      const list = drawingsList || [];
      const count = list.length;

      if (count === 0) {
        return `<div style="position:relative;width:100%;height:100%;background:linear-gradient(145deg,#fffde7,#fff9c4);border-radius:10px 0 0 10px;overflow:hidden;">${bgImgHtml}</div>`;
      }

      const cols = count === 1 ? 1 : 2;
      const rows = count <= 2 ? 1 : count <= 4 ? 2 : 3;
      const rotations = [-5, 4, -3, 6, -4];

      const items = list.map((d, i) => {
        const rot = rotations[i % rotations.length];
        const dur = (3 + i * 0.5).toFixed(1);
        const del = (i * 0.4).toFixed(1);
        const spansAll = (count % 2 !== 0) && (i === count - 1) && count > 1;
        const gridCol = spansAll ? 'grid-column:1/-1;' : '';
        // overflow:hidden 으로 회전 시 셀 밖으로 삐져나오는 것 방지
        const wrapStyle = `${gridCol}display:flex;align-items:center;justify-content:center;overflow:hidden;animation:float-anim ${dur}s ease-in-out ${del}s infinite;`;

        if (!d.file_path) {
          return `<div style="${wrapStyle}"><span style="font-size:2.5rem;display:block;transform:rotate(${rot}deg);">${d.emoji||'🎨'}</span></div>`;
        }
        const src = d.nukkiUrl || ('/' + d.file_path.replace(/^\/+/, ''));
        // max 70%: 회전(최대 6도) 시에도 셀 안에 완전히 들어오는 크기
        return `<div style="${wrapStyle}">
          <img src="${src}" alt="${d.korean||''}"
            style="max-width:70%;max-height:70%;object-fit:contain;transform:rotate(${rot}deg);filter:drop-shadow(0 3px 10px rgba(0,0,0,0.25));"
            onerror="this.style.display='none'">
        </div>`;
      }).join('');

      return `<div style="position:relative;width:100%;height:100%;background:linear-gradient(145deg,#fffde7,#fff9c4);border-radius:10px 0 0 10px;overflow:hidden;">
        ${bgImgHtml}
        <div style="position:absolute;top:20%;left:8%;right:8%;bottom:18%;z-index:3;overflow:hidden;
                    display:grid;grid-template-columns:repeat(${cols},1fr);
                    grid-template-rows:repeat(${rows},1fr);gap:8px;box-sizing:border-box;">
          ${items}
        </div>
      </div>`;
    }

    function makeMoralAndEndRightHTML() {
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;">
        ${SD.moral
          ? `<div class="moral-big-icon">💡</div>
             <div class="moral-label-text">이야기의 교훈</div>
             <p class="moral-body">${SD.moral}</p>`
          : `<div class="moral-big-icon">📖</div><p class="moral-body">재미있는 이야기였나요?</p>`}
        <div style="width:100%;height:1px;background:#eee;margin:4px 0;"></div>
        <div class="end-actions">
          <a href="/collection" class="btn btn-yellow">✨ 새 동화 만들기</a>
          <a href="/library"    class="btn btn-blue">📚 도서관으로</a>
          <button class="btn btn-white" id="delete-story-btn">🗑️ 삭제</button>
        </div>
      </div>`;
    }

    if (layoutData && layoutData.spreads && layoutData.spreads.length > 0) {
      // 1단계: content 스펙 수집
      const contentItems = [];
      for (const spec of layoutData.spreads) {
        if (spec.type === 'content') {
          const scene = spec.sceneIdx !== undefined && scenes ? scenes[spec.sceneIdx] : null;
          const text  = (scene && scene.text) || paragraphs[spec.textPageNum - 1] || '';
          contentItems.push({ spec, scene, text });
        }
      }

      // 2단계: 그림 배분 계산 (모든 그림 최소 1회 보장)
      const shownIds = new Set();
      const assignments = contentItems.map(({ spec, text }) => {
        let primary   = spec.primaryDrawingId   ? pDrawings.find(d => d.id === spec.primaryDrawingId)   : null;
        let secondary = spec.secondaryDrawingId ? pDrawings.find(d => d.id === spec.secondaryDrawingId) : null;
        if (!primary || !secondary) {
          const hits = mentioned(text, pDrawings);
          const used = new Set([primary && primary.id, secondary && secondary.id].filter(Boolean));
          const extra = hits.filter(d => !used.has(d.id));
          if (!primary   && extra.length > 0) primary   = extra[0];
          else if (!secondary && extra.length > 0) secondary = extra[0];
        }
        if (primary)   shownIds.add(primary.id);
        if (secondary) shownIds.add(secondary.id);
        return { primary, secondary };
      });

      // 3단계: 미노출 그림을 빈 슬롯에 분배
      for (const d of pDrawings.filter(d => !shownIds.has(d.id))) {
        let placed = false;
        for (const a of assignments) {
          if (!a.secondary && (!a.primary || a.primary.id !== d.id)) { // 같은 그림 중복 방지
            a.secondary = d; placed = true; break;
          }
        }
        if (!placed) {
          for (const a of assignments) {
            if (!a.primary) { a.primary = d; break; }
          }
        }
      }

      // 4단계: 페이지 빌드
      let ci = 0;
      for (const spec of layoutData.spreads) {
        if (spec.type === 'cover') {
          const covScene = spec.sceneIdx !== undefined && scenes ? scenes[spec.sceneIdx] : (scenes ? scenes[0] : null);
          pages.push({ leftHTML: makeCoverLeftHTML(covScene), rightInnerHTML: makeCoverRightHTML() });
        } else if (spec.type === 'content') {
          const { scene, text } = contentItems[ci];
          const { primary, secondary } = assignments[ci];
          ci++;
          pages.push({
            leftHTML:       makeDrawingPageHTML(primary, secondary, scene),
            rightInnerHTML: `<p class="story-text">${text}</p>`,
          });
        } else if (spec.type === 'moral') {
          pages.push({ leftHTML: makeMoralLeftDrawingsHTML(pDrawings), rightInnerHTML: makeMoralAndEndRightHTML() });
        }
      }
    } else {
      // 기존 로직 (layout_data 없는 구버전 스토리)
      const assignment = mapToScenes(pDrawings, scenes, numContent);
      const covScene   = scenes && scenes[0] ? scenes[0] : null;
      pages.push({ leftHTML: makeCoverLeftHTML(covScene), rightInnerHTML: makeCoverRightHTML() });

      for (let i = 0; i < numContent; i++) {
        const { primary, secondary } = assignment[i];
        const scene = scenes && scenes[i] ? scenes[i] : null;
        pages.push({
          leftHTML:      makeDrawingPageHTML(primary, secondary, scene),
          rightInnerHTML: `<p class="story-text">${paragraphs[i] || ''}</p>`,
        });
      }

      pages.push({ leftHTML: makeMoralLeftDrawingsHTML(pDrawings), rightInnerHTML: makeMoralAndEndRightHTML() });
    }

    // ── DOM refs ────────────────────────────────────────────────────────
    const leftEl    = document.getElementById('sb-left');
    const contentEl = document.getElementById('sb-content-inner');
    const prevBtn   = document.getElementById('prev-btn');
    const nextBtn   = document.getElementById('next-btn');
    const curPageEl = document.getElementById('current-page');
    const totPageEl = document.getElementById('total-pages');
    const storyId   = document.querySelector('.sb-wrapper')?.dataset.storyId;

    let current = 0;
    totPageEl.textContent = pages.length;

    function renderPage(idx) {
      const page = pages[idx];

      // 페이드 아웃
      leftEl.style.transition    = 'opacity 0.2s';
      contentEl.style.transition = 'opacity 0.2s';
      leftEl.style.opacity    = '0';
      contentEl.style.opacity = '0';

      setTimeout(() => {
        leftEl.innerHTML    = page.leftHTML;
        contentEl.innerHTML = page.rightInnerHTML;
        leftEl.style.opacity    = '1';
        contentEl.style.opacity = '1';
      }, 200);

      curPageEl.textContent = idx + 1;
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === pages.length - 1;
      prevBtn.classList.toggle('disabled', idx === 0);
      nextBtn.classList.toggle('disabled', idx === pages.length - 1);
    }

    renderPage(0);

    prevBtn.addEventListener('click', () => { if (current > 0) renderPage(--current); });
    nextBtn.addEventListener('click', () => { if (current < pages.length - 1) renderPage(++current); });

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' && current < pages.length - 1) renderPage(++current);
      if (e.key === 'ArrowLeft'  && current > 0)                renderPage(--current);
    });

    let touchX = 0;
    const bookEl = document.querySelector('.opened-book-container');
    if (bookEl) {
      bookEl.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
      bookEl.addEventListener('touchend',   e => {
        const dx = e.changedTouches[0].clientX - touchX;
        if (dx < -50 && current < pages.length - 1) renderPage(++current);
        if (dx >  50 && current > 0)                renderPage(--current);
      });
    }

    // ── TTS ─────────────────────────────────────────────────────────────
    const audio = document.getElementById('tts-audio');

    document.addEventListener('click', e => {
      const btn = e.target.closest('#tts-play-btn');
      if (!btn) return;
      const icon = document.getElementById('tts-play-icon');
      if (!icon) return;
      if (audio) {
        if (audio.paused) audio.play(); else audio.pause();
      } else if ('speechSynthesis' in window) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel(); icon.textContent = '▶'; return;
        }
        const utt = new SpeechSynthesisUtterance(SD.title + '. ' + SD.content);
        utt.lang = 'ko-KR'; utt.rate = 0.85; utt.pitch = 1.1;
        utt.onend = () => { icon.textContent = '▶'; };
        icon.textContent = '⏸';
        window.speechSynthesis.speak(utt);
      }
    });

    if (audio) {
      audio.addEventListener('play',  () => { const i = document.getElementById('tts-play-icon'); if (i) i.textContent = '⏸'; });
      audio.addEventListener('pause', () => { const i = document.getElementById('tts-play-icon'); if (i) i.textContent = '▶'; });
      audio.addEventListener('ended', () => { const i = document.getElementById('tts-play-icon'); if (i) i.textContent = '▶'; });
    }

    // ── 삭제 ────────────────────────────────────────────────────────────
    document.addEventListener('click', async e => {
      if (e.target.id !== 'delete-story-btn') return;
      if (!confirm('이 동화를 삭제할까요?')) return;
      try {
        const res  = await fetch(`/api/story/${storyId}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) window.location.href = '/library';
        else alert('삭제 실패: ' + json.error);
      } catch { alert('삭제 중 오류가 발생했어요.'); }
    });

  }); // end Promise.all

})();
