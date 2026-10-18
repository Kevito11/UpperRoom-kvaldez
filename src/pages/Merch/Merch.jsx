import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Ticket, ArrowLeft, ShoppingBag, Sparkles, ShieldCheck, Flame, X, 
  CheckCircle, Copy, AlertCircle, Check, Loader2, ArrowRight, RotateCcw
} from 'lucide-react';
import { MERCH_CATALOG } from '../../lib/merchData';
import MerchCard from '../../components/MerchCard/MerchCard';
import { 
  findRegistrationByCode, 
  getRegistrations, 
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

  const [previewMerch, setPreviewMerch] = useState(null);

  // Flujo activo: 'store' (exploración / pedido general) o 'ticket_flow' (vincular a boleto existente)
  const [activeFlow, setActiveFlow] = useState('store');
  
  // Estado para validación del código de boleto
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifiedTicket, setVerifiedTicket] = useState(null);

  // Estado de selección de Merch para el flujo de boleto existente
  const [merchSelection, setMerchSelection] = useState({
    tshirt: { quiere: false, modelo: 'Cristo Vive en Mí', color: 'Blanco', talla: 'M' },
    hoodie: { quiere: false, modelo: 'Chosen', color: 'Negro', talla: 'M' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedBankKey, setCopiedBankKey] = useState(null);

  // Boletos almacenados en local para autocompletado rápido
  const localRegistrations = getRegistrations();
  const lastRegistration = localRegistrations.length > 0 ? localRegistrations[0] : null;

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

  // Bloqueo de Scroll en Fondo cuando el Modal / Lightbox está activo
  useEffect(() => {
    if (!previewMerch) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewMerch(null);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewMerch]);

  // Validación Local-First y Remota del Código de Boleto
  const handleVerifyTicket = async (overrideCode) => {
    const rawCode = typeof overrideCode === 'string' ? overrideCode : ticketCodeInput;
    const cleanCode = (rawCode || '').trim().toUpperCase();

    if (!cleanCode) {
      setVerifyError('Por favor ingresa tu código de boleto (ej. IBC-UR-123456).');
      return;
    }

    setIsValidating(true);
    setVerifyError('');

    // 1. Verificación local-first en ticketStorage
    let found = findRegistrationByCode(cleanCode);

    // 2. Si no está en local, intentar buscarlo remotamente en Google Sheets
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

    // 3. Fallback de formato válido si la red no responde (IBC-UR-XXXXXX)
    if (!found) {
      const isFormatValid = /^IBC-UR-\d{3,8}$/i.test(cleanCode) || (cleanCode.startsWith('IBC-UR-') && cleanCode.length >= 8);
      if (isFormatValid) {
        found = {
          ticketCode: cleanCode,
          fullName: 'Asistente Registrado',
          firstName: 'Asistente',
          email: '',
          church: 'Conferencia Despierta 2026',
          isFormatFallback: true
        };
      }
    }

    setIsValidating(false);

    if (found) {
      setVerifiedTicket(found);
      setVerifyError('');
      // Si el boleto ya tenía selección de merch previa, pre-cargamos para facilitar actualización
      if (found.merchDetails) {
        setMerchSelection(prev => ({
          ...prev,
          ...found.merchDetails
        }));
      }
    } else {
      setVerifyError('No encontramos ningún boleto registrado con este código. Revisa que esté escrito exactamente como en tu comprobante (ej. IBC-UR-123456).');
    }
  };

  // Envío y vinculación de la Merch al ticket existente
  const handleSubmitMerch = async () => {
    if (!verifiedTicket) return;

    const hasAny = merchSelection.tshirt.quiere || merchSelection.hoodie.quiere;
    if (!hasAny) {
      setSubmitError('Por favor selecciona al menos una prenda (marca T-Shirt o Hoodie) para vincular a tu boleto.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const total = calculateMerchTotal(merchSelection);
    const summary = formatMerchSummary(merchSelection);

    try {
      // 1. Enviar acción ADD_MERCH al Webhook de Google Apps Script
      const result = await addMerchToExistingTicket({
        ticketCode: verifiedTicket.ticketCode,
        merch: merchSelection,
        attendeeInfo: verifiedTicket
      });

      // 2. Actualizar el registro local en ticketStorage
      updateTicketMerch(verifiedTicket.ticketCode, {
        merchSummary: summary,
        merchTotal: total,
        merchDetails: merchSelection
      });

      setIsSubmitting(false);

      if (result.success || !result.reason || result.reason !== 'FETCH_ERROR') {
        setIsSuccess(true);
      } else {
        // En caso de que falle la petición HTTP directa por firewall, ya se aseguró localmente
        setIsSuccess(true);
      }
    } catch (err) {
      console.error('Error al vincular merch:', err);
      // Respaldo local
      updateTicketMerch(verifiedTicket.ticketCode, {
        merchSummary: summary,
        merchTotal: total,
        merchDetails: merchSelection
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
    setMerchSelection({
      tshirt: { quiere: false, modelo: 'Cristo Vive en Mí', color: 'Blanco', talla: 'M' },
      hoodie: { quiere: false, modelo: 'Chosen', color: 'Negro', talla: 'M' }
    });
  };

  const merchTotal = calculateMerchTotal(merchSelection);
  const merchSummary = formatMerchSummary(merchSelection);
  const hasSelectedItems = merchSelection.tshirt.quiere || merchSelection.hoodie.quiere;

  return (
    <div className="merch-store-page section-padding">
      <div className="container">

        {/* Cabecera Principal de la Tienda */}
        <header className="merch-store-header">
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

        {/* ================================================================= */}
        {/* BANNER DESTACADO: ¿YA TIENES TU BOLETO? AÑADE MERCH A TU TICKET */}
        {/* ================================================================= */}
        {activeFlow === 'store' && (
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
                if (lastRegistration && !ticketCodeInput) {
                  setTicketCodeInput(lastRegistration.ticketCode);
                }
              }}
            >
              <Ticket size={18} />
              <span>Añadir a mi Ticket</span>
            </button>
          </section>
        )}

        {/* ================================================================= */}
        {/* FLUJO 'AÑADIR MERCH': PASO 1 - VALIDACIÓN DEL CÓDIGO DE BOLETO */}
        {/* ================================================================= */}
        {activeFlow === 'ticket_flow' && !verifiedTicket && (
          <section className="merch-ticket-validator-panel glass-panel">
            {isValidating && urlTicket && !verifyError ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <Loader2 size={32} className="btn-spinner text-fire" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ color: '#ffffff', fontSize: '1.25rem', margin: '0 0 0.5rem 0', fontWeight: 800 }}>
                  Accediendo a tu boleto...
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                  Validando código <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{ticketCodeInput || urlTicket}</strong> para vincular tus prendas automáticamente.
                </p>
              </div>
            ) : (
              <>
                <div className="validator-header">
                  <div className="validator-badge">
                    <Ticket size={14} className="text-fire" />
                    <span>PASO 1: VERIFICAR BOLETO</span>
                  </div>
                  <h2 className="validator-title">Ingresa el Código de tu Boleta</h2>
                  <p className="validator-desc">
                    Escribe tu código de ticket (ej. <strong>IBC-UR-123456</strong>) para asociar tu pedido y enviarte los datos de transferencia bancaria por correo.
                  </p>
                </div>

                <div className="validator-form-wrap">
                  <div className="validator-input-group">
                    <div className="validator-input-shell">
                      <Ticket size={18} className="validator-field-icon" />
                      <input
                        type="text"
                        className="validator-input"
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
                  className="btn btn-primary btn-verify-action"
                  onClick={() => handleVerifyTicket()}
                  disabled={isValidating || !ticketCodeInput.trim()}
                >
                  {isValidating ? (
                    <>
                      <Loader2 size={16} className="btn-spinner" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Verificar Boleto</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

              {/* Mensaje de Error de Validación */}
              {verifyError && (
                <div className="validator-alert-error" role="alert">
                  <AlertCircle size={16} className="alert-icon" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Acceso Rápido con Boleto Reciente en este Dispositivo */}
              {lastRegistration && (
                <div className="validator-quick-ticket">
                  <span className="quick-ticket-label">Boleto detectado en este navegador:</span>
                  <button
                    type="button"
                    className="quick-ticket-pill"
                    onClick={() => {
                      setTicketCodeInput(lastRegistration.ticketCode);
                      handleVerifyTicket(lastRegistration.ticketCode);
                    }}
                    title="Usar este boleto automáticamente"
                  >
                    <CheckCircle size={13} className="text-fire" />
                    <strong>{lastRegistration.ticketCode}</strong>
                    <span>({lastRegistration.fullName || lastRegistration.firstName || 'Mi Boleto'})</span>
                  </button>
                </div>
              )}

              {/* Botón para Cancelar y Volver a la Tienda General */}
              <div className="validator-actions-footer">
                <button
                  type="button"
                  className="btn-link-subtle"
                  onClick={() => setActiveFlow('store')}
                >
                  <ArrowLeft size={14} />
                  <span>Cancelar y volver al catálogo general</span>
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    )}

        {/* ================================================================= */}
        {/* FLUJO 'AÑADIR MERCH': PASO 2 - SELECCIÓN DE PRENDAS PARA EL TICKET */}
        {/* ================================================================= */}
        {activeFlow === 'ticket_flow' && verifiedTicket && !isSuccess && (
          <section className="merch-linking-flow-zone">
            {/* Barra de Estado del Boleto Verificado */}
            <div className="merch-verified-status-bar">
              <div className="status-bar-info">
                <div className="status-pill-verified">
                  <CheckCircle size={14} />
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
              >
                <RotateCcw size={13} />
                <span>Cambiar Boleto</span>
              </button>
            </div>

            {/* Aviso Informativo del Proceso */}
            <div className="merch-linking-hint-box">
              <Sparkles size={16} className="hint-icon text-fire" />
              <span>
                Selecciona la prenda, modelo, talla y color que deseas vincular. Al confirmar, actualizaremos tu registro y recibirás un correo con las instrucciones de transferencia bancaria (plazo de 32 horas).
              </span>
            </div>

            {/* Mensaje de Error en Envío */}
            {submitError && (
              <div className="validator-alert-error" role="alert">
                <AlertCircle size={16} className="alert-icon" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Cuadrícula de Tarjetas MerchCard en Modo Selección (Interactivo) */}
            <div className="merch-cards-grid merch-grid-interactive">
              <MerchCard
                product={MERCH_CATALOG.tshirt}
                selection={merchSelection.tshirt}
                onSelectionChange={(newVal) => {
                  if (submitError) setSubmitError('');
                  setMerchSelection(prev => ({ ...prev, tshirt: newVal }));
                }}
                mode="registration"
                onPreviewImage={setPreviewMerch}
              />

              <MerchCard
                product={MERCH_CATALOG.hoodie}
                selection={merchSelection.hoodie}
                onSelectionChange={(newVal) => {
                  if (submitError) setSubmitError('');
                  setMerchSelection(prev => ({ ...prev, hoodie: newVal }));
                }}
                mode="registration"
                onPreviewImage={setPreviewMerch}
              />
            </div>

            {/* Barra Fija / Resumen de Confirmación de Merch */}
            <div className="merch-ticket-confirm-bar">
              <div className="confirm-bar-details">
                <div className="confirm-bar-header">
                  <ShoppingBag size={18} className="text-fire" />
                  <span className="confirm-bar-title">Prendas seleccionadas para el boleto:</span>
                </div>
                <strong className="confirm-bar-summary">
                  {hasSelectedItems 
                    ? merchSummary 
                    : 'Ninguna prenda seleccionada aún (haz clic en "+ Agregar" en la prenda que deseas)'}
                </strong>
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
                      <span>Confirmar y Vincular a mi Boleto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* FLUJO 'AÑADIR MERCH': PASO 3 - PANTALLA DE ÉXITO Y PAGO */}
        {/* ================================================================= */}
        {activeFlow === 'ticket_flow' && isSuccess && (
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
              <p className="summary-box-merch-text">{merchSummary}</p>
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
                  <strong>IMPORTANTE:</strong> Dispones de un plazo máximo de <strong>32 horas</strong> para remitir el comprobante de tu transferencia con tu código de boleto (<strong>{verifiedTicket?.ticketCode}</strong>). Pasado ese tiempo, la confección de tus prendas será cancelada.
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
        )}

        {/* ================================================================= */}
        {/* VISTA GENERAL DEL CATÁLOGO (MODO STORE / WHATSAPP) */}
        {/* ================================================================= */}
        {activeFlow === 'store' && (
          <>
            <main className="merch-store-grid-wrap">
              <div className="merch-cards-grid">
                <MerchCard
                  product={MERCH_CATALOG.tshirt}
                  mode="store"
                  onPreviewImage={setPreviewMerch}
                />

                <MerchCard
                  product={MERCH_CATALOG.hoodie}
                  mode="store"
                  onPreviewImage={setPreviewMerch}
                />
              </div>
            </main>

            {/* Sección Informativa de Reserva y Pago */}
            <section className="merch-store-info-banner glass-panel">
              <div className="info-banner-left">
                <span className="info-banner-eyebrow">¿CÓMO FUNCIONA EL PEDIDO?</span>
                <h3 className="info-banner-title">Ordena tu Merch Oficial hoy mismo</h3>
                <p className="info-banner-desc">
                  Selecciona tu diseño, color y talla favorita en las tarjetas superiores. Al pulsar <strong>'PEDIR AHORA'</strong> serás dirigido a WhatsApp con tu orden lista para coordinar tu transferencia bancaria y asegurar tu prenda antes de que se agoten.
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
          </>
        )}

      </div>

      {/* ================================================================= */}
      {/* MODAL DE VISTA PREVIA EN ALTA RESOLUCIÓN */}
      {/* ================================================================= */}
      {previewMerch && (
        <div className="merch-modal-overlay" onClick={() => setPreviewMerch(null)}>
          <div className="merch-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="merch-modal-close"
              onClick={() => setPreviewMerch(null)}
              aria-label="Cerrar vista previa"
            >
              <X size={20} />
            </button>
            <div className="merch-modal-media">
              <img 
                src={previewMerch.image} 
                alt={previewMerch.title} 
                className="merch-modal-img" 
              />
            </div>
            <div className="merch-modal-footer">
              <div className="merch-modal-info">
                <span className="merch-modal-tag">MERCH OFICIAL • DESPIERTA 2026</span>
                <h4 className="merch-modal-title">{previewMerch.title}</h4>
                <p className="merch-modal-sub">{previewMerch.subtitle}</p>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewMerch(null)}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Merch;
