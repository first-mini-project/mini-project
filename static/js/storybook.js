/**
 * storybook.js — 3D 책 / 누끼 / 장면 배경 / 그림 배치
 */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  // 1. 세계관 테마 시스템
  // ═══════════════════════════════════════════════════════════════════════
  const SCENE_THEMES = [
    { re: /space|planet|galaxy|star.*shine|nebula|cosmic|universe|spaceship|alien/,
      type: 'space',
      sky: 'radial-gradient(ellipse at 40% 20%, #1a1a4e 0%, #0d0d2b 55%, #050510 100%)',
      ground: 'linear-gradient(to bottom, #0a0a20, #050510)' },
    { re: /underwater|ocean|sea|deep.*sea|coral|aqua|mermaid|bubble.*palace|sea.*kingdom/,
      type: 'ocean',
      sky: 'linear-gradient(to bottom, #006994 0%, #004d6e 45%, #002a40 100%)',
      ground: 'linear-gradient(to bottom, #002a40, #001525)' },
    { re: /cloud.*kingdom|cotton.*candy.*cloud|sky.*castle|rainbow.*bridge|fluffy.*cloud|cloud.*palace|sky.*kingdom|above.*cloud/,
      type: 'cloudkingdom',
      sky: 'linear-gradient(to bottom, #74b9ff 0%, #a8d8f0 40%, #e0f4ff 100%)',
      ground: 'linear-gradient(to bottom, #c8e8ff, #d8f0ff)' },
    { re: /forest|enchanted.*tree|magical.*tree|mushroom.*village|fairy.*forest|glowing.*mushroom|tree.*house|ancient.*forest/,
      type: 'forest',
      sky: 'linear-gradient(to bottom, #0d3d0d 0%, #1a6e1a 40%, #228b22 100%)',
      ground: 'linear-gradient(to bottom, #0a3d0a, #072d07)' },
    { re: /snow|ice.*palace|aurora|frozen|polar|ice.*castle|snowflake|icy/,
      type: 'ice',
      sky: 'linear-gradient(to bottom, #1a3a5c 0%, #2d6699 40%, #87b5d9 100%)',
      ground: 'linear-gradient(to bottom, #a8cce0, #c0ddf0)' },
    { re: /lava|volcano|fire.*dragon|flame.*island|magma|hot.*lava|erupting/,
      type: 'volcano',
      sky: 'linear-gradient(to bottom, #1a0800 0%, #4a1400 35%, #8b2800 70%, #b84400 100%)',
      ground: 'linear-gradient(to bottom, #8b2000, #6a1800)' },
    { re: /circus|sparkling.*tent|acrobat|performer|ringmaster|magic.*circus|big.*top/,
      type: 'circus',
      sky: 'linear-gradient(135deg, #1a0033 0%, #33006b 35%, #660099 65%, #9900cc 100%)',
      ground: 'linear-gradient(to bottom, #4d0080, #33005c)' },
    { re: /castle|magic.*library|tower.*castle|knight.*castle|dragon.*castle|enchanted.*castle|stone.*castle/,
      type: 'castle',
      sky: 'linear-gradient(to bottom, #0d001a 0%, #2d0050 45%, #4a0080 100%)',
      ground: 'linear-gradient(to bottom, #1a0033, #0d001a)' },
    { re: /candy|chocolate.*river|marshmallow|cookie.*road|sweet.*land|candy.*land|sugar/,
      type: 'candy',
      sky: 'linear-gradient(135deg, #ff6eb4 0%, #ff9ecc 35%, #ffcce6 65%, #fff0f8 100%)',
      ground: 'linear-gradient(to bottom, #ff80c0, #ff60aa)' },
    { re: /moon.*rabbit|moonlight.*meadow|silver.*river|moon.*village|lunar.*surface|moon.*crater/,
      type: 'moon',
      sky: 'radial-gradient(ellipse at 30% 15%, #0f0f33 0%, #1a1a4e 50%, #080820 100%)',
      ground: 'linear-gradient(to bottom, #0a0a2e, #06061e)' },
    { re: /pirate|treasure.*island|tropical.*island|hidden.*cave|sailing.*ship|treasure.*cave/,
      type: 'pirate',
      sky: 'linear-gradient(to bottom, #0077b6 0%, #0096c7 35%, #00b4d8 70%, #48cae4 100%)',
      ground: 'linear-gradient(to bottom, #c8a44a, #a07828)' },
    { re: /flower|spring.*petal|petal.*carpet|butterfly.*carriage|blossom|spring.*blooming|floral/,
      type: 'flower',
      sky: 'linear-gradient(to bottom, #87ceeb 0%, #c8eeff 40%, #e8f5ff 100%)',
      ground: 'linear-gradient(to bottom, #ff85a1, #e06080)' },
    { re: /amusement|carousel|magic.*roller|mirror.*maze|funfair|roller.*coaster|spinning/,
      type: 'amusement',
      sky: 'linear-gradient(135deg, #1a003d 0%, #33007a 40%, #6600cc 80%, #9933ff 100%)',
      ground: 'linear-gradient(to bottom, #4d0099, #330066)' },
    { re: /jungle|prehistoric|ancient.*ruin|dinosaur|tropical.*jungle|giant.*jungle|wild.*dinosaur/,
      type: 'jungle',
      sky: 'linear-gradient(to bottom, #1a4d1a 0%, #2d7a2d 40%, #3d8a3d 100%)',
      ground: 'linear-gradient(to bottom, #1a5c1a, #0f3d0f)' },
    { re: /meadow|sunny.*village|cheerful.*village|village.*square|festival|spring.*village|green.*field/,
      type: 'meadow',
      sky: 'linear-gradient(to bottom, #4facfe 0%, #87ceeb 45%, #b8e4ff 100%)',
      ground: 'linear-gradient(to bottom, #5cb85c, #3a8a3a)' },
  ];

  const DECO_HTML = {
    space:        `<div class="deco s1"></div><div class="deco s2"></div><div class="deco s3"></div><div class="deco s4"></div><div class="deco s5"></div>`,
    moon:         `<div class="deco s1"></div><div class="deco s2"></div><div class="deco s3"></div><div class="deco moon-orb"></div>`,
    ocean:        `<div class="deco b1"></div><div class="deco b2"></div><div class="deco b3"></div><div class="deco wave-deco"></div>`,
    cloudkingdom: `<div class="deco c1"></div><div class="deco c2"></div><div class="deco c3"></div>`,
    ice:          `<div class="deco snow1"></div><div class="deco snow2"></div><div class="deco snow3"></div><div class="deco aurora-line"></div>`,
    circus:       `<div class="deco sp1"></div><div class="deco sp2"></div><div class="deco sp3"></div><div class="deco sp4"></div>`,
    flower:       `<div class="deco fl1"></div><div class="deco fl2"></div><div class="deco fl3"></div>`,
    meadow:       `<div class="deco c1 small"></div>`,
    castle:       `<div class="deco s1"></div><div class="deco s2"></div>`,
    volcano:      `<div class="deco ember1"></div><div class="deco ember2"></div><div class="deco ember3"></div>`,
    default:      ``,
  };

  // 한국어 키워드 → 테마 매핑 (bg 텍스트로 판별 실패 시 폴백)
  const KW_THEME = {
    '별':'space','달':'moon','우주':'space',
    '바다':'ocean','물고기':'ocean','펭귄':'ice',
    '나무':'forest','숲':'forest','곰':'forest',
    '꽃':'flower','나비':'flower','딸기':'flower',
    '구름':'cloudkingdom',
    '하늘':'meadow','무지개':'meadow','태양':'meadow',
    '산':'meadow','기차':'meadow','자동차':'meadow',
    '집':'meadow','토끼':'meadow','고양이':'meadow',
    '강아지':'meadow','풍선':'meadow',
    '눈':'ice',
    '성':'castle','왕관':'castle','마법지팡이':'castle',
    '케이크':'candy','아이스크림':'candy',
    '사과':'meadow','수박':'meadow','바나나':'jungle',
    '포도':'meadow','당근':'meadow',
    '사자':'jungle','코끼리':'jungle','원숭이':'jungle',
  };

  function getTheme(bgText, kwList) {
    const t = (bgText || '').toLowerCase();
    if (t) {
      for (const th of SCENE_THEMES) {
        if (th.re.test(t)) return th;
      }
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
      // 흰색/밝은 회색 → 투명
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      if (brightness > 248) {
        px[i + 3] = 0;           // 완전 투명
      } else if (brightness > 215) {
        // 안티앨리어싱 영역: 부드럽게 페이드
        px[i + 3] = Math.round((248 - brightness) / 33 * 220);
      }
      // else: 유채색 → 그대로
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  function loadNukki(drawing) {
    if (!drawing || !drawing.file_path) return Promise.resolve(drawing);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        try {
          resolve({ ...drawing, nukkiUrl: makeNukkiDataURL(img) });
        } catch (e) {
          console.warn('[nukki] canvas failed for', drawing.korean, e);
          resolve(drawing);
        }
      };
      img.onerror = () => resolve(drawing);
      img.src = '/' + drawing.file_path.replace(/^\/+/, '');
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. 배경 이미지 생성 — Pollinations.ai (무료, API 키 불필요)
  // ═══════════════════════════════════════════════════════════════════════
  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h) % 999983;
  }

  function buildBgUrl(bgText) {
    if (!bgText) return null;
    // 스토리북 배경 장면 이미지 — 캐릭터 없이 배경만
    const prompt = bgText
      + ', children storybook illustration, watercolor art style, soft pastel colors,'
      + ' magical whimsical background scenery, no characters, no people, no animals, no text';
    return 'https://image.pollinations.ai/prompt/'
      + encodeURIComponent(prompt)
      + '?width=512&height=768&nologo=true&seed=' + hashCode(bgText);
  }

  // scene-sky div 안에 넣을 배경 이미지 태그
  // scene.bg_image(서버 사전 생성) 우선 → 없으면 Pollinations.ai fallback
  function bgImgTag(scene) {
    let url = null;
    if (scene && scene.bg_image) {
      // 서버에서 HF SDXL로 미리 생성한 이미지 (로컬 파일)
      url = '/' + scene.bg_image;
    } else if (scene && scene.bg) {
      // fallback: Pollinations.ai (브라우저에서 직접 요청)
      url = buildBgUrl(scene.bg);
    }
    if (!url) return '';
    return `<img class="scene-bg-img" src="${url}" alt=""
                 onerror="this.style.display='none'"
                 onload="this.style.opacity='1'">`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. 그림 배치 로직 — 하늘/지상 분류 & 장면 매핑
  // ═══════════════════════════════════════════════════════════════════════
  const SKY_KW = new Set(['별', '달', '구름', '무지개', '태양', '나비', '풍선']);

  function isSky(d) { return d && SKY_KW.has(d.korean); }

  // 장면 텍스트에서 언급된 그림 순서대로 반환
  function mentioned(sceneText, allDrawings) {
    const t = sceneText || '';
    return allDrawings.filter(d => d.korean && t.includes(d.korean));
  }

  // 각 장면에 배치할 {primary, secondary} 결정
  // 텍스트에 언급된 그림만 표시 — 언급 없으면 null
  function mapToScenes(allDrawings, scenes, count) {
    return Array.from({ length: count }, (_, i) => {
      const sceneText = scenes && scenes[i] ? (scenes[i].text || '') : '';
      const hit = mentioned(sceneText, allDrawings);

      if (hit.length >= 2) {
        return { primary: hit[0], secondary: hit[1] };
      } else if (hit.length === 1) {
        return { primary: hit[0], secondary: null };
      } else {
        // 언급 없음 → 그림 없이 배경만 표시
        return { primary: null, secondary: null };
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. HTML 빌더
  // ═══════════════════════════════════════════════════════════════════════
  function drawingSrc(d) {
    return d.nukkiUrl || ('/' + d.file_path.replace(/^\/+/, ''));
  }

  function drawingImgTag(d, cls) {
    if (!d) return '';
    if (d.file_path) {
      return `<img src="${drawingSrc(d)}" alt="${d.korean || ''}"
                   class="${cls}" onerror="this.style.display='none'">`;
    }
    return `<div class="drawing-emoji-fallback">${d.emoji || '🎨'}</div>`;
  }

  function badge(d, small) {
    return `<div class="drawing-word-badge${small ? ' small' : ''}">
              ${d.emoji || ''} ${d.korean || ''}</div>`;
  }

  function groundStageHTML(d, extraClass) {
    return `
      <div class="drawing-stage ground${extraClass ? ' ' + extraClass : ''}">
        ${drawingImgTag(d, 'drawing-img')}
        <div class="drawing-shadow${extraClass ? ' small' : ''}"></div>
      </div>`;
  }

  function skyStageHTML(d, posClass) {
    return `
      <div class="drawing-stage ${posClass || 'sky'}">
        ${drawingImgTag(d, 'drawing-img sky-img')}
      </div>`;
  }

  // 장면 페이지 (왼쪽) 생성
  function makeDrawingPageHTML(primary, secondary, scene) {
    const bgText = scene && scene.bg ? scene.bg : '';
    const kwList = [
      ...(primary   ? [primary.korean]   : []),
      ...(secondary ? [secondary.korean] : []),
      ...keywords,
    ];
    const theme = getTheme(bgText, kwList);
    const deco  = DECO_HTML[theme.type] || '';

    let pageHTML = `
      <div class="scene-sky" style="background:${theme.sky};">${bgImgTag(scene)}</div>
      ${deco}
      <div class="scene-vignette"></div>`;

    if (!primary && !secondary) {
      // 그림 없음
    } else if (!secondary) {
      // 그림 하나
      pageHTML += isSky(primary) ? skyStageHTML(primary, 'sky') : groundStageHTML(primary, '');
    } else {
      const pSky = isSky(primary);
      const sSky = isSky(secondary);

      if (!pSky && sSky) {
        // ground + sky
        pageHTML += groundStageHTML(primary, '');
        pageHTML += skyStageHTML(secondary, 'sky');
      } else if (pSky && !sSky) {
        // sky + ground
        pageHTML += groundStageHTML(secondary, '');
        pageHTML += skyStageHTML(primary, 'sky');
      } else if (!pSky && !sSky) {
        // 둘 다 ground: primary 중앙(크게), secondary 오른쪽(작게)
        pageHTML += groundStageHTML(primary, '');
        pageHTML += groundStageHTML(secondary, 'ground-sub');
      } else {
        // 둘 다 sky: 왼쪽위 / 오른쪽위
        pageHTML += skyStageHTML(primary, 'sky');
        pageHTML += skyStageHTML(secondary, 'sky-right');
      }
    }

    return pageHTML;
  }

  // 텍스트 페이지 (오른쪽) 생성
  function makeTextPageHTML(text, pageNum) {
    return `
      <div class="text-page b-page"
           style="position:relative;width:100%;height:100%;border-radius:inherit;">
        <p class="page-paragraph">${text}</p>
        <div class="page-num">${pageNum}</div>
      </div>`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. 데이터 파싱
  // ═══════════════════════════════════════════════════════════════════════
  const SD         = JSON.parse(document.getElementById('story-data').textContent);
  const drawings   = SD.drawings  || [];
  const scenes     = SD.scene_data || null;
  const keywords   = SD.keywords  || [];
  const layoutData = SD.layout_data || null;    // ← 새 필드

  let paragraphs = [];
  if (scenes && scenes.length) {
    paragraphs = scenes.map(s => s.text || '').filter(Boolean);
  } else {
    paragraphs = SD.content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length < 2)
      paragraphs = SD.content.split(/\n/).map(p => p.trim()).filter(Boolean);
  }

  const numContent = Math.max(drawings.length > 0 ? drawings.length : 1, paragraphs.length);

  // ═══════════════════════════════════════════════════════════════════════
  // 7. 비동기 초기화 — 누끼 → 배경 프리로드 → 스프레드 빌드 → 렌더
  // ═══════════════════════════════════════════════════════════════════════
  Promise.all(drawings.map(loadNukki)).then(pDrawings => {

    // bg_image 없는 장면만 Pollinations.ai로 프리로드 (1.5초 간격, rate limit 방지)
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

    // ── 스프레드 배열 구성 ──────────────────────────────────────────────
    const spreads = [];
    
    // layout_data가 있으면 (새 동화) 그것을 사용, 없으면 기존 로직 사용
    if (layoutData && layoutData.spreads && layoutData.spreads.length > 0) {
      // 🎯 layout_data 사용 — 완벽한 재현
      const layoutSpread = layoutData.spreads;
      
      for (const spec of layoutSpread) {
        if (spec.type === 'cover') {
          // 표지
          const covDraw = spec.drawingId ? pDrawings.find(d => d.id === spec.drawingId) : null;
          const covScene = spec.sceneIdx !== undefined && scenes ? scenes[spec.sceneIdx] : (scenes ? scenes[0] : null);
          const covTheme = getTheme(covScene ? covScene.bg : '', keywords);
          const covDeco = DECO_HTML[covTheme.type] || '';
          
          const coverLeftHTML = `
            <div class="scene-sky" style="background:${covTheme.sky};">${bgImgTag(covScene)}</div>
            ${covDeco}
            <div class="scene-vignette"></div>
            ${covDraw && covDraw.file_path
              ? `<div class="drawing-stage ground cover-ground">
                   ${drawingImgTag(covDraw, 'drawing-img cover-img')}
                   <div class="drawing-shadow"></div>
                 </div>`
              : ''}
            <div class="cover-title-overlay">
              <div class="cover-title-text">${SD.title}</div>
            </div>`;
          
          const coverRightHTML = `
            <div class="cover-text-page b-page"
                 style="width:100%;height:100%;border-radius:inherit;position:relative;
                        box-sizing:border-box;display:flex;flex-direction:column;
                        align-items:flex-start;justify-content:center;gap:16px;
                        padding:36px 28px;background:#fffef9;">
              <h1 class="book-main-title">${SD.title}</h1>
              <div class="tts-row">
                <button class="tts-play-btn" id="tts-play-btn" title="읽어주기">
                  <span id="tts-play-icon">▶</span>
                </button>
                <span style="font-size:0.9rem;color:#666;">🔊 동화 읽어주기</span>
              </div>
              <div class="keywords-row">
                ${keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
              </div>
              <p class="cover-hint">▶ 버튼을 눌러 페이지를 넘겨봐요!</p>
            </div>`;
          
          spreads.push({ leftHTML: coverLeftHTML, rightHTML: coverRightHTML });
        }
        else if (spec.type === 'content') {
          // 콘텐츠 스프레드
          const primary   = spec.primaryDrawingId   ? pDrawings.find(d => d.id === spec.primaryDrawingId)   : null;
          const secondary = spec.secondaryDrawingId ? pDrawings.find(d => d.id === spec.secondaryDrawingId) : null;
          const scene = spec.sceneIdx !== undefined && scenes ? scenes[spec.sceneIdx] : null;
          
          spreads.push({
            leftHTML:  makeDrawingPageHTML(primary, secondary, scene),
            rightHTML: makeTextPageHTML(paragraphs[spec.textPageNum - 1] || '', spec.textPageNum),
          });
        }
        else if (spec.type === 'moral') {
          // 교훈 페이지
          const moralHTML = SD.moral
            ? `<div class="moral-big-icon">💡</div>
               <div class="moral-label-text">이야기의 교훈</div>
               <p class="moral-body">${SD.moral}</p>`
            : `<div class="moral-big-icon">📖</div>
               <p class="moral-body">재미있는 이야기였나요?</p>`;
          
          spreads.push({
            leftHTML: `<div class="moral-page b-page"
                            style="width:100%;height:100%;border-radius:inherit;position:relative;
                                   box-sizing:border-box;display:flex;flex-direction:column;
                                   align-items:center;justify-content:center;gap:14px;
                                   background:linear-gradient(145deg,#fffde7,#fff9c4);padding:28px 20px;">
                         ${moralHTML}</div>`,
            rightHTML: `<div class="end-page b-page"
                             style="width:100%;height:100%;border-radius:inherit;position:relative;
                                    box-sizing:border-box;display:flex;flex-direction:column;
                                    align-items:center;justify-content:center;gap:16px;
                                    background:#fffef9;padding:28px 20px;">
                          <div class="end-big-icon">🎉</div>
                          <h2 class="end-heading">끝!</h2>
                          <div class="end-actions">
                            <a href="/collection" class="btn btn-yellow btn-big">✨ 새 동화 만들기</a>
                            <a href="/library"    class="btn btn-blue">📚 도서관으로</a>
                            <button class="btn btn-white" id="delete-story-btn">🗑️ 삭제</button>
                          </div>
                        </div>`
          });
        }
        else if (spec.type === 'end') {
          // 이미 moral에서 처리됨
        }
      }
    } else {
      // 기존 로직 (layout_data 없는 경우)
      const assignment = mapToScenes(pDrawings, scenes, numContent);

      // [0] 표지
      const covScene = scenes && scenes[0] ? scenes[0] : null;
      const covTheme = getTheme(covScene ? covScene.bg : '', keywords);
      const covDeco  = DECO_HTML[covTheme.type] || '';
      const covDraw  = pDrawings[0] || null;

      const coverLeftHTML = `
        <div class="scene-sky" style="background:${covTheme.sky};">${bgImgTag(covScene)}</div>
        ${covDeco}
        <div class="scene-vignette"></div>
        ${covDraw && covDraw.file_path
          ? `<div class="drawing-stage ground cover-ground">
               ${drawingImgTag(covDraw, 'drawing-img cover-img')}
               <div class="drawing-shadow"></div>
             </div>`
          : ''}
        <div class="cover-title-overlay">
          <div class="cover-title-text">${SD.title}</div>
        </div>`;

      const coverRightHTML = `
        <div class="cover-text-page b-page"
             style="width:100%;height:100%;border-radius:inherit;position:relative;
                    box-sizing:border-box;display:flex;flex-direction:column;
                    align-items:flex-start;justify-content:center;gap:16px;
                    padding:36px 28px;background:#fffef9;">
          <h1 class="book-main-title">${SD.title}</h1>
          <div class="tts-row">
            <button class="tts-play-btn" id="tts-play-btn" title="읽어주기">
              <span id="tts-play-icon">▶</span>
            </button>
            <span style="font-size:0.9rem;color:#666;">🔊 동화 읽어주기</span>
          </div>
          <div class="keywords-row">
            ${keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
          </div>
          <p class="cover-hint">▶ 버튼을 눌러 페이지를 넘겨봐요!</p>
        </div>`;

      spreads.push({ leftHTML: coverLeftHTML, rightHTML: coverRightHTML });

      // [1..N] 동화 내용 스프레드
      for (let i = 0; i < numContent; i++) {
        const { primary, secondary } = assignment[i];
        const scene = scenes && scenes[i] ? scenes[i] : null;
        spreads.push({
          leftHTML:  makeDrawingPageHTML(primary, secondary, scene),
          rightHTML: makeTextPageHTML(paragraphs[i] || '', i + 1),
        });
      }

      // [마지막] 교훈 + 종료
      const moralHTML = SD.moral
        ? `<div class="moral-big-icon">💡</div>
           <div class="moral-label-text">이야기의 교훈</div>
           <p class="moral-body">${SD.moral}</p>`
        : `<div class="moral-big-icon">📖</div>
           <p class="moral-body">재미있는 이야기였나요?</p>`;

      spreads.push({
        leftHTML: `<div class="moral-page b-page"
                        style="width:100%;height:100%;border-radius:inherit;position:relative;
                               box-sizing:border-box;display:flex;flex-direction:column;
                               align-items:center;justify-content:center;gap:14px;
                               background:linear-gradient(145deg,#fffde7,#fff9c4);padding:28px 20px;">
                     ${moralHTML}</div>`,
        rightHTML: `<div class="end-page b-page"
                         style="width:100%;height:100%;border-radius:inherit;position:relative;
                                box-sizing:border-box;display:flex;flex-direction:column;
                                align-items:center;justify-content:center;gap:16px;
                                background:#fffef9;padding:28px 20px;">
                      <div class="end-big-icon">🎉</div>
                      <h2 class="end-heading">끝!</h2>
                      <div class="end-actions">
                        <a href="/collection" class="btn btn-yellow btn-big">✨ 새 동화 만들기</a>
                        <a href="/library"    class="btn btn-blue">📚 도서관으로</a>
                        <button class="btn btn-white" id="delete-story-btn">🗑️ 삭제</button>
                      </div>
                    </div>`,
      });
    }

    // ── DOM 참조 & 상태 ──────────────────────────────────────────────────
    const staticLeft = document.getElementById('b-static-left');
    const underRight = document.getElementById('b-under-right');
    const flipCard   = document.getElementById('b-flip-card');
    const flipFront  = document.getElementById('b-flip-front');
    const flipBack   = document.getElementById('b-flip-back');
    const prevBtn    = document.getElementById('prev-btn');
    const nextBtn    = document.getElementById('next-btn');
    const curPageEl  = document.getElementById('current-page');
    const totPageEl  = document.getElementById('total-pages');
    const dotsEl     = document.getElementById('page-dots');

    let current   = 0;
    let animating = false;
    const FLIP_MS = 700;

    totPageEl.textContent = spreads.length;

    // 점 인디케이터
    spreads.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'page-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => {
        if (!animating && i !== current) i > current ? goNext(i) : goPrev(i);
      });
      dotsEl.appendChild(dot);
    });

    function setContent(el, html) { el.innerHTML = html; }

    function resetFlipCardRight(idx) {
      flipCard.classList.add('no-transition');
      flipCard.style.left            = 'auto';
      flipCard.style.right           = '0';
      flipCard.style.transformOrigin = 'left center';
      flipCard.style.transform       = 'rotateY(0deg)';
      flipCard.classList.remove('flipping');
      setContent(flipFront, spreads[idx].rightHTML);
      setContent(flipBack, '');
      void flipCard.offsetWidth;
      flipCard.classList.remove('no-transition');
    }

    function renderSpread(idx) {
      setContent(staticLeft, spreads[idx].leftHTML);
      setContent(underRight, '');
      resetFlipCardRight(idx);
    }

    function updateNav() {
      curPageEl.textContent = current + 1;
      prevBtn.disabled      = current === 0;
      nextBtn.disabled      = current === spreads.length - 1;
      dotsEl.querySelectorAll('.page-dot').forEach((d, i) =>
        d.classList.toggle('active', i === current));
    }

    renderSpread(0);
    updateNav();

    // ── 다음 페이지 ────────────────────────────────────────────────────
    function goNext(targetIdx) {
      if (animating) return;
      const next = targetIdx !== undefined ? targetIdx : current + 1;
      if (next >= spreads.length) return;
      animating = true;

      setContent(flipFront,  spreads[current].rightHTML);
      setContent(flipBack,   spreads[next].leftHTML);
      setContent(underRight, spreads[next].rightHTML);

      flipCard.style.left            = 'auto';
      flipCard.style.right           = '0';
      flipCard.style.transformOrigin = 'left center';

      flipCard.classList.add('no-transition');
      flipCard.style.transform = 'rotateY(0deg)';
      void flipCard.offsetWidth;
      flipCard.classList.remove('no-transition');

      flipCard.style.transition = `transform ${FLIP_MS}ms cubic-bezier(0.645,0.045,0.355,1)`;
      flipCard.classList.add('flipping');
      flipCard.style.transform  = 'rotateY(-180deg)';

      setTimeout(() => {
        current = next;
        setContent(staticLeft, spreads[current].leftHTML);
        resetFlipCardRight(current);
        setContent(underRight, '');
        updateNav();
        animating = false;
      }, FLIP_MS + 30);
    }

    // ── 이전 페이지 ────────────────────────────────────────────────────
    function goPrev(targetIdx) {
      if (animating) return;
      const prev = targetIdx !== undefined ? targetIdx : current - 1;
      if (prev < 0) return;
      animating = true;

      flipCard.classList.add('no-transition');
      flipCard.style.right           = 'auto';
      flipCard.style.left            = '0';
      flipCard.style.transformOrigin = 'right center';

      setContent(flipFront,  spreads[current].leftHTML);
      setContent(flipBack,   spreads[prev].rightHTML);
      setContent(staticLeft, spreads[prev].leftHTML);
      setContent(underRight, spreads[current].rightHTML);

      flipCard.style.transform = 'rotateY(0deg)';
      void flipCard.offsetWidth;
      flipCard.classList.remove('no-transition');

      flipCard.style.transition = `transform ${FLIP_MS}ms cubic-bezier(0.645,0.045,0.355,1)`;
      flipCard.classList.add('flipping');
      flipCard.style.transform  = 'rotateY(180deg)';

      setTimeout(() => {
        current = prev;
        setContent(staticLeft, spreads[current].leftHTML);
        resetFlipCardRight(current);
        setContent(underRight, '');
        updateNav();
        animating = false;
      }, FLIP_MS + 30);
    }

    // 버튼 / 키보드 / 터치
    nextBtn.addEventListener('click', () => goNext());
    prevBtn.addEventListener('click', () => goPrev());
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
    });
    let touchX = 0;
    const sc = document.getElementById('book-spread-container');
    sc.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    sc.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (dx < -50) goNext();
      if (dx >  50) goPrev();
    });

    // ── TTS ────────────────────────────────────────────────────────────
    const audio   = document.getElementById('tts-audio');
    const storyId = document.querySelector('.book-wrapper')?.dataset.storyId;

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
      audio.addEventListener('canplaythrough', () => { audio.play().catch(() => {}); });
      audio.addEventListener('play',  () => { const i = document.getElementById('tts-play-icon'); if (i) i.textContent = '⏸'; });
      audio.addEventListener('pause', () => { const i = document.getElementById('tts-play-icon'); if (i) i.textContent = '▶'; });
      audio.addEventListener('ended', () => { const i = document.getElementById('tts-play-icon'); if (i) i.textContent = '▶'; });
    }

    // ── 동화 삭제 ──────────────────────────────────────────────────────
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

    // 라이브러리 카드 삭제
    document.querySelectorAll('.story-card-delete').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        const id = btn.dataset.storyId;
        if (!confirm('이 동화를 삭제할까요?')) return;
        try {
          const res  = await fetch(`/api/story/${id}`, { method: 'DELETE' });
          const json = await res.json();
          if (json.success) {
            const card = btn.closest('.story-card');
            card.style.transition = 'all 0.3s';
            card.style.opacity    = '0';
            card.style.transform  = 'scale(0.8)';
            setTimeout(() => card.remove(), 300);
          }
        } catch { alert('삭제 중 오류가 발생했어요.'); }
      });
    });

  }); // end Promise.all

})();
