import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'securepharma_pharmacy_cart';
const ORDERS_STORAGE_KEY = 'securepharma_pharmacy_orders';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders to localStorage:', e);
    }
  }, [orders]);

  const addToCart = (product, batch, requestedQty = 1) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.batchId === batch._id || item.batchNumber === batch.batchNumber
      );

      const maxAvailable = batch.quantity || 1000;

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = Math.min(updated[existingIndex].quantity + requestedQty, maxAvailable);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productId: product._id || product.id,
            productName: product.name,
            genericName: product.genericName,
            dosageForm: product.dosageForm,
            strength: product.strength,
            productCode: product.productCode,
            batchId: batch._id || batch.id,
            batchNumber: batch.batchNumber,
            maxQuantity: maxAvailable,
            quantity: Math.min(requestedQty, maxAvailable),
            unit: batch.unit || 'Units',
            manufacturerName: product.manufacturer?.name || batch.manufacturer?.name || 'Authorized Manufacturer',
            supplierName: batch.currentHolder?.name || batch.manufacturer?.name || 'Authorized Distributor',
            expiryDate: batch.expiryDate,
          },
        ];
      }
    });
  };

  const updateQuantity = (itemId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.id === itemId) {
            const validQty = Math.max(1, Math.min(newQuantity, item.maxQuantity));
            return { ...item, quantity: validQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const placeOrder = (pharmacyUser) => {
    if (cartItems.length === 0) return null;

    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder = {
      orderId,
      id: orderId,
      createdAt: new Date().toISOString(),
      orderDate: new Date().toISOString(),
      pharmacyId: pharmacyUser?.organization?._id || pharmacyUser?._id,
      pharmacyName: pharmacyUser?.organization?.name || pharmacyUser?.name || 'Pharmacy Dispensary',
      distributorName: cartItems[0]?.supplierName || 'Authorized Distributor',
      items: [...cartItems],
      totalQuantity: cartItems.reduce((acc, item) => acc + item.quantity, 0),
      status: 'PENDING',
      notes: 'Pharmacy standard inventory order',
    };

    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    clearCart();
    return newOrder;
  };

  const getOrderById = (orderId) => {
    return orders.find((o) => o.orderId === orderId || o.id === orderId) || null;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => (o.orderId === orderId || o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const value = {
    cartItems,
    cartCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
    orders,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    placeOrder,
    getOrderById,
    updateOrderStatus,
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
