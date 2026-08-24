import React from 'react';

export default function DocumentViewerModal({ documentPath, title = 'License Certificate', onClose }) {
  if (!documentPath) return null;

  const normalizedPath = `/${documentPath.replace(/\\/g, '/')}`;
  const isPdf = normalizedPath.toLowerCase().endsWith('.pdf');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '900px', width: '95%', height: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Regulatory Document Viewer</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={normalizedPath}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-sm"
            >
              ↗ Open in New Tab
            </a>
            <button onClick={onClose} className="btn btn-outline btn-sm">
              ✕
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          background: '#0b0f19',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {isPdf ? (
            <iframe
              src={normalizedPath}
              title={title}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <img
              src={normalizedPath}
              alt={title}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
