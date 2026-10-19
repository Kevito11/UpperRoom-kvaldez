import { useState, useEffect, useMemo } from 'react';
import { 
  Ticket, User, Mail, Phone, MapPin, CheckCircle, Flame, 
  Printer, RotateCcw, Sparkles, Building, Calendar, ShieldCheck, Clock,
  ShoppingBag, ArrowLeft, Copy, Info, Check, AlertCircle, CreditCard, Tag,
  ZoomIn, X
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { saveRegistration } from '../../lib/ticketStorage';
import { sendRegistrationToGoogleSheets, formatMerchSummary, calculateMerchTotal } from '../../lib/googleSheetsService';
import { MERCH_CATALOG } from '../../lib/merchData';
import MerchCard from '../../components/MerchCard/MerchCard';
import Lightbox from '../../components/Lightbox';
import './Registration.css';

const ALL_CONFERENCE_FLYERS = [
  {
    src: `${import.meta.env.BASE_URL}expositores/humberto-mendez.jpeg`,
    caption: 'Expositor Plenarias: Humberto Méndez (Pastor Iglesia Cristiana Oasis) • Plenaria 1 y 2'
  },
  {
    src: `${import.meta.env.BASE_URL}expositores/natali-ruiz.jpeg`,
    caption: 'Taller 01: ¿Dónde quedó el fuego? • Natali de Ruiz (Estancamiento espiritual)'
  },
  {
    src: `${import.meta.env.BASE_URL}expositores/pedro-dacuhna.jpeg`,
    caption: 'Taller 02: Modo Automático • Ps. Pedro da Cuhna (Pastor IBC - Rutina y distracciones)'
  },
  {
    src: `${import.meta.env.BASE_URL}expositores/andy-tejada.jpeg`,
    caption: 'Taller 03: ¿Y ahora qué hago? • Andy Tejada (Propósito y llamado)'
  },
  {
    src: `${import.meta.env.BASE_URL}worship/worship-night.jpeg`,
    caption: 'Worship Night: Noche de Adoración y Acción de Gracias • Se celebrará al finalizar la conferencia'
  }
];

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
    facilitador: 'Natali de Ruiz',
    tema: 'Estancamiento espiritual',
    pregunta: '¿En qué momento dejé de buscar a Dios?',
    descripcion: 'Un espacio para identificar las raíces del enfriamiento espiritual y reavivar la pasión por Cristo. Exploraremos cómo el corazón se aleja de Dios y cómo volver al primer amor.',
    icon: '🔥',
    colorName: 'Rojo',
    colorClass: 'ticket-rojo',
    foto: `${import.meta.env.BASE_URL}expositores/natali-ruiz.jpeg`
  },
  {
    id: 'taller-2',
    nombre: 'Modo Automático',
    facilitador: 'Ps. Pedro da Cuhna',
    cargo: 'Pastor IBC',
    tema: 'Rutina y distracciones',
    pregunta: '¿Estoy siguiendo a Jesús o simplemente cumpliendo una rutina?',
    descripcion: 'Analizaremos cómo la vida cristiana puede volverse mecánica y sin propósito. Aprenderemos a distinguir la fe viva de la religiosidad vacía y a romper el ciclo de la rutina.',
    icon: '⚙️',
    colorName: 'Azul',
    colorClass: 'ticket-azul',
    foto: `${import.meta.env.BASE_URL}expositores/pedro-dacuhna.jpeg`
  },
  {
    id: 'taller-3',
    nombre: '¿Y ahora qué hago?',
    facilitador: 'Andy Tejada',
    tema: 'Propósito y llamado',
    pregunta: '¿Qué está impidiendo que responda al llamado de Dios?',
    descripcion: 'Un taller práctico sobre cómo discernir y responder al llamado de Dios en tu vida. Abordaremos los miedos, excusas y obstáculos que nos impiden vivir en el propósito divino.',
    icon: '🎯',
    colorName: 'Verde',
    colorClass: 'ticket-verde',
    foto: `${import.meta.env.BASE_URL}expositores/andy-tejada.jpeg`
  }
];

const Registration = () => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Bloqueo de scroll en fondo cuando el modal de afiche está activo
  useEffect(() => {
    if (lightboxIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex]);

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
    participaMerch: null
  });

  // Estado de Carrito / Selección Múltiple de Merch (Array de objetos)
  const [selectedMerch, setSelectedMerch] = useState([]);

  // Configuración previa/borrador de opciones por prenda (para retener elecciones del usuario)
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

  // Helpers para conectar MerchCard con el Array de Selecciones
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
    if (formError) setFormError('');

    const qty = Math.max(1, Number(updatedSelection.cantidad) || 1);

    // 1. Guardar la configuración activa de la prenda en borradores
    setCardConfigs(prev => ({
      ...prev,
      [product.id]: {
        modelo: updatedSelection.modelo,
        color: updatedSelection.color,
        talla: updatedSelection.talla,
        cantidad: qty
      }
    }));

    // 2. Gestionar adición, edición o retiro en el array selectedMerch
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
          // Actualizar talla, color, modelo o cantidad del item ya seleccionado
          return prev.map(item => (item.productId === product.id || item.id === product.id) ? itemData : item);
        } else {
          // Agregar nueva prenda al array
          return [...prev, itemData];
        }
      } else {
        // Toggle/Remove: Desmarcar prenda y eliminar del array
        return prev.filter(item => item.productId !== product.id && item.id !== product.id);
      }
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedBankKey, setCopiedBankKey] = useState(null);
  const [copiedAllBank, setCopiedAllBank] = useState(false);
  const [sheetStatus, setSheetStatus] = useState(null); // 'idle' | 'sending' | 'success' | 'no_url' | 'error'
  const [formError, setFormError] = useState('');

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

  const handleCopyBankData = (text, key) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBankKey(key);
      setTimeout(() => setCopiedBankKey(null), 2000);
    }
  };

  const handleCopyAllBankData = () => {
    if (!navigator?.clipboard) return;
    const total = ticketData?.merchTotal ? `RD$ ${ticketData.merchTotal.toLocaleString()}` : '';
    const textToCopy = `DATOS DE TRANSFERENCIA • MERCH CONFERENCIA UPPER ROOM 2026
Banco: Popular Dominicano
Cuenta: Iglesia Bautista Cristiana
Número de Cuenta: 001-18074-6 (Cuenta Corriente)
RNC: 401507422
Correo para comprobante: upperroomibc@gmail.com
Tiempo de Validación: 32 horas
Descripción obligatoria: COMPRA MERCH CONFERENCIA UPPER ROOM 2026
Código de Boleto: ${ticketData?.ticketCode || ''}
${total ? `Monto a transferir: ${total}` : ''}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedAllBank(true);
    setTimeout(() => setCopiedAllBank(false), 2500);
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

    // 3. Validar Selección Obligatoria de Merch Oficial
    if (formData.participaMerch === null) {
      setFormError('En el Módulo 03, debes seleccionar obligatoriamente si deseas adquirir Merch ("Sí" o "No") para poder completar tu registro.');
      document.getElementById('modulo-merch')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (formData.participaMerch === true && selectedMerch.length === 0) {
      setFormError('Has indicado que deseas adquirir Merch oficial. Por favor selecciona al menos una prenda (haz clic en "+ Agregar Prenda" en T-Shirt o Hoodie) o marca la opción "No".');
      document.getElementById('modulo-merch')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    const generatedCode = `IBC-UR-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalChurch = formData.church === 'Otra Iglesia' ? formData.customChurch : formData.church;
    const tallerInfo = TALLERES.find(t => t.id === formData.tallerSeleccionado);
    
    const isMerchSelected = formData.participaMerch === true && selectedMerch.length > 0;
    const finalMerchSummary = isMerchSelected ? merchSummary : (formData.participaMerch === false ? 'No' : 'Ninguna');
    const finalMerchTotal = isMerchSelected ? merchTotal : 0;

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
      tallerFacilitador: tallerInfo?.facilitador || null,
      tallerColorClass: tallerInfo?.colorClass || null,
      tallerColorName: tallerInfo?.colorName || null,
      tallerTema: tallerInfo?.tema || null,
      participaMerch: formData.participaMerch,
      hasMerch: isMerchSelected,
      merch: selectedMerch,
      merchSummary: finalMerchSummary,
      merchTotal: finalMerchTotal,
      eventName: "Conferencia Despierta 2026 - Upper Room IBC",
      eventDate: "Sábado 31 de Octubre, 2026",
      eventTime: "02:00 PM – 08:00 PM",
      location: "Auditorio IBC • C. Juan Luis Franco Bidó 25, Santo Domingo",
      createdAt: new Date().toISOString()
    };

    // 1. Generar código QR dinámico
    const verificationUrl = `${window.location.origin}${import.meta.env.BASE_URL}ticket/${generatedCode}`;
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

    // 2. Guardar registro y mostrar boleto inmediatamente (GARANTÍA: el usuario siempre ve su boleto)
    saveRegistration(registrationRecord);
    setTicketData(registrationRecord);
    setIsSubmitting(false);
    setIsRegistered(true);
    triggerCelebration();
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 3. Sincronización en segundo plano con Google Sheets & envío de correo
    setSheetStatus('sending');
    try {
      const sheetResponse = await sendRegistrationToGoogleSheets(registrationRecord, qrUrl);
      if (sheetResponse.success) {
        setSheetStatus('success');
      } else if (sheetResponse.reason === 'NO_URL_CONFIGURED') {
        setSheetStatus('no_url');
      } else {
        setSheetStatus('error');
      }
    } catch (err) {
      console.error("Error al registrar en Google Sheets:", err);
      setSheetStatus('error');
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
    setCopiedBankKey(null);
    setCopiedAllBank(false);
    setSelectedMerch([]);
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
      participaMerch: null
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
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
                  <span className="chip-code">SISTEMA OFICIAL DE EMISIÓN DE BOLETOS</span>
                </div>
                <div className="accreditation-edition">
                  <span>CONFERENCIA 2026</span>
                </div>
              </div>

              <div className="accreditation-hero-banner">
                <div className="accreditation-logo-wrap">
                  <img 
                    src={`${import.meta.env.BASE_URL}logos/logo-despierta-horizontal.png`} 
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
                  <strong className="spec-val"><Clock size={14} /> 02:00 PM – 08:00 PM</strong>
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
                                <img 
                                  src={taller.foto} 
                                  alt={taller.facilitador} 
                                  className="taller-speaker-avatar is-clickable"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setLightboxIndex(taller.id === 'taller-1' ? 1 : taller.id === 'taller-2' ? 2 : 3);
                                  }}
                                  title={`Ver afiche: ${taller.nombre}`}
                                />
                                <div className="taller-color-indicator"></div>
                                <div className="taller-entry-title-wrap">
                                  <span className="taller-session-code">SESIÓN PARALELA • EXPOSITOR: {taller.facilitador}</span>
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

                        {/* Aclaratoria de Worship Night tras los talleres (con clic para afiche) */}
                        <div 
                          className="registration-worship-notice is-clickable"
                          onClick={() => setLightboxIndex(4)}
                          role="button"
                          tabIndex={0}
                          title="Ver afiche oficial de Worship Night"
                        >
                          <img src={`${import.meta.env.BASE_URL}worship/worship-night.jpeg`} alt="Worship Night Flyer" className="reg-worship-thumb" />
                          <div className="reg-worship-content">
                            <div className="reg-worship-tag">
                              <Sparkles size={12} />
                              <span>CULMINACIÓN • TRAS LOS TALLERES</span>
                            </div>
                            <h4 className="reg-worship-title">Worship Night (Noche de Adoración)</h4>
                            <p className="reg-worship-desc">
                              Al concluir los talleres y el panel, nos uniremos todos en el auditorio para una noche de adoración y acción de gracias.
                              <strong> No es una actividad aparte: ¡está 100% incluida con tu entrada!</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* -------------------------------------------------------------
                   MÓDULO 03: MERCH OFICIAL UPPER ROOM CONFERENCIA 2026
                   ------------------------------------------------------------- */}
                <div className="portal-module" id="modulo-merch">
                  <div className="module-legend">
                    <span className="legend-index">03</span>
                    <div className="legend-text">
                      <div className="legend-header-row">
                        <h2>Colección Oficial de Merch</h2>
                        <span className="tag-merch-badge">
                          <Sparkles size={12} /> EDICIÓN CONFERENCIA 2026
                        </span>
                      </div>
                      <p>Prendas exclusivas de alta calidad. Selección obligatoria para poder habilitar tu registro.</p>
                    </div>
                  </div>

                  <div className="module-body">
                    {/* Pregunta Obligatoria de Merch */}
                    <div className="portal-switch-row merch-required-switch">
                      <div className="switch-prompt-wrap">
                        <span className="switch-prompt">¿Deseas adquirir Merch oficial de la Conferencia? *</span>
                        <span className="switch-subprompt">Selección obligatoria para habilitar el botón de registro</span>
                      </div>
                      <div className="portal-segmented-control">
                        <button
                          type="button"
                          className={`segmented-btn ${formData.participaMerch === true ? 'is-active' : ''}`}
                          onClick={() => {
                            if (formError) setFormError('');
                            setFormData(prev => ({
                              ...prev,
                              participaMerch: true
                            }));
                          }}
                        >
                          Sí, quiero comprar Merch
                        </button>
                        <button
                          type="button"
                          className={`segmented-btn ${formData.participaMerch === false ? 'is-active' : ''}`}
                          onClick={() => {
                            if (formError) setFormError('');
                            setFormData(prev => ({
                              ...prev,
                              participaMerch: false
                            }));
                            setSelectedMerch([]);
                          }}
                        >
                          No, solo entrada gratuita
                        </button>
                      </div>
                    </div>

                    {/* Aviso si aún no ha seleccionado */}
                    {formData.participaMerch === null && (
                      <div className="merch-mandatory-reminder">
                        <AlertCircle size={16} />
                        <span>Por favor selecciona <strong>'Sí'</strong> o <strong>'No'</strong> para desbloquear la emisión de tu boleto.</span>
                      </div>
                    )}

                    {/* Mensaje si seleccionó No */}
                    {formData.participaMerch === false && (
                      <div className="merch-declined-note">
                        <CheckCircle size={16} color="#10b981" />
                        <span>Has elegido no adquirir Merch. ¡Tu entrada a la conferencia y plenarias continúa siendo <strong>100% gratuita</strong>!</span>
                      </div>
                    )}

                    {/* Catálogo de Tarjetas si seleccionó Sí */}
                    {formData.participaMerch === true && (
                      <div className="merch-catalog-zone">
                        <div className="zone-hint-box">
                          <Info size={15} />
                          <span>Elige tus prendas, tallas y colores. Puedes agregar más de una prenda a tu pedido. El pago se realizará por transferencia bancaria en las siguientes <strong>32 horas</strong>.</span>
                        </div>

                        <div className="merch-cards-grid">
                          {MERCH_CATALOG?.tshirt && (
                            <MerchCard
                              product={MERCH_CATALOG.tshirt}
                              selection={getCardSelection('tshirt')}
                              onSelectionChange={(newVal) => handleMerchSelectionChange(MERCH_CATALOG.tshirt, newVal)}
                              mode="registration"
                            />
                          )}

                          {MERCH_CATALOG?.hoodie && (
                            <MerchCard
                              product={MERCH_CATALOG.hoodie}
                              selection={getCardSelection('hoodie')}
                              onSelectionChange={(newVal) => handleMerchSelectionChange(MERCH_CATALOG.hoodie, newVal)}
                              mode="registration"
                            />
                          )}
                        </div>

                        {/* Barra de Resumen y Total con Lista Detallada de Items */}
                        <div className="merch-order-total-bar">
                          <div className="total-bar-left">
                            <ShoppingBag size={20} className="total-bag-icon" />
                            <div className="total-bar-text-group">
                              <span className="total-bar-label">Resumen de tu selección de Merch:</span>
                              {selectedMerch.length > 0 ? (
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
                                <strong className="total-bar-summary">
                                  Ninguna prenda marcada aún (haz clic en "+ Agregar Prenda" en la prenda deseada)
                                </strong>
                              )}
                            </div>
                          </div>
                          <div className="total-bar-right">
                            <span className="total-amount-label">Monto a Transferir:</span>
                            <strong className="total-amount-val">
                              RD$ {merchTotal.toLocaleString()}
                            </strong>
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

                  {formData.participaMerch === null && (
                    <div className="portal-required-step-hint">
                      <AlertCircle size={16} />
                      <span>Para habilitar el botón, debes responder si deseas adquirir Merch en el <strong>Módulo 03</strong>.</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary portal-submit-btn"
                    disabled={isSubmitting || formData.participaMerch === null}
                    title={formData.participaMerch === null ? "Selecciona si deseas adquirir Merch en el Módulo 03 para habilitar el registro" : "Emitir Boleto Oficial"}
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

            {/* Stage: The Ticket, Merch Payment Instructions and Related Data */}
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
                  <div className="sync-pill pill-success">
                    <CheckCircle size={16} />
                    <span>Boleto oficial emitido y confirmado para el evento.</span>
                  </div>
                )}
                {sheetStatus === 'error' && (
                  <div className="sync-pill pill-notice">
                    <Info size={16} />
                    <span>Boleto generado y confirmado en tu equipo. Puedes descargarlo o imprimirlo.</span>
                  </div>
                )}
              </div>

              {/* =========================================================
                 RESUMEN DE PAGO DE MERCH (INSTRUCCIONES DE TRANSFERENCIA)
                 ========================================================= */}
              {ticketData.hasMerch && (
                <section className="merch-payment-stage-box" aria-label="Instrucciones de Pago de Merch">
                  <div className="payment-box-top">
                    <div className="payment-box-headline">
                      <div className="payment-headline-icon">
                        <CreditCard size={26} />
                      </div>
                      <div>
                        <span className="payment-eyebrow">PASO REQUERIDO PARA CONFIRMAR PRENDA</span>
                        <h2 className="payment-box-title">Instrucciones de Pago • Merch Oficial</h2>
                      </div>
                    </div>
                    <div className="payment-deadline-badge">
                      <Clock size={16} />
                      <span>Tiempo de Validación: 32 Horas</span>
                    </div>
                  </div>

                  <p className="payment-box-intro">
                    ¡Tu entrada a la conferencia está asegurada! Para confirmar la confección y entrega de tu Merch oficial, realiza tu transferencia bancaria y remite el comprobante dentro de las próximas <strong>32 horas</strong>:
                  </p>

                  {/* Resumen de las prendas pedidas */}
                  <div className="payment-order-recap">
                    <div className="order-recap-items">
                      <span className="recap-label">Prendas seleccionadas:</span>
                      <strong className="recap-text">{ticketData.merchSummary}</strong>
                    </div>
                    <div className="order-recap-total">
                      <span className="recap-total-label">Total a transferir:</span>
                      <strong className="recap-total-amount">RD$ {ticketData.merchTotal?.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Tarjetas de Datos Bancarios */}
                  <div className="payment-bank-grid">
                    <div className="bank-info-card">
                      <span className="bank-field-label">BANCO</span>
                      <strong className="bank-field-val">Popular Dominicano</strong>
                    </div>

                    <div className="bank-info-card">
                      <span className="bank-field-label">BENEFICIARIO / CUENTA</span>
                      <strong className="bank-field-val">Iglesia Bautista Cristiana</strong>
                    </div>

                    <div className="bank-info-card bank-card-highlight">
                      <div className="bank-card-text">
                        <span className="bank-field-label">NÚMERO DE CUENTA (CORRIENTE)</span>
                        <strong className="bank-field-val mono">001-18074-6</strong>
                      </div>
                      <button 
                        type="button" 
                        className="bank-copy-btn" 
                        onClick={() => handleCopyBankData('001-18074-6', 'account')}
                        title="Copiar número de cuenta"
                      >
                        {copiedBankKey === 'account' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        <span>{copiedBankKey === 'account' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="bank-info-card">
                      <div className="bank-card-text">
                        <span className="bank-field-label">RNC</span>
                        <strong className="bank-field-val mono">401507422</strong>
                      </div>
                      <button 
                        type="button" 
                        className="bank-copy-btn" 
                        onClick={() => handleCopyBankData('401507422', 'rnc')}
                        title="Copiar RNC"
                      >
                        {copiedBankKey === 'rnc' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        <span>{copiedBankKey === 'rnc' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="bank-info-card bank-card-full bank-card-concept">
                      <div className="bank-card-text">
                        <span className="bank-field-label">DESCRIPCIÓN OBLIGATORIA DE TRANSFERENCIA</span>
                        <strong className="bank-field-val mono text-fire">COMPRA MERCH CONFERENCIA UPPER ROOM 2026</strong>
                        <span className="bank-field-hint">Coloca este texto exacto en el campo de concepto / descripción de tu transferencia bancaria.</span>
                      </div>
                      <button 
                        type="button" 
                        className="bank-copy-btn" 
                        onClick={() => handleCopyBankData('COMPRA MERCH CONFERENCIA UPPER ROOM 2026', 'desc')}
                        title="Copiar descripción obligatoria"
                      >
                        {copiedBankKey === 'desc' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        <span>{copiedBankKey === 'desc' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="bank-info-card bank-card-full">
                      <div className="bank-card-text">
                        <span className="bank-field-label">CORREO PARA ENVÍO DE COMPROBANTE</span>
                        <strong className="bank-field-val mono">upperroomibc@gmail.com</strong>
                        <span className="bank-field-hint">Envía el comprobante indicando tu nombre y código de boleto: <strong>{ticketData.ticketCode}</strong></span>
                      </div>
                      <button 
                        type="button" 
                        className="bank-copy-btn" 
                        onClick={() => handleCopyBankData('upperroomibc@gmail.com', 'email')}
                        title="Copiar correo"
                      >
                        {copiedBankKey === 'email' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        <span>{copiedBankKey === 'email' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Alerta de Validación de 32 Horas */}
                  <div className="payment-deadline-alert">
                    <AlertCircle size={22} className="deadline-alert-icon" />
                    <div className="deadline-alert-text">
                      <strong>Tiempo Límite de Validación: 32 Horas</strong>
                      <p>
                        Tu reserva quedará confirmada una vez recibido y conciliado tu comprobante en <strong>upperroomibc@gmail.com</strong>. Pasadas 32 horas sin comprobante, la reserva de tus prendas será liberada automáticamente para otros asistentes.
                      </p>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="payment-actions-strip no-print">
                    <button 
                      type="button" 
                      className="btn btn-secondary payment-action-btn"
                      onClick={handleCopyAllBankData}
                    >
                      {copiedAllBank ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                      <span>{copiedAllBank ? '¡Datos Bancarios Copiados!' : 'Copiar Todos los Datos de Pago'}</span>
                    </button>

                    <a 
                      href={`mailto:upperroomibc@gmail.com?subject=COMPROBANTE%20MERCH%20-%20${ticketData.ticketCode}%20-%20${encodeURIComponent(ticketData.firstName + ' ' + ticketData.lastName)}&body=Hola%20Equipo%20Upper%20Room%20IBC%2C%0A%0AAdjunto%20mi%20comprobante%20de%20transferencia%20para%20la%20Merch%20de%20la%20Conferencia%20Despierta%202026.%0A%0A%E2%80%A2%20Asistente%3A%20${encodeURIComponent(ticketData.firstName + ' ' + ticketData.lastName)}%0A%E2%80%A2%20C%C3%B3digo%20de%20Boleto%3A%20${ticketData.ticketCode}%0A%E2%80%A2%20Prendas%3A%20${encodeURIComponent(ticketData.merchSummary)}%0A%E2%80%A2%20Monto%20transferido%3A%20RD%24%20${ticketData.merchTotal}%0A%0A%C2%A1Muchas%20gracias!`}
                      className="btn btn-primary payment-action-btn"
                    >
                      <Mail size={16} />
                      <span>Enviar Comprobante por Correo</span>
                    </a>
                  </div>
                </section>
              )}

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
                        <img src={`${import.meta.env.BASE_URL}logos/logo-upperroom-negro.png`} alt="Upper Room IBC" className="ticket-logo-img" />
                      </div>
                      <div className="ticket-brand-meta">
                        <span className="ticket-sub-brand">UPPER ROOM • IGLESIA BAUTISTA CRISTIANA</span>
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

                    {ticketData.merchSummary && ticketData.merchSummary !== 'Ninguna' && ticketData.merchSummary !== 'No' && ticketData.merchSummary !== 'Disponible próximamente' && (
                      <div className="ticket-detail-item ticket-merch-item">
                        <span className="ticket-detail-label">PRE-ORDEN DE MERCH</span>
                        <span className="ticket-merch-val">🛍️ {ticketData.merchSummary}</span>
                        <span className="ticket-detail-sub">
                          {ticketData.merchTotal > 0 
                            ? `Total: RD$ ${ticketData.merchTotal.toLocaleString()} • En validación (Comprobante requerido en 32h)` 
                            : 'Paga y retira en el stand de Upper Room en el evento'}
                        </span>
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
              </div>

            </main>
          </div>
        )}
      </div>

      {/* Lightbox para afiches en alta resolución */}
      <Lightbox
        images={ALL_CONFERENCE_FLYERS}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrev={() => setLightboxIndex(prev => (prev === null ? 0 : (prev - 1 + ALL_CONFERENCE_FLYERS.length) % ALL_CONFERENCE_FLYERS.length))}
        onNext={() => setLightboxIndex(prev => (prev === null ? 0 : (prev + 1) % ALL_CONFERENCE_FLYERS.length))}
      />

    </div>
  );
};

export default Registration;
