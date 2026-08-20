import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_PASSWORD = 'Glow.Admin_1';

function AdminGate() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_access', 'true');
      navigate('/admin');
      return;
    }

    setMessage('Mot de passe incorrect.');
  };

  return (
    <section className="section">
      <div className="container small-container">
        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="eyebrow">Espace administrateur</p>
          <h1>Connexion admin</h1>

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

          <button className="primary-btn">
            Entrer
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminGate;
