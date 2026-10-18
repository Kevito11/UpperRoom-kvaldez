// Centralized Catalog and Utilities for Official UPPER ROOM IBC Merch
export const MERCH_CATALOG = {
  tshirt: {
    id: 'tshirt',
    nombre: 'T-Shirt Despierta 2026',
    precio: 1000,
    badge: '100% ALGODÓN OVERSIZE',
    descripcion: 'Corte oversize contemporáneo de alta caída, tejido 100% algodón peinado y serigrafía exclusiva Upper Room.',
    tallas: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    defaultModelo: 'Cristo Vive en Mí',
    defaultColor: 'Blanco',
    defaultTalla: 'M',
    modelos: [
      {
        nombre: 'Cristo Vive en Mí',
        colores: [
          { nombre: 'Blanco', file: 'T-Shirt - Cristo Vive en Mi - Blanco.png', hex: '#ffffff', border: 'rgba(255,255,255,0.45)' },
          { nombre: 'Crema', file: 'T-Shirt - Cristo Vive en Mi - Crema.png', hex: '#ede6d6', border: 'rgba(255,255,255,0.2)' },
          { nombre: 'Verde', file: 'T-Shirt - Cristo Vive en Mi - Verde.png', hex: '#1c4a27', border: 'rgba(255,255,255,0.1)' }
        ]
      },
      {
        nombre: 'Con Amor Eterno',
        colores: [
          { nombre: 'Negro', file: 'T-shirt - Con Amor Eterno - Negro.png', hex: '#121212', border: 'rgba(255,255,255,0.35)' },
          { nombre: 'Rojo', file: 'T-shirt - Con Amor Eterno - Rojo.png', hex: '#881313', border: 'rgba(255,255,255,0.15)' }
        ]
      },
      {
        nombre: '3.16',
        colores: [
          { nombre: 'Blanco', file: 'T-Shirt - 3.16 Blanco.png', hex: '#ffffff', border: 'rgba(255,255,255,0.45)' }
        ]
      }
    ]
  },
  hoodie: {
    id: 'hoodie',
    nombre: 'Hoodie Despierta 2026',
    precio: 1400,
    badge: 'EDICIÓN OFICIAL',
    descripcion: 'Sudadera con capucha ajustable, forro térmico suave, bolsillo canguro y acabados elásticos en puños y pretina.',
    tallas: ['S', 'M', 'L', 'XL', '2XL'],
    defaultModelo: 'Chosen',
    defaultColor: 'Negro',
    defaultTalla: 'M',
    modelos: [
      {
        nombre: 'Chosen',
        colores: [
          { nombre: 'Negro', file: 'Hoddie - Chosen Negro.png', hex: '#121212', border: 'rgba(255,255,255,0.35)' },
          { nombre: 'Blanco', file: 'Hoodie - Chosen Blanco.png', hex: '#ffffff', border: 'rgba(255,255,255,0.45)' }
        ]
      },
      {
        nombre: 'Con Amor Eterno',
        colores: [
          { nombre: 'Azul', file: 'Hoddie - Con Amor Eterno - Azul.png', hex: '#1d3557', border: 'rgba(255,255,255,0.2)' }
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
    `🎨 *Color:* ${color}\n` +
    `📏 *Talla:* ${talla}\n` +
    `💰 *Precio:* RD$ ${product.precio.toLocaleString()}\n\n` +
    `¿Podrían indicarme los pasos para confirmar mi pedido y realizar el pago? ¡Gracias!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
