import React from 'react';
import { Link } from 'react-router-dom';
import { House, Package, ShoppingBag, Info, Store, MessageCircle } from 'lucide-react';
import logo from '../assets/amal-gloow-logo.jpeg';

function Header({ cartCount = 0 }) {
  return (
    <header className="site-header premium-header">
      <div className="top-marquee">
        <div className="marquee-track">
          <span>Glow . Care . Confidence</span>
          <span>Offres Exclusives Beauté</span>
          <span>Livraison partout au Maroc</span>
          <span>Glow . Care . Confidence</span>
          <span>Offres Exclusives Beauté</span>
        </div>
      </div>

      <div className="container header-inner">
        <Link to="/" className="brand-logo-wrap">
  <img src={logo} alt="Glow by Amal" className="brand-logo-img" />
  <span className="brand-logo-name">Gloow by Amal</span>
</Link>

        <nav className="main-nav">
          <Link to="/" className="home-nav-link" aria-label="Accueil">
            <House size={18} />
            <span>Accueil</span>
          </Link>

          <Link to="/products">
            <Store size={18} />
            <span>Produits</span>
          </Link>

          <Link to="/packs">
            <Package size={18} />
            <span>Packs</span>
          </Link>

          <Link to="/avis" className="icon-only-link" aria-label="Avis">
            <MessageCircle size={19} />
          </Link>

          <Link to="/about" className="icon-only-link" aria-label="À propos">
            <Info size={19} />
          </Link>

          <Link to="/cart" className="cart-icon-link icon-only-link" aria-label="Panier">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
