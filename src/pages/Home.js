import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from '../storefrontData';
import { Sparkles } from 'lucide-react';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import heroImage from '../assets/hero-section.jpeg';
import Avis from './Avis';
import About from './About';
import { useStorefront } from '../context/StorefrontContext';

const glowFaqs = [
  {
    question: 'Les produits sont-ils naturels ?',
    answer: 'Oui, nos soins sont inspirés des rituels naturels marocains et sélectionnés avec beaucoup de soin.'
  },
  {
    question: 'Conviennent-ils aux peaux sensibles ?',
    answer: 'La majorité de nos produits conviennent aux peaux sensibles. Nous recommandons toujours un petit test avant utilisation.'
  },
  {
    question: 'Comment confirmer ma commande ?',
    answer: 'Après votre commande, notre équipe vous contacte rapidement pour confirmer vos informations avant l’envoi.'
  },
  {
    question: 'À quelle fréquence utiliser les gommages ?',
    answer: 'Une à deux fois par semaine suffisent pour garder une peau douce, propre et lumineuse.'
  },
  {
    question: 'Les produits éclaircissent-ils la peau ?',
    answer: 'Nos soins aident à illuminer et unifier naturellement le teint, sans effet agressif.'
  },
  {
    question: 'Puis-je utiliser plusieurs produits ensemble ?',
    answer: 'Oui, plusieurs soins peuvent être combinés dans une routine glow complète et équilibrée.'
  },
  {
    question: 'Les packs sont-ils moins chers ?',
    answer: 'Oui, les packs permettent de profiter de meilleurs prix et d’une routine complète.'
  },
  {
    question: 'Pourquoi choisir Glow by Amal ?',
    answer: 'Parce que chaque détail offre une expérience féminine, raffinée et inspirée des rituels beauté marocains.'
  }
];

function Carousel({ items }) {
  const track = useRef(null);
  const lastInteraction = useRef(0);
  useEffect(() => {
    const timer = setInterval(() => {
      const el = track.current;
      if (!el || el.matches(':hover') || document.hidden || Date.now() - lastInteraction.current < 6000 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) el.scrollTo({ left: 0, behavior: 'smooth' });
      else el.scrollBy({ left: el.firstElementChild?.offsetWidth + 12 || 180, behavior: 'smooth' });
    }, 4500);
    return () => clearInterval(timer);
  }, []);
  return <div className="glow-carousel" ref={track} tabIndex="0" aria-label="Défiler les articles" onPointerDown={() => { lastInteraction.current = Date.now(); }} onKeyDown={() => { lastInteraction.current = Date.now(); }}>{items.map(item => <ProductCard key={item.id} product={item} />)}</div>;
}

function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const { settings, loading: settingsLoading, error: settingsError, retry } = useStorefront();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeatured(items);
      } catch (error) {
        console.error('Erreur chargement produits mis en avant:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const featuredPacks = useMemo(
    () => featured.filter((item) => item.type === 'pack'),
    [featured]
  );

  if (settingsError) return <section className="section"><div className="container storefront-error" role="alert"><p>Impossible de charger la boutique. Vérifiez votre connexion puis réessayez.</p><button type="button" className="primary-btn" onClick={retry}>Réessayer</button></div></section>;
  if (settingsLoading || loading) return <div className="storefront-loading" role="status" aria-live="polite"><span>Chargement de la boutique...</span><div className="storefront-loading-banner" aria-hidden="true" /></div>;

  return (
    <>
      <section className="home-hero-only">
        <img src={settings.heroImage || heroImage} alt="Gloow by Amal" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = heroImage; }} />
      </section>

      {settings.essentialPackId && featured.find(item => item.id === settings.essentialPackId && item.type === 'pack') && (() => {
        const pack = featured.find(item => item.id === settings.essentialPackId);
        return <section className="essential-offer"><div className="essential-copy"><p className="eyebrow">Une offre à découvrir</p><h2>{settings.essentialTitle || pack.title}</h2><p className="essential-promo-text">{settings.essentialText}</p><Link className="primary-btn" to={`/products/${pack.id}`}>{settings.essentialButton || 'Découvrir le pack'}</Link></div><div className="essential-image"><img src={pack.images?.[0]} alt={pack.title} /></div></section>;
      })()}

      <section className="section" id="produits">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Sélection</p>
              <h2>Meilleurs Produits</h2>
            </div>

          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : featured.some(item => item.type !== 'pack') ? (
            <Carousel items={featured.filter(item => item.type !== 'pack')} />
          ) : (
            <p>Aucun produit ou pack en avant pour le moment.</p>
          )}
        </div>
      </section>

      <section className="section home-packs-section" id="packs">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Routines</p>
              <h2>Packs Glow</h2>
            </div>

          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : featuredPacks.length ? (
            <Carousel items={featuredPacks} />
          ) : (
            <p>Aucun pack mis en avant pour le moment.</p>
          )}
        </div>
      </section>

      {settings.beforeImage && settings.afterImage && <section className="section results-section"><div className="container"><p className="eyebrow">Vos résultats</p><h2>Avant & après</h2><p>La beauté de vos routines, en images.</p><div className="results-grid"><figure><img src={settings.beforeImage} alt="Avant" /><figcaption>Avant</figcaption></figure><figure><img src={settings.afterImage} alt="Après" /><figcaption>Après</figcaption></figure></div></div></section>}
      <Avis />
      <About />
      <section className="section glow-faq-section">
        <div className="container">
          <div className="faq-hero">
            <p className="eyebrow">Questions & Réponses</p>
            <h2>Tout pour choisir votre routine glow</h2>
          </div>

          <div className="faq-grid">
            {glowFaqs.map((item, index) => (
              <article
                className={`faq-card ${openFaq === index ? 'is-open' : ''}`}
                key={item.question}
                style={{ '--delay': `${index * 0.08}s` }}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenFaq((current) => (current === index ? null : index))}
                  aria-expanded={openFaq === index}
                >
                  <span className="faq-icon">
                    <Sparkles size={18} />
                  </span>
                  <span>{item.question}</span>
                  <span className="faq-plus">{openFaq === index ? '-' : '+'}</span>
                </button>

                <div className="faq-answer-wrap">
                  <p>{item.answer}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
