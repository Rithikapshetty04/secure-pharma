import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function PharmacyCartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, placeOrder } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveryNotes, setDeliveryNotes] = useState('Requisition for hospital pharmacy dispensary inventory stock.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const order = placeOrder({
        supplierId: 'DIST-CERT-01',
        supplierName: 'Certified Wholesale Logistics Hub',
        deliveryAddress: user?.organization?.address || `${user?.organization?.name || 'Retail Pharmacy'} Dispensary Vault`,
        notes: deliveryNotes,
      });

      if (order) {
        navigate(`/pharmacy/orders/${order.orderId || order._id}?placed=true`);
      } else {
        setError('Failed to create requisition order.');
      }
    } catch (err) {
      setError(err.message || 'Error submitting order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
          🛒 Pharmacy Requisition Cart
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Review ordered medicines, adjust batch quantities, and submit dispensary supply orders
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            color: '#b91c1c',
            fontSize: '0.85rem',
            marginBottom: '20px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px 20px', textAlign: 'center', background: '#ffffff' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
          <h2 style={{ fontSize: '1.3rem', color: '#1e3a8a', marginBottom: '8px' }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '24px' }}>
            No medicine batches have been added for ordering yet.
          </p>
          <Link to="/pharmacy/medicines" className="btn btn-primary">
            💊 Browse Available Medicines
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Cart Items List */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '1.05rem', color: '#1e3a8a' }}>Cart Items ({cartItems.length})</strong>
              <button
                onClick={clearCart}
                style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
              >
                Clear Cart
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartItems.map((item) => (
                <div
                  key={item.batchId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '14px',
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                      {item.productName}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      Lot #{item.batchNumber} • Mfg: {item.manufacturerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
                      Available stock: {item.maxAvailable?.toLocaleString()} {item.unit}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Quantity Controls */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#ffffff',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.batchId, item.quantity - 50)}
                        style={{
                          padding: '6px 12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '0.9rem',
                          color: '#475569',
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.maxAvailable}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.batchId, Number(e.target.value))}
                        style={{
                          width: '70px',
                          textAlign: 'center',
                          border: 'none',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.batchId, item.quantity + 50)}
                        style={{
                          padding: '6px 12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '0.9rem',
                          color: '#475569',
                        }}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.batchId)}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '6px 10px' }}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px' }}>
              <Link to="/pharmacy/medicines" style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}>
                ← Continue Shopping / Add More Medicines
              </Link>
            </div>
          </div>

          {/* Order Summary & Place Order */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#1e3a8a', marginBottom: '16px' }}>
              Requisition Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Total Product Lines:</span>
                <strong>{cartItems.length} Formulations</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Total Units Requisitioned:</span>
                <strong style={{ color: '#1d4ed8', fontSize: '1rem' }}>{totalQuantity.toLocaleString()} Units</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Dispensary Destination:</span>
                <strong>{user?.organization?.name || 'Pharmacy Dispensary'}</strong>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  REQUISITION NOTES & COLD CHAIN REQUIREMENTS
                </label>
                <textarea
                  rows="3"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: '700' }}
              >
                {submitting ? 'Submitting Requisition...' : '📋 Place Requisition Order'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
