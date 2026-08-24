import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.getProductById(id);
        if (res.success) {
          setProduct(res.product);
          setBatches(res.batches);
        } else {
          setError(res.message || 'Product not found.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--accent-cyan)' }}>
        Loading drug formulary record...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', textAlign: 'center' }}>
        <h3 style={{ color: '#ef4444' }}>Drug Record Not Found</h3>
        <p style={{ color: 'var(--text-muted)' }}>{error || 'Unable to locate formulary product.'}</p>
        <Link to="/products" className="btn btn-outline btn-sm" style={{ marginTop: '16px' }}>
          ← Back to Formulary
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto 80px', padding: '0 20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/products" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '0.85rem' }}>
          ← Back to Formulary Catalog
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>{product.name}</h1>
              <StatusBadge status={product.status} />
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
              Product Code: <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{product.productCode}</strong> • Category: <strong style={{ color: '#a855f7' }}>{product.category}</strong>
            </div>
          </div>

          <Link to={`/batches?productId=${product._id}`} className="btn btn-primary btn-sm">
            📦 View / Mint Batches
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '20px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
        }}>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>GENERIC NAME</span>
            <strong>{product.genericName || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>BRAND NAME</span>
            <strong>{product.brandName || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>DOSAGE FORM</span>
            <strong>{product.dosageForm}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>STRENGTH</span>
            <strong>{product.strength || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>PACKAGE SIZE</span>
            <strong>{product.packageSize || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>REGULATORY APPROVAL #</span>
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{product.regulatoryApprovalNumber || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>MANUFACTURER</span>
            <strong>{product.manufacturer?.name || 'Verified Manufacturer'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>STORAGE SPECS</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>{product.storageRequirements}</strong>
          </div>
        </div>
      </div>

      {/* Associated Batches */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>📦 Production Batches for this Formulation</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Serialized lots registered on ledger ({batches.length} total)
            </p>
          </div>
        </div>

        {batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
            No production batches minted for this product yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>BATCH NUMBER</th>
                  <th>QTY</th>
                  <th>MFG DATE</th>
                  <th>EXPIRY DATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>VERIFICATION</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#fff' }}>
                      {b.batchNumber}
                    </td>
                    <td>{b.quantity?.toLocaleString()} {b.unit}</td>
                    <td>{new Date(b.manufacturingDate).toLocaleDateString()}</td>
                    <td style={{ color: new Date(b.expiryDate) < new Date() ? '#ef4444' : '#10b981' }}>
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/verify/${b.qrIdentifier || b.batchNumber}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Verify Provenance →
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
