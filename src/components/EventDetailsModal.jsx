import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Calendar, Clock, MapPin, Ticket, Flame, CheckCircle, 
  BookOpen, Sparkles, Coffee, Heart, ArrowRight, ExternalLink 
} from 'lucide-react';
import './EventDetailsModal.css';

const EventDetailsModal = ({ isOpen, onClose }) => {
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

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar detalles">
          <X size={20} />
        </button>

        {/* Modal Header Banner */}
        <div className="modal-header-banner">
          <img 
            src={`${import.meta.env.BASE_URL}logos/logo-despierta-horizontal.png`} 
            alt="Conferencia Despierta 2026 - Upper Room IBC" 
            className="modal-banner-img" 
          />
          <div className="modal-banner-overlay"></div>
          <div className="modal-banner-badge badge badge-amber">
            <Flame size={14} />
            <span>DETALLES OFICIALES DE LA ACTIVIDAD</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body-scroll">
          <div className="modal-title-wrap">
            <span className="modal-lema">«LA LLAMA VUELVE A ENCENDERSE»</span>
            <h2>Conferencia de Jóvenes 2026</h2>
            <p className="modal-subtitle">
              Un día consagrado para buscar al Señor en unidad, ser confrontados por las Escrituras y avivar nuestro celo por el Evangelio en <strong>Upper Room IBC</strong>.
            </p>
          </div>

          {/* Quick Key Info Grid */}
          <div className="modal-key-grid">
            <div className="key-info-box">
              <Calendar className="key-icon" size={20} />
              <div>
                <span className="key-label">FECHA</span>
                <strong>Sábado 31 de Octubre, 2026</strong>
              </div>
            </div>

            <div className="key-info-box">
              <Clock className="key-icon" size={20} />
              <div>
                <span className="key-label">HORARIO</span>
                <strong>03:00 PM – 08:30 PM (1 Solo Día)</strong>
              </div>
            </div>

            <div className="key-info-box">
              <MapPin className="key-icon" size={20} />
              <div>
                <span className="key-label">LUGAR</span>
                <strong>Auditorio Principal IBC</strong>
                <span className="key-extra">C. Juan Luis Franco Bidó 25, Santo Domingo</span>
              </div>
            </div>

            <div className="key-info-box highlight-cost">
              <Ticket className="key-icon" size={20} />
              <div>
                <span className="key-label">ENTRADA</span>
                <strong className="text-free">100% Gratuita</strong>
                <span className="key-extra">Pase digital con código QR obligatorio</span>
              </div>
            </div>
          </div>

          {/* Program / Schedule Section */}
          <div className="modal-section-box">
            <div className="box-header">
              <Clock size={18} className="box-icon text-fire" />
              <h3>Programa de la Conferencia</h3>
              <span className="badge badge-amber badge-sm">31 OCT 2026</span>
            </div>

            <div className="schedule-list">
              <div className="schedule-item">
                <span className="sched-time">3:00 – 3:10pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Bienvenida</span>
              </div>
              <div className="schedule-item">
                <span className="sched-time">3:10 – 3:20pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Alabanzas <em>(2 canciones)</em></span>
              </div>
              <div className="schedule-item sched-highlight">
                <span className="sched-time">3:20 – 4:00pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Predicación 1</span>
              </div>
              <div className="schedule-item sched-break">
                <span className="sched-time">4:00 – 4:20pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Break</span>
              </div>
              <div className="schedule-item">
                <span className="sched-time">4:20 – 4:30pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Alabanzas <em>(2 canciones)</em></span>
              </div>
              <div className="schedule-item sched-highlight">
                <span className="sched-time">4:30 – 5:10pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Predicación 2</span>
              </div>
              <div className="schedule-item sched-break">
                <span className="sched-time">5:10 – 5:30pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Break</span>
              </div>
              <div className="schedule-item sched-taller">
                <span className="sched-time">5:30 – 6:10pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Talleres Simultáneos <em>(elige uno al registrarte)</em></span>
              </div>
              <div className="schedule-item sched-break">
                <span className="sched-time">6:10 – 6:30pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Break</span>
              </div>
              <div className="schedule-item sched-highlight">
                <span className="sched-time">6:30 – 7:10pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Panel Despierta <em>(preguntas)</em></span>
              </div>
              <div className="schedule-item">
                <span className="sched-time">7:10 – 7:50pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">Tiempo libre</span>
              </div>
              <div className="schedule-item sched-highlight sched-worship">
                <span className="sched-time">7:50 – 8:30pm</span>
                <span className="sched-dot"></span>
                <span className="sched-label">🎶 Worship</span>
              </div>
            </div>
          </div>

          {/* Recommendations / What to bring */}
          <div className="modal-section-box">
            <div className="box-header">
              <CheckCircle size={18} className="box-icon" />
              <h3>¿Qué debes tener en cuenta para ese día?</h3>
            </div>

            <div className="tips-grid">
              <div className="tip-card">
                <BookOpen size={20} className="tip-icon" />
                <div>
                  <strong>Trae tu Biblia y libreta</strong>
                  <span>Tendremos sesiones de estudio bíblico intensivo.</span>
                </div>
              </div>

              <div className="tip-card">
                <Ticket size={20} className="tip-icon" />
                <div>
                  <strong>Ten tu boleto QR a mano</strong>
                  <span>En tu celular o impreso para el escaneo en la puerta.</span>
                </div>
              </div>

              <div className="tip-card">
                <Heart size={20} className="tip-icon" />
                <div>
                  <strong>Invita a tus amigos</strong>
                  <span>Es una jornada abierta para jóvenes creyentes y no creyentes.</span>
                </div>
              </div>

              <div className="tip-card">
                <Sparkles size={20} className="tip-icon" />
                <div>
                  <strong>Llega con anticipación</strong>
                  <span>Los parqueos son limitados. Te recomendamos llegar temprano para asegurar tu lugar.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer-bar">
          <a 
            href="https://maps.app.goo.gl/YFgXjV3nBEFtdBpX7" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary btn-sm"
          >
            <MapPin size={16} />
            <span>Ver en Google Maps</span>
            <ExternalLink size={14} />
          </a>

          <div className="modal-footer-right">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cerrar
            </button>
            <Link to="/registro" className="btn btn-primary btn-sm" onClick={onClose}>
              <span>Registrarme a la Conferencia</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
