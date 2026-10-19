import { useState, useEffect } from 'react';
import './MaintenanceScreen.css';

/**
 * Fecha objetivo del mantenimiento:
 * 20 de Octubre de 2026 a las 03:00 PM (15:00 hrs) hora de República Dominicana (UTC-4 / AST).
 */
const TARGET_MAINTENANCE_DATE = new Date('2026-10-20T15:00:00-04:00').getTime();

// Función auxiliar para calcular el tiempo restante
function calculateTimeRemaining() {
  const now = Date.now();
  const distance = TARGET_MAINTENANCE_DATE - now;

  if (distance <= 0) {
    return {
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  return {
    isExpired: false,
    days,
    hours,
    minutes,
    seconds,
  };
}

export default function MaintenanceScreen() {
  // Inicializamos el estado verificando si aún estamos antes de la fecha objetivo
  const [timeLeft, setTimeLeft] = useState(calculateTimeRemaining);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(() => {
    return Date.now() < TARGET_MAINTENANCE_DATE;
  });

  // Requerimiento 3: Bloqueo de Scroll (document.body.style.overflow = 'hidden')
  useEffect(() => {
    if (!isMaintenanceActive) return;

    // Guardamos el estilo previo para restaurarlo fielmente
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow || '';
    };
  }, [isMaintenanceActive]);

  // Requerimiento 2: Lógica de Cuenta Regresiva y Auto-Desmontaje en tiempo real
  useEffect(() => {
    if (!isMaintenanceActive) return;

    const intervalId = setInterval(() => {
      const remaining = calculateTimeRemaining();

      if (remaining.isExpired) {
        // En el instante exacto en que expira, apagamos el mantenimiento
        setIsMaintenanceActive(false);
        clearInterval(intervalId);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isMaintenanceActive]);

  // Si la fecha fue superada o el mantenimiento terminó, se desmonta del DOM
  if (!isMaintenanceActive) {
    return null;
  }

  // Formateo de 2 dígitos (ej: 09 en lugar de 9)
  const formatNumber = (num) => String(num).padStart(2, '0');

  return (
    <div
      className="maintenance-overlay"
      id="maintenance-screen-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Pantalla de Mantenimiento y Cuenta Regresiva"
    >
      {/* Fondo con resplandor Obsidian Fire (#ea580c) */}
      <div className="maintenance-glow-backdrop" aria-hidden="true" />
      <div className="maintenance-glow-orb-subtle" aria-hidden="true" />
      <div className="maintenance-grid-texture" aria-hidden="true" />

      {/* Tarjeta Central Glassmorphism */}
      <div className="maintenance-card">
        {/* Badge superior con spinner elegante y resplandor activo */}
        <div className="maintenance-status-badge">
          <span className="maintenance-spinner">
            <span className="maintenance-spinner-glow" />
          </span>
          <span>Actualización en Curso</span>
        </div>

        {/* Subtítulo de Marca */}
        <span className="maintenance-brand-tag">UPPER ROOM IBC</span>

        {/* Mensaje Claro y Moderno */}
        <h1 className="maintenance-title">
          Estamos realizando mejoras para la{' '}
          <span className="maintenance-title-highlight">
            Conferencia Despierta 2026
          </span>
        </h1>

        <p className="maintenance-description">
          Estamos afinando los últimos detalles para brindarte la mejor experiencia.
          La plataforma se habilitará automáticamente al completarse la cuenta regresiva.
        </p>

        {/* Cuenta Regresiva en Pantalla Grande */}
        <div className="maintenance-countdown-grid" aria-live="polite">
          <div className="maintenance-timer-slot">
            <span className="maintenance-digit">{formatNumber(timeLeft.days)}</span>
            <span className="maintenance-unit">Días</span>
          </div>

          <div className="maintenance-timer-slot">
            <span className="maintenance-digit">{formatNumber(timeLeft.hours)}</span>
            <span className="maintenance-unit">Horas</span>
          </div>

          <div className="maintenance-timer-slot">
            <span className="maintenance-digit">{formatNumber(timeLeft.minutes)}</span>
            <span className="maintenance-unit">Minutos</span>
          </div>

          <div className="maintenance-timer-slot">
            <span className="maintenance-digit">{formatNumber(timeLeft.seconds)}</span>
            <span className="maintenance-unit">Segundos</span>
          </div>
        </div>

        {/* Pie informativo */}
        <footer className="maintenance-footer-info">
          <span>Apertura programada</span>
          <span className="maintenance-dot-separator" />
          <span>20 Octubre 2026, 03:00 PM AST (Rep. Dominicana)</span>
        </footer>
      </div>
    </div>
  );
}
