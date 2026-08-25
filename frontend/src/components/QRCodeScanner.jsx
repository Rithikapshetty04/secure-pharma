import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QRCodeScanner({ onScanComplete }) {
  const [inputVal, setInputVal] = useState('');
  const [activeTab, setActiveTab] = useState('manual');
  const [simulatingCamera, setSimulatingCamera] = useState(false);
  const navigate = useNavigate();

  const sampleIds = [
    { label: 'Verified Batch', id: 'BATCH-2026-TEST-001' },
    { label: 'In-Transit Batch', id: 'AMOX-BATCH-892' },
    { label: 'mRNA Vaccine', id: 'VAX-COV26-440' },
    { label: 'Counterfeit / Unknown', id: 'FAKE-DRUG-99999' },
  ];

  const handleVerify = (identifierToVerify) => {
    const target = (identifierToVerify || inputVal).trim();
    if (!target) return;

    if (onScanComplete) {
      onScanComplete(target);
    } else {
      navigate(`/verify/${encodeURIComponent(target)}`);
    }
  };

  const handleSimulateScan = () => {
    setSimulatingCamera(true);
    setTimeout(() => {
      setSimulatingCamera(false);
      handleVerify('BATCH-2026-TEST-001');
    }, 1500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTimeout(() => {
      handleVerify('BATCH-2026-TEST-001');
    }, 800);
  };

  return (
    <div className="glass-card" style={{ padding: '28px', maxWidth: '600px', margin: '0 auto', background: '#ffffff' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '6px', color: '#1e3a8a' }}>Scan or Enter Product Identifier</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Verify pharmaceutical batches against the distributed regulatory trust ledger.
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        background: '#f1f5f9',
        padding: '4px',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '20px',
      }}>
        <button
          onClick={() => setActiveTab('manual')}
          className={`btn btn-sm ${activeTab === 'manual' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1 }}
        >
          ⌨️ Identifier Entry
        </button>
        <button
          onClick={() => setActiveTab('camera')}
          className={`btn btn-sm ${activeTab === 'camera' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1 }}
        >
          📷 Live Camera Scan
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`btn btn-sm ${activeTab === 'file' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1 }}
        >
          📁 Upload QR Image
        </button>
      </div>

      {/* Manual Entry */}
      {activeTab === 'manual' && (
        <div>
          <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              required
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. BATCH-2026-TEST-001 or SP-UUID..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
              }}
            />
            <button type="submit" className="btn btn-primary">
              Verify
            </button>
          </form>
        </div>
      )}

      {/* Camera Simulator */}
      {activeTab === 'camera' && (
        <div style={{
          border: '2px dashed #3b82f6',
          borderRadius: 'var(--radius-md)',
          padding: '30px 20px',
          textAlign: 'center',
          background: '#eff6ff',
        }}>
          {simulatingCamera ? (
            <div>
              <div className="live-dot" style={{ margin: '0 auto 12px', width: '14px', height: '14px' }}></div>
              <div style={{ fontWeight: '700', color: '#1d4ed8' }}>Scanning Optical Target...</div>
              <p style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-muted)' }}>Aligning barcode / QR matrix</p>
            </div>
          ) : (
            <div>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ margin: '0 auto 10px' }}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <div style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-heading)', fontWeight: '600' }}>
                Point camera at pharmaceutical box QR code
              </div>
              <button onClick={handleSimulateScan} className="btn btn-primary btn-sm">
                ⚡ Activate Optical Sensor
              </button>
            </div>
          )}
        </div>
      )}

      {/* File Upload */}
      {activeTab === 'file' && (
        <div style={{
          border: '2px dashed #93c5fd',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          textAlign: 'center',
          background: '#f8fafc',
          position: 'relative',
        }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%',
            }}
          />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ margin: '0 auto 8px' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-heading)', fontWeight: '600' }}>Click or drop QR image file here</div>
        </div>
      )}

      {/* Quick Demo Chips */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>
          TEST WITH VERIFIED NETWORK IDENTIFIERS
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {sampleIds.map((item) => (
            <button
              key={item.id}
              onClick={() => handleVerify(item.id)}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#f8fafc', borderColor: '#e2e8f0', color: '#1e40af' }}
            >
              {item.label} ({item.id})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
