import { useState } from 'react';
import { Check, ZoomIn, ShoppingBag, Sparkles } from 'lucide-react';
import { getMerchImagePath, getMerchWhatsAppUrl } from '../../lib/merchData';
import './MerchCard.css';

/**
 * Reusable MerchCard Component - Ultra-Compact Mobile-First Architecture
 * Obsidian Fire Aesthetic (React 19 + Vanilla CSS Puro, Cero Tailwind)
 *
 * @param {Object} props
 * @param {Object} props.product - Garment data from MERCH_CATALOG
 * @param {Object} [props.selection] - Controlled selection state: { quiere, modelo, color, talla }
 * @param {Function} [props.onSelectionChange] - Callback when selection or variant changes
 * @param {'registration'|'store'} [props.mode='registration'] - Mode determines action buttons and layout
 * @param {Function} [props.onPreviewImage] - Callback when clicking image to zoom in
 */
const MerchCard = ({
  product,
  selection,
  onSelectionChange,
  mode = 'registration',
  onPreviewImage
}) => {
  if (!product) return null;

  // Internal state if used uncontrolled (e.g. in /merch page)
  const [internalSelection, setInternalSelection] = useState({
    quiere: false,
    modelo: product.defaultModelo || product.modelos[0]?.nombre || '',
    color: product.defaultColor || product.modelos[0]?.colores[0]?.nombre || '',
    talla: product.defaultTalla || product.tallas[0] || 'M'
  });

  const activeSelection = selection !== undefined ? selection : internalSelection;
  const isSelected = Boolean(activeSelection?.quiere);

  const currentModelo = activeSelection?.modelo || product.defaultModelo || product.modelos[0]?.nombre || '';
  const currentModeloObj = product.modelos.find(m => m.nombre === currentModelo) || product.modelos[0];
  const availableColors = currentModeloObj?.colores || [];

  const currentColor = activeSelection?.color || availableColors[0]?.nombre || '';
  const currentTalla = activeSelection?.talla || product.defaultTalla || product.tallas[0] || 'M';

  const currentImagePath = getMerchImagePath(product.id, currentModelo, currentColor);

  const updateState = (partial) => {
    const updated = {
      ...activeSelection,
      ...partial
    };
    if (onSelectionChange) {
      onSelectionChange(updated);
    } else {
      setInternalSelection(updated);
    }
  };

  const handleToggleSelection = () => {
    updateState({ quiere: !isSelected });
  };

  const handleModeloChange = (e) => {
    const newModelo = e.target.value;
    const modObj = product.modelos.find(m => m.nombre === newModelo) || product.modelos[0];
    const firstColor = modObj?.colores[0]?.nombre || '';
    updateState({
      modelo: newModelo,
      color: firstColor
    });
  };

  const handleColorChange = (newColor) => {
    updateState({ color: newColor });
  };

  const handleTallaChange = (e) => {
    updateState({ talla: e.target.value });
  };

  const handleImageClick = () => {
    if (onPreviewImage) {
      onPreviewImage({
        title: `${product.nombre} • ${currentModelo}`,
        subtitle: `Color: ${currentColor} | Talla: ${currentTalla} • RD$ ${product.precio.toLocaleString()}`,
        image: currentImagePath
      });
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

  return (
    <article 
      className={`merch-card-item ${isSelected ? 'is-selected' : ''} mode-${mode}`}
      aria-label={`${product.nombre} - ${product.badge}`}
    >
      {/* 1. Área Visual Optimizada con Badge y Zoom Discreto */}
      <div 
        className="merch-card-media"
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleImageClick(); }}
        title="Haz clic para ver la prenda en alta resolución"
      >
        <img 
          src={currentImagePath} 
          alt={`${product.nombre} - ${currentModelo} (${currentColor})`} 
          className="merch-card-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `${import.meta.env.BASE_URL}logos/logo-despierta-horizontal.png`;
            e.target.classList.add('merch-img-fallback');
          }}
        />

        {/* Badge Flotante Superior Izquierdo */}
        <div className="merch-floating-badge">
          <Sparkles size={10} className="badge-sparkle-icon" />
          <span>{product.badge}</span>
        </div>

        {/* Botón Flotante Discreto para Ampliar Foto */}
        <button
          type="button"
          className="merch-zoom-trigger"
          onClick={(e) => {
            e.stopPropagation();
            handleImageClick();
          }}
          aria-label="Ampliar foto"
          title="Ampliar foto"
        >
          <ZoomIn size={12} className="zoom-icon" />
          <span className="zoom-text">Ampliar</span>
        </button>
      </div>

      {/* 2. Cuerpo de la Tarjeta (Ultra-Compacto) */}
      <div className="merch-card-body">
        {/* Cabecera: Título y Precio */}
        <div className="merch-card-header">
          <div className="merch-title-wrap">
            <div className="merch-meta-row">
              <span className="merch-tagline">PRENDA OFICIAL</span>
              <div className="merch-price-pill" aria-label={`Precio: RD$ ${product.precio.toLocaleString()}`}>
                <span className="price-currency">RD$</span>
                <span className="price-amount">{product.precio.toLocaleString()}</span>
              </div>
            </div>
            <h3 className="merch-title">{product.nombre}</h3>
          </div>

          {/* Indicador de Estado en Modo Registro cuando está seleccionada */}
          {mode === 'registration' && isSelected && (
            <div className="merch-selected-badge" title="Prenda seleccionada para el registro">
              <Check size={11} className="badge-check-icon" />
              <span>Agregado</span>
            </div>
          )}
        </div>

        {/* Descripción compacta (limitada a 2 líneas con elipsis) */}
        <p className="merch-description">{product.descripcion}</p>

        {/* 3. Grid Compacto de Selectores (Zero-Scroll: Modelo 100%, Talla 50% | Color 50%) */}
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
                {product.modelos.map(m => (
                  <option key={m.nombre} value={m.nombre}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2 - Columna Izquierda (50%): Talla */}
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
                {product.tallas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2 - Columna Derecha (50%): Color */}
          <div className="merch-grid-cell merch-cell-color">
            <div className="merch-color-headline">
              <span className="merch-field-label">Color:</span>
              <span className="merch-color-active-name">{currentColor}</span>
            </div>

            <div className="merch-color-dots-row" role="radiogroup" aria-label="Seleccionar color">
              {availableColors.map(c => {
                const isActive = currentColor === c.nombre;
                return (
                  <button
                    key={c.nombre}
                    type="button"
                    className={`merch-color-dot-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleColorChange(c.nombre)}
                    role="radio"
                    aria-checked={isActive}
                    title={`Color ${c.nombre}`}
                    style={{
                      backgroundColor: c.hex,
                      borderColor: isActive ? '#ea580c' : (c.border || 'rgba(255,255,255,0.22)')
                    }}
                  >
                    {isActive && <Check size={9} className="color-dot-check" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Botón de Llamada a la Acción (CTA) Inmediato (Zero-Scroll Flow) */}
        <div className="merch-card-footer">
          {mode === 'store' ? (
            <button 
              type="button" 
              className="btn-order-store"
              onClick={handleWhatsAppOrder}
            >
              <ShoppingBag size={15} />
              <span>PEDIR AHORA • RD$ {product.precio.toLocaleString()}</span>
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
                  <span>Prenda Seleccionada (Quitar)</span>
                </>
              ) : (
                <>
                  <span>+ Agregar Prenda</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default MerchCard;
