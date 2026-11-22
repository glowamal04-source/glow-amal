import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, hasAdminSession } from '../adminApi';

function AdminGate() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    if (process.env.REACT_APP_LOCAL_PREVIEW !== 'true' && ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '3100') {
      window.location.replace('http://127.0.0.1:3100/admin-login');
    } else if (hasAdminSession()) navigate('/admin', { replace: true });
  }, [navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try { await adminLogin(password); navigate('/admin'); }
    catch (error) { setMessage(error.message); }
  };
  return <section className="section"><div className="container small-container"><form className="auth-card" onSubmit={handleSubmit}>
    <p className="eyebrow">Espace administrateur</p><h1>Connexion admin</h1>
    {process.env.REACT_APP_LOCAL_PREVIEW !== 'true' && ['localhost', '127.0.0.1'].includes(window.location.hostname) && <p className="admin-login-message">Pour le test local, ouvrez <a href="http://127.0.0.1:3100/admin-login">l’administration sur le port 3100</a>.</p>}
    <div className="form-group"><label htmlFor="admin-password">Mot de passe</label><div className="admin-password-field"><input id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={showPassword}>{showPassword ? 'Masquer' : 'Afficher'}</button></div></div>
    {message && <p className="admin-login-message">{message}</p>}
    <button className="primary-btn">Entrer</button>
  </form></div></section>;
}
export default AdminGate;
