import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import StatusBadge from '../../components/StatusBadge';

export default function DistributorOrdersPage() {
  const { orders, updateOrderStatus } = useCart();
  const [statusFilter, setStatusFilter] = useState('');

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  const handleStatusUpdate = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
            📋 Pharmacy Fulfillment Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Review and dispatch medicine requisitions from licensed pharmacy dispensaries
          </p>
        </div>

        <Link to="/distributor/transfers" className="btn btn-primary btn-sm">
          🚚 Dispatch Custody Transfer
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e3a8a' }}>
            Filter Requisitions by Status
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Orders ({orders.length})</option>
            <option value="PENDING">PENDING</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No pharmacy orders found in queue.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredOrders.map((ord) => (
              <div
                key={ord.orderId || ord._id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '14px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: '#1e3a8a', fontFamily: 'var(--font-mono)' }}>
                      Order #{ord.orderId || ord._id}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '12px' }}>
                      Placed: {new Date(ord.orderDate || ord.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status={ord.status} />

                    {/* Quick status transitions for distributor */}
                    {ord.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusUpdate(ord.orderId || ord._id, 'ACCEPTED')}
                        className="btn btn-outline btn-sm"
                        style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                      >
                        ✓ Accept Order
                      </button>
                    )}
                    {ord.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleStatusUpdate(ord.orderId || ord._id, 'SHIPPED')}
                        className="btn btn-primary btn-sm"
                      >
                        🚚 Mark as Shipped
                      </button>
                    )}
                    {ord.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleStatusUpdate(ord.orderId || ord._id, 'DELIVERED')}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#059669', borderColor: '#a7f3d0' }}
                      >
                        ✓ Confirm Delivered
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>DESTINATION</span>
                    <strong>{ord.deliveryAddress || 'Pharmacy Vault'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>ITEMS ORDERED</span>
                    <strong>{ord.items?.length || 0} Products ({ord.totalItems} Units total)</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>DISPATCH ACTION</span>
                    <Link
                      to={`/distributor/transfers`}
                      style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}
                    >
                      Initiate Custody Transfer →
                    </Link>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div style={{ marginTop: '14px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>BATCH LOT #</th>
                        <th>ORDERED QUANTITY</th>
                        <th style={{ textAlign: 'right' }}>VERIFY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ord.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{item.productName}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{item.genericName}</div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{item.batchNumber}</td>
                          <td>{item.quantity?.toLocaleString()} {item.unit || 'Units'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <Link
                              to={`/verify/${item.qrIdentifier || item.batchNumber}`}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                            >
                              Verify Batch
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
