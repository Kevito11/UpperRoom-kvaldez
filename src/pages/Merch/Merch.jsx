import { Link } from 'react-router-dom';
import { Clock, Ticket, ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react';
import './Merch.css';

const Merch = () => {
  return (
    <div className="merch-page section-padding">
      <div className="container">
        <div className="merch-coming-soon-wrapper">
          <div className="merch-coming-soon-card glass-panel">
            <div className="merch-cs-badge">
              <Clock size={16} />
              <span>DISPONIBLE PRÓXIMAMENTE</span>
            </div>

            <div className="merch-cs-icon-circle">
              <ShoppingBag size={46} className="merch-cs-icon" />
            </div>

            <h1 className="merch-cs-title">
              Merch Oficial <span className="text-fire">Upper Room IBC</span>
            </h1>

            <p className="merch-cs-lead">
              La colección oficial de prendas y accesorios de la <strong>Conferencia Despierta 2026</strong> estará disponible próximamente.
            </p>

            <div className="merch-cs-desc-box">
              <p>
                Estamos afinando los últimos detalles de confección y diseño. Muy pronto habilitaremos la preventa oficial para que puedas ordenar tu sudadera, camiseta o gorra oficial.
              </p>
            </div>

            <div className="merch-cs-actions">
              <Link to="/registro" className="btn btn-primary">
                <Ticket size={18} />
                <span>Registrarme a la Conferencia</span>
              </Link>
              <Link to="/" className="btn btn-secondary">
                <ArrowLeft size={18} />
                <span>Volver al Inicio</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Merch;
