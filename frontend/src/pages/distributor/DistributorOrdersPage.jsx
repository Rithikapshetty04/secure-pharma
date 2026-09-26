import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function DistributorOrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingCount: 0,
    confirmedCount: 0,
    shippedCount: 0,
    totalValue: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Order Modal / Detail View
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDistributorOrders({
        search,
        status: statusFilter,
        page,
        limit: 20,
      });

      if (res.success) {
        setOrders(res.orders || []);
        if (res.stats) setStats(res.stats);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else {
        setError(res.message || 'Failed to load pharmacy purchase orders.');
      }
    } catch (err) {
      console.error('Error fetching distributor orders:', err);
      setError(err.message || 'Network error while retrieving orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPage(1);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    setStatusError('');
    setStatusSuccess('');

    try {
      const res = await api.updateDistributorOrderStatus(selectedOrder.orderId || selectedOrder._id, newStatus);
      if (res.success) {
        setStatusSuccess(`✓ Order status updated to '${newStatus}'!`);
        setTimeout(() => {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
          loadOrders();
        }, 1000);
      } else {
        setStatusError(res.message || 'Failed to update order status.');
      }
    } catch (err) {
      setStatusError(err.message || 'Error updating order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFulfillTransfer = (order) => {
    const firstBatchId = order.items && order.items[0] ? order.items[0].batch : null;
    if (firstBatchId) {
      navigate(`/distributor/transfers/${firstBatchId}`);
    } else {
      navigate('/distributor/transfers');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🛍️</span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
              Pharmacy Purchase Orders & Fulfillment
            </h1>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginTop: '6px' }}>
            Review pharmacy procurement orders, confirm stock availability, allocate warehouse inventory, and execute custody dispatches.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/distributor/inventory" className="btn btn-outline">
            📦 Warehouse Inventory
          </Link>
          <Link to="/distributor/transfers" className="btn btn-primary">
            🚚 Transfer to Pharmacy →
          </Link>
        </div>
      </div>

      {/* Summary Statistics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #2563eb' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Total Orders
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
            {stats.totalOrders}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Pending Confirmation
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: stats.pendingCount > 0 ? '#b45309' : '#1e293b', marginTop: '4px' }}>
            {stats.pendingCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #6366f1' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Confirmed / Processing
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#6366f1', marginTop: '4px' }}>
            {stats.confirmedCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #059669' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Fulfilled / Shipped
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
            {stats.shippedCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #0f172a' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Total Procurement Value
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            ${stats.totalValue?.toLocaleString() || '0'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID, pharmacy name, or medicine..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                border: '1px solid #cbd5e1',
              }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                border: '1px solid #cbd5e1',
              }}
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PENDING">Pending Confirmation</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped / In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Search Orders
          </button>
          <button type="button" onClick={handleResetFilters} className="btn btn-outline btn-sm">
            Reset
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#b91c1c', fontSize: '0.88rem' }}>
            ⚠️ <strong>Error:</strong> {error}
          </div>
          <button onClick={loadOrders} className="btn btn-outline btn-sm" style={{ color: '#b91c1c', borderColor: '#fecaca' }}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>Loading pharmacy orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🛍️</span>
            <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '6px' }}>
              No pharmacy purchase orders found
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto 16px' }}>
              {search || statusFilter !== 'ALL'
                ? 'No purchase orders match your active search or filter criteria.'
                : 'When pharmacies submit medicine purchase orders, they will appear here for processing and fulfillment.'}
            </p>
            {(search || statusFilter !== 'ALL') && (
              <button onClick={handleResetFilters} className="btn btn-outline btn-sm">
                Clear Filters & Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>RECIPIENT PHARMACY</th>
                    <th>ITEMS & VOLUME</th>
                    <th>TOTAL VALUE</th>
                    <th>ORDER DATE</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id || o.orderId}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#2563eb' }}>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', padding: 0 }}
                        >
                          {o.orderId || `ORD-${o._id?.slice(-6)}`}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>
                          {o.pharmacyName || o.pharmacy?.name || 'Licensed Pharmacy'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {o.shippingAddress || 'Pharmacy Dispensary Depot'}
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong style={{ color: '#0f172a' }}>{o.items?.length || 1} medicine types</strong>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Total Qty: {o.totalQuantity?.toLocaleString() || 0} units
                        </div>
                      </td>
                      <td style={{ fontWeight: '700', color: '#0f172a' }}>
                        ${o.totalAmount?.toLocaleString() || '0.00'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                        {new Date(o.createdAt || o.orderDate || Date.now()).toLocaleDateString()}
                      </td>
                      <td>
                        <StatusBadge status={o.status || 'PENDING'} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            Inspect
                          </button>

                          {o.status === 'PENDING' && (
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            >
                              Review & Confirm
                            </button>
                          )}

                          {(o.status === 'CONFIRMED' || o.status === 'PROCESSING') && (
                            <button
                              onClick={() => handleFulfillTransfer(o)}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            >
                              Transfer Batch →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ color: 'var(--text-dim)' }}>
                  Page {page} of {totalPages} ({total} purchase orders)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="btn btn-outline btn-sm"
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="btn btn-outline btn-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: '32px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>
                    Order #{selectedOrder.orderId || selectedOrder._id}
                  </h2>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
                  Submitted by: <strong>{selectedOrder.pharmacyName || 'Pharmacy Dispensary'}</strong> on {new Date(selectedOrder.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-dim)' }}
              >
                ✕
              </button>
            </div>

            {statusError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px' }}>
                ⚠️ {statusError}
              </div>
            )}

            {statusSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '6px', color: '#047857', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '600' }}>
                {statusSuccess}
              </div>
            )}

            {/* Order Items Table */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
                📦 Requested Formulary Items
              </h3>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>MEDICINE</th>
                      <th>ALLOCATED BATCH LOT #</th>
                      <th>REQUESTED QTY</th>
                      <th>UNIT PRICE</th>
                      <th style={{ textAlign: 'right' }}>LINE TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={item._id || idx}>
                        <td>
                          <div style={{ fontWeight: '700', color: '#1e3a8a' }}>{item.productName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{item.productCode}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                          {item.batchNumber ? (
                            <Link to={`/distributor/batches/${item.batch || ''}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                              {item.batchNumber}
                            </Link>
                          ) : (
                            <span style={{ color: '#d97706', fontSize: '0.78rem' }}>Pending Allocation</span>
                          )}
                        </td>
                        <td>
                          <strong>{item.quantity?.toLocaleString()}</strong> {item.unit || 'Units'}
                        </td>
                        <td>${item.unitPrice || 45}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700' }}>
                          ${item.totalPrice ? item.totalPrice.toLocaleString() : (item.quantity * 45).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery Specifications */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', display: 'block', fontWeight: '700' }}>SHIPPING DESTINATION</span>
                <strong>{selectedOrder.shippingAddress || 'Main Pharmacy Depot'}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', display: 'block', fontWeight: '700' }}>TOTAL ORDER AMOUNT</span>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                  ${selectedOrder.totalAmount?.toLocaleString() || '0.00'}
                </strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedOrder.status === 'PENDING' && (
                  <>
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('CONFIRMED')}
                      className="btn btn-primary btn-sm"
                    >
                      ✓ Confirm Order
                    </button>
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('REJECTED')}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#dc2626', borderColor: '#fecaca' }}
                    >
                      ✕ Reject Order
                    </button>
                  </>
                )}

                {selectedOrder.status === 'CONFIRMED' && (
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus('PROCESSING')}
                    className="btn btn-primary btn-sm"
                  >
                    ⚙️ Mark Processing
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleFulfillTransfer(selectedOrder)}
                  className="btn btn-primary btn-sm"
                >
                  🚚 Transfer Allocated Batch to Pharmacy →
                </button>
                <button onClick={() => setSelectedOrder(null)} className="btn btn-outline btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
