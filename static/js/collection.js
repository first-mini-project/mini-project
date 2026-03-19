/**
 * collection.js - 그림 모음장 선택 & 동화 생성
 */
(function () {
  const MAX = 5;
  const MIN = 1;
  let selected = new Set();

  const counter  = document.getElementById('selection-counter');
  const makeBtn  = document.getElementById('make-story-btn');
  const loading  = document.getElementById('loading-overlay');
  const cards    = document.querySelectorAll('.drawing-card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (selected.has(id)) {
        selected.delete(id);
        card.classList.remove('selected');
      } else {
        if (selected.size >= MAX) {
          showToast(`최대 ${MAX}개까지 선택할 수 있어요!`);
          return;
        }
        selected.add(id);
        card.classList.add('selected');
      }
      updateUI();
    });
  });

  function updateUI() {
    const count = selected.size;
    counter.textContent = `${count} / ${MAX} 개 선택`;
    counter.style.background = count > 0 ? 'var(--pink)' : 'var(--yellow)';
    counter.style.color      = count > 0 ? '#fff' : '#3A3A3A';
    makeBtn.disabled = count < MIN;

    if (count >= MAX) {
      cards.forEach(card => {
        if (!selected.has(card.dataset.id)) card.classList.add('disabled');
      });
    } else {
      cards.forEach(card => card.classList.remove('disabled'));
    }

    let idx = 1;
    cards.forEach(card => {
      const badge = card.querySelector('.selected-badge');
      if (selected.has(card.dataset.id)) badge.textContent = idx++;
    });
  }

  makeBtn.addEventListener('click', async () => {
    if (selected.size < MIN) return;

    const drawingIds = Array.from(selected).map(Number);
    loading.classList.add('show');
    makeBtn.disabled = true;

    const messages = [
      '동화를 만들고 있어요... ✨',
      'AI가 이야기를 쓰고 있어요... 📖',
      '예쁜 이야기가 완성되고 있어요... 🎨',
      '거의 다 됐어요! 🌟',
    ];
    let msgIdx = 0;
    const loadingText = document.getElementById('loading-text');
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      if (loadingText) loadingText.textContent = messages[msgIdx];
    }, 2500);

    try {
      const res = await fetch('/api/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawing_ids: drawingIds }),
      });
      const data = await res.json();
      clearInterval(msgInterval);
      if (data.success) {
        window.location.href = `/story/${data.story_id}`;
      } else {
        loading.classList.remove('show');
        makeBtn.disabled = false;
        alert('오류: ' + data.error);
      }
    } catch {
      clearInterval(msgInterval);
      loading.classList.remove('show');
      makeBtn.disabled = false;
      alert('동화 만들기 중 오류가 발생했어요.');
    }
  });

  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id        = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  updateUI();
})();
