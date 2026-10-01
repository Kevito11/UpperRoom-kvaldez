import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, Ticket, 
  Sparkles, CheckCircle,
  BookOpen, Music, Users, MapPin, ShoppingBag, Clock, Maximize2, ArrowRight
} from 'lucide-react';
import CountdownTimer from '../../components/CountdownTimer';
import EventDetailsModal from '../../components/EventDetailsModal';
import Lightbox from '../../components/Lightbox';
import './Home.css';

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

const Home = () => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [activeFilter, setActiveFilter] = useState('todos');

  return (
    <div className="home-page">
      {/* Event Details Modal */}
      <EventDetailsModal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container-single">

          <div className="hero-content-col">
            <div className="hero-slogan-wrap">
              <span className="hero-slogan">CONFERENCIA 2026 • IGLESIA BAUTISTA CRISTIANA</span>
            </div>

            <h1 className="hero-title">
              DESPIERTA <br />
              <span className="text-fire">UPPER ROOM IBC</span>
            </h1>

            <p className="hero-subtitle">
              «La llama vuelve a encenderse». Un llamado a levantarnos en la suficiencia de Cristo, arraigados en las Escrituras y unidos en una misma fe reformada.
            </p>

            {/* Poster image — clickable to open details */}
            <div 
              className="hero-poster-inline"
              onClick={() => setIsDetailsOpen(true)}
              role="button"
              tabIndex={0}
              title="Haz clic para ver detalles de la conferencia"
            >
              <div className="poster-glow-backdrop"></div>
              <img 
                src={`${import.meta.env.BASE_URL}logos/logo-despierta.png`} 
                alt="Afiche Oficial Conferencia Despierta 2026 - Upper Room IBC" 
                className="hero-poster-inline-img" 
              />
            </div>

            {/* Event Quick Specs */}
            <div className="hero-quick-specs">
              <div className="quick-spec-item">
                <span className="quick-spec-tag">FECHA</span>
                <strong>Sábado 31 Octubre</strong>
              </div>
              <div className="quick-spec-divider"></div>
              <div className="quick-spec-item">
                <span className="quick-spec-tag">HORA</span>
                <strong>02:00 PM – 08:00 PM</strong>
              </div>
              <div className="quick-spec-divider"></div>
              <div className="quick-spec-item">
                <span className="quick-spec-tag">SEDE</span>
                <strong>Auditorio IBC</strong>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="hero-countdown-wrap">
              <CountdownTimer targetDate="2026-10-31T14:00:00" />
            </div>

            {/* Hero CTAs */}
            <div className="hero-actions">
              <Link to="/registro" className="btn btn-primary hero-btn-main">
                <Ticket size={16} />
                <span>Registrarme</span>
              </Link>
              <button 
                type="button" 
                className="btn btn-secondary hero-btn-sub"
                onClick={() => setIsDetailsOpen(true)}
              >
                <Clock size={16} />
                <span>Ver Cronograma Oficial</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Pilares de la Conferencia (Architectural Grid) */}
      <section className="pillars-section section-padding">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">FUNDAMENTOS DEL ENCUENTRO</span>
            <h2>Pilares de la Conferencia</h2>
            <p>Una experiencia diseñada para edificar, avivar y unir a la juventud cristiana con solidez bíblica</p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card glass-panel">
              <div className="pillar-card-header">
                <span className="pillar-num">01</span>
                <BookOpen size={20} className="pillar-icon" />
              </div>
              <h3>Sana Doctrina</h3>
              <p>Plenarias expositivas centradas en la gloria de Dios, la suficiencia de la gracia y las verdades eternas del Evangelio.</p>
            </div>

            <div className="pillar-card glass-panel">
              <div className="pillar-card-header">
                <span className="pillar-num">02</span>
                <Music size={20} className="pillar-icon" />
              </div>
              <h3>Adoración Bíblica</h3>
              <p>Alabanza congregacional cristocéntrica, himnos de peso doctrinal y música con reverencia y pasión espiritual.</p>
            </div>

            <div className="pillar-card glass-panel">
              <div className="pillar-card-header">
                <span className="pillar-num">03</span>
                <Users size={20} className="pillar-icon" />
              </div>
              <h3>Talleres Prácticos</h3>
              <p>Sesiones simultáneas con expositores bíblicos respondiendo a las preguntas reales y desafíos del cristiano joven hoy.</p>
            </div>

            <div className="pillar-card glass-panel">
              <div className="pillar-card-header">
                <span className="pillar-num">04</span>
                <Flame size={20} className="pillar-icon" />
              </div>
              <h3>Comunión y Fe</h3>
              <p>Espacio de comunión fraternal entre delegaciones y jóvenes de iglesias hermanas de toda la República Dominicana.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Expositores, Talleres & Worship Night Section */}
      <section className="expositores-section section-padding" id="expositores">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">PALABRA Y ADORACIÓN</span>
            <h2>Expositores y Programa</h2>
            <p>Conoce a los siervos de Dios que estarán guiando las plenarias, talleres simultáneos y la noche de adoración</p>
          </div>

          {/* Selector Dinámico de Secciones */}
          <div className="expositores-filter-nav">
            <button 
              type="button" 
              className={`filter-nav-btn ${activeFilter === 'todos' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('todos')}
            >
              <span>Todos los Bloques</span>
            </button>
            <button 
              type="button" 
              className={`filter-nav-btn ${activeFilter === 'plenarias' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('plenarias')}
            >
              <Flame size={14} />
              <span>Plenarias</span>
            </button>
            <button 
              type="button" 
              className={`filter-nav-btn ${activeFilter === 'talleres' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('talleres')}
            >
              <BookOpen size={14} />
              <span>3 Talleres</span>
            </button>
            <button 
              type="button" 
              className={`filter-nav-btn ${activeFilter === 'worship' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('worship')}
            >
              <Sparkles size={14} />
              <span>Worship Night</span>
            </button>
          </div>

          {/* Bloque 1: Plenarias Generales */}
          {(activeFilter === 'todos' || activeFilter === 'plenarias') && (
            <div className="plenaria-feature-wrapper">
              <div className="plenaria-feature-card glass-panel">
                <div 
                  className="plenaria-poster-side"
                  onClick={() => setLightboxIndex(0)}
                  role="button"
                  tabIndex={0}
                  title="Afiche Humberto Méndez"
                >
                  <div className="poster-zoom-hint" aria-hidden="true">
                    <Maximize2 size={16} />
                  </div>
                  <img 
                    src={`${import.meta.env.BASE_URL}expositores/humberto-mendez.jpeg`} 
                    alt="Afiche Humberto Méndez - Expositor Plenarias" 
                    className="plenaria-poster-img"
                  />
                </div>

                <div className="plenaria-info-side">
                  <div className="badge badge-amber badge-glow">
                    <Flame size={14} />
                    <span>EXPOSITOR DE PLENARIAS</span>
                  </div>
                  
                  <h3 className="plenaria-speaker-name">Humberto Méndez</h3>
                  <span className="plenaria-speaker-church">Pastor en Iglesia Cristiana Oasis</span>

                  <p className="plenaria-desc">
                    Nos acompañará en las dos plenarias centrales de la conferencia, llamándonos con fidelidad bíblica a despertar del letargo espiritual y reenfocar nuestras vidas en la supremacía y suficiencia de Jesucristo.
                  </p>

                  <div className="plenaria-sessions-box">
                    <span className="sessions-box-title">SESIONES DE PLENARIA A SU CARGO:</span>
                    <div className="plenaria-sessions-list">
                      <div className="plenaria-session-item">
                        <div className="session-dot"></div>
                        <div className="session-content">
                          <strong>Predicación 1: ¿Por qué te duermes?</strong>
                          <span className="session-time"><Clock size={12} /> 03:30 PM – 04:00 PM</span>
                        </div>
                      </div>
                      <div className="plenaria-session-item">
                        <div className="session-dot"></div>
                        <div className="session-content">
                          <strong>Predicación 2: Dios te llama a despertar</strong>
                          <span className="session-time"><Clock size={12} /> 04:30 PM – 05:00 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="plenaria-actions">
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsDetailsOpen(true)}
                    >
                      <Clock size={15} />
                      <span>Ver en Cronograma</span>
                    </button>
                    <Link to="/registro" className="btn btn-secondary btn-sm">
                      <Ticket size={15} />
                      <span>Registrarme</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bloque 2: Talleres Simultáneos */}
          {(activeFilter === 'todos' || activeFilter === 'talleres') && (
            <div className="talleres-block-wrapper">
              <div className="talleres-block-header">
                <div className="talleres-header-text">
                  <div className="badge badge-blue">
                    <BookOpen size={13} />
                    <span>SESIONES PARALELAS • 05:20 PM</span>
                  </div>
                  <h3>3 Talleres Bíblicos y Prácticos</h3>
                  <p>
                    Espacios simultáneos donde abordamos las preguntas y luchas cotidianas del joven cristiano. 
                    Selecciona tu taller preferido al momento de registrarte.
                  </p>
                </div>
                <Link to="/registro" className="btn btn-secondary btn-sm link-to-reg">
                  <Ticket size={14} />
                  <span>Elegir Taller en Registro</span>
                </Link>
              </div>

              <div className="talleres-cards-grid">
                {/* Taller 1 */}
                <div className="taller-card-item glass-panel card-rojo">
                  <div 
                    className="taller-card-poster"
                    onClick={() => setLightboxIndex(1)}
                    role="button"
                    tabIndex={0}
                    title="Afiche Natali de Ruiz"
                  >
                    <img 
                      src={`${import.meta.env.BASE_URL}expositores/natali-ruiz.jpeg`} 
                      alt="Afiche Natali de Ruiz - ¿Dónde quedó el fuego?" 
                      className="taller-poster-img"
                    />
                    <div className="taller-poster-overlay">
                      <Maximize2 size={18} />
                    </div>
                  </div>

                  <div className="taller-card-body">
                    <div className="taller-header-row">
                      <span className="taller-tag-badge tag-rojo">TALLER 01 • ROJO</span>
                      <span className="taller-time-chip"><Clock size={12} /> 5:20 PM</span>
                    </div>

                    <h4 className="taller-card-title">¿Dónde quedó el fuego?</h4>
                    <div className="taller-speaker-row">
                      <span className="taller-speaker-label">Expositora:</span>
                      <strong className="taller-speaker-val">Natali de Ruiz</strong>
                    </div>

                    <div className="taller-focus-pill">
                      <span>Enfoque: Estancamiento espiritual</span>
                    </div>

                    <p className="taller-card-question">"¿En qué momento dejé de buscar a Dios?"</p>
                    <p className="taller-card-summary">
                      Un espacio para identificar las causas del enfriamiento espiritual y reavivar la pasión por Cristo volviendo al primer amor.
                    </p>

                    <div className="taller-card-footer">
                      <span className="taller-status-available">Sesión Paralela</span>
                      <Link to="/registro" className="taller-btn-enroll">
                        <span>Elegir Taller</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Taller 2 */}
                <div className="taller-card-item glass-panel card-azul">
                  <div 
                    className="taller-card-poster"
                    onClick={() => setLightboxIndex(2)}
                    role="button"
                    tabIndex={0}
                    title="Afiche Ps. Pedro da Cuhna"
                  >
                    <img 
                      src={`${import.meta.env.BASE_URL}expositores/pedro-dacuhna.jpeg`} 
                      alt="Afiche Ps. Pedro da Cuhna - Modo Automático" 
                      className="taller-poster-img"
                    />
                    <div className="taller-poster-overlay">
                      <Maximize2 size={18} />
                    </div>
                  </div>

                  <div className="taller-card-body">
                    <div className="taller-header-row">
                      <span className="taller-tag-badge tag-azul">TALLER 02 • AZUL</span>
                      <span className="taller-time-chip"><Clock size={12} /> 5:20 PM</span>
                    </div>

                    <h4 className="taller-card-title">Modo Automático</h4>
                    <div className="taller-speaker-row">
                      <span className="taller-speaker-label">Expositor:</span>
                      <strong className="taller-speaker-val">Ps. Pedro da Cuhna</strong>
                      <span className="taller-church-sub">Pastor IBC</span>
                    </div>

                    <div className="taller-focus-pill">
                      <span>Enfoque: Rutina y distracciones</span>
                    </div>

                    <p className="taller-card-question">"¿Estoy siguiendo a Jesús o simplemente cumpliendo una rutina?"</p>
                    <p className="taller-card-summary">
                      Aprende a discernir la religiosidad mecánica de la verdadera devoción y rompe con la monotonía en tu caminar diario.
                    </p>

                    <div className="taller-card-footer">
                      <span className="taller-status-available">Sesión Paralela</span>
                      <Link to="/registro" className="taller-btn-enroll">
                        <span>Elegir Taller</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Taller 3 */}
                <div className="taller-card-item glass-panel card-verde">
                  <div 
                    className="taller-card-poster"
                    onClick={() => setLightboxIndex(3)}
                    role="button"
                    tabIndex={0}
                    title="Afiche Andy Tejada"
                  >
                    <img 
                      src={`${import.meta.env.BASE_URL}expositores/andy-tejada.jpeg`} 
                      alt="Afiche Andy Tejada - ¿Y ahora qué hago?" 
                      className="taller-poster-img"
                    />
                    <div className="taller-poster-overlay">
                      <Maximize2 size={18} />
                    </div>
                  </div>

                  <div className="taller-card-body">
                    <div className="taller-header-row">
                      <span className="taller-tag-badge tag-verde">TALLER 03 • VERDE</span>
                      <span className="taller-time-chip"><Clock size={12} /> 5:20 PM</span>
                    </div>

                    <h4 className="taller-card-title">¿Y ahora qué hago?</h4>
                    <div className="taller-speaker-row">
                      <span className="taller-speaker-label">Expositor:</span>
                      <strong className="taller-speaker-val">Andy Tejada</strong>
                    </div>

                    <div className="taller-focus-pill">
                      <span>Enfoque: Propósito y llamado</span>
                    </div>

                    <p className="taller-card-question">"¿Qué está impidiendo que responda al llamado de Dios?"</p>
                    <p className="taller-card-summary">
                      Un taller práctico sobre cómo discernir y responder con convicción al propósito de Dios en tu vida venciendo miedos y dudas.
                    </p>

                    <div className="taller-card-footer">
                      <span className="taller-status-available">Sesión Paralela</span>
                      <Link to="/registro" className="taller-btn-enroll">
                        <span>Elegir Taller</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Indicador de Transición / Flujo hacia Worship Night */}
          {activeFilter === 'todos' && (
            <div className="conference-flow-connector">
              <div className="flow-line"></div>
              <div className="flow-badge">
                <Sparkles size={14} />
                <span>AL FINALIZAR LOS TALLERES Y EL PANEL PASTORAL</span>
              </div>
              <div className="flow-line"></div>
            </div>
          )}

          {/* Bloque 3: Gran Cierre — Worship Night */}
          {(activeFilter === 'todos' || activeFilter === 'worship') && (
            <div className="worship-feature-wrapper">
              <div className="worship-feature-card glass-panel">
                <div 
                  className="worship-poster-col"
                  onClick={() => setLightboxIndex(4)}
                  role="button"
                  tabIndex={0}
                  title="Afiche Oficial Worship Night"
                >
                  <div className="worship-poster-glow"></div>
                  <div className="poster-zoom-hint" aria-hidden="true">
                    <Maximize2 size={16} />
                  </div>
                  <img 
                    src={`${import.meta.env.BASE_URL}worship/worship-night.jpeg`} 
                    alt="Afiche Oficial Noche de Adoración - Worship Night Conferencia Despierta 2026" 
                    className="worship-poster-img"
                  />
                </div>

                <div className="worship-info-col">
                  <div className="worship-highlight-tag">
                    <Sparkles size={14} />
                    <span>GRAN CIERRE • NOCHE DE ADORACIÓN</span>
                  </div>

                  <h3 className="worship-title">Worship Night</h3>
                  <h4 className="worship-subtitle">Adoración y Acción de Gracias</h4>

                  {/* Aclaratoria: actividad oficial de culminación */}
                  <div className="worship-integration-notice">
                    <div className="notice-icon-box">
                      <CheckCircle size={18} />
                    </div>
                    <div className="notice-text">
                      <strong>Actividad oficial de culminación</strong>
                      <p>
                        Worship Night se celebrará al finalizar la conferencia, reuniendo a todos los jóvenes en una sola voz de adoración y acción de gracias.
                      </p>
                    </div>
                  </div>

                  <p className="worship-description">
                    Será el broche de oro de la Conferencia Despierta: un tiempo íntimo y conmovedor de adoración congregacional con alabanzas cristocéntricas, clamor e intercesión unánime por nuestra generación.
                  </p>

                  <div className="worship-specs-grid">
                    <div className="worship-spec-item">
                      <Clock size={16} className="spec-icon" />
                      <div>
                        <span className="spec-label">HORARIO</span>
                        <strong>07:00 PM – 08:00 PM</strong>
                      </div>
                    </div>
                    <div className="worship-spec-item">
                      <MapPin size={16} className="spec-icon" />
                      <div>
                        <span className="spec-label">LUGAR</span>
                        <strong>Auditorio IBC</strong>
                      </div>
                    </div>
                    <div className="worship-spec-item">
                      <Music size={16} className="spec-icon" />
                      <div>
                        <span className="spec-label">EXPERIENCIA</span>
                        <strong>Alabanza & Gratitud</strong>
                      </div>
                    </div>
                    <div className="worship-spec-item">
                      <Sparkles size={16} className="spec-icon" />
                      <div>
                        <span className="spec-label">CULMINACIÓN</span>
                        <strong>Al finalizar la conferencia</strong>
                      </div>
                    </div>
                  </div>

                  <div className="worship-actions">
                    <Link to="/registro" className="btn btn-primary">
                      <Ticket size={16} />
                      <span>Registrarme a la Conferencia</span>
                    </Link>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setIsDetailsOpen(true)}
                    >
                      <Clock size={16} />
                      <span>Ver Cronograma Oficial</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Merch Banner Promo */}
      <section className="merch-banner-section">
        <div className="container">
          <div className="merch-promo-banner glass-panel">
            <div className="merch-promo-content">
              <div className="badge badge-amber">
                <Clock size={13} />
                <span>DISPONIBLE PRÓXIMAMENTE</span>
              </div>
              <h2>Colección Oficial <span className="text-fire">Upper Room IBC</span></h2>
              <p>
                Próximamente disponible. Diseñada con materiales premium, corte oversize moderno y detalles exclusivos del ministerio. 
                Explora los modelos y prepárate para la apertura de la preventa oficial.
              </p>
              <div className="merch-promo-features">
                <div className="promo-pill"><Clock size={15} /> Lanzamiento Próximo</div>
                <div className="promo-pill"><CheckCircle size={15} /> Algodón Pesado 100%</div>
                <div className="promo-pill"><CheckCircle size={15} /> Tallas XS hasta XXL</div>
              </div>
              <Link to="/merch" className="btn btn-primary">
                <ShoppingBag size={18} />
                <span>Ver Colección (Próximamente)</span>
              </Link>
            </div>

            <div className="merch-promo-visual">
              <div className="merch-badge-circle">
                <span>PRÓX</span>
                <strong>2026</strong>
              </div>
              <div className="merch-mockup-stack">
                <div className="mockup-card card-hoodie">
                  <Flame size={44} className="mockup-icon" />
                  <span>Hoodie Obsidian</span>
                  <strong>Próximamente</strong>
                </div>
                <div className="mockup-card card-tee">
                  <Sparkles size={36} className="mockup-icon" />
                  <span>T-Shirt Flame</span>
                  <strong>Próximamente</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Location CTA Banner */}
      <section className="location-section">
        <div className="container">
          <div className="location-card glass-panel">
            <div className="location-info">
              <span className="section-tag">Lugar del Evento</span>
              <h2>Auditorio Principal IBC</h2>
              <p>
                C. Juan Luis Franco Bidó 25, Santo Domingo, República Dominicana.
                Instalaciones climatizadas, sonido de alta fidelidad y estacionamiento vigilado.
              </p>
              <div className="location-actions">
                <a 
                  href="https://maps.app.goo.gl/YFgXjV3nBEFtdBpX7" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary"
                >
                  <MapPin size={18} />
                  <span>Ver Ubicación en Google Maps</span>
                </a>
                <Link to="/registro" className="btn btn-primary">
                  <Ticket size={18} />
                  <span>Reservar Mi Asiento</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
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

export default Home;
