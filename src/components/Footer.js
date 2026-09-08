import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Sparkles,
  Truck,
  ShieldCheck,
  Heart,
  ShoppingBag,
  ArrowUpRight,
  Camera,
  MessageCircle
} from 'lucide-react';

function Footer() {
  return (
    <footer className="lux-footer pro-footer">
      <div className="footer-glow footer-glow-one"></div>
      <div className="footer-glow footer-glow-two"></div>

      <div className="footer-marquee-line">
        <div>
          <span>Gloow by Amal</span>
          <span>Natural beauty</span>
          <span>Hammam rituals</span>
          <span>Livraison partout au Maroc</span>
          <span>Glow . Care . Confidence</span>
          <span>Gloow by Amal</span>
          <span>Natural beauty</span>
        </div>
      </div>

      <div className="container footer-content">
        <div className="footer-premium-top">
          <div className="footer-brand-block">
            <p className="footer-eyebrow">Natural beauty & glow care</p>

            <h2 className="footer-title">Gloow by Amal</h2>

            <p className="footer-text">
              Un univers doux, féminin et raffiné autour des soins naturels,
              des rituels hammam et du glow care.
            </p>

            <div className="footer-badges">
              <span><Truck size={16} /> Livraison Maroc</span>
              <span><ShieldCheck size={16} /> Produits sélectionnés</span>
              <span><Heart size={16} /> Care féminin</span>
            </div>
          </div>

          <div className="footer-column">
            <h3>Boutique</h3>
            <Link to="/">Accueil</Link>
            <Link to="/products">Produits</Link>
            <Link to="/avis">Avis clientes</Link>
            <Link to="/about">À propos</Link>
          </div>

          <div className="footer-column">
            <h3>Expérience</h3>
            <span><Sparkles size={15} /> Glow rituals</span>
            <span><ShoppingBag size={15} /> Commande simple</span>
            <span><Truck size={15} /> Livraison partout</span>
            <span><ShieldCheck size={15} /> Service premium</span>
          </div>

          <div className="footer-contact-card footer-pro-contact">
            <h3>Contact</h3>

            <a
              href="https://www.instagram.com/amal_a_gloow?igsh=eGE2Nmt5bWs0bWEx"
              target="_blank"
              rel="noreferrer"
              className="footer-contact-item"
            >
              <Camera size={18} />
              <span>@amal_a_gloow</span>
              <ArrowUpRight size={15} />
            </a>
            
<a
  href="https://wa.me/212625882179"
  target="_blank"
  rel="noreferrer"
  className="footer-contact-item"
>
  <MessageCircle size={18} />
  <span>0625882179</span>
  <ArrowUpRight size={15} />
</a>
            <a
              href="mailto:amal.ayoub081217aa@gmail.com"
              className="footer-contact-item"
            >
              <Mail size={18} />
              <span>amal.ayoub081217aa@gmail.com</span>
              <ArrowUpRight size={15} />
            </a>

            <p className="footer-mini-note">
              Livraison partout au Maroc • Packs beauté & glow • Service doux et rapide
            </p>
          </div>
        </div>

        <div className="footer-bottom pro-footer-bottom">
          <p>
            © 2026 Gloow by{' '}
            <Link to="/admin-login" className="hidden-admin-link">
              Amal
            </Link>
            . All rights reserved.
          </p>

          <p className="dev-credit">
            Developed by{' '}
            <a
              href="https://www.instagram.com/hipatyadev_agency?igsh=MmE0Y3h5M3I0b2xi"
              target="_blank"
              rel="noreferrer"
              className="dev-link"
            >
              HIPATYADEV <Camera size={15} />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;