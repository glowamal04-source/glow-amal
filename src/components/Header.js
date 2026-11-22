import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBasket } from 'lucide-react';
import { doc, getDoc } from '../storefrontData';
import { db } from '../firebase';
import logo from '../assets/amal-gloow-logo.jpeg';

function Header({ cartCount = 0 }) {
  const [announcement, setAnnouncement] = useState('Glow · Care · Confidence   ✦   Livraison partout au Maroc');
  const [logoImage, setLogoImage] = useState('');
  useEffect(() => { getDoc(doc(db, 'settings', 'storefront')).then(s => { if (s.exists()) { const settings = s.data(); if (settings.announcement) setAnnouncement(settings.announcement); if (settings.logoImage) setLogoImage(settings.logoImage); } }).catch(console.error); }, []);
  return (
    <header className="site-header premium-header">
      <div className="top-marquee">
        <div className="marquee-track">
          {[0, 1, 2, 3].map(i => <span key={i}>{announcement}</span>)}
        </div>
      </div>

      <div className="container header-inner">
        <Link to="/" className="brand-logo-wrap">
  <img src={logoImage || logo} alt="Glow by Amal" className="brand-logo-img" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = logo; }} />
  <span className="brand-logo-name">Gloow by Amal</span>
</Link>

        <nav className="main-nav">
          <Link to="/cart" className="cart-icon-link icon-only-link" aria-label="Panier">
            <ShoppingBasket size={22} strokeWidth={1.8} />
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
