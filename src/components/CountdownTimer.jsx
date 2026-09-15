import { useState, useEffect } from 'react';
import { Clock, Calendar, Sparkles } from 'lucide-react';
import './CountdownTimer.css';

const CountdownTimer = ({ targetDate = "2026-10-31T09:00:00" }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="countdown-container expired glass-panel">
        <Sparkles className="countdown-icon" />
        <span>¡La conferencia está en curso! Bienvenidos a Upper Room IBC</span>
      </div>
    );
  }

  const timeUnits = [
    { label: 'Días', value: timeLeft.days },
    { label: 'Horas', value: timeLeft.hours },
    { label: 'Minutos', value: timeLeft.minutes },
    { label: 'Segundos', value: timeLeft.seconds }
  ];

  return (
    <div className="countdown-wrapper">
      <div className="countdown-header">
        <div className="countdown-tag">
          <Clock size={15} />
          <span>CUENTA REGRESIVA OFICIAL</span>
        </div>
      </div>

      <div className="countdown-grid">
        {timeUnits.map((unit, index) => (
          <div key={index} className="countdown-card glass-panel">
            <div className="countdown-value-box">
              <span className="countdown-number">
                {String(unit.value).padStart(2, '0')}
              </span>
            </div>
            <span className="countdown-label">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
