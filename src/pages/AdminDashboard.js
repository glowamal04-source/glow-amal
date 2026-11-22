import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from '../adminApi';
import { db } from '../firebase';
import Swal from 'sweetalert2';
import { Plus, Package, Sparkles, TicketPercent, ShoppingBasket, ArrowUpRight } from 'lucide-react';

const initialForm = {
  type: 'product',
  title: '',
  description: '',
  price: '',
  stock: '',
  featured: false,
  freeShipping: false,
  imageUrls: ''
};

const phoneHref = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;

function AdminDashboard() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ announcement: '', logoImage: '', heroImage: '', essentialPackId: '', essentialTitle: '', essentialText: '', essentialButton: '', beforeImage: '', afterImage: '' });
  const [promo, setPromo] = useState({ code: '', percentage: '' });
  const [promos, setPromos] = useState([]);
  const fetchPromos = async () => { const snap = await getDocs(collection(db, 'promoCodes')); setPromos(snap.docs.map(d => ({ id: d.id, ...d.data() }))); };
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
    fetchPromos().catch(console.error);
    getDoc(doc(db, 'settings', 'storefront')).then(s => { if (s.exists()) setSettings(prev => ({ ...prev, ...s.data() })); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedOrderId || orders.length === 0) return;

    const selectedOrder = orderRefs.current[selectedOrderId];
    selectedOrder?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [orders, selectedOrderId]);

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
        freeShipping: form.freeShipping,
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
        confirmButtonColor: '#d45f86'
      });
    } catch (error) {
      console.error(error);

      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message,
        confirmButtonColor: '#d45f86'
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
      freeShipping: !!product.freeShipping,
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
      confirmButtonColor: '#d45f86',
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
          confirmButtonColor: '#d45f86'
        });
      } catch (error) {
        console.error(error);

        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message,
          confirmButtonColor: '#d45f86'
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
        confirmButtonColor: '#d45f86'
      });
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Supprimer la commande ?',
      text: 'Cette commande sera supprimée définitivement.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d45f86',
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
          confirmButtonColor: '#d45f86'
        });
      } catch (error) {
        console.error(error);

        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message,
          confirmButtonColor: '#d45f86'
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

        </div>

        <nav className="admin-quick-access" aria-label="Accès rapide administration">
          <div className="admin-quick-heading"><div><p className="eyebrow">Votre espace</p><h2>Accès rapide</h2></div><span>Tout gérer en un clic</span></div>
          <div className="admin-quick-grid">
            {[
              { id: 'admin-article', label: 'Ajouter un article', detail: 'Produit ou pack', icon: Plus },
              { id: 'admin-catalogue', label: 'Produits & packs', detail: `${products.length} articles`, icon: Package },
              { id: 'admin-vitrine', label: 'Vitrine & offre', detail: 'Personnaliser', icon: Sparkles },
              { id: 'admin-promos', label: 'Codes promo', detail: `${promos.length} codes`, icon: TicketPercent },
              { id: 'admin-orders', label: 'Commandes', detail: `${orders.length} commandes`, icon: ShoppingBasket }
            ].map(({ id, label, detail, icon: Icon }) => <a className="admin-quick-card" href={`#${id}`} key={id}><span className="admin-quick-icon"><Icon size={20} strokeWidth={1.8} /></span><span className="admin-quick-copy"><strong>{label}</strong><small>{detail}</small></span><ArrowUpRight className="admin-quick-arrow" size={16} /></a>)}
          </div>
        </nav>

        <div className="admin-grid">
          <form id="admin-article" className="admin-form" onSubmit={handleSubmit}>
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
            <label className="checkbox-row"><input type="checkbox" name="freeShipping" checked={form.freeShipping} onChange={handleChange} /> Livraison gratuite pour cet article</label>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Ajouter article'}
            </button>
          </form>

          <div id="admin-catalogue" className="admin-panel">
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

        <div className="admin-grid storefront-admin">
          <form id="admin-vitrine" className="admin-form" onSubmit={async e => { e.preventDefault(); try { await setDoc(doc(db, 'settings', 'storefront'), settings, { merge: true }); Swal.fire('Enregistré', 'La vitrine a été mise à jour.', 'success'); } catch (error) { Swal.fire('Erreur', error.message, 'error'); } }}>
            <h2>Vitrine & offre spéciale</h2>
            <div className="form-group"><label htmlFor="logo-image">Lien du logo</label><input id="logo-image" type="url" value={settings.logoImage || ''} onChange={e => setSettings({ ...settings, logoImage: e.target.value })} placeholder="https://exemple.com/logo.png" /><small>Laissez vide pour garder le logo actuel.</small>{settings.logoImage && <img className="admin-logo-preview" src={settings.logoImage} alt="Aperçu du logo" />}</div>
            <div className="form-group"><label htmlFor="hero-image">Lien de l’image principale</label><input id="hero-image" type="url" value={settings.heroImage || ''} onChange={e => setSettings({ ...settings, heroImage: e.target.value })} placeholder="https://exemple.com/image.jpg" /><small>Laissez vide pour utiliser l’image actuelle. L’image sera affichée en entier.</small>{settings.heroImage && <img className="admin-hero-preview" src={settings.heroImage} alt="Aperçu de l’image principale" />}</div>
            {[['announcement','Texte de la barre supérieure'], ['essentialTitle','Titre de l’offre'], ['essentialText','Texte de l’offre'], ['essentialButton','Texte du bouton'], ['beforeImage','Lien image avant'], ['afterImage','Lien image après']].map(([key,label]) => <div className="form-group" key={key}><label>{label}</label><input value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} /></div>)}
            <div className="form-group"><label>Pack essentiel</label><select value={settings.essentialPackId || ''} onChange={e => setSettings({ ...settings, essentialPackId: e.target.value })}><option value="">Aucun</option>{products.filter(p => p.type === 'pack').map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
            <button className="primary-btn">Enregistrer la vitrine</button>
          </form>
          <div id="admin-promos" className="admin-panel"><h2>Codes promo</h2><form onSubmit={async e => { e.preventDefault(); const code = promo.code.trim().toUpperCase(); const percentage = Number(promo.percentage); if (!/^[A-Z0-9_-]{1,40}$/.test(code) || percentage <= 0 || percentage > 100) { Swal.fire('Code invalide', 'Utilisez des lettres ou chiffres et un pourcentage entre 1 et 100.', 'error'); return; } try { await setDoc(doc(db, 'promoCodes', code), { percentage, active: true }); setPromo({ code: '', percentage: '' }); await fetchPromos(); } catch (error) { Swal.fire('Erreur', error.message, 'error'); } }}><div className="form-group"><label>Code</label><input value={promo.code} onChange={e => setPromo({ ...promo, code: e.target.value })} required /></div><div className="form-group"><label>Réduction (%)</label><input type="number" min="1" max="100" value={promo.percentage} onChange={e => setPromo({ ...promo, percentage: e.target.value })} required /></div><button className="primary-btn">Enregistrer le code</button></form><div className="admin-list">{promos.map(p => <div className="admin-item" key={p.id}><span><strong>{p.id}</strong> · {p.percentage}%</span><button type="button" className="danger-btn small-btn" onClick={async () => { if ((await Swal.fire({ title: 'Supprimer ce code ?', showCancelButton: true, icon: 'warning' })).isConfirmed) { await deleteDoc(doc(db, 'promoCodes', p.id)); await fetchPromos(); } }}>Supprimer</button></div>)}</div></div>
        </div>
        <div id="admin-orders" className="orders-box" ref={ordersRef}>
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
                    <p>
                      <a className="phone-call-link" href={phoneHref(order.phone)}>
                        {order.phone}
                      </a>
                      {' - '}
                      {order.city}
                    </p>
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
