import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import InstagramIcon from './icons/InstagramIcon';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import './Lightbox.css';

const Lightbox = ({ images, activeIndex, onClose, onPrev, onNext }) => {
  const [slideDirection, setSlideDirection] = useState('next');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentDrag = useRef(0);

  const isOpen = activeIndex !== null && !!(images && images[activeIndex]);

  // Bloquear scroll de fondo de forma segura y coordinada
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isOpen]);

  const handlePrev = () => {
    setSlideDirection('prev');
    setDragOffset(0);
    onPrev?.();
  };

  const handleNext = () => {
    setSlideDirection('next');
    setDragOffset(0);
    onNext?.();
  };

  // Atajos de teclado (Escape, Flechas)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'ArrowLeft' && onPrev) {
        e.preventDefault();
        e.stopPropagation();
        handlePrev();
      }
      if (e.key === 'ArrowRight' && onNext) {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onPrev, onNext, onClose]);

  if (activeIndex === null || !images || !images[activeIndex]) return null;

  const currentItem = images[activeIndex];
  const src = typeof currentItem === 'string' ? currentItem : currentItem.src;
  const caption = typeof currentItem === 'string' ? 'Momento de la comunidad Upper Room IBC' : currentItem.caption;


  // Arrastre y deslizamiento táctil fluido (swipe en tiempo real)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    currentDrag.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Movimiento fluido horizontal
    if (Math.abs(diffX) > Math.abs(diffY)) {
      currentDrag.current = diffX;
      setDragOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const swipeThreshold = 45; // umbral de sensibilidad
    const diff = currentDrag.current;

    if (diff < -swipeThreshold) {
      handleNext();
    } else if (diff > swipeThreshold) {
      handlePrev();
    } else {
      setDragOffset(0);
    }

    touchStartX.current = 0;
    currentDrag.current = 0;
  };

  return (
    <div 
      className="lightbox-backdrop" 
      onClick={onClose}
      onWheel={(e) => { e.stopPropagation(); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Barra superior flotante (en móvil y escritorio) */}
      <div className="lightbox-top-bar" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-top-left-group">
          <a 
            href="https://www.instagram.com/upperroomibcrd/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="lightbox-brand-link"
            title="Abrir perfil de Instagram @upperroomibcrd"
            onClick={(e) => e.stopPropagation()}
          >
            <InstagramIcon size={15} className="ig-icon" />
            <span className="brand-text">@upperroomibcrd</span>
          </a>
          <span className="counter-pill">{activeIndex + 1} / {images.length}</span>
        </div>

        <button 
          className="lightbox-btn-close" 
          onClick={onClose} 
          aria-label="Cerrar (Esc)" 
          title="Cerrar (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Flechas laterales para escritorio (ubicadas en el fondo oscuro exterior) */}
      {images.length > 1 && (
        <>
          <button 
            className="lightbox-nav-btn desktop-nav prev" 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            aria-label="Anterior (Flecha izquierda)"
            title="Anterior"
          >
            <ChevronLeft size={36} />
          </button>

          <button 
            className="lightbox-nav-btn desktop-nav next" 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            aria-label="Siguiente (Flecha derecha)"
            title="Siguiente"
          >
            <ChevronRight size={36} />
          </button>
        </>
      )}

      {/* Contenedor central con pista de arrastre dinámica y fluida */}
      <div 
        className="lightbox-center-container" 
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div 
          className={`lightbox-slide-track ${isDragging ? 'is-dragging' : ''}`}
          style={{
            transform: dragOffset ? `translate3d(${dragOffset}px, 0, 0)` : undefined,
            opacity: dragOffset ? Math.max(0.65, 1 - Math.abs(dragOffset) / 450) : 1
          }}
        >
          <div className="lightbox-image-frame">
            <img 
              key={activeIndex} 
              src={src} 
              alt={caption} 
              className={`lightbox-full-img slide-anim-${slideDirection}`} 
              draggable={false}
            />
          </div>
        </div>

        {/* Descripción transparente degradada en la parte inferior */}
        <div className="lightbox-meta-overlay">
          <div className="lightbox-meta-content">
            <p className="lightbox-caption">{caption}</p>

            {/* Controles de navegación y puntos indicadores para móvil */}
            {images.length > 1 && (
              <div className="lightbox-mobile-nav">
                <button 
                  type="button" 
                  className="lightbox-mobile-btn prev"
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  aria-label="Anterior afiche"
                >
                  <ChevronLeft size={17} />
                  <span>Anterior</span>
                </button>

                <div className="lightbox-mobile-dots">
                  {images.map((_, idx) => (
                    <span 
                      key={idx} 
                      className={`lightbox-dot ${idx === activeIndex ? 'is-active' : ''}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <button 
                  type="button" 
                  className="lightbox-mobile-btn next"
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  aria-label="Siguiente afiche"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Lightbox;
