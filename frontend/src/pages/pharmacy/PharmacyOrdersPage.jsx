import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import StatusBadge from '../../components/StatusBadge';

export default function PharmacyOrdersPage() {
  const { orders } = useCart();
  const [statusFilter, setStatusFilter] = useState('');

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

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
            📋 Pharmacy Requisition Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Track medicine batch delivery status, wholesale fulfillment, and receipt confirmations
          </p>
        </div>

        <Link to="/pharmacy/medicines" className="btn btn-primary btn-sm">
          ➕ New Medicine Requisition
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e3a8a' }}>
            Filter Requisition Orders
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
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No requisition orders found.{' '}
            <Link to="/pharmacy/medicines" style={{ color: '#2563eb', fontWeight: '600' }}>
              Browse formulary medicines
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>DATE</th>
                  <th>SUPPLIER / DISTRIBUTOR</th>
                  <th>LINE ITEMS</th>
                  <th>TOTAL QUANTITY</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => (
                  <tr key={ord.orderId || ord._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      #{ord.orderId || ord._id}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(ord.orderDate || ord.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{ord.supplierName || 'Wholesale Distributor'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{ord.items?.length || 0} Products</td>
                    <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {ord.totalItems?.toLocaleString()} Units
                    </td>
                    <td>
                      <StatusBadge status={ord.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/pharmacy/orders/${ord.orderId || ord._id}`}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
