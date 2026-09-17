import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import QRCodeGenerator from '../../components/QRCodeGenerator';

export default function PharmacyBatchDetailPage() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBatch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getBatchById(batchId);
        if (res.success && res.batch) {
          setBatch(res.batch);
          setEvents(res.events || []);
        } else {
          setError(res.message || 'Batch details not found.');
        }
      } catch (err) {
        setError(err.message || 'Error fetching batch information.');
      } finally {
        setLoading(false);
      }
    };

    loadBatch();
  }, [batchId]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="live-dot" style={{ width: '20px', height: '20px', margin: '0 auto 16px' }}></div>
        <div style={{ color: '#2563eb', fontWeight: '700' }}>Loading medicine batch record...</div>
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
            <Link to="/pharmacy/received" className="btn btn-outline btn-sm">
              ← Return to Received Medicines
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <Link
          to="/pharmacy/received"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
        >
          ← Back to Received Medicines
        </Link>
        <Link
          to={`/verify/${batch.qrIdentifier || batch.batchNumber}`}
          className="btn btn-primary btn-sm"
        >
          🔍 Full 9-Point Verification Scan →
        </Link>
      </div>

      {/* Main Details Card */}
      <div className="glass-card" style={{ padding: '28px', background: '#ffffff', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1d4ed8', letterSpacing: '0.05em', marginBottom: '4px' }}>
              DISPENSARY FORMULARY RECORD
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              {batch.product?.name || 'Pharmaceutical Formulation'}
            </h1>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              Lot #{batch.batchNumber} • NDC/GTIN: {batch.product?.productCode || 'N/A'}
            </div>
          </div>

          <StatusBadge status={batch.status} />
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
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>GENERIC NAME</span>
            <strong>{batch.product?.genericName || 'Standard'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>MANUFACTURER</span>
            <strong>{batch.manufacturer?.name || 'Verified Manufacturer'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>IN-STOCK QUANTITY</span>
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
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>STORAGE REQUIREMENTS</span>
            <span style={{ color: 'var(--text-muted)' }}>{batch.storageRequirements}</span>
          </div>
        </div>
      </div>

      {/* QR Code & Provenance Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}
      >
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#1e3a8a' }}>
            📱 QR Point-of-Sale Stamp
          </h3>
          <QRCodeGenerator
            identifier={batch.qrIdentifier || batch.batchNumber}
            batchNumber={batch.batchNumber}
            productName={batch.product?.name}
            size={220}
          />
          <div style={{ marginTop: '20px' }}>
            <Link
              to={`/verify/${batch.qrIdentifier || batch.batchNumber}`}
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
            >
              🔍 Inspect Digital Authenticity Certificate
            </Link>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#1e3a8a' }}>
              ⛓️ Complete Custodial Provenance
            </h3>
            <span className="badge badge-info">{events.length} Checkpoints</span>
          </div>

          <Timeline events={events} />
        </div>
      </div>
    </div>
  );
}
