import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Ticket, ArrowRight, 
  Flame, Music, BookOpen, Coffee, MessageSquare, Sparkles 
} from 'lucide-react';
import './EventDetailsModal.css';

const CRONOGRAMA = [
  {
    id: 1,
    hora: '2:00–3:00 PM',
    actividad: 'Registro',
    detalle: 'Llegada y escaneo de pase QR en puerta',
    tipo: 'normal',
    icon: Ticket
  },
  {
    id: 2,
    hora: '3:00– 3:05 PM',
    actividad: 'Bienvenida',
    detalle: 'Palabras de inicio y oración de apertura',
    tipo: 'normal',
    icon: Sparkles
  },
  {
    id: 3,
    hora: '3:10–3:30 PM',
    actividad: 'Tiempo de alabanzas',
    detalle: 'Adoración congregacional',
    tipo: 'alabanza',
    icon: Music
  },
  {
    id: 4,
    hora: '3:30–4:00 PM',
    actividad: 'Predicación 1 - ¿POR QUÉ TE DUERMES?',
    detalle: 'Plenaria bíblica expositiva',
    tipo: 'predicacion',
    highlight: true,
    icon: Flame
  },
  {
    id: 5,
    hora: '4:00–4:20 PM',
    actividad: 'Break/Receso 1',
    detalle: 'Refrigerio y comunión',
    tipo: 'break',
    icon: Coffee
  },
  {
    id: 6,
    hora: '4:20–4:30 PM',
    actividad: 'Tiempo de alabanzas',
    detalle: 'Adoración congregacional',
    tipo: 'alabanza',
    icon: Music
  },
  {
    id: 7,
    hora: '4:30–5:00 PM',
    actividad: 'Predicación 2 - DIOS TE LLAMA A DESPERTAR',
    detalle: 'Plenaria bíblica expositiva',
    tipo: 'predicacion',
    highlight: true,
    icon: Flame
  },
  {
    id: 8,
    hora: '5:00–5:20 PM',
    actividad: 'Break/Receso 2',
    detalle: 'Acomodación y traslado a talleres',
    tipo: 'break',
    icon: Coffee
  },
  {
    id: 9,
    hora: '5:20–6:00 PM',
    actividad: 'Talleres:',
    tipo: 'talleres',
    highlight: true,
    icon: BookOpen,
    talleres: [
      { num: '1', nombre: '¿Dónde quedó el fuego?', expositor: 'Natalie Ruiz', color: 'Rojo' },
      { num: '2', nombre: 'Modo Automático', expositor: 'Ps. Pedro daCuhna', color: 'Azul' },
      { num: '3', nombre: '¿Y ahora qué hago?', expositor: 'Andy Tejeda', color: 'Verde' }
    ]
  },
  {
    id: 10,
    hora: '6:00–6:40 PM',
    actividad: 'Panel: Despierta: ¿Y ahora qué? Q&A',
    detalle: 'Sesión de preguntas y respuestas con pastores y expositores',
    tipo: 'panel',
    highlight: true,
    icon: MessageSquare
  },
  {
    id: 11,
    hora: '6:40–7:00 PM',
    actividad: 'Break/Receso 3',
    detalle: 'Preparación para el cierre de la jornada',
    tipo: 'break',
    icon: Coffee
  },
  {
    id: 12,
    hora: '7:00– 8:00 PM',
    actividad: 'Worship Night',
    detalle: 'Noche de adoración, clamor congregacional y clausura',
    tipo: 'worship',
    highlight: true,
    icon: Sparkles
  }
];

const EventDetailsModal = ({ isOpen, onClose }) => {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollTop = useRef(0);

  // Bloquear scroll de fondo mientras el modal esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsHeaderHidden(false);
      lastScrollTop.current = 0;
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Al hacer scroll hacia abajo, la barra superior se oculta completamente
  const handleScroll = (e) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    
    // Si baja más de 25px y va hacia abajo, ocultar barra superior
    if (currentScrollTop > 25 && currentScrollTop > lastScrollTop.current) {
      setIsHeaderHidden(true);
    } else if (currentScrollTop < lastScrollTop.current || currentScrollTop <= 15) {
      // Si sube o está arriba, mostrarla
      setIsHeaderHidden(false);
    }

    lastScrollTop.current = currentScrollTop <= 0 ? 0 : currentScrollTop;
  };

  return (
    <div className="cronograma-modal-overlay" onClick={onClose}>
      <div className="cronograma-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Botón flotante para cerrar: siempre visible y accesible en la esquina */}
        <button className="cronograma-floating-close-btn" onClick={onClose} aria-label="Cerrar cronograma">
          <X size={15} />
        </button>

        {/* Barra superior limpia: se oculta completamente al bajar el scroll */}
        <div className={`cronograma-dynamic-header ${isHeaderHidden ? 'is-hidden' : ''}`}>
          <div className="header-titles-box">
            <span className="header-badge-tag">UPPER ROOM IBC • CONFERENCIA 2026</span>
            <h2 className="header-main-title">Cronograma Oficial</h2>
          </div>
        </div>

        {/* Cuerpo desplazable: todas las actividades muestran su información abierta y directa */}
        <div className="cronograma-scroll-body" onScroll={handleScroll}>
          <div className="cronograma-table-wrapper">
            <table className="cronograma-table">
              <thead>
                <tr>
                  <th className="th-hora">HORA</th>
                  <th className="th-actividad">ACTIVIDAD</th>
                </tr>
              </thead>
              <tbody>
                {CRONOGRAMA.map((item) => {
                  const isPredicacion = item.tipo === 'predicacion';
                  const isTalleres = item.tipo === 'talleres';
                  const isWorship = item.tipo === 'worship';
                  const isBreak = item.tipo === 'break';
                  const isPanel = item.tipo === 'panel';

                  return (
                    <tr 
                      key={item.id} 
                      className={`c-row ${isPredicacion ? 'row-predicacion' : ''} ${isTalleres ? 'row-talleres' : ''} ${isWorship ? 'row-worship' : ''} ${isBreak ? 'row-break' : ''} ${isPanel ? 'row-panel' : ''}`}
                    >
                      <td className="td-hora">
                        <span className="hora-text">{item.hora}</span>
                      </td>
                      <td className="td-actividad">
                        <div className="actividad-content">
                          <strong className="actividad-nombre">{item.actividad}</strong>

                          {/* Sublista de talleres siempre visible */}
                          {isTalleres && item.talleres && (
                            <div className="talleres-sublist">
                              {item.talleres.map((taller) => (
                                <div key={taller.num} className="taller-subitem">
                                  <span className={`taller-dot dot-${taller.color.toLowerCase()}`}></span>
                                  <span className="taller-line-text">
                                    <strong>{taller.num}. {taller.nombre}</strong> – {taller.expositor}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Detalle de cada actividad siempre visible */}
                          {item.detalle && !isTalleres && (
                            <span className="actividad-subdetalle">{item.detalle}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Barra inferior compacta: Botón Registrarme corto y nítido */}
        <div className="cronograma-modal-footer">
          <button type="button" className="btn-modal-close" onClick={onClose}>
            Cerrar
          </button>
          <Link to="/registro" className="btn-modal-register" onClick={onClose}>
            <Ticket size={13} />
            <span>Registrarme</span>
            <ArrowRight size={13} />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default EventDetailsModal;
