/**
 * collection.js - 그림 모음장 선택 & 동화 생성
 * 🌊 둥실둥실 모드: 물리 기반 플로팅 (기본)
 * 📋 도감 보기: 일반 그리드
 */
(function () {
  const MAX = 5, MIN = 1;
  let selected  = new Set();
  let floatMode = true;

  const counter = document.getElementById('selection-counter');
  const makeBtn = document.getElementById('make-story-btn');
  const loading = document.getElementById('loading-overlay');
  const grid    = document.querySelector('.drawings-grid');
  if (!grid) return;

  const origCards = Array.from(grid.querySelectorAll('.drawing-card'));
  if (!origCards.length) return;

  // ─── 물리 상수 ─────────────────────────────────────────────────
  const CARD_W      = 160;
  const CARD_H      = 205;
  const RADIUS      = 70;    // 충돌 반지름
  const SPEED       = 0.7;   // 기본 속도 (느리게)
  const MAX_SPEED   = 1.8;   // 최대 속도
  const DAMP        = 0.999; // 감속 계수
  const REPEL_R     = 220;   // 호버 반발 영향 범위 (px)
  const REPEL_F     = 1.0;   // 호버 반발력 강도

  // ─── 플로팅 오버레이 ────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'float-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0',
    pointerEvents: 'none', zIndex: '10', overflow: 'hidden',
  });
  document.body.appendChild(overlay);

  // ─── 경계 계산 ─────────────────────────────────────────────────
  function getBounds() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const footer = document.querySelector('.collection-footer');

    // 카드 영역 상단: subtitle <p> 아래
    const subtitle = document.querySelector('.collection-page > p');
    const topY = subtitle
      ? subtitle.getBoundingClientRect().bottom + 10
      : 160;

    // footer는 fixed → offsetHeight
    const footerH = footer ? footer.offsetHeight : 70;
    const bottomY = H - footerH - 8;

    if (bottomY - topY < 150) return { top: topY, bottom: H - 70, left: 8, right: W - 8 };
    return { top: topY, bottom: bottomY, left: 8, right: W - 8 };
  }

  // ─── 물리 카드 생성 ─────────────────────────────────────────────
  const physCards = origCards.map(orig => {
    const el = orig.cloneNode(true);

    // ★ fade-in 애니메이션 제거 (fadeIn 키프레임이 transform을 덮어쓰는 버그 방지)
    el.classList.remove('fade-in');
    el.style.animation = 'none';

    Object.assign(el.style, {
      position: 'absolute', left: '0', top: '0',
      width: CARD_W + 'px', boxSizing: 'border-box', // 패딩/보더 포함 정확히 CARD_W
      margin: '0', cursor: 'pointer', pointerEvents: 'auto',
      opacity: '0',
      transformOrigin: 'center center',
      willChange: 'transform',
      transition: 'box-shadow 0.15s ease, border-color 0.2s, opacity 0.3s ease',
    });
    overlay.appendChild(el);

    const state = {
      el, id: orig.dataset.id,
      x: 0, y: 0, vx: 0, vy: 0,
      hovered: false, ready: false,
      dragging: false, dragOffsetX: 0, dragOffsetY: 0, wasJustDragged: false,
    };
    el.addEventListener('click',      () => {
      if (state.wasJustDragged) { state.wasJustDragged = false; return; }
      if (floatMode) toggle(state.id);
    });
    el.addEventListener('mouseenter', () => { if (!state.dragging) state.hovered = true;  });
    el.addEventListener('mouseleave', () => { if (!state.dragging) state.hovered = false; });
    el.addEventListener('mousedown',  (e) => {
      if (e.button !== 0 || !floatMode || !state.ready) return;
      e.preventDefault();
      dragStart(state, e.clientX, e.clientY);
    });
    return state;
  });

  // 원본 카드 클릭 (도감 모드)
  origCards.forEach(card => {
    card.addEventListener('click', () => { if (!floatMode) toggle(card.dataset.id); });
  });

  // ─── 삭제 핸들러 ────────────────────────────────────────────────
  async function deleteDrawing(id) {
    if (!confirm('이 그림을 삭제할까요?')) return;
    try {
      const res = await fetch(`/api/drawings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        // 도감 카드 제거
        const origCard = origCards.find(c => c.dataset.id === String(id));
        if (origCard) origCard.remove();
        // 둥실둥실 카드 제거
        const physState = physCards.find(s => s.id === String(id));
        if (physState) physState.el.remove();
        selected.delete(String(id));
        updateUI();
      } else {
        alert('삭제 중 오류가 발생했어요.');
      }
    } catch {
      alert('삭제 중 오류가 발생했어요.');
    }
  }

  // 도감 모드 액션 버튼 (수정 + 삭제)
  origCards.forEach(card => {
    card.querySelectorAll('.card-action-btn').forEach(btn => {
      btn.addEventListener('click', e => e.stopPropagation());
    });
    const delBtn = card.querySelector('.delete-btn');
    if (delBtn) delBtn.addEventListener('click', e => {
      e.stopPropagation();
      deleteDrawing(card.dataset.id);
    });
  });

  // 둥실둥실 모드 액션 버튼 (수정 + 삭제)
  physCards.forEach(state => {
    state.el.querySelectorAll('.card-action-btn').forEach(btn => {
      btn.addEventListener('click', e => e.stopPropagation());
    });
    const delBtn = state.el.querySelector('.delete-btn');
    if (delBtn) delBtn.addEventListener('click', e => {
      e.stopPropagation();
      deleteDrawing(state.id);
    });
  });

  // ─── 선택 토글 ─────────────────────────────────────────────────
  function toggle(id) {
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      if (selected.size >= MAX) { showToast(`최대 ${MAX}개까지 선택할 수 있어요!`); return; }
      selected.add(id);
    }
    physCards.forEach(s => s.el.classList.toggle('selected', selected.has(s.id)));
    origCards.forEach(c => c.classList.toggle('selected', selected.has(c.dataset.id)));
    updateUI();
  }

  function updateUI() {
    const count = selected.size;
    counter.textContent      = `${count} / ${MAX} 개 선택`;
    counter.style.background = count > 0 ? 'var(--pink)' : 'var(--yellow)';
    counter.style.color      = count > 0 ? '#fff' : '#3A3A3A';
    if (makeBtn) makeBtn.disabled = count < MIN;

    [...physCards.map(s=>({el:s.el,id:s.id})), ...origCards.map(c=>({el:c,id:c.dataset.id}))]
      .forEach(({el, id}) => el.classList.toggle('disabled', count >= MAX && !selected.has(id)));

    let idx = 1;
    physCards.forEach(s => {
      const b = s.el.querySelector('.selected-badge');
      if (b) b.textContent = selected.has(s.id) ? idx++ : '✓';
    });
    idx = 1;
    origCards.forEach(c => {
      const b = c.querySelector('.selected-badge');
      if (b) b.textContent = selected.has(c.dataset.id) ? idx++ : '✓';
    });
  }

  // ─── 초기 위치 설정 ─────────────────────────────────────────────
  // 카드끼리 겹치지 않도록 랜덤 배치 (겹침 거부 샘플링)
  function initPositions() {
    const b       = getBounds();
    const areaW   = Math.max(0, b.right  - b.left - CARD_W);
    const areaH   = Math.max(0, b.bottom - b.top  - CARD_H);
    const placed  = [];  // 배치된 카드 중심 좌표 목록
    const MIN_D   = RADIUS * 1.5; // 초기 최소 간격 (살짝 겹침 허용)

    physCards.forEach(s => {
      let x, y, tries = 0;

      // 겹치지 않는 위치 찾기 (최대 80회 시도, 실패하면 그냥 배치)
      do {
        x = b.left + Math.random() * areaW;
        y = b.top  + Math.random() * areaH;
        tries++;
      } while (
        tries < 80 &&
        placed.some(p => Math.hypot(p.cx - (x + CARD_W / 2), p.cy - (y + CARD_H / 2)) < MIN_D)
      );

      s.x = Math.max(b.left, Math.min(x, b.right  - CARD_W));
      s.y = Math.max(b.top,  Math.min(y, b.bottom - CARD_H));
      placed.push({ cx: s.x + CARD_W / 2, cy: s.y + CARD_H / 2 });

      const ang = Math.random() * Math.PI * 2;
      s.vx = Math.cos(ang) * SPEED;
      s.vy = Math.sin(ang) * SPEED;

      s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
      s.el.style.opacity   = '1';
      s.ready = true;
    });
  }

  // 200ms 후 초기화 (nav/header 레이아웃 확정 후)
  setTimeout(initPositions, 200);

  // ─── 뷰 모드 전환 ───────────────────────────────────────────────
  const btnFloat = document.getElementById('btn-float');
  const btnGrid  = document.getElementById('btn-grid');

  function setMode(mode) {
    floatMode = (mode === 'float');
    if (btnFloat) { btnFloat.className = floatMode ? 'btn btn-pink btn-sm' : 'btn btn-yellow btn-sm'; btnFloat.style.cssText = ''; }
    if (btnGrid)  { btnGrid.className  = floatMode ? 'btn btn-yellow btn-sm' : 'btn btn-pink btn-sm'; btnGrid.style.cssText  = ''; }

    if (floatMode) {
      grid.style.display    = 'none';
      overlay.style.display = 'block';
      startLoop();
    } else {
      grid.style.display    = '';
      overlay.style.display = 'none';
      stopLoop();
    }
  }

  if (btnFloat) btnFloat.addEventListener('click', () => setMode('float'));
  if (btnGrid)  btnGrid.addEventListener('click',  () => setMode('grid'));

  // 창 크기 변경 시 모드 자동 전환
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768 && floatMode) setMode('grid');
    else if (window.innerWidth > 768 && !floatMode) setMode('float');
  });

  // ─── 드래그 핸들러 ─────────────────────────────────────────────
  let dragging   = null;    // 현재 드래그 중인 state
  let dragMoved  = false;
  let prevMX = 0, prevMY = 0, lastMX = 0, lastMY = 0;

  function dragStart(state, cx, cy) {
    dragging  = state;
    dragMoved = false;
    state.dragOffsetX = cx - state.x;
    state.dragOffsetY = cy - state.y;
    prevMX = lastMX = cx;
    prevMY = lastMY = cy;
    state.hovered = true;
    overlay.style.cursor = 'grabbing';
  }

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - (dragging.x + dragging.dragOffsetX);
    const dy = e.clientY - (dragging.y + dragging.dragOffsetY);
    if (!dragMoved && Math.hypot(dx, dy) > 5) dragMoved = true;

    if (dragMoved) {
      dragging.dragging = true;
      prevMX = lastMX; prevMY = lastMY;
      lastMX = e.clientX; lastMY = e.clientY;
      const b = getBounds();
      dragging.x = Math.max(b.left, Math.min(e.clientX - dragging.dragOffsetX, b.right  - CARD_W));
      dragging.y = Math.max(b.top,  Math.min(e.clientY - dragging.dragOffsetY, b.bottom - CARD_H));
    }
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    if (dragging.dragging) {
      // 드래그 해제 속도 부여 (마지막 두 프레임 기준)
      const velScale = 0.45;
      dragging.vx = Math.max(-MAX_SPEED, Math.min((lastMX - prevMX) * velScale, MAX_SPEED));
      dragging.vy = Math.max(-MAX_SPEED, Math.min((lastMY - prevMY) * velScale, MAX_SPEED));
      dragging.dragging    = false;
      dragging.wasJustDragged = true;
    }
    dragging.hovered = false;
    overlay.style.cursor = '';
    dragging = null;
    dragMoved = false;
  });

  // ─── 물리 루프 ─────────────────────────────────────────────────
  let rafId = null;

  function startLoop() {
    if (rafId) return;
    rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function tick() {
    rafId = null;
    if (!floatMode) return; // 도감 모드면 루프 종료

    const b = getBounds();

    physCards.forEach(s => {
      if (!s.ready || s.hovered || s.dragging) return;
      s.x += s.vx;
      s.y += s.vy;

      if (s.x < b.left)            { s.x = b.left;            s.vx =  Math.abs(s.vx); }
      if (s.x + CARD_W > b.right)  { s.x = b.right  - CARD_W; s.vx = -Math.abs(s.vx); }
      if (s.y < b.top)             { s.y = b.top;             s.vy =  Math.abs(s.vy); }
      if (s.y + CARD_H > b.bottom) { s.y = b.bottom - CARD_H; s.vy = -Math.abs(s.vy); }

      s.vx *= DAMP;
      s.vy *= DAMP;

      // 최소 속도 유지
      const spd = Math.hypot(s.vx, s.vy);
      if (spd < 0.3) {
        const ang = spd > 0.01 ? Math.atan2(s.vy, s.vx) : Math.random() * Math.PI * 2;
        s.vx = Math.cos(ang) * SPEED;
        s.vy = Math.sin(ang) * SPEED;
      }
      // 최대 속도 제한
      else if (spd > MAX_SPEED) {
        s.vx = s.vx / spd * MAX_SPEED;
        s.vy = s.vy / spd * MAX_SPEED;
      }
    });

    // 카드 간 스프링 반발
    for (let i = 0; i < physCards.length; i++) {
      for (let j = i + 1; j < physCards.length; j++) {
        const a = physCards[i], c = physCards[j];
        if (!a.ready || !c.ready) continue;
        const dx = (c.x + CARD_W / 2) - (a.x + CARD_W / 2);
        const dy = (c.y + CARD_H / 2) - (a.y + CARD_H / 2);
        const dist = Math.hypot(dx, dy);
        const minD = RADIUS * 2;
        if (dist < minD && dist > 0.01) {
          const nx = dx / dist, ny = dy / dist;
          const f = 0.55 * (1 - dist / minD);
          if (!a.hovered) { a.vx -= nx * f; a.vy -= ny * f; }
          if (!c.hovered) { c.vx += nx * f; c.vy += ny * f; }
        }
      }
    }

    // 호버 카드 주변 강한 반발
    physCards.forEach(s => {
      if (!s.hovered || !s.ready) return;
      const cx = s.x + CARD_W / 2, cy = s.y + CARD_H / 2;
      physCards.forEach(o => {
        if (o === s || !o.ready) return;
        const dx = (o.x + CARD_W / 2) - cx;
        const dy = (o.y + CARD_H / 2) - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < REPEL_R && dist > 0.01) {
          const f = REPEL_F * (1 - dist / REPEL_R);
          o.vx += (dx / dist) * f;
          o.vy += (dy / dist) * f;
        }
      });
    });

    // DOM 반영
    physCards.forEach(s => {
      if (!s.ready) return;
      const active = s.hovered || s.dragging;
      const scale  = active ? 1.08 : 1;
      s.el.style.transform = `translate(${s.x}px, ${s.y}px) scale(${scale})`;
      s.el.style.zIndex    = s.dragging ? '30' : (active ? '20' : '10');
      s.el.style.cursor    = s.dragging ? 'grabbing' : 'pointer';
      s.el.style.boxShadow = s.dragging
        ? '0 24px 56px rgba(0,0,0,0.28)'
        : (active
          ? '0 16px 40px rgba(0,0,0,0.22)'
          : (selected.has(s.id) ? '0 0 0 4px rgba(255,107,157,0.35)' : ''));
    });

    rafId = requestAnimationFrame(tick);
  }

  // 시작: 모바일(768px 이하)은 도감, 그 외는 플로팅
  setMode(window.innerWidth <= 768 ? 'grid' : 'float');


  // ─── 동화 만들기 버튼 ──────────────────────────────────────────
  if (makeBtn) {
    makeBtn.addEventListener('click', async () => {
      if (selected.size < MIN) return;
      const drawingIds = Array.from(selected).map(Number);
      loading.classList.add('show');
      makeBtn.disabled = true;

      const messages = ['동화를 만들고 있어요... ✨','AI가 이야기를 쓰고 있어요... 📖','예쁜 이야기가 완성되고 있어요... 🎨','거의 다 됐어요! 🌟'];
      let msgIdx = 0;
      const loadingText = document.getElementById('loading-text');
      const msgInterval = setInterval(() => {
        msgIdx = (msgIdx + 1) % messages.length;
        if (loadingText) loadingText.textContent = messages[msgIdx];
      }, 2500);

      try {
        const res  = await fetch('/api/story/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drawing_ids: drawingIds }),
        });
        const data = await res.json();
        clearInterval(msgInterval);
        if (data.success) { window.location.href = `/story/${data.story_id}`; }
        else { loading.classList.remove('show'); makeBtn.disabled = false; alert('오류: ' + data.error); }
      } catch {
        clearInterval(msgInterval);
        loading.classList.remove('show'); makeBtn.disabled = false;
        alert('동화 만들기 중 오류가 발생했어요.');
      }
    });
  }

  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) { toast = document.createElement('div'); toast.id='toast'; toast.className='toast'; document.body.appendChild(toast); }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  updateUI();
})();
