import { useState } from 'react';
import { ShoppingBag, Sparkles, Flame, CheckCircle, Info, ArrowRight, Eye, Ticket } from 'lucide-react';
import MerchModal from '../../components/MerchModal';
import MerchVectorGraphic from '../../components/MerchVectorGraphic';
import './Merch.css';

const MERCH_PRODUCTS = [
  {
    id: 'hoodie-aposento',
    name: 'Hoodie "Upper Room Flame" (Oversize)',
    category: 'hoodies',
    price: 1500,
    description: 'Sudadera pesada de algodón prémium con capucha reforzada. Detalle de llama bordada en el pecho y tipografía oficial "Upper Room IBC".',
    colors: ['Negro Obsidian', 'Crema Vintage', 'Gris Carbón'],
    colorHex: {
      'Negro Obsidian': '#0b0f17',
      'Crema Vintage': '#e2d9cc',
      'Gris Carbón': '#475569'
    },
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 'tee-avivados',
    name: 'T-Shirt Oficial "Avivados 2026"',
    category: 'tshirts',
    price: 750,
    description: 'Camiseta corte boxy fit en algodón peinado 240 GSM. Diseño serigrafiado en tinta relieve de alta durabilidad con el lema de la conferencia.',
    colors: ['Negro Obsidian', 'Blanco Puro', 'Terracota / Ámbar'],
    colorHex: {
      'Negro Obsidian': '#0b0f17',
      'Blanco Puro': '#ffffff',
      'Terracota / Ámbar': '#c2410c'
    },
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 'cap-upper-room',
    name: 'Gorra "Upper Room" Dad Cap',
    category: 'caps',
    price: 650,
    description: 'Gorra curva estilo vintage con hebilla metálica ajustable y logo 3D bordado al frente. 100% algodón sarga lavado.',
    colors: ['Negro', 'Beige Arena'],
    colorHex: {
      'Negro': '#111827',
      'Beige Arena': '#d6c7b2'
    },
    sizes: ['Ajustable']
  }
];

const Merch = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [activeProductColors, setActiveProductColors] = useState({});

  const categories = [
    { id: 'all', label: 'Todo el Merch' },
    { id: 'hoodies', label: 'Hoodies' },
    { id: 'tshirts', label: 'T-Shirts' },
    { id: 'caps', label: 'Gorras' }
  ];

  const handleColorChange = (productId, color) => {
    setActiveProductColors(prev => ({
      ...prev,
      [productId]: color
    }));
  };

  const filteredProducts = selectedCategory === 'all' 
    ? MERCH_PRODUCTS 
    : MERCH_PRODUCTS.filter(p => p.category === selectedCategory);

  return (
    <div className="merch-page section-padding">
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div className="badge badge-amber badge-glow">
            <Sparkles size={14} />
            <span>COLECCIÓN OFICIAL 2026</span>
          </div>
          <h2>Merch <span className="text-fire">Upper Room IBC</span></h2>
          <p>
            Viste la identidad de nuestro ministerio de jóvenes. Cada prenda está confeccionada con los más altos estándares de calidad.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="merch-filter-bar">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="merch-grid">
          {filteredProducts.map(product => {
            const currentColor = activeProductColors[product.id] || product.colors[0];
            const hex = product.colorHex?.[currentColor] || '#0b0f17';

            return (
              <div key={product.id} className="product-card glass-panel">
                <div className="product-img-box" onClick={() => setSelectedProductForModal(product)}>
                  <MerchVectorGraphic 
                    type={product.category} 
                    colorHex={hex} 
                    colorName={currentColor} 
                    size={200} 
                  />
                  <div className="product-overlay-badge">
                    <Eye size={16} />
                    <span>Ver Prenda</span>
                  </div>
                </div>

                <div className="product-details">
                  <div className="product-header-row">
                    <span className="product-cat-tag">{product.category.toUpperCase()}</span>
                    <span className="product-price-tag">RD$ {product.price.toLocaleString()}</span>
                  </div>

                  <h3 className="product-name" onClick={() => setSelectedProductForModal(product)}>
                    {product.name}
                  </h3>

                  <p className="product-brief">{product.description}</p>

                  {/* Color selector mini */}
                  <div className="mini-color-row">
                    <span className="mini-color-label">Color:</span>
                    <div className="mini-swatches">
                      {product.colors.map(color => {
                        const isSelected = currentColor === color;
                        const cHex = product.colorHex?.[color] || '#333';
                        return (
                          <button
                            key={color}
                            className={`mini-swatch ${isSelected ? 'selected' : ''}`}
                            style={{ backgroundColor: cHex }}
                            onClick={() => handleColorChange(product.id, color)}
                            title={color}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    className="btn btn-primary product-preorder-btn"
                    onClick={() => setSelectedProductForModal(product)}
                  >
                    <ShoppingBag size={17} />
                    <span>Pre-ordenar Prenda</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Merch Logistics Notice */}
        <div className="merch-notice-card glass-panel">
          <div className="notice-icon-box">
            <Info size={24} className="notice-icon" />
          </div>
          <div className="notice-text">
            <h4>Los pedidos se realizan en el Registro</h4>
            <p>
              Para pre-ordenar tu merch debes completar el <strong>formulario de registro</strong> de la conferencia.
              Las prendas serán entregadas el día del evento (31 de Octubre, 2026) en la mesa de recepción oficial.
              Aceptamos transferencias bancarias y pago en efectivo el día del evento.
            </p>
            <a href="/registro" className="btn btn-primary" style={{marginTop: '0.75rem', display: 'inline-flex'}}>
              <Ticket size={17} />
              <span>Ir al Registro para Pre-ordenar</span>
            </a>
          </div>
        </div>
      </div>

      {/* Merch Detail Modal */}
      {selectedProductForModal && (
        <MerchModal 
          product={selectedProductForModal} 
          onClose={() => setSelectedProductForModal(null)} 
        />
      )}
    </div>
  );
};

export default Merch;
