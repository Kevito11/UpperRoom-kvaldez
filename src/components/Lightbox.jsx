import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import InstagramIcon from './icons/InstagramIcon';
import './Lightbox.css';

const Lightbox = ({ images, activeIndex, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  if (activeIndex === null || !images || !images[activeIndex]) return null;

  const currentItem = images[activeIndex];
  const src = typeof currentItem === 'string' ? currentItem : currentItem.src;
  const caption = typeof currentItem === 'string' ? 'Momento de la comunidad Upper Room IBC' : currentItem.caption;
  const likes = typeof currentItem === 'object' ? currentItem.likes : 45;

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <button className="lightbox-btn-close" onClick={onClose} aria-label="Cerrar">
        <X size={26} />
      </button>

      {activeIndex > 0 && (
        <button 
          className="lightbox-nav-btn prev" 
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Anterior"
        >
          <ChevronLeft size={36} />
        </button>
      )}

      {activeIndex < images.length - 1 && (
        <button 
          className="lightbox-nav-btn next" 
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Siguiente"
        >
          <ChevronRight size={36} />
        </button>
      )}

      <div className="lightbox-center-container" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-image-frame">
          <img src={src} alt={caption} className="lightbox-full-img" />
        </div>

        <div className="lightbox-meta">
          <div className="lightbox-ig-brand">
            <InstagramIcon size={18} className="ig-icon" />
            <span>@upperroomibcrd</span>
          </div>
          <p className="lightbox-caption">{caption}</p>
          <div className="lightbox-counter">
            {activeIndex + 1} de {images.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lightbox;
