import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';

// Pages
import Home from './pages/Home/Home';
import Registration from './pages/Registration/Registration';
import Merch from './pages/Merch/Merch';
import About from './pages/About/About';
import TicketVerification from './pages/TicketVerification/TicketVerification';
import ConfirmAttendance from './pages/ConfirmAttendance/ConfirmAttendance';

import './App.css';

function AppContent() {
  const location = useLocation();
  const isTicketVerification = location.pathname.startsWith('/ticket/');

  return (
    <div className="app-container">
      {/* Dynamic Ambient Background Orbs */}
      <div className="bg-ambient-orb bg-orb-1"></div>
      <div className="bg-ambient-orb bg-orb-2"></div>

      {!isTicketVerification && <Navbar />}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/registro" element={<Registration />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/ticket/:code" element={<TicketVerification />} />
          <Route path="/confirmar-asistencia" element={<ConfirmAttendance />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {!isTicketVerification && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
