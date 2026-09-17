import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import StatusBadge from '../../components/StatusBadge';

export default function PharmacyOrderDetailPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const justPlaced = searchParams.get('placed') === 'true';

  const { orders } = useCart();
  const order = orders.find((o) => o.orderId === orderId || o._id === orderId);

  if (!order) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
          <h3>Order #{orderId} Not Found</h3>
          <div style={{ marginTop: '16px' }}>
            <Link to="/pharmacy/orders" className="btn btn-outline btn-sm">
              ← Return to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/pharmacy/orders"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
        >
          ← Back to All Orders
        </Link>
      </div>

      {justPlaced && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            color: '#065f46',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>✓</span>
          <span>Order placed successfully! Requisition transmitted to wholesale distributor.</span>
        </div>
      )}

      {/* Order Header Card */}
      <div className="glass-card" style={{ padding: '28px', background: '#ffffff', marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1d4ed8', letterSpacing: '0.05em', marginBottom: '4px' }}>
              PHARMACY REQUISITION ORDER
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
              #{order.orderId || order._id}
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Order Date: {new Date(order.orderDate || order.createdAt).toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>WHOLESALE SUPPLIER</span>
            <strong>{order.supplierName || 'Wholesale Logistics'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>DESTINATION ADDRESS</span>
            <strong>{order.deliveryAddress}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>TOTAL UNITS</span>
            <strong style={{ color: '#1d4ed8' }}>{order.totalItems?.toLocaleString()} Units</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>SPECIAL INSTRUCTIONS</span>
            <span style={{ color: 'var(--text-muted)' }}>{order.notes || 'Standard requisition'}</span>
          </div>
        </div>
      </div>

      {/* Ordered Items Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        <h3 style={{ fontSize: '1.15rem', color: '#1e3a8a', marginBottom: '16px' }}>
          📦 Requisitioned Medicine Formulations & Batches
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>MEDICINE</th>
                <th>BATCH LOT #</th>
                <th>MANUFACTURER</th>
                <th>ORDERED QTY</th>
                <th>EXPIRY DATE</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <strong style={{ color: 'var(--text-heading)' }}>{item.productName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.genericName}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                    {item.batchNumber}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{item.manufacturerName}</td>
                  <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                    {item.quantity?.toLocaleString()} {item.unit || 'Units'}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#059669' }}>
                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Active'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <Link
                        to={`/pharmacy/batches/${item.batchId || item.batchNumber}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        View Batch
                      </Link>
                      <Link
                        to={`/verify/${item.qrIdentifier || item.batchNumber}`}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Verify QR
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
