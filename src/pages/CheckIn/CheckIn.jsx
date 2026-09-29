import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Users, CheckCircle2, Clock, Search, RefreshCw, 
  UserPlus, Flame, ShieldCheck, Phone, Mail, MapPin, 
  Ticket, AlertCircle, Check, X, Sparkles,
  Eye, Copy, Lock, QrCode, ArrowDown, ArrowUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  getRegistrations, 
  toggleAttendance, 
  markAttendance, 
  saveQuickRegistration,
  replaceWithRemoteRegistrations,
  getCheckInStats 
} from '../../lib/ticketStorage';
import { 
  fetchRegistrationsFromGoogleSheets,
  syncAttendanceToGoogleSheets,
  sendQuickRegistrationToGoogleSheets 
} from '../../lib/googleSheetsService';
import './CheckIn.css';

/**
 * Masking helpers to preserve privacy:
 * Prevents full email or phone numbers from being exposed on screen.
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '••••@••••.com';
  const [user, domain] = email.split('@');
  const visible = user.slice(0, Math.min(2, user.length));
  const domainParts = domain.split('.');
  const domainFirst = domainParts[0] || '';
  const maskedDomain = domainFirst.slice(0, 1) + '••••.' + domainParts.slice(1).join('.');
  return `${visible}••••@${maskedDomain}`;
};

const maskPhone = (phone) => {
  if (!phone) return '•••-•••-••••';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '•••-•••-••••';
  const last4 = digits.slice(-4);
  return `(•••) •••-${last4}`;
};

const CheckIn = () => {
  const [searchParams] = useSearchParams();
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Separate sync states for Download (Sheet -> Local) and Upload (Local -> Sheet)
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null); // { type: 'success'|'warning'|'error', title: '', message: '' }

  // Tooltip on mobile long-press (aparece debajo del botón/dedo)
  const [activeTooltip, setActiveTooltip] = useState(null);
  const longPressTimerRef = useRef(null);
  const isLongPressActiveRef = useRef(false);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  const startHold = (tooltipData, e) => {
    // Only primary button (left click) or touch
    if (e.button !== undefined && e.button !== 0) return;

    isLongPressActiveRef.current = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    touchStartPosRef.current = { x: clientX, y: clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      setActiveTooltip(tooltipData);
      try {
        if (navigator.vibrate) navigator.vibrate(35);
      } catch (err) {}
    }, 500);
  };

  const moveHold = (e) => {
    if (!longPressTimerRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const diffX = Math.abs(clientX - touchStartPosRef.current.x);
    const diffY = Math.abs(clientY - touchStartPosRef.current.y);

    // Cancel if user scrolled or dragged > 10px
    if (diffX > 10 || diffY > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const endHold = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleActionClick = (actionFn, e) => {
    // If user held button to view description, do NOT trigger the action
    if (isLongPressActiveRef.current) {
      e?.preventDefault();
      e?.stopPropagation();
      isLongPressActiveRef.current = false;
      return;
    }
    actionFn();
  };

  // Auto-dismiss tooltip after delay or on outside click
  useEffect(() => {
    if (!activeTooltip) return;

    let dismissTimeout;
    const handleDismiss = (e) => {
      if (e.target?.closest && e.target.closest('.touch-hold-tooltip')) {
        return;
      }
      setActiveTooltip(null);
    };

    dismissTimeout = setTimeout(() => {
      setActiveTooltip(null);
    }, 6000);

    const attachTimer = setTimeout(() => {
      window.addEventListener('pointerdown', handleDismiss);
    }, 280);

    return () => {
      clearTimeout(dismissTimeout);
      clearTimeout(attachTimer);
      window.removeEventListener('pointerdown', handleDismiss);
    };
  }, [activeTooltip]);
  
  // Quick Door Registration modal state ("¿No estás registrado?")
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickForm, setQuickForm] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [quickError, setQuickError] = useState('');
  const [quickSuccessRecord, setQuickSuccessRecord] = useState(null);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState(null);
  // Last checked-in banner feedback
  const [justCheckedInCode, setJustCheckedInCode] = useState(null);

  // Real-time check-in stats
  const stats = useMemo(() => getCheckInStats(registrations), [registrations]);

  // Load initial local data and ensure every record has a valid ticketCode
  const loadLocalData = () => {
    const list = getRegistrations();
    const normalized = list.map((item, idx) => {
      const code = item.ticketCode || item.id || item.code || item.ticket_code || item.ticket || `IBC-UR-${String(100000 + idx)}`;
      return {
        ...item,
        ticketCode: code,
        id: item.id || code
      };
    });
    setRegistrations(normalized);
  };

  // 1. Descargar datos desde Google Sheets hacia la base local (Flecha abajo ⬇)
  const handleDownloadFromSheet = async () => {
    setIsDownloading(true);
    setSyncFeedback({
      type: 'warning',
      title: 'Consultando Google Sheets...',
      message: 'Conectando con la hoja de cálculo para traer los datos más recientes...'
    });

    try {
      const res = await fetchRegistrationsFromGoogleSheets();
      if (res && res.success && Array.isArray(res.registrations)) {
        const { total, mergedList } = replaceWithRemoteRegistrations(res.registrations);
        setRegistrations([...mergedList]);
        setSyncFeedback({
          type: 'success',
          title: '¡Descarga Completada!',
          message: `Se actualizaron ${total} participantes directamente desde Google Sheets.`
        });
      } else {
        setSyncFeedback({
          type: 'error',
          title: 'Error de Descarga',
          message: res?.message || 'No se pudieron descargar los registros de Google Sheets.'
        });
      }
    } catch (error) {
      console.error("Error al descargar de Google Sheets:", error);
      setSyncFeedback({
        type: 'error',
        title: 'Error de Conexión',
        message: error.message || 'No se pudo conectar con Google Sheets para descargar los datos.'
      });
    } finally {
      setIsDownloading(false);
      setTimeout(() => {
        setSyncFeedback(prev => prev ? null : prev);
      }, 6000);
    }
  };

  // 2. Subir asistencias marcadas localmente hacia Google Sheets (Flecha arriba ⬆)
  const handleUploadToSheet = async () => {
    setIsUploading(true);
    setSyncFeedback(null);

    try {
      const localItems = getRegistrations();
      const attendedItems = localItems.filter(r => r.status === 'ATTENDED' || r.attended);

      if (attendedItems.length === 0) {
        setSyncFeedback({
          type: 'warning',
          title: 'Sin Asistencias para Subir',
          message: 'No hay asistencias registradas localmente para enviar a Google Sheets.'
        });
        setIsUploading(false);
        return;
      }

      const res = await syncAttendanceToGoogleSheets(attendedItems);
      if (res && res.success) {
        setSyncFeedback({
          type: 'success',
          title: 'Subida Completada',
          message: `Se subieron con éxito ${attendedItems.length} asistencias marcadas a Google Sheets.`
        });
      } else {
        setSyncFeedback({
          type: 'error',
          title: 'Error al Subir',
          message: 'No se pudieron enviar las asistencias a Google Sheets.'
        });
      }
    } catch (error) {
      console.error("Error al subir a Google Sheets:", error);
      setSyncFeedback({
        type: 'error',
        title: 'Error de Conexión',
        message: 'No se pudo conectar con Google Sheets para subir las asistencias.'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setSyncFeedback(prev => prev ? null : prev);
      }, 5000);
    }
  };

  useEffect(() => {
    loadLocalData();
    // Si la base local está completamente vacía, descargar automáticamente
    const current = getRegistrations();
    if (!current || current.length === 0) {
      handleDownloadFromSheet();
    }
  }, []);

  // Lock body scroll when modal is open to prevent background movement
  useEffect(() => {
    if (showQuickModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [showQuickModal]);

  // Filtered attendees - ONLY shows results when user has typed a query (at least 2 chars)
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      return [];
    }

    const rawDigits = searchQuery.replace(/\D/g, '');

    return registrations.filter(r => {
      const name = `${r.firstName || ''} ${r.lastName || ''} ${r.fullName || ''}`.toLowerCase();
      const code = (r.ticketCode || r.id || r.code || '').toLowerCase();
      const email = (r.email || '').toLowerCase();
      const phone = (r.phone || '').replace(/\D/g, '');
      const church = (r.church || '').toLowerCase();

      return (
        name.includes(query) ||
        code.includes(query) ||
        email.includes(query) ||
        church.includes(query) ||
        (rawDigits.length >= 3 && phone.includes(rawDigits))
      );
    });
  }, [registrations, searchQuery]);

  // Handle single check-in confirmation
  const handleConfirmCheckIn = (ticketCode) => {
    const updated = markAttendance(ticketCode);
    if (updated) {
      loadLocalData();
      setJustCheckedInCode(ticketCode);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff6a00', '#fbbf24', '#22c55e', '#ffffff']
        });
      } catch (err) {}
    }
  };



  // Handle Quick Registration ("¿No estás Registrado?")
  // Automatically marks attendance upon registration because they are already at the door!
  const handleQuickRegisterSubmit = async (e) => {
    e.preventDefault();
    setQuickError('');

    if (!quickForm.fullName.trim()) {
      setQuickError('Por favor ingresa tu nombre y apellido.');
      return;
    }
    if (!quickForm.email.trim() || !quickForm.email.includes('@')) {
      setQuickError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!quickForm.phone.trim() || quickForm.phone.trim().length < 7) {
      setQuickError('Ingresa un número de teléfono o WhatsApp válido.');
      return;
    }

    setIsSubmittingQuick(true);

    try {
      // Always auto-check in because they register in person at the door
      const newRecord = saveQuickRegistration({
        fullName: quickForm.fullName.trim(),
        email: quickForm.email.trim(),
        phone: quickForm.phone.trim(),
        autoCheckIn: true
      });

      if (!newRecord) {
        setQuickError('Error al guardar el registro local.');
        setIsSubmittingQuick(false);
        return;
      }

      loadLocalData();
      setQuickSuccessRecord(newRecord);
      setJustCheckedInCode(newRecord.ticketCode);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ff6a00', '#fbbf24', '#22c55e', '#ffffff']
        });
      } catch (err) {}

      // Sincronizar en segundo plano con Google Sheets
      sendQuickRegistrationToGoogleSheets(newRecord).catch(err => {
        console.warn("Background sheet sync error for quick register:", err);
      });

      setQuickForm({
        fullName: '',
        email: '',
        phone: ''
      });
    } catch (err) {
      console.error(err);
      setQuickError('Ocurrió un error inesperado al registrar.');
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="checkin-page">
      <div className="checkin-container">
        
        {/* Top Header Bar */}
        <div className="checkin-top-console-bar glass-panel">
          <div className="console-brand-wrap">
            <img 
              src={`${import.meta.env.BASE_URL}logos/logo-upperroom-negro.png`} 
              alt="Upper Room IBC" 
              className="console-brand-logo" 
            />
            <div className="console-brand-text">
              <span className="cb-main">UPPER ROOM IBC</span>
              <span className="cb-sub">CONFERENCIA DESPIERTA 2026</span>
            </div>
          </div>

          <div className="console-top-meta">
            {/* Dos botones de flechas: Descargar de Sheet (⬇) y Subir a Sheet (⬆) */}
            <div className="arrow-sync-group">
              <button 
                type="button"
                className={`arrow-sync-btn arrow-btn-down ${isDownloading ? 'is-loading' : ''} ${activeTooltip?.id === 'download' ? 'is-holding' : ''}`}
                onClick={(e) => handleActionClick(handleDownloadFromSheet, e)}
                onPointerDown={(e) => startHold({
                  id: 'download',
                  title: 'Descargar de Google Sheets',
                  desc: 'Trae y actualiza la lista de registrados desde la hoja de cálculo. Mantiene seguras tus asistencias locales.',
                  icon: <ArrowDown size={18} color="#60a5fa" />
                }, e)}
                onPointerMove={moveHold}
                onPointerUp={endHold}
                onPointerCancel={endHold}
                onPointerLeave={endHold}
                disabled={isDownloading || isUploading}
                title="Descargar datos desde Google Sheets a local (Mantén presionado para ver descripción)"
                aria-label="Descargar datos desde Google Sheets"
              >
                <ArrowDown size={20} className={isDownloading ? 'arrow-bounce-down' : ''} />
              </button>

              <button 
                type="button"
                className={`arrow-sync-btn arrow-btn-up ${isUploading ? 'is-loading' : ''} ${activeTooltip?.id === 'upload' ? 'is-holding' : ''}`}
                onClick={(e) => handleActionClick(handleUploadToSheet, e)}
                onPointerDown={(e) => startHold({
                  id: 'upload',
                  title: 'Subir a Google Sheets',
                  desc: 'Envía a Google Sheets las asistencias (check-ins) marcadas en este celular para respaldarlas en la nube.',
                  icon: <ArrowUp size={18} color="#4ade80" />
                }, e)}
                onPointerMove={moveHold}
                onPointerUp={endHold}
                onPointerCancel={endHold}
                onPointerLeave={endHold}
                disabled={isDownloading || isUploading}
                title="Subir asistencias locales a Google Sheets (Mantén presionado para ver descripción)"
                aria-label="Subir asistencias locales a Google Sheets"
              >
                <ArrowUp size={20} className={isUploading ? 'arrow-bounce-up' : ''} />
              </button>

              {/* Tooltip flotante DEBAJO del botón (evita tapar con el dedo) */}
              {activeTooltip && (
                <div 
                  className={`touch-hold-tooltip tooltip-align-${activeTooltip.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className="touch-hold-caret"
                    style={{
                      right: activeTooltip.id === 'upload' ? '14px' : '56px'
                    }}
                  />
                  <div className="touch-hold-content">
                    <div className="touch-hold-header">
                      <div className={`touch-hold-icon-badge badge-${activeTooltip.id}`}>
                        {activeTooltip.icon}
                      </div>
                      <span className="touch-hold-title">{activeTooltip.title}</span>
                      <button 
                        type="button" 
                        className="touch-hold-close-btn"
                        onClick={() => setActiveTooltip(null)}
                        aria-label="Cerrar descripción"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="touch-hold-desc">{activeTooltip.desc}</p>
                    <div className="touch-hold-footer">
                      <span>Toca en cualquier parte para cerrar</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sync Feedback Alert */}
        {syncFeedback && (
          <div className={`sync-feedback-alert glass-panel ${syncFeedback.type}`}>
            <div className="sync-feedback-icon">
              {syncFeedback.type === 'success' && <CheckCircle2 size={24} />}
              {syncFeedback.type === 'warning' && <AlertCircle size={24} />}
              {syncFeedback.type === 'error' && <X size={24} />}
            </div>
            <div className="sync-feedback-content">
              <strong>{syncFeedback.title}</strong>
              <p>{syncFeedback.message}</p>
            </div>
            <button className="sync-feedback-close" onClick={() => setSyncFeedback(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Check-In Card / Search Hero */}
        <div className="checkin-hero-card glass-panel">
          <div className="hero-badge-wrap">
            <div className="badge badge-amber badge-glow">
              <Flame size={14} />
              <span>CONFIRMA TU ASISTENCIA EN PUERTA</span>
            </div>
          </div>

          <h1 className="hero-checkin-title">
            ¡Bienvenido a <span className="text-fire">Despierta 2026</span>!
          </h1>
          <p className="hero-checkin-desc">
            Busca tu registro para confirmar tu llegada e ingresar al auditorio.
          </p>

          {/* Search Box */}
          <div className="checkin-search-wrapper">
            <div className="checkin-search-input-box">
              <Search size={22} className="search-hero-icon" />
              <input 
                type="text" 
                placeholder="Escribe tu Nombre, Correo, Teléfono o Código de Ticket..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* ¿No estás Registrado? CTA Banner */}
          <div className="not-registered-prompt-box">
            <span>¿Aún no te has registrado o no encuentras tu entrada?</span>
            <button 
              className="not-registered-btn"
              onClick={() => {
                setQuickSuccessRecord(null);
                setQuickError('');
                setQuickForm(prev => ({ ...prev, fullName: searchQuery.trim() }));
                setShowQuickModal(true);
              }}
            >
              <UserPlus size={16} />
              <span>¿No estás Registrado? Regístrate aquí</span>
            </button>
          </div>
        </div>

        {/* Search Results Area - Privacy First: Only displays results when user searches */}
        <div className="checkin-results-section">
          {searchQuery.trim().length >= 2 ? (
            searchResults.length > 0 ? (
              <div className="results-container">
                <div className="results-meta-header">
                  <span className="results-count-tag">
                    Encontramos {searchResults.length} {searchResults.length === 1 ? 'coincidencia' : 'coincidencias'}
                  </span>
                  <span className="privacy-note">🔒 Identifica tu boleto por tu código</span>
                </div>

              <div className="results-cards-grid">
                {searchResults.map((attendee) => {
                  const isAttended = attendee.status === 'ATTENDED' || attendee.attended;
                  const displayName = attendee.fullName || `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || 'Asistente';
                  const ticketCode = attendee.ticketCode || attendee.id || attendee.code || attendee.ticket_code || attendee.ticket || 'SIN CÓDIGO';

                  return (
                    <div 
                      key={ticketCode + (attendee.id || '')} 
                      className={`attendee-card glass-panel ${isAttended ? 'card-attended' : 'card-pending'}`}
                    >
                      <div className="card-top-row">
                        <div className="card-user-info">
                          <h3 className="card-attendee-name">{displayName}</h3>
                          <button 
                            type="button" 
                            className="card-code-pill font-mono"
                            onClick={() => handleCopy(ticketCode)}
                            title="Copiar código del ticket"
                          >
                            <Ticket size={13} />
                            <span>{ticketCode}</span>
                          </button>
                        </div>

                        <div className="card-status-badge">
                          {isAttended ? (
                            <span className="badge-attended">
                              <CheckCircle2 size={14} />
                              <span>INGRESADO</span>
                            </span>
                          ) : (
                            <span className="badge-pending">
                              <Clock size={14} />
                              <span>PENDIENTE</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dedicated Ticket Identity Bar: Identifica inequívocamente a la persona aunque tengan el mismo nombre */}
                      <div className="attendee-ticket-identity-bar">
                        <div className="ati-info">
                          <Ticket size={18} className="ati-ticket-icon" />
                          <div className="ati-text-group">
                            <span className="ati-label">CÓDIGO DE TICKET</span>
                            <span className="ati-code font-mono">{ticketCode}</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          className="ati-copy-btn"
                          onClick={() => handleCopy(ticketCode)}
                          title="Copiar código del ticket"
                        >
                          {copiedCode === ticketCode ? (
                            <>
                              <Check size={13} className="text-green" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Masked Contact & Church Details (Privacy Protected) */}
                      <div className="card-details-grid">
                        <div className="detail-item">
                          <Mail size={14} className="detail-icon" />
                          <span className="detail-val">{maskEmail(attendee.email)}</span>
                        </div>

                        <div className="detail-item">
                          <Phone size={14} className="detail-icon" />
                          <span className="detail-val">{maskPhone(attendee.phone)}</span>
                        </div>

                        {attendee.church && (
                          <div className="detail-item full-row">
                            <MapPin size={14} className="detail-icon" />
                            <span className="detail-val">{attendee.church}</span>
                          </div>
                        )}

                        {attendee.taller && attendee.taller !== 'Sin taller' && (
                          <div className="detail-item full-row taller-item">
                            <span className="detail-icon">🎯</span>
                            <span className="detail-val">{attendee.taller}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Row */}
                      <div className="card-action-row">
                        {!isAttended ? (
                          <button 
                            className="btn btn-primary checkin-confirm-btn"
                            onClick={() => handleConfirmCheckIn(ticketCode)}
                          >
                            <CheckCircle2 size={20} />
                            <span>Confirmar Mi Ingreso</span>
                          </button>
                        ) : (
                          <div className="already-confirmed-banner">
                            <CheckCircle2 size={20} className="check-icon-confirmed" />
                            <div>
                              <strong>¡Ingreso Confirmado!</strong>
                              {attendee.attendedAt && (
                                <span>Registrado a las {new Date(attendee.attendedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* No matches found for current search */
            <div className="no-matches-card glass-panel">
              <AlertCircle size={44} className="no-matches-icon" />
              <h3>No encontramos registros coincidentes</h3>
              <p>
                No hay nadie registrado con <strong>"{searchQuery}"</strong>. Verifica que el nombre, correo o teléfono esté bien escrito.
              </p>
              <div className="no-matches-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setQuickForm(prev => ({ ...prev, fullName: searchQuery.trim() }));
                    setShowQuickModal(true);
                  }}
                >
                  <UserPlus size={18} />
                  <span>¿No estás Registrado? Regístrate aquí</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                  Limpiar Búsqueda
                </button>
              </div>
            </div>
          )
        ) : (
          /* Prompt state when search box is empty (Default privacy view) */
          <div className="empty-search-instruction glass-panel">
            <div className="inst-icon-wrap">
              <Search size={32} />
            </div>
            <h3>Busca tu Nombre, Teléfono o Código</h3>
            <p>
              Escribe en la barra superior para encontrar tu registro y confirmar tu ingreso a la conferencia.
            </p>
          </div>
        )}
      </div>

      </div>

      {/* QUICK REGISTRATION MODAL ("¿No estás Registrado?") */}
      {showQuickModal && (
        <div className="quick-modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) setShowQuickModal(false);
        }}>
          <div className="quick-modal-card glass-panel">
            
            <div className="quick-modal-header">
              <div className="quick-modal-title">
                <div className="quick-icon-pill">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3>Registro en Puerta</h3>
                  <p>Inscripción rápida para ingresar a la conferencia</p>
                </div>
              </div>
              <button 
                className="quick-close-btn" 
                onClick={() => setShowQuickModal(false)}
                aria-label="Cerrar ventana"
              >
                <X size={20} />
              </button>
            </div>

            {quickSuccessRecord ? (
              /* Success View */
              <div className="quick-success-view">
                <div className="quick-success-badge">
                  <CheckCircle2 size={48} />
                </div>
                <h3>¡Bienvenido a la Conferencia!</h3>
                <p>Tu registro e ingreso fueron confirmados exitosamente.</p>

                <div className="quick-ticket-card glass-panel">
                  <div className="qt-label">TU CÓDIGO DE ENTRADA</div>
                  <div className="qt-code">{quickSuccessRecord.ticketCode}</div>
                  <div className="qt-name">{quickSuccessRecord.fullName}</div>
                  <div className="qt-meta">{maskEmail(quickSuccessRecord.email)} • {maskPhone(quickSuccessRecord.phone)}</div>
                </div>

                <div className="quick-success-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setQuickSuccessRecord(null);
                      setShowQuickModal(false);
                      setSearchQuery(quickSuccessRecord.fullName);
                    }}
                  >
                    <Check size={16} />
                    <span>Listo, Continuar</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Form View: ONLY Name, Email, Phone */
              <form onSubmit={handleQuickRegisterSubmit} className="quick-modal-form">
                {quickError && (
                  <div className="quick-error-alert">
                    <AlertCircle size={16} />
                    <span>{quickError}</span>
                  </div>
                )}

                {/* 1. Nombre Completo */}
                <div className="quick-form-group">
                  <label htmlFor="quick-fullName">
                    <span>Nombre y Apellidos</span>
                    <span className="req">*</span>
                  </label>
                  <div className="quick-input-wrap">
                    <Users size={18} className="q-icon" />
                    <input 
                      id="quick-fullName"
                      type="text" 
                      placeholder="Ej: Marcos David Santana"
                      value={quickForm.fullName}
                      onChange={(e) => setQuickForm({ ...quickForm, fullName: e.target.value })}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* 2. Correo Electrónico */}
                <div className="quick-form-group">
                  <label htmlFor="quick-email">
                    <span>Correo Electrónico</span>
                    <span className="req">*</span>
                  </label>
                  <div className="quick-input-wrap">
                    <Mail size={18} className="q-icon" />
                    <input 
                      id="quick-email"
                      type="email" 
                      placeholder="Ej: marcos@correo.com"
                      value={quickForm.email}
                      onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* 3. Teléfono */}
                <div className="quick-form-group">
                  <label htmlFor="quick-phone">
                    <span>Teléfono / WhatsApp</span>
                    <span className="req">*</span>
                  </label>
                  <div className="quick-input-wrap">
                    <Phone size={18} className="q-icon" />
                    <input 
                      id="quick-phone"
                      type="tel" 
                      placeholder="Ej: 809-555-0199"
                      value={quickForm.phone}
                      onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="quick-modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowQuickModal(false)}
                    disabled={isSubmittingQuick}
                  >
                    Cancelar
                  </button>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmittingQuick}
                  >
                    <Check size={18} />
                    <span>{isSubmittingQuick ? 'Registrando...' : 'Completar Registro e Ingresar'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default CheckIn;
