import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, Ticket, 
  Sparkles, CheckCircle, Info,
  BookOpen, Music, Users, MapPin, ShoppingBag
} from 'lucide-react';
import CountdownTimer from '../../components/CountdownTimer';
import EventDetailsModal from '../../components/EventDetailsModal';
import './Home.css';

const Home = () => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
              <span className="hero-slogan">// CONFERENCIA 2026 • SANTO DOMINGO</span>
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
                src="/logos/logo-despierta.png" 
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
                <strong>03:00 PM – 08:30 PM</strong>
              </div>
              <div className="quick-spec-divider"></div>
              <div className="quick-spec-item">
                <span className="quick-spec-tag">SEDE</span>
                <strong>Auditorio IBC</strong>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="hero-countdown-wrap">
              <CountdownTimer targetDate="2026-10-31T15:00:00" />
            </div>

            {/* Hero CTAs */}
            <div className="hero-actions">
              <Link to="/registro" className="btn btn-primary hero-btn-main">
                <Ticket size={18} />
                <span>Emitir Mi Boleto Gratuito</span>
              </Link>
              <button 
                type="button" 
                className="btn btn-secondary hero-btn-sub"
                onClick={() => setIsDetailsOpen(true)}
              >
                <Info size={16} />
                <span>Detalles del Programa</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Pilares de la Conferencia (Architectural Grid) */}
      <section className="pillars-section section-padding">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">// FUNDAMENTOS DEL ENCUENTRO</span>
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

      {/* Merch Banner Promo */}
      <section className="merch-banner-section">
        <div className="container">
          <div className="merch-promo-banner glass-panel">
            <div className="merch-promo-content">
              <div className="badge badge-amber">EDICIÓN LIMITADA</div>
              <h2>Colección Oficial <span className="text-fire">Upper Room IBC</span></h2>
              <p>
                Diseñada con materiales premium, corte oversize moderno y detalles exclusivos del ministerio. 
                Pre-ordena tu sudadera, camiseta o gorra antes de que se agoten las existencias.
              </p>
              <div className="merch-promo-features">
                <div className="promo-pill"><CheckCircle size={15} /> Algodón Pesado 100%</div>
                <div className="promo-pill"><CheckCircle size={15} /> Tallas XS hasta XXL</div>
                <div className="promo-pill"><CheckCircle size={15} /> Entrega directa en el evento</div>
              </div>
              <Link to="/merch" className="btn btn-primary">
                <ShoppingBag size={18} />
                <span>Explorar Tienda y Pre-ordenar</span>
              </Link>
            </div>

            <div className="merch-promo-visual">
              <div className="merch-badge-circle">
                <span>NEW</span>
                <strong>2026</strong>
              </div>
              <div className="merch-mockup-stack">
                <div className="mockup-card card-hoodie">
                  <Flame size={44} className="mockup-icon" />
                  <span>Hoodie Obsidian</span>
                  <strong>RD$ 1,500</strong>
                </div>
                <div className="mockup-card card-tee">
                  <Sparkles size={36} className="mockup-icon" />
                  <span>T-Shirt Flame</span>
                  <strong>RD$ 750</strong>
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
    </div>
  );
};

export default Home;
