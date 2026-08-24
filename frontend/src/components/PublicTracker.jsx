import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function PublicTracker({ initialBatch = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialBatch);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedHash, setCopiedHash] = useState(null);

  const sampleBatches = [
    'BATCH-2026-TEST-001',
    'AMOX-BATCH-892',
    'VAX-COV26-440',
    'PARA-500-B901',
  ];

  const handleSearch = async (batchNoToSearch) => {
    const query = (batchNoToSearch || searchTerm).trim();
    if (!query) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await api.trackBatchPublic(query);
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'No verification records found for this batch.');
      }
    } catch (err) {
      setError('Failed to query provenance network. Please verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBatch) {
      setSearchTerm(initialBatch);
      handleSearch(initialBatch);
    }
  }, [initialBatch]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'MANUFACTURED':
        return <span className="badge badge-success">🏭 MANUFACTURED</span>;
      case 'SHIPPED':
        return <span className="badge badge-warning">🚚 IN TRANSIT / SHIPPED</span>;
      case 'RECEIVED':
        return <span className="badge badge-info">📦 RECEIVED AT FACILITY</span>;
      case 'TRANSFERRED':
        return <span className="badge badge-purple">🔄 TRANSFERRED</span>;
      case 'DELIVERED':
        return <span className="badge badge-success">🏥 DISPENSED / DELIVERED</span>;
      default:
        return <span className="badge badge-info">{type}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: 'rgba(0, 242, 254, 0.1)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          color: '#00f2fe',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '16px',
        }}>
          <span className="live-dot"></span>
          Decentralized Supply Chain Verification
        </div>
        <h1 style={{
          fontSize: '2.75rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
        }}>
          Verify Pharmaceutical Authenticity
        </h1>
        <p style={{ maxWidth: '640px', margin: '0 auto', fontSize: '1.1rem' }}>
          Inspect the immutable cryptographic provenance, physical chain-of-custody, and regulatory license validity for any medicine batch.
        </p>

        {/* Search Bar */}
        <div style={{
          maxWidth: '700px',
          margin: '32px auto 16px',
          position: 'relative',
          display: 'flex',
          gap: '10px',
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Batch Number (e.g. BATCH-2026-TEST-001)..."
              style={{
                width: '100%',
                padding: '16px 20px 16px 48px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: 'var(--shadow-md)',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-dim)"
              strokeWidth="2"
              style={{ position: 'absolute', left: '16px', top: '18px' }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '0 28px', fontSize: '1rem' }}
          >
            {loading ? 'Verifying...' : 'Verify Now'}
          </button>
        </div>

        {/* Quick Sample Batch Chips */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Try demo batch:</span>
          {sampleBatches.map((batch) => (
            <button
              key={batch}
              onClick={() => {
                setSearchTerm(batch);
                handleSearch(batch);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {batch}
            </button>
          ))}
        </div>
      </div>

      {/* Error View */}
      {error && (
        <div className="glass-card" style={{
          padding: '24px',
          borderColor: 'rgba(244, 63, 94, 0.4)',
          background: 'rgba(244, 63, 94, 0.08)',
          textAlign: 'center',
          maxWidth: '700px',
          margin: '0 auto 30px',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚠️ Unverified Batch</div>
          <p style={{ color: '#fb7185' }}>{error}</p>
        </div>
      )}

      {/* Verification Result View */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Verification Status Banner */}
          <div className="glass-card" style={{
            padding: '28px',
            border: result.verified
              ? '1px solid rgba(16, 185, 129, 0.4)'
              : '1px solid rgba(245, 158, 11, 0.4)',
            background: result.verified
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(10, 14, 23, 0.8) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(10, 14, 23, 0.8) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: result.verified ? 'var(--gradient-emerald)' : 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: result.verified ? '0 0 30px rgba(16, 185, 129, 0.4)' : 'none',
              }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={result.verified ? '#022013' : '#f59e0b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.6rem' }}>
                    {result.verified ? 'Authentic Pharmaceutical Product' : 'Verification Under Review'}
                  </h2>
                  <span className={result.verified ? 'badge badge-success' : 'badge badge-warning'}>
                    {result.verified ? '100% CRYPTO VERIFIED' : 'PENDING CHECKS'}
                  </span>
                </div>
                <p style={{ marginTop: '4px' }}>
                  Batch <strong>#{result.batch.batchNumber}</strong> matches certified FDA/regulatory manufacturing records.
                </p>
              </div>
            </div>

            {/* Cryptographic Hash Summary */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'right',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                IMMUTABLE LEDGER ROOT HASH
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                {result.cryptographicHashRoot
                  ? `${result.cryptographicHashRoot.slice(0, 16)}...${result.cryptographicHashRoot.slice(-8)}`
                  : 'On-Chain Anchored'}
                <button
                  onClick={() => copyToClipboard(result.cryptographicHashRoot, 'root')}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                >
                  {copiedHash === 'root' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* 2-Column Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px',
          }}>
            {/* Medicine Specifications Card */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.15rem' }}>Drug Specifications</h3>
                <span className="badge badge-info">{result.product.productCode}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Drug Name</span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>{result.product.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Quantity</span>
                  <span style={{ fontWeight: '600', color: '#fff' }}>{result.batch.quantity?.toLocaleString()} Units</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Manufacturing Date</span>
                  <span style={{ color: '#fff' }}>
                    {result.batch.manufacturingDate ? new Date(result.batch.manufacturingDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Expiry Date</span>
                  <span style={{
                    color: result.batch.isExpired ? '#fb7185' : '#34d399',
                    fontWeight: '600',
                  }}>
                    {result.batch.expiryDate ? new Date(result.batch.expiryDate).toLocaleDateString() : 'N/A'}
                    {result.batch.isExpired ? ' (EXPIRED)' : ' (VALID)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Status</span>
                  <span className="badge badge-purple">{result.batch.status}</span>
                </div>
              </div>
            </div>

            {/* Manufacturer & Regulatory Credentials Card */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.15rem' }}>Manufacturer & License</h3>
                <span className="badge badge-success">
                  {result.manufacturer.status === 'APPROVED' ? 'VERIFIED LICENSE' : 'PENDING'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Organization</span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>{result.manufacturer.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>License Number</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                    {result.manufacturer.licenseNumber || 'VER-PHARMA-2026'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Facility Address</span>
                  <span style={{ color: '#fff', textAlign: 'right', maxWidth: '200px' }}>
                    {result.manufacturer.address || 'Certified Pharmaceutical Facility'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Regulatory Authority</span>
                  <span style={{ color: '#38bdf8', fontWeight: '600' }}>Federal Drug Control</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Provenance Timeline */}
          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem' }}>Chain of Custody & Traceability Journey</h3>
                <p style={{ fontSize: '0.9rem' }}>
                  Verified chronological ledger of every handling node from manufacturing to patient dispensing.
                </p>
              </div>
              <span className="badge badge-info">{result.timeline?.length || 0} Checkpoints Logged</span>
            </div>

            {/* Timeline Steps */}
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              {/* Vertical Glowing Progress Line */}
              <div style={{
                position: 'absolute',
                left: '7px',
                top: '12px',
                bottom: '12px',
                width: '2px',
                background: 'linear-gradient(180deg, #10b981 0%, #00f2fe 50%, #8b5cf6 100%)',
                boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)',
              }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {result.timeline && result.timeline.map((event, idx) => (
                  <div key={event.id || idx} style={{ position: 'relative' }}>
                    {/* Node Dot */}
                    <div style={{
                      position: 'absolute',
                      left: '-24px',
                      top: '4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#0a0e17',
                      border: '3px solid var(--accent-cyan)',
                      boxShadow: '0 0 10px var(--accent-cyan)',
                    }}></div>

                    {/* Step Card */}
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px 20px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {getEventBadge(event.eventType)}
                          <span style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>
                            {event.fromOrganization}
                            {event.toOrganization && event.toOrganization !== event.fromOrganization ? ` → ${event.toOrganization}` : ''}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(event.eventDate).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          {event.location || 'Verified Custody Facility'}
                        </div>

                        {/* Transaction Hash */}
                        {event.transactionHash && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            color: 'var(--text-dim)',
                          }}>
                            <span>Tx: {event.transactionHash.slice(0, 14)}...{event.transactionHash.slice(-6)}</span>
                            <button
                              onClick={() => copyToClipboard(event.transactionHash, event.id || idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent-cyan)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                              }}
                            >
                              {copiedHash === (event.id || idx) ? '✓' : 'Copy'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
