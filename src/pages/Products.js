import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Search } from 'lucide-react';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';

function Products({ typeFilter = 'all' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const PRODUCTS_PER_PAGE = 20;
  const isPacksPage = typeFilter === 'pack';
  const isProductsPage = typeFilter === 'product';

  useEffect(() => {
    async function fetchProducts() {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
      setProducts(data);
      setLoading(false);
    }

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const normalizedType = product.type === 'pack' ? 'pack' : 'product';
      const matchesType = typeFilter === 'all' || normalizedType === typeFilter;
      const matchesSearch = product.title?.toLowerCase().includes(search.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [products, search, typeFilter]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, page]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const title = isPacksPage ? 'Tous les packs' : isProductsPage ? 'Tous les produits' : 'Catalogue Glow';
  const subtitle = isPacksPage
    ? 'Des routines complètes, élégantes et pensées pour un glow harmonieux.'
    : isProductsPage
      ? 'Une sélection douce, féminine et raffinée pour votre routine glow.'
      : 'Tous les produits et packs Glow by Amal réunis dans un seul espace.';
  const placeholder = isPacksPage
    ? 'Rechercher un pack...'
    : isProductsPage
      ? 'Rechercher un produit...'
      : 'Rechercher produit ou pack...';

  return (
    <section className="section premium-products-page">
      <div className="container">
        <div className="page-top premium-page-top">
          <div>
            <p className="eyebrow">{isPacksPage ? 'Packs' : 'Catalogue'}</p>
            <h1>{title}</h1>
            <p className="catalogue-subtitle">{subtitle}</p>
          </div>

          <div className="premium-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            {paginatedProducts.length ? (
              <div className="products-grid premium-products-grid">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p>Aucun article trouvé pour le moment.</p>
            )}

            {totalPages > 1 && (
              <div className="pagination-premium">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Précédent
                </button>

                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    className={page === index + 1 ? 'active-page' : ''}
                    onClick={() => setPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}

                <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default Products;
