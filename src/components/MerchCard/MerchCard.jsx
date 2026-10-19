import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  Check, X, ShoppingBag, 
  Sparkles, ChevronLeft, ChevronRight, ZoomIn, Ticket, Minus, Plus 
} from 'lucide-react';
import { getMerchImagePath, getMerchWhatsAppUrl } from '../../lib/merchData';
import './MerchCard.css';

/**
 * MerchCard Component - React 19 + Vanilla CSS Puro (Obsidian Fire Palette)
 *
 * Blindaje y Resiliencia de Datos:
 * 1. Protección contra Crashes: Validación exhaustiva con Optional Chaining (?.) y Fallbacks seguros.
 * 2. Portal y Lightbox Seguro: isLightboxOpen inicia estrictamente en false; se monta únicamente con producto e imagen válidos.
 * 3. Carrusel Táctil Horizontal Fluido (Scroll Snap x-mandatory) con sincronización bidireccional.
 * 4. Zoom Táctil Avanzado (react-zoom-pan-pinch) con Modo Inmersivo Automático (Hide UI al hacer zoom).
 * 5. Bloqueo Condicional de Talla S: Deshabilitada en T-Shirts para Negro y Crema con auto-corrección a M.
 */
const MerchCard = ({
  product,
  selection,
  onSelectionChange,
  mode = 'registration'
}) => {
  const navigate = useNavigate();

  // 1. BLINDAJE INICIAL: Si no hay producto válido, no renderizar para evitar crashes
  if (!product || typeof product !== 'object' || !product.id) {
    return null;
  }

  // Fallbacks seguros de estructuras de datos (excluyendo estrictamente 'XS')
  const safeModelos = Array.isArray(product.modelos) ? product.modelos : [];
  const safeTallas = (Array.isArray(product.tallas) ? product.tallas : ['S', 'M', 'L', 'XL', '2XL'])
    .filter(t => t !== 'XS');
  const safePrecio = typeof product.precio === 'number' ? product.precio : 0;
  const safeNombre = product.nombre || 'Prenda Oficial';
  const safeBadge = product.badge || 'EDICIÓN OFICIAL';
  const safeDescripcion = product.descripcion || '';

  const defaultModeloSafe = product.defaultModelo || safeModelos[0]?.nombre || '';
  const firstModelColorsSafe = Array.isArray(safeModelos[0]?.colores) ? safeModelos[0].colores : [];
  const defaultColorSafe = product.defaultColor || firstModelColorsSafe[0]?.nombre || '';
  
  // Garantizar que la talla por defecto sea 'M' (o safeTallas[0]), nunca 'XS'
  const rawDefaultTalla = product.defaultTalla && product.defaultTalla !== 'XS' ? product.defaultTalla : null;
  const defaultTallaSafe = rawDefaultTalla || (safeTallas.includes('M') ? 'M' : (safeTallas[0] || 'M'));

  // Estado interno si se usa no controlado
  const [internalSelection, setInternalSelection] = useState({
    quiere: false,
    modelo: defaultModeloSafe,
    color: defaultColorSafe,
    talla: defaultTallaSafe,
    cantidad: 1
  });

  const activeSelection = selection !== undefined ? selection : internalSelection;
  const isSelected = Boolean(activeSelection?.quiere);

  const currentModelo = activeSelection?.modelo || defaultModeloSafe;
  const currentModeloObj = safeModelos.find(m => m?.nombre === currentModelo) || safeModelos[0] || { nombre: '', colores: [] };
  const availableColors = Array.isArray(currentModeloObj?.colores) ? currentModeloObj.colores : [];

  const currentColor = activeSelection?.color || availableColors[0]?.nombre || defaultColorSafe;
  const currentTalla = (activeSelection?.talla && activeSelection.talla !== 'XS') ? activeSelection.talla : defaultTallaSafe;
  const currentCantidad = Math.max(1, Number(activeSelection?.cantidad) || 1);

  // ---------------------------------------------------------------------------
  // 2. REGLA DE NEGOCIO: TALLA 'S' AGOTADA EN T-SHIRTS PARA NEGRO Y CREMA
  // ---------------------------------------------------------------------------
  const isTshirt = product.id === 'tshirt';
  const isRestrictedColor = (colorName) => {
    if (!colorName || typeof colorName !== 'string') return false;
    const lower = colorName.toLowerCase();
    return lower.startsWith('negro') || lower.startsWith('crema') || lower.includes('negro') || lower.includes('crema');
  };

  const isSmallOutOfStock = isTshirt && isRestrictedColor(currentColor);

  // Diapositivas del carrusel: colores disponibles para el modelo activo
  const slides = availableColors.map((c, idx) => ({
    colorName: c?.nombre || `Color-${idx}`,
    colorHex: c?.hex || '#ffffff',
    letterHex: c?.letterHex || null,
    colorBorder: c?.border || 'rgba(255,255,255,0.25)',
    imageSrc: getMerchImagePath(product.id, currentModelo, c?.nombre),
    alt: `${safeNombre} - ${currentModelo} (${c?.nombre || ''})`
  }));

  const activeSlideIndex = Math.max(0, slides.findIndex(s => s.colorName === currentColor));
  const activeSlide = slides[activeSlideIndex] || slides[0] || { colorName: '', imageSrc: '', alt: '' };

  // Referencias para el carrusel táctil
  const carouselTrackRef = useRef(null);
  const isScrollingRef = useRef(false);

  // Estados del Lightbox de Pantalla Completa (Inicia estrictamente en false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isManualUIHidden, setIsManualUIHidden] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const transformRef = useRef(null);

  // Referencia en tiempo real para escala (cero retraso de renderizado para control de swipe)
  const currentScaleRef = useRef(1);

  // Modo inmersivo si está zoomeado O si se dio tap manual
  const isImmersive = isZoomed || isManualUIHidden;

  // Referencias para gestos táctiles, tap toggle y clic en backdrop
  const lightboxTouchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const isLightboxSwipingRef = useRef(false);
  const stagePointerStartRef = useRef({ x: 0, y: 0, time: 0 });
  const imagePointerStartRef = useRef({ x: 0, y: 0, time: 0 });
  const singleTapTimerRef = useRef(null);

  // Limpieza de temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  const updateState = useCallback((partial) => {
    const updated = {
      ...activeSelection,
      ...partial
    };
    if (onSelectionChange) {
      onSelectionChange(updated);
    } else {
      setInternalSelection(updated);
    }
  }, [activeSelection, onSelectionChange]);

  // ---------------------------------------------------------------------------
  // 3. AUTO-CORRECCIÓN DE ESTADO (EFECTO SECUNDARIO)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Si la talla en selección fuera 'XS' (por caché previa o estado obsoleto), corregir a 'M'
    if (activeSelection?.talla === 'XS') {
      updateState({ talla: 'M' });
      return;
    }
    // Si la prenda es T-Shirt en color restringido y la talla es 'S', auto-corregir a 'M'
    if (isSmallOutOfStock && currentTalla === 'S') {
      updateState({ talla: 'M' });
    }
  }, [isSmallOutOfStock, currentTalla, activeSelection?.talla, updateState]);

  // Sincronización del Carrusel al índice activo
  const scrollToSlide = useCallback((index, smooth = true) => {
    const track = carouselTrackRef.current;
    if (!track) return;
    const width = track.clientWidth;
    if (width <= 0) return;
    isScrollingRef.current = true;
    track.scrollTo({
      left: index * width,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 350);
  }, []);

  // Al cambiar modelo o color desde selectores, desplaza el carrusel al slide respectivo
  useEffect(() => {
    if (!isScrollingRef.current && slides.length > 0) {
      scrollToSlide(activeSlideIndex, true);
    }
  }, [activeSlideIndex, scrollToSlide, slides.length]);

  // Detección de Swipe / Scroll en el Carrusel (Táctil)
  const handleCarouselScroll = () => {
    if (isScrollingRef.current) return;
    const track = carouselTrackRef.current;
    if (!track) return;
    const width = track.clientWidth;
    if (width <= 0) return;
    const newIndex = Math.round(track.scrollLeft / width);
    if (newIndex >= 0 && newIndex < slides.length && newIndex !== activeSlideIndex) {
      const targetColor = slides[newIndex]?.colorName;
      if (targetColor) {
        const nextUpdates = { color: targetColor };
        if (isTshirt && isRestrictedColor(targetColor) && currentTalla === 'S') {
          nextUpdates.talla = 'M';
        }
        updateState(nextUpdates);
      }
    }
  };

  const handleNextSlide = (e) => {
    e?.stopPropagation();
    if (slides.length <= 1) return;
    const nextIndex = (activeSlideIndex + 1) % slides.length;
    const targetColor = slides[nextIndex]?.colorName;
    if (targetColor) {
      const nextUpdates = { color: targetColor };
      if (isTshirt && isRestrictedColor(targetColor) && currentTalla === 'S') {
        nextUpdates.talla = 'M';
      }
      updateState(nextUpdates);
    }
  };

  const handlePrevSlide = (e) => {
    e?.stopPropagation();
    if (slides.length <= 1) return;
    const prevIndex = (activeSlideIndex - 1 + slides.length) % slides.length;
    const targetColor = slides[prevIndex]?.colorName;
    if (targetColor) {
      const nextUpdates = { color: targetColor };
      if (isTshirt && isRestrictedColor(targetColor) && currentTalla === 'S') {
        nextUpdates.talla = 'M';
      }
      updateState(nextUpdates);
    }
  };

  const handleToggleSelection = () => {
    updateState({ quiere: !isSelected });
  };

  const handleModeloChange = (e) => {
    const newModelo = e?.target?.value || '';
    const modObj = safeModelos.find(m => m?.nombre === newModelo) || safeModelos[0];
    const modColores = Array.isArray(modObj?.colores) ? modObj.colores : [];
    const firstColor = modColores[0]?.nombre || '';
    const nextUpdates = {
      modelo: newModelo,
      color: firstColor
    };
    if (isTshirt && isRestrictedColor(firstColor) && currentTalla === 'S') {
      nextUpdates.talla = 'M';
    }
    updateState(nextUpdates);
  };

  const handleColorChange = useCallback((newColor) => {
    const nextUpdates = { color: newColor };
    if (isTshirt && isRestrictedColor(newColor) && currentTalla === 'S') {
      nextUpdates.talla = 'M';
    }
    updateState(nextUpdates);
    if (transformRef.current) {
      transformRef.current.resetTransform();
    }
  }, [isTshirt, currentTalla, updateState]);

  // Navegación secuencial entre estilos/colores para Lightbox
  const goToNextLightboxSlide = useCallback(() => {
    if (slides.length <= 1) return;
    const nextIndex = (activeSlideIndex + 1) % slides.length;
    const targetColor = slides[nextIndex]?.colorName;
    if (targetColor) {
      handleColorChange(targetColor);
    }
  }, [activeSlideIndex, slides, handleColorChange]);

  const goToPrevLightboxSlide = useCallback(() => {
    if (slides.length <= 1) return;
    const prevIndex = (activeSlideIndex - 1 + slides.length) % slides.length;
    const targetColor = slides[prevIndex]?.colorName;
    if (targetColor) {
      handleColorChange(targetColor);
    }
  }, [activeSlideIndex, slides, handleColorChange]);

  const handleTallaChange = (e) => {
    const val = e?.target?.value || 'M';
    updateState({ talla: val === 'XS' ? 'M' : val });
  };

  const handleIncreaseQty = (e) => {
    e?.stopPropagation();
    const nextQty = currentCantidad + 1;
    updateState({ cantidad: nextQty });
  };

  const handleDecreaseQty = (e) => {
    e?.stopPropagation();
    if (currentCantidad > 1) {
      const nextQty = currentCantidad - 1;
      updateState({ cantidad: nextQty });
    }
  };

  const handleWhatsAppOrder = () => {
    const url = getMerchWhatsAppUrl({
      product,
      modelo: currentModelo,
      color: currentColor,
      talla: currentTalla
    });
    window.open(url, '_blank');
  };

  // ---------------------------------------------------------------------------
  // GESTIÓN DEL MODAL LIGHTBOX & MODO INMERSIVO TÁCTIL
  // ---------------------------------------------------------------------------
  // Sincronización instantánea de escala al pellizcar (pinch) o hacer zoom
  const handleTransform = useCallback((ref, state) => {
    const scale = state?.scale || ref?.state?.scale || ref?.instance?.transformState?.scale || 1;
    currentScaleRef.current = scale;
    const isNowZoomed = scale > 1.01;
    setIsZoomed(isNowZoomed);
    setZoomScale(scale);
  }, []);

  const openLightbox = () => {
    if (activeSlide?.imageSrc) {
      currentScaleRef.current = 1;
      setIsLightboxOpen(true);
      setIsZoomed(false);
      setIsManualUIHidden(false);
      setZoomScale(1);
    }
  };

  const closeLightbox = useCallback(() => {
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
    currentScaleRef.current = 1;
    setIsLightboxOpen(false);
    setIsZoomed(false);
    setIsManualUIHidden(false);
    setZoomScale(1);
  }, []);

  // Bloqueo de scroll en body al abrir Lightbox con soporte de teclado (Esc, Flechas)
  useEffect(() => {
    if (!isLightboxOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight' && currentScaleRef.current <= 1.01) {
        goToNextLightboxSlide();
      } else if (e.key === 'ArrowLeft' && currentScaleRef.current <= 1.01) {
        goToPrevLightboxSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, closeLightbox, goToNextLightboxSlide, goToPrevLightboxSlide]);

  // 1. Navegación por Swipe en Pantalla Completa (estricto a escala 1x, sin zoom)
  const handleLightboxTouchStart = (e) => {
    // Si la escala no es exactamente 1x, BLOQUEAR cualquier detección de swipe
    if (currentScaleRef.current > 1.01) {
      isLightboxSwipingRef.current = false;
      return;
    }

    // Si hay más de 1 dedo, es pellizco (pinch-to-zoom): cancelar swipe de inmediato
    if (e.touches.length > 1) {
      isLightboxSwipingRef.current = false;
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      lightboxTouchStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        time: Date.now()
      };
      isLightboxSwipingRef.current = true;
    }
  };

  const handleLightboxTouchMove = (e) => {
    // Si hay zoom activo o multi-touch, anular swipe para permitir paneo libre
    if (currentScaleRef.current > 1.01 || e.touches.length !== 1) {
      isLightboxSwipingRef.current = false;
    }
  };

  const handleLightboxTouchEnd = (e) => {
    // REGLA CRÍTICA: Si la imagen está ampliada lo más mínimo, PROHIBIDO pasar de foto
    if (currentScaleRef.current > 1.01 || !isLightboxSwipingRef.current) {
      isLightboxSwipingRef.current = false;
      return;
    }

    const t = e.changedTouches?.[0];
    if (!t) return;

    const deltaX = t.clientX - lightboxTouchStartRef.current.x;
    const deltaY = t.clientY - lightboxTouchStartRef.current.y;
    const deltaTime = Date.now() - lightboxTouchStartRef.current.time;

    // Umbral estricto para cambio intencional de foto solo a escala 1x
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && deltaTime < 550) {
      if (deltaX < 0) {
        goToNextLightboxSlide();
      } else {
        goToPrevLightboxSlide();
      }
    }

    isLightboxSwipingRef.current = false;
  };

  // 2. Modo Inmersivo Manual: Toque simple rápido sobre la imagen conmuta visibilidad de la UI
  const handleImagePointerDown = (e) => {
    imagePointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  };

  const handleImageClick = (e) => {
    e.stopPropagation();

    // Solo habilitar toggle manual cuando la escala es exactamente 1x
    if (currentScaleRef.current > 1.01) return;

    // Si hubo arrastre mayor a 8px, es swipe o intento de movimiento, no un toque simple
    const deltaX = Math.abs(e.clientX - imagePointerStartRef.current.x);
    const deltaY = Math.abs(e.clientY - imagePointerStartRef.current.y);
    if (deltaX > 8 || deltaY > 8) return;

    // Distinguir toque simple rápido de doble toque (el doble toque es para zoom in/out)
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
      return;
    }

    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      setIsManualUIHidden(prev => !prev);
    }, 260);
  };

  // 3. Cierre Intuitivo: Clic o tap en cualquier área oscura del fondo (fuera de la prenda)
  const handleStagePointerDown = (e) => {
    stagePointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  };

  const handleBackdropOrStageClick = (e) => {
    // Si la imagen tiene zoom activo (> 1x), no cerrar al tocar el fondo
    if (currentScaleRef.current > 1.01 || isZoomed) return;

    // Si el toque o clic proviene directamente de la imagen de la prenda, NO cerrar
    if (e.target.closest('.lightbox-hero-img')) {
      return;
    }

    // Si proviene de controles interactivos (botones, chips, etc.), NO cerrar
    if (
      e.target.closest('.lightbox-top-bar') ||
      e.target.closest('.lightbox-bottom-bar') ||
      e.target.closest('.lightbox-nav-btn')
    ) {
      return;
    }

    // Evitar cierre accidental durante un gesto de arrastre o deslizamiento
    const deltaX = Math.abs(e.clientX - stagePointerStartRef.current.x);
    const deltaY = Math.abs(e.clientY - stagePointerStartRef.current.y);
    if (deltaX > 8 || deltaY > 8) return;

    closeLightbox();
  };

  return (
    <>
      <article 
        className={`merch-card-item ${isSelected ? 'is-selected' : ''} mode-${mode}`}
        aria-label={`${safeNombre} - ${safeBadge}`}
      >
        {/* 1. Carrusel Táctil Ultrafino y Fluido (Swipe & Scroll Snap) */}
        <div 
          className="merch-card-media"
          title="Desliza para ver más estilos o haz clic para ampliar"
        >
          {/* Track Horizontal de Scroll Snap */}
          <div 
            className="merch-carousel-track"
            ref={carouselTrackRef}
            onScroll={handleCarouselScroll}
          >
            {slides.map((s, idx) => (
              <div 
                key={`${s.colorName}-${idx}`} 
                className="merch-carousel-slide"
                onClick={openLightbox}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openLightbox(); }}
              >
                <img 
                  src={s.imageSrc} 
                  alt={s.alt} 
                  className="merch-card-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${import.meta.env.BASE_URL}logos/logo-despierta-horizontal.png`;
                    e.target.classList.add('merch-img-fallback');
                  }}
                />
              </div>
            ))}
          </div>

          {/* Badge Flotante Superior Izquierdo */}
          <div className="merch-floating-badge">
            <Sparkles size={10} className="badge-sparkle-icon" />
            <span>{safeBadge}</span>
          </div>

          {/* Flechas de Navegación Rápida (Desktop / Hover) */}
          {slides.length > 1 && (
            <>
              <button 
                type="button" 
                className="merch-carousel-nav-btn btn-prev"
                onClick={handlePrevSlide}
                aria-label="Foto anterior"
                title="Foto anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                type="button" 
                className="merch-carousel-nav-btn btn-next"
                onClick={handleNextSlide}
                aria-label="Foto siguiente"
                title="Foto siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Indicadores de Paginación (Dots Dinámicos) */}
          {slides.length > 1 && (
            <div className="merch-carousel-dots" role="tablist" aria-label="Variantes de foto">
              {slides.map((s, idx) => {
                const isActive = idx === activeSlideIndex;
                return (
                  <button
                    key={`dot-${s.colorName}-${idx}`}
                    type="button"
                    className={`merch-dot-item ${isActive ? 'is-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateState({ color: s.colorName });
                    }}
                    role="tab"
                    aria-selected={isActive}
                    title={`Ver en color ${s.colorName}`}
                  />
                );
              })}
            </div>
          )}

          {/* Botón Flotante Discreto de Pantalla Completa */}
          <button
            type="button"
            className="merch-zoom-trigger"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox();
            }}
            aria-label="Pantalla completa"
            title="Pantalla completa"
          >
            <ZoomIn size={12} className="zoom-icon" />
            <span className="zoom-text">Ampliar</span>
          </button>
        </div>

        {/* 2. Cuerpo de la Tarjeta (Zero-Scroll UI Compacto) */}
        <div className="merch-card-body">
          {/* Cabecera: Título y Precio */}
          <div className="merch-card-header">
            <div className="merch-title-wrap">
              <div className="merch-meta-row">
                <span className="merch-tagline">PRENDA OFICIAL</span>
                <div className="merch-price-pill" aria-label={`Precio: RD$ ${safePrecio.toLocaleString()}`}>
                  <span className="price-currency">RD$</span>
                  <span className="price-amount">{safePrecio.toLocaleString()}</span>
                </div>
              </div>
              <h3 className="merch-title">{safeNombre}</h3>
            </div>

            {/* Indicador de Estado en Modo Registro */}
            {mode === 'registration' && isSelected && (
              <div className="merch-selected-badge" title="Prenda seleccionada para el registro">
                <Check size={11} className="badge-check-icon" />
                <span>Agregado</span>
              </div>
            )}
          </div>

          {/* Descripción ultra-compacta (2 líneas con elipsis) */}
          {safeDescripcion && (
            <p className="merch-description">{safeDescripcion}</p>
          )}

          {/* 3. Grid Compacto de Selectores: Modelo 100%, Talla 50% | Color 50% */}
          <div className="merch-selectors-grid">
            {/* Fila 1: Diseño / Modelo (Ancho Completo) */}
            <div className="merch-grid-cell merch-cell-model">
              <label htmlFor={`select-model-${product.id}`} className="merch-field-label">
                Diseño / Modelo
              </label>
              <div className="merch-select-shell">
                <select 
                  id={`select-model-${product.id}`}
                  className="merch-dark-select"
                  value={currentModelo}
                  onChange={handleModeloChange}
                >
                  {safeModelos.map(m => (
                    <option key={m.nombre} value={m.nombre}>{m.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fila 2 - Columna 1: Talla (50%) con Bloqueo Condicional de Talla S */}
            <div className="merch-grid-cell merch-cell-size">
              <label htmlFor={`select-size-${product.id}`} className="merch-field-label">
                Talla
              </label>
              <div className="merch-select-shell">
                <select 
                  id={`select-size-${product.id}`}
                  className="merch-dark-select"
                  value={currentTalla}
                  onChange={handleTallaChange}
                >
                  {safeTallas.map(t => {
                    const isTallaDisabled = t === 'S' && isSmallOutOfStock;
                    return (
                      <option 
                        key={t} 
                        value={t}
                        disabled={isTallaDisabled}
                        className={isTallaDisabled ? 'option-disabled-stock' : ''}
                      >
                        {isTallaDisabled ? 'S - (Agotado en este color)' : t}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Fila 2 - Columna 2: Color con Dots (50%) */}
            <div className="merch-grid-cell merch-cell-color">
              <div className="merch-color-headline">
                <span className="merch-field-label">Color:</span>
                <span className="merch-color-active-name">{currentColor}</span>
              </div>

              <div className="merch-color-dots-row" role="radiogroup" aria-label="Seleccionar color">
                {availableColors.map(c => {
                  const isActive = currentColor === c?.nombre;
                  return (
                    <button
                      key={c?.nombre || 'color-dot'}
                      type="button"
                      className={`merch-color-dot-btn ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleColorChange(c?.nombre)}
                      role="radio"
                      aria-checked={isActive}
                      title={`Color ${c?.nombre}`}
                      style={{
                        background: c?.letterHex 
                          ? `linear-gradient(135deg, ${c.hex} 50%, ${c.letterHex} 50%)`
                          : (c?.hex || '#ffffff'),
                        borderColor: isActive ? '#ea580c' : (c?.border || 'rgba(255,255,255,0.22)')
                      }}
                    >
                      {isActive && <Check size={9} className="color-dot-check" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Selector de Cantidad y Botón de Llamada a la Acción (CTA) */}
          <div className="merch-card-footer">
            <div className="merch-footer-controls-row">
              {/* Selector de Cantidad Obsidian Fire */}
              <div className="merch-qty-selector" aria-label="Cantidad de prendas">
                <button
                  type="button"
                  className="qty-btn qty-btn-minus"
                  onClick={handleDecreaseQty}
                  disabled={currentCantidad <= 1}
                  aria-label="Disminuir cantidad"
                  title="Restar una prenda"
                >
                  <Minus size={13} />
                </button>
                <span className="qty-value" title={`Cantidad: ${currentCantidad}`}>{currentCantidad}</span>
                <button
                  type="button"
                  className="qty-btn qty-btn-plus"
                  onClick={handleIncreaseQty}
                  aria-label="Aumentar cantidad"
                  title="Sumar una prenda"
                >
                  <Plus size={13} />
                </button>
              </div>

              {mode === 'store' ? (
                <button 
                  type="button" 
                  className="btn-order-store"
                  onClick={() => navigate('/registro')}
                  title="Regístrate a la conferencia para adquirir esta prenda oficial"
                >
                  <Ticket size={15} />
                  <span>REGÍSTRATE PARA COMPRAR • RD$ {(safePrecio * currentCantidad).toLocaleString()}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`merch-toggle-cta-btn ${isSelected ? 'is-selected' : ''}`}
                  onClick={handleToggleSelection}
                  aria-pressed={isSelected}
                >
                  {isSelected ? (
                    <>
                      <Check size={14} className="toggle-check-icon" />
                      <span>{currentCantidad > 1 ? `${currentCantidad}x ` : ''}Seleccionada (Quitar)</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'ticket' ? `+ Agregar a mi Ticket (${currentCantidad})` : `+ Agregar Prenda (${currentCantidad})`}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* =================================================================== */}
      {/* 2. MODAL DE PANTALLA COMPLETA (FULL-SCREEN LIGHTBOX + ZOOM TÁCTIL)  */}
      {/* Montaje 100% seguro: Solo si isLightboxOpen es estrictamente true   */}
      {/* =================================================================== */}
      {isLightboxOpen === true && typeof document !== 'undefined' && Boolean(activeSlide?.imageSrc) && createPortal(
        <div 
          className={`merch-fullscreen-lightbox ${isImmersive ? 'is-immersive' : ''} ${isZoomed ? 'is-zoomed' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle en alta resolución de ${safeNombre}`}
          onClick={handleBackdropOrStageClick}
          onPointerDown={handleStagePointerDown}
          onTouchStart={handleLightboxTouchStart}
          onTouchMove={handleLightboxTouchMove}
          onTouchEnd={handleLightboxTouchEnd}
        >
          {/* Fondo Translúcido Obsidian Fire */}
          <div className="lightbox-backdrop" />

          {/* Barra Superior con Tag, Contador y Botón de Cierre */}
          <header className="lightbox-top-bar">
            <div className="lightbox-top-left">
              <div className="lightbox-tag-pill">
                <Sparkles size={11} className="text-fire" />
                <span>DETALLE DE PRENDA • DESPIERTA 2026</span>
              </div>
              {slides.length > 1 && (
                <span className="lightbox-slide-counter">
                  {activeSlideIndex + 1} / {slides.length}
                </span>
              )}
            </div>

            <div className="lightbox-top-actions">
              <button 
                type="button" 
                className="lightbox-close-btn"
                onClick={closeLightbox}
                aria-label="Cerrar vista completa"
                title="Cerrar (Esc o clic fuera)"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Flechas de Navegación Lateral (Ocultas en modo inmersivo) */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav-btn lightbox-nav-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevLightboxSlide();
                }}
                aria-label="Estilo anterior"
                title="Anterior (←)"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="lightbox-nav-btn lightbox-nav-next"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextLightboxSlide();
                }}
                aria-label="Siguiente estilo"
                title="Siguiente (→)"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Canvas Interactivo con react-zoom-pan-pinch */}
          <div className="lightbox-viewport">
            <TransformWrapper
              ref={transformRef}
              initialScale={1}
              minScale={1}
              maxScale={4}
              centerOnInit={true}
              smooth={true}
              doubleClick={{
                disabled: false,
                mode: 'toggle',
                step: 2,
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
                wrapperClass="lightbox-transform-wrapper"
                contentClass="lightbox-transform-content"
                wrapperProps={{
                  onClick: handleBackdropOrStageClick,
                  onPointerDown: handleStagePointerDown
                }}
                contentProps={{
                  onClick: handleBackdropOrStageClick,
                  onPointerDown: handleStagePointerDown
                }}
              >
                <img 
                  key={activeSlide?.imageSrc}
                  src={activeSlide?.imageSrc} 
                  alt={activeSlide?.alt || safeNombre} 
                  className="lightbox-hero-img"
                  draggable={false}
                  onPointerDown={handleImagePointerDown}
                  onClick={handleImageClick}
                  onTouchStart={handleLightboxTouchStart}
                  onTouchMove={handleLightboxTouchMove}
                  onTouchEnd={handleLightboxTouchEnd}
                  title="Pellizca para zoom natural • Doble toque para acercar • Toca para pantalla limpia"
                />
              </TransformComponent>
            </TransformWrapper>
          </div>

          {/* Barra Inferior con Información de la Prenda y Selector de Color */}
          <footer className="lightbox-bottom-bar">
            <div className="lightbox-details-col">
              <span className="lightbox-garment-title">
                {safeNombre} • <strong className="text-fire">{currentModelo}</strong>
              </span>
              <div className="lightbox-badges-row">
                <span className="lightbox-pill price">
                  RD$ {safePrecio.toLocaleString()}
                </span>
                <span className="lightbox-pill size">
                  Talla: {currentTalla}
                </span>
                <span className="lightbox-pill color">
                  Color: {currentColor}
                </span>
              </div>
            </div>

            {/* Selector rápido de colores dentro de la pantalla completa */}
            {availableColors.length > 1 && (
              <div className="lightbox-colors-wrap">
                <span className="lightbox-colors-label">Cambiar estilo:</span>
                <div className="lightbox-color-chips">
                  {availableColors.map(c => {
                    const isActive = currentColor === c?.nombre;
                    return (
                      <button
                        key={`lb-color-${c?.nombre || 'color'}`}
                        type="button"
                        className={`lightbox-color-chip ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleColorChange(c?.nombre)}
                        style={{
                          background: c?.letterHex 
                            ? `linear-gradient(135deg, ${c.hex} 50%, ${c.letterHex} 50%)`
                            : (c?.hex || '#ffffff'),
                          borderColor: isActive ? '#ea580c' : (c?.border || 'rgba(255,255,255,0.25)')
                        }}
                        title={`Color: ${c?.nombre}`}
                      >
                        {isActive && <Check size={11} className="color-dot-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="lightbox-gestures-hint">
              <span>💡 Desliza para cambiar estilo • Toca la foto para pantalla limpia • Pellizca para zoom • Toca fuera para salir</span>
            </div>
          </footer>
        </div>,
        document.body
      )}
    </>
  );
};

export default MerchCard;
