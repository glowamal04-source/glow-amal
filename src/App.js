import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ProductDetails from './pages/ProductDetails';
import PrivateRoute from './components/PrivateRoute';
import { useCart } from './context/CartContext';
import ScrollToTop from './components/ScrollToTop';
import About from './pages/About';
import Avis from './pages/Avis';
import OrderLinkPage from './pages/OrderLinkPage';

function App() {
  const { cartCount } = useCart();

  return (
    <>
      <Header cartCount={cartCount} />
      <ScrollToTop/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About/>} />
        <Route path="/products" element={<Products typeFilter="product" />} />
        <Route path="/packs" element={<Products typeFilter="pack" />} />
        <Route path="/catalogue" element={<Products typeFilter="all" />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/commande" element={<OrderLinkPage />} />
        <Route path="/avis" element={<Avis />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
