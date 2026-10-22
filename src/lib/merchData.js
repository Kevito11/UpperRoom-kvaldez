// Centralized Catalog and Utilities for Official UPPER ROOM IBC Merch
export const MERCH_CATALOG = {
  tshirt: {
    id: 'tshirt',
    nombre: 'T-Shirt Despierta 2026',
    precio: 1400,
    badge: '100% ALGODÓN OVERSIZE',
    descripcion: 'Corte oversize contemporáneo de alta caída, tejido 100% algodón peinado y serigrafía exclusiva Upper Room.',
    tallas: ['S', 'M', 'L', 'XL', '2XL'],
    defaultModelo: 'Cristo Vive en Mí',
    defaultColor: 'Blanco (Letras Gris)',
    defaultTalla: 'M',
    modelos: [
      {
        nombre: 'Cristo Vive en Mí',
        colores: [
          { 
            nombre: 'Blanco (Letras Gris)', 
            file: 'T-Shirt - Cristo Vive en Mi - Blanco-Gris.png', 
            hex: '#ffffff', 
            letterHex: '#64748b', 
            border: 'rgba(255,255,255,0.45)' 
          },
          { 
            nombre: 'Crema (Letras Marrón)', 
            file: 'T-Shirt - Cristo Vive en Mi - Crema-Marron.png', 
            hex: '#ede6d6', 
            letterHex: '#5c3a21', 
            border: 'rgba(255,255,255,0.2)' 
          },
          { 
            nombre: 'Negro (Letras Blanco)', 
            file: 'T-Shirt - Cristo Vive en Mi - Negro-Blanco.png', 
            hex: '#121212', 
            letterHex: '#ffffff', 
            border: 'rgba(255,255,255,0.35)' 
          },
          { 
            nombre: 'Verde (Letras Verde)', 
            file: 'T-Shirt - Cristo Vive en Mi - Verde-Verde.png', 
            hex: '#1c4a27', 
            letterHex: '#4ade80', 
            border: 'rgba(255,255,255,0.2)' 
          }
        ]
      },
      {
        nombre: 'Con Amor Eterno',
        colores: [
          { 
            nombre: 'Blanco (Letras Azul)', 
            file: 'T-shirt - Con Amor Eterno - Blanco-Azul.png', 
            hex: '#ffffff', 
            letterHex: '#1d3557', 
            border: 'rgba(255,255,255,0.45)' 
          },
          { 
            nombre: 'Blanco (Letras Negro)', 
            file: 'T-shirt - Con Amor Eterno - Blanco-Negro.png', 
            hex: '#ffffff', 
            letterHex: '#121212', 
            border: 'rgba(255,255,255,0.45)' 
          },
          { 
            nombre: 'Blanco (Letras Rojo)', 
            file: 'T-shirt - Con Amor Eterno - Blanco-Rojo.png', 
            hex: '#ffffff', 
            letterHex: '#dc2626', 
            border: 'rgba(255,255,255,0.45)' 
          },
          { 
            nombre: 'Negro (Letras Blanco)', 
            file: 'T-shirt - Con Amor Eterno - Negro-Blanco.png', 
            hex: '#121212', 
            letterHex: '#ffffff', 
            border: 'rgba(255,255,255,0.35)' 
          }
        ]
      },
      {
        nombre: '3.16',
        colores: [
          { 
            nombre: 'Blanco (Letras Rojo)', 
            file: 'T-Shirt - 3.16 Blanco-Rojo.png', 
            hex: '#ffffff', 
            letterHex: '#dc2626', 
            border: 'rgba(255,255,255,0.45)' 
          },
          { 
            nombre: 'Negro (Letras Blanco)', 
            file: 'T-Shirt - 3.16 Negro-Blanco.png', 
            hex: '#121212', 
            letterHex: '#ffffff', 
            border: 'rgba(255,255,255,0.35)' 
          }
        ]
      }
    ]
  },
  hoodie: {
    id: 'hoodie',
    nombre: 'Hoodie Despierta 2026',
    precio: 1800,
    badge: 'EDICIÓN OFICIAL',
    descripcion: 'Sudadera con capucha ajustable, forro térmico suave, bolsillo canguro y acabados elásticos en puños y pretina.',
    tallas: ['S', 'M', 'L', 'XL', '2XL'],
    defaultModelo: 'Chosen',
    defaultColor: 'Negro (Letras Blanco)',
    defaultTalla: 'M',
    modelos: [
      {
        nombre: 'Chosen',
        colores: [
          { 
            nombre: 'Negro (Letras Blanco)', 
            file: 'Hoddie - Chosen Negro-Blanco.png', 
            hex: '#121212', 
            letterHex: '#ffffff', 
            border: 'rgba(255,255,255,0.35)' 
          },
          { 
            nombre: 'Blanco (Letras Gris)', 
            file: 'Hoodie - Chosen Blanco-Gris.png', 
            hex: '#ffffff', 
            letterHex: '#64748b', 
            border: 'rgba(255,255,255,0.45)' 
          }
        ]
      }
    ]
  }
};

/**
 * Resolves the absolute browser URL for a merch garment based on type, model, and color.
 */
export const getMerchImagePath = (type, modeloNombre, colorNombre) => {
  const cat = MERCH_CATALOG[type];
  if (!cat) return '';
  const mod = cat.modelos.find(m => m.nombre === modeloNombre) || cat.modelos[0];
  const col = mod?.colores.find(c => c.nombre === colorNombre) || mod?.colores[0];
  if (!col) return '';
  return `${import.meta.env.BASE_URL}assets/merch/${encodeURIComponent(col.file)}`;
};

/**
 * Generates an encoded WhatsApp link to order a specific piece of merch.
 */
export const getMerchWhatsAppUrl = ({ product, modelo, color, talla, phone = '18095550199' }) => {
  const message = `¡Hola Upper Room IBC! 👋\n` +
    `Deseo ordenar la siguiente prenda oficial de la *Conferencia Despierta 2026*:\n\n` +
    `🏷️ *Prenda:* ${product.nombre}\n` +
    `✨ *Diseño / Modelo:* ${modelo}\n` +
    `🎨 *Color / Letras:* ${color}\n` +
    `📏 *Talla:* ${talla}\n` +
    `💰 *Precio:* RD$ ${product.precio.toLocaleString()}\n\n` +
    `¿Podrían indicarme los pasos para confirmar mi pedido y realizar el pago? ¡Gracias!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
