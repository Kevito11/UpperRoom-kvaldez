import { useState, useEffect } from 'react';
import { 
  Ticket, User, Mail, Phone, MapPin, CheckCircle, Flame, 
  Printer, Download, RotateCcw, Share2, Sparkles, Building, Calendar, ShieldCheck, Clock,
  BookOpen, ChevronDown, ChevronUp, ShoppingBag, Package,
  ArrowLeft, Copy, Info, Settings, X, Check, Send, AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { saveRegistration } from '../../lib/ticketStorage';
import { 
  sendRegistrationToGoogleSheets, 
  formatMerchSummary, 
  getAppsScriptUrl, 
  setAppsScriptUrl 
} from '../../lib/googleSheetsService';
import './Registration.css';

const CHURCH_OPTIONS = [
  "Iglesia Bautista Cristiana (IBC)",
  "Iglesia De Convertidos a Cristo (ICC)",
  "Iglesia Bautista de la Gracia (IBSJ)",
  "Iglesia Bautista Internacional (IBI)",
  "Iglesia Bautista Ozama (IBO)",
  "Iglesia Bautista Fundamental",
  "Iglesia Piedra Angular",
  "Iglesia Ciudad de Gracia",
  "Iglesia Cristiana de la Comunidad",
  "Iglesia Cristiana Oasis",
  "Otra Iglesia",
  "Invitado (No asisto a ninguna iglesia)"
];

const TALLERES = [
  {
    id: 'taller-1',
    nombre: '¿Dónde quedó el fuego?',
    tema: 'Estancamiento espiritual',
    pregunta: '¿En qué momento dejé de buscar a Dios?',
    descripcion: 'Un espacio para identificar las raíces del enfriamiento espiritual y reavivar la pasión por Cristo. Exploraremos cómo el corazón se aleja de Dios y cómo volver al primer amor.',
    icon: '🔥',
    colorName: 'Rojo',
    colorClass: 'ticket-rojo'
  },
  {
    id: 'taller-2',
    nombre: 'Modo Automático',
    tema: 'Rutina y distracciones',
    pregunta: '¿Estoy siguiendo a Jesús o simplemente cumpliendo una rutina?',
    descripcion: 'Analizaremos cómo la vida cristiana puede volverse mecánica y sin propósito. Aprenderemos a distinguir la fe viva de la religiosidad vacía y a romper el ciclo de la rutina.',
    icon: '⚙️',
    colorName: 'Azul',
    colorClass: 'ticket-azul'
  },
  {
    id: 'taller-3',
    nombre: '¿Y ahora qué hago?',
    tema: 'Propósito y llamado',
    pregunta: '¿Qué está impidiendo que responda al llamado de Dios?',
    descripcion: 'Un taller práctico sobre cómo discernir y responder al llamado de Dios en tu vida. Abordaremos los miedos, excusas y obstáculos que nos impiden vivir en el propósito divino.',
    icon: '🎯',
    colorName: 'Verde',
    colorClass: 'ticket-verde'
  }
];

const Registration = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ageGroup: '15 - 18',
    church: 'Iglesia Bautista Cristiana (IBC)',
    customChurch: '',
    participaTalleres: null,
    tallerSeleccionado: '',
    participaMerch: null,
    merch: {
      hoodie: { quiere: false, talla: 'M', color: 'Negro Obsidian' },
      tshirt: { quiere: false, talla: 'M', color: 'Negro Obsidian' },
      gorra:  { quiere: false, color: 'Negro' }
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [sheetStatus, setSheetStatus] = useState(null); // 'idle' | 'sending' | 'success' | 'no_url' | 'error'
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState(getAppsScriptUrl());
  const [formError, setFormError] = useState('');
  const [configSuccess, setConfigSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (formError) setFormError('');
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff6a00', '#fbbf24', '#dc2626', '#ffffff']
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = () => {
    if (ticketData?.ticketCode) {
      navigator.clipboard.writeText(ticketData.ticketCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveWebhookUrl = (e) => {
    e.preventDefault();
    setAppsScriptUrl(webhookUrlInput);
    setConfigSuccess(true);
    setTimeout(() => {
      setConfigSuccess(false);
      setIsConfigOpen(false);
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // 1. Validar Datos del Asistente
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Por favor completa tu nombre y apellidos en el Módulo 01.');
      document.getElementById('modulo-datos')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Por favor ingresa un correo electrónico válido para recibir tu boleto.');
      document.getElementById('modulo-datos')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      setFormError('Por favor ingresa un número de teléfono o WhatsApp válido.');
      document.getElementById('modulo-datos')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (formData.church === 'Otra Iglesia' && !formData.customChurch.trim()) {
      setFormError('Por favor especifica el nombre de tu iglesia o congregación.');
      document.getElementById('modulo-datos')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 2. Validar Talleres Bíblicos
    if (formData.participaTalleres === null) {
      setFormError('En el Módulo 02, por favor responde si deseas elegir un taller o asistir solo a la plenaria general.');
      document.getElementById('modulo-talleres')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (formData.participaTalleres === true && !formData.tallerSeleccionado) {
      setFormError('En el Módulo 02, has elegido participar en talleres. Por favor haz clic y selecciona uno de los 3 talleres bíblicos disponibles.');
      document.getElementById('modulo-talleres')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 3. Validar Merch Oficial
    if (formData.participaMerch === null) {
      setFormError('En el Módulo 03, por favor responde si deseas pre-ordenar merch oficial o marcar "No por el momento".');
      document.getElementById('modulo-merch')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (formData.participaMerch === true) {
      const hasMerch = formData.merch.hoodie.quiere || formData.merch.tshirt.quiere || formData.merch.gorra.quiere;
      if (!hasMerch) {
        setFormError('En el Módulo 03, has elegido pre-ordenar merch. Por favor selecciona al menos una prenda o marca "No por el momento".');
        document.getElementById('modulo-merch')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    setIsSubmitting(true);

    const generatedCode = `IBC-UR-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalChurch = formData.church === 'Otra Iglesia' ? formData.customChurch : formData.church;
    const tallerInfo = TALLERES.find(t => t.id === formData.tallerSeleccionado);
    const merchSummary = formatMerchSummary(formData.merch);

    const registrationRecord = {
      ticketCode: generatedCode,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      ageGroup: formData.ageGroup,
      church: finalChurch || 'Invitado',
      participaTalleres: formData.participaTalleres,
      tallerSeleccionado: tallerInfo?.nombre || null,
      tallerColorClass: tallerInfo?.colorClass || null,
      tallerColorName: tallerInfo?.colorName || null,
      tallerTema: tallerInfo?.tema || null,
      merch: formData.merch,
      merchSummary: merchSummary,
      eventName: "Conferencia Despierta 2026 - Upper Room IBC",
      eventDate: "Sábado 31 de Octubre, 2026",
      eventTime: "03:00 PM – 08:30 PM",
      location: "Auditorio IBC • C. Juan Luis Franco Bidó 25, Santo Domingo",
      createdAt: new Date().toISOString()
    };

    // 1. Generar código QR dinámico
    const verificationUrl = `${window.location.origin}/ticket/${generatedCode}`;
    let qrUrl = '';
    try {
      qrUrl = await QRCode.toDataURL(verificationUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#080605',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error("QR Code Error:", err);
    }

    // 2. Esperar confirmación de Google Sheets y envío de correo ANTES de mostrar el ticket
    setSheetStatus('sending');
    try {
      const sheetResponse = await sendRegistrationToGoogleSheets(registrationRecord, qrUrl);

      if (sheetResponse.success) {
        saveRegistration(registrationRecord);
        setTicketData(registrationRecord);
        setSheetStatus('success');
        setIsSubmitting(false);
        setIsRegistered(true); // Solo se muestra el ticket una vez guardado en Google Sheets
        triggerCelebration();
      } else if (sheetResponse.reason === 'NO_URL_CONFIGURED') {
        saveRegistration(registrationRecord);
        setTicketData(registrationRecord);
        setSheetStatus('no_url');
        setIsSubmitting(false);
        setIsRegistered(true);
        triggerCelebration();
      } else {
        setIsSubmitting(false);
        setSheetStatus('error');
        setFormError('No se pudo confirmar el guardado en Google Sheets ni el envío del correo. Por favor verifica tu conexión a internet e inténtalo de nuevo.');
      }
    } catch (err) {
      console.error("Error al registrar en Google Sheets:", err);
      setIsSubmitting(false);
      setSheetStatus('error');
      setFormError('Ocurrió un error al conectar con Google Sheets. Por favor inténtalo de nuevo.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setIsRegistered(false);
    setTicketData(null);
    setQrCodeUrl('');
    setSheetStatus(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      ageGroup: '15 - 18',
      church: 'Iglesia Bautista Cristiana (IBC)',
      customChurch: '',
      participaTalleres: null,
      tallerSeleccionado: '',
      participaMerch: null,
      merch: {
        hoodie: { quiere: false, talla: 'M', color: 'Negro Obsidian' },
        tshirt: { quiere: false, talla: 'M', color: 'Negro Obsidian' },
        gorra:  { quiere: false, color: 'Negro' }
      }
    });
  };

  return (
    <div className="registration-page section-padding">
      <div className="container">
        {!isRegistered ? (
          /* =========================================================
             PORTAL DE ACREDITACIÓN OFICIAL - FLUJO MODULAR CONTINUO
             ========================================================= */
          <div className="accreditation-portal">
            
            {/* Cabecera Oficial de Conferencia */}
            <div className="accreditation-header">
              <div className="accreditation-top-meta">
                <div className="accreditation-status-chip">
                  <span className="live-indicator-dot"></span>
                  <span className="chip-code">// SISTEMA OFICIAL DE EMISIÓN DE BOLETOS</span>
                </div>
                <div className="accreditation-edition">
                  <span>CONFERENCIA 2026</span>
                </div>
              </div>

              <div className="accreditation-hero-banner">
                <div className="accreditation-logo-wrap">
                  <img 
                    src="/logos/logo-despierta-horizontal.png" 
                    alt="Conferencia Despierta 2026 - Upper Room IBC" 
                    className="accreditation-logo-img" 
                  />
                </div>
                <div className="accreditation-title-block">
                  <h1 className="accreditation-title">
                    PASE DIGITAL
                  </h1>
                  <p className="accreditation-lead">
                    Registro individual con confirmación automatizada vía correo electrónico.
                  </p>
                </div>
              </div>

              {/* Tira de Especificaciones del Evento */}
              <div className="accreditation-specs-strip">
                <div className="spec-block">
                  <span className="spec-label">FECHA OFICIAL</span>
                  <strong className="spec-val"><Calendar size={14} /> Sábado 31 Octubre, 2026</strong>
                </div>
                <div className="spec-divider"></div>
                <div className="spec-block">
                  <span className="spec-label">HORARIO</span>
                  <strong className="spec-val"><Clock size={14} /> 03:00 PM – 08:30 PM</strong>
                </div>
                <div className="spec-divider"></div>
                <div className="spec-block">
                  <span className="spec-label">SEDE & AUDITORIO</span>
                  <strong className="spec-val"><MapPin size={14} /> Auditorio Principal IBC, Sto. Dgo.</strong>
                </div>
                <div className="spec-divider"></div>
                <div className="spec-block">
                  <span className="spec-label">COSTO DE ENTRADA</span>
                  <strong className="spec-val spec-free"><ShieldCheck size={14} /> 100% Gratuito (Cupo Limitado)</strong>
                </div>
              </div>
            </div>

            {/* Formulario Modular */}
            <div className="accreditation-board">
              <form onSubmit={handleSubmit} className="accreditation-form">
                
                {/* -------------------------------------------------------------
                   MÓDULO 01: CREDENCIALES DEL ASISTENTE
                   ------------------------------------------------------------- */}
                <div className="portal-module" id="modulo-datos">
                  <div className="module-legend">
                    <span className="legend-index">01</span>
                    <div className="legend-text">
                      <h2>Datos del Asistente</h2>
                      <p>Información que figurará en tu boleto digital y registro de asistencia</p>
                    </div>
                  </div>

                  <div className="module-body">
                    <div className="field-grid-2">
                      <div className="portal-field">
                        <label><User size={13} /> Nombre *</label>
                        <input 
                          type="text" 
                          name="firstName" 
                          placeholder="Ej. Samuel" 
                          required 
                          value={formData.firstName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="portal-field">
                        <label><User size={13} /> Apellidos *</label>
                        <input 
                          type="text" 
                          name="lastName" 
                          placeholder="Ej. Castillo" 
                          required 
                          value={formData.lastName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="field-grid-2">
                      <div className="portal-field">
                        <label><Mail size={13} /> Correo Electrónico *</label>
                        <input 
                          type="email" 
                          name="email" 
                          placeholder="correo@ejemplo.com" 
                          required 
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="portal-field">
                        <label><Phone size={13} /> Teléfono / WhatsApp *</label>
                        <input 
                          type="tel" 
                          name="phone" 
                          placeholder="Ej. 809-555-0123" 
                          required 
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="field-grid-2">
                      <div className="portal-field">
                        <label><Building size={13} /> Iglesia / Congregación *</label>
                        <select 
                          name="church" 
                          value={formData.church} 
                          onChange={handleChange}
                          required
                        >
                          {CHURCH_OPTIONS.map((ch, idx) => (
                            <option key={idx} value={ch}>{ch}</option>
                          ))}
                        </select>
                      </div>

                      <div className="portal-field">
                        <label><User size={13} /> Rango de Edad *</label>
                        <select 
                          name="ageGroup" 
                          value={formData.ageGroup} 
                          onChange={handleChange}
                          required
                        >
                          <option value="15 - 18">15 - 18 Años</option>
                          <option value="19 - 25">19 - 25 Años</option>
                          <option value="26 - 30">26 - 30 Años</option>
                          <option value="+30">+30 Años</option>
                        </select>
                      </div>
                    </div>

                    {formData.church === 'Otra Iglesia' && (
                      <div className="portal-field field-full">
                        <label>Especifica el Nombre de tu Iglesia *</label>
                        <input 
                          type="text" 
                          name="customChurch" 
                          placeholder="Escribe el nombre de tu congregación" 
                          required 
                          value={formData.customChurch}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* -------------------------------------------------------------
                   MÓDULO 02: TALLERES BÍBLICOS SIMULTÁNEOS
                   ------------------------------------------------------------- */}
                <div className="portal-module" id="modulo-talleres">
                  <div className="module-legend">
                    <span className="legend-index">02</span>
                    <div className="legend-text">
                      <div className="legend-header-row">
                        <h2>Talleres Bíblicos Simultáneos</h2>
                        <span className="tag-session-time"><Clock size={12} /> 5:30 PM – 6:10 PM</span>
                      </div>
                      <p>Sesiones paralelas enfocadas en doctrina aplicada para la juventud</p>
                    </div>
                  </div>

                  <div className="module-body">
                    <div className="portal-switch-row">
                      <span className="switch-prompt">¿Deseas participar en una de las sesiones de talleres?</span>
                      <div className="portal-segmented-control">
                        <button
                          type="button"
                          className={`segmented-btn ${formData.participaTalleres === true ? 'is-active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, participaTalleres: true }))}
                        >
                          Sí, elegir taller
                        </button>
                        <button
                          type="button"
                          className={`segmented-btn ${formData.participaTalleres === false ? 'is-active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, participaTalleres: false, tallerSeleccionado: '' }))}
                        >
                          Solo plenaria general
                        </button>
                      </div>
                    </div>

                    {formData.participaTalleres === true && (
                      <div className="taller-selection-zone">
                        <div className="zone-hint-box">
                          <Info size={15} />
                          <span>Los talleres se imparten al mismo tiempo. Selecciona el tema de tu interés:</span>
                        </div>

                        <div className="taller-catalog-cards">
                          {TALLERES.map(taller => (
                            <label
                              key={taller.id}
                              className={`taller-entry-card color-${taller.colorClass} ${formData.tallerSeleccionado === taller.id ? 'taller-entry-selected' : ''}`}
                            >
                              <input
                                type="radio"
                                name="tallerSeleccionado"
                                value={taller.id}
                                checked={formData.tallerSeleccionado === taller.id}
                                onChange={() => setFormData(prev => ({ ...prev, tallerSeleccionado: taller.id }))}
                                style={{ display: 'none' }}
                              />
                              <div className="taller-entry-header">
                                <div className="taller-color-indicator"></div>
                                <div className="taller-entry-title-wrap">
                                  <span className="taller-session-code">SESIÓN PARALELA</span>
                                  <strong className="taller-entry-name">{taller.nombre}</strong>
                                </div>
                                <span className={`taller-entry-tag tag-${taller.colorClass}`}>{taller.colorName}</span>
                                {formData.tallerSeleccionado === taller.id && (
                                  <CheckCircle size={18} className="taller-chosen-icon" />
                                )}
                              </div>
                              <p className="taller-entry-quote">"{taller.pregunta}"</p>
                              <p className="taller-entry-desc">{taller.descripcion}</p>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* -------------------------------------------------------------
                   MÓDULO 03: PRE-ORDEN DE MERCHANDISING
                   ------------------------------------------------------------- */}
                <div className="portal-module" id="modulo-merch">
                  <div className="module-legend">
                    <span className="legend-index">03</span>
                    <div className="legend-text">
                      <div className="legend-header-row">
                        <h2>Pre-Orden de Merch Oficial</h2>
                        <span className="tag-merch-badge"><ShoppingBag size={12} /> Colección 2026</span>
                      </div>
                      <p>Aparta tus artículos exclusivos de Upper Room IBC (pago directo en recepción)</p>
                    </div>
                  </div>

                  <div className="module-body">
                    <div className="portal-switch-row">
                      <span className="switch-prompt">¿Deseas separar alguna prenda o accesorio oficial?</span>
                      <div className="portal-segmented-control">
                        <button
                          type="button"
                          className={`segmented-btn ${formData.participaMerch === true ? 'is-active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, participaMerch: true }))}
                        >
                          Sí, pre-ordenar
                        </button>
                        <button
                          type="button"
                          className={`segmented-btn ${formData.participaMerch === false ? 'is-active' : ''}`}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            participaMerch: false,
                            merch: {
                              hoodie: { quiere: false, talla: 'M', color: 'Negro Obsidian' },
                              tshirt: { quiere: false, talla: 'M', color: 'Negro Obsidian' },
                              gorra:  { quiere: false, color: 'Negro' }
                            }
                          }))}
                        >
                          No por el momento
                        </button>
                      </div>
                    </div>

                    {formData.participaMerch === true && (
                      <div className="merch-selection-zone">
                        <div className="merch-modular-items">
                          
                          {/* HOODIE */}
                          <div className={`merch-box ${formData.merch.hoodie.quiere ? 'merch-box-active' : ''}`}>
                            <label className="merch-box-toggle">
                              <input
                                type="checkbox"
                                checked={formData.merch.hoodie.quiere}
                                onChange={e => setFormData(prev => ({ ...prev, merch: { ...prev.merch, hoodie: { ...prev.merch.hoodie, quiere: e.target.checked } } }))}
                              />
                              <div className="merch-box-info">
                                <strong>Sudadera Oficial "Despierta" (Heavyweight Hoodie)</strong>
                                <span className="merch-price-pill">RD$ 1,500</span>
                              </div>
                            </label>
                            {formData.merch.hoodie.quiere && (
                              <div className="merch-box-customizer">
                                <div className="customizer-field">
                                  <label>TALLA</label>
                                  <select value={formData.merch.hoodie.talla} onChange={e => setFormData(prev => ({ ...prev, merch: { ...prev.merch, hoodie: { ...prev.merch.hoodie, talla: e.target.value } } }))}>
                                    {['S', 'M', 'L', 'XL', 'XXL'].map(t => <option key={t}>{t}</option>)}
                                  </select>
                                </div>
                                <div className="customizer-field">
                                  <label>COLOR</label>
                                  <select value={formData.merch.hoodie.color} onChange={e => setFormData(prev => ({ ...prev, merch: { ...prev.merch, hoodie: { ...prev.merch.hoodie, color: e.target.value } } }))}>
                                    {['Negro Obsidian', 'Gris Grafito', 'Terracota / Fuego'].map(c => <option key={c}>{c}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* T-SHIRT */}
                          <div className={`merch-box ${formData.merch.tshirt.quiere ? 'merch-box-active' : ''}`}>
                            <label className="merch-box-toggle">
                              <input
                                type="checkbox"
                                checked={formData.merch.tshirt.quiere}
                                onChange={e => setFormData(prev => ({ ...prev, merch: { ...prev.merch, tshirt: { ...prev.merch.tshirt, quiere: e.target.checked } } }))}
                              />
                              <div className="merch-box-info">
                                <strong>Camiseta Oficial "Despierta" (Oversize Boxy Tee)</strong>
                                <span className="merch-price-pill">RD$ 750</span>
                              </div>
                            </label>
                            {formData.merch.tshirt.quiere && (
                              <div className="merch-box-customizer">
                                <div className="customizer-field">
                                  <label>TALLA</label>
                                  <select value={formData.merch.tshirt.talla} onChange={e => setFormData(prev => ({ ...prev, merch: { ...prev.merch, tshirt: { ...prev.merch.tshirt, talla: e.target.value } } }))}>
                                    {['XS', 'S', 'M', 'L', 'XL'].map(t => <option key={t}>{t}</option>)}
                                  </select>
                                </div>
                                <div className="customizer-field">
                                  <label>COLOR</label>
                                  <select value={formData.merch.tshirt.color} onChange={e => setFormData(prev => ({ ...prev, merch: { ...prev.merch, tshirt: { ...prev.merch.tshirt, color: e.target.value } } }))}>
                                    {['Negro Obsidian', 'Blanco Puro', 'Terracota / Ámbar'].map(c => <option key={c}>{c}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* GORRA */}
                          <div className={`merch-box ${formData.merch.gorra.quiere ? 'merch-box-active' : ''}`}>
                            <label className="merch-box-toggle">
                              <input
                                type="checkbox"
                                checked={formData.merch.gorra.quiere}
                                onChange={e => setFormData(prev => ({ ...prev, merch: { ...prev.merch, gorra: { ...prev.merch.gorra, quiere: e.target.checked } } }))}
                              />
                              <div className="merch-box-info">
                                <strong>Gorra "Upper Room" Dad Cap</strong>
                                <span className="merch-price-pill">RD$ 650</span>
                              </div>
                            </label>
                            {formData.merch.gorra.quiere && (
                              <div className="merch-box-customizer">
                                <div className="customizer-field">
                                  <label>COLOR</label>
                                  <select value={formData.merch.gorra.color} onChange={e => setFormData(prev => ({ ...prev, merch: { ...prev.merch, gorra: { ...prev.merch.gorra, color: e.target.value } } }))}>
                                    {['Negro', 'Beige Arena'].map(c => <option key={c}>{c}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* -------------------------------------------------------------
                   MÓDULO 04: BOTÓN DE EMISIÓN DE PASES
                   ------------------------------------------------------------- */}
                <div className="portal-submit-area">
                  {formError && (
                    <div className="portal-error-alert" role="alert">
                      <AlertCircle size={20} className="error-alert-icon" />
                      <div className="error-alert-text">
                        <strong>Completar Campos Requeridos</strong>
                        <p>{formError}</p>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary portal-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="submit-spinner" aria-hidden="true"></span>
                        <span>Guardando en Google Sheets y enviando correo...</span>
                      </>
                    ) : (
                      <>
                        <Ticket size={22} />
                        <span>Emitir Mi Boleto Digital Oficial</span>
                      </>
                    )}
                  </button>

                  <div className="portal-security-notice">
                    <ShieldCheck size={16} />
                    <span>Boleto digital intransferible con verificación criptográfica QR para el control de aforo del Auditorio IBC. Acceso libre sin costo.</span>
                  </div>
                </div>

              </form>
            </div>
          </div>
        ) : (
          /* =========================================================
             TICKET FULLSCREEN VIEW - ONLY RELEVANT TICKET DATA
             ========================================================= */
          <div className="ticket-fullscreen-overlay" id="ticket-fullscreen">
            {/* Top Control Header (Hidden on Print) */}
            <header className="ticket-fs-topbar no-print">
              <button 
                type="button" 
                className="ticket-fs-btn-back"
                onClick={handleReset}
                title="Volver o registrar a otra persona"
              >
                <ArrowLeft size={18} />
                <span className="btn-label-desktop">Volver al Formulario</span>
                <span className="btn-label-mobile">Volver</span>
              </button>

              <div className="ticket-fs-badge">
                <Flame size={15} className="pulse-flame" />
                <span>BOLETO OFICIAL DE ACCESO • CONFIRMADO</span>
              </div>

              <div className="ticket-fs-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary ticket-btn-sm" 
                  onClick={handleCopyCode}
                  title="Copiar código de entrada"
                >
                  {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  <span className="btn-label-desktop">{copied ? '¡Copiado!' : 'Copiar Código'}</span>
                  <span className="btn-label-mobile">{copied ? '¡Listo!' : 'Copiar'}</span>
                </button>

                <button 
                  type="button" 
                  className="btn btn-primary ticket-btn-sm" 
                  onClick={handlePrint}
                  title="Imprimir o guardar en PDF"
                >
                  <Printer size={16} />
                  <span className="btn-label-desktop">Imprimir / PDF</span>
                  <span className="btn-label-mobile">PDF</span>
                </button>
              </div>
            </header>

            {/* Stage: Exclusively The Ticket and its Related Data */}
            <main className="ticket-fs-stage">

              {/* Real-time Google Sheet & Email Dispatch Status Pill */}
              <div className="ticket-fs-sync-box no-print">
                {sheetStatus === 'sending' && (
                  <div className="sync-pill pill-sending">
                    <span className="sync-dot-anim"></span>
                    <span>Registrando en Google Sheets y enviando boleto a <strong>{ticketData.email}</strong>...</span>
                  </div>
                )}
                {sheetStatus === 'success' && (
                  <div className="sync-pill pill-success">
                    <CheckCircle size={16} />
                    <span>Boleto registrado en Google Sheets y enviado con éxito a <strong>{ticketData.email}</strong></span>
                  </div>
                )}
                {sheetStatus === 'no_url' && (
                  <div className="sync-pill pill-notice">
                    <Info size={16} />
                    <span>
                      Boleto generado en este equipo. (
                      <button 
                        type="button" 
                        onClick={() => setIsConfigOpen(true)}
                        className="sync-link-action"
                      >
                        Conectar Google Sheet & Apps Script
                      </button>
                      )
                    </span>
                  </div>
                )}
                {sheetStatus === 'error' && (
                  <div className="sync-pill pill-error">
                    <AlertCircle size={16} />
                    <span>Boleto generado localmente. Revisa la URL del Webhook de Google Sheets.</span>
                  </div>
                )}
              </div>

              {/* THE OFFICIAL TICKET PASS */}
              <div className={`ticket-pass-card ${ticketData.tallerColorClass || ''}`} id="printable-ticket">
                
                {/* Decorative Perforation Notches */}
                <div className="ticket-notch notch-top"></div>
                <div className="ticket-notch notch-bottom"></div>

                {/* MAIN BODY OF TICKET */}
                <div className="ticket-pass-main">
                  
                  {/* Brand Header */}
                  <div className="ticket-pass-header">
                    <div className="ticket-pass-brand">
                      <div className="ticket-pass-logo">
                        <img src="/logos/logo-upperroom-negro.png" alt="Upper Room IBC" className="ticket-logo-img" />
                      </div>
                      <div className="ticket-brand-meta">
                        <span className="ticket-sub-brand">UPPER ROOM IBC • SANTO DOMINGO</span>
                        <h2 className="ticket-title-brand">CONFERENCIA DESPIERTA 2026</h2>
                        <span className="ticket-slogan">«LA LLAMA VUELVE A ENCENDERSE»</span>
                      </div>
                    </div>

                    <div className="ticket-pass-badge">
                      <span>PASE OFICIAL</span>
                    </div>
                  </div>

                  {/* Attendee Name & Code */}
                  <div className="ticket-attendee-header">
                    <span className="ticket-field-tag">TITULAR DEL BOLETO</span>
                    <h1 className="ticket-attendee-name">{ticketData.firstName} {ticketData.lastName}</h1>
                    
                    <div className="ticket-code-pill" onClick={handleCopyCode} title="Clic para copiar código">
                      <span className="code-tag">ID:</span>
                      <span className="code-text">{ticketData.ticketCode}</span>
                      <Copy size={13} className="code-copy-icon" />
                    </div>
                  </div>

                  {/* Structured Details Grid */}
                  <div className="ticket-details-grid">
                    <div className="ticket-detail-item">
                      <span className="ticket-detail-label">IGLESIA / PROCEDENCIA</span>
                      <span className="ticket-detail-val">{ticketData.church}</span>
                    </div>

                    <div className="ticket-detail-item">
                      <span className="ticket-detail-label">RANGO DE EDAD</span>
                      <span className="ticket-detail-val">{ticketData.ageGroup} Años</span>
                    </div>

                    <div className="ticket-detail-item">
                      <span className="ticket-detail-label">FECHA Y HORARIO</span>
                      <span className="ticket-detail-val">{ticketData.eventDate}</span>
                      <span className="ticket-detail-sub">{ticketData.eventTime} (Hora RD)</span>
                    </div>

                    <div className="ticket-detail-item">
                      <span className="ticket-detail-label">LUGAR Y SEDE</span>
                      <span className="ticket-detail-val">Auditorio Principal IBC</span>
                      <span className="ticket-detail-sub">C. Juan Luis Franco Bidó 25, Santo Domingo</span>
                    </div>

                    <div className="ticket-detail-item">
                      <span className="ticket-detail-label">CORREO DE CONTACTO</span>
                      <span className="ticket-detail-val">{ticketData.email}</span>
                      <span className="ticket-detail-sub">Tel: {ticketData.phone}</span>
                    </div>

                    {ticketData.tallerSeleccionado ? (
                      <div className="ticket-detail-item ticket-workshop-item">
                        <span className="ticket-detail-label">TALLER ASIGNADO</span>
                        <span className={`ticket-workshop-pill pill-${ticketData.tallerColorClass || 'ticket-rojo'}`}>
                          {ticketData.tallerSeleccionado}
                        </span>
                        <span className="ticket-detail-sub">Pulsera: {ticketData.tallerColorName || 'Asignada'} • {ticketData.tallerTema || ''}</span>
                      </div>
                    ) : (
                      <div className="ticket-detail-item">
                        <span className="ticket-detail-label">TALLER</span>
                        <span className="ticket-detail-sub">Plenaria General (Sin Taller)</span>
                      </div>
                    )}

                    {ticketData.merchSummary && ticketData.merchSummary !== 'Ninguna' && (
                      <div className="ticket-detail-item ticket-merch-item">
                        <span className="ticket-detail-label">PRE-ORDEN DE MERCH</span>
                        <span className="ticket-merch-val">🛍️ {ticketData.merchSummary}</span>
                        <span className="ticket-detail-sub">Paga y retira en el stand de Upper Room en el evento</span>
                      </div>
                    )}
                  </div>

                  {/* Barcode Strip */}
                  <div className="ticket-barcode-strip">
                    <div className="barcode-visual"></div>
                    <span className="barcode-number">{ticketData.ticketCode}</span>
                  </div>
                </div>

                {/* STUB / QR SECTION */}
                <div className="ticket-pass-stub">
                  <div className="stub-header">
                    <ShieldCheck size={16} />
                    <span>ACCESO VÁLIDO</span>
                  </div>

                  <div className="stub-qr-box">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt={`QR ${ticketData.ticketCode}`} className="stub-qr-code" />
                    ) : (
                      <div className="stub-qr-loading">Generando QR...</div>
                    )}
                  </div>

                  <div className="stub-footer">
                    <span className="stub-ticket-code">{ticketData.ticketCode}</span>
                    <span className="stub-scan-hint">Presentar código QR en la entrada</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar (No print) */}
              <div className="ticket-fs-bottom-bar no-print">
                <button type="button" className="btn btn-secondary" onClick={handleReset}>
                  <RotateCcw size={17} />
                  <span>Registrar a Otra Persona</span>
                </button>

                <button type="button" className="btn btn-primary" onClick={handlePrint}>
                  <Printer size={18} />
                  <span>Descargar / Imprimir Entrada</span>
                </button>

                <button 
                  type="button" 
                  className="btn-ghost-config" 
                  onClick={() => setIsConfigOpen(true)}
                  title="Configurar Webhook de Google Sheets"
                >
                  <Settings size={15} />
                  <span>Configurar Google Sheets</span>
                </button>
              </div>

            </main>

            {/* Config Modal for Google Apps Script Webhook */}
            {isConfigOpen && (
              <div className="config-modal-backdrop no-print">
                <div className="config-modal-card">
                  <div className="config-modal-header">
                    <div className="config-modal-title">
                      <Settings size={18} color="#ff8c00" />
                      <h3>Conectar Google Sheet & Apps Script</h3>
                    </div>
                    <button 
                      type="button" 
                      className="config-modal-close"
                      onClick={() => setIsConfigOpen(false)}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveWebhookUrl} className="config-modal-body">
                    <p className="config-modal-desc">
                      Pega la URL de tu aplicación web creada en Google Apps Script para guardar automáticamente cada registro en tu Google Sheet y enviar la boleta por correo.
                    </p>

                    <div className="config-field">
                      <label>URL de la Web App de Apps Script:</label>
                      <input 
                        type="url" 
                        placeholder="https://script.google.com/macros/s/.../exec" 
                        value={webhookUrlInput}
                        onChange={(e) => setWebhookUrlInput(e.target.value)}
                        required
                      />
                    </div>

                    <div className="config-modal-actions">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setIsConfigOpen(false)}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {configSuccess ? '¡Guardado!' : 'Guardar y Conectar'}
                      </button>
                    </div>

                    <div className="config-tip">
                      <Info size={14} />
                      <span>El archivo con el script listo está en tu proyecto como <code>google-apps-script.gs</code>.</span>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
