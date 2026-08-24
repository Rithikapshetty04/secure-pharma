import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export default function QRCodeGenerator({
  identifier,
  batchNumber,
  productName,
  size = 200,
  showControls = true,
}) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState(null);

  const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(identifier || batchNumber || '')}`;

  useEffect(() => {
    if (!identifier && !batchNumber) return;

    const payload = verifyUrl;

    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#031127',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (err) => {
        if (err) {
          console.error('QR Generation Error:', err);
          setError('Failed to render QR Code');
        } else if (canvasRef.current) {
          setDataUrl(canvasRef.current.toDataURL('image/png'));
        }
      }
    );
  }, [identifier, batchNumber, size, verifyUrl]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `SecurePharma-QR-${batchNumber || identifier}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#fff',
      padding: '16px',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      textAlign: 'center',
      color: '#031127',
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: '800',
        color: '#0284c7',
        letterSpacing: '0.05em',
        marginBottom: '4px',
      }}>
        SECURE PHARMA VERIFIED
      </div>

      {productName && (
        <div style={{ fontSize: '0.8rem', fontWeight: '700', maxWidth: `${size}px`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {productName}
        </div>
      )}

      {batchNumber && (
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#475569', marginBottom: '8px' }}>
          Batch #{batchNumber}
        </div>
      )}

      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>

      <div style={{
        fontSize: '0.65rem',
        fontFamily: 'var(--font-mono)',
        color: '#64748b',
        marginTop: '8px',
        maxWidth: `${size}px`,
        wordBreak: 'break-all',
      }}>
        ID: {identifier || batchNumber}
      </div>

      {showControls && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDownload}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            📥 Download PNG
          </button>
          <a
            href={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#031127', borderColor: '#cbd5e1' }}
          >
            🔗 Test Link
          </a>
        </div>
      )}

      {error && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '6px' }}>{error}</div>}
    </div>
  );
}
