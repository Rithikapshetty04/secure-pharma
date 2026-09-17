import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import StatusBadge from '../../components/StatusBadge';

export default function PharmacyDashboardPage() {
  const { user } = useAuth();
  const { cartCount, orders } = useCart();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getBatches({ limit: 50 });
      if (res.success) {
        setBatches(res.batches);
      }
    } catch (err) {
      console.error('Error loading pharmacy dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableMedicinesCount = batches.filter(
    (b) => b.status !== 'EXPIRED' && b.status !== 'RECALLED'
  ).length;

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'PROCESSING' || o.status === 'SHIPPED'
  ).length;

  const receivedOrdersCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const recentOrders = orders.slice(0, 5);

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
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
              🏥 Pharmacy Dispensary Dashboard
            </h1>
            <StatusBadge status="PHARMACY" />
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>
            {user?.organization?.name || user?.name} • Medicine Requisitions, Cart & QR Verification
          </p>
        </div>

        {/* Action Shortcuts */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/pharmacy/medicines" className="btn btn-primary btn-sm">
            💊 Browse Medicines
          </Link>
          <Link to="/pharmacy/cart" className="btn btn-outline btn-sm">
            🛒 View Cart ({cartCount})
          </Link>
          <Link to="/verify" className="btn btn-outline btn-sm">
            🔍 Verify QR
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#0284c7' }}>
            {loading ? '...' : availableMedicinesCount}
          </div>
          <div className="stat-label">Available Medicines</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Ready for dispensary ordering
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#2563eb' }}>
            {cartCount}
          </div>
          <div className="stat-label">Cart Items</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Items in requisition queue
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#d97706' }}>
            {pendingOrdersCount}
          </div>
          <div className="stat-label">Pending Orders</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            In transit from distributors
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#059669' }}>
            {receivedOrdersCount}
          </div>
          <div className="stat-label">Received Orders</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Delivered to dispensary vault
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff', marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#1e3a8a' }}>📋 Recent Requisition Orders</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Direct wholesale supply chain orders placed with distributors
            </p>
          </div>
          <Link to="/pharmacy/orders" className="btn btn-outline btn-sm">
            All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
            No orders placed yet.{' '}
            <Link to="/pharmacy/medicines" style={{ color: '#2563eb', fontWeight: '600' }}>
              Browse medicines & add to cart
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>ORDER DATE</th>
                  <th>SUPPLIER</th>
                  <th>ITEMS</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => (
                  <tr key={ord.orderId || ord._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      #{ord.orderId || ord._id}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(ord.orderDate || ord.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{ord.supplierName || 'Wholesale Distributor'}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {ord.items?.length || 0} Products ({ord.totalItems} Units)
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
                        View Order →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions Navigation Grid */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#1e3a8a' }}>
          ⚡ Pharmacy Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <Link
            to="/pharmacy/medicines"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>💊</span>
            <strong>Browse Medicines</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Order verified batches</span>
          </Link>

          <Link
            to="/pharmacy/cart"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>🛒</span>
            <strong>View Cart ({cartCount})</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Review & checkout</span>
          </Link>

          <Link
            to="/pharmacy/orders"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>📋</span>
            <strong>My Orders</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Track shipments & status</span>
          </Link>

          <Link
            to="/verify"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>🔍</span>
            <strong>Verify QR</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Scan & verify at point-of-sale</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
