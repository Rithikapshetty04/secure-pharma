import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import Timeline from '../../components/Timeline';

export default function ManufacturerBatchDetailsPage() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBatchData = async () => {
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
        setError(err.message || 'Error loading batch details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [batchId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#2563eb', fontWeight: '600' }}>
        Loading batch details...
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', textAlign: 'center', background: '#ffffff' }}>
        <h3 style={{ color: '#dc2626' }}>Batch Not Found</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{error || 'Unable to locate batch.'}</p>
        <Link to="/manufacturer/batches" className="btn btn-outline btn-sm" style={{ marginTop: '16px' }}>
          ← Back to Batches
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link
          to="/manufacturer/batches"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
        >
          ← Back to Batches
        </Link>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to={`/manufacturer/transfers/${batch._id}`} className="btn btn-primary btn-sm">
            🚚 Transfer Batch
          </Link>
          <Link to={`/verify/${batch.qrIdentifier || batch.batchNumber}`} className="btn btn-outline btn-sm">
            🔍 Verify Authenticity
          </Link>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '28px', background: '#ffffff' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: '#1e3a8a' }}>
                Batch #{batch.batchNumber}
              </h1>
              <StatusBadge status={batch.status} />
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
              {batch.product?.name} ({batch.product?.productCode})
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '700' }}>TOTAL UNITS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>
              {batch.quantity?.toLocaleString()} {batch.unit}
            </div>
          </div>
        </div>

        {/* Specifications Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            background: '#f8fafc',
            padding: '20px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #e2e8f0',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>
              MANUFACTURER
            </span>
            <strong style={{ color: 'var(--text-heading)' }}>
              {batch.manufacturer?.name || batch.product?.manufacturer?.name || 'Verified Manufacturer'}
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>
              CURRENT HOLDER
            </span>
            <strong style={{ color: '#2563eb' }}>
              {batch.manufacturer?.name || 'Manufacturer Facility Cleanroom'}
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>
              MANUFACTURING DATE
            </span>
            <strong style={{ color: 'var(--text-heading)' }}>
              {new Date(batch.manufacturingDate).toLocaleDateString()}
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>
              EXPIRY DATE
            </span>
            <strong
              style={{
                color: new Date(batch.expiryDate) < new Date() ? '#dc2626' : '#059669',
              }}
            >
              {new Date(batch.expiryDate).toLocaleDateString()}
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>
              DOSAGE FORM & STRENGTH
            </span>
            <span style={{ color: 'var(--text-heading)' }}>
              {batch.product?.dosageForm} ({batch.product?.strength || 'Standard'})
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>
              STORAGE CONDITIONS
            </span>
            <span style={{ color: 'var(--text-heading)' }}>
              {batch.storageRequirements || 'Standard storage'}
            </span>
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
        {/* QR Section */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#1e3a8a', marginBottom: '8px' }}>
            📱 QR Serialization Code
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
            Identifier: <code style={{ color: '#2563eb' }}>{batch.qrIdentifier || batch.batchNumber}</code>
          </p>

          <QRCodeGenerator
            identifier={batch.qrIdentifier || batch.batchNumber}
            batchNumber={batch.batchNumber}
            productName={batch.product?.name}
            size={220}
          />
        </div>

        {/* Supply-Chain Timeline Section */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#1e3a8a', margin: 0 }}>
                ⛓️ Supply-Chain Provenance
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Manufacturer ↓ Distributor ↓ Pharmacy Custodial Chain
              </p>
            </div>
            <span className="badge badge-info">{events.length} Checkpoints</span>
          </div>

          <Timeline events={events} />
        </div>
      </div>
    </div>
  );
}
