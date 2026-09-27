import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../../api';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  Package,
  Calendar,
  Pill,
  RefreshCw,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  Truck,
} from 'lucide-react';

const PharmacyOrderDetailsPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const isNewOrder = location.state?.newOrderSuccess;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOrderById(orderId);
      if (res && res.success && res.order) {
        setOrder(res.order);
      } else {
        setError(res?.message || 'Purchase order not found or access denied.');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Server error loading purchase order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    setCancelError('');
    try {
      const res = await api.cancelOrder(order._id || order.orderId);
      if (res && res.success) {
        setCancelSuccessMsg(`Purchase Order #${order.orderId} has been successfully cancelled.`);
        setShowCancelModal(false);
        fetchOrderDetails();
      } else {
        setCancelError(res?.message || 'Failed to cancel purchase order.');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setCancelError(err.message || 'Failed to cancel purchase order.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
      case 'FULFILLED':
      case 'COMPLETED':
        return (
          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.78rem', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 style={{ width: '14px', height: '14px' }} />
            Delivered
          </span>
        );
      case 'SHIPPED':
        return (
          <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.78rem', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Truck style={{ width: '14px', height: '14px' }} />
            In Transit / Shipped
          </span>
        );
      case 'PROCESSING':
      case 'CONFIRMED':
        return (
          <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.78rem', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock style={{ width: '14px', height: '14px' }} />
            Processing Supplier Dispatch
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.78rem', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <XCircle style={{ width: '14px', height: '14px' }} />
            {status}
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span style={{ background: '#fffbebfb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.78rem', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock style={{ width: '14px', height: '14px' }} />
            Pending Distributor Review
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <Loader2 style={{ width: '40px', height: '40px', color: '#059669', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '1rem', fontWeight: '600' }}>Loading Order Details from Database...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '60px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px 32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <ShoppingBag style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Order Not Found or Access Denied</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '8px', marginBottom: '24px', lineHeight: '1.5' }}>
            {error || `Unable to locate purchase order records for identifier: ${orderId}`}
          </p>
          <Link
            to="/pharmacy/orders"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.88rem', background: '#059669', borderColor: '#059669' }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Purchase Orders
          </Link>
        </div>
      </div>
    );
  }

  // Supply chain progression steps
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
  const steps = [
    { title: 'Order Submitted', done: true, time: new Date(order.createdAt).toLocaleString() },
    { title: 'Supplier Confirmation', done: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status), time: order.status !== 'PENDING' ? 'Confirmed by Distributor' : 'Awaiting Review' },
    { title: 'Dispatched / In Transit', done: ['SHIPPED', 'DELIVERED'].includes(order.status), time: ['SHIPPED', 'DELIVERED'].includes(order.status) ? 'Logistics En Route' : 'Pending Fulfillment' },
    { title: 'Pharmacy Receipt', done: ['DELIVERED', 'COMPLETED'].includes(order.status), time: ['DELIVERED', 'COMPLETED'].includes(order.status) ? 'Received & Verified' : 'Pending Arrival' },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Navigation & Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              to="/pharmacy/orders"
              className="btn btn-secondary"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}
              title="Back to Orders List"
            >
              <ArrowLeft style={{ width: '18px', height: '18px' }} />
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0, fontFamily: 'monospace' }}>
                  #{order.orderId}
                </h1>
                {getStatusBadge(order.status)}
              </div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchOrderDetails()}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              Sync Status
            </button>
            {order.status === 'PENDING' && (
              <button
                onClick={() => { setShowCancelModal(true); setCancelError(''); }}
                className="btn btn-danger"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <XCircle style={{ width: '15px', height: '15px' }} />
                Cancel Order
              </button>
            )}
            <Link
              to="/pharmacy/medicines"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.88rem', background: '#059669', borderColor: '#059669' }}
            >
              <Pill style={{ width: '16px', height: '16px' }} />
              Order More
            </Link>
          </div>
        </div>

        {/* New Order Success Banner */}
        {isNewOrder && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#047857' }}>
            <CheckCircle2 style={{ width: '24px', height: '24px', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>Purchase Order Submitted & Saved to Database</strong>
              <span style={{ fontSize: '0.85rem', color: '#065f46' }}>
                Your order #{order.orderId} has been submitted to wholesale distributors for review and cold-chain fulfillment.
              </span>
            </div>
          </div>
        )}

        {/* Cancel Success Banner */}
        {cancelSuccessMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#b91c1c' }}>
            <XCircle style={{ width: '24px', height: '24px', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>Order Cancelled</strong>
              <span style={{ fontSize: '0.85rem', color: '#991b1b' }}>{cancelSuccessMsg}</span>
            </div>
          </div>
        )}

        {/* Cancel Order Confirmation Modal */}
        {showCancelModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
                Cancel Purchase Order #{order.orderId}?
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                Are you sure you want to cancel this order? The distributor will be notified that this order request has been revoked.
              </p>

              {cancelError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '0.82rem', color: '#b91c1c' }}>
                  {cancelError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="btn btn-secondary"
                  disabled={cancelling}
                >
                  Close
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="btn btn-danger"
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fulfillment Timeline Progress */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock style={{ width: '18px', height: '18px', color: '#059669' }} />
            Order Fulfillment Progress
          </h3>

          {isCancelled ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#b91c1c' }}>
              <XCircle style={{ width: '24px', height: '24px' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>Order Status: {order.status}</strong>
                <span style={{ fontSize: '0.82rem' }}>This order was cancelled on {new Date(order.updatedAt || order.createdAt).toLocaleString()}.</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {steps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: step.done ? '#f0fdf4' : '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: step.done ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step.done ? '#059669' : '#cbd5e1', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    {step.done ? <CheckCircle2 style={{ width: '16px', height: '16px' }} /> : <Clock style={{ width: '16px', height: '16px' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: step.done ? '#0f172a' : '#64748b' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      {step.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px' }}>
          {/* Line Items List */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ordered Pharmaceutical Items ({order.items?.length || 0})
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                Total Quantity: {order.totalQuantity} units
              </span>
            </div>

            <div style={{ divideY: '1px solid #f1f5f9' }}>
              {order.items?.map((item, idx) => {
                const hasBatchNum = item.batchNumber && item.batchNumber !== 'UNASSIGNED';
                return (
                  <div key={idx} style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.72rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                            {item.productCode || 'PC-MED'}
                          </span>
                          {hasBatchNum && (
                            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                              Batch #{item.batchNumber}
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                          {item.productName}
                        </h4>

                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          Ordered Quantity: <strong style={{ color: '#0f172a' }}>{item.quantity} {item.unit || 'Units'}</strong>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div style={{ textAlign: 'right', minWidth: '110px' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                          ${(item.totalPrice || (item.unitPrice * item.quantity)).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          ${item.unitPrice?.toFixed(2)} / unit
                        </div>
                      </div>
                    </div>

                    {/* Batch Actions link if batch exists */}
                    {hasBatchNum && (
                      <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px dashed #f1f5f9' }}>
                        <Link
                          to={`/verify/${encodeURIComponent(item.batchNumber)}`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#047857' }}
                        >
                          <ShieldCheck style={{ width: '14px', height: '14px', color: '#059669' }} />
                          Verify Public QR / Batch
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supplier & Financial Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Supplier Information */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 style={{ width: '16px', height: '16px', color: '#059669' }} />
                Distributor / Supplier
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>
                  {order.distributorName || order.distributor?.name || 'Authorized Wholesale Distributor'}
                </div>
                {order.distributor?.contactEmail && (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>
                    {order.distributor.contactEmail}
                  </div>
                )}
                {order.distributor?.address && (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>
                    {order.distributor.address}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Destination */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck style={{ width: '16px', height: '16px', color: '#059669' }} />
                Delivery Destination
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>
                <div style={{ fontWeight: '700', color: '#0f172a' }}>
                  {order.pharmacyName || 'Pharmacy Dispensary'}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>
                  {order.shippingAddress || 'Registered Pharmacy Facility Address'}
                </div>
                {order.notes && (
                  <div style={{ marginTop: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569' }}>
                    <strong>Logistics Notes:</strong> {order.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                Order Cost Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Line Items ({order.items?.length || 0})</span>
                  <strong style={{ color: '#0f172a' }}>${(order.totalAmount || 0).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Quantity</span>
                  <strong style={{ color: '#0f172a' }}>{order.totalQuantity} units</strong>
                </div>
                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>Total Amount</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#059669' }}>
                    ${(order.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyOrderDetailsPage;
