import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { StorefrontProvider } from './context/StorefrontContext';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <StorefrontProvider><App /></StorefrontProvider>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
