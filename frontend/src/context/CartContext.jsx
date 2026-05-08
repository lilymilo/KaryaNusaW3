import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();

  // Debounce timers for quantity updates
  const updateTimers = useRef({});
  // Track in-flight requests to prevent race conditions
  const inflightRef = useRef(false);

  useEffect(() => {
    if (user) fetchCart();
    else setCart([]);
    return () => {
      // Cleanup all pending timers on unmount
      Object.values(updateTimers.current).forEach(clearTimeout);
      updateTimers.current = {};
    };
  }, [user]);

  const fetchCart = async () => {
    if (cartLoading) return;
    setCartLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      setCart([]);
    } finally {
      setCartLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    try {
      const { data } = await api.post('/cart', { product_id: productId, quantity });
      setCart(data);
    } finally {
      inflightRef.current = false;
    }
  };

  const updateCart = useCallback(async (cartItemId, quantity) => {
    // Guard: don't allow quantity below 1
    if (quantity < 1) return;

    // Optimistic UI update — change instantly, sync with server later
    setCart(prev => prev.map(item =>
      item.id === cartItemId ? { ...item, quantity } : item
    ));

    // Debounce: wait 400ms before sending to server to batch rapid clicks
    if (updateTimers.current[cartItemId]) {
      clearTimeout(updateTimers.current[cartItemId]);
    }

    updateTimers.current[cartItemId] = setTimeout(async () => {
      delete updateTimers.current[cartItemId];
      try {
        const { data } = await api.put(`/cart/${cartItemId}`, { quantity });
        setCart(data);
      } catch {
        // On error, re-fetch the real state from the server
        try {
          const { data } = await api.get('/cart');
          setCart(data);
        } catch { /* silently fail */ }
      }
    }, 400);
  }, []);

  const removeFromCart = async (cartItemId) => {
    // Optimistic: remove instantly from UI
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    
    // Cancel any pending update for this item
    if (updateTimers.current[cartItemId]) {
      clearTimeout(updateTimers.current[cartItemId]);
      delete updateTimers.current[cartItemId];
    }

    try {
      const { data } = await api.delete(`/cart/${cartItemId}`);
      setCart(data);
    } catch {
      // Re-fetch on error
      try {
        const { data } = await api.get('/cart');
        setCart(data);
      } catch { /* silently fail */ }
    }
  };

  const clearCart = async () => {
    // Optimistic: clear immediately
    setCart([]);
    try {
      await api.delete('/cart/clear');
    } catch (err) {
      console.error('clearCart error:', err);
      // Re-fetch on error
      try {
        const { data } = await api.get('/cart');
        setCart(data);
      } catch { /* silently fail */ }
    }
  };

  const cartCount = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const cartTotal = cart.reduce((s, i) => s + (Number(i.products?.price) || 0) * (Number(i.quantity) || 0), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateCart, removeFromCart, clearCart, cartCount, cartTotal, fetchCart, cartLoading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
