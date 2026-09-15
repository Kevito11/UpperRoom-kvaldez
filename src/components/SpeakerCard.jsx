import { User, BookOpen, MapPin, Flame } from 'lucide-react';
import './SpeakerCard.css';

const SpeakerCard = ({ speaker }) => {
  return (
    <div className="speaker-card glass-panel">
      <div className="speaker-image-container">
        <div className="speaker-placeholder">
          <div className="speaker-avatar-circle">
            <User size={38} className="speaker-icon" />
          </div>
          <span className="speaker-initials">{speaker.initials || "IBC"}</span>
          <span className="speaker-org-tag">Upper Room IBC</span>
        </div>
        <div className="speaker-role-pill">
          {speaker.role || "Expositor"}
        </div>
      </div>

      <div className="speaker-content">
        <h3 className="speaker-name">{speaker.name}</h3>
        <span className="speaker-title">{speaker.title}</span>
        
        {speaker.topic && (
          <div className="speaker-topic-badge">
            <BookOpen size={14} />
            <span>Tema: {speaker.topic}</span>
          </div>
        )}

        <p className="speaker-bio">{speaker.bio}</p>

        {speaker.church && (
          <div className="speaker-church">
            <MapPin size={13} />
            <span>{speaker.church}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakerCard;
