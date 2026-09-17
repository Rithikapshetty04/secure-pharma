import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import QRCodeGenerator from '../../components/QRCodeGenerator';

export default function ManufacturerBatchDetailPage() {
  const { batchId } = useParams();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  const [batch, setBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBatchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getBatchById(batchId);
      if (res.success && res.batch) {
        setBatch(res.batch);
        setEvents(res.events || []);
      } else {
        setError(res.message || 'Batch not found.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to batch ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatchDetails();
  }, [batchId]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="live-dot" style={{ width: '20px', height: '20px', margin: '0 auto 16px' }}></div>
        <div style={{ color: '#2563eb', fontWeight: '700' }}>Loading batch specification & provenance...</div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
          <h3>{error || 'Batch Not Found'}</h3>
          <div style={{ marginTop: '16px' }}>
            <Link to="/manufacturer/batches" className="btn btn-outline btn-sm">
              ← Return to Batches List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Top Breadcrumb & Success Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <Link
          to="/manufacturer/batches"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
        >
          ← Back to Batches
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to={`/manufacturer/transfers/${batch._id}`} className="btn btn-primary btn-sm">
            🚚 Transfer Batch
          </Link>
          <Link to={`/verify/${batch.qrIdentifier || batch.batchNumber}`} className="btn btn-outline btn-sm">
            🔍 Verify Authenticity
          </Link>
        </div>
      </div>

      {justCreated && (
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
          <span>Batch #{batch.batchNumber} has been successfully minted and registered with cryptographic QR seal!</span>
        </div>
      )}

      {/* Main Card Header */}
      <div className="glass-card" style={{ padding: '28px', background: '#ffffff', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1d4ed8', letterSpacing: '0.05em', marginBottom: '4px' }}>
              SERIALIZED PRODUCTION BATCH
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              {batch.product?.name || 'Pharmaceutical Formulation'}
            </h1>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              Lot #{batch.batchNumber} • GTIN/NDC: {batch.product?.productCode || 'N/A'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StatusBadge status={batch.status} />
          </div>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>GENERIC / ACTIVE FORM</span>
            <strong>{batch.product?.genericName || 'Standard Formulation'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>MANUFACTURER</span>
            <strong>{batch.manufacturer?.name || 'Verified Manufacturer'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>BATCH QUANTITY</span>
            <strong>{batch.quantity?.toLocaleString()} {batch.unit}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>MANUFACTURING DATE</span>
            <strong>{new Date(batch.manufacturingDate).toLocaleDateString()}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>EXPIRATION DATE</span>
            <strong style={{ color: new Date(batch.expiryDate) < new Date() ? '#dc2626' : '#059669' }}>
              {new Date(batch.expiryDate).toLocaleDateString()}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>STORAGE CRITERIA</span>
            <span style={{ color: 'var(--text-muted)' }}>{batch.storageRequirements}</span>
          </div>
        </div>
      </div>

      {/* Dual Grid: QR Code + Supply Chain Timeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}
      >
        {/* QR Section */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#1e3a8a' }}>
            📱 QR Authenticity Seal
          </h3>
          <QRCodeGenerator
            identifier={batch.qrIdentifier || batch.batchNumber}
            batchNumber={batch.batchNumber}
            productName={batch.product?.name}
            size={220}
          />
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Link
              to={`/verify/${batch.qrIdentifier || batch.batchNumber}`}
              className="btn btn-outline btn-sm"
              style={{ padding: '6px 14px' }}
            >
              🔍 Verify QR
            </Link>
            <Link
              to={`/manufacturer/transfers/${batch._id}`}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 14px' }}
            >
              🚚 Transfer Batch
            </Link>
          </div>
        </div>

        {/* Supply Chain Timeline Section */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#1e3a8a' }}>
              ⛓️ Supply Chain Timeline
            </h3>
            <span className="badge badge-info">{events.length} Checkpoints</span>
          </div>

          <Timeline events={events} />
        </div>
      </div>
    </div>
  );
}
