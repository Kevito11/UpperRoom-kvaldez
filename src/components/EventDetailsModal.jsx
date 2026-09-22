import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Calendar, Clock, MapPin, Ticket, Flame, CheckCircle, 
  BookOpen, Sparkles, Coffee, ArrowRight, ExternalLink,
  Music, Users, MessageSquare, Copy, Check
} from 'lucide-react';
import './EventDetailsModal.css';

const SCHEDULE_ITEMS = [
  {
    id: 1,
    time: '2:00 – 3:00 PM',
    duration: '60 min',
    title: 'Registro y Acreditación de Jóvenes',
    desc: 'Llegada, check-in con escaneo de código QR digital en puerta, entrega de identificación y bienvenida en el lobby.',
    category: 'registro',
    type: 'logistica',
    badge: 'Apertura de Puertas',
    badgeClass: 'badge-zinc',
    icon: Ticket
  },
  {
    id: 2,
    time: '3:00 – 3:05 PM',
    duration: '5 min',
    title: 'Bienvenida Oficial & Oración de Apertura',
    desc: 'Apertura formal de la Conferencia Despierta 2026 y consagración del día en las manos del Señor.',
    category: 'apertura',
    type: 'plenaria',
    badge: 'Inicio Oficial',
    badgeClass: 'badge-amber',
    icon: Sparkles
  },
  {
    id: 3,
    time: '3:10 – 3:30 PM',
    duration: '20 min',
    title: 'Tiempo de Alabanzas & Exaltación',
    desc: 'Adoración congregacional cristocéntrica dirigida por el ministerio de adoración de Upper Room.',
    category: 'alabanza',
    type: 'worship',
    badge: 'Adoración',
    badgeClass: 'badge-purple',
    icon: Music
  },
  {
    id: 4,
    time: '3:30 – 4:00 PM',
    duration: '30 min',
    title: 'Predicación 1: «¿POR QUÉ TE DUERMES?»',
    desc: 'Primera plenaria bíblica expositiva. Un llamado urgente a examinar el corazón, sacudir la tibieza y despertar del letargo espiritual.',
    category: 'plenaria',
    type: 'plenaria',
    badge: 'Plenaria 1',
    badgeClass: 'badge-fire',
    highlight: true,
    icon: Flame
  },
  {
    id: 5,
    time: '4:00 – 4:20 PM',
    duration: '20 min',
    title: 'Break / Receso 1',
    desc: 'Tiempo de hidratación, café, refrigerio y comunión fraternal entre ministerios.',
    category: 'break',
    type: 'break',
    badge: 'Receso',
    badgeClass: 'badge-zinc',
    icon: Coffee
  },
  {
    id: 6,
    time: '4:20 – 4:30 PM',
    duration: '10 min',
    title: 'Tiempo de Alabanzas',
    desc: 'Cantos de adoración congregacional y preparación del corazón para la segunda palabra.',
    category: 'alabanza',
    type: 'worship',
    badge: 'Adoración',
    badgeClass: 'badge-purple',
    icon: Music
  },
  {
    id: 7,
    time: '4:30 – 5:00 PM',
    duration: '30 min',
    title: 'Predicación 2: «DIOS TE LLAMA A DESPERTAR»',
    desc: 'Segunda plenaria bíblica expositiva. La gracia soberana de Dios que nos llama de las tinieblas a Su luz y nos levanta con poder.',
    category: 'plenaria',
    type: 'plenaria',
    badge: 'Plenaria 2',
    badgeClass: 'badge-fire',
    highlight: true,
    icon: Flame
  },
  {
    id: 8,
    time: '5:00 – 5:20 PM',
    duration: '20 min',
    title: 'Break / Receso 2 & Movilización',
    desc: 'Receso para transitar hacia las respectivas aulas y ubicarse en el taller elegido al registrarse.',
    category: 'break',
    type: 'break',
    badge: 'Transición',
    badgeClass: 'badge-zinc',
    icon: Coffee
  },
  {
    id: 9,
    time: '5:20 – 6:00 PM',
    duration: '40 min',
    title: 'Talleres Bíblicos Simultáneos',
    desc: 'Sesiones paralelas interactivas para responder a las preguntas y luchas reales del joven cristiano hoy:',
    talleres: [
      {
        id: 't1',
        numero: '1',
        titulo: '¿Dónde quedó el fuego?',
        expositor: 'Natalie Ruiz',
        colorName: 'Rojo',
        colorClass: 'taller-chip-rojo',
        tema: 'Estancamiento espiritual y recuperar el primer amor'
      },
      {
        id: 't2',
        numero: '2',
        titulo: 'Modo Automático',
        expositor: 'Ps. Pedro daCuhna',
        colorName: 'Azul',
        colorClass: 'taller-chip-azul',
        tema: 'Rutina, distracciones y fe viva vs religiosidad vacía'
      },
      {
        id: 't3',
        numero: '3',
        titulo: '¿Y ahora qué hago?',
        expositor: 'Andy Tejeda',
        colorName: 'Verde',
        colorClass: 'taller-chip-verde',
        tema: 'Propósito, vocación y respuesta al llamado de Dios'
      }
    ],
    category: 'talleres',
    type: 'talleres',
    badge: '3 Sesiones Paralelas',
    badgeClass: 'badge-indigo',
    highlight: true,
    icon: BookOpen
  },
  {
    id: 10,
    time: '6:00 – 6:40 PM',
    duration: '40 min',
    title: 'Panel: Despierta: ¿Y ahora qué? (Q&A)',
    desc: 'Espacio interactivo de preguntas y respuestas en vivo con el panel pastoral y los expositores sobre las inquietudes de los jóvenes.',
    category: 'panel',
    type: 'plenaria',
    badge: 'Panel & Preguntas',
    badgeClass: 'badge-sky',
    highlight: true,
    icon: MessageSquare
  },
  {
    id: 11,
    time: '6:40 – 7:00 PM',
    duration: '20 min',
    title: 'Break / Receso 3',
    desc: 'Último receso de refrigerio, fotos grupales y preparación para entrar al auditorio para la noche de cierre.',
    category: 'break',
    type: 'break',
    badge: 'Receso Final',
    badgeClass: 'badge-zinc',
    icon: Coffee
  },
  {
    id: 12,
    time: '7:00 – 8:00 PM',
    duration: '60 min',
    title: 'Worship Night (Noche de Adoración y Cierre)',
    desc: 'Concierto de clausura, tiempo extendido de clamor de rodillas, exaltación a Cristo y envío para vivir despiertos.',
    category: 'worship',
    type: 'worship',
    badge: 'Gran Cierre',
    badgeClass: 'badge-pink',
    highlight: true,
    isGrandFinale: true,
    icon: Music
  }
];

const EventDetailsModal = ({ isOpen, onClose }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredSchedule = SCHEDULE_ITEMS.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'plenarias') return item.type === 'plenaria';
    if (activeFilter === 'talleres') return item.type === 'talleres';
    if (activeFilter === 'worship') return item.type === 'worship';
    return true;
  });

  const handleCopySchedule = () => {
    const textToCopy = `🔥 CRONOGRAMA OFICIAL • CONFERENCIA DESPIERTA 2026 🔥\n` +
      `📅 Sábado 31 de Octubre | 📍 Auditorio IBC | ⏰ 2:00 PM – 8:00 PM\n\n` +
      `• 2:00–3:00 PM: Registro y Acreditación\n` +
      `• 3:00–3:05 PM: Bienvenida Oficial\n` +
      `• 3:10–3:30 PM: Tiempo de Alabanzas\n` +
      `• 3:30–4:00 PM: Predicación 1 - ¿POR QUÉ TE DUERMES?\n` +
      `• 4:00–4:20 PM: Break/Receso 1\n` +
      `• 4:20–4:30 PM: Tiempo de Alabanzas\n` +
      `• 4:30–5:00 PM: Predicación 2 - DIOS TE LLAMA A DESPERTAR\n` +
      `• 5:00–5:20 PM: Break/Receso 2\n` +
      `• 5:20–6:00 PM: Talleres Simultáneos:\n` +
      `   1. ¿Dónde quedó el fuego? – Natalie Ruiz\n` +
      `   2. Modo Automático – Ps. Pedro daCuhna\n` +
      `   3. ¿Y ahora qué hago? – Andy Tejeda\n` +
      `• 6:00–6:40 PM: Panel: Despierta: ¿Y ahora qué? Q&A\n` +
      `• 6:40–7:00 PM: Break/Receso 3\n` +
      `• 7:00–8:00 PM: Worship Night (Gran Cierre)\n\n` +
      `🎟️ Registro Gratuito: ${window.location.origin}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar detalles">
          <X size={18} />
        </button>

        {/* Compact Header Bar */}
        <div className="modal-compact-header">
          <div className="header-brand-line">
            <div className="brand-logos-row">
              <img 
                src={`${import.meta.env.BASE_URL}logos/logo-upperroom-negro.png`} 
                alt="Upper Room IBC" 
                className="modal-header-logo-icon" 
              />
              <span className="brand-dot">•</span>
              <span className="modal-header-tag">UPPER ROOM IBC • CONFERENCIA DE JÓVENES</span>
            </div>
            <span className="badge badge-amber badge-sm modal-header-badge">
              <Flame size={12} />
              <span>PROGRAMA OFICIAL</span>
            </span>
          </div>

          <div className="header-main-title">
            <h2 className="modal-title-condensed">
              CONFERENCIA <span className="text-fire">DESPIERTA 2026</span>
            </h2>
            <span className="modal-lema-pill">«LA LLAMA VUELVE A ENCENDERSE»</span>
          </div>

          {/* Compact Quick-Specs Strip (Reemplaza las cajas fijas gigantes) */}
          <div className="modal-quick-strip">
            <div className="strip-item">
              <Calendar size={14} className="strip-icon" />
              <div className="strip-text">
                <span className="strip-label">FECHA</span>
                <strong>Sáb 31 Oct, 2026</strong>
              </div>
            </div>

            <div className="strip-divider"></div>

            <div className="strip-item">
              <Clock size={14} className="strip-icon text-fire" />
              <div className="strip-text">
                <span className="strip-label">HORARIO</span>
                <strong>02:00 PM – 08:00 PM</strong>
              </div>
            </div>

            <div className="strip-divider"></div>

            <div className="strip-item">
              <MapPin size={14} className="strip-icon" />
              <div className="strip-text">
                <span className="strip-label">LUGAR</span>
                <strong>Auditorio IBC</strong>
              </div>
            </div>

            <div className="strip-divider"></div>

            <div className="strip-item strip-free">
              <Ticket size={14} className="strip-icon text-free" />
              <div className="strip-text">
                <span className="strip-label">ENTRADA</span>
                <strong className="text-free">100% Gratuita</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body: Scrollable Program */}
        <div className="modal-body-scroll">
          
          {/* Controls Bar: Filter Tabs & Copy Action */}
          <div className="schedule-controls-bar">
            <div className="schedule-filter-tabs">
              <button 
                type="button" 
                className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Todos ({SCHEDULE_ITEMS.length})
              </button>
              <button 
                type="button" 
                className={`filter-tab-btn ${activeFilter === 'plenarias' ? 'active' : ''}`}
                onClick={() => setActiveFilter('plenarias')}
              >
                <Flame size={12} />
                Plenarias & Panel
              </button>
              <button 
                type="button" 
                className={`filter-tab-btn ${activeFilter === 'talleres' ? 'active' : ''}`}
                onClick={() => setActiveFilter('talleres')}
              >
                <BookOpen size={12} />
                Talleres
              </button>
              <button 
                type="button" 
                className={`filter-tab-btn ${activeFilter === 'worship' ? 'active' : ''}`}
                onClick={() => setActiveFilter('worship')}
              >
                <Music size={12} />
                Adoración
              </button>
            </div>

            <button 
              type="button" 
              className={`schedule-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopySchedule}
              title="Copiar cronograma al portapapeles"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Timeline / Schedule Feed */}
          <div className="timeline-container">
            {filteredSchedule.map((item) => {
              const IconComponent = item.icon;
              return (
                <div 
                  key={item.id} 
                  className={`timeline-entry ${item.highlight ? 'entry-highlight' : ''} ${item.isGrandFinale ? 'entry-finale' : ''} ${item.type === 'break' ? 'entry-break' : ''}`}
                >
                  {/* Left Column: Time & Duration */}
                  <div className="timeline-time-col">
                    <span className="time-primary">{item.time}</span>
                    <span className="time-duration">{item.duration}</span>
                  </div>

                  {/* Center Node / Dot */}
                  <div className="timeline-marker">
                    <div className="timeline-node">
                      <IconComponent size={14} />
                    </div>
                    <div className="timeline-line"></div>
                  </div>

                  {/* Right Column: Card Content */}
                  <div className="timeline-card">
                    <div className="card-top-row">
                      <h3 className="card-event-title">{item.title}</h3>
                      <span className={`card-type-badge ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    </div>

                    <p className="card-event-desc">{item.desc}</p>

                    {/* Special sub-block for Talleres simultáneos */}
                    {item.talleres && (
                      <div className="talleres-spotlight-grid">
                        {item.talleres.map((t) => (
                          <div key={t.id} className="taller-spotlight-card">
                            <div className="taller-card-top">
                              <span className={`taller-badge-pill ${t.colorClass}`}>
                                Taller {t.numero} • {t.colorName}
                              </span>
                              <span className="taller-speaker">
                                Expositor: <strong>{t.expositor}</strong>
                              </span>
                            </div>
                            <strong className="taller-card-name">«{t.titulo}»</strong>
                            <span className="taller-card-focus">{t.tema}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact Guidelines / What to keep in mind */}
          <div className="compact-tips-section">
            <div className="tips-header-bar">
              <CheckCircle size={16} className="text-fire" />
              <h4>Recomendaciones clave para este día</h4>
            </div>

            <div className="compact-tips-row">
              <div className="compact-tip-pill">
                <BookOpen size={14} className="tip-pill-icon" />
                <span>Trae tu Biblia física y libreta de notas</span>
              </div>
              <div className="compact-tip-pill">
                <Ticket size={14} className="tip-pill-icon" />
                <span>Pase QR listo en tu móvil o impreso</span>
              </div>
              <div className="compact-tip-pill">
                <Clock size={14} className="tip-pill-icon" />
                <span>Llega puntual a las 2:00 PM para la acreditación</span>
              </div>
              <div className="compact-tip-pill">
                <Users size={14} className="tip-pill-icon" />
                <span>Invita a tus amigos (Jornada 100% abierta)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Bar */}
        <div className="modal-footer-bar">
          <a 
            href="https://maps.app.goo.gl/YFgXjV3nBEFtdBpX7" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary btn-sm"
          >
            <MapPin size={15} />
            <span>Auditorio IBC en Maps</span>
            <ExternalLink size={13} />
          </a>

          <div className="modal-footer-right">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cerrar
            </button>
            <Link to="/registro" className="btn btn-primary btn-sm" onClick={onClose}>
              <Ticket size={15} />
              <span>Emitir Mi Pase Gratuito</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
