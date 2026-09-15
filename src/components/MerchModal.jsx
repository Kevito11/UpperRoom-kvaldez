import { useState } from 'react';
import { X, ShoppingBag, Check, Send, Sparkles } from 'lucide-react';
import MerchVectorGraphic from './MerchVectorGraphic';
import './MerchModal.css';

const MerchModal = ({ product, onClose }) => {
  if (!product) return null;

  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes ? product.sizes[0] : '');
  const [quantity, setQuantity] = useState(1);

  const activeColorHex = product.colorHex?.[selectedColor] || '#0b0f17';

  const handleWhatsAppOrder = () => {
    const total = (product.price * quantity).toLocaleString();
    const message = `¡Hola Upper Room IBC! 👋 Deseo pre-ordenar la mercancía oficial de la Conferencia:\n\n` +
      `📌 *Producto:* ${product.name}\n` +
      `🎨 *Color:* ${selectedColor}\n` +
      `📏 *Talla:* ${selectedSize}\n` +
      `🔢 *Cantidad:* ${quantity}\n` +
      `💰 *Total:* RD$ ${total}\n\n` +
      `¿Cuáles son los métodos de pago para completar mi orden? ¡Muchas gracias!`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/18095550199?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="merch-modal-overlay" onClick={onClose}>
      <div className="merch-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
          <X size={22} />
        </button>

        <div className="merch-modal-grid">
          {/* Product Preview Left */}
          <div className="merch-modal-visual">
            <div className="visual-display-box">
              <MerchVectorGraphic 
                type={product.category} 
                colorHex={activeColorHex} 
                colorName={selectedColor} 
                size={260} 
              />
            </div>
            <span className="visual-color-note">Color seleccionado: <strong>{selectedColor}</strong></span>
          </div>

          {/* Product Details & Form Right */}
          <div className="merch-modal-info">
            <div className="product-category-badge">
              <Sparkles size={13} />
              <span>Colección Oficial Upper Room IBC</span>
            </div>

            <h2 className="modal-product-title">{product.name}</h2>
            <div className="modal-product-price">
              RD$ {product.price.toLocaleString()}
            </div>
            <p className="modal-product-desc">{product.description}</p>

            {/* Colors */}
            <div className="modal-section">
              <label className="modal-label">Color: <strong>{selectedColor}</strong></label>
              <div className="color-swatches">
                {product.colors.map((color) => {
                  const hex = product.colorHex?.[color] || '#1e293b';
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      className={`color-swatch-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: hex }}
                      title={color}
                    >
                      {isSelected && <Check size={14} color={hex === '#ffffff' || hex === '#e2d9cc' || hex === '#e7dfd5' ? '#000' : '#fff'} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="modal-section">
                <label className="modal-label">Talla:</label>
                <div className="size-selector">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="modal-section quantity-section">
              <label className="modal-label">Cantidad:</label>
              <div className="quantity-control">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            {/* Total calculation & WhatsApp Action */}
            <div className="modal-footer-action">
              <div className="modal-total-box">
                <span>Total a pagar:</span>
                <strong>RD$ {(product.price * quantity).toLocaleString()}</strong>
              </div>

              <button className="btn btn-primary order-btn" onClick={handleWhatsAppOrder}>
                <Send size={18} />
                <span>Pre-ordenar vía WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchModal;
