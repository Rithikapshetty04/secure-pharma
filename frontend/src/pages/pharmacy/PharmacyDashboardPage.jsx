import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import StatusBadge from '../../components/StatusBadge';
import {
  Pill,
  ShoppingCart,
  ShoppingBag,
  ShieldCheck,
  Package,
  Clock,
  ArrowRight,
  RefreshCw,
  Building,
  Calendar,
  Eye,
  Search,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function PharmacyDashboardPage() {
  const { user } = useAuth();
  const { cartItems, cartCount } = useCart();
  const navigate = useNavigate();

  const [pharmacy, setPharmacy] = useState(null);
  const [stats, setStats] = useState({
    totalOrdersCount: 0,
    pendingOrdersCount: 0,
    completedOrdersCount: 0,
    receivedBatchesCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    availableProductsCount: 0,
    availableBatchesCount: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [recentlyReceivedBatches, setRecentlyReceivedBatches] = useState([]);
  const [availableBatchesPreview, setAvailableBatchesPreview] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPharmacyDashboard();
      if (res && res.success) {
        setPharmacy(res.pharmacy || user?.organization || null);
        setStats(res.stats || {});
        setRecentOrders(res.recentOrders || []);
        setRecentlyReceivedBatches(res.recentlyReceivedBatches || []);
        setAvailableBatchesPreview(res.availableBatchesPreview || []);
        setRecentActivity(res.recentActivity || []);
      } else {
        setError(res?.message || 'Failed to load pharmacy dashboard data.');
      }
    } catch (err) {
      console.error('Error fetching pharmacy dashboard:', err);
      setError(err.message || 'Server connection error loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                Dispensary Operations Portal
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Org: <strong style={{ color: '#0f172a' }}>{pharmacy?.name || user?.organization?.name || user?.name || 'Licensed Pharmacy'}</strong>
              </span>
              {pharmacy?.status && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    color: pharmacy.status === 'APPROVED' ? '#047857' : '#d97706',
                    background: pharmacy.status === 'APPROVED' ? '#d1fae5' : '#fef3c7',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {pharmacy.status}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0, tracking: '-0.02em' }}>
              Welcome, {user?.name || 'Pharmacist'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              Manage pharmaceutical procurement, dispensary cart orders, stock receipts, and batch QR verification.
            </p>
          </div>

          {/* Quick Actions Navigation Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/pharmacy/medicines"
              className="btn btn-primary btn-sm"
              style={{ padding: '9px 16px', fontSize: '0.85rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#059669', borderColor: '#059669' }}
            >
              <Pill style={{ width: '15px', height: '15px' }} />
              <span>Browse Medicines</span>
            </Link>

            <Link
              to="/pharmacy/cart"
              className="btn btn-secondary btn-sm"
              style={{ padding: '9px 14px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative' }}
            >
              <ShoppingCart style={{ width: '15px', height: '15px' }} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    borderRadius: '9999px',
                    padding: '1px 6px',
                    marginLeft: '4px',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/pharmacy/orders"
              className="btn btn-secondary btn-sm"
              style={{ padding: '9px 14px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ShoppingBag style={{ width: '15px', height: '15px' }} />
              <span>My Orders</span>
            </Link>

            <Link
              to="/verify"
              className="btn btn-secondary btn-sm"
              style={{ padding: '9px 14px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldCheck style={{ width: '15px', height: '15px' }} />
              <span>Verify QR</span>
            </Link>

            <button
              onClick={loadDashboardData}
              className="btn btn-secondary btn-sm"
              style={{ padding: '9px 12px' }}
              title="Refresh Dashboard"
            >
              <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div
            style={{
              padding: '16px 20px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#991b1b',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>{error}</span>
            </div>
            <button onClick={loadDashboardData} className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              Retry Connection
            </button>
          </div>
        )}

        {/* Real Overview Statistics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Pending / Active Orders
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706' }}>
              {loading ? '...' : stats.pendingOrdersCount || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>In processing / distributor dispatch</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Cart Items
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669' }}>
              {cartCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              {cartItems.length} distinct medicine line items
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Received Batches
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2563eb' }}>
              {loading ? '...' : stats.receivedBatchesCount || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Verified dispensary inventory lots</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Available Formularies
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pill style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#7c3aed' }}>
              {loading ? '...' : stats.availableBatchesCount || stats.availableProductsCount || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Batches ready for wholesale ordering</div>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <Link
            to="/pharmacy/medicines"
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pill style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>Order Medicines</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Browse catalog & add to dispensary cart</div>
            </div>
          </Link>

          <Link
            to="/pharmacy/received"
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>Received Batches</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Inspect dispensary inventory & status</div>
            </div>
          </Link>

          <Link
            to="/verify"
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>Verify Batch QR</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>9-Point authenticity verification check</div>
            </div>
          </Link>

          <Link
            to="/pharmacy/orders"
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>Order History</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Track procurement status & invoices</div>
            </div>
          </Link>
        </div>

        {/* 2-Column Operational Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '24px',
            marginBottom: '28px',
          }}
        >
          {/* Recent Pharmacy Purchase Orders */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag style={{ width: '20px', height: '20px', color: '#d97706' }} />
                  Recent Purchase Orders
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Active procurement orders placed with wholesale distributors
                </p>
              </div>

              <Link
                to="/pharmacy/orders"
                style={{ fontSize: '0.82rem', fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>View All Orders</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <RefreshCw style={{ width: '28px', height: '28px', color: '#d97706', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Loading recent orders...</div>
              </div>
            ) : recentOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <ShoppingBag style={{ width: '24px', height: '24px' }} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                  No Orders Placed Yet
                </h4>
                <p style={{ fontSize: '0.82rem', margin: '0 0 16px' }}>
                  Start ordering medicines from certified wholesale distributors to restock dispensary inventory.
                </p>
                <Link to="/pharmacy/medicines" className="btn btn-primary btn-sm" style={{ padding: '8px 18px', background: '#059669', borderColor: '#059669' }}>
                  + Order Medicines
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentOrders.map((order) => (
                  <div
                    key={order._id || order.orderId}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '0.9rem', color: '#2563eb' }}>
                          #{order.orderId}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', marginTop: '3px' }}>
                        Supplier: {order.distributorName || order.distributor?.name || 'Authorized Distributor'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        {order.items?.length || 0} line items • Volume: {order.totalQuantity?.toLocaleString() || 0} Units • ${order.totalAmount?.toLocaleString() || '0.00'}
                      </div>
                    </div>

                    <Link
                      to={`/pharmacy/orders/${order.orderId}`}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '5px 12px', fontSize: '0.8rem', fontWeight: '600', borderColor: '#cbd5e1', color: '#334155' }}
                    >
                      Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Received Dispensary Batches */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                  Recently Received Stock
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Batches confirmed into pharmacy dispensary custody
                </p>
              </div>

              <Link
                to="/pharmacy/received"
                style={{ fontSize: '0.82rem', fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Full Received Stock</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <RefreshCw style={{ width: '28px', height: '28px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Loading received batches...</div>
              </div>
            ) : recentlyReceivedBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Package style={{ width: '24px', height: '24px' }} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                  No Batches Received Yet
                </h4>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>
                  Pharmaceutical batches confirmed from distributors will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentlyReceivedBatches.map((b) => {
                  const isExpired = new Date(b.expiryDate) < new Date();
                  return (
                    <div
                      key={b._id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#0f172a' }}>
                          {b.product?.name || 'Formulated Drug'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          Lot <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2563eb' }}>#{b.batchNumber}</span> • Volume: {Number(b.quantity).toLocaleString()} {b.unit || 'Units'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                          Exp: <span style={{ fontWeight: '600', color: isExpired ? '#dc2626' : '#059669' }}>{new Date(b.expiryDate).toLocaleDateString()}</span> • Mfg: {b.manufacturer?.name || 'Verified Mfg'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link
                          to={`/verify/${b.batchNumber}`}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: '600', borderColor: '#059669', color: '#059669' }}
                        >
                          Verify QR
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Supply-Chain Activity Feed */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock style={{ width: '20px', height: '20px', color: '#7c3aed' }} />
                Dispensary Audit Activity
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                Chronological log of pharmacy receipts, order transfers, and blockchain proofs
              </p>
            </div>

            <Link
              to="/pharmacy/history"
              style={{ fontSize: '0.82rem', fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Full Audit History</span>
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RefreshCw style={{ width: '28px', height: '28px', color: '#7c3aed', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Loading audit activity...</div>
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Clock style={{ width: '24px', height: '24px' }} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                No Activity Logged Yet
              </h4>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>
                Custody events logged for your pharmacy dispensary will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
              {recentActivity.map((evt) => (
                <div
                  key={evt._id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={evt.eventType} />
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '0.85rem', color: '#2563eb' }}>
                        #{evt.batch?.batchNumber || 'Batch'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(evt.eventDate).toLocaleDateString(undefined, { dateStyle: 'short' })}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                    {evt.batch?.product?.name || 'Pharmaceutical Product'}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    {evt.fromOrganization?.name || 'Supplier'} → <strong style={{ color: '#059669' }}>{evt.toOrganization?.name || 'Pharmacy'}</strong>
                  </div>

                  {evt.transactionHash && (
                    <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck style={{ width: '13px', height: '13px' }} />
                      <span style={{ fontFamily: 'monospace' }}>
                        Hash: {evt.transactionHash.slice(0, 10)}...{evt.transactionHash.slice(-6)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
