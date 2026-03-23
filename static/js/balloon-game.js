/**
 * balloon-game.js — 동화 로딩 중 풍선 터트리기 게임
 * loading-overlay 가 .show 클래스를 받으면 자동 시작
 * .show 가 제거되면 자동 종료
 */
(function () {
  const BALLOONS = [
    // [이모지, 점수, 등장 가중치]
    { emoji: "🎈", pts: 10, weight: 20 },
    { emoji: "🎀", pts: 10, weight: 15 },
    { emoji: "🐱", pts: 15, weight: 12 },
    { emoji: "🐶", pts: 15, weight: 12 },
    { emoji: "🦋", pts: 15, weight: 10 },
    { emoji: "🐰", pts: 15, weight: 10 },
    { emoji: "🐸", pts: 15, weight: 10 },
    { emoji: "🦄", pts: 20, weight: 7 },
    { emoji: "🌟", pts: 20, weight: 7 },
    { emoji: "🍎", pts: 10, weight: 12 },
    { emoji: "🍇", pts: 10, weight: 10 },
    { emoji: "🍦", pts: 10, weight: 10 },
    { emoji: "⭐", pts: 30, weight: 5 }, // 희귀 — 30점
    { emoji: "💎", pts: 50, weight: 2 }, // 초희귀 — 50점
  ];

  // 가중치 기반 랜덤 선택
  const totalWeight = BALLOONS.reduce((s, b) => s + b.weight, 0);
  function pickBalloon() {
    let r = Math.random() * totalWeight;
    for (const b of BALLOONS) {
      r -= b.weight;
      if (r <= 0) return b;
    }
    return BALLOONS[0];
  }

  let score = 0;
  let spawnTimer = null;
  let active = false;
  const gameArea = document.getElementById("game-area");
  const scoreEl = document.getElementById("game-score");
  const overlay = document.getElementById("loading-overlay");

  if (!gameArea || !overlay) return;

  // ─── 점수 업데이트 ──────────────────────────────────────────────
  function addScore(pts) {
    score += pts;
    if (!scoreEl) return;
    scoreEl.textContent = score;
    scoreEl.classList.remove("pop");
    void scoreEl.offsetWidth; // reflow
    scoreEl.classList.add("pop");
    setTimeout(() => scoreEl.classList.remove("pop"), 150);
  }

  // ─── 풍선 1개 생성 ──────────────────────────────────────────────
  function spawnBalloon() {
    if (!active) return;

    const data = pickBalloon();
    const duration = 2.5 + Math.random() * 5.5; // 2.5 ~ 8초 (빠른 것~느린 것 혼합)
    const startX = 4 + Math.random() * 88; // 화면 가로 4~92%
    const scale = 0.7 + Math.random() * 0.7; // 크기도 랜덤 (작은~큰 풍선)

    const el = document.createElement("div");
    el.className = "balloon";
    el.style.cssText = `
      left: ${startX}%;
      bottom: -80px;
      animation-duration: ${duration}s;
      transform: scale(${scale.toFixed(2)});
    `;
    el.innerHTML = `
      <div class="balloon-body">${data.emoji}</div>
      <div class="balloon-string"></div>
      <div class="balloon-pts">+${data.pts}</div>
    `;

    // 클릭 — 터트리기
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      popBalloon(el, data.pts, e.clientX, e.clientY);
    });

    // 날아가면 자동 제거
    el.addEventListener("animationend", () => el.remove());

    gameArea.appendChild(el);
  }

  // ─── 풍선 터트리기 ──────────────────────────────────────────────
  function popBalloon(el, pts, cx, cy) {
    const emoji = el.querySelector(".balloon-body").textContent;
    const rect = el.getBoundingClientRect();

    // 팝 이펙트
    const pop = document.createElement("div");
    pop.className = "balloon-pop";
    pop.textContent = emoji;
    pop.style.cssText = `left:${rect.left + rect.width / 2 - 20}px; top:${rect.top}px; position:fixed;`;
    document.body.appendChild(pop);
    pop.addEventListener("animationend", () => pop.remove());

    // 점수 팝업
    const popup = document.createElement("div");
    popup.className = "score-popup";
    popup.textContent = `+${pts}`;
    popup.style.cssText = `left:${cx - 16}px; top:${cy - 10}px; position:fixed;`;
    document.body.appendChild(popup);
    popup.addEventListener("animationend", () => popup.remove());

    el.remove();
    addScore(pts);
  }

  // ─── 게임 시작 ──────────────────────────────────────────────────
  function startGame() {
    if (active) return;
    active = true;
    score = 0;
    if (scoreEl) scoreEl.textContent = "0";

    // 처음엔 풍선 한 무더기 빠르게 등장
    const initCount = 5 + Math.floor(Math.random() * 4); // 5~8개
    for (let i = 0; i < initCount; i++) {
      setTimeout(spawnBalloon, i * 180);
    }

    // 이후 주기적으로 스폰 — 가끔 한꺼번에 여러 개 터짐
    function scheduleNext() {
      if (!active) return;
      const delay = 400 + Math.random() * 700; // 0.4 ~ 1.1초마다 (더 자주)
      spawnTimer = setTimeout(() => {
        // 30% 확률로 2~3개 동시 스폰 (랜덤 파도)
        const burst =
          Math.random() < 0.3 ? 2 + Math.floor(Math.random() * 2) : 1;
        for (let i = 0; i < burst; i++) {
          setTimeout(spawnBalloon, i * 120);
        }
        scheduleNext();
      }, delay);
    }
    scheduleNext();
  }

  // ─── 게임 종료 ──────────────────────────────────────────────────
  function stopGame() {
    active = false;
    clearTimeout(spawnTimer);
    // 남은 풍선 제거
    gameArea.querySelectorAll(".balloon").forEach((b) => b.remove());
  }

  // ─── loading-overlay .show 감지 ─────────────────────────────────
  const observer = new MutationObserver(() => {
    if (overlay.classList.contains("show")) {
      startGame();
    } else {
      stopGame();
    }
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });

  // 이미 열려있으면 바로 시작
  if (overlay.classList.contains("show")) startGame();
})();
