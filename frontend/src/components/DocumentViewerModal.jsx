import React from 'react';

export default function DocumentViewerModal({ documentPath, onClose }) {
  if (!documentPath) return null;

  const isPdf = documentPath.toLowerCase().endsWith('.pdf');
  const fullUrl = `http://localhost:5000/${documentPath}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '850px', height: '80vh', display: 'flex', flexDirection: 'column', padding: '24px', background: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#1e3a8a' }}>📜 Regulatory License Certificate</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {documentPath}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-sm"
            >
              Open in New Window ↗
            </a>
            <button onClick={onClose} className="btn btn-outline btn-sm">✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPdf ? (
            <iframe
              src={fullUrl}
              title="License PDF"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <img
              src={fullUrl}
              alt="License Document"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          )}
          <div style={{ display: 'none', color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
            Document preview unavailable. Click "Open in New Window" above.
          </div>
        </div>
      </div>
    </div>
  );
}
