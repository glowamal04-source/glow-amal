import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const statuses = ['Nouvelle', 'Confirmée', 'Livrée'];
const phoneHref = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;

function OrderLinkPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get('order');
  const token = params.get('token');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const orderUrl = `/.netlify/functions/order-link?order=${encodeURIComponent(orderId || '')}&token=${encodeURIComponent(token || '')}`;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(orderUrl);
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || 'Lien invalide');
        }

        setOrder(result.order);
      } catch (fetchError) {
        setError(fetchError.message || 'Lien invalide');
      }

      setLoading(false);
    };

    fetchOrder();
  }, [orderUrl]);

  const updateStatus = async (status) => {
    setUpdating(true);

    try {
      const response = await fetch(orderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise a jour');
      }

      setOrder((prev) => ({ ...prev, status }));
      await Swal.fire({
        icon: 'success',
        title: 'Statut mis a jour',
        timer: 1200,
        showConfirmButton: false
      });
    } catch (updateError) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: updateError.message,
        confirmButtonColor: '#b76e79'
      });
    }

    setUpdating(false);
  };

  if (loading) {
    return (
      <section className="section">
        <div className="container small-container">
          <div className="auth-card">
            <p>Chargement de la commande...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section">
        <div className="container small-container">
          <div className="auth-card">
            <p className="eyebrow">Commande</p>
            <h1>Lien invalide</h1>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container small-container">
        <div className="auth-card order-link-card">
          <p className="eyebrow">Nouvelle commande</p>
          <h1>{order.customerName}</h1>
          <p className="order-id-line">Commande: {order.id}</p>

          <div className="summary-box order-link-summary">
            <p>
              <strong>Telephone:</strong>{' '}
              <a className="phone-call-link" href={phoneHref(order.phone)}>
                {order.phone}
              </a>
            </p>
            <p><strong>Ville:</strong> {order.city}</p>
            <p><strong>Adresse:</strong> {order.address}</p>
            <p><strong>Total:</strong> {Number(order.total || 0).toFixed(2)} DH</p>
            <p><strong>Statut:</strong> {order.status}</p>
          </div>

          <ul className="order-link-items">
            {order.items?.map((item, index) => (
              <li key={index}>
                <span>{item.title}</span>
                <strong>x {item.quantity}</strong>
              </li>
            ))}
          </ul>

          <div className="status-buttons order-link-statuses">
            <a className="secondary-btn small-btn phone-action-btn" href={phoneHref(order.phone)}>
              Appeler
            </a>

            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                className={`status-btn ${order.status === status ? 'active-status status-new' : ''}`}
                disabled={updating}
                onClick={() => updateStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrderLinkPage;
