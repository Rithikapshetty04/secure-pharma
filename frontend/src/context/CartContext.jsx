import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('securepharma_pharmacy_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('securepharma_pharmacy_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
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
        const newQty = Math.min(updated[existingIndex].quantity + requestedQty, maxAvailable);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
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
            return { ...item, quantity: validQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (batchId) => {
    setCartItems((prev) => prev.filter((item) => item.batchId !== batchId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

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
    clearCart();
    return newOrder;
  };

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
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
