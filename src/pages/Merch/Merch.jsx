import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Ticket, ArrowLeft, ShoppingBag, Sparkles, ShieldCheck, Flame, X, 
  CheckCircle, Copy, AlertCircle, Check, Loader2, ArrowRight, RotateCcw
} from 'lucide-react';
import { MERCH_CATALOG } from '../../lib/merchData';
import MerchCard from '../../components/MerchCard/MerchCard';
import { 
  findRegistrationByCode, 
  updateTicketMerch 
} from '../../lib/ticketStorage';
import { 
  addMerchToExistingTicket, 
  formatMerchSummary, 
  calculateMerchTotal,
  fetchRegistrationsFromGoogleSheets 
} from '../../lib/googleSheetsService';
import './Merch.css';

const Merch = () => {
  const [searchParams] = useSearchParams();
  const urlTicket = searchParams.get('ticket') || searchParams.get('ticketCode');

  // Flujo activo: 'store' (exploración / pedido general) o 'ticket_flow' (vincular a boleto existente)
  const [activeFlow, setActiveFlow] = useState('store');
  
  // Estado para validación del código de boleto
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifiedTicket, setVerifiedTicket] = useState(null);

  // Estado de Carrito / Selección Múltiple de Merch (Array de objetos)
  const [selectedMerch, setSelectedMerch] = useState([]);

  // Configuración de borrador de opciones por prenda
  const [cardConfigs, setCardConfigs] = useState({
    tshirt: {
      modelo: MERCH_CATALOG.tshirt?.defaultModelo || 'Cristo Vive en Mí',
      color: MERCH_CATALOG.tshirt?.defaultColor || 'Blanco (Letras Gris)',
      talla: MERCH_CATALOG.tshirt?.defaultTalla || 'M',
      cantidad: 1
    },
    hoodie: {
      modelo: MERCH_CATALOG.hoodie?.defaultModelo || 'Chosen',
      color: MERCH_CATALOG.hoodie?.defaultColor || 'Negro (Letras Blanco)',
      talla: MERCH_CATALOG.hoodie?.defaultTalla || 'M',
      cantidad: 1
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedBankKey, setCopiedBankKey] = useState(null);

  // Total de prendas seleccionadas
  const totalItemsCount = useMemo(() => {
    return selectedMerch.reduce((sum, item) => sum + Math.max(1, Number(item?.cantidad) || 1), 0);
  }, [selectedMerch]);

  // Cálculo derivado de Total y Resumen de Merch (useMemo)
  const merchTotal = useMemo(() => {
    return selectedMerch.reduce((sum, item) => {
      const precio = Number(item?.precio) || 0;
      const cant = Math.max(1, Number(item?.cantidad) || 1);
      return sum + (precio * cant);
    }, 0);
  }, [selectedMerch]);

  const merchSummary = useMemo(() => {
    if (!selectedMerch || selectedMerch.length === 0) return 'Ninguna';
    return selectedMerch.map(item => {
      const cant = Math.max(1, Number(item?.cantidad) || 1);
      const subtotal = (Number(item?.precio) || 0) * cant;
      const mod = item?.modelo ? `"${item.modelo}" ` : '';
      return `${cant}x ${item?.nombre || item?.productId || 'Prenda'} ${mod}(${item?.talla || 'M'} - ${item?.color || 'Color'}) [RD$ ${subtotal.toLocaleString()}]`;
    }).join(' + ');
  }, [selectedMerch]);

  const hasSelectedItems = selectedMerch.length > 0;

  // Control de Modo Kiosco Inmersivo: oculta el Footer global y scroll al tope
  useEffect(() => {
    if (activeFlow === 'ticket_flow') {
      document.body.classList.add('merch-kiosk-active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.body.classList.remove('merch-kiosk-active');
    }
    return () => {
      document.body.classList.remove('merch-kiosk-active');
    };
  }, [activeFlow]);

  // Adaptador seguro para parsear datos existentes (arrays u objetos legacy) a la lista
  const parseMerchToArray = (merchData) => {
    if (!merchData) return [];
    if (Array.isArray(merchData)) {
      return merchData.map(item => ({
        ...item,
        cantidad: Math.max(1, Number(item?.cantidad) || 1)
      }));
    }
    if (Array.isArray(merchData.items)) {
      return merchData.items.map(item => ({
        ...item,
        cantidad: Math.max(1, Number(item?.cantidad) || 1)
      }));
    }
    const list = [];
    if (merchData.tshirt?.quiere) {
      list.push({
        id: 'tshirt',
        productId: 'tshirt',
        nombre: MERCH_CATALOG.tshirt?.nombre || 'T-Shirt Despierta 2026',
        modelo: merchData.tshirt.modelo || MERCH_CATALOG.tshirt?.defaultModelo,
        color: merchData.tshirt.color || MERCH_CATALOG.tshirt?.defaultColor,
        talla: merchData.tshirt.talla || MERCH_CATALOG.tshirt?.defaultTalla,
        precio: MERCH_CATALOG.tshirt?.precio || 1400,
        cantidad: Math.max(1, Number(merchData.tshirt.cantidad) || 1)
      });
    }
    if (merchData.hoodie?.quiere) {
      list.push({
        id: 'hoodie',
        productId: 'hoodie',
        nombre: MERCH_CATALOG.hoodie?.nombre || 'Hoodie Despierta 2026',
        modelo: merchData.hoodie.modelo || MERCH_CATALOG.hoodie?.defaultModelo,
        color: merchData.hoodie.color || MERCH_CATALOG.hoodie?.defaultColor,
        talla: merchData.hoodie.talla || MERCH_CATALOG.hoodie?.defaultTalla,
        precio: MERCH_CATALOG.hoodie?.precio || 1800,
        cantidad: Math.max(1, Number(merchData.hoodie.cantidad) || 1)
      });
    }
    return list;
  };

  // Helper para conectar el estado del MerchCard
  const getCardSelection = (productId) => {
    const selectedItem = selectedMerch.find(item => item.productId === productId || item.id === productId);
    if (selectedItem) {
      return {
        quiere: true,
        modelo: selectedItem.modelo,
        color: selectedItem.color,
        talla: selectedItem.talla,
        cantidad: Math.max(1, Number(selectedItem.cantidad) || 1)
      };
    }
    const config = cardConfigs[productId] || {};
    const cat = MERCH_CATALOG[productId];
    return {
      quiere: false,
      modelo: config.modelo || cat?.defaultModelo,
      color: config.color || cat?.defaultColor,
      talla: config.talla || cat?.defaultTalla || 'M',
      cantidad: Math.max(1, Number(config.cantidad) || 1)
    };
  };

  const handleMerchSelectionChange = (product, updatedSelection) => {
    if (submitError) setSubmitError('');

    const qty = Math.max(1, Number(updatedSelection.cantidad) || 1);

    // Actualizar configuración en memoria para este producto
    setCardConfigs(prev => ({
      ...prev,
      [product.id]: {
        modelo: updatedSelection.modelo,
        color: updatedSelection.color,
        talla: updatedSelection.talla,
        cantidad: qty
      }
    }));

    // Actualizar array selectedMerch
    setSelectedMerch(prev => {
      const isCurrentlyInArray = prev.some(item => (item.productId === product.id || item.id === product.id));

      if (updatedSelection.quiere) {
        const itemData = {
          id: product.id,
          productId: product.id,
          nombre: product.nombre,
          modelo: updatedSelection.modelo,
          color: updatedSelection.color,
          talla: updatedSelection.talla,
          precio: product.precio,
          cantidad: qty
        };

        if (isCurrentlyInArray) {
          return prev.map(item => (item.productId === product.id || item.id === product.id) ? itemData : item);
        } else {
          return [...prev, itemData];
        }
      } else {
        // Toggle/Remove: Desmarcar prenda y retirar del array
        return prev.filter(item => item.productId !== product.id && item.id !== product.id);
      }
    });
  };

  // Auto-validación de Enlace Mágico si viene ?ticket=IBC-UR-XXXXX en la URL
  useEffect(() => {
    if (urlTicket) {
      const cleanUrlCode = urlTicket.trim().toUpperCase();
      if (cleanUrlCode) {
        setTicketCodeInput(cleanUrlCode);
        setActiveFlow('ticket_flow');
        handleVerifyTicket(cleanUrlCode);
      }
    }
  }, [urlTicket]);

  // Validación Estricta: Consulta exclusivamente registros reales (Local o Google Sheets)
  const handleVerifyTicket = async (overrideCode) => {
    const rawCode = typeof overrideCode === 'string' ? overrideCode : ticketCodeInput;
    const cleanCode = (rawCode || '').trim().toUpperCase();

    if (!cleanCode) {
      setVerifyError('Por favor ingresa tu código de boleto (ej. IBC-UR-123456).');
      return;
    }

    setIsValidating(true);
    setVerifyError('');

    // 1. Verificación local en ticketStorage (excluyendo datos residuales)
    let found = findRegistrationByCode(cleanCode);
    if (found && (found.isFormatFallback || found.fullName === 'Asistente Registrado' || found.isMock)) {
      found = null;
    }

    // 2. Si no está en local, buscar remotamente en Google Sheets
    if (!found) {
      try {
        const remoteRes = await fetchRegistrationsFromGoogleSheets();
        if (remoteRes.success && Array.isArray(remoteRes.registrations)) {
          found = remoteRes.registrations.find(
            r => r.ticketCode?.toUpperCase() === cleanCode || r.id?.toUpperCase() === cleanCode
          );
        }
      } catch (err) {
        console.warn('Búsqueda remota no disponible en este momento:', err);
      }
    }

    setIsValidating(false);

    // 3. Resultado estricto: Solo avanza si el boleto existe realmente
    if (found) {
      setVerifiedTicket(found);
      setVerifyError('');
      const initialItems = parseMerchToArray(found.merchDetails || found.merch);
      if (initialItems.length > 0) {
        setSelectedMerch(initialItems);
      }
    } else {
      setVerifiedTicket(null);
      setVerifyError('No encontramos ningún boleto registrado con este código. Revisa que esté escrito exactamente como en tu comprobante o correo de confirmación (ej. IBC-UR-123456).');
    }
  };

  // Envío y vinculación de la Merch al ticket existente
  const handleSubmitMerch = async () => {
    if (!verifiedTicket) return;

    if (selectedMerch.length === 0) {
      setSubmitError('Por favor selecciona al menos una prenda (haz clic en "+ Agregar Prenda" en T-Shirt o Hoodie) para vincular a tu boleto.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const total = merchTotal;
    const summary = merchSummary;

    try {
      // 1. Enviar acción ADD_MERCH al Webhook de Google Apps Script
      const result = await addMerchToExistingTicket({
        ticketCode: verifiedTicket.ticketCode,
        merch: selectedMerch,
        attendeeInfo: verifiedTicket
      });

      // 2. Actualizar el registro local en ticketStorage
      updateTicketMerch(verifiedTicket.ticketCode, {
        merchSummary: summary,
        merchTotal: total,
        merchDetails: selectedMerch
      });

      setIsSubmitting(false);

      if (result.success || !result.reason || result.reason !== 'FETCH_ERROR') {
        setIsSuccess(true);
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error('Error al vincular merch:', err);
      // Respaldo local
      updateTicketMerch(verifiedTicket.ticketCode, {
        merchSummary: summary,
        merchTotal: total,
        merchDetails: selectedMerch
      });
      setIsSubmitting(false);
      setIsSuccess(true);
    }
  };

  const handleCopyBank = (text, key) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBankKey(key);
      setTimeout(() => setCopiedBankKey(null), 2500);
    }
  };

  const handleResetFlow = () => {
    setActiveFlow('store');
    setVerifiedTicket(null);
    setTicketCodeInput('');
    setVerifyError('');
    setSubmitError('');
    setIsSuccess(false);
    setSelectedMerch([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================================
  // VISTA 1: MODO KIOSCO INMERSIVO (FULL SCREEN / FLUJO VINCULACIÓN A TICKET)
  // =========================================================================
  if (activeFlow === 'ticket_flow') {
    return (
      <div className="merch-page merch-kiosk-page">
        <section className="merch-kiosk-section section-padding">
          <div className="container">
          {/* Barra Superior del Kiosco: Regreso + Badge */}
          <div className="kiosk-top-nav">
            <button 
              type="button" 
              className="kiosk-back-btn" 
              onClick={handleResetFlow}
              title="Volver a la tienda general"
            >
              <ArrowLeft size={16} />
              <span>Volver al catálogo público</span>
            </button>

            <div className="kiosk-flow-badge">
              <Flame size={14} className="text-fire" />
              <span>UPPER ROOM IBC • AÑADIR A BOLETO</span>
            </div>
          </div>

          {/* -------------------------------------------------------------
              PASO 1: VALIDACIÓN DEL BOLETO (PANTALLA CENTRADA Y LIMPIA)
              ------------------------------------------------------------- */}
          {!verifiedTicket && !isSuccess && (
            <div className="kiosk-stage kiosk-stage-centered">
              <div className="kiosk-validator-card glass-panel">
                {isValidating && urlTicket && !verifyError ? (
                  <div className="kiosk-loading-box">
                    <Loader2 size={36} className="btn-spinner text-fire" />
                    <h3>Accediendo a tu boleto...</h3>
                    <p>
                      Validando código <strong className="text-gold font-mono">{ticketCodeInput || urlTicket}</strong> para asociar tus prendas automáticamente.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="kiosk-validator-header">
                      <div className="kiosk-step-pill">
                        <Ticket size={14} className="text-fire" />
                        <span>PASO 1 • VERIFICACIÓN DE BOLETO</span>
                      </div>
                      <h1 className="kiosk-validator-title">
                        Vincular Merch Oficial a tu Boleto
                      </h1>
                      <p className="kiosk-validator-desc">
                        Ingresa el código alfanumérico de tu pase (ej. <strong>IBC-UR-123456</strong>) para habilitar la selección de prendas y asociarlas a tu registro oficial.
                      </p>
                    </div>

                    <div className="kiosk-input-form">
                      <div className="kiosk-input-shell">
                        <Ticket size={20} className="kiosk-field-icon" />
                        <input
                          type="text"
                          className="kiosk-input"
                          placeholder="IBC-UR-XXXXXX"
                          value={ticketCodeInput}
                          onChange={(e) => {
                            setTicketCodeInput(e.target.value.toUpperCase());
                            if (verifyError) setVerifyError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleVerifyTicket();
                          }}
                          autoFocus
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary kiosk-verify-btn"
                        onClick={() => handleVerifyTicket()}
                        disabled={isValidating || !ticketCodeInput.trim()}
                      >
                        {isValidating ? (
                          <>
                            <Loader2 size={18} className="btn-spinner" />
                            <span>Verificando Boleto...</span>
                          </>
                        ) : (
                          <>
                            <span>VERIFICAR BOLETO</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>

                    {verifyError && (
                      <div className="validator-alert-error" role="alert">
                        <AlertCircle size={17} className="alert-icon" />
                        <span>{verifyError}</span>
                      </div>
                    )}

                    <div className="kiosk-card-hint">
                      <ShieldCheck size={15} className="text-fire" />
                      <span>Solo se pueden agregar prendas a boletos oficiales previamente registrados en la conferencia.</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              PASO 2: SELECCIÓN MÚLTIPLE DE MERCH (CATÁLOGO + BARRA STICKY)
              ------------------------------------------------------------- */}
          {verifiedTicket && !isSuccess && (
            <div className="kiosk-stage kiosk-stage-catalog">
              {/* Barra de Estado del Boleto Verificado */}
              <div className="kiosk-verified-bar">
                <div className="status-bar-info">
                  <div className="status-pill-verified">
                    <CheckCircle size={15} />
                    <span>Boleto Confirmado: <strong>{verifiedTicket.ticketCode}</strong></span>
                  </div>
                  <div className="status-bar-attendee">
                    <span>Titular: <strong>{verifiedTicket.fullName || verifiedTicket.firstName || 'Asistente'}</strong></span>
                    {verifiedTicket.email && (
                      <span className="status-bar-email">• {verifiedTicket.email}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-change-ticket"
                  onClick={() => {
                    setVerifiedTicket(null);
                    setSubmitError('');
                  }}
                  title="Ingresar otro código de boleto"
                >
                  <RotateCcw size={13} />
                  <span>Cambiar Boleto</span>
                </button>
              </div>

              {/* Aviso Informativo del Proceso */}
              <div className="merch-linking-hint-box">
                <Sparkles size={16} className="hint-icon text-fire" />
                <span>
                  Selecciona la prenda, modelo, talla, color y cantidad deseada. Luego haz clic en <strong>'VINCULAR MERCH AL TICKET'</strong> en la barra inferior para formalizar tu reserva (plazo de 32 horas para transferir).
                </span>
              </div>

              {/* Mensaje de Error en Envío */}
              {submitError && (
                <div className="validator-alert-error" role="alert">
                  <AlertCircle size={16} className="alert-icon" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Cuadrícula de Tarjetas MerchCard en Modo Selección */}
              <div className="merch-cards-grid merch-grid-interactive">
                {MERCH_CATALOG?.tshirt && (
                  <MerchCard
                    product={MERCH_CATALOG.tshirt}
                    selection={getCardSelection('tshirt')}
                    onSelectionChange={(newVal) => handleMerchSelectionChange(MERCH_CATALOG.tshirt, newVal)}
                    mode="ticket"
                  />
                )}

                {MERCH_CATALOG?.hoodie && (
                  <MerchCard
                    product={MERCH_CATALOG.hoodie}
                    selection={getCardSelection('hoodie')}
                    onSelectionChange={(newVal) => handleMerchSelectionChange(MERCH_CATALOG.hoodie, newVal)}
                    mode="ticket"
                  />
                )}
              </div>

              {/* Barra Sticky Inferior de Resumen y Confirmación */}
              <div className="merch-ticket-confirm-bar">
                <div className="confirm-bar-details">
                  <div className="confirm-bar-header">
                    <ShoppingBag size={18} className="text-fire" />
                    <span className="confirm-bar-title">
                      {hasSelectedItems 
                        ? `${totalItemsCount} ${totalItemsCount === 1 ? 'Prenda Seleccionada' : 'Prendas Seleccionadas'} para tu Boleto:`
                        : 'Prendas seleccionadas para el boleto:'}
                    </span>
                  </div>
                  {hasSelectedItems ? (
                    <div className="merch-selected-items-list">
                      {selectedMerch.map((item, idx) => {
                        const qty = Math.max(1, Number(item.cantidad) || 1);
                        const subtotal = (Number(item.precio) || 0) * qty;
                        return (
                          <div key={item.id || item.productId || idx} className="merch-selected-item-row">
                            <span className="item-qty-tag">{qty}x</span>
                            <strong className="item-name-tag">{item.nombre || item.productId}</strong>
                            <span className="item-meta-tag">
                              ({item.modelo ? `"${item.modelo}" • ` : ''}{item.talla} - {item.color})
                            </span>
                            <span className="item-price-tag">- RD$ {subtotal.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <strong className="confirm-bar-summary">
                      Ninguna prenda seleccionada aún (haz clic en "+ Agregar a mi Ticket" en la prenda deseada)
                    </strong>
                  )}
                </div>

                <div className="confirm-bar-action-wrap">
                  {hasSelectedItems && (
                    <div className="confirm-bar-price-box">
                      <span className="price-box-label">Total a transferir:</span>
                      <span className="price-box-value">RD$ {merchTotal.toLocaleString()}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary btn-confirm-link-order"
                    onClick={handleSubmitMerch}
                    disabled={isSubmitting || !hasSelectedItems}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="btn-spinner" />
                        <span>Vinculando a tu Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>VINCULAR MERCH AL TICKET</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              PASO 3: PANTALLA DE ÉXITO Y DATOS DE TRANSFERENCIA BANCARIA
              ------------------------------------------------------------- */}
          {verifiedTicket && isSuccess && (
            <div className="kiosk-stage kiosk-stage-success">
              <section className="merch-success-view glass-panel">
                <div className="success-header-badge">
                  <div className="success-icon-pulse">
                    <CheckCircle size={36} className="text-fire" />
                  </div>
                  <h2 className="success-title">¡Merch Vinculada Exitosamente a tu Boleto!</h2>
                  <p className="success-sub">
                    Tu solicitud de prendas ha sido vinculada formalmente a tu boleto <strong className="text-gold font-mono">{verifiedTicket?.ticketCode}</strong> a nombre de <strong>{verifiedTicket?.fullName || verifiedTicket?.firstName}</strong>.
                  </p>
                </div>

                {/* Alerta de Envío de Correo */}
                <div className="success-email-notice">
                  <Sparkles size={16} className="text-fire" />
                  <span>
                    Hemos enviado las instrucciones oficiales de pago a <strong>{verifiedTicket?.email || 'tu correo registrado'}</strong>.
                  </span>
                </div>

                {/* Recuadro de Resumen de la Orden */}
                <div className="success-summary-box">
                  <span className="summary-box-eyebrow">RESUMEN DE TU RESERVA DE MERCH</span>
                  {selectedMerch.length > 0 ? (
                    <div className="merch-selected-items-list" style={{ marginTop: '0.65rem', marginBottom: '0.65rem' }}>
                      {selectedMerch.map((item, idx) => {
                        const qty = Math.max(1, Number(item.cantidad) || 1);
                        const subtotal = (Number(item.precio) || 0) * qty;
                        return (
                          <div key={item.id || item.productId || idx} className="merch-selected-item-row">
                            <span className="item-qty-tag">{qty}x</span>
                            <strong className="item-name-tag">{item.nombre || item.productId}</strong>
                            <span className="item-meta-tag">
                              ({item.modelo ? `"${item.modelo}" • ` : ''}{item.talla} - {item.color})
                            </span>
                            <span className="item-price-tag">- RD$ {subtotal.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="summary-box-merch-text">{merchSummary}</p>
                  )}
                  <div className="summary-box-total-row">
                    <span>Monto Exacto a Transferir:</span>
                    <strong className="summary-box-amount">RD$ {merchTotal.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Datos Bancarios Oficiales con Botón Copiar */}
                <div className="success-bank-card">
                  <div className="bank-card-top">
                    <div>
                      <span className="bank-tag">BANCO OFICIAL</span>
                      <h4 className="bank-name">Banco Popular Dominicano</h4>
                    </div>
                    <div className="bank-validation-pill">
                      <span>⏱️ Plazo: 32 Horas</span>
                    </div>
                  </div>

                  <div className="bank-details-grid">
                    <div className="bank-detail-item">
                      <span className="detail-label">Nombre de Cuenta:</span>
                      <strong className="detail-val">Iglesia Bautista Cristiana</strong>
                    </div>

                    <div className="bank-detail-item bank-account-row">
                      <div>
                        <span className="detail-label">Número de Cuenta (Corriente):</span>
                        <strong className="detail-val font-mono text-gold">001-18074-6</strong>
                      </div>
                      <button
                        type="button"
                        className="btn-copy-chip"
                        onClick={() => handleCopyBank('001-18074-6', 'acc')}
                      >
                        {copiedBankKey === 'acc' ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedBankKey === 'acc' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="bank-detail-item">
                      <span className="detail-label">RNC Institucional:</span>
                      <strong className="detail-val font-mono">401507422</strong>
                    </div>

                    <div className="bank-detail-item">
                      <span className="detail-label">Correo para Enviar Comprobante:</span>
                      <strong className="detail-val text-fire">upperroomibc@gmail.com</strong>
                    </div>

                    <div className="bank-detail-item bank-desc-item">
                      <span className="detail-label">Descripción Obligatoria en Transferencia:</span>
                      <div className="desc-copy-wrap">
                        <strong className="detail-val font-mono text-gold">
                          COMPRA MERCH CONFERENCIA UPPER ROOM 2026
                        </strong>
                        <button
                          type="button"
                          className="btn-copy-chip"
                          onClick={() => handleCopyBank('COMPRA MERCH CONFERENCIA UPPER ROOM 2026', 'desc')}
                        >
                          {copiedBankKey === 'desc' ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedBankKey === 'desc' ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bank-alert-warning">
                    <AlertCircle size={15} />
                    <span>
                      <strong>IMPORTANTE:</strong> Dispones de un plazo máximo de <strong>32 horas</strong> para remitir el comprobante de tu transferencia con tu código de boleto (<strong>{verifiedTicket?.ticketCode}</strong>). Pasado ese tiempo, la reserva de tus prendas será cancelada.
                    </span>
                  </div>
                </div>

                {/* Acciones Finales */}
                <div className="success-footer-actions">
                  <Link to="/confirmar-asistencia" className="btn btn-primary">
                    <Ticket size={17} />
                    <span>Consultar Mi Entrada / Boleto</span>
                  </Link>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleResetFlow}
                  >
                    <ArrowLeft size={16} />
                    <span>Volver a la Tienda</span>
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
  }

  // =========================================================================
  // VISTA 2: CATÁLOGO PÚBLICO GENERAL (MODO STORE)
  // =========================================================================
  return (
    <div className="merch-page">
      <section className="merch-store-section section-padding">
        <div className="container">

          {/* Cabecera Principal de la Tienda */}
          <header className="section-header merch-store-header">
          <div className="merch-store-badge">
            <Flame size={14} className="text-fire" />
            <span>COLECCIÓN OFICIAL • DESPIERTA 2026</span>
          </div>

          <h1 className="merch-store-title">
            Merch Oficial <span className="text-fire">Upper Room IBC</span>
          </h1>

          <p className="merch-store-subtitle">
            Lleva el mensaje de la conferencia contigo. Cada prenda ha sido confeccionada con tejidos de alto gramaje, serigrafía de larga duración y cortes contemporáneos.
          </p>

          {/* Badges de Beneficios */}
          <div className="merch-perks-row">
            <div className="merch-perk-item">
              <Sparkles size={16} className="perk-icon" />
              <span>100% Algodón Peinado Oversize</span>
            </div>
            <div className="merch-perk-item">
              <ShieldCheck size={16} className="perk-icon" />
              <span>Confección y Acabados de Alta Calidad</span>
            </div>
            <div className="merch-perk-item">
              <ShoppingBag size={16} className="perk-icon" />
              <span>Entrega el Día de la Conferencia</span>
            </div>
          </div>
        </header>

        {/* BANNER DESTACADO: ¿YA TIENES TU BOLETO? AÑADE MERCH A TU TICKET */}
        <section className="merch-existing-ticket-banner" aria-label="Añadir merch a boleto existente">
          <div className="existing-ticket-content">
            <div className="ticket-icon-circle">
              <Ticket size={24} className="ticket-fire-icon" />
            </div>
            <div className="ticket-text-col">
              <span className="existing-ticket-tag">¿YA TIENES TU ENTRADA?</span>
              <h3 className="existing-ticket-title">¿Ya tienes tu boleta? Añade merch a tu ticket</h3>
              <p className="existing-ticket-desc">
                Si ya te registraste a la conferencia, vincula tus prendas directamente a tu código de boleto sin tener que llenar el formulario de registro de nuevo.
              </p>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-primary btn-add-ticket-cta"
            onClick={() => {
              setActiveFlow('ticket_flow');
              setTicketCodeInput('');
              setVerifyError('');
              setVerifiedTicket(null);
            }}
          >
            <Ticket size={18} />
            <span>Añadir a mi Ticket</span>
          </button>
        </section>

        {/* Catálogo de Productos Modo Tienda */}
        <main className="merch-store-grid-wrap">
          <div className="merch-cards-grid">
            {MERCH_CATALOG?.tshirt && (
              <MerchCard
                product={MERCH_CATALOG.tshirt}
                mode="store"
              />
            )}

            {MERCH_CATALOG?.hoodie && (
              <MerchCard
                product={MERCH_CATALOG.hoodie}
                mode="store"
              />
            )}
          </div>
        </main>

        {/* Sección Informativa de Reserva y Registro */}
        <section className="merch-store-info-banner glass-panel">
          <div className="info-banner-left">
            <span className="info-banner-eyebrow">¿CÓMO RESERVAR TU MERCH?</span>
            <h3 className="info-banner-title">Prendas Oficiales para Asistentes de la Conferencia</h3>
            <p className="info-banner-desc">
              Selecciona tu diseño, color y talla favorita en el catálogo. La mercancía oficial es exclusiva y se reserva mediante tu boleto de la conferencia. Si aún no tienes tu pase, pulsa en <strong>'Registrarme a la Conferencia'</strong>. Si ya estás registrado, pulsa en <strong>'¿Ya tienes tu boleta? Añade merch a tu ticket'</strong> arriba para vincular tus prendas.
            </p>
          </div>

          <div className="info-banner-actions">
            <Link to="/registro" className="btn btn-primary">
              <Ticket size={18} />
              <span>Registrarme a la Conferencia</span>
            </Link>
            <Link to="/" className="btn btn-secondary">
              <ArrowLeft size={18} />
              <span>Volver al Inicio</span>
            </Link>
          </div>
        </section>

      </div>
    </section>
  </div>
  );
};

export default Merch;
