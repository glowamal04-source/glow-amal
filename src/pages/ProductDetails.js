import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const ref = doc(db, 'products', id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        console.error('Erreur chargement produit:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger cet article.',
          confirmButtonColor: '#b76e79'
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) return <div className="page-center">Chargement...</div>;
  if (!product) return <div className="page-center">Article introuvable.</div>;

  const safeStock = Number(product.stock) || 0;
  const images = product.images || [];
  const hasMultipleImages = images.length > 1;
  const isPack = product.type === 'pack';

  const goPrev = () => {
    setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = () => {
    setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleAdd = async () => {
    if (safeStock < 1) {
      await Swal.fire({
        icon: 'warning',
        title: 'Rupture de stock',
        text: isPack ? 'Ce pack n’est plus disponible.' : 'Ce produit n’est plus disponible.',
        confirmButtonColor: '#b76e79'
      });
      return;
    }

    const safeQty = Math.min(Math.max(1, quantity), safeStock);
    addToCart(product, safeQty);

    await Swal.fire({
      icon: 'success',
      title: isPack ? 'Pack ajouté' : 'Produit ajouté',
      text: isPack ? 'Le pack a été ajouté au panier.' : 'Le produit a été ajouté au panier.',
      confirmButtonColor: '#b76e79',
      timer: 1400,
      showConfirmButton: false
    });
  };

  return (
    <section className="section product-details-section">
      <div className="container details-grid product-details-grid">
        <div className="product-details-gallery">
          <div className="product-details-image-box">
            {hasMultipleImages && (
              <button type="button" className="details-arrow details-arrow-left" onClick={goPrev}>
                ‹
              </button>
            )}

            <img
              src={images[imageIndex] || 'https://via.placeholder.com/900x1100?text=Glow+by+Amal'}
              alt={product.title}
              className="product-details-main-image"
            />

            {hasMultipleImages && (
              <button type="button" className="details-arrow details-arrow-right" onClick={goNext}>
                ›
              </button>
            )}
          </div>

          {hasMultipleImages && (
            <div className="product-details-thumbs">
              {images.map((img, index) => (
                <button
                  type="button"
                  key={index}
                  className={`product-details-thumb ${index === imageIndex ? 'active' : ''}`}
                  onClick={() => setImageIndex(index)}
                >
                  <img src={img} alt={`Image ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="details-box product-details-info">
          <p className="eyebrow">{isPack ? 'Pack' : 'Produit'}</p>
          <h1>{product.title}</h1>

          <p className="details-price">{Number(product.price).toFixed(2)} DH</p>

          <p className={`stock-badge ${safeStock > 0 ? 'in-stock' : 'out-stock'}`}>
            {safeStock > 0 ? `En stock (${safeStock})` : 'Rupture de stock'}
          </p>

          <p className="details-description">{product.description}</p>

          <div className="form-group">
            <label>Quantité</label>

            <div className="qty-control">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={safeStock < 1}
              >
                -
              </button>

              <span className="qty-value">{quantity}</span>

              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity((prev) => Math.min(safeStock, prev + 1))}
                disabled={safeStock < 1}
              >
                +
              </button>
            </div>

            {safeStock > 0 && (
              <small className="stock-note">
                Quantité maximum disponible : {safeStock}
              </small>
            )}
          </div>

          <button className="primary-btn" onClick={handleAdd} disabled={safeStock < 1}>
            Ajouter au panier
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProductDetails;
