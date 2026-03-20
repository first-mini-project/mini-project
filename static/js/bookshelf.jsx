import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';

const DUMMY_DATA = [
  {
    "id": 1,
    "title": "아기 토끼의 무지개 여행",
    "coverImage": null,
    "isRead": false,
    "pages": [
      { "page": 1, "content_kr": "옛날 옛날 아주 먼 옛날, 깊은 숲속에 호기심 많은 아기 토끼가 살고 있었어요. 아기 토끼는 매일매일 궁금한 것이 가득했어요." },
      { "page": 2, "content_kr": "어느 날 아기 토끼는 커다란 무지개를 보았어요. '와, 저 무지개는 어디로 가는 걸까?' 아기 토끼는 무지개를 따라가 보기로 결심했어요." }
    ]
  },
  {
    "id": 2,
    "title": "별빛 요정의 도토리",
    "coverImage": null,
    "isRead": true,
    "pages": [
      { "page": 1, "content_kr": "밤하늘에서 톡! 하고 별빛 요정이 떨어졌어요." },
      { "page": 2, "content_kr": "요정은 잃어버린 도토리를 찾아 숲속을 헤매기 시작했어요." }
    ]
  }
];

// Vector style generator
function getVectorStyle(id) {
  const styles = [
    { bg: '#f59aa1', shape: '✿', shapeSize: '3.5rem', shapeColor: '#eb5264', spine: '#e47d84' },
    { bg: '#b2c8e8', shape: '☁️', shapeSize: '3rem', shapeColor: '#ffffff', spine: '#9fb5d5' },
    { bg: '#6fc8a5', shape: '▬', shapeSize: '2rem', shapeColor: '#4d9f80', spine: '#5eb391' },
    { bg: '#fde074', shape: '☀️', shapeSize: '4rem', shapeColor: '#f4b82d', spine: '#ebd064' },
    { bg: '#ef6a4d', shape: '', shapeSize: '', shapeColor: '', spine: '#db5639' }, 
    { bg: '#f7ad60', shape: '⭐', shapeSize: '2.5rem', shapeColor: '#ffe58f', spine: '#e49a4d' },
    { bg: '#5eb4d7', shape: '▲', shapeSize: '3rem', shapeColor: '#fde074', spine: '#4ea4c7' },
    { bg: '#b28ddb', shape: '☁️', shapeSize: '3.5rem', shapeColor: '#e0cbed', spine: '#a17cc8' },
  ];
  const s = styles[id % styles.length];
  const isLandscape = id % 3 !== 0; // More landscape books
  return { ...s, isLandscape };
}

const BADGE_LIST = ['🐥','🐢','🦄','🐌','🐿️','🦖','🦋','🐝','🐙','🦔','🐼','🐨','🦁','🐮','🐷'];

// Sub-component: Front-Facing Vector Book
function BookCover({ book, idx, onClick, onDelete }) {
  const isUnread = !book.isRead;
  const styleConf = getVectorStyle(book.id);

  const handleDelete = (e) => {
    e.stopPropagation();
    if(window.confirm(`'${book.title}' 동화를 정말 삭제할까요?`)) {
      onDelete(book.id);
    }
  };

  return (
    <motion.div
      layoutId={`book-wrapper-${book.id}`}
      className={`book-cover ${styleConf.isLandscape ? 'landscape' : 'portrait'} ${isUnread ? 'unread-book' : ''}`}
      style={{ backgroundColor: styleConf.bg, transformOrigin: 'bottom center' }}
      onClick={() => onClick(book)}
      whileHover={{ y: -10, scale: 1.05 }}
      whileTap={{ scale: 0.95, y: 0 }}
      transition={{ layout: { type: "spring", stiffness: 300, damping: 25 }, hover: { type: "spring", stiffness: 400, damping: 15 } }}
    >
      <div className="book-binding" style={{ backgroundColor: styleConf.spine }}></div>
      
      <button className="delete-book-btn" onClick={handleDelete} title="동화책 지우기">🗑️</button>

      <div className="book-decoration" style={{ fontSize: styleConf.shapeSize, color: styleConf.shapeColor }}>
        {book.coverImage && <img src={'/' + book.coverImage.replace(/^\/+/, '')} alt="" className="book-cover-image-preview" />}
        {!book.coverImage && styleConf.shape}
      </div>

      <div className="book-cover-title">{book.title}</div>
    </motion.div>
  );
}

// Sub-component: Bookshelf Section matching reference
function Shelf({ title, books, onBookClick, onDelete, renderEmpty }) {
  return (
    <div className="shelf-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="shelf-section">
        <div className="shelf-sides"></div> {/* The sloping sides */}
        
        <div className="shelf-header">
          <div className="signboard-mount"></div>
          <div className="signboard-mount right"></div>
          <h3 className="shelf-title">{title}</h3>
        </div>
        
        {/* 3 Tiered Display Section */}
        <div className="books-grid">
          <div className="tier tier-1"></div>
          <div className="tier tier-2"></div>
          <div className="tier tier-3"></div>
          
          <div className="books-container">
            <AnimatePresence>
              {books.map((book, idx) => (
                <BookCover key={book.id} book={book} idx={idx} onClick={onBookClick} onDelete={onDelete} />
              ))}
            </AnimatePresence>
            {books.length === 0 && renderEmpty && renderEmpty()}
          </div>
        </div>

        {/* Storage Bins Section */}
        <div className="storage-section">
          <div className="storage-cubby"><div className="bin"><div className="bin-handle"></div></div></div>
          <div className="storage-cubby"><div className="bin"><div className="bin-handle"></div></div></div>
          <div className="storage-cubby"><div className="bin"><div className="bin-handle"></div></div></div>
        </div>
      </div>
    </div>
  );
}

// ─── 누끼 처리 (흰 배경 → 투명) ──────────────────────────────────────────────
function makeNukkiDataURL(img) {
  const w = img.naturalWidth || 400;
  const h = img.naturalHeight || 400;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i+1], b = px[i+2];
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;
    if (brightness > 248) { px[i+3] = 0; }
    else if (brightness > 215) { px[i+3] = Math.round((248 - brightness) / 33 * 220); }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

const SKY_KW = new Set(['별', '달', '구름', '무지개', '태양', '나비', '풍선']);
function isSky(d) { return d && SKY_KW.has(d.korean); }
function mentionedInScene(sceneText, drawings) {
  const t = sceneText || '';
  return (drawings || []).filter(d => d.korean && t.includes(d.korean));
}

// Overlaid Story Reader
function StoryModal({ book, idx, onClose, onReadComplete }) {
  const styleConf = getVectorStyle(book.id);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [nukkiMap, setNukkiMap] = useState({}); // drawing_id → nukkiUrl

  // 누끼 처리 — 컴포넌트 마운트 시 한 번만
  useEffect(() => {
    const drawings = book.drawings || [];
    if (drawings.length === 0) return;
    drawings.forEach(d => {
      if (!d.file_path) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const url = makeNukkiDataURL(img);
          setNukkiMap(prev => ({ ...prev, [d.id]: url }));
        } catch(e) {}
      };
      img.src = '/' + d.file_path.replace(/^\/+/, '');
    });
  }, [book.drawings]);

  useEffect(() => {
    if (book.pages.length <= 1) setHasReachedEnd(true);
    const timer = setTimeout(() => setIsOpen(true), 100);
    return () => clearTimeout(timer);
  }, [book.pages.length]);

  const handleNext = () => {
    if (currentPageIndex < book.pages.length - 1) {
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);
      if (nextIndex === book.pages.length - 1) setHasReachedEnd(true);
    }
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      if (hasReachedEnd && !book.isRead) onReadComplete(book.id);
      onClose();
    }, 350);
  };

  const currentPage = book.pages[currentPageIndex] || {};
  const currentPageContent = currentPage.content_kr || '';

  const drawings = book.drawings || [];

  function getDrawingSrc(d) {
    if (!d) return null;
    return nukkiMap[d.id] || (d.file_path ? '/' + d.file_path.replace(/^\/+/, '') : null);
  }

  // 모든 페이지 그림 배치 사전 계산 (내용 우선, 미노출 그림 분배 → 최소 1회 보장, 최대 3개)
  const pageAssignments = useMemo(() => {
    const shownIds = new Set();
    const result = book.pages.map(page => {
      if (page.type !== 'content') return { primary: null, secondary: null, tertiary: null };
      let primary = null, secondary = null, tertiary = null;
      if (page.primaryDrawingId) primary = drawings.find(d => d.id === page.primaryDrawingId) || null;
      if (page.secondaryDrawingId) secondary = drawings.find(d => d.id === page.secondaryDrawingId) || null;
      if (!primary && !secondary) {
        const hit = mentionedInScene(page.content_kr, drawings);
        primary = hit[0] || null;
        secondary = hit[1] || null;
        tertiary = hit[2] || null;
      }
      if (primary) shownIds.add(primary.id);
      if (secondary) shownIds.add(secondary.id);
      if (tertiary) shownIds.add(tertiary.id);
      return { primary, secondary, tertiary };
    });
    // 미노출 그림을 빈 슬롯에 분배
    const unshown = drawings.filter(d => !shownIds.has(d.id));
    for (const d of unshown) {
      let placed = false;
      for (let i = 0; i < result.length; i++) {
        if (book.pages[i].type !== 'content') continue;
        if (!result[i].secondary) { result[i].secondary = d; placed = true; break; }
      }
      if (!placed) {
        for (let i = 0; i < result.length; i++) {
          if (book.pages[i].type !== 'content') continue;
          if (!result[i].tertiary) { result[i].tertiary = d; placed = true; break; }
        }
      }
      if (!placed) {
        for (let i = 0; i < result.length; i++) {
          if (book.pages[i].type !== 'content') continue;
          if (!result[i].primary) { result[i].primary = d; break; }
        }
      }
    }
    return result;
  }, [book.id]);

  // 왼쪽 페이지: 배경 + 그림 (교훈 페이지: 스케치북 배경 + 모든 그림, 내용 페이지: 배치된 1-2개)
  function renderLeftPage() {
    const isMoralPage = currentPage.type === 'moral';

    // ── 교훈(마지막) 페이지 ──────────────────────────────────────────────
    if (isMoralPage) {
      const dc = drawings.length;
      const cols = dc === 1 ? 1 : 2;
      const rows = dc <= 2 ? 1 : dc <= 4 ? 2 : 3;
      const rotations = [-5, 4, -3, 6, -4];
      return (
        <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden',
                      borderRadius:'10px 0 0 10px', background:'linear-gradient(145deg,#fffde7,#fff9c4)' }}>
          <img src="/static/images/sketchbook.png" alt="스케치북"
            onLoad={e => { e.target.style.opacity='1'; }}
            onError={e => { e.target.style.display='none'; }}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                     objectFit:'fill', zIndex:1, opacity:0, transition:'opacity 0.4s' }} />
          <div style={{
            position:'absolute', top:'20%', left:'8%', right:'8%', bottom:'18%', zIndex:3,
            display:'grid',
            gridTemplateColumns:`repeat(${cols}, 1fr)`,
            gridTemplateRows:`repeat(${rows}, 1fr)`,
            gap:'8px', boxSizing:'border-box', overflow:'hidden',
          }}>
            {drawings.map((d, i) => {
              const src = getDrawingSrc(d);
              const rot = rotations[i % rotations.length];
              const spansAll = (dc % 2 !== 0) && (i === dc - 1) && dc > 1;
              return (
                <div key={d.id} style={{
                  gridColumn: spansAll ? '1 / -1' : undefined,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  overflow:'hidden',
                  animation:`float-anim ${3 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
                }}>
                  {src && <img src={src} alt={d.korean||''}
                    style={{ maxWidth:'70%', maxHeight:'70%', objectFit:'contain',
                             transform:`rotate(${rot}deg)`,
                             filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.28))' }} />}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── 내용 페이지: 배치된 1-3개 그림 플로팅 ───────────────────────────
    const { primary, secondary, tertiary } = pageAssignments[currentPageIndex] || {};
    const pageDrawings = [primary, secondary, tertiary].filter(Boolean);
    const dc = pageDrawings.length;
    const maxH = dc === 1 ? '70vh' : dc === 2 ? '58vh' : '48vh';
    const maxW = dc === 1 ? '90%' : dc === 2 ? '78%' : '65%';
    // 그림 수에 따라 페이지 내 절대 위치 (top/left는 중심 기준, translate로 보정)
    const POSITIONS = [
      [{ top: '50%', left: '50%' }],
      [{ top: '35%', left: '28%' }, { top: '62%', left: '72%' }],
      [{ top: '25%', left: '50%' }, { top: '65%', left: '22%' }, { top: '68%', left: '76%' }],
    ];
    const positions = POSITIONS[Math.min(dc, 3) - 1] || POSITIONS[0];

    const bgImage = currentPage.bgImage;
    const bgText  = currentPage.bgText || '';
    const mergedImage = currentPage.mergedImage;
    let bgSrc = null;
    if (bgImage) {
      bgSrc = '/' + bgImage.replace(/^\/+/, '');
    } else if (mergedImage) {
      bgSrc = '/' + mergedImage.replace(/^\/+/, '');
    } else if (bgText) {
      const prompt = bgText
        + ', children storybook illustration, watercolor art style, soft pastel colors,'
        + ' magical whimsical background scenery, no characters, no people, no animals, no text';
      const seed = Math.abs(bgText.split('').reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0)) % 999983;
      bgSrc = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}&model=flux`;
    }

    return (
      <div style={{ position:'relative', width:'100%', height:'100%',
                    overflow:'hidden', borderRadius:'10px 0 0 10px' }}>
        {bgSrc ? (
          <>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, #87ceeb, #5cbf8a)', zIndex:0 }} />
            <img src={bgSrc} alt="배경"
              onLoad={e => { e.target.style.opacity='1'; }}
              onError={e => { e.target.style.display='none'; }}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                       objectFit:'cover', display:'block', zIndex:1, opacity:0, transition:'opacity 0.4s' }} />
          </>
        ) : (
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, #87ceeb, #5cbf8a)' }} />
        )}
        {pageDrawings.map((d, i) => {
          const src = getDrawingSrc(d);
          if (!src) return null;
          const pos = positions[i] || positions[0];
          return (
            <div key={d.id} style={{
              position:'absolute', top: pos.top, left: pos.left,
              transform:'translate(-50%, -50%)', zIndex:5,
              animation:`float-anim ${3 + i * 0.7}s ease-in-out ${i * 0.5}s infinite`,
            }}>
              <img src={src} alt={d.korean||''}
                style={{ maxHeight:maxH, maxWidth:maxW, objectFit:'contain',
                         filter:'drop-shadow(0 4px 14px rgba(0,0,0,0.35))' }} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="reader-overlay">
      <div className="reader-close-area" onClick={handleClose} />
      <motion.div
        className="opened-book-container"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <div className="book-volume">
          {/* Right page — Story Text */}
          <div className="book-pages">
            <button className="close-button" onClick={handleClose}>✕</button>
            <h2 className="story-title">{book.title}</h2>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="story-page-content"
              >
                <p className="story-text">{currentPageContent}</p>
              </motion.div>
            </AnimatePresence>

            <div className="paging-controls">
              <button className={`page-btn ${currentPageIndex === 0 ? 'disabled' : ''}`} onClick={handlePrev} disabled={currentPageIndex === 0}>◀ 이전</button>
              <span className="page-indicator">{currentPageIndex + 1} / {book.pages.length}</span>
              <button className={`page-btn ${currentPageIndex === book.pages.length - 1 ? 'disabled' : ''}`} onClick={handleNext} disabled={currentPageIndex === book.pages.length - 1}>다음 ▶</button>
            </div>
          </div>

          {/* Left page — 3D flip cover → inside shows bg + drawings */}
          <motion.div
            className="book-cover-3d"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: isOpen ? -180 : 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: 'left center', zIndex: isOpen ? 1 : 3 }}
          >
            <div className="cover-front flat-vector" style={{ backgroundColor: styleConf.bg }}>
              <div className="book-binding" style={{ backgroundColor: styleConf.spine }}></div>
              <div className="book-decoration" style={{ fontSize: '5rem', color: styleConf.shapeColor }}>{styleConf.shape}</div>
              <h3 className="flat-title">{book.title}</h3>
            </div>
            <div className="cover-inside flat-inside" style={{ padding: 0, background: '#e0f2fe' }}>
              {renderLeftPage()}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------- ARCHIVE MODAL ----------------------
function ArchiveModal({ books, onClose, onBookClick, onDelete }) {
  return (
    <div className="reader-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="reader-close-area" onClick={onClose} />
      <motion.div 
        className="archive-modal-content"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <button className="close-button" onClick={onClose} style={{ top: '-15px', right: '-15px' }}>×</button>
        <h2 className="archive-title">🎁 나의 비밀 책 꾸러미</h2>
        <p className="archive-subtitle">예전에 읽었던 소중한 책들이 모두 모여있어요!</p>
        
        <div className="archive-grid">
          {books.map((book, idx) => (
            <BookCover 
              key={book.id} 
              book={book} 
              idx={idx} 
              onClick={(b) => { onClose(); onBookClick(b); }} 
              onDelete={onDelete} 
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------- TOY DECORATIONS ----------------------
function ToyDecorations() {
  return (
    <div className="decorations-layer">
      {/* Top Left: Teddy Bear */}
      <motion.div className="toy toy-bear" animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <svg viewBox="0 0 100 100" width="130" height="130">
          <circle cx="30" cy="30" r="12" fill="#d99b78" />
          <circle cx="30" cy="30" r="6" fill="#bd7653" />
          <circle cx="70" cy="30" r="12" fill="#d99b78" />
          <circle cx="70" cy="30" r="6" fill="#bd7653" />
          <circle cx="20" cy="80" r="15" fill="#d99b78" />
          <circle cx="20" cy="80" r="8" fill="#fdfdfd" />
          <circle cx="80" cy="80" r="15" fill="#d99b78" />
          <circle cx="80" cy="80" r="8" fill="#fdfdfd" />
          <ellipse cx="50" cy="70" rx="35" ry="30" fill="#cc855a" />
          <ellipse cx="50" cy="72" rx="25" ry="20" fill="#d99b78" />
          <circle cx="50" cy="45" r="25" fill="#d99b78" />
          <ellipse cx="50" cy="52" rx="12" ry="10" fill="#fdfdfd" />
          <circle cx="43" cy="42" r="2.5" fill="#4a3b32" />
          <circle cx="57" cy="42" r="2.5" fill="#4a3b32" />
          <ellipse cx="50" cy="49" rx="4" ry="3" fill="#4a3b32" />
          <path d="M 50 52 Q 50 57 55 57" stroke="#4a3b32" strokeWidth="1.5" fill="none" />
          <path d="M 50 52 Q 50 57 45 57" stroke="#4a3b32" strokeWidth="1.5" fill="none" />
          <path d="M 35 60 Q 50 70 65 60 L 50 58 Z" fill="#fccd2a" />
          <path d="M 50 63 L 40 85 L 45 85 L 50 68 Z" fill="#fccd2a" />
        </svg>
      </motion.div>

      {/* Top Left inner: Beach Ball */}
      <motion.div className="toy toy-ball" animate={{ rotate: [0, 8, -4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <svg viewBox="0 0 100 100" width="90" height="90">
          <clipPath id="ball-clip"><circle cx="50" cy="50" r="45" /></clipPath>
          <g clipPath="url(#ball-clip)">
            <circle cx="50" cy="50" r="45" fill="#ea4435" />
            <path d="M 5 20 Q 50 50 95 20 L 95 80 Q 50 50 5 80 Z" fill="#5eb4d7" />
            <path d="M 0 35 Q 50 65 100 35 L 100 45 Q 50 75 0 45 Z" fill="#fccd2a" />
          </g>
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="2" />
        </svg>
      </motion.div>

      {/* Top Right: Rocket */}
      <motion.div className="toy toy-rocket" animate={{ y: [0, -6, 0], rotate: [12, 12, 12] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
        <svg viewBox="0 0 100 100" width="110" height="110">
          <path d="M 20 85 Q 25 60 40 60 L 40 85 Z" fill="#ea4435" />
          <path d="M 80 85 Q 75 60 60 60 L 60 85 Z" fill="#ea4435" />
          <polygon points="40,85 50,100 60,85" fill="#fccd2a" />
          <polygon points="45,85 50,95 55,85" fill="#ea4435" />
          <path d="M 50 10 Q 20 40 30 85 L 70 85 Q 80 40 50 10" fill="#fdfdfd" />
          <path d="M 50 10 Q 38 25 35 35 L 65 35 Q 62 25 50 10" fill="#ea4435" />
          <circle cx="50" cy="55" r="15" fill="#fdfdfd" stroke="#ea4435" strokeWidth="4" />
          <circle cx="50" cy="55" r="10" fill="#5eb4d7" />
        </svg>
      </motion.div>

      {/* Bottom Left: Building Blocks */}
      <motion.div className="toy toy-blocks" animate={{ rotate: [0, -2, 2, 0] }} transition={{ duration: 6, repeat: Infinity }}>
        <svg viewBox="0 0 100 100" width="120" height="120">
          <path d="M 35 60 L 65 60 L 65 90 L 55 90 L 55 80 A 5 5 0 0 0 45 80 L 45 90 L 35 90 Z" fill="#fccd2a" />
          <path d="M 70 70 L 100 70 L 100 90 L 90 90 L 90 80 A 5 5 0 0 0 80 80 L 80 90 L 70 90 Z" fill="#5eb4d7" />
          <rect x="15" y="50" width="20" height="20" fill="#f28e46" rx="2" />
          <polygon points="15,50 25,30 35,50" fill="#a4c952" />
          <rect x="40" y="40" width="20" height="20" fill="#5eb4d7" rx="2" />
          <polygon points="40,40 50,20 60,40" fill="#ea4435" />
          <rect x="75" y="50" width="20" height="20" fill="#ea4435" rx="2" />
          <polygon points="75,50 85,30 95,50" fill="#f28e46" />
        </svg>
      </motion.div>

      {/* Bottom Right: Rubber Duck */}
      <motion.div className="toy toy-duck" animate={{ y: [0, -3, 0], rotate: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        <svg viewBox="0 0 100 100" width="100" height="100">
          <path d="M 20 70 Q 20 90 50 90 Q 80 90 85 75 Q 90 60 70 60 Q 60 60 55 50 Q 50 65 20 70" fill="#fccd2a" />
          <path d="M 40 70 Q 50 80 65 70 Q 60 65 50 65 Q 40 65 40 70" fill="#e5b217" />
          <circle cx="35" cy="40" r="18" fill="#fccd2a" />
          <circle cx="40" cy="35" r="3" fill="#333" />
          <circle cx="41" cy="34" r="1" fill="#fff" />
          <polygon points="17,42 28,40 28,46" fill="#ea4435" />
        </svg>
      </motion.div>
    </div>
  );
}

function BookshelfApp() {
  const [books, setBooks] = useState([]);
  const [activeBook, setActiveBook] = useState(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendedWords, setRecommendedWords] = useState([]);

  // 레벨 정보 계산
  function getLevelInfo(totalRead) {
    if (totalRead >= 31) return { label: '👑 전설 작가', next: null, nextAt: null, color: '#f4c430' };
    if (totalRead >= 21) return { label: '✨ 마법 작가', next: '👑 전설 작가', nextAt: 31, color: '#9b59b6' };
    if (totalRead >= 11) return { label: '🌳 꿈나무 작가', next: '✨ 마법 작가', nextAt: 21, color: '#27ae60' };
    return { label: '🌱 새싹 작가', next: '🌳 꿈나무 작가', nextAt: 11, color: '#e67e22' };
  }

  useEffect(() => {
    // Load ACTUAL data from server if available (injected via window object in Jinja)
    if (window.SERVER_DATA && window.SERVER_DATA.stories) {
      const mappedStories = window.SERVER_DATA.stories.map(s => {
        let parsedScenes = [];
        try {
          parsedScenes = (typeof s.scene_data === 'string') ? JSON.parse(s.scene_data) : (s.scene_data || []);
        } catch(e) {}

        let parsedLayout = null;
        try {
          parsedLayout = (typeof s.layout_data === 'string') ? JSON.parse(s.layout_data) : (s.layout_data || null);
        } catch(e) {}

        const mappedPages = [];
        if (parsedLayout && parsedLayout.spreads) {
          parsedLayout.spreads.forEach((spread) => {
            if (spread.type === 'content') {
              const scene = parsedScenes[spread.sceneIdx];
              mappedPages.push({
                type: 'content',
                content_kr: scene ? scene.text : '',
                bgImage: scene ? scene.bg_image : null,
                bgText: (scene && scene.bg) || '',
                mergedImage: spread.mergedImage,
                primaryDrawingId: spread.primaryDrawingId || null,
                secondaryDrawingId: spread.secondaryDrawingId || null,
              });
            } else if (spread.type === 'moral') {
              mappedPages.push({
                type: 'moral',
                content_kr: `💡 교훈:\n${s.moral}`,
                mergedMoralImage: spread.mergedMoralImage
              });
            }
          });
        } else if (parsedScenes && parsedScenes.length > 0) {
          parsedScenes.forEach((scene, i) => {
            mappedPages.push({ 
                page: i + 1, 
                content_kr: scene.text, 
                bgImage: scene.bg_image, 
                bgText: scene.bg || '', 
                mergedImage: scene.merged_image 
            });
          });
          if (s.moral) {
            mappedPages.push({ page: parsedScenes.length + 1, content_kr: `💡 교훈:\n${s.moral}` });
          }
        } else {
          mappedPages.push({ page: 1, content_kr: s.content });
          if (s.moral) mappedPages.push({ page: 2, content_kr: `💡 교훈:\n${s.moral}` });
        }

        // 표지 이미지는 첫 번째 장면의 병합 이미지를 우선적으로 사용
        const coverImg = (parsedScenes && parsedScenes[0] && parsedScenes[0].merged_image) 
                         ? parsedScenes[0].merged_image 
                         : s.illustration_path;

        return {
          id: s.id,
          title: s.title,
          coverImage: coverImg,
          isRead: Boolean(s.is_read || s.isRead),
          pages: mappedPages,
          drawings: s.drawings || []
        };
      });
      setBooks(mappedStories);
    } else {
      setBooks(DUMMY_DATA);
    }
    setIsLoading(false);
  }, []);

  // Fetch words for empty unread shelf recommendation
  useEffect(() => {
    const unreadCount = books.filter(b => !b.isRead).length;
    if (!isLoading && unreadCount === 0 && recommendedWords.length === 0) {
      fetch('/api/words')
        .then(res => res.json())
        .then(data => {
          if(data && data.length > 0) {
            const shuffled = data.sort(() => 0.5 - Math.random());
            setRecommendedWords(shuffled.slice(0, 3));
          }
        })
        .catch(e => console.error("Word fetch failed", e));
    }
  }, [books, isLoading]);

  const deleteBook = async (id) => {
    setBooks(prevBooks => prevBooks.filter(b => b.id !== id));
    try {
      await fetch(`/api/story/${id}`, { method: 'DELETE' });
    } catch(e) {
      console.error("Failed to delete", e);
    }
  };

  const markAsRead = async (id) => {
    setBooks(prevBooks => prevBooks.map(b => b.id === id ? { ...b, isRead: true } : b));
    try {
      await fetch(`/api/story/${id}/read`, { method: 'POST' });
    } catch(e) {
      console.error("Failed to mark as read", e);
    }
  };

  if (isLoading) return <div style={{textAlign:'center', marginTop:'3rem', color:'#d68b39'}}>도서관을 불러오는 중입니다...</div>;

  const renderEmptyUnread = () => (
    <div className="empty-recommendations">
      <p className="empty-shelf-text">모든 책을 다 읽었어요!</p>
      {recommendedWords.length > 0 && (
        <div style={{textAlign: 'center', zIndex: 10, position: 'relative'}}>
          <p style={{color: '#fdfdfd', fontSize: '1.2rem', marginBottom: '10px'}}>새로운 이야기를 그려볼까요?</p>
          <div className="keyword-tags">
            {recommendedWords.map(w => (
              <a key={w.id} href={`/draw/${w.id}`} className="keyword-tag">
                {w.korean} 그리기 🎨
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderEmptyRead = () => (
    <p className="empty-shelf-text">아직 다 읽은 책이 없어요.</p>
  );

  // Separation Logic for Archive
  const unreadBooks = books.filter(b => !b.isRead);
  const allReadBooks = books.filter(b => b.isRead);
  
  // DB는 DESC 정렬 → allReadBooks[0]=최신, allReadBooks[-1]=가장 오래된 것
  // 선반: 최신 9권 (앞쪽), 꾸러미: 나머지 오래된 것들 (FIFO)
  const readBooksOnShelf = allReadBooks.slice(0, 9);   // 최신 9권 → 내가 읽은 책 선반
  const archivedBooks    = allReadBooks.slice(9);       // 오래된 것들 → 책 꾸러미

  const user = window.SERVER_DATA.user || { total_books: 0, badge: '🌱 새싹 작가' };


  return (
    <div className="bookshelf-container flat-vector-bg">
      <ToyDecorations />
      
      <div style={{ position: 'relative' }}>
        <Shelf 
          title="새로 나온 책들 ✨" 
          books={unreadBooks} 
          onBookClick={setActiveBook} 
          onDelete={deleteBook} 
          renderEmpty={renderEmptyUnread} 
        />
      </div>
      
       <div style={{ position: 'relative' }}>
        <Shelf 
          title="내가 읽은 책들 🌟" 
          books={readBooksOnShelf} 
          onBookClick={setActiveBook} 
          onDelete={deleteBook} 
          renderEmpty={renderEmptyRead} 
        />
        
        {/* Archive / Treasure Box Button */}
        {archivedBooks.length > 0 && (
          <div className="archive-treasure-box-container">
            <motion.div 
              className="archive-treasure-box"
              onClick={() => setIsArchiveOpen(true)}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              title={`이전 책 꾸러미 보기 (${archivedBooks.length}권)`}
            >
              <div className="archive-icon">📦</div>
              <div className="archive-label">책 꾸러미</div>
              <div className="archive-count">{archivedBooks.length}</div>
            </motion.div>
          </div>
        )}
      </div>

      {/* 새싹 작가 레벨 카드 (절대 배치되어 책장 정렬에 영향을 주지 않음) */}
      {(() => {
        const totalRead = allReadBooks.length;
        const info = getLevelInfo(totalRead);
        const prevAt = totalRead >= 31 ? 31 : totalRead >= 21 ? 21 : totalRead >= 11 ? 11 : 0;
        const nextAt = info.nextAt || (prevAt + 10);
        const progress = info.next
          ? Math.min(100, Math.round(((totalRead - prevAt) / (nextAt - prevAt)) * 100))
          : 100;
        return (
          <motion.div
            className="level-card absolute-pos"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="level-card-badge" style={{ background: info.color }}>
              {info.label.split(' ')[0]}
            </div>
            <div className="level-card-info">
              <div className="level-card-title">{info.label}</div>
              <div className="level-card-sub">읽은 책 <strong>{totalRead}</strong>권</div>
              {info.next && (
                <div className="level-progress-wrap">
                  <div className="level-progress-bar">
                    <div className="level-progress-fill" style={{ width: `${progress}%`, background: info.color }} />
                  </div>
                  <span className="level-progress-label">{info.next}까지 {nextAt - totalRead}권 남음</span>
                </div>
              )}
              {!info.next && <div className="level-card-sub" style={{color: info.color}}>최고 레벨 달성! 🎉</div>}
            </div>
          </motion.div>
        );
      })()}

      <AnimatePresence>
        {activeBook && (
          <StoryModal book={activeBook} idx={books.findIndex(b => b.id === activeBook.id)} onClose={() => setActiveBook(null)} onReadComplete={markAsRead} />
        )}
        {isArchiveOpen && (
          <ArchiveModal books={archivedBooks} onClose={() => setIsArchiveOpen(false)} onBookClick={setActiveBook} onDelete={deleteBook} />
        )}
      </AnimatePresence>
    </div>
  );
}

const rootEl = document.getElementById('bookshelf-root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<BookshelfApp />);
}
