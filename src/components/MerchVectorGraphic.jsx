import { Flame, Sparkles } from 'lucide-react';

export const MerchVectorGraphic = ({ type = 'hoodie', colorHex = '#0b0f17', colorName = '', size = 180 }) => {
  const isLight = colorHex.toLowerCase() === '#ffffff' || colorHex.toLowerCase() === '#e2d9cc' || colorHex.toLowerCase() === '#e7dfd5' || colorHex.toLowerCase() === '#d6c7b2';
  const strokeColor = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)';
  const emblemColor = isLight ? '#f59e0b' : '#fbbf24';
  const textColor = isLight ? '#1e293b' : '#ffffff';

  switch (type) {
    case 'hoodies':
      return (
        <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sleeves */}
          <path d="M40 70 L15 130 L45 142 L65 95 Z" fill={colorHex} stroke={strokeColor} strokeWidth="2" />
          <path d="M160 70 L185 130 L155 142 L135 95 Z" fill={colorHex} stroke={strokeColor} strokeWidth="2" />
          {/* Main Body */}
          <path d="M55 65 L145 65 L150 175 L50 175 Z" fill={colorHex} stroke={strokeColor} strokeWidth="2" rx="4" />
          {/* Kangaroo Pocket */}
          <path d="M68 128 L132 128 L138 165 L62 165 Z" fill="none" stroke={strokeColor} strokeWidth="2" strokeDasharray="3 3" />
          {/* Hood */}
          <path d="M70 65 C70 30, 130 30, 130 65 C120 75, 80 75, 70 65 Z" fill={colorHex} stroke={strokeColor} strokeWidth="2" />
          {/* Drawstrings */}
          <path d="M90 68 L90 92" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
          <path d="M110 68 L110 92" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
          {/* Chest Emblem */}
          <circle cx="100" cy="98" r="16" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
          <path d="M100 88 C97 94, 94 97, 94 102 C94 106, 97 109, 100 109 C103 109, 106 106, 106 102 C106 97, 103 94, 100 88 Z" fill={emblemColor} />
          {/* Hem & Cuffs */}
          <line x1="50" y1="170" x2="150" y2="170" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      );

    case 'tshirts':
      return (
        <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sleeves */}
          <path d="M45 55 L15 95 L40 108 L60 75 Z" fill={colorHex} stroke={strokeColor} strokeWidth="2" />
          <path d="M155 55 L185 95 L160 108 L140 75 Z" fill={colorHex} stroke={strokeColor} strokeWidth="2" />
          {/* Main Body */}
          <path d="M55 52 L145 52 L148 175 L52 175 Z" fill={colorHex} stroke={strokeColor} strokeWidth="2" />
          {/* Collar Neck */}
          <path d="M80 52 C85 68, 115 68, 120 52" fill="none" stroke={strokeColor} strokeWidth="2" />
          {/* Graphic Print */}
          <rect x="75" y="88" width="50" height="32" rx="4" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1" />
          <text x="100" y="103" fill={emblemColor} fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">UPPER ROOM</text>
          <text x="100" y="113" fill={textColor} fontSize="6" textAnchor="middle" fontFamily="sans-serif">AVIVADOS 2026</text>
        </svg>
      );

    case 'caps':
      return (
        <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Crown */}
          <path d="M45 125 C45 60, 155 60, 155 125 Z" fill={colorHex} stroke={strokeColor} strokeWidth="2" />
          {/* Visor / Brim */}
          <path d="M40 125 C40 120, 160 120, 185 145 C150 155, 60 155, 30 142 C35 135, 38 128, 40 125 Z" fill={colorHex} stroke={strokeColor} strokeWidth="2" />
          {/* Button top */}
          <circle cx="100" cy="62" r="5" fill={colorHex} stroke={strokeColor} strokeWidth="1.5" />
          {/* Front Logo */}
          <circle cx="100" cy="98" r="14" fill="rgba(245, 158, 11, 0.2)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
          <text x="100" y="102" fill={emblemColor} fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">IBC</text>
        </svg>
      );

    case 'accessories':
      return (
        <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Handles */}
          <path d="M75 75 C75 35, 125 35, 125 75" fill="none" stroke={strokeColor} strokeWidth="4" />
          {/* Tote Body */}
          <rect x="50" y="75" width="100" height="105" rx="6" fill={colorHex} stroke={strokeColor} strokeWidth="2" />
          {/* Stitching details */}
          <rect x="58" y="83" width="84" height="89" rx="3" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" />
          {/* Front Brand */}
          <circle cx="100" cy="122" r="18" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
          <path d="M100 112 C97 118, 94 121, 94 126 C94 130, 97 133, 100 133 C103 133, 106 130, 106 126 C106 121, 103 118, 100 112 Z" fill={emblemColor} />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="45" y="45" width="110" height="110" rx="12" fill={colorHex} stroke={strokeColor} strokeWidth="2" />
          <circle cx="100" cy="100" r="22" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
          <text x="100" y="105" fill={emblemColor} fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">UR</text>
        </svg>
      );
  }
};

export default MerchVectorGraphic;
