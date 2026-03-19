import React, { useState, useEffect } from 'react';
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
        {styleConf.shape}
      </div>

      <div className="book-cover-title">{book.title}</div>
    </motion.div>
  );
}

// Sub-component: Bookshelf Section matching reference
function Shelf({ title, books, onBookClick, onDelete, renderEmpty, showBadges }) {
  const earnedBadges = books.map((_, i) => BADGE_LIST[i % BADGE_LIST.length]);

  return (
    <div className="shelf-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
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

      {showBadges && earnedBadges.length > 0 && (
        <div className="badge-showcase-board">
          <h4 style={{ margin: '0 15px 0 0', color: '#555', fontSize: '1.2rem', textShadow: 'none', whiteSpace: 'nowrap' }}>🎖️ 나의 뱃지</h4>
          <div className="badge-collection">
            {earnedBadges.map((badge, i) => (
              <motion.span 
                key={i} 
                className="reward-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: i * 0.1 }}
                title={`${i+1}번째 다 읽은 책 보상!`}
              >
                {badge}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Overlaid Story Reader (Keeping existing logic, tweaking aesthetics)
function StoryModal({ book, idx, onClose, onReadComplete }) {
  const styleConf = getVectorStyle(book.id);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

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
      onClose();
      if (!book.isRead && hasReachedEnd) onReadComplete(book.id);
    }, 400); 
  };

  const currentPageContent = book.pages[currentPageIndex]?.content_kr || "내용이 없습니다.";

  return (
    <div className="reader-overlay">
      <div className="reader-close-area" onClick={handleClose} />
      
      <motion.div 
        layoutId={`book-wrapper-${book.id}`}
        className="opened-book-container"
        initial={{ borderRadius: 4 }}
        animate={{ borderRadius: 12 }}
        transition={{ layout: { type: "tween", ease: [0.4, 0, 0.2, 1], duration: 0.5 } }}
      >
        <div className="book-volume">
          <div className="book-pages" style={{ left: '50%' }}>
            <button className="close-button" onClick={handleClose}>×</button>
            <h2 className="story-title" style={{color: styleConf.bg}}>{book.title}</h2>
            
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
            <div className="cover-inside flat-inside">
              <h3>{book.title}</h3>
              <p>나만의 도서관 📚</p>
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

  useEffect(() => {
    // Load ACTUAL data from server if available (injected via window object in Jinja)
    if (window.SERVER_DATA && window.SERVER_DATA.stories) {
      const mappedStories = window.SERVER_DATA.stories.map(s => ({
        id: s.id,
        title: s.title,
        coverImage: s.illustration_path,
        isRead: Boolean(s.is_read || s.isRead),
        pages: [
          { page: 1, content_kr: s.content },
          ...(s.moral ? [{ page: 2, content_kr: s.moral }] : [])
        ]
      }));
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
  
  // Show only the 9 newest read books on the shelf, the rest go to archive
  const readBooksOnShelf = allReadBooks.slice(-9); // Get last 9 read books (newest)
  const archivedBooks = allReadBooks.slice(0, Math.max(0, allReadBooks.length - 9)); // The older ones

  return (
    <div className="bookshelf-container flat-vector-bg">
      <ToyDecorations />
      
      <Shelf 
        title="새로 나온 책들 ✨" 
        books={unreadBooks} 
        onBookClick={setActiveBook} 
        onDelete={deleteBook} 
        renderEmpty={renderEmptyUnread} 
      />
      
      <div style={{ position: 'relative', height: '100%' }}>
        <Shelf 
          title="내가 읽은 책들 🌟" 
          books={readBooksOnShelf} 
          onBookClick={setActiveBook} 
          onDelete={deleteBook} 
          renderEmpty={renderEmptyRead} 
          showBadges={true} 
        />
        
        {/* Archive / Treasure Box Button */}
        {archivedBooks.length > 0 && (
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
        )}
      </div>

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
