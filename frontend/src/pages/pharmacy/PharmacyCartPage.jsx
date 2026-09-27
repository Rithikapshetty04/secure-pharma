import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../api';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Package,
  Calendar,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const PharmacyCartPage = () => {
  const { user } = useAuth();
  const { cart, cartItems, cartCount, loading, error: cartError, notices, updateQuantity, removeFromCart, clearCart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [shippingNotes, setShippingNotes] = useState('Standard temperature-controlled pharmacy delivery requested.');

  const subtotal = cart?.subtotal || cartItems.reduce((acc, item) => acc + (item.totalPrice || (item.unitPrice * item.quantity)), 0);
  const total = cart?.total || subtotal;

  const handleQtyChange = async (itemId, newQty, maxAvailable) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    if (maxAvailable && newQty > maxAvailable) {
      setActionError(`Maximum available quantity for this batch is ${maxAvailable} units.`);
      return;
    }

    setUpdatingItemId(itemId);
    setActionError('');
    try {
      const res = await updateQuantity(itemId, newQty);
      if (!res.success) {
        setActionError(res.message || 'Failed to update item quantity.');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update item quantity.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setRemovingItemId(itemId);
    setActionError('');
    try {
      const res = await removeFromCart(itemId);
      if (!res.success) {
        setActionError(res.message || 'Failed to remove item.');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to remove item.');
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    setActionError('');
    try {
      const res = await clearCart();
      if (res.success) {
        setShowClearConfirm(false);
      } else {
        setActionError(res.message || 'Failed to clear cart.');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to clear cart.');
    } finally {
      setIsClearing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cartItems || cartItems.length === 0) {
      setActionError('Cart is empty.');
      return;
    }

    setSubmittingOrder(true);
    setActionError('');
    try {
      const orderPayload = {
        items: cartItems.map(item => ({
          productId: item.product?._id || item.product,
          batchId: item.batch?._id || item.batch,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        notes: shippingNotes,
      };

      const res = await api.createOrder(orderPayload);
      if (res && res.success) {
        await clearCart();
        setSuccessMsg(`Order #${res.order?.orderId || ''} created successfully! Redirecting to orders...`);
        setTimeout(() => {
          navigate('/pharmacy/orders');
        }, 1500);
      } else {
        setActionError(res?.message || 'Failed to place purchase order.');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setActionError(err.message || 'Server error placing purchase order.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading && (!cartItems || cartItems.length === 0)) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <Loader2 style={{ width: '40px', height: '40px', color: '#059669', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '1rem', fontWeight: '600' }}>Loading Pharmacy Procurement Cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '40px 20px 80px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px 32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '72px', height: '72px', background: '#ecfdf5', color: '#059669', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <ShoppingCart style={{ width: '36px', height: '36px' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Your Pharmacy Cart is Empty</h2>
          <p style={{ fontSize: '0.92rem', color: '#64748b', marginTop: '8px', marginBottom: '24px', lineHeight: '1.5' }}>
            No pharmaceutical products or batches are currently added to your procurement cart. Browse the verified catalog to select authentic medications.
          </p>
          <Link
            to="/pharmacy/medicines"
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              fontSize: '0.92rem',
              fontWeight: '700',
              background: '#059669',
              borderColor: '#059669',
            }}
          >
            <Package style={{ width: '18px', height: '18px' }} />
            Browse Medicine Catalog
            <ArrowRight style={{ width: '18px', height: '18px' }} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                Operational Cart
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Authenticated Pharmacy Procurement
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Pharmacy Procurement Cart
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              Review batch allocations, verify server-authoritative pricing & inventory, and finalize your purchase order.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => fetchCart()}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              title="Refresh Cart from Server"
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              Sync Cart
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-danger"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Trash2 style={{ width: '15px', height: '15px' }} />
              Clear Cart
            </button>
          </div>
        </div>

        {/* Notices/Warnings */}
        {notices && notices.length > 0 && (
          <div style={{ background: '#fffbebfb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertTriangle style={{ width: '20px', height: '20px', color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#92400e', display: 'block', marginBottom: '4px' }}>
                  Inventory Validation Update
                </strong>
                {notices.map((notice, i) => (
                  <p key={i} style={{ fontSize: '0.84rem', color: '#b45309', margin: 0 }}>
                    • {notice}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Error / Cart Error */}
        {(actionError || cartError) && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', fontSize: '0.88rem' }}>
            <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span>{actionError || cartError}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#047857', fontSize: '0.88rem', fontWeight: '600' }}>
            <CheckCircle2 style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Clear Entire Cart?</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0' }}>
                Are you sure you want to remove all items from your pharmacy cart? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="btn btn-secondary"
                  disabled={isClearing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCart}
                  className="btn btn-danger"
                  disabled={isClearing}
                >
                  {isClearing ? 'Clearing...' : 'Yes, Clear Cart'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px' }}>
            {/* Cart Items List */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Procurement Line Items ({cartItems.length})
                </span>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                  Total Quantity: {cartCount} units
                </span>
              </div>

              <div style={{ divideY: '1px solid #f1f5f9' }}>
                {cartItems.map((item) => {
                  const itemProduct = item.product || {};
                  const itemBatch = item.batch || {};
                  const itemId = item._id;
                  const availableQty = itemBatch.quantity ?? item.maxQuantity ?? 1000;
                  const isUpdating = updatingItemId === itemId;
                  const isRemoving = removingItemId === itemId;

                  return (
                    <div
                      key={itemId}
                      style={{
                        padding: '20px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        opacity: isRemoving ? 0.4 : 1,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.72rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                              {itemProduct.dosageForm || 'Medicine'}
                            </span>
                            {itemBatch.batchNumber && (
                              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                Batch #{itemBatch.batchNumber}
                              </span>
                            )}
                            {itemProduct.category && (
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                • {itemProduct.category}
                              </span>
                            )}
                          </div>

                          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                            {itemProduct.name || 'Pharmaceutical Product'}
                          </h3>
                          {itemProduct.genericName && (
                            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 6px 0' }}>
                              Generic: <span style={{ fontWeight: '600', color: '#334155' }}>{itemProduct.genericName}</span>
                              {itemProduct.strength && ` (${itemProduct.strength})`}
                            </p>
                          )}

                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#64748b' }}>
                            {itemBatch.expiryDate && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                                Exp: {new Date(itemBatch.expiryDate).toLocaleDateString()}
                              </span>
                            )}
                            <span>
                              Available Stock: <strong style={{ color: availableQty < 20 ? '#d97706' : '#059669' }}>{availableQty} units</strong>
                            </span>
                          </div>
                        </div>

                        {/* Line Price Summary */}
                        <div style={{ textAlign: 'right', minWidth: '110px' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                            ${(item.totalPrice || (item.unitPrice * item.quantity)).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            ${item.unitPrice?.toFixed(2)} / unit
                          </div>
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px dashed #f1f5f9' }}>
                        {/* Stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Quantity:</span>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
                            <button
                              onClick={() => handleQtyChange(itemId, item.quantity - 1, availableQty)}
                              disabled={isUpdating || item.quantity <= 1}
                              style={{ border: 'none', background: '#f8fafc', padding: '6px 10px', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center' }}
                              title="Decrease Quantity"
                            >
                              <Minus style={{ width: '14px', height: '14px' }} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={availableQty}
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(itemId, Number(e.target.value) || 1, availableQty)}
                              disabled={isUpdating}
                              style={{ width: '54px', textAlign: 'center', border: 'none', outline: 'none', fontWeight: '800', fontSize: '0.88rem', color: '#0f172a' }}
                            />
                            <button
                              onClick={() => handleQtyChange(itemId, item.quantity + 1, availableQty)}
                              disabled={isUpdating || item.quantity >= availableQty}
                              style={{ border: 'none', background: '#f8fafc', padding: '6px 10px', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center' }}
                              title="Increase Quantity"
                            >
                              <Plus style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>
                          {isUpdating && <Loader2 style={{ width: '16px', height: '16px', color: '#059669', animation: 'spin 1s linear infinite' }} />}
                        </div>

                        {/* Remove Action */}
                        <button
                          onClick={() => handleRemoveItem(itemId)}
                          disabled={isRemoving}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {isRemoving ? (
                            <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          )}
                          Remove Item
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Procurement Summary & Checkout Handoff Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                  Order Financial Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#475569', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Line Items</span>
                    <strong style={{ color: '#0f172a' }}>{cartItems.length} items</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Procurement Units</span>
                    <strong style={{ color: '#0f172a' }}>{cartCount} units</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <strong style={{ color: '#0f172a' }}>${subtotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Compliance & Cold-Chain</span>
                    <span style={{ color: '#059669', fontWeight: '700' }}>INCLUDED</span>
                  </div>

                  <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>Total Amount</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#059669' }}>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Delivery Notes */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Delivery Instructions / Notes
                  </label>
                  <textarea
                    rows="2"
                    value={shippingNotes}
                    onChange={(e) => setShippingNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }}
                    placeholder="Enter special logistics requirements..."
                  />
                </div>

                {/* Checkout Handoff Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={submittingOrder || cartItems.length === 0}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    background: '#059669',
                    borderColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(5,150,105,0.2)',
                  }}
                >
                  {submittingOrder ? (
                    <>
                      <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                      Submitting Purchase Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 style={{ width: '18px', height: '18px' }} />
                      Place Purchase Order
                    </>
                  )}
                </button>

                <div style={{ marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                  <ShieldCheck style={{ width: '16px', height: '16px', color: '#059669', flexShrink: 0 }} />
                  <span>21 CFR Part 11 & GxP Compliant Pharmaceutical Order Processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyCartPage;
