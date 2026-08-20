import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import Swal from 'sweetalert2';

const initialForm = {
  type: 'product',
  title: '',
  description: '',
  price: '',
  stock: '',
  featured: false,
  imageUrls: ''
};

function AdminDashboard() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const ordersRef = useRef(null);
  const orderRefs = useRef({});
  const selectedOrderId = new URLSearchParams(location.search).get('order');

  const fetchProducts = async () => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchOrders = async () => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!selectedOrderId || orders.length === 0) return;

    const selectedOrder = orderRefs.current[selectedOrderId];
    selectedOrder?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [orders, selectedOrderId]);

  const scrollToOrders = () => {
    ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const imageUrls = form.imageUrls
        ? form.imageUrls.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

      const payload = {
        type: form.type === 'pack' ? 'pack' : 'product',
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        featured: form.featured,
        images: imageUrls,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), payload);
      } else {
        await addDoc(collection(db, 'products'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }

      setForm(initialForm);
      setEditingId(null);
      await fetchProducts();

      await Swal.fire({
        icon: 'success',
        title: 'Article enregistré',
        text: 'Le produit ou pack a été sauvegardé avec succès.',
        confirmButtonColor: '#b76e79'
      });
    } catch (error) {
      console.error(error);

      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message,
        confirmButtonColor: '#b76e79'
      });
    }

    setLoading(false);
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      type: product.type === 'pack' ? 'pack' : 'product',
      title: product.title || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      featured: !!product.featured,
      imageUrls: product.images?.join(', ') || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: 'Supprimer cet article ?',
      text: 'Cette action est définitive.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b76e79',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        await fetchProducts();

        await Swal.fire({
          icon: 'success',
          title: 'Article supprimé',
          text: 'La suppression a été effectuée avec succès.',
          confirmButtonColor: '#b76e79'
        });
      } catch (error) {
        console.error(error);

        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message,
          confirmButtonColor: '#b76e79'
        });
      }
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      await fetchOrders();

      await Swal.fire({
        icon: 'success',
        title: 'Statut mis à jour',
        text: `Commande ${status}`,
        timer: 1200,
        showConfirmButton: false
      });
    } catch (error) {
      console.error(error);

      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message,
        confirmButtonColor: '#b76e79'
      });
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Supprimer la commande ?',
      text: 'Cette commande sera supprimée définitivement.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b76e79',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        await fetchOrders();

        await Swal.fire({
          icon: 'success',
          title: 'Commande supprimée',
          text: 'La commande a été supprimée avec succès.',
          confirmButtonColor: '#b76e79'
        });
      } catch (error) {
        console.error(error);

        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message,
          confirmButtonColor: '#b76e79'
        });
      }
    }
  };

  const getStatusClass = (orderStatus, buttonStatus) => {
    if (orderStatus !== buttonStatus) return 'status-btn';

    if (buttonStatus === 'Nouvelle') return 'status-btn status-new active-status';
    if (buttonStatus === 'Confirmée') return 'status-btn status-confirmed active-status';
    if (buttonStatus === 'Livrée') return 'status-btn status-delivered active-status';

    return 'status-btn';
  };

  return (
    <section className="section admin-section">
      <div className="container">
        <div className="page-top admin-page-top">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Administration</h1>
          </div>

          <div className="admin-top-actions">
            <button type="button" className="orders-shortcut-btn" onClick={scrollToOrders}>
              Aller aux commandes
            </button>
          </div>
        </div>

        <div className="admin-grid">
          <form className="admin-form" onSubmit={handleSubmit}>
            <h2>
              {editingId
                ? `Modifier ${form.type === 'pack' ? 'pack' : 'produit'}`
                : `Ajouter ${form.type === 'pack' ? 'pack' : 'produit'}`}
            </h2>

            <div className="form-group">
              <label>Type d'article</label>
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="product">Produit</option>
                <option value="pack">Pack</option>
              </select>
            </div>

            <div className="form-group">
              <label>Titre</label>
              <input name="title" value={form.title} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} required />
            </div>

            <div className="double-grid">
              <div className="form-group">
                <label>Prix</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Stock</label>
                <input type="number" name="stock" value={form.stock} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Images (liens séparés par virgules)</label>
              <textarea
                name="imageUrls"
                value={form.imageUrls}
                onChange={handleChange}
                placeholder="https://image1.jpg, https://image2.jpg, https://image3.jpg"
                rows={4}
              />
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
              />
              Produit ou pack mis en avant
            </label>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Ajouter article'}
            </button>
          </form>

          <div className="admin-panel">
            <h2>Produits et packs</h2>
            <div className="admin-list">
              {products.length === 0 ? (
                <p>Aucun article trouvé.</p>
              ) : (
                products.map((product) => (
                  <div className="admin-item" key={product.id}>
                    <div>
                      <strong>{product.title}</strong>
                      <span className={`admin-type-badge ${product.type === 'pack' ? 'pack' : ''}`}>
                        {product.type === 'pack' ? 'Pack' : 'Produit'}
                      </span>
                      <p>{Number(product.price).toFixed(2)} DH - Stock: {product.stock}</p>
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          style={{
                            width: '70px',
                            height: '70px',
                            objectFit: 'cover',
                            borderRadius: '10px',
                            marginTop: '8px'
                          }}
                        />
                      )}
                    </div>

                    <div className="admin-actions">
                      <button type="button" className="secondary-btn small-btn" onClick={() => handleEdit(product)}>
                        Modifier
                      </button>

                      <button type="button" className="danger-btn small-btn" onClick={() => handleDelete(product.id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="orders-box" ref={ordersRef}>
          <div className="orders-header-row">
            <h2>Commandes</h2>
            <button
              type="button"
              className="orders-shortcut-btn mobile-orders-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Retour en haut
            </button>
          </div>

          <div className="admin-list">
            {orders.length === 0 ? (
              <p>Aucune commande pour le moment.</p>
            ) : (
              orders.map((order) => (
                <div
                  className={`order-card ${selectedOrderId === order.id ? 'order-card-highlight' : ''}`}
                  key={order.id}
                  ref={(el) => {
                    if (el) {
                      orderRefs.current[order.id] = el;
                    } else {
                      delete orderRefs.current[order.id];
                    }
                  }}
                >
                  <div>
                    <strong>{order.customerName}</strong>
                    <p className="order-id-line">Commande: {order.id}</p>
                    <p>{order.phone} - {order.city}</p>
                    <p>{order.address}</p>
                    <p>Total : {Number(order.total).toFixed(2)} DH</p>
                    <p>
                      Statut : <strong>{order.status}</strong>
                    </p>
                    <ul>
                      {order.items?.map((item, idx) => (
                        <li key={idx}>
                          {item.title} x {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="status-buttons">
                    <button
                      type="button"
                      className={getStatusClass(order.status, 'Nouvelle')}
                      onClick={() => updateOrderStatus(order.id, 'Nouvelle')}
                    >
                      Nouvelle
                    </button>

                    <button
                      type="button"
                      className={getStatusClass(order.status, 'Confirmée')}
                      onClick={() => updateOrderStatus(order.id, 'Confirmée')}
                    >
                      Confirmée
                    </button>

                    <button
                      type="button"
                      className={getStatusClass(order.status, 'Livrée')}
                      onClick={() => updateOrderStatus(order.id, 'Livrée')}
                    >
                      Livrée
                    </button>

                    <button type="button" className="danger-btn small-btn" onClick={() => handleDeleteOrder(order.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
