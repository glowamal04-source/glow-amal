import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Sparkles } from 'lucide-react';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import heroImage from '../assets/hero-section.jpeg';

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

function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const q = query(collection(db, 'products'), where('featured', '==', true));
        const snap = await getDocs(q);
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
    () => featured.filter((item) => item.type === 'pack').slice(0, 2),
    [featured]
  );

  return (
    <>
      <section className="home-hero-only">
        <img src={heroImage} alt="Gloow by Amal" />
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Sélection</p>
              <h2>Meilleurs Produits</h2>
            </div>

            <Link to="/catalogue" className="text-link">
              Tout voir
            </Link>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : featured.length ? (
            <div className="products-grid sahar-products-grid">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p>Aucun produit ou pack en avant pour le moment.</p>
          )}
        </div>
      </section>

      <section className="section home-packs-section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Routines</p>
              <h2>Packs Glow</h2>
            </div>

            <Link to="/packs" className="text-link">
              Voir tout
            </Link>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : featuredPacks.length ? (
            <div className="products-grid home-packs-grid">
              {featuredPacks.map((pack) => (
                <ProductCard key={pack.id} product={pack} />
              ))}
            </div>
          ) : (
            <p>Aucun pack mis en avant pour le moment.</p>
          )}
        </div>
      </section>

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
