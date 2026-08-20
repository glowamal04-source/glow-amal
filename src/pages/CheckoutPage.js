import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useCart } from '../context/CartContext';

function CheckoutPage() {
  const { cartItems, subtotal, shipping, total, clearCart } = useCart();

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    city: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cartItems.length) {
      await Swal.fire({
        icon: 'warning',
        title: 'Panier vide',
        text: 'Le panier est vide.',
        confirmButtonColor: '#b76e79'
      });
      return;
    }

    const confirmOrder = await Swal.fire({
      title: 'Confirmer la commande ?',
      text: 'Voulez-vous vraiment valider cette commande ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#b76e79',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler'
    });

    if (!confirmOrder.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          city: form.city,
          address: form.address,
          items: cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            selectedPack: item.selectedPack || ''
          }))
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la commande');
      }

      clearCart();

      await Swal.fire({
        icon: 'success',
        title: 'Commande confirmée',
        text: 'Votre commande a été enregistrée avec succès !',
        confirmButtonColor: '#b76e79'
      });

      window.location.href = '/';
    } catch (error) {
      console.error(error);

      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Erreur lors de la commande',
        confirmButtonColor: '#b76e79'
      });
    }

    setLoading(false);
  };

  return (
    <section className="section">
      <div className="container small-container">
        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="eyebrow">Commande</p>
          <h1>Finaliser votre commande</h1>

          <div className="form-group">
            <label>Nom complet</label>
            <input
              type="text"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Téléphone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Ville</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Adresse</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="summary-box" style={{ marginTop: '20px' }}>
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
          </div>

          <button className="primary-btn full-btn" disabled={loading}>
            {loading ? 'Confirmation...' : 'Confirmer la commande'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default CheckoutPage;
