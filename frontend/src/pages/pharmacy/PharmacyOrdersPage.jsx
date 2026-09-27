import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  Plus,
  RefreshCw,
  XCircle,
  Loader2,
  AlertCircle,
  Package,
} from 'lucide-react';

const PharmacyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState(null);
  const [cancelError, setCancelError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOrders({
        status: statusFilter,
        search: search.trim(),
      });

      if (res && res.success) {
        setOrders(res.orders || []);
      } else {
        setError(res?.message || 'Failed to fetch pharmacy purchase orders.');
      }
    } catch (err) {
      console.error('Error fetching pharmacy orders:', err);
      setError(err.message || 'Server connection error loading orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrderToCancel) return;
    const orderIdToCancel = selectedOrderToCancel._id || selectedOrderToCancel.orderId;
    setCancellingOrderId(orderIdToCancel);
    setCancelError('');
    try {
      const res = await api.cancelOrder(orderIdToCancel);
      if (res && res.success) {
        setShowCancelModal(false);
        setSelectedOrderToCancel(null);
        fetchOrders();
      } else {
        setCancelError(res?.message || 'Failed to cancel purchase order.');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setCancelError(err.message || 'Failed to cancel purchase order.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Stats calculation
  const totalOrders = orders.length;
  const pendingCount = orders.filter((o) => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length;
  const deliveredCount = orders.filter((o) => ['DELIVERED', 'FULFILLED', 'COMPLETED'].includes(o.status)).length;
  const cancelledCount = orders.filter((o) => ['CANCELLED', 'REJECTED'].includes(o.status)).length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
      case 'FULFILLED':
      case 'COMPLETED':
        return (
          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 style={{ width: '13px', height: '13px' }} />
            Delivered
          </span>
        );
      case 'SHIPPED':
        return (
          <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Package style={{ width: '13px', height: '13px' }} />
            Shipped
          </span>
        );
      case 'PROCESSING':
      case 'CONFIRMED':
        return (
          <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock style={{ width: '13px', height: '13px' }} />
            {status}
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle style={{ width: '13px', height: '13px' }} />
            {status}
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span style={{ background: '#fffbebfb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock style={{ width: '13px', height: '13px' }} />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                Order Management
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Authenticated Pharmacy Procurement
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Pharmacy Purchase Orders
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              Track batch orders, verify distributor fulfillment, and manage pharmaceutical procurement requests.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => fetchOrders()}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              title="Refresh Orders"
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              Refresh
            </button>
            <Link
              to="/pharmacy/medicines"
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '0.88rem',
                fontWeight: '700',
                background: '#059669',
                borderColor: '#059669',
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              New Purchase Order
            </Link>
          </div>
        </div>

        {/* Stats Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Total Orders</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>{totalOrders}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fffbebfb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>In Fulfillment</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>{pendingCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Delivered</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>{deliveredCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Cancelled</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>{cancelledCount}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search style={{ width: '18px', height: '18px', color: '#94a3b8', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Order ID, medicine name, batch number..."
                style={{ width: '100%', padding: '9px 14px 9px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: '#ffffff' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', fontSize: '0.88rem' }}>
            <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && selectedOrderToCancel && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
                Cancel Order #{selectedOrderToCancel.orderId}?
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                Are you sure you want to cancel this pending purchase order? Once cancelled, the supplier will not process this request.
              </p>

              {cancelError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '0.82rem', color: '#b91c1c' }}>
                  {cancelError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => { setShowCancelModal(false); setSelectedOrderToCancel(null); }}
                  className="btn btn-secondary"
                  disabled={!!cancellingOrderId}
                >
                  Close
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="btn btn-danger"
                  disabled={!!cancellingOrderId}
                >
                  {cancellingOrderId ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table Container */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 style={{ width: '36px', height: '36px', color: '#059669', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.92rem', fontWeight: '600' }}>Loading purchase orders from database...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <ShoppingBag style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>No Orders Found</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 auto 20px', maxWidth: '420px', lineHeight: '1.5' }}>
                {search || statusFilter !== 'ALL'
                  ? 'No purchase orders match your search filters.'
                  : 'You have not placed any pharmaceutical procurement orders yet.'}
              </p>
              <Link
                to="/pharmacy/medicines"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.88rem', background: '#059669', borderColor: '#059669' }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Browse Medicine Catalog
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '14px 18px' }}>Order ID</th>
                    <th style={{ padding: '14px 18px' }}>Date</th>
                    <th style={{ padding: '14px 18px' }}>Supplier / Distributor</th>
                    <th style={{ padding: '14px 18px' }}>Line Items</th>
                    <th style={{ padding: '14px 18px' }}>Total Qty</th>
                    <th style={{ padding: '14px 18px' }}>Total Amount</th>
                    <th style={{ padding: '14px 18px' }}>Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ divideY: '1px solid #f1f5f9' }}>
                  {orders.map((order) => {
                    const isPending = order.status === 'PENDING';
                    return (
                      <tr key={order._id || order.orderId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 18px', fontFamily: 'monospace', fontWeight: '800', color: '#059669' }}>
                          #{order.orderId}
                        </td>
                        <td style={{ padding: '16px 18px', color: '#64748b', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '16px 18px', color: '#334155', fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 style={{ width: '14px', height: '14px', color: '#64748b' }} />
                            {order.distributorName || order.distributor?.name || 'Wholesale Distributor'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {order.items?.map((item, idx) => (
                              <div key={idx} style={{ fontSize: '0.82rem', color: '#1e293b' }}>
                                <strong style={{ color: '#0f172a' }}>{item.productName}</strong>
                                {item.batchNumber && (
                                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b', marginLeft: '6px' }}>
                                    (Batch #{item.batchNumber} × {item.quantity})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '16px 18px', fontWeight: '700', color: '#334155' }}>
                          {order.totalQuantity} units
                        </td>
                        <td style={{ padding: '16px 18px', fontWeight: '800', color: '#0f172a' }}>
                          ${order.totalAmount?.toFixed(2)}
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          {getStatusBadge(order.status)}
                        </td>
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {isPending && (
                              <button
                                onClick={() => { setSelectedOrderToCancel(order); setShowCancelModal(true); setCancelError(''); }}
                                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            )}
                            <Link
                              to={`/pharmacy/orders/${order.orderId || order._id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700' }}
                            >
                              View Details
                              <ArrowRight style={{ width: '13px', height: '13px' }} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyOrdersPage;
