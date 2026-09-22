import { Link } from 'react-router-dom';
import { Flame, MapPin, ArrowUp } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <img src={`${import.meta.env.BASE_URL}logos/logo-upperroom-negro.png`} alt="Upper Room IBC" className="footer-logo-img" />
              </div>
              <div>
                <h3>UPPER ROOM IBC</h3>
                <span>Ministerio de Jóvenes IBC</span>
              </div>
            </div>
            <p className="footer-desc">
              Un ministerio de jóvenes comprometido con el evangelio de Jesucristo, la sana doctrina y el discipulado bíblico en la Iglesia Bautista Cristiana (IBC).
            </p>
            <div className="footer-socials">
              <a
                href="https://www.instagram.com/upperroomibcrd/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="Instagram de Upper Room IBC"
              >
                <InstagramIcon size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Navegación</h4>
            <ul>
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/registro">Registro de Conferencia</Link></li>
              <li><Link to="/merch">Merch Oficial (Próximamente)</Link></li>
              <li><Link to="/nosotros">Sobre Upper Room</Link></li>
              <li><Link to="/confirmar-asistencia">Consultar Mi Entrada</Link></li>
            </ul>
          </div>


          {/* Location */}
          <div className="footer-col">
            <h4>Sede Principal</h4>
            <ul className="footer-contact-list">
              <li>
                <MapPin size={18} className="contact-icon" />
                <div>
                  <a
                    href="https://maps.app.goo.gl/YFgXjV3nBEFtdBpX7"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Iglesia Bautista Cristiana (IBC) <br />
                    <strong>C. Juan Luis Franco Bidó 25, Santo Domingo</strong>
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Upper Room IBC • Iglesia Bautista Cristiana (IBC). Todos los derechos reservados •</p>
          <button onClick={scrollToTop} className="scroll-top-btn" aria-label="Volver arriba">
            <span>Subir</span>
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
