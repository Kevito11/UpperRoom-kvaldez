import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Ticket, ArrowRight, 
  Flame, Music, BookOpen, Coffee, MessageSquare, Sparkles 
} from 'lucide-react';
import Lightbox from './Lightbox';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import './EventDetailsModal.css';

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
    expositor: 'Humberto Méndez',
    iglesia: 'Pastor Iglesia Cristiana Oasis',
    foto: `${import.meta.env.BASE_URL}expositores/humberto-mendez.jpeg`,
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
    expositor: 'Humberto Méndez',
    iglesia: 'Pastor Iglesia Cristiana Oasis',
    foto: `${import.meta.env.BASE_URL}expositores/humberto-mendez.jpeg`,
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
    actividad: 'Talleres Simultáneos:',
    tipo: 'talleres',
    highlight: true,
    icon: BookOpen,
    talleres: [
      { num: '1', nombre: '¿Dónde quedó el fuego?', expositor: 'Natali de Ruiz', tema: 'Estancamiento espiritual', color: 'Rojo', foto: `${import.meta.env.BASE_URL}expositores/natali-ruiz.jpeg` },
      { num: '2', nombre: 'Modo Automático', expositor: 'Ps. Pedro da Cuhna', iglesia: 'Pastor IBC', tema: 'Rutina y distracciones', color: 'Azul', foto: `${import.meta.env.BASE_URL}expositores/pedro-dacuhna.jpeg` },
      { num: '3', nombre: '¿Y ahora qué hago?', expositor: 'Andy Tejada', tema: 'Propósito y llamado', color: 'Verde', foto: `${import.meta.env.BASE_URL}expositores/andy-tejada.jpeg` }
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
    actividad: 'Worship Night • Noche de Adoración',
    detalle: 'Al finalizar la conferencia: Adoración congregacional, clamor y acción de gracias',
    tipo: 'worship',
    highlight: true,
    icon: Sparkles,
    foto: `${import.meta.env.BASE_URL}worship/worship-night.jpeg`
  }
];

const EventDetailsModal = ({ isOpen, onClose }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Bloquear scroll de fondo de forma segura
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isOpen]);

  // Manejar tecla Esc para cerrar Lightbox o Modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, lightboxIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cronograma-modal-overlay" onClick={onClose}>
      <div className="cronograma-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Barra superior fija y elegante con botón de cierre integrado */}
        <div className="cronograma-modal-header">
          <div className="cronograma-header-titles">
            <div className="cronograma-header-tags">
              <span className="header-badge-tag">UPPER ROOM IBC • CONFERENCIA 2026</span>
              <span className="header-badge-date">SÁBADO 31 DE OCTUBRE</span>
            </div>
            <h2 className="header-main-title">Cronograma Oficial</h2>
          </div>

          <button 
            type="button" 
            className="cronograma-modal-close-btn" 
            onClick={onClose} 
            aria-label="Cerrar cronograma (Esc)"
            title="Cerrar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo desplazable: todas las actividades muestran su información abierta y directa */}
        <div className="cronograma-scroll-body">
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

                          {/* Expositor en plenaria con avatar clickeable */}
                          {isPredicacion && item.expositor && (
                            <div 
                              className="cronograma-speaker-inline is-clickable"
                              onClick={() => setLightboxIndex(0)}
                              role="button"
                              tabIndex={0}
                              title={`Ver afiche de ${item.expositor}`}
                            >
                              <img src={item.foto} alt={item.expositor} className="cronograma-speaker-thumb" />
                              <div className="cronograma-speaker-text">
                                <span className="cronograma-speaker-name">{item.expositor}</span>
                                <span className="cronograma-speaker-church">{item.iglesia}</span>
                              </div>
                            </div>
                          )}

                          {/* Sublista de talleres siempre visible con avatars clickeables */}
                          {isTalleres && item.talleres && (
                            <div className="talleres-sublist">
                              {item.talleres.map((taller) => (
                                <div 
                                  key={taller.num} 
                                  className="taller-subitem is-clickable"
                                  onClick={() => setLightboxIndex(taller.num === '1' ? 1 : taller.num === '2' ? 2 : 3)}
                                  role="button"
                                  tabIndex={0}
                                  title={`Ver afiche del taller: ${taller.nombre}`}
                                >
                                  <img src={taller.foto} alt={taller.expositor} className="taller-mini-thumb" />
                                  <span className={`taller-dot dot-${taller.color.toLowerCase()}`}></span>
                                  <div className="taller-subitem-col">
                                    <span className="taller-line-text">
                                      <strong>{taller.num}. {taller.nombre}</strong> – {taller.expositor}
                                    </span>
                                    <span className="taller-subitem-tema">Tema: {taller.tema}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Worship Night inline visual clickeable */}
                          {isWorship && item.foto && (
                            <div 
                              className="cronograma-worship-inline is-clickable"
                              onClick={() => setLightboxIndex(4)}
                              role="button"
                              tabIndex={0}
                              title="Ver afiche de Worship Night"
                            >
                              <img src={item.foto} alt="Worship Night Flyer" className="cronograma-worship-thumb" />
                              <div className="cronograma-worship-text">
                                <span className="cronograma-worship-tag">GRAN CIERRE • AL FINALIZAR LA CONFERENCIA</span>
                                <span className="actividad-subdetalle">{item.detalle}</span>
                              </div>
                            </div>
                          )}

                          {/* Detalle de cada actividad siempre visible */}
                          {item.detalle && !isTalleres && !isWorship && (
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

      {/* Lightbox para fotos en alta definición desde el cronograma */}
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

export default EventDetailsModal;
