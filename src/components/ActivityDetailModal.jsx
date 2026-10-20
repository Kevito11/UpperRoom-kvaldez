import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { 
  X, 
  Clock, 
  BookOpen, 
  Ticket, 
  ArrowRight, 
  ArrowLeft,
  ArrowUpRight,
  User, 
  Flame, 
  Sparkles, 
  Music, 
  MapPin, 
  Maximize2 
} from 'lucide-react';
import InstagramIcon from './icons/InstagramIcon';
import SpotifyIcon from './icons/SpotifyIcon';
import './ActivityDetailModal.css';

const ActivityDetailModal = ({ activity, isOpen, onClose }) => {
  // Estado para el visor de foto en pantalla completa pura (Segundo Clic)
  const [isFullPhotoOpen, setIsFullPhotoOpen] = useState(false);

  // Reiniciar estado de foto al cambiar de actividad o cerrar
  useEffect(() => {
    if (!isOpen) {
      setIsFullPhotoOpen(false);
    }
  }, [isOpen, activity]);

  // 1. Bloqueo estricto del scroll del body y manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Si el visor de foto pura está abierto, volver primero al modal
        if (isFullPhotoOpen) {
          setIsFullPhotoOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow || '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isFullPhotoOpen, onClose]);

  if (!isOpen || !activity) return null;
  if (typeof document === 'undefined') return null;

  const isWorship = Boolean(activity.isWorship || activity.tipo === 'worship');
  const hasInstagram = Boolean(activity.instagramUrl);
  const hasSpotify = Boolean(activity.spotifyUrl);

  // 1. Renderizado directo en document.body mediante createPortal
  return createPortal(
    <div 
      className="fullscreen-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-modal-title"
    >
      {/* ===================================================================
         2. VISOR DE FOTO EN PANTALLA COMPLETA PURA (Segundo Clic)
         Se activa al hacer clic en la foto dentro del modal para verla sin textos
         =================================================================== */}
      {isFullPhotoOpen ? (
        <div 
          className="pure-photo-viewer" 
          onClick={(e) => {
            e.stopPropagation();
            setIsFullPhotoOpen(false);
          }}
          title="Clic para volver al modal de información"
        >
          {/* Botones de control del visor de foto */}
          <div className="pure-photo-top-bar" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="pure-photo-back-btn"
              onClick={() => setIsFullPhotoOpen(false)}
            >
              <ArrowLeft size={16} />
              <span>Volver a la información</span>
            </button>

            <button 
              type="button" 
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Cerrar modal (Esc)"
              title="Cerrar (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          <div className="pure-photo-wrapper">
            <img 
              src={activity.foto} 
              alt={activity.expositor || activity.titulo} 
              className="pure-photo-img"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="pure-photo-bottom-caption" onClick={(e) => e.stopPropagation()}>
            <span className="pure-photo-name">{activity.titulo || activity.nombre}</span>
            <span className="pure-photo-sub">Toca fuera de la imagen o presiona Esc para volver</span>
          </div>
        </div>
      ) : (
        /* ===================================================================
           MODAL PRINCIPAL INMERSIVO (Split-Screen en PC • Columna en Móvil)
           =================================================================== */
        <div 
          className={`modal-content-box ${isWorship ? 'theme-worship' : 'theme-expositor'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 'X' anclada en la esquina superior derecha */}
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Cerrar modal (Esc)"
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>

          {/* =================================================================
             2. IMAGEN 100% LIMPIA (Clic para pantalla completa pura)
             Sin cintas, sin badges ni textos superpuestos en el rostro
             ================================================================= */}
          <div 
            className="modal-image-col is-clickable"
            onClick={() => setIsFullPhotoOpen(true)}
            role="button"
            tabIndex={0}
            title="Toca para ver la foto en pantalla completa pura"
          >
            <img 
              src={activity.foto} 
              alt={activity.expositor || activity.titulo} 
              className="modal-img"
            />
            {/* Indicador sutil de ampliación que no obstruye la foto */}
            <div className="modal-zoom-hint">
              <Maximize2 size={13} />
              <span>Toca para ampliar foto</span>
            </div>
          </div>

          {/* =================================================================
             3. CONTENEDOR DE TEXTOS Y ACCIONES (Derecha en PC • Abajo en Móvil)
             ================================================================= */}
          <div className="modal-info-col">
            <div className="modal-info-scrollable">
              
              {/* 3. REUBICACIÓN INTELIGENTE DE CINTA Y BADGES (100% Fuera de la foto) */}
              <div className="modal-badges-header-row">
                {activity.tag && (
                  <span className={`modal-ribbon-badge ${activity.colorClass || ''}`}>
                    {isWorship ? <Sparkles size={13} /> : <BookOpen size={13} />}
                    <span>{activity.tag}</span>
                  </span>
                )}

                <span className="modal-time-chip">
                  <Clock size={13} />
                  <span>{activity.hora || '5:20 PM'}</span>
                </span>

                {activity.lugar && (
                  <span className="modal-location-chip">
                    <MapPin size={12} />
                    <span>{activity.lugar}</span>
                  </span>
                )}

                {activity.sesionTipo && (
                  <span className="modal-session-chip">{activity.sesionTipo}</span>
                )}
              </div>

              {/* Título de la Actividad / Taller */}
              <div className="modal-titles-block">
                <h2 id="activity-modal-title" className="modal-title">
                  {activity.titulo || activity.nombre}
                </h2>
                {activity.subtitulo && (
                  <span className="modal-subtitle">{activity.subtitulo}</span>
                )}
              </div>

              {/* Ficha del Expositor o Ministerio */}
              <div className="modal-speaker-card">
                <div className="modal-speaker-avatar">
                  {isWorship ? <Music size={18} /> : <User size={18} />}
                </div>
                <div className="modal-speaker-details">
                  <span className="modal-speaker-role">
                    {activity.rol || (isWorship ? 'Ministerio' : 'Expositor')}:
                  </span>
                  <strong className="modal-speaker-name">
                    {activity.expositor || (isWorship ? 'Worship Team IBC' : '')}
                  </strong>
                  {activity.iglesia && (
                    <span className="modal-speaker-church">{activity.iglesia}</span>
                  )}
                </div>
              </div>

              {/* Enfoque Temático */}
              {activity.enfoque && (
                <div className="modal-focus-box">
                  <Flame size={14} className="focus-icon" />
                  <span><strong>Enfoque:</strong> {activity.enfoque}</span>
                </div>
              )}

              {/* Pregunta Reflexiva */}
              {activity.pregunta && (
                <blockquote className="modal-quote">
                  "{activity.pregunta}"
                </blockquote>
              )}

              {/* Descripción Detallada */}
              <div className="modal-desc-box">
                <h4 className="modal-desc-heading">
                  {isWorship ? 'Sobre esta noche de adoración:' : 'Acerca de este taller:'}
                </h4>
                <p className="modal-desc-text">
                  {activity.descripcion}
                </p>
              </div>

              {/* 4. ENLACE A INSTAGRAM DESACOPLADO: Botón Outline Sutil */}
              {hasInstagram && (
                <div className="modal-external-links-row">
                  <a 
                    href={activity.instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-outline-instagram"
                    title="Abrir publicación oficial en Instagram"
                  >
                    <InstagramIcon size={16} />
                    <span>Ver en Instagram</span>
                    <ArrowUpRight size={14} />
                  </a>

                  {hasSpotify && (
                    <a 
                      href={activity.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-spotify"
                      title="Escuchar canciones en Spotify"
                    >
                      <SpotifyIcon size={16} />
                      <span>Playlist Oficial</span>
                      <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              )}

            </div>

            {/* 4. BOTONES FLOTANTES Y CTA DE REGISTRO FIJADOS AL FINAL */}
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-modal-dismiss" 
                onClick={onClose}
              >
                Cerrar
              </button>

              <Link 
                to="/registro" 
                className="btn-modal-cta-primary"
                onClick={onClose}
              >
                <Ticket size={16} />
                <span>{isWorship ? 'Registrarme a la Conferencia' : 'Elegir Taller en Registro'}</span>
                <ArrowRight size={15} />
              </Link>
            </div>

          </div>

        </div>
      )}
    </div>,
    document.body
  );
};

export default ActivityDetailModal;
