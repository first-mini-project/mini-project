/**
 * storybook.js - 동화책 TTS 플레이어 & 페이지 효과
 */

(function () {
  const audio      = document.getElementById('tts-audio');
  const playBtn    = document.getElementById('tts-play-btn');
  const playIcon   = document.getElementById('tts-play-icon');
  const deleteBtn  = document.getElementById('delete-story-btn');
  const storyId    = document.body.dataset.storyId;

  // ─── TTS 플레이어 ───────────────────────────────────────────────────────────
  if (playBtn && audio) {
    // 자동 재생 시도
    audio.addEventListener('canplaythrough', () => {
      audio.play().catch(() => {});  // 자동재생 차단 시 무시
    });

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play',  () => { playIcon.textContent = '⏸'; });
    audio.addEventListener('pause', () => { playIcon.textContent = '▶'; });
    audio.addEventListener('ended', () => { playIcon.textContent = '▶'; });
  } else if (playBtn) {
    // TTS 파일 없을 때 → 브라우저 Web Speech API 사용
    const storyContent = document.getElementById('story-content');
    const storyTitle   = document.getElementById('story-title');

    playBtn.addEventListener('click', () => {
      if ('speechSynthesis' in window) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          playIcon.textContent = '▶';
          return;
        }
        const text = (storyTitle ? storyTitle.textContent : '') + '. ' +
                     (storyContent ? storyContent.textContent : '');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.85;
        utterance.pitch = 1.1;
        utterance.onend = () => { playIcon.textContent = '▶'; };
        playIcon.textContent = '⏸';
        window.speechSynthesis.speak(utterance);
      } else {
        alert('이 브라우저에서는 음성 읽기를 지원하지 않아요.');
      }
    });
  }

  // ─── 동화 삭제 ──────────────────────────────────────────────────────────────
  if (deleteBtn && storyId) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('이 동화를 삭제할까요?')) return;

      try {
        const res = await fetch(`/api/story/${storyId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          window.location.href = '/library';
        } else {
          alert('삭제 실패: ' + data.error);
        }
      } catch (err) {
        alert('삭제 중 오류가 발생했어요.');
      }
    });
  }

  // ─── 라이브러리 카드 삭제 버튼 (library.html에서도 사용) ──────────────────────
  document.querySelectorAll('.story-card-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.storyId;
      if (!confirm('이 동화를 삭제할까요?')) return;

      try {
        const res = await fetch(`/api/story/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          const card = btn.closest('.story-card');
          card.style.transition = 'all 0.3s';
          card.style.opacity = '0';
          card.style.transform = 'scale(0.8)';
          setTimeout(() => card.remove(), 300);
        }
      } catch (err) {
        alert('삭제 중 오류가 발생했어요.');
      }
    });
  });

  // ─── 콘텐츠 페이드인 ─────────────────────────────────────────────────────────
  document.querySelectorAll('.fade-in').forEach((el, i) => {
    el.style.animationDelay = `${i * 0.1}s`;
  });

})();
