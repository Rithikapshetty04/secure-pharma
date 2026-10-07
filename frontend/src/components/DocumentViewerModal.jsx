import React, { useState, useEffect } from 'react';

export default function DocumentViewerModal({ documentPath, licenseId, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isPdf = documentPath ? documentPath.toLowerCase().endsWith('.pdf') : true;
  const token = localStorage.getItem('token');
  const targetId = licenseId || (documentPath ? documentPath.split(/[\\/]/).pop() : '');

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let createdUrl = null;

    const fetchDocument = async () => {
      setLoading(true);
      setError(false);
      try {
        const url = `http://localhost:5000/api/licenses/${encodeURIComponent(targetId)}/document`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error('Access forbidden or document not found.');
        }

        const blob = await res.blob();
        if (isMounted) {
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchDocument();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [targetId, token]);

  if (!documentPath && !licenseId) return null;

  const authenticatedDirectUrl = `http://localhost:5000/api/licenses/${encodeURIComponent(targetId)}/document?token=${token || ''}`;

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
              {documentPath || `License #${licenseId}`} (Protected Regulatory Document)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={blobUrl || authenticatedDirectUrl}
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
          {loading ? (
            <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
              <span className="spinner-border spinner-border-sm" style={{ marginRight: '8px' }}></span>
              Verifying cryptographic credentials and streaming protected document...
            </div>
          ) : error ? (
            <div style={{ color: '#dc2626', textAlign: 'center', padding: '20px' }}>
              🔒 Document preview unavailable or access unauthorized. Please verify that your account has regulatory authorization.
            </div>
          ) : isPdf ? (
            <iframe
              src={blobUrl}
              title="License PDF"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <img
              src={blobUrl}
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
