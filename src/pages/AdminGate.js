import React, { useEffect, useState } from 'react';
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink
} from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

function AdminGate() {
  const location = useLocation();
  const [email, setEmail] = useState(localStorage.getItem('admin_email') || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/admin';

  useEffect(() => {
    const finishEmailLogin = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) return;

      const savedEmail = localStorage.getItem('admin_email');
      const loginEmail = savedEmail || window.prompt('Email admin:');

      if (!loginEmail) {
        setMessage('Email requis pour terminer la connexion.');
        return;
      }

      setLoading(true);

      try {
        await signInWithEmailLink(auth, loginEmail, window.location.href);
        localStorage.setItem('admin_email', loginEmail);
        navigate(redirectPath, { replace: true });
      } catch (error) {
        console.error(error);
        setMessage('Lien invalide ou expiré. Demandez un nouveau lien.');
      }

      setLoading(false);
    };

    finishEmailLogin();
  }, [navigate, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const actionCodeSettings = {
      url: `${window.location.origin}/admin-login?redirect=${encodeURIComponent(redirectPath)}`,
      handleCodeInApp: true
    };

    try {
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      localStorage.setItem('admin_email', email.trim());
      setMessage('Lien de connexion envoyé. Ouvrez votre email admin.');
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'Erreur lors de l’envoi du lien.');
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

          {message && <p className="admin-login-message">{message}</p>}

          <button className="primary-btn" disabled={loading}>
            {loading ? 'Envoi...' : 'Recevoir le lien'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminGate;
