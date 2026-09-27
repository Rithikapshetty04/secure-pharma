import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notices, setNotices] = useState([]);

  const isPharmacy = user?.role === 'PHARMACY';

  const fetchCart = useCallback(async () => {
    if (!isPharmacy) {
      setCart(null);
      setNotices([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPharmacyCart();
      if (res && res.success) {
        setCart(res.cart || null);
        if (res.notices && res.notices.length > 0) {
          setNotices(res.notices);
        } else {
          setNotices([]);
        }
      } else {
        setError(res?.message || 'Failed to fetch cart state');
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.message || 'Failed to load cart from server');
    } finally {
      setLoading(false);
    }
  }, [isPharmacy]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product, batch, requestedQty = 1) => {
    const productId = typeof product === 'string' ? product : (product?._id || product?.id);
    const batchId = typeof batch === 'string' ? batch : (batch?._id || batch?.id);

    try {
      const res = await api.addPharmacyCartItem({
        productId,
        batchId,
        quantity: Number(requestedQty) || 1,
      });

      if (res && res.success) {
        setCart(res.cart);
        if (res.notices) setNotices(res.notices);
        return { success: true, cart: res.cart };
      } else {
        return { success: false, message: res?.message || 'Failed to add item to cart' };
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      return { success: false, message: err.message || 'Failed to add item to cart' };
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      const res = await api.updatePharmacyCartItem(itemId, Number(newQuantity));
      if (res && res.success) {
        setCart(res.cart);
        if (res.notices) setNotices(res.notices);
        return { success: true, cart: res.cart };
      } else {
        return { success: false, message: res?.message || 'Failed to update quantity' };
      }
    } catch (err) {
      console.error('Error updating cart quantity:', err);
      return { success: false, message: err.message || 'Failed to update item quantity' };
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await api.removePharmacyCartItem(itemId);
      if (res && res.success) {
        setCart(res.cart);
        return { success: true, cart: res.cart };
      } else {
        return { success: false, message: res?.message || 'Failed to remove item' };
      }
    } catch (err) {
      console.error('Error removing cart item:', err);
      return { success: false, message: err.message || 'Failed to remove item from cart' };
    }
  };

  const clearCart = async () => {
    try {
      const res = await api.clearPharmacyCart();
      if (res && res.success) {
        setCart(res.cart);
        setNotices([]);
        return { success: true };
      } else {
        return { success: false, message: res?.message || 'Failed to clear cart' };
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      return { success: false, message: err.message || 'Failed to clear cart' };
    }
  };

  const cartItems = cart?.items || [];
  const cartCount = cart?.totalQuantity ?? cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const value = {
    cart,
    cartItems,
    cartCount,
    loading,
    error,
    notices,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

