import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === product.id
      );

      const stock = Number(product.stock) || 0;

      if (existingIndex !== -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantity, stock);

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty
        };

        return updated;
      }

      return [
        ...prev,
        {
          id: product.id,
          type: product.type === 'pack' ? 'pack' : 'product',
          title: product.title,
          price: Number(product.price) || 0,
          image: product.images?.[0] || '',
          quantity: Math.min(quantity, stock),
          stock
        }
      ];
    });
  };

  const updateQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const maxStock = Number(item.stock) || 1;
          const safeQty = Math.max(1, Math.min(Number(quantity) || 1, maxStock));

          return {
            ...item,
            quantity: safeQty
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id) => {
    setCartItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const shipping = cartItems.length ? 40 : 0;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        subtotal,
        shipping,
        total
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
