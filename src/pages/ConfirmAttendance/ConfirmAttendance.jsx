import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Ticket, Mail, Phone, User, CheckCircle, ArrowRight, Flame, MapPin } from 'lucide-react';
import { findRegistrationsByContact } from '../../lib/ticketStorage';
import './ConfirmAttendance.css';

const ConfirmAttendance = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const found = findRegistrationsByContact(searchQuery);
    setResults(found);
  };

  return (
    <div className="confirm-page section-padding">
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div className="badge badge-amber badge-glow">
            <Search size={14} />
            <span>CONSULTA DE BOLETOS</span>
          </div>
          <h2>Recuperar o Consultar <span className="text-fire">Mi Entrada</span></h2>
          <p>
            ¿Ya te registraste anteriormente? Ingresa tu correo electrónico, número de teléfono o código de ticket para acceder a tu credencial.
          </p>
        </div>

        {/* Search Box */}
        <div className="search-box-wrapper">
          <form onSubmit={handleSearch} className="search-form glass-panel">
            <Search size={22} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por correo, teléfono o código (ej: IBC-UR-...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary search-btn">
              <span>Buscar Boleto</span>
            </button>
          </form>
        </div>

        {/* Results */}
        {results !== null && (
          <div className="search-results-container">
            {results.length > 0 ? (
              <div className="results-grid">
                {results.map((item, idx) => (
                  <div key={idx} className="result-ticket-card glass-panel">
                    <div className="result-card-header">
                      <div className="result-code-tag">
                        <Flame size={14} className="code-flame" />
                        <span>{item.ticketCode}</span>
                      </div>
                      <span className="result-status-badge">Confirmado</span>
                    </div>

                    <div className="result-card-body">
                      <h3>{item.firstName} {item.lastName}</h3>
                      <div className="result-info-line">
                        <MapPin size={14} />
                        <span>{item.church}</span>
                      </div>
                      <div className="result-info-line">
                        <Mail size={14} />
                        <span>{item.email}</span>
                      </div>
                    </div>

                    <div className="result-card-footer">
                      <Link to={`/ticket/${item.ticketCode}`} className="btn btn-primary view-ticket-btn">
                        <Ticket size={16} />
                        <span>Ver Credencial QR</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results-card glass-panel">
                <Ticket size={48} className="no-res-icon" />
                <h3>No encontramos registros coincidentes</h3>
                <p>Verifica que hayas escrito correctamente tu correo o número de teléfono registrado.</p>
                <Link to="/registro" className="btn btn-primary">
                  <span>Registrarme Ahora</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmAttendance;
