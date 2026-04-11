import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchCart();
    else setCart([]);
  }, [user]);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch { setCart([]); }
  };

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await api.post('/cart', { product_id: productId, quantity });
    setCart(data);
  };

  const updateCart = async (cartItemId, quantity) => {
    const { data } = await api.put(`/cart/${cartItemId}`, { quantity });
    setCart(data);
  };

  const removeFromCart = async (cartItemId) => {
    const { data } = await api.delete(`/cart/${cartItemId}`);
    setCart(data);
  };

  const clearCart = async () => {
    await api.delete('/cart/clear');
    setCart([]);
  };

  const cartCount = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const cartTotal = cart.reduce((s, i) => s + (Number(i.products?.price) || 0) * (Number(i.quantity) || 0), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateCart, removeFromCart, clearCart, cartCount, cartTotal, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
