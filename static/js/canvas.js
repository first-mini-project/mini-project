/**
 * canvas.js - 아이용 그림 그리기 캔버스
 * 마우스 & 터치 지원, 색상 선택, 브러시 크기, 지우개, 실행취소
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
    canvas.width  = 640;
    canvas.height = 440;
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
    eraserBtn.style.background = active ? '#FFD93D' : '';
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

  // ─── 저장 ───────────────────────────────────────────────────────────────────
  const saveBtn = document.getElementById('save-btn');
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
          showToast('그림이 저장됐어요! 🎉');
          setTimeout(() => { window.location.href = '/collection'; }, 1000);
        } else {
          alert('저장 실패: ' + data.error);
          saveBtn.disabled = false;
          saveBtn.textContent = '다 그랬어요! ✅';
        }
      } catch (err) {
        alert('저장 중 오류가 발생했어요.');
        saveBtn.disabled = false;
        saveBtn.textContent = '다 그랬어요! ✅';
      }
    });
  }

  // ─── 도와주세요! (AI 참고 이미지) ────────────────────────────────────────────
  const helpBtn  = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpModalClose = document.getElementById('help-modal-close');
  const helpImage = document.getElementById('help-image');
  const helpLoading = document.getElementById('help-loading');

  if (helpBtn) {
    helpBtn.addEventListener('click', async () => {
      const korean  = helpBtn.dataset.korean;
      const english = helpBtn.dataset.english;

      helpModal.classList.add('show');
      helpImage.style.display = 'none';
      helpLoading.style.display = 'block';

      try {
        const res = await fetch('/api/drawing/help', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ korean, english })
        });
        const data = await res.json();

        if (data.success && data.image) {
          helpImage.src = data.image;
          helpImage.style.display = 'block';
        } else {
          helpLoading.textContent = data.error || 'AI 이미지 생성 불가';
        }
      } catch (err) {
        helpLoading.textContent = '오류가 발생했어요.';
      } finally {
        helpLoading.style.display = 'none';
      }
    });
  }

  if (helpModalClose) {
    helpModalClose.addEventListener('click', () => helpModal.classList.remove('show'));
  }
  if (helpModal) {
    helpModal.addEventListener('click', e => {
      if (e.target === helpModal) helpModal.classList.remove('show');
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
  // 기본 색상 선택
  if (colorBtns.length) colorBtns[0].classList.add('active');
  // 기본 브러시 크기
  const defaultSizeBtn = document.querySelector('.size-btn[data-size="8"]');
  if (defaultSizeBtn) defaultSizeBtn.classList.add('active');

})();
