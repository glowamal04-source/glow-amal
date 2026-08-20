import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

function AdminGate() {
  const location = useLocation();
  const [email, setEmail] = useState(localStorage.getItem('admin_email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      localStorage.setItem('admin_email', email.trim());
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error(error);
      setMessage('Email ou mot de passe incorrect.');
    }

    setLoading(false);
  };

  return (
    <section className="section">
      <div className="container small-container">
        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="eyebrow">Espace administrateur</p>
          <h1>Connexion admin</h1>

          <div className="form-group">
            <label>Email admin</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && <p className="admin-login-message">{message}</p>}

          <button className="primary-btn" disabled={loading}>
            {loading ? 'Connexion...' : 'Entrer'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminGate;
