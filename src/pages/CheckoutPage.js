import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useCart } from '../context/CartContext';
import { doc, getDoc } from '../storefrontData';
import { db } from '../firebase';

function CheckoutPage() {
  const { cartItems, subtotal, shipping, total, clearCart } = useCart();

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    city: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const discount = Math.round(subtotal * discountPercent) / 100;
  const applyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{1,40}$/.test(code)) { setDiscountPercent(0); setPromoMessage('Code invalide.'); return; }
    try { const snap = await getDoc(doc(db, 'promoCodes', code)); const data = snap.data(); if (!snap.exists() || !data.active || !(data.percentage > 0 && data.percentage <= 100)) { setDiscountPercent(0); setPromoMessage('Code invalide ou expiré.'); return; } setPromoCode(code); setDiscountPercent(Number(data.percentage)); setPromoMessage(`Réduction de ${data.percentage}% appliquée.`); } catch (_) { setPromoMessage('Impossible de vérifier le code.'); setDiscountPercent(0); }
  };

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
        confirmButtonColor: '#d45f86'
      });
      return;
    }

    const confirmOrder = await Swal.fire({
      title: 'Confirmer la commande ?',
      text: 'Voulez-vous vraiment valider cette commande ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d45f86',
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
          promoCode: discountPercent ? promoCode : '',
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
        title: result.preview ? 'Commande de test' : 'Commande confirmée',
        text: result.preview ? 'Simulation uniquement : aucune commande réelle n’a été envoyée.' : 'Votre commande a été enregistrée avec succès !',
        confirmButtonColor: '#d45f86'
      });

      window.location.href = '/';
    } catch (error) {
      console.error(error);

      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Erreur lors de la commande',
        confirmButtonColor: '#d45f86'
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

          <div className="form-group"><label htmlFor="promo-code">Code promo</label><div className="promo-input"><input id="promo-code" value={promoCode} onChange={e => { setPromoCode(e.target.value); setDiscountPercent(0); setPromoMessage(''); }} /><button type="button" className="secondary-btn" onClick={applyPromo}>Appliquer</button></div>{promoMessage && <p role="status">{promoMessage}</p>}</div>
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
              <strong>{(total - discount).toFixed(2)} DH</strong>
            </div>
            {discountPercent > 0 && <div className="summary-line"><span>Réduction ({discountPercent}%)</span><strong>−{discount.toFixed(2)} DH</strong></div>}
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
