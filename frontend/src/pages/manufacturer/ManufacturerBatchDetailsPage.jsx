import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import Timeline from '../../components/Timeline';
import {
  ArrowLeft,
  Package,
  ShieldCheck,
  Truck,
  QrCode,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Pill,
  FlaskConical,
  Lock,
} from 'lucide-react';

export default function ManufacturerBatchDetailsPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentCustodian, setCurrentCustodian] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchBatchData = async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await api.getBatchById(batchId);
      if (res && res.success && res.batch) {
        setBatch(res.batch);
        setEvents(res.events || []);
        setCurrentCustodian(res.currentCustodian || res.batch.manufacturer);
      } else {
        setError(res?.message || 'Batch not found.');
        if (res?.message?.includes('forbidden') || res?.message?.includes('authorization')) {
          setErrorCode(403);
        } else {
          setErrorCode(404);
        }
      }
    } catch (err) {
      console.error('Error fetching batch details:', err);
      setError(err.message || 'Error loading batch details.');
      setErrorCode(500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [batchId]);

  const handleCopyVerificationLink = () => {
    if (!batch) return;
    const identifier = batch.qrIdentifier || batch.batchNumber;
    const url = `${window.location.origin}/verify/${encodeURIComponent(identifier)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '60px 20px', textAlign: 'center' }}>
        <RefreshCw style={{ width: '36px', height: '36px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Loading Batch Details...</h3>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Fetching provenance record & blockchain proof from ledger.</p>
      </div>
    );
  }

  if (error || !batch) {
    const is403 = errorCode === 403;
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '60px 20px' }}>
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: is403 ? '#fef2f2' : '#f1f5f9',
              color: is403 ? '#dc2626' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            {is403 ? <Lock style={{ width: '28px', height: '28px' }} /> : <AlertCircle style={{ width: '28px', height: '28px' }} />}
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            {is403 ? 'Access Forbidden' : 'Batch Not Found'}
          </h2>

          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
            {is403
              ? 'You do not have authorization to view this batch. Only the producing manufacturer or authorized supply chain custodian can access this record.'
              : error || 'The requested pharmaceutical batch ID does not exist in the ledger.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              to="/manufacturer/batches"
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: '700' }}
            >
              ← Back to Batch Inventory
            </Link>
            {!is403 && (
              <button
                onClick={fetchBatchData}
                className="btn btn-secondary"
                style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: '600' }}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isExpired = new Date(batch.expiryDate) < new Date();
  const mfgOrgName = batch.manufacturer?.name || 'Verified Manufacturer';
  const custodianOrgName = currentCustodian?.name || mfgOrgName;

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        {/* Navigation & Header Actions Bar */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <Link
            to="/manufacturer/batches"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#2563eb',
              fontWeight: '700',
              fontSize: '0.85rem',
              textDecoration: 'none',
              background: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Batch Inventory
          </Link>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to={`/manufacturer/transfers/${batch._id}`}
              className="btn btn-primary"
              style={{ padding: '9px 18px', fontSize: '0.88rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Truck style={{ width: '16px', height: '16px' }} />
              <span>Transfer Batch</span>
            </Link>

            <Link
              to={`/verify/${batch.qrIdentifier || batch.batchNumber}`}
              className="btn btn-secondary"
              style={{ padding: '9px 16px', fontSize: '0.88rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink style={{ width: '15px', height: '15px' }} />
              <span>Test Public Verification</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyVerificationLink}
              style={{
                background: copiedLink ? '#ecfdf5' : '#ffffff',
                border: `1px solid ${copiedLink ? '#10b981' : '#cbd5e1'}`,
                borderRadius: '8px',
                padding: '9px 14px',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: copiedLink ? '#047857' : '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {copiedLink ? <Check style={{ width: '15px', height: '15px' }} /> : <Copy style={{ width: '15px', height: '15px' }} />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Top Batch Banner Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '28px 32px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '20px',
              paddingBottom: '20px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#0f172a', margin: 0, fontFamily: 'monospace' }}>
                  Batch #{batch.batchNumber}
                </h1>
                <StatusBadge status={batch.status} />
                {isExpired && (
                  <span
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <AlertTriangle style={{ width: '14px', height: '14px' }} />
                    EXPIRED BATCH
                  </span>
                )}
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>
                {batch.product?.name || 'Formulated Medicine'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                Code: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{batch.product?.productCode}</span> | Formulation: {batch.product?.dosageForm || 'Tablet'} ({batch.product?.strength || 'Standard'})
              </div>
            </div>

            <div style={{ textAlign: 'right', background: '#f8fafc', padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                Total Production Volume
              </span>
              <strong style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>
                {Number(batch.quantity).toLocaleString()} {batch.unit || 'Units'}
              </strong>
            </div>
          </div>

          {/* Overview Specifications Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px',
              marginTop: '20px',
              fontSize: '0.88rem',
            }}
          >
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Manufacturer
              </span>
              <strong style={{ color: '#0f172a' }}>{mfgOrgName}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Current Custodian
              </span>
              <strong style={{ color: '#2563eb' }}>{custodianOrgName}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Manufacturing Date
              </span>
              <span style={{ fontWeight: '600', color: '#334155' }}>
                {new Date(batch.manufacturingDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </span>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Expiry Date
              </span>
              <span style={{ fontWeight: '700', color: isExpired ? '#dc2626' : '#059669' }}>
                {new Date(batch.expiryDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </span>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Storage Criteria
              </span>
              <span style={{ color: '#334155' }}>{batch.storageRequirements || 'Standard controlled storage'}</span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Blockchain Proof & QR Serialization */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
            marginBottom: '28px',
          }}
        >
          {/* Blockchain Verification Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  Blockchain Verification Record
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Cryptographic SHA-256 integrity proof</span>
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  Proof Anchor Status
                </span>
                <span style={{ color: '#059669', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 style={{ width: '15px', height: '15px' }} />
                  Recorded & Verified On-Chain
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  SHA-256 Batch Hash
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a', wordBreak: 'break-all', fontSize: '0.82rem' }}>
                  {batch.batchHash || 'N/A'}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  Transaction Hash
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2563eb', wordBreak: 'break-all', fontSize: '0.82rem' }}>
                  {batch.blockchainTxHash || batch.batchHash}
                </span>
              </div>

              {batch.blockNumber && (
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>
                    Block Number
                  </span>
                  <span style={{ fontWeight: '700', color: '#334155' }}>#{batch.blockNumber}</span>
                </div>
              )}

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  Network
                </span>
                <span style={{ fontWeight: '600', color: '#475569' }}>
                  {batch.blockchainNetwork || 'Sepolia Ethereum Testnet (Simulated Proof)'}
                </span>
              </div>
            </div>
          </div>

          {/* QR Serialization Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', justifyContent: 'center' }}>
              <QrCode style={{ width: '20px', height: '20px', color: '#2563eb' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                QR Serialization & Verification
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
              Public verification ID: <code style={{ color: '#2563eb', fontWeight: '700' }}>{batch.qrIdentifier || batch.batchNumber}</code>
            </p>

            <QRCodeGenerator
              identifier={batch.qrIdentifier || batch.batchNumber}
              batchNumber={batch.batchNumber}
              productName={batch.product?.name}
              size={200}
              showControls={true}
            />
          </div>
        </div>

        {/* Supply-Chain Custody Timeline Section */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '28px 32px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Supply-Chain Provenance & Custody History
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                Chronological record of manufacturing, transfer, and verification events
              </p>
            </div>
            <span
              style={{
                background: '#eff6ff',
                color: '#2563eb',
                padding: '6px 12px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '700',
              }}
            >
              {events.length} Recorded Checkpoints
            </span>
          </div>

          <Timeline events={events} />
        </div>
      </div>
    </div>
  );
}
