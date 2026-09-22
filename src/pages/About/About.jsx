import { Link } from 'react-router-dom';
import { Flame, Shield, Heart, Users, BookOpen, Compass, Calendar, ArrowRight, MapPin } from 'lucide-react';
import InstagramIcon from '../../components/icons/InstagramIcon';
import './About.css';

const About = () => {
  const pillars = [
    {
      icon: <BookOpen size={24} />,
      title: "Sana Doctrina",
      desc: "Creemos en la inerrancia y suficiencia de las Sagradas Escrituras como la única norma de fe y conducta."
    },
    {
      icon: <Flame size={24} />,
      title: "Vida en el Espíritu",
      desc: "Buscamos ser llenos y guiados por el Espíritu Santo para glorificar a Cristo en toda área de nuestras vidas."
    },
    {
      icon: <Users size={24} />,
      title: "Discipulado y Comunión",
      desc: "Fomentamos relaciones transparentes donde los jóvenes se exhortan, animan y caminan juntos en santidad."
    },
    {
      icon: <Heart size={24} />,
      title: "Pasión por el Evangelio",
      desc: "Proclamamos el evangelio con denuedo en universidades, colegios, lugares de trabajo y misiones."
    }
  ];

  return (
    <div className="about-page section-padding">
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div className="badge badge-amber badge-glow">
            <Flame size={14} />
            <span>NUESTRA IDENTIDAD</span>
          </div>
          <h2>Sobre <span className="text-fire">Upper Room IBC</span></h2>
          <p>
            El ministerio de jóvenes de la Iglesia Bautista Cristiana (IBC), dedicados a exaltar la gloria de Dios a través de vidas transformadas por Su verdad.
          </p>
        </div>

        {/* Hero Concept Card */}
        <div className="about-concept-card glass-panel">
          <div className="concept-text">
            <span className="concept-scripture">Hechos 1:13-14 • Hechos 2:1</span>
            <h2>¿Por qué "Upper Room" (Aposento Alto)?</h2>
            <p>
              El aposento alto fue el lugar donde los discípulos perseveraban unánimes en oración antes de que el poder del Espíritu Santo fuera derramado para proclamar el evangelio con valentía hasta lo último de la tierra.
            </p>
            <p>
              En <strong>Upper Room IBC</strong>, anhelamos que cada joven experimente esa misma convicción: un encuentro vivo con la presencia del Dios Santo, un amor ferviente por Su Palabra y una consagración radical que impacte a nuestra nación.
            </p>
          </div>
          <div className="concept-badge-box">
            <div className="flame-halo">
              <img src={`${import.meta.env.BASE_URL}logos/logo-upperroom-negro.png`} alt="Upper Room Logo" className="concept-logo-img" />
            </div>
            <div className="concept-church-tag">
              <strong>Iglesia Bautista Cristiana (IBC)</strong>
              <span>C. Juan Luis Franco Bidó 25, Santo Domingo</span>
            </div>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="pillars-section">
          <div className="section-header">
            <span className="section-tag">Nuestros Fundamentos</span>
            <h2>Pilares que nos <span className="text-gradient">sostienen</span></h2>
          </div>

          <div className="pillars-grid">
            {pillars.map((pillar, idx) => (
              <div key={idx} className="pillar-card glass-panel">
                <div className="pillar-icon-wrap">
                  {pillar.icon}
                </div>
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Schedule Box */}
        <div className="meetings-box glass-panel">
          <div className="meetings-content">
            <span className="section-tag">Nuestras Reuniones</span>
            <h2>¡Nos encantaría que nos visites!</h2>
            <p>
              Nuestras puertas están abiertas para todos los jóvenes, amigos y visitantes. 
              Tenemos tiempos de alabanza, enseñanza bíblica expositiva y dinámicas de integración.
            </p>
            <div className="meeting-time-pills">
              <div className="time-pill">
                <Calendar size={18} />
                <span>Reuniones de Jóvenes: <strong>Los Sábados</strong> (pendientes a nuestro Instagram para la publicación de cada fecha).</span>
              </div>
              <div className="time-pill">
                <MapPin size={18} />
                <span>Dirección: <strong>C. Juan Luis Franco Bidó 25, Santo Domingo</strong></span>
              </div>
            </div>
            <div className="meeting-actions">
              <Link to="/registro" className="btn btn-primary">
                <span>Registrarme a la Conferencia</span>
                <ArrowRight size={16} />
              </Link>
              <a 
                href="https://maps.app.goo.gl/YFgXjV3nBEFtdBpX7" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary"
              >
                <MapPin size={18} />
                <span>Ver Ubicación en Maps</span>
              </a>
              <a 
                href="https://www.instagram.com/upperroomibcrd/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary"
              >
                <InstagramIcon size={18} />
                <span>@upperroomibcrd</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
