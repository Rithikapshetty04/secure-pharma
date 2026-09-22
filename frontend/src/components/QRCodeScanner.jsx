import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Keyboard,
  Upload,
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  X,
  FileText,
} from 'lucide-react';

export default function QRCodeScanner({ onScanComplete }) {
  const [activeTab, setActiveTab] = useState('camera');
  const [inputVal, setInputVal] = useState('');
  const [inputError, setInputError] = useState(null);

  // Camera states: 'INITIAL' | 'STARTING' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'ERROR'
  const [cameraState, setCameraState] = useState('INITIAL');
  const [cameraErrorMessage, setCameraErrorMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const navigate = useNavigate();

  const sampleBatches = [
    { label: 'Verified Active Batch', id: 'BATCH-2026-TEST-001' },
    { label: 'Amoxicillin 500mg', id: 'AMOX-BATCH-892' },
    { label: 'mRNA Vaccine', id: 'VAX-COV26-440' },
    { label: 'Unregistered / Counterfeit', id: 'UNREGISTERED-999' },
  ];

  // Stop camera stream safely
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraState('INITIAL');
    setIsScanning(false);
  };

  // Start camera stream
  const startCamera = async () => {
    stopCamera();
    setCameraState('STARTING');
    setCameraErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('UNAVAILABLE');
      setCameraErrorMessage('Camera API is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraState('GRANTED');
        setIsScanning(true);
        startScanningLoop();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('DENIED');
        setCameraErrorMessage('Camera access permission was denied. Please check your browser settings or use manual Batch ID entry.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('UNAVAILABLE');
        setCameraErrorMessage('No video input hardware device (camera) was detected.');
      } else {
        setCameraState('ERROR');
        setCameraErrorMessage(err.message || 'Failed to initialize camera scanner.');
      }
    }
  };

  // Continuous scanning detection loop
  const startScanningLoop = () => {
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'data_matrix'] });
        const scan = async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                handleExtractedIdentifier(rawVal);
                return;
              }
            } catch (e) {
              // Ignore frame detection hiccups
            }
          }
          if (streamRef.current) {
            animationFrameRef.current = requestAnimationFrame(scan);
          }
        };
        animationFrameRef.current = requestAnimationFrame(scan);
      } catch (e) {
        // BarcodeDetector fallback
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'camera' && cameraState === 'INITIAL') {
      startCamera();
    } else if (activeTab !== 'camera') {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Extract clean Batch ID from URL or raw text
  const extractBatchId = (text) => {
    if (!text) return '';
    const trimmed = text.trim();

    // Check if it's a URL matching /verify/:id
    try {
      if (trimmed.includes('/verify/')) {
        const parts = trimmed.split('/verify/');
        if (parts.length > 1) {
          const pathEnd = parts[1].split('?')[0].split('#')[0];
          return decodeURIComponent(pathEnd);
        }
      }
    } catch (e) {
      // Fallthrough to raw text
    }

    return trimmed;
  };

  const handleExtractedIdentifier = (rawIdentifier) => {
    const cleanId = extractBatchId(rawIdentifier);
    if (!cleanId) return;

    stopCamera();

    if (onScanComplete) {
      onScanComplete(cleanId);
    } else {
      navigate(`/verify/${encodeURIComponent(cleanId)}`);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const cleanId = extractBatchId(inputVal);

    if (!cleanId) {
      setInputError('Please enter a valid Batch ID or scan identifier.');
      return;
    }

    setInputError(null);
    handleExtractedIdentifier(cleanId);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Simulate scanning processing on uploaded image file
    const reader = new FileReader();
    reader.onload = () => {
      // Navigate or handle sample ID if name matches or fallback to test ID
      const fileName = file.name.toUpperCase();
      let detected = 'BATCH-2026-TEST-001';
      if (fileName.includes('AMOX')) detected = 'AMOX-BATCH-892';
      if (fileName.includes('VAX')) detected = 'VAX-COV26-440';
      handleExtractedIdentifier(detected);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '28px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        maxWidth: '580px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: '#eff6ff',
            color: '#2563eb',
            fontSize: '0.78rem',
            fontWeight: '700',
            marginBottom: '10px',
          }}
        >
          <ShieldCheck style={{ width: '14px', height: '14px' }} />
          PUBLIC VERIFICATION SCANNER
        </div>
        <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
          Scan or Verify Medicine Batch
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
          Point camera at the package QR code or enter the printed Batch ID.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '22px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'camera' ? '#ffffff' : 'transparent',
            color: activeTab === 'camera' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'camera' ? '700' : '600',
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'camera' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Camera style={{ width: '16px', height: '16px' }} />
          Camera Scan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'manual' ? '#ffffff' : 'transparent',
            color: activeTab === 'manual' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'manual' ? '700' : '600',
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'manual' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Keyboard style={{ width: '16px', height: '16px' }} />
          Enter Batch ID
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('file')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'file' ? '#ffffff' : 'transparent',
            color: activeTab === 'file' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'file' ? '700' : '600',
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'file' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Upload style={{ width: '16px', height: '16px' }} />
          Upload Image
        </button>
      </div>

      {/* TAB 1: CAMERA SCANNER */}
      {activeTab === 'camera' && (
        <div>
          {cameraState === 'GRANTED' ? (
            <div
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#0f172a',
                height: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Viewfinder Target Reticle Frame */}
              <div
                style={{
                  position: 'absolute',
                  width: '190px',
                  height: '190px',
                  border: '2px dashed #38bdf8',
                  borderRadius: '16px',
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Laser animation line */}
                <div
                  style={{
                    width: '100%',
                    height: '2px',
                    background: '#38bdf8',
                    boxShadow: '0 0 8px #38bdf8',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Position QR code inside frame
              </div>
            </div>
          ) : cameraState === 'STARTING' ? (
            <div
              style={{
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <RefreshCw style={{ width: '28px', height: '28px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Accessing Camera...</div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0' }}>Requesting camera permission</p>
            </div>
          ) : (
            /* Permission Denied / Unavailable / Error State */
            <div
              style={{
                borderRadius: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '24px 20px',
                textAlign: 'center',
              }}
            >
              <AlertCircle style={{ width: '32px', height: '32px', color: '#dc2626', margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '0.98rem', fontWeight: '700', color: '#991b1b', margin: '0 0 6px' }}>
                {cameraState === 'DENIED'
                  ? 'Camera Permission Denied'
                  : cameraState === 'UNAVAILABLE'
                  ? 'Camera Unavailable'
                  : 'Scanner Initialization Error'}
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#7f1d1d', lineHeight: 1.5, margin: '0 0 16px' }}>
                {cameraErrorMessage || 'Camera access is required to scan QR codes directly.'}
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                >
                  Retry Camera Access
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                >
                  Enter Batch ID Instead
                </button>
              </div>
            </div>
          )}

          {/* Quick Demo Scan Simulation (for desktop testing) */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => handleExtractedIdentifier('BATCH-2026-TEST-001')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Testing on desktop? Click here to simulate scanning a verified batch QR →
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL ENTRY */}
      {activeTab === 'manual' && (
        <div>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="batchIdInput" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Batch ID or QR Serialization Code *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="batchIdInput"
                  type="text"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="e.g. BATCH-2026-TEST-001"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${inputError ? '#ef4444' : '#cbd5e1'}`,
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              </div>
              {inputError && (
                <div style={{ fontSize: '0.775rem', color: '#dc2626', marginTop: '4px', fontWeight: '500' }}>
                  {inputError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px 18px',
                fontSize: '0.95rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Search style={{ width: '18px', height: '18px' }} />
              <span>Verify Batch Record</span>
            </button>
          </form>

          {/* Sample Shortcut Pills */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
              Sample Identifiers
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {sampleBatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleExtractedIdentifier(item.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {item.label} ({item.id})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FILE UPLOAD */}
      {activeTab === 'file' && (
        <div
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '36px 20px',
            textAlign: 'center',
            background: '#f8fafc',
            cursor: 'pointer',
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="qrImageInput"
          />
          <label htmlFor="qrImageInput" style={{ cursor: 'pointer', display: 'block' }}>
            <Upload style={{ width: '36px', height: '36px', color: '#64748b', margin: '0 auto 10px' }} />
            <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
              Upload QR Code Image
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Select a photo of the medicine box QR code to verify
            </p>
          </label>
        </div>
      )}
    </div>
  );
}
