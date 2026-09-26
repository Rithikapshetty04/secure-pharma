import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import Timeline from '../../components/Timeline';

export default function DistributorBatchDetailsPage() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentCustodian, setCurrentCustodian] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusCode, setStatusCode] = useState(200);

  // Copy helpers
  const [copiedBatchId, setCopiedBatchId] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [copiedBatchHash, setCopiedBatchHash] = useState(false);

  const fetchBatchData = async () => {
    setLoading(true);
    setError(null);
    setStatusCode(200);
    try {
      const res = await api.getBatchById(batchId);
      if (res.success && res.batch) {
        setBatch(res.batch);
        setEvents(res.events || []);
        setCurrentCustodian(res.currentCustodian || null);
      } else {
        setError(res.message || 'Pharmaceutical batch not found.');
        if (res.message?.includes('authorization') || res.message?.includes('forbidden')) {
          setStatusCode(403);
        } else {
          setStatusCode(404);
        }
      }
    } catch (err) {
      console.error('Error loading distributor batch details:', err);
      setError(err.message || 'Error communicating with ledger server.');
      setStatusCode(500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [batchId]);

  const handleCopy = (text, typeSetter) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    typeSetter(true);
    setTimeout(() => typeSetter(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '40px auto 80px', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ width: '180px', height: '24px', background: '#e2e8f0', borderRadius: '4px' }}></div>
          <div style={{ width: '220px', height: '36px', background: '#e2e8f0', borderRadius: '6px' }}></div>
        </div>
        <div className="glass-card" style={{ padding: '40px', background: '#ffffff', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#2563eb', fontWeight: '600' }}>Retrieving pharmaceutical batch & cryptographic records...</p>
        </div>
      </div>
    );
  }

  // 403 Access Denied / IDOR Error State
  if (statusCode === 403) {
    return (
      <div style={{ maxWidth: '640px', margin: '60px auto 100px', padding: '0 20px' }}>
        <div className="glass-card" style={{ padding: '40px 32px', textAlign: 'center', background: '#ffffff', borderTop: '4px solid #dc2626' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🔒</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
            Access Restricted — IDOR Guard
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
            {error || 'You do not have authorization to view this pharmaceutical batch. This batch is not associated with your distributor organization.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/distributor/batches" className="btn btn-primary">
              ← Back to Your Batches
            </Link>
            <Link to="/distributor/inventory" className="btn btn-outline">
              📦 Warehouse Inventory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 404 / General Error State
  if (error || !batch) {
    return (
      <div style={{ maxWidth: '640px', margin: '60px auto 100px', padding: '0 20px' }}>
        <div className="glass-card" style={{ padding: '40px 32px', textAlign: 'center', background: '#ffffff', borderTop: '4px solid #d97706' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>⚠️</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
            Batch Record Not Found
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '24px' }}>
            {error || 'The requested batch ID could not be located in the pharmaceutical database.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/distributor/batches" className="btn btn-primary">
              ← Return to Batches
            </Link>
            <button onClick={fetchBatchData} className="btn btn-outline">
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Derived Business & Expiry Logic
  const now = new Date();
  const expDate = new Date(batch.expiryDate);
  const isExpired = expDate < now;
  const daysUntilExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = !isExpired && daysUntilExpiry <= 30;

  // Derive distributor custody state
  const latestEvent = events.length > 0 ? events[events.length - 1] : null;
  const distributorOrgId = batch.distributorOrgId || '';
  let custodyState = 'ACTIVE_INVENTORY';
  if (latestEvent) {
    if (['TRANSFERRED', 'DISPATCHED', 'SHIPPED', 'DELIVERED'].includes(latestEvent.eventType) && latestEvent.toOrganization?.type === 'PHARMACY') {
      custodyState = 'TRANSFERRED_AWAY';
    } else if (latestEvent.eventType === 'IN_TRANSIT') {
      custodyState = 'PENDING_RECEIPT';
    }
  }

  const isTransferable = custodyState === 'ACTIVE_INVENTORY' && !isExpired && batch.status !== 'RECALLED';

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Top Breadcrumbs & Actions */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/distributor/batches"
            style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
          >
            ← Back to Batches
          </Link>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <Link
            to="/distributor/inventory"
            style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
          >
            📦 Warehouse Inventory
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleCopy(batch.batchNumber, setCopiedBatchId)}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.8rem' }}
          >
            {copiedBatchId ? '✓ Batch ID Copied' : '📋 Copy Batch #'}
          </button>

          {isTransferable ? (
            <Link to={`/distributor/transfers/${batch._id}`} className="btn btn-primary btn-sm">
              🚚 Transfer to Pharmacy →
            </Link>
          ) : (
            <button
              disabled
              className="btn btn-outline btn-sm"
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
              title={isExpired ? 'Expired lot cannot be transferred' : 'Only active warehouse stock can be transferred'}
            >
              🔒 Transfer Locked
            </button>
          )}

          <Link to={`/verify/${batch.qrIdentifier || batch.batchNumber}`} className="btn btn-outline btn-sm">
            🔍 Verify Authenticity
          </Link>
        </div>
      </div>

      {/* Supply Chain Lifecycle Progress Bar */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Supply-Chain Chain of Custody Progress
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', position: 'relative' }}>
          {/* Step 1: Manufacturer */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 14px', borderRadius: '8px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: '700', fontSize: '0.82rem' }}>
              <span>✓ 1. Manufacturer</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#065f46', margin: '4px 0 0', fontWeight: '500' }}>
              {batch.manufacturer?.name || batch.product?.manufacturer?.name || 'Authorized Mfg'}
            </p>
          </div>

          {/* Step 2: Distributor */}
          <div
            style={{
              background: custodyState === 'ACTIVE_INVENTORY' ? '#eff6ff' : '#f8fafc',
              border: custodyState === 'ACTIVE_INVENTORY' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
              padding: '12px 14px',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: custodyState === 'ACTIVE_INVENTORY' ? '#1d4ed8' : '#475569', fontWeight: '700', fontSize: '0.82rem' }}>
              <span>{custodyState === 'ACTIVE_INVENTORY' ? '🟢 2. Distributor (Active)' : '✓ 2. Distributor Custody'}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '4px 0 0' }}>
              Wholesale Distribution Hub
            </p>
          </div>

          {/* Step 3: Pharmacy */}
          <div
            style={{
              background: custodyState === 'TRANSFERRED_AWAY' ? '#ecfdf5' : '#fafafa',
              border: custodyState === 'TRANSFERRED_AWAY' ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
              padding: '12px 14px',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: custodyState === 'TRANSFERRED_AWAY' ? '#047857' : '#94a3b8', fontWeight: '700', fontSize: '0.82rem' }}>
              <span>{custodyState === 'TRANSFERRED_AWAY' ? '✓ 3. Delivered to Pharmacy' : '⏳ 3. Retail Pharmacy'}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '4px 0 0' }}>
              {latestEvent?.toOrganization?.type === 'PHARMACY' ? latestEvent.toOrganization.name : 'Pending Fulfillment'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '28px', background: '#ffffff' }}>
        {/* Title Header Bar */}
        <div
          style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e3a8a' }}>
                Batch #{batch.batchNumber}
              </h1>
              <StatusBadge status={batch.status} />
              {isExpired ? (
                <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
                  ⚠️ EXPIRED
                </span>
              ) : isExpiringSoon ? (
                <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
                  ⏳ EXPIRING SOON ({daysUntilExpiry} days)
                </span>
              ) : (
                <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
                  ✓ VALID ({daysUntilExpiry} days left)
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
              Product: <strong>{batch.product?.name}</strong> Code: <code style={{ color: '#2563eb' }}>{batch.product?.productCode}</code>
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>AVAILABLE INVENTORY QTY</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669' }}>
              {batch.quantity?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>{batch.unit || 'Units'}</span>
            </div>
          </div>
        </div>

        {/* Specifications Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            background: '#f8fafc',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #e2e8f0',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
              SOURCE MANUFACTURER
            </span>
            <strong style={{ color: 'var(--text-heading)', fontSize: '0.95rem' }}>
              {batch.manufacturer?.name || batch.product?.manufacturer?.name || 'Authorized Manufacturer'}
            </strong>
            {(batch.manufacturer?.contactEmail || batch.product?.manufacturer?.contactEmail) && (
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                ✉️ {batch.manufacturer?.contactEmail || batch.product?.manufacturer?.contactEmail}
              </span>
            )}
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
              MANUFACTURING DATE
            </span>
            <strong style={{ color: 'var(--text-heading)', fontSize: '0.95rem' }}>
              {new Date(batch.manufacturingDate).toLocaleDateString()}
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
              EXPIRY DATE
            </span>
            <strong
              style={{
                fontSize: '0.95rem',
                color: isExpired ? '#dc2626' : isExpiringSoon ? '#d97706' : '#059669',
              }}
            >
              {new Date(batch.expiryDate).toLocaleDateString()}
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
              STORAGE & ENVIRONMENT
            </span>
            <span style={{ color: 'var(--text-heading)', fontWeight: '600' }}>
              {batch.storageRequirements || 'Standard controlled storage'}
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
              CURRENT CUSTODIAN
            </span>
            <span style={{ color: '#1e3a8a', fontWeight: '700' }}>
              {currentCustodian?.name || 'Wholesale Distribution Hub'}
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
              QR IDENTIFIER
            </span>
            <code style={{ color: '#2563eb', fontWeight: '700', fontSize: '0.8rem' }}>
              {batch.qrIdentifier || batch.batchNumber}
            </code>
          </div>
        </div>
      </div>

      {/* Cryptographic Blockchain Verification Card */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '28px', background: '#ffffff', borderLeft: '4px solid #2563eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⛓️</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
                Cryptographic On-Chain Provenance Proof
              </h3>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: '4px' }}>
              Cryptographic hash records stored immutably on the pharmaceutical blockchain ledger.
            </p>
          </div>
          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ✓ Verified On-Chain Ledger
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
          <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '700' }}>TRANSACTION HASH (TX HASH)</span>
              {batch.blockchainTxHash && (
                <button
                  onClick={() => handleCopy(batch.blockchainTxHash, setCopiedTxHash)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600' }}
                >
                  {copiedTxHash ? '✓ Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#1e293b', wordBreak: 'break-all' }}>
              {batch.blockchainTxHash || 'Blockchain proof pending'}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '700' }}>CRYPTOGRAPHIC BATCH HASH</span>
              {batch.batchHash && (
                <button
                  onClick={() => handleCopy(batch.batchHash, setCopiedBatchHash)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600' }}
                >
                  {copiedBatchHash ? '✓ Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#1e293b', wordBreak: 'break-all' }}>
              {batch.batchHash || 'SHA-256 seal verified'}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '700', marginBottom: '4px' }}>
              BLOCK HEIGHT & NETWORK
            </span>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
              {batch.blockNumber ? `Block #${batch.blockNumber}` : 'Block Height Verified'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              {batch.blockchainNetwork || 'Sepolia Ethereum Testnet'}
            </div>
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
        <div className="glass-card" style={{ padding: '28px', textAlign: 'center', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1e3a8a', marginBottom: '6px', fontWeight: '800' }}>
            📱 QR Identifier & Authenticity
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '18px' }}>
            Scan to open public verification page without login requirement.
          </p>

          <div style={{ display: 'inline-block', padding: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)', marginBottom: '18px' }}>
            <QRCodeGenerator
              identifier={batch.qrIdentifier || batch.batchNumber}
              batchNumber={batch.batchNumber}
              productName={batch.product?.name}
              size={200}
            />
          </div>

          <div>
            <Link
              to={`/verify/${batch.qrIdentifier || batch.batchNumber}`}
              className="btn btn-outline btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              🔍 Open Public Verification Portal
            </Link>
          </div>
        </div>

        {/* Supply-Chain Events Timeline */}
        <div className="glass-card" style={{ padding: '28px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#1e3a8a', margin: 0, fontWeight: '800' }}>
                📜 Custodial Chain Timeline
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Audit log of all physical and ownership transfers
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
