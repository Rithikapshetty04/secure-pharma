import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

<<<<<<< HEAD
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('securepharma_pharmacy_cart');
=======
const CART_STORAGE_KEY = 'securepharma_pharmacy_cart';
const ORDERS_STORAGE_KEY = 'securepharma_pharmacy_orders';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
>>>>>>> origin/main
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
<<<<<<< HEAD
      const saved = localStorage.getItem('securepharma_pharmacy_orders');
=======
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
>>>>>>> origin/main
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
<<<<<<< HEAD
    localStorage.setItem('securepharma_pharmacy_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('securepharma_pharmacy_orders', JSON.stringify(orders));
  }, [orders]);

  const addToCart = (product, batch, requestedQty = 100) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.batchId === batch._id || (item.batchNumber === batch.batchNumber && item.productId === product._id)
      );

      const maxAvailable = batch.quantity || 1000;
      const initialQty = Math.min(requestedQty, maxAvailable);

      if (existingIndex > -1) {
        const updated = [...prev];
=======
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
>>>>>>> origin/main
        const newQty = Math.min(updated[existingIndex].quantity + requestedQty, maxAvailable);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
<<<<<<< HEAD
      }

      return [
        ...prev,
        {
          productId: product._id,
          productName: product.name,
          genericName: product.genericName || '',
          productCode: product.productCode || '',
          dosageForm: product.dosageForm || '',
          strength: product.strength || '',
          manufacturerName: batch.manufacturer?.name || product.manufacturer?.name || 'Verified Manufacturer',
          manufacturerId: batch.manufacturer?._id || product.manufacturer?._id,
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          qrIdentifier: batch.qrIdentifier || batch.batchNumber,
          expiryDate: batch.expiryDate,
          maxAvailable,
          unit: batch.unit || 'Units',
          quantity: initialQty,
          unitPrice: product.unitPrice || 0, // only if present
        },
      ];
    });
  };

  const updateQuantity = (batchId, quantity) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.batchId === batchId) {
            const validQty = Math.max(1, Math.min(quantity, item.maxAvailable));
=======
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
>>>>>>> origin/main
            return { ...item, quantity: validQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

<<<<<<< HEAD
  const removeFromCart = (batchId) => {
    setCartItems((prev) => prev.filter((item) => item.batchId !== batchId));
=======
  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
>>>>>>> origin/main
  };

  const clearCart = () => {
    setCartItems([]);
  };

<<<<<<< HEAD
  const placeOrder = ({ supplierId, supplierName, notes, deliveryAddress }) => {
    if (cartItems.length === 0) return null;

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      orderId,
      _id: orderId,
      createdAt: new Date().toISOString(),
      orderDate: new Date().toISOString(),
      status: 'PENDING',
      supplierId: supplierId || 'DISTRIBUTOR-01',
      supplierName: supplierName || 'Certified Wholesale Logistics',
      deliveryAddress: deliveryAddress || 'Hospital Pharmacy Dispensary Main Vault',
      notes: notes || 'Direct requisition via Secure Pharma Network',
      items: [...cartItems],
      totalItems: cartItems.reduce((acc, curr) => acc + curr.quantity, 0),
    };

    setOrders((prev) => [newOrder, ...prev]);
=======
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
>>>>>>> origin/main
    clearCart();
    return newOrder;
  };

<<<<<<< HEAD
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.orderId === orderId || ord._id === orderId ? { ...ord, status: newStatus } : ord))
    );
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        orders,
        placeOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </CartContext.Provider>
  );
=======
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
>>>>>>> origin/main
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
