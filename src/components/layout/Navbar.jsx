import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, Menu, X, Ticket, ShoppingBag } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open to prevent background glitching
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isOpen ? 'menu-open' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="brand-logo">
          <div className="logo-icon-wrap">
            <img src="/logos/logo-upperroom-negro.png" alt="Upper Room IBC" className="brand-nav-img" />
          </div>
          <div className="brand-text">
            <span className="brand-main">UPPER ROOM</span>
            <span className="brand-sub">IBC • SANTO DOMINGO</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            Inicio
          </Link>
          <Link to="/registro" className={`nav-item ${isActive('/registro') ? 'active' : ''}`}>
            <Ticket size={16} />
            Registro
          </Link>
          <Link to="/merch" className={`nav-item ${isActive('/merch') ? 'active' : ''}`}>
            <ShoppingBag size={16} />
            Merch
          </Link>
        </div>

        {/* Action Button & Instagram */}
        <div className="nav-actions">
          <a 
            href="https://www.instagram.com/upperroomibcrd/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="instagram-nav-btn"
            title="Instagram @upperroomibcrd"
            aria-label="Instagram de Upper Room IBC"
          >
            <InstagramIcon size={20} />
          </a>
          <Link to="/registro" className="btn btn-primary nav-cta">
            <Ticket size={18} />
            <span>Registro Oficial</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button 
            className="mobile-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <div className="mobile-menu-links">
          <Link to="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
            Inicio
          </Link>
          <Link to="/registro" className={`mobile-nav-item ${isActive('/registro') ? 'active' : ''}`}>
            <Ticket size={18} />
            Registro a la Conferencia
          </Link>
          <Link to="/merch" className={`mobile-nav-item ${isActive('/merch') ? 'active' : ''}`}>
            <ShoppingBag size={18} />
            Merch Oficial
          </Link>
          <div className="mobile-divider"></div>
          <Link to="/registro" className="btn btn-primary mobile-cta">
            <Ticket size={20} />
            Registrarme a la Conferencia
          </Link>
          <a 
            href="https://www.instagram.com/upperroomibcrd/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mobile-ig-link"
          >
            <InstagramIcon size={18} />
            <span>Síguenos en @upperroomibcrd</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
