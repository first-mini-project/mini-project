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
    flower:       `<div class="deco fl1"></div><div class="deco fl2"></div><div class="deco fl3"></div>`,
    default:      ``,
  };

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

  function bgImgTag(scene) {
    let url = null;
    if (scene && scene.merged_image) {
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
  const SKY_KW = new Set(['별', '달', '구름', '무지개', '태양', '나비', '풍선']);

  function isSky(d) { return d && SKY_KW.has(d.korean); }

  function mentioned(sceneText, allDrawings) {
    const t = sceneText || '';
    return allDrawings.filter(d => d.korean && t.includes(d.korean));
  }

  function mapToScenes(allDrawings, scenes, count) {
    return Array.from({ length: count }, (_, i) => {
      const sceneText = scenes && scenes[i] ? (scenes[i].text || '') : '';
      const hit = mentioned(sceneText, allDrawings);
      if (hit.length >= 2) return { primary: hit[0], secondary: hit[1] };
      if (hit.length === 1) return { primary: hit[0], secondary: null };
      return { primary: null, secondary: null };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. HTML 빌더 (왼쪽 페이지)
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

  function groundStageHTML(d, extraClass) {
    return `<div class="drawing-stage ground${extraClass ? ' ' + extraClass : ''}">
      ${drawingImgTag(d, 'drawing-img')}
      <div class="drawing-shadow${extraClass ? ' small' : ''}"></div>
    </div>`;
  }

  function skyStageHTML(d, posClass) {
    return `<div class="drawing-stage ${posClass || 'sky'}">
      ${drawingImgTag(d, 'drawing-img sky-img')}
    </div>`;
  }

  function makeDrawingPageHTML(primary, secondary, scene) {
    const bgText = scene && scene.bg ? scene.bg : '';
    const kwList = [
      ...(primary   ? [primary.korean]   : []),
      ...(secondary ? [secondary.korean] : []),
      ...keywords,
    ];
    const theme = getTheme(bgText, kwList);
    const deco  = DECO_HTML[theme.type] || '';

    // 만약 서버에서 병합된 이미지가 있다면, 개별 드로잉 레이어링은 생략합니다.
    const isMerged = !!(scene && scene.merged_image);

    let html = `<div class="scene-sky" style="background:${theme.sky};">${bgImgTag(scene)}</div>
      ${deco}
      <div class="scene-vignette"></div>`;

    if (isMerged) {
        return html; // 이미 병합 이미지에 그림이 포함되어 있음
    }

    if (!primary && !secondary) {
      // 그림 없음
    } else if (!secondary) {
      html += isSky(primary) ? skyStageHTML(primary, 'sky') : groundStageHTML(primary, '');
    } else {
      const pSky = isSky(primary), sSky = isSky(secondary);
      if (!pSky && sSky) {
        html += groundStageHTML(primary, '') + skyStageHTML(secondary, 'sky');
      } else if (pSky && !sSky) {
        html += groundStageHTML(secondary, '') + skyStageHTML(primary, 'sky');
      } else if (!pSky && !sSky) {
        html += groundStageHTML(primary, '') + groundStageHTML(secondary, 'ground-sub');
      } else {
        html += skyStageHTML(primary, 'sky') + skyStageHTML(secondary, 'sky-right');
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

  const numContent = Math.max(drawings.length > 0 ? drawings.length : 1, paragraphs.length);

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

    function makeCoverLeftHTML(covDraw, covScene) {
      const theme = getTheme(covScene ? covScene.bg : '', keywords);
      const deco  = DECO_HTML[theme.type] || '';
      // 표지는 병합된 이미지가 있더라도, 사용자의 그림을 더 크게 강조하기 위해
      // 원본 드로잉(누끼)을 위에 띄우는 방식을 유지하거나, 병합 이미지를 배경으로 씁니다.
      // 여기선 'AI 배경이 아닌 사용자 그림이 메인'이라는 요청에 따라 배경 투명도를 낮추거나 드로잉을 강조합니다.
      
      return `<div class="scene-sky" style="background:${theme.sky}; opacity: 0.6;">${bgImgTag(covScene)}</div>
        ${deco}
        <div class="scene-vignette"></div>
        ${covDraw && covDraw.file_path
          ? `<div class="drawing-stage ground cover-ground scale-up">
               ${drawingImgTag(covDraw, 'drawing-img cover-img')}
               <div class="drawing-shadow"></div>
             </div>`
          : ''}
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

    function makeMoralLeftHTML(spec) {
      if (spec && spec.mergedMoralImage) {
        return `<div class="scene-sky sketchbook">${bgImgTag({merged_image: spec.mergedMoralImage})}</div>
                <div class="scene-vignette"></div>`;
      }
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:14px;
                           padding:28px 20px;height:100%;box-sizing:border-box;
                           background:linear-gradient(145deg,#fffde7,#fff9c4);
                           border-radius:10px 0 0 10px;justify-content:center;">
        ${SD.moral
          ? `<div class="moral-big-icon">💡</div>
             <div class="moral-label-text">이야기의 교훈</div>
             <p class="moral-body">${SD.moral}</p>`
          : `<div class="moral-big-icon">📖</div>
             <p class="moral-body">재미있는 이야기였나요?</p>`}
      </div>`;
    }

    function makeEndRightHTML() {
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;">
        <div class="end-big-icon">🎉</div>
        <h2 class="end-heading">끝!</h2>
        <div class="end-actions">
          <a href="/collection" class="btn btn-yellow">✨ 새 동화 만들기</a>
          <a href="/library"    class="btn btn-blue">📚 도서관으로</a>
          <button class="btn btn-white" id="delete-story-btn">🗑️ 삭제</button>
        </div>
      </div>`;
    }

    if (layoutData && layoutData.spreads && layoutData.spreads.length > 0) {
      for (const spec of layoutData.spreads) {
        if (spec.type === 'cover') {
          const covDraw  = spec.drawingId ? pDrawings.find(d => d.id === spec.drawingId) : null;
          const covScene = spec.sceneIdx !== undefined && scenes ? scenes[spec.sceneIdx] : (scenes ? scenes[0] : null);
          pages.push({ leftHTML: makeCoverLeftHTML(covDraw, covScene), rightInnerHTML: makeCoverRightHTML() });
        } else if (spec.type === 'content') {
          const primary   = spec.primaryDrawingId   ? pDrawings.find(d => d.id === spec.primaryDrawingId)   : null;
          const secondary = spec.secondaryDrawingId ? pDrawings.find(d => d.id === spec.secondaryDrawingId) : null;
          const scene     = spec.sceneIdx !== undefined && scenes ? scenes[spec.sceneIdx] : null;
          const text      = paragraphs[spec.textPageNum - 1] || '';
          pages.push({
            leftHTML:      makeDrawingPageHTML(primary, secondary, scene),
            rightInnerHTML: `<p class="story-text">${text}</p>`,
          });
        } else if (spec.type === 'moral') {
          pages.push({ leftHTML: makeMoralLeftHTML(spec), rightInnerHTML: makeEndRightHTML() });
        }
        // 'end' type은 moral에서 처리됨
      }
    } else {
      // 기존 로직 (layout_data 없는 구버전 스토리)
      const assignment = mapToScenes(pDrawings, scenes, numContent);
      const covScene   = scenes && scenes[0] ? scenes[0] : null;
      const covDraw    = pDrawings[0] || null;

      pages.push({ leftHTML: makeCoverLeftHTML(covDraw, covScene), rightInnerHTML: makeCoverRightHTML() });

      for (let i = 0; i < numContent; i++) {
        const { primary, secondary } = assignment[i];
        const scene = scenes && scenes[i] ? scenes[i] : null;
        pages.push({
          leftHTML:      makeDrawingPageHTML(primary, secondary, scene),
          rightInnerHTML: `<p class="story-text">${paragraphs[i] || ''}</p>`,
        });
      }

      pages.push({ leftHTML: makeMoralLeftHTML(), rightInnerHTML: makeEndRightHTML() });
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
