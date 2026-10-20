import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { 
  X, 
  Clock, 
  BookOpen, 
  Ticket, 
  ArrowRight, 
  ArrowLeft,
  ArrowUpRight,
  User, 
  Flame, 
  Sparkles, 
  Music, 
  MapPin, 
  Maximize2,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import SpotifyIcon from './icons/SpotifyIcon';
import './ActivityDetailModal.css';

const ActivityDetailModal = ({ 
  activity, 
  activities = [], 
  isOpen, 
  onClose, 
  onSelectWorkshop,
  selectedWorkshopId 
}) => {
  // Lista unificada de actividades para carrusel / scroll continuo
  const items = useMemo(() => {
    if (Array.isArray(activities) && activities.length > 0) {
      return activities;
    }
    return activity ? [activity] : [];
  }, [activities, activity]);

  // Índice activo y dirección de animación estilo Instagram
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('next'); // 'next' | 'prev'
  const [animKey, setAnimKey] = useState(0);

  // Visor de foto en pantalla completa pura (Segundo Clic)
  const [isFullPhotoOpen, setIsFullPhotoOpen] = useState(false);

  // Sincronizar índice inicial cuando se abre o cambia la actividad
  useEffect(() => {
    if (!isOpen) {
      setIsFullPhotoOpen(false);
      return;
    }
    if (activity && items.length > 0) {
      const idx = items.findIndex(item => item.id === activity.id);
      if (idx >= 0) {
        setCurrentIndex(idx);
      }
    }
  }, [isOpen, activity, items]);

  // Navegación: Siguiente
  const goToNext = () => {
    if (items.length <= 1) return;
    setSlideDirection('next');
    setAnimKey(prev => prev + 1);
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  // Navegación: Anterior
  const goToPrev = () => {
    if (items.length <= 1) return;
    setSlideDirection('prev');
    setAnimKey(prev => prev + 1);
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  };

  // Navegación directa por índice (Story bar)
  const goToIndex = (idx) => {
    if (idx === currentIndex || idx < 0 || idx >= items.length) return;
    setSlideDirection(idx > currentIndex ? 'next' : 'prev');
    setAnimKey(prev => prev + 1);
    setCurrentIndex(idx);
  };

  // 1. Control por Teclado en PC (Flechas ← y →, Escape) y Bloqueo Absoluto de Scroll en Fondo
  useEffect(() => {
    if (!isOpen) return;

    // Guardar posición exacta actual del scroll y estilos previos
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Bloqueo estricto: evita que el fondo se desplace con scroll de mouse o dedos
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isFullPhotoOpen) {
          setIsFullPhotoOpen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cancelar cualquier touchmove que ocurra en el fondo o fuera del contenedor deslizable
    const handleTouchMove = (e) => {
      const target = e.target;
      const scrollable = target.closest('.modal-info-col, .modal-info-scrollable, .modal-content-box');
      if (!scrollable) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen, isFullPhotoOpen, onClose, items.length, currentIndex]);

  // 2. Soporte Táctil Móvil (Swipe Horizontal Dinámico estilo Instagram)
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    // Detectar swipe horizontal significativo (mínimo 45px y preponderancia horizontal)
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        goToNext(); // Deslizar hacia la izquierda = Siguiente
      } else {
        goToPrev(); // Deslizar hacia la derecha = Anterior
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!isOpen) return null;
  const currentActivity = items[currentIndex] || activity;
  if (!currentActivity) return null;
  if (typeof document === 'undefined') return null;

  const isWorship = Boolean(currentActivity.isWorship || currentActivity.tipo === 'worship');
  const hasSpotify = Boolean(currentActivity.spotifyUrl);
  const isCurrentSelected = Boolean(selectedWorkshopId && selectedWorkshopId === currentActivity.id);

  return createPortal(
    <div 
      className="fullscreen-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-modal-title"
    >
      {/* Flechas de navegación para PC y tablet */}
      {items.length > 1 && !isFullPhotoOpen && (
        <>
          <button 
            type="button" 
            className="modal-nav-arrow arrow-left" 
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            aria-label="Ver actividad anterior (←)"
            title="Anterior (Flecha Izquierda ←)"
          >
            <ChevronLeft size={28} />
          </button>

          <button 
            type="button" 
            className="modal-nav-arrow arrow-right" 
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Ver siguiente actividad (→)"
            title="Siguiente (Flecha Derecha →)"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* ===================================================================
         VISOR DE FOTO EN PANTALLA COMPLETA PURA
         =================================================================== */}
      {isFullPhotoOpen ? (
        <div 
          className="pure-photo-viewer" 
          onClick={(e) => {
            e.stopPropagation();
            setIsFullPhotoOpen(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          title="Clic para volver al modal de información"
        >
          <div className="pure-photo-top-bar" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="pure-photo-back-btn"
              onClick={() => setIsFullPhotoOpen(false)}
            >
              <ArrowLeft size={16} />
              <span>Volver a la información</span>
            </button>

            <div className="pure-photo-actions-right">
              {items.length > 1 && (
                <span className="pure-photo-counter">
                  {currentIndex + 1} / {items.length}
                </span>
              )}

              <button 
                type="button" 
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Cerrar modal (Esc)"
                title="Cerrar (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="pure-photo-wrapper">
            <img 
              src={currentActivity.foto} 
              alt={currentActivity.expositor || currentActivity.titulo} 
              className="pure-photo-img"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="pure-photo-bottom-caption" onClick={(e) => e.stopPropagation()}>
            <span className="pure-photo-name">{currentActivity.titulo || currentActivity.nombre}</span>
            <span className="pure-photo-sub">Usa las flechas ← → o desliza para navegar</span>
          </div>
        </div>
      ) : (
        /* ===================================================================
           MODAL PRINCIPAL INMERSIVO CON SLIDE DINÁMICO ESTILO INSTAGRAM
           =================================================================== */
        <div 
          key={animKey}
          className={`modal-content-box ${isWorship ? 'theme-worship' : 'theme-expositor'} slide-${slideDirection}`}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Barras de progreso estilo Instagram Stories en la parte superior */}
          {items.length > 1 && (
            <div className="modal-story-bars" onClick={(e) => e.stopPropagation()}>
              {items.map((it, idx) => (
                <div 
                  key={it.id || idx} 
                  className={`story-bar-segment ${idx === currentIndex ? 'active' : ''} ${idx < currentIndex ? 'passed' : ''}`}
                  onClick={() => goToIndex(idx)}
                  role="button"
                  tabIndex={0}
                  title={`Ir a: ${it.titulo || it.nombre}`}
                />
              ))}
            </div>
          )}

          {/* Botón de cerrar fijo en la esquina superior derecha */}
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Cerrar modal (Esc)"
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>

          {/* =================================================================
             COLUMNA IZQUIERDA: FOTO LIMPIA (Abre pantalla completa)
             ================================================================= */}
          <div 
            className="modal-image-col is-clickable"
            onClick={() => setIsFullPhotoOpen(true)}
            role="button"
            tabIndex={0}
            title="Toca para ampliar la foto"
          >
            <img 
              src={currentActivity.foto} 
              alt={currentActivity.expositor || currentActivity.titulo} 
              className="modal-img"
            />
          </div>

          {/* =================================================================
             COLUMNA DERECHA: INFORMACIÓN, DESCRIPCIONES Y BOTONES
             ================================================================= */}
          <div className="modal-info-col">
            <div className="modal-info-scrollable">
              
              {/* Badges y Cintas al inicio */}
              <div className="modal-badges-header-row">
                {currentActivity.tag && (
                  <span className={`modal-ribbon-badge ${currentActivity.colorClass || ''}`}>
                    {isWorship ? <Sparkles size={13} /> : <BookOpen size={13} />}
                    <span>{currentActivity.tag}</span>
                  </span>
                )}

                <span className="modal-time-chip">
                  <Clock size={13} />
                  <span>{currentActivity.hora || '5:20 PM'}</span>
                </span>

                {currentActivity.lugar && (
                  <span className="modal-location-chip">
                    <MapPin size={12} />
                    <span>{currentActivity.lugar}</span>
                  </span>
                )}

                {currentActivity.sesionTipo && (
                  <span className="modal-session-chip">{currentActivity.sesionTipo}</span>
                )}
              </div>

              {/* Título de la Actividad / Taller */}
              <div className="modal-titles-block">
                <h2 id="activity-modal-title" className="modal-title">
                  {currentActivity.titulo || currentActivity.nombre}
                </h2>
                {currentActivity.subtitulo && (
                  <span className="modal-subtitle">{currentActivity.subtitulo}</span>
                )}
              </div>

              {/* Ficha del Expositor o Ministerio */}
              <div className="modal-speaker-card">
                <div className="modal-speaker-avatar">
                  {isWorship ? <Music size={18} /> : <User size={18} />}
                </div>
                <div className="modal-speaker-details">
                  <span className="modal-speaker-role">
                    {currentActivity.rol || (isWorship ? 'Ministerio' : 'Expositor')}:
                  </span>
                  <strong className="modal-speaker-name">
                    {currentActivity.expositor || (isWorship ? 'Worship Team IBC' : '')}
                  </strong>
                  {currentActivity.iglesia && (
                    <span className="modal-speaker-church">{currentActivity.iglesia}</span>
                  )}
                </div>
              </div>

              {/* Enfoque Temático */}
              {currentActivity.enfoque && (
                <div className="modal-focus-box">
                  <Flame size={14} className="focus-icon" />
                  <span><strong>Enfoque:</strong> {currentActivity.enfoque}</span>
                </div>
              )}

              {/* Pregunta Reflexiva */}
              {currentActivity.pregunta && (
                <blockquote className="modal-quote">
                  "{currentActivity.pregunta}"
                </blockquote>
              )}

              {/* Descripción */}
              <div className="modal-desc-box">
                <h4 className="modal-desc-heading">
                  {isWorship ? 'Sobre esta noche de adoración:' : 'Acerca de este taller:'}
                </h4>
                <p className="modal-desc-text">
                  {currentActivity.descripcion}
                </p>
              </div>

            </div>

            {/* ZONA DE ACCIONES Y BOTONES */}
            <div className="modal-actions-box">
              {hasSpotify && (
                <a 
                  href={currentActivity.spotifyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-outline-spotify"
                  title="Escuchar canciones en Spotify"
                >
                  <SpotifyIcon size={16} />
                  <span>Playlist Oficial</span>
                  <ArrowUpRight size={14} />
                </a>
              )}

              {onSelectWorkshop ? (
                !isWorship ? (
                  <button 
                    type="button" 
                    className={`btn-modal-cta-primary ${isCurrentSelected ? 'is-selected' : ''}`}
                    onClick={() => {
                      onSelectWorkshop(currentActivity.id);
                    }}
                    title={isCurrentSelected ? 'Taller ya seleccionado' : 'Elegir este taller para tu entrada'}
                  >
                    {isCurrentSelected ? (
                      <>
                        <CheckCircle size={16} />
                        <span>✓ Taller Seleccionado</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Elegir este Taller</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="modal-included-badge">
                    <Sparkles size={14} />
                    <span>100% Incluido con tu Entrada</span>
                  </div>
                )
              ) : (
                <Link 
                  to="/registro" 
                  className="btn-modal-cta-primary"
                  onClick={onClose}
                >
                  <Ticket size={16} />
                  <span>{isWorship ? 'Registrarme a la Conferencia' : 'Elegir Taller en Registro'}</span>
                  <ArrowRight size={15} />
                </Link>
              )}

              <button 
                type="button" 
                className="btn-modal-dismiss" 
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>

            {/* Indicador de ayuda de navegación / teclado en PC */}
            {items.length > 1 && (
              <div className="modal-keyboard-hints">
                <span className="kbd-chip">← Anterior</span>
                <span className="kbd-counter">{currentIndex + 1} de {items.length}</span>
                <span className="kbd-chip">Siguiente →</span>
              </div>
            )}

          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default ActivityDetailModal;
