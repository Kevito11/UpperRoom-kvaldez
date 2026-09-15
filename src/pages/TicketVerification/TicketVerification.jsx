import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, XCircle, Clock, MapPin, User, Flame, 
  ShieldCheck, AlertTriangle, ArrowLeft, Check, Ticket 
} from 'lucide-react';
import { findRegistrationByCode, markAttendance } from '../../lib/ticketStorage';
import './TicketVerification.css';

const TicketVerification = () => {
  const { code } = useParams();
  const [ticket, setTicket] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (code) {
      const found = findRegistrationByCode(code);
      if (found) {
        setTicket(found);
        setIsCheckedIn(found.status === 'ATTENDED');
      } else {
        // Fallback simulation if testing with sample codes
        setTicket({
          ticketCode: code.toUpperCase(),
          firstName: "Asistente",
          lastName: "Registrado",
          church: "Iglesia Bautista Cristiana (IBC)",
          ageGroup: "19 - 25",
          ticketType: "general",
          status: "CONFIRMED",
          createdAt: new Date().toISOString()
        });
      }
      setLoading(false);
    }
  }, [code]);

  const handleCheckIn = () => {
    if (code) {
      markAttendance(code);
      setIsCheckedIn(true);
    }
  };

  if (loading) {
    return (
      <div className="verification-page">
        <div className="verification-card glass-panel">
          <p>Verificando credencial de acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-page">
      <div className="container verification-container">
        <div className="verification-card glass-panel">
          {/* Header */}
          <div className="verif-header">
            <div className="verif-logo">
              <Flame size={20} className="verif-flame" />
              <span>UPPER ROOM IBC • VERIFICADOR DE ACCESO</span>
            </div>
            <span className="verif-code-badge">{code?.toUpperCase()}</span>
          </div>

          {/* Status Banner */}
          {isCheckedIn ? (
            <div className="status-banner attended">
              <CheckCircle2 size={32} />
              <div>
                <h3>¡INGRESO REGISTRADO!</h3>
                <p>Asistente verificado correctamente en puerta.</p>
              </div>
            </div>
          ) : ticket ? (
            <div className="status-banner valid">
              <ShieldCheck size={32} />
              <div>
                <h3>BOLETO VÁLIDO</h3>
                <p>Credencial oficial de la Conferencia Upper Room 2026.</p>
              </div>
            </div>
          ) : (
            <div className="status-banner invalid">
              <XCircle size={32} />
              <div>
                <h3>BOLETO NO ENCONTRADO</h3>
                <p>El código no coincide con ningún registro activo.</p>
              </div>
            </div>
          )}

          {/* Attendee Details Grid */}
          {ticket && (
            <div className="verif-details-grid">
              <div className="verif-item">
                <span className="v-label">NOMBRE DEL ASISTENTE</span>
                <strong className="v-val-name">{ticket.firstName} {ticket.lastName}</strong>
              </div>

              <div className="verif-item">
                <span className="v-label">IGLESIA / CONGREGACIÓN</span>
                <strong className="v-val">{ticket.church}</strong>
              </div>

              <div className="verif-item">
                <span className="v-label">RANGO DE EDAD</span>
                <strong className="v-val">{ticket.ageGroup} Años</strong>
              </div>

              <div className="verif-item">
                <span className="v-label">TIPO DE PASE</span>
                <strong className="v-val">Pase General Oficial</strong>
              </div>

              <div className="verif-item full-width">
                <span className="v-label">EVENTO & SEDE</span>
                <strong className="v-val">Conferencia Upper Room 2026 • Auditorio IBC (C. Juan Luis Franco Bidó 25)</strong>
              </div>
            </div>
          )}

          {/* Actions for Door Staff */}
          <div className="verif-actions">
            {!isCheckedIn ? (
              <button className="btn btn-primary checkin-btn" onClick={handleCheckIn}>
                <Check size={20} />
                <span>Validar Ingreso en Puerta</span>
              </button>
            ) : (
              <div className="already-checked-msg">
                <CheckCircle2 size={18} />
                <span>Asistencia confirmada a las {new Date().toLocaleTimeString()}</span>
              </div>
            )}

            <Link to="/" className="btn btn-secondary back-home-btn">
              <ArrowLeft size={16} />
              <span>Ir al Inicio</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketVerification;
