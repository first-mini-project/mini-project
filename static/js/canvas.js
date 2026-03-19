/**
 * canvas.js - 아이용 그림 그리기 캔버스
 * 마우스 & 터치 지원, 색상 선택, 브러시 크기, 지우개, 실행취소
 * + 예시 그림 인라인 표시, 칭찬 모달
 */

(function () {
  const canvas = document.getElementById('drawing-canvas');
  const ctx = canvas.getContext('2d');

  // ─── 상태 ──────────────────────────────────────────────────────────────────
  let isDrawing = false;
  let currentColor = '#333333';
  let currentSize = 8;
  let isEraser = false;
  let history = [];       // undo 스택 (ImageData 배열)
  const MAX_HISTORY = 20;

  // ─── 캔버스 초기화 ──────────────────────────────────────────────────────────
  function initCanvas() {
    canvas.width  = 900;
    canvas.height = 520;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap    = 'round';
    ctx.lineJoin   = 'round';
    saveHistory();
  }

  // ─── 히스토리 ───────────────────────────────────────────────────────────────
  function saveHistory() {
    if (history.length >= MAX_HISTORY) history.shift();
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }

  function undo() {
    if (history.length <= 1) return;
    history.pop();
    ctx.putImageData(history[history.length - 1], 0, 0);
  }

  // ─── 그리기 유틸 ────────────────────────────────────────────────────────────
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    // 점 찍기
    ctx.arc(pos.x, pos.y, currentSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? '#FFFFFF' : currentColor;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineWidth   = currentSize;
    ctx.strokeStyle = isEraser ? '#FFFFFF' : currentColor;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function endDraw(e) {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath();
    saveHistory();
  }

  // ─── 이벤트 ─────────────────────────────────────────────────────────────────
  canvas.addEventListener('mousedown',  startDraw);
  canvas.addEventListener('mousemove',  draw);
  canvas.addEventListener('mouseup',    endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove',  draw,      { passive: false });
  canvas.addEventListener('touchend',   endDraw);

  // ─── 색상 버튼 ──────────────────────────────────────────────────────────────
  const colorBtns = document.querySelectorAll('.color-btn');
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentColor = btn.dataset.color;
      isEraser = false;
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setEraserBtnActive(false);
    });
  });

  // ─── 브러시 크기 ────────────────────────────────────────────────────────────
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentSize = parseInt(btn.dataset.size);
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ─── 지우개 ─────────────────────────────────────────────────────────────────
  const eraserBtn = document.getElementById('eraser-btn');
  if (eraserBtn) {
    eraserBtn.addEventListener('click', () => {
      isEraser = !isEraser;
      setEraserBtnActive(isEraser);
      if (isEraser) {
        colorBtns.forEach(b => b.classList.remove('active'));
      }
    });
  }

  function setEraserBtnActive(active) {
    if (!eraserBtn) return;
    if (active) {
      eraserBtn.classList.add('active');
    } else {
      eraserBtn.classList.remove('active');
    }
  }

  // ─── 전체 지우기 ────────────────────────────────────────────────────────────
  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('그림을 모두 지울까요?')) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    });
  }

  // ─── 실행 취소 ──────────────────────────────────────────────────────────────
  const undoBtn = document.getElementById('undo-btn');
  if (undoBtn) {
    undoBtn.addEventListener('click', undo);
  }

  // 키보드 단축키 (Ctrl+Z)
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  });

  // ─── 저장 + 칭찬 모달 ─────────────────────────────────────────────────────
  const saveBtn = document.getElementById('save-btn');
  const praiseModal = document.getElementById('praise-modal');

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const wordId = saveBtn.dataset.wordId;
      const imageData = canvas.toDataURL('image/png');

      saveBtn.disabled = true;
      saveBtn.textContent = '저장 중...';

      try {
        const res = await fetch('/api/drawing/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word_id: parseInt(wordId), image_data: imageData })
        });
        const data = await res.json();

        if (data.success) {
          // 칭찬 모달 표시
          showPraiseModal();
        } else {
          alert('저장 실패: ' + data.error);
          saveBtn.disabled = false;
          saveBtn.textContent = '✅ 다 그렸어요!';
        }
      } catch (err) {
        alert('저장 중 오류가 발생했어요.');
        saveBtn.disabled = false;
        saveBtn.textContent = '✅ 다 그렸어요!';
      }
    });
  }

  // ─── 칭찬 모달 ─────────────────────────────────────────────────────────────
  function showPraiseModal() {
    if (!praiseModal) return;
    praiseModal.classList.add('show');
    spawnConfetti();
    // 3초 후 모음장으로 이동
    setTimeout(() => {
      window.location.href = '/collection';
    }, 3000);
  }

  function spawnConfetti() {
    const container = document.getElementById('praise-confetti');
    if (!container) return;
    const colors = ['#FFD93D', '#FF6B9D', '#6BC5FF', '#6BCB77', '#C77DFF', '#FF9A3C', '#FF69B4'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = (Math.random() * 1.2) + 's';
      piece.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (6 + Math.random() * 8) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(piece);
    }
  }

  // ─── 도와주세요! (AI 참고 이미지 → 인라인 예시 그림) ─────────────────────────
  const helpBtn = document.getElementById('help-btn');
  const exampleImage = document.getElementById('example-image');
  const examplePlaceholder = document.getElementById('example-placeholder');
  const exampleLoading = document.getElementById('example-loading');

  if (helpBtn) {
    helpBtn.addEventListener('click', async () => {
      const korean  = helpBtn.dataset.korean;
      const english = helpBtn.dataset.english;

      // 로딩 표시
      if (examplePlaceholder) examplePlaceholder.style.display = 'none';
      if (exampleImage) exampleImage.style.display = 'none';
      if (exampleLoading) exampleLoading.style.display = 'flex';

      helpBtn.disabled = true;
      helpBtn.querySelector('.help-big-text').textContent = '생성 중...';

      try {
        const res = await fetch('/api/drawing/help', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ korean, english })
        });
        const data = await res.json();

        if (data.success && data.image) {
          if (exampleImage) {
            exampleImage.src = data.image;
            exampleImage.style.display = 'block';
          }
        } else {
          if (examplePlaceholder) {
            examplePlaceholder.innerHTML =
              '<span class="example-placeholder-icon">😅</span>' +
              '<span>' + (data.error || 'AI 이미지 생성 불가') + '</span>';
            examplePlaceholder.style.display = 'flex';
          }
        }
      } catch (err) {
        if (examplePlaceholder) {
          examplePlaceholder.innerHTML =
            '<span class="example-placeholder-icon">😅</span><span>오류가 발생했어요</span>';
          examplePlaceholder.style.display = 'flex';
        }
      } finally {
        if (exampleLoading) exampleLoading.style.display = 'none';
        helpBtn.disabled = false;
        helpBtn.querySelector('.help-big-text').textContent = '도와주세요!';
      }
    });
  }

  // ─── 토스트 ─────────────────────────────────────────────────────────────────
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
  window.showToast = showToast;

  // ─── 초기화 ─────────────────────────────────────────────────────────────────
  initCanvas();
  // 기본 색상 선택 (검정)
  const defaultColorBtn = document.querySelector('.color-btn[data-color="#333333"]');
  if (defaultColorBtn) defaultColorBtn.classList.add('active');
  // 기본 브러시 크기
  const defaultSizeBtn = document.querySelector('.size-btn[data-size="8"]');
  if (defaultSizeBtn) defaultSizeBtn.classList.add('active');

})();
