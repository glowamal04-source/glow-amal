import React from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useCart } from '../context/CartContext';

function CartPage() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    shipping,
    total
  } = useCart();

  const handleQtyChange = async (item, value) => {
    const numericValue = Number(value);

    if (!numericValue || numericValue < 1) {
      updateQuantity(item.id, 1);

      await Swal.fire({
        icon: 'warning',
        title: 'Quantité invalide',
        text: 'La quantité minimum est 1.',
        confirmButtonColor: '#d45f86'
      });
      return;
    }

    if (numericValue > item.stock) {
      updateQuantity(item.id, item.stock);

      await Swal.fire({
        icon: 'warning',
        title: 'Stock limité',
        text: `La quantité maximum disponible est ${item.stock}.`,
        confirmButtonColor: '#d45f86'
      });
      return;
    }

    updateQuantity(item.id, numericValue);
  };

  const handleRemove = async (item) => {
    const result = await Swal.fire({
      title: 'Supprimer ce produit ?',
      text: 'Le produit sera retiré du panier.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d45f86',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      removeFromCart(item.id);

      await Swal.fire({
        icon: 'success',
        title: 'Produit supprimé',
        text: 'Le produit a été retiré du panier.',
        timer: 1300,
        showConfirmButton: false
      });
    }
  };

  return (
    <section className="section">
      <div className="container cart-layout">
        <div>
          <h1>Panier</h1>

          {!cartItems.length ? (
            <div className="empty-box">
              <p>Votre panier est vide.</p>
              <Link to="/products" className="primary-btn">
                Voir les produits
              </Link>
            </div>
          ) : (
            <div className="cart-list">
              {cartItems.map((item) => (
                <div className="cart-item" key={item.id}>
                  <img
                    src={item.image || 'https://via.placeholder.com/100'}
                    alt={item.title}
                  />

                  <div className="cart-item-info">
                    <h3>{item.title}</h3>
                    <p>{item.price.toFixed(2)} DH</p>
                    <p className="stock-note">
                      Stock disponible : {item.stock}
                    </p>
                  </div>

                  <input
                    type="number"
                    min="1"
                    max={item.stock}
                    value={item.quantity}
                    aria-label={`Quantité pour ${item.title}`}
                    onChange={(e) => handleQtyChange(item, e.target.value)}
                    className="qty-input"
                  />

                  <button
                    className="danger-btn"
                    onClick={() => handleRemove(item)}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="summary-box">
          <h2>Résumé</h2>

          <div className="summary-line">
            <span>Sous-total</span>
            <strong>{subtotal.toFixed(2)} DH</strong>
          </div>

          <div className="summary-line">
            <span>Livraison</span>
            <strong>{shipping.toFixed(2)} DH</strong>
          </div>

          <div className="summary-line total-line">
            <span>Total</span>
            <strong>{total.toFixed(2)} DH</strong>
          </div>

          <Link to="/checkout" className="primary-btn full-btn">
            Passer la commande
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CartPage;
