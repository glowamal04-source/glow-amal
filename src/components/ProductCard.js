import React from 'react';
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  const price = Number(product.price) || 0;
  const oldPrice = Number(product.oldPrice) || 0;
  const hasPromo = oldPrice > price;
  const discount = hasPromo ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
  const isPack = product.type === 'pack';

  return (
    <div className="product-card sahar-product-card">
      <Link to={`/products/${product.id}`} className="sahar-product-image-link">
        {hasPromo && <span className="sahar-discount-badge">-{discount}%</span>}
        {isPack && <span className="sahar-pack-badge">Pack</span>}

        <img
          src={product.images?.[0] || 'https://via.placeholder.com/700x900?text=Glow+AML'}
          alt={product.title}
          className="sahar-product-image"
        />
      </Link>

      <div className="sahar-product-info">
        <p className="sahar-product-brand">{isPack ? 'Pack Glow by Amal' : 'Gloow by Amal'}</p>
        <h3>{product.title}</h3>

        <div className="sahar-price-row">
          <strong>{price.toFixed(2)} DH</strong>
          {hasPromo && <span>{oldPrice.toFixed(2)} DH</span>}
        </div>

        <p className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
          {product.stock > 0 ? 'En stock' : 'Rupture de stock'}
        </p>
      </div>
    </div>
  );
}

export default ProductCard;
