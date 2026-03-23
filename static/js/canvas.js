(function () {
  const canvas = document.getElementById("drawing-canvas");
  const ctx = canvas.getContext("2d");

  // ─── 상태 ──────────────────────────────────────────────────────────────────
  let isDrawing = false;
  let currentColor = "#333333";
  let currentSize = 8;
  let isEraser = false;
  let history = []; // undo 스택 (ImageData 배열)
  const MAX_HISTORY = 20;

  // 특별 도구 상태
  let currentMode = "pen"; // 'pen', 'rainbow', 'sparkle', 'stamp'
  let hue = 0; // 무지개 펜용
  let totalBooks = 0;

  // ─── 캔버스 초기화 ──────────────────────────────────────────────────────────
  function initCanvas() {
    canvas.width = 900;
    canvas.height = 520;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    saveHistory();
    fetchUserStats();
  }

  async function fetchUserStats() {
    try {
      const res = await fetch("/api/user/stats");
      const data = await res.json();
      totalBooks = data.total_books;
      updateToolLocks();
    } catch (err) {
      console.error("Stats fetch failed:", err);
    }
  }

  function updateToolLocks() {
    const specialBtns = document.querySelectorAll(".special-btn");
    specialBtns.forEach((btn) => {
      const unlockAt = parseInt(btn.dataset.unlock);
      if (totalBooks >= unlockAt) {
        btn.classList.remove("locked");
      } else {
        btn.classList.add("locked");
      }
    });
  }

  function showLevelUpModal(info) {
    if (!info) return;
    const modal = document.getElementById("level-up-modal");
    document.getElementById("level-up-badge").textContent =
      info.badge.split(" ")[0];
    document.getElementById("level-up-title").textContent = info.badge;
    document.getElementById("level-up-unlocked").textContent = info.unlocked;
    modal.classList.add("show");
    spawnConfetti();
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e) {
    if (e.type === "touchstart") e.preventDefault();
    const pos = getPos(e);

    if (currentMode === "stamp") {
      drawStamp(pos.x, pos.y);
      saveHistory();
      return;
    }

    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    if (currentMode === "sparkle") {
      drawSparkle(pos.x, pos.y);
    } else if (currentMode === "rainbow") {
      // hue reset or continue? continue.
    } else {
      // 점 찍기
      ctx.arc(pos.x, pos.y, currentSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = isEraser ? "#FFFFFF" : currentColor;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }

  function draw(e) {
    if (!isDrawing) return;
    if (e.type === "touchmove") e.preventDefault();
    const pos = getPos(e);

    ctx.lineWidth = currentSize;

    if (currentMode === "rainbow") {
      ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
      hue = (hue + 5) % 360;
    } else if (currentMode === "sparkle") {
      drawSparkle(pos.x, pos.y);
      return; // sparkle uses its own logic
    } else {
      ctx.strokeStyle = isEraser ? "#FFFFFF" : currentColor;
    }

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

  // ─── 특별 브러시 효과 ───────────────────────────────────────────────────────
  function drawSparkle(x, y) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * currentSize * 2;
      const offsetY = (Math.random() - 0.5) * currentSize * 2;
      const size = Math.random() * 4 + 2;

      ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 80%)`;
      // 별 모양 간단히 그리기
      ctx.beginPath();
      ctx.arc(x + offsetX, y + offsetY, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawStamp(x, y) {
    ctx.font = `${currentSize * 5}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👑", x, y);
  }

  // ─── 이벤트 ─────────────────────────────────────────────────────────────────
  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", endDraw);

  // ─── 색상 버튼 ──────────────────────────────────────────────────────────────
  const colorBtns = document.querySelectorAll(".color-btn");
  colorBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentMode = "pen";
      currentColor = btn.dataset.color;
      isEraser = false;
      resetActiveStates();
      btn.classList.add("active");
    });
  });

  // ─── 특별 도구 버튼 ─────────────────────────────────────────────────────────
  const specialBtns = document.querySelectorAll(".special-btn");
  specialBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("locked")) {
        showToast(`📚 책을 ${btn.dataset.unlock}권 이상 만들면 열려요!`);
        return;
      }
      resetActiveStates();
      btn.classList.add("active");
      isEraser = false;

      if (btn.id === "rainbow-btn") currentMode = "rainbow";
      if (btn.id === "sparkle-btn") currentMode = "sparkle";
      if (btn.id === "stamp-btn") currentMode = "stamp";
    });
  });

  function resetActiveStates() {
    colorBtns.forEach((b) => b.classList.remove("active"));
    specialBtns.forEach((b) => b.classList.remove("active"));
    if (eraserBtn) eraserBtn.classList.remove("active");
  }

  // ─── 브러시 크기 ────────────────────────────────────────────────────────────
  const sizeBtns = document.querySelectorAll(".size-btn");
  sizeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSize = parseInt(btn.dataset.size);
      sizeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // ─── 지우개 ─────────────────────────────────────────────────────────────────
  const eraserBtn = document.getElementById("eraser-btn");
  if (eraserBtn) {
    eraserBtn.addEventListener("click", () => {
      isEraser = !isEraser;
      currentMode = "pen";
      resetActiveStates();
      if (isEraser) eraserBtn.classList.add("active");
    });
  }

  // ─── 전체 지우기 ────────────────────────────────────────────────────────────
  const clearBtn = document.getElementById("clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!confirm("그림을 모두 지울까요?")) return;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    });
  }

  // ─── 실행 취소 ──────────────────────────────────────────────────────────────
  const undoBtn = document.getElementById("undo-btn");
  if (undoBtn) {
    undoBtn.addEventListener("click", undo);
  }

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      undo();
    }
  });

  // ─── 저장 ──────────────────────────────────────────────────────────────────
  const saveBtn = document.getElementById("save-btn");
  const praiseModal = document.getElementById("praise-modal");

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const wordId = saveBtn.dataset.wordId;
      const imageData = canvas.toDataURL("image/png");

      saveBtn.disabled = true;
      saveBtn.textContent = "저장 중...";

      try {
        const replaceId = saveBtn.dataset.replaceId;
        const body = { word_id: parseInt(wordId), image_data: imageData };
        if (replaceId) body.replace_drawing_id = parseInt(replaceId);

        const res = await fetch("/api/drawing/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (data.success) {
          showPraiseModal();
        } else {
          alert("저장 실패: " + data.error);
          saveBtn.disabled = false;
          saveBtn.textContent = "✅ 다 그렸어요!";
        }
      } catch (err) {
        alert("저장 중 오류가 발생했어요.");
        saveBtn.disabled = false;
        saveBtn.textContent = "✅ 다 그렸어요!";
      }
    });
  }

  function showPraiseModal() {
    if (!praiseModal) return;
    praiseModal.classList.add("show");
    spawnConfetti();
    setTimeout(() => {
      window.location.href = "/collection";
    }, 3000);
  }

  function spawnConfetti() {
    const container =
      document.getElementById("praise-confetti") ||
      document.getElementById("level-up-modal");
    if (!container) return;
    const colors = [
      "#FFD93D",
      "#FF6B9D",
      "#6BC5FF",
      "#6BCB77",
      "#C77DFF",
      "#FF9A3C",
      "#FF69B4",
    ];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 1.2 + "s";
      piece.style.animationDuration = 1.5 + Math.random() * 1.5 + "s";
      piece.style.width = 6 + Math.random() * 8 + "px";
      piece.style.height = 6 + Math.random() * 8 + "px";
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      container.appendChild(piece);
    }
  }

  // ─── 초기화 실행 ────────────────────────────────────────────────────────────
  initCanvas();

  const existingImageUrl = canvas.dataset.existingImage;
  if (existingImageUrl) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveHistory();
    };
    img.src = existingImageUrl;
  }

  const defaultColorBtn = document.querySelector(
    '.color-btn[data-color="#333333"]',
  );
  if (defaultColorBtn) defaultColorBtn.classList.add("active");
  const defaultSizeBtn = document.querySelector('.size-btn[data-size="8"]');
  if (defaultSizeBtn) defaultSizeBtn.classList.add("active");

  // 도와주세요 (기존 로직 유지)
  const helpBtn = document.getElementById("help-btn");
  const exampleImage = document.getElementById("example-image");
  const examplePlaceholder = document.getElementById("example-placeholder");
  const exampleLoading = document.getElementById("example-loading");

  if (helpBtn) {
    helpBtn.addEventListener("click", async () => {
      const korean = helpBtn.dataset.korean;
      const english = helpBtn.dataset.english;
      if (examplePlaceholder) examplePlaceholder.style.display = "none";
      if (exampleImage) exampleImage.style.display = "none";
      if (exampleLoading) exampleLoading.style.display = "flex";
      helpBtn.disabled = true;
      helpBtn.querySelector(".help-big-text").textContent = "생성 중...";
      try {
        const res = await fetch("/api/drawing/help", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ korean, english }),
        });
        const data = await res.json();
        if (data.success && data.image) {
          if (exampleImage) {
            exampleImage.src = data.image;
            exampleImage.style.display = "block";
          }
        } else {
          if (examplePlaceholder) {
            examplePlaceholder.innerHTML =
              '<span class="example-placeholder-icon">😅</span><span>' +
              (data.error || "AI 이미지 생성 불가") +
              "</span>";
            examplePlaceholder.style.display = "flex";
          }
        }
      } catch (err) {
        if (examplePlaceholder) {
          examplePlaceholder.innerHTML =
            '<span class="example-placeholder-icon">😅</span><span>오류가 발생했어요</span>';
          examplePlaceholder.style.display = "flex";
        }
      } finally {
        if (exampleLoading) exampleLoading.style.display = "none";
        helpBtn.disabled = false;
        helpBtn.querySelector(".help-big-text").textContent = "도와주세요!";
      }
    });
  }

  function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }
  window.showToast = showToast;
})();
