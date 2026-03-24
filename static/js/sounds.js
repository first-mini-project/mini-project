/**
 * sounds.js - 효과음 모음 (Web Audio API 합성)
 * window.SFX 로 어디서든 호출 가능
 */
(function () {
  let _ctx = null;
  let _ready = false;

  // mousedown 시점에 AudioContext를 미리 unlock (click보다 빠름)
  function _unlock() {
    if (_ready) return;
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    _ctx.resume().then(() => { _ready = true; });
  }
  document.addEventListener("mousedown", _unlock, { once: false, capture: true });
  document.addEventListener("touchstart", _unlock, { once: false, capture: true });

  function ctx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  }


  /* ── 내부 헬퍼 ── */
  function osc(ac, type, freq, startT, dur, vol) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, startT);
    g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
    o.start(startT); o.stop(startT + dur);
  }

  function _sparkle(ac, vol = 0.25) {
    [1200, 1600, 1000, 1800, 1400, 2000, 900].forEach((freq, i) => {
      osc(ac, "sine", freq, ac.currentTime + i * 0.06, 0.15, vol);
    });
  }

  const SFX = {
    /* ① START 팡파레 */
    start() {
      const ac = ctx();
      [261.6, 329.6, 392, 523.2].forEach((freq, i) => {
        const t = ac.currentTime + i * 0.13;
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = "triangle"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.4, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.start(t); o.stop(t + 0.25);
      });
      setTimeout(() => _sparkle(ctx(), 0.2), 500);
    },

    /* ② 통통 팝 (메인 버튼) */
    boing() {
      const ac = ctx(), t = ac.currentTime;
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(600, t + 0.08);
      o.frequency.exponentialRampToValueAtTime(350, t + 0.25);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.3);
    },

    /* ③ 물감 뿅 (색상 선택) */
    paint() {
      const ac = ctx(), t = ac.currentTime;
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(500, t);
      o.frequency.exponentialRampToValueAtTime(200, t + 0.12);
      g.gain.setValueAtTime(0.45, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.start(t); o.stop(t + 0.15);
    },

    /* ④ 띵 (브러시 크기 - size: "s"|"m"|"l") */
    bell(size) {
      const ac = ctx();
      const freq = size === "s" ? 880 : size === "l" ? 440 : 660;
      osc(ac, "sine", freq, ac.currentTime, 0.5, 0.4);
    },

    /* ⑤ 반짝 마법 (무지개, 반짝이) */
    sparkle() { _sparkle(ctx(), 0.3); },

    /* ⑥ 도장 탁! */
    stamp() {
      const ac = ctx(), t = ac.currentTime;
      const bufLen = ac.sampleRate * 0.05;
      const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
      const src = ac.createBufferSource(), filt = ac.createBiquadFilter(), g = ac.createGain();
      filt.type = "lowpass"; filt.frequency.value = 300;
      src.buffer = buf; src.connect(filt); filt.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(1.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      src.start(t);
      osc(ac, "sine", 100, t, 0.08, 0.5);
    },

    /* ⑦ 지우개 슥슥 */
    erase() {
      const ac = ctx();
      const bufLen = ac.sampleRate * 0.3;
      const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        d[i] = (Math.random() * 2 - 1) * 0.3 * Math.sin(Math.PI * i / bufLen);
      }
      const src = ac.createBufferSource(), filt = ac.createBiquadFilter(), g = ac.createGain();
      filt.type = "bandpass"; filt.frequency.value = 3000; filt.Q.value = 0.5;
      src.buffer = buf; src.connect(filt); filt.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(1, ac.currentTime);
      src.start(ac.currentTime);
    },

    /* ⑧ 전체 지우기 휙~ (부드러운 버전) */
    sweep() {
      const ac = ctx(), t = ac.currentTime;
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(600, t);
      o.frequency.exponentialRampToValueAtTime(120, t + 0.45);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      o.start(t); o.stop(t + 0.45);

      const bufLen = ac.sampleRate * 0.4;
      const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        d[i] = (Math.random() * 2 - 1) * 0.15 * Math.sin(Math.PI * (i / bufLen) * 0.7) * (1 - i / bufLen);
      }
      const src = ac.createBufferSource(), filt = ac.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.setValueAtTime(1200, t);
      filt.frequency.exponentialRampToValueAtTime(300, t + 0.4);
      src.buffer = buf; src.connect(filt); filt.connect(ac.destination);
      src.start(t);
    },

    /* ⑨ 되돌리기 삐리 */
    undo() {
      const ac = ctx(), t = ac.currentTime;
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = "sawtooth";
      o.frequency.setValueAtTime(700, t);
      o.frequency.exponentialRampToValueAtTime(200, t + 0.2);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t); o.stop(t + 0.22);
    },

    /* ⑩ 저장 짜잔! */
    save() {
      const ac = ctx();
      [392, 523.2, 659.2].forEach((freq, i) => {
        osc(ac, "triangle", freq, ac.currentTime + i * 0.1, 0.3, 0.35);
      });
      setTimeout(() => _sparkle(ctx(), 0.2), 300);
    },

    /* ⑪ 풍선 빵! (부드러운 버전) */
    balloon() {
      const ac = ctx(), t = ac.currentTime;
      const o1 = ac.createOscillator(), g1 = ac.createGain();
      o1.connect(g1); g1.connect(ac.destination);
      o1.type = "sine";
      o1.frequency.setValueAtTime(180, t);
      o1.frequency.exponentialRampToValueAtTime(60, t + 0.18);
      g1.gain.setValueAtTime(0, t);
      g1.gain.linearRampToValueAtTime(0.55, t + 0.01);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o1.start(t); o1.stop(t + 0.22);

      osc(ac, "triangle", 320, t, 0.18, 0.3);
      o1.frequency.exponentialRampToValueAtTime(100, t + 0.15);

      const bufLen = ac.sampleRate * 0.06;
      const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.18 * Math.pow(1 - i / bufLen, 3);
      const src = ac.createBufferSource(), filt = ac.createBiquadFilter();
      filt.type = "lowpass"; filt.frequency.value = 800;
      src.buffer = buf; src.connect(filt); filt.connect(ac.destination);
      src.start(t);
    },

    /* ⑫ 동화 완성 축하! */
    celebrate() {
      const ac = ctx();
      [[261.6,0],[293.6,0.15],[329.6,0.3],[392,0.45],[523.2,0.6],[659.2,0.75]].forEach(([f,d]) => {
        osc(ac, "triangle", f, ac.currentTime + d, 0.28, 0.35);
      });
      [523.2, 659.2, 783.9].forEach(f => osc(ac, "triangle", f, ac.currentTime + 0.9, 0.6, 0.3));
      setTimeout(() => _sparkle(ctx(), 0.2), 900);
      setTimeout(() => _sparkle(ctx(), 0.2), 1100);
      setTimeout(() => _sparkle(ctx(), 0.2), 1300);
    },
  };

  window.SFX = SFX;
})();
