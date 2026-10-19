import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  ArrowUpRight, 
  Clock, 
  MapPin, 
  X, 
  Info 
} from 'lucide-react';
import './InstagramHighlights.css';

/**
 * CONFIGURACIÓN DE PUBLICACIONES CON HORARIOS ESTRICTOS
 * 
 * 1. Servicio de Siervos (121):
 *    - Día: Viernes (5)
 *    - Horario: 20:00 (08:00 PM) a 22:00 (10:00 PM)
 *    - Ubicación: Salón Multiusos
 *    - Archivo local: /assets/121.jpeg
 * 
 * 2. Culto de Jóvenes Para Cristo (JOPECE):
 *    - Día: Sábado (6)
 *    - Horario: 19:00 (07:00 PM) a 21:00 (09:00 PM)
 *    - Edades: 12-17
 *    - Ubicación: Salón Multiusos
 *    - Archivos locales: /assets/JPC - 1.jpeg y /assets/JPC - 2.jpeg
 */
const INSTAGRAM_PUBLICATIONS = [
  {
    id: 'siervos-post',
    badge: 'Servicio de Siervos',
    ministerio: 'Siervos Para Cristo · OneTwentyOne',
    titulo: 'Servicio de Siervos',
    subtitulo: 'Jóvenes adultos (18+) · Salón Multiusos',
    horarioTexto: 'Viernes 08:00 PM - 10:00 PM',
    ubicacion: 'Salón Multiusos',
    instagramUrl: 'https://www.instagram.com/p/DehdiWgzxOV/',
    images: [
      '/assets/121.jpeg'
    ],
    schedule: {
      dayOfWeek: 5,   // Viernes
      startHour: 20,  // 08:00 PM (20:00)
      startMinute: 0,
      endHour: 22,    // 10:00 PM (22:00)
      endMinute: 0
    }
  },
  {
    id: 'jopece-post',
    badge: 'Culto de JOPECE · Carrusel',
    ministerio: 'Jóvenes Para Cristo · JOPECE',
    titulo: 'Culto de Jóvenes Para Cristo (JOPECE)',
    subtitulo: 'Adolescentes (Edades 12-17) · Salón Multiusos',
    horarioTexto: 'Sábados 07:00 PM - 09:00 PM',
    ubicacion: 'Salón Multiusos',
    instagramUrl: 'https://www.instagram.com/p/DehVplDETsA/?img_index=1',
    images: [
      '/assets/JPC - 1.jpeg',
      '/assets/JPC - 2.jpeg'
    ],
    schedule: {
      dayOfWeek: 6,   // Sábado
      startHour: 19,  // 07:00 PM (19:00)
      startMinute: 0,
      endHour: 21,    // 09:00 PM (21:00)
      endMinute: 0
    }
  }
];

/**
 * Evaluación estricta de horarios:
 * - Evalúa getDay(), getHours() y getMinutes().
 * - Si currentTime supera endHour:endMinute (ej. Viernes 22:01 para Siervos), isExpired = true.
 * - Si currentTime coincide con la ventana del evento, isLive = true (Badge '🔴 EN VIVO').
 * - Si es el mismo día antes del inicio, isToday = true (Badge '⚡ HOY').
 */
export function evaluateEventStatus(post, currentTime) {
  const currentDay = currentTime.getDay(); // 0: Domingo, 1: Lun, ..., 5: Viernes, 6: Sábado
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const targetDay = post.schedule.dayOfWeek;
  const startMinutes = post.schedule.startHour * 60 + post.schedule.startMinute;
  const endMinutes = post.schedule.endHour * 60 + post.schedule.endMinute;

  // 1. Mismo día del servicio
  if (currentDay === targetDay) {
    if (currentMinutes > endMinutes) {
      return { isExpired: true, isLive: false, isToday: true, badgeText: null };
    }
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return { isExpired: false, isLive: true, isToday: true, badgeText: '🔴 EN VIVO' };
    }
    return { isExpired: false, isLive: false, isToday: true, badgeText: '⚡ HOY' };
  }

  // 2. Días posteriores en la semana (evento ya concluido en el ciclo semanal)
  if (targetDay === 5 && (currentDay === 6 || currentDay === 0)) {
    return { isExpired: true, isLive: false, isToday: false, badgeText: null };
  }
  if (targetDay === 6 && currentDay === 0) {
    return { isExpired: true, isLive: false, isToday: false, badgeText: null };
  }

  // 3. Días previos en la semana (anuncio activo)
  const isTomorrow = (currentDay + 1) % 7 === targetDay;
  return { 
    isExpired: false, 
    isLive: false, 
    isToday: false, 
    badgeText: isTomorrow ? '📅 MAÑANA' : null 
  };
}

/**
 * Modal Lightbox de Pantalla Completa con Zoom Táctil Avanzado y Modo Inmersivo Real
 * 
 * Características Senior:
 * 1. Cero botones estáticos de zoom: Zoom 100% orgánico mediante gestos de pellizco (pinch-to-zoom) y doble toque.
 * 2. Modo Inmersivo Reactivo: Al superar escala 1 (zoom > 1), toda la interfaz (título, horario, ubicación, botón Instagram y X de cierre)
 *    se desvanece suavemente con transiciones fluidas de opacidad. Al volver a 1x, reaparece (fade-in).
 * 3. Carrusel Táctil Fluido (CSS Scroll Snap): Para publicaciones múltiples (JOPECE), cada foto se ajusta con scroll-snap-align: center.
 * 4. Condición Anti-Conflicto Estricta:
 *    - scale === 1: Swipe horizontal libre para navegar entre fotos.
 *    - scale > 1: El carrusel bloquea su overflow y scroll-snap; el movimiento del dedo se dedica exclusivamente al paneo libre
 *      por los detalles de la foto ampliada, imposibilitando saltos de diapositiva.
 */
function InstagramLightboxModal({ post, initialSlideIndex = 0, onClose }) {
  const images = Array.isArray(post.images) && post.images.length > 0 ? post.images : ['/assets/121.jpeg'];
  const hasMultiple = images.length > 1;

  const [activeSlideIndex, setActiveSlideIndex] = useState(
    Math.min(Math.max(0, initialSlideIndex), images.length - 1)
  );
  const [isZoomed, setIsZoomed] = useState(false);
  const [isManualUIHidden, setIsManualUIHidden] = useState(false);

  // Referencias para control de escala síncrono e interacción táctil
  const currentScaleRef = useRef(1);
  const transformRef = useRef(null);
  const trackRef = useRef(null);
  const isScrollingRef = useRef(false);
  const stagePointerStartRef = useRef({ x: 0, y: 0, time: 0 });
  const imagePointerStartRef = useRef({ x: 0, y: 0, time: 0 });
  const singleTapTimerRef = useRef(null);

  const isImmersive = isZoomed || isManualUIHidden;

  // Limpieza de temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  // Sincronización del carrusel con la diapositiva inicial
  useEffect(() => {
    if (trackRef.current && initialSlideIndex > 0) {
      const width = trackRef.current.clientWidth;
      if (width > 0) {
        trackRef.current.scrollTo({
          left: initialSlideIndex * width,
          behavior: 'instant'
        });
      }
    }
  }, [initialSlideIndex]);

  // Desplazamiento a una diapositiva específica
  const scrollToSlide = useCallback((index, smooth = true) => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.clientWidth;
    if (width <= 0) return;

    // Resetear zoom al cambiar de diapositiva
    if (transformRef.current) {
      transformRef.current.resetTransform();
    }
    currentScaleRef.current = 1;
    setIsZoomed(false);

    isScrollingRef.current = true;
    track.scrollTo({
      left: index * width,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setActiveSlideIndex(index);

    setTimeout(() => {
      isScrollingRef.current = false;
    }, smooth ? 320 : 60);
  }, []);

  const goToNextSlide = useCallback(() => {
    if (!hasMultiple) return;
    const nextIdx = (activeSlideIndex + 1) % images.length;
    scrollToSlide(nextIdx, true);
  }, [activeSlideIndex, hasMultiple, images.length, scrollToSlide]);

  const goToPrevSlide = useCallback(() => {
    if (!hasMultiple) return;
    const prevIdx = (activeSlideIndex - 1 + images.length) % images.length;
    scrollToSlide(prevIdx, true);
  }, [activeSlideIndex, hasMultiple, images.length, scrollToSlide]);

  // Manejo de eventos de teclado (Escape, Flechas)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isZoomed) {
          transformRef.current?.resetTransform();
          currentScaleRef.current = 1;
          setIsZoomed(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' && !isZoomed) {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' && !isZoomed) {
        goToPrevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed, goToNextSlide, goToPrevSlide, onClose]);

  // Sincronización del índice al deslizar en el carrusel (Scroll Snap nativo)
  const handleTrackScroll = () => {
    if (isScrollingRef.current || currentScaleRef.current > 1.01) return;
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, clientWidth } = track;
    if (clientWidth > 0) {
      const newIndex = Math.round(scrollLeft / clientWidth);
      if (newIndex !== activeSlideIndex && newIndex >= 0 && newIndex < images.length) {
        setActiveSlideIndex(newIndex);
        if (transformRef.current) {
          transformRef.current.resetTransform();
        }
        currentScaleRef.current = 1;
        setIsZoomed(false);
      }
    }
  };

  // Detección en tiempo real de escala y transición automática a Modo Inmersivo
  const handleTransform = useCallback((ref) => {
    if (!ref || !ref.state) return;
    const scale = ref.state.scale;
    currentScaleRef.current = scale;

    if (scale > 1.01) {
      if (!isZoomed) setIsZoomed(true);
    } else {
      if (isZoomed) setIsZoomed(false);
    }
  }, [isZoomed]);

  // Detección de toques sobre el escenario (Backdrop)
  const handleStagePointerDown = (e) => {
    stagePointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  };

  // Clic en el fondo oscuro: cierra el modal si no hay zoom activo
  const handleBackdropClick = (e) => {
    const dist = Math.hypot(
      e.clientX - stagePointerStartRef.current.x,
      e.clientY - stagePointerStartRef.current.y
    );
    const duration = Date.now() - stagePointerStartRef.current.time;

    if (dist < 8 && duration < 300) {
      if (currentScaleRef.current > 1.01) {
        // Si hay zoom, un clic en el fondo resetea la escala a 1x
        transformRef.current?.resetTransform();
        currentScaleRef.current = 1;
        setIsZoomed(false);
      } else {
        onClose();
      }
    }
  };

  // Detección de toques sobre la imagen para alternar Modo Inmersivo sin conflicto con doble toque
  const handleImagePointerDown = (e) => {
    imagePointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    const dist = Math.hypot(
      e.clientX - imagePointerStartRef.current.x,
      e.clientY - imagePointerStartRef.current.y
    );
    const duration = Date.now() - imagePointerStartRef.current.time;

    // Solo evaluar como un toque intencional si no fue un arrastre
    if (dist < 8 && duration < 300) {
      if (singleTapTimerRef.current) {
        // Es un doble toque: react-zoom-pan-pinch se encarga del zoom orgánico
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      } else {
        // Toque simple: alternar visibilidad de la UI de forma limpia
        singleTapTimerRef.current = setTimeout(() => {
          singleTapTimerRef.current = null;
          if (currentScaleRef.current <= 1.01) {
            setIsManualUIHidden(prev => !prev);
          }
        }, 220);
      }
    }
  };

  return (
    <div 
      className={`ig-lightbox-modal ${isImmersive ? 'is-immersive' : ''} ${isZoomed ? 'is-zoomed' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalles de ${post.titulo}`}
      onClick={handleBackdropClick}
      onPointerDown={handleStagePointerDown}
    >
      {/* Fondo Oscuro con Desenfoque */}
      <div className="ig-lightbox-backdrop" />

      {/* 1. Barra Superior Flotante: Badge, Contador y Botón de Cierre */}
      <header className="ig-lightbox-top-bar" onClick={(e) => e.stopPropagation()}>
        <div className="ig-lightbox-top-left">
          <span className="ig-lightbox-badge">{post.badge}</span>
          {hasMultiple && (
            <span className="ig-lightbox-counter">
              {activeSlideIndex + 1} / {images.length}
            </span>
          )}
        </div>

        <button 
          type="button" 
          className="ig-lightbox-close-btn"
          onClick={onClose}
          aria-label="Cerrar modal"
          title="Cerrar (Esc o clic fuera)"
        >
          <X size={20} />
        </button>
      </header>

      {/* 2. Flechas de Navegación Lateral (Solo si hay múltiples fotos) */}
      {hasMultiple && (
        <>
          <button
            type="button"
            className="ig-lightbox-nav-btn prev"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevSlide();
            }}
            aria-label="Foto anterior"
            title="Foto anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="ig-lightbox-nav-btn next"
            onClick={(e) => {
              e.stopPropagation();
              goToNextSlide();
            }}
            aria-label="Siguiente foto"
            title="Siguiente foto"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* 3. Viewport Principal con Carrusel CSS Scroll Snap y Zoom Táctil */}
      <div className="ig-lightbox-viewport">
        <div 
          ref={trackRef}
          className={`ig-lightbox-carousel-track ${isZoomed ? 'is-zoom-locked' : ''}`}
          onScroll={handleTrackScroll}
        >
          {images.map((src, idx) => (
            <div key={idx} className="ig-lightbox-slide">
              {idx === activeSlideIndex ? (
                <TransformWrapper
                  ref={transformRef}
                  initialScale={1}
                  minScale={1}
                  maxScale={4}
                  centerOnInit={true}
                  smooth={true}
                  disabled={false}
                  doubleClick={{
                    disabled: false,
                    mode: 'toggle',
                    step: 1.5,
                    animationTime: 220
                  }}
                  pinch={{ disabled: false, step: 5 }}
                  panning={{ 
                    disabled: false, 
                    velocityDisabled: false 
                  }}
                  velocityAnimation={{
                    disabled: false,
                    sensitivityTouch: 1,
                    animationTime: 400,
                    animationType: 'easeOutQuart',
                    inertia: 0.95
                  }}
                  wheel={{ step: 0.15 }}
                  onTransformed={handleTransform}
                  onZoom={handleTransform}
                  onPinching={handleTransform}
                  onPanning={handleTransform}
                >
                  <TransformComponent
                    wrapperClass="ig-lightbox-transform-wrapper"
                    contentClass="ig-lightbox-transform-content"
                    wrapperProps={{
                      onClick: handleBackdropClick,
                      onPointerDown: handleStagePointerDown
                    }}
                    contentProps={{
                      onClick: handleBackdropClick,
                      onPointerDown: handleStagePointerDown
                    }}
                  >
                    <img 
                      src={src}
                      alt={`${post.titulo} - Foto ${idx + 1}`}
                      className="ig-lightbox-hero-img"
                      draggable={false}
                      onPointerDown={handleImagePointerDown}
                      onClick={handleImageClick}
                      title="Pellizca para zoom natural • Doble toque para acercar • Toca para pantalla limpia"
                    />
                  </TransformComponent>
                </TransformWrapper>
              ) : (
                <div className="ig-lightbox-transform-wrapper">
                  <img 
                    src={src}
                    alt={`${post.titulo} - Foto ${idx + 1}`}
                    className="ig-lightbox-hero-img"
                    draggable={false}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Barra Inferior Flotante: Título, Horarios, Ubicación y Botón Instagram */}
      <footer className="ig-lightbox-bottom-bar" onClick={(e) => e.stopPropagation()}>
        <div className="ig-lightbox-info-group">
          <h3 className="ig-lightbox-title">{post.titulo}</h3>
          <p className="ig-lightbox-subtext">{post.subtitulo}</p>
          
          <div className="ig-lightbox-pills-row">
            <div className="ig-lightbox-pill">
              <Clock size={14} className="ig-lightbox-pill-icon" />
              <span>{post.horarioTexto}</span>
            </div>
            <div className="ig-lightbox-pill">
              <MapPin size={14} className="ig-lightbox-pill-icon" />
              <span>{post.ubicacion}</span>
            </div>
          </div>
        </div>

        {/* Botón CTA hacia la publicación oficial de Instagram */}
        <a
          href={post.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ig-lightbox-cta-btn"
          title="Ver publicación completa en Instagram"
        >
          <Sparkles size={15} />
          <span>Ver publicación en Instagram</span>
          <ArrowUpRight size={15} />
        </a>

        {/* Indicadores de paginación (Dots) para JOPECE */}
        {hasMultiple && (
          <div className="ig-lightbox-dots-row">
            {images.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                className={`ig-lightbox-dot ${dotIdx === activeSlideIndex ? 'active' : ''}`}
                onClick={() => scrollToSlide(dotIdx, true)}
                aria-label={`Ir a foto ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Hint amigable de gestos táctiles */}
        <div className="ig-lightbox-gestures-hint">
          <span>Pellizca para zoom natural • Doble toque para acercar • Desliza para cambiar foto</span>
        </div>
      </footer>
    </div>
  );
}

/**
 * Tarjeta individual de Publicación
 */
function PublicationCard({ 
  post, 
  currentTime, 
  forcePreview, 
  onOpenModal 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const images = post.images;
  const hasMultiple = images.length > 1;

  // Evaluación estricta de horarios
  const status = evaluateEventStatus(post, currentTime);

  // Auto-expiración estricta: si concluyó el culto, retorna null y desaparece del DOM
  if (status.isExpired && !forcePreview) {
    return null;
  }

  const badgeLabel = forcePreview ? '🔴 EN VIVO' : status.badgeText;
  const isLivePulse = status.isLive || forcePreview;
  const isTodayBadge = badgeLabel?.includes('⚡') || badgeLabel?.includes('HOY') || badgeLabel?.includes('MAÑANA');

  // Desplazamiento suave para carrusel en escritorio y controles
  const scrollToSlide = (index) => {
    if (!trackRef.current) return;
    const width = trackRef.current.clientWidth;
    trackRef.current.scrollTo({
      left: index * width,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  const nextSlide = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const nextIdx = (currentIndex + 1) % images.length;
    scrollToSlide(nextIdx);
  };

  const prevSlide = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    scrollToSlide(prevIdx);
  };

  // Sincronización automática de índice y dots con el Scroll Snap nativo
  const handleScroll = () => {
    if (!trackRef.current) return;
    const { scrollLeft, clientWidth } = trackRef.current;
    if (clientWidth > 0) {
      const newIndex = Math.round(scrollLeft / clientWidth);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
        setCurrentIndex(newIndex);
      }
    }
  };

  // Detección de swipe en JOPECE: no activar el modal accidentalmente al deslizar
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e) => {
    const diffX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (diffX > 8 || diffY > 8) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (isDragging.current) {
      setTimeout(() => {
        isDragging.current = false;
        touchStartX.current = 0;
        touchStartY.current = 0;
      }, 70);
    }
  };

  // Clic sobre la foto: abre el Lightbox inmersivo en la diapositiva actual
  const handlePhotoClick = (e) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onOpenModal(post.id, currentIndex);
  };

  return (
    <article className="ig-native-card glass-panel">
      {/* Cabecera de la tarjeta */}
      <div className="ig-native-card-header">
        <span className="ig-native-badge">{post.badge}</span>
        <span className="ig-native-ministerio">{post.ministerio}</span>
      </div>

      {/* Visor de Imagen / Carrusel interactivo (Primer clic abre el modal) */}
      <div
        className="ig-native-image-container is-clickable"
        onClick={handlePhotoClick}
        title={`Toca para ampliar foto de ${post.titulo}`}
      >
        {/* Badge flotante animado de estado ('🔴 EN VIVO' o '⚡ HOY') */}
        {badgeLabel && (
          <div 
            className={`ig-native-live-badge ${isTodayBadge ? 'ig-badge-today' : 'ig-badge-live'} ${isLivePulse ? 'is-pulsing' : ''}`}
            title="Estado del servicio"
          >
            <span className="ig-native-live-badge-dot" />
            <span>{badgeLabel}</span>
          </div>
        )}

        {/* Carrusel con CSS Scroll Snap nativo */}
        <div
          ref={trackRef}
          className="ig-carousel-track"
          onScroll={handleScroll}
          onTouchStart={hasMultiple ? handleTouchStart : undefined}
          onTouchMove={hasMultiple ? handleTouchMove : undefined}
          onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
        >
          {images.map((src, idx) => (
            <div key={idx} className="ig-carousel-slide">
              <img
                src={src}
                alt={`${post.titulo} - Foto ${idx + 1}`}
                className="ig-native-image"
                loading="lazy"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Contador de fotos (1 / 2) para carrusel */}
        {hasMultiple && (
          <div className="ig-native-counter-pill" title="Publicación con múltiples fotos">
            <Layers size={13} />
            <span>{currentIndex + 1} / {images.length}</span>
          </div>
        )}

        {/* Hint sutil para primer clic */}
        <div className={`ig-tap-hint ${hasMultiple ? 'with-dots' : ''}`}>
          <Info size={12} />
          <span>Toca para ampliar foto</span>
        </div>

        {/* Flechas de navegación para JOPECE */}
        {hasMultiple && (
          <>
            <button
              type="button"
              className="ig-nav-btn ig-nav-prev"
              onClick={prevSlide}
              aria-label="Foto anterior"
              title="Foto anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="ig-nav-btn ig-nav-next"
              onClick={nextSlide}
              aria-label="Siguiente foto"
              title="Siguiente foto"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Puntos de paginación (Dots) */}
        {hasMultiple && (
          <div
            className="ig-dots-row"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`ig-dot-indicator ${idx === currentIndex ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  scrollToSlide(idx);
                }}
                aria-label={`Ir a foto ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pie de la tarjeta */}
      <div className="ig-native-footer">
        <div className="ig-native-title-col">
          <h3 className="ig-native-tema">{post.titulo}</h3>
          <span className="ig-native-subtext">{post.subtitulo}</span>
        </div>

        <button
          type="button"
          className="ig-native-details-btn"
          onClick={() => onOpenModal(post.id, currentIndex)}
          title="Ver foto y detalles"
        >
          <span>Ver foto</span>
          <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}

/**
 * Componente Principal InstagramHighlights
 */
export default function InstagramHighlights() {
  const [activeModalData, setActiveModalData] = useState(null); // { postId, initialIndex }
  const [currentTime, setCurrentTime] = useState(new Date());
  const [forcePreview, setForcePreview] = useState(false);

  // 1. Detección de parámetro de previsualización para pruebas (#preview-instagram o ?preview=instagram)
  useEffect(() => {
    const evaluatePreview = () => {
      const hash = window.location.hash;
      const search = new URLSearchParams(window.location.search);
      setForcePreview(
        hash.includes('preview-instagram') || 
        hash.includes('preview-servicios') ||
        search.get('preview') === 'instagram'
      );
    };

    evaluatePreview();
    window.addEventListener('hashchange', evaluatePreview);
    return () => window.removeEventListener('hashchange', evaluatePreview);
  }, []);

  // 2. Temporizador en cliente: evalúa cada 30 segundos si la actividad venció o cambió de estado
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // 3. Bloquear scroll del fondo al abrir el Lightbox Modal
  useEffect(() => {
    if (activeModalData) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [activeModalData]);

  // 4. Filtrar publicaciones vigentes mediante evaluación estricta de días y horas
  const activePosts = INSTAGRAM_PUBLICATIONS.filter(post => {
    if (forcePreview) return true;
    const status = evaluateEventStatus(post, currentTime);
    return !status.isExpired;
  });

  // 5. AUTO-DESTRUCCIÓN: si todas las publicaciones expiran, retorna null
  if (activePosts.length === 0) {
    return null;
  }

  // Identificar la publicación activa para el Lightbox
  const activePost = activeModalData 
    ? INSTAGRAM_PUBLICATIONS.find(p => p.id === activeModalData.postId) 
    : null;

  return (
    <section className="ig-native-section" aria-label="Novedades y Anuncios de Instagram">
      <div className="ig-native-header">
        <span className="ig-native-kicker">
          <Sparkles size={14} />
          <span>Actividades & Cultos</span>
        </span>
        <h2 className="ig-native-section-title">Últimas Publicaciones</h2>
      </div>

      <div className={`ig-native-grid ig-grid-count-${activePosts.length}`}>
        {activePosts.map(post => (
          <PublicationCard
            key={post.id}
            post={post}
            currentTime={currentTime}
            forcePreview={forcePreview}
            onOpenModal={(id, index = 0) => setActiveModalData({ postId: id, initialIndex: index })}
          />
        ))}
      </div>

      {/* =================================================================== */}
      {/* MODAL LIGHTBOX DE PANTALLA COMPLETA (INMERSIVO, PINCH-TO-ZOOM, SNAP) */}
      {/* =================================================================== */}
      {activePost && typeof document !== 'undefined' && createPortal(
        <InstagramLightboxModal
          post={activePost}
          initialSlideIndex={activeModalData?.initialIndex || 0}
          onClose={() => setActiveModalData(null)}
        />,
        document.body
      )}
    </section>
  );
}
