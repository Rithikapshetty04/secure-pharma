import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import {
  Factory,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  RefreshCw,
  Search,
  ShieldCheck,
  Layers,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function ManufacturerDashboardPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const manufacturerOrgId = user?.organization?._id || user?.organization;
  const manufacturerName = user?.organization?.name || user?.name || 'Pharmaceutical Manufacturer';

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [batchesRes, eventsRes, productsRes] = await Promise.all([
        api.getBatches({ limit: 100, manufacturerId: manufacturerOrgId }),
        api.getEvents({ limit: 100 }),
        api.getProducts(),
      ]);

      if (batchesRes && batchesRes.success) {
        setBatches(batchesRes.batches || []);
      }
      if (eventsRes && eventsRes.success) {
        setEvents(eventsRes.events || []);
      }
      if (productsRes && productsRes.success) {
        setProducts(productsRes.products || []);
      }
    } catch (err) {
      console.error('Error fetching manufacturer dashboard:', err);
      setError(err.message || 'Unable to connect to SecurePharma API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute metrics strictly from real data
  const totalBatchesCount = batches.length;
  const activeFacilityBatches = batches.filter(
    (b) => b.status === 'MANUFACTURED' || b.status === 'CREATED' || b.status === 'ACTIVE'
  ).length;
  const inDistributionBatches = batches.filter(
    (b) => b.status === 'IN_TRANSIT' || b.status === 'SHIPPED' || b.status === 'DISPATCHED'
  ).length;
  const completedBatches = batches.filter(
    (b) => b.status === 'DELIVERED' || b.status === 'RECEIVED' || b.status === 'SOLD'
  ).length;

  const expiredOrRecalledBatches = batches.filter(
    (b) => b.status === 'EXPIRED' || b.status === 'RECALLED' || (b.expiryDate && new Date(b.expiryDate) < new Date())
  );

  // Filter transfers relevant to manufacturer
  const manufacturerTransfers = events.filter(
    (e) => e.eventType === 'DISPATCHED' || e.eventType === 'SHIPPED' || e.eventType === 'TRANSFERRED'
  );

  // Total quantity produced
  const totalUnitsProduced = batches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 24px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header & Welcome Banner */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '28px 32px',
            marginBottom: '28px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                }}
              >
                <Factory style={{ width: '24px', height: '24px', color: '#ffffff' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Good day, {manufacturerName}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <StatusBadge status="MANUFACTURER" />
                  <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                    cGMP Certified Plant
                  </span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
              Operational control center for pharmaceutical formulation, batch serialization, and supply chain transfers.
            </p>
          </div>

          {/* Quick Primary Actions Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/manufacturer/batches/create"
              className="btn btn-primary"
              style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '18px', height: '18px' }} />
              <span>Create New Batch</span>
            </Link>

            <Link
              to="/manufacturer/batches"
              className="btn btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.88rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Package style={{ width: '16px', height: '16px' }} />
              <span>View All Batches</span>
            </Link>

            <Link
              to="/manufacturer/transfers"
              className="btn btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.88rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Truck style={{ width: '16px', height: '16px' }} />
              <span>Manage Transfers</span>
            </Link>

            <button
              type="button"
              onClick={loadDashboardData}
              disabled={loading}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#475569',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Refresh Dashboard Data"
            >
              <RefreshCw style={{ width: '16px', height: '16px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Global Error Alert Banner */}
        {error && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              padding: '18px 24px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              color: '#991b1b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle style={{ width: '22px', height: '22px', color: '#dc2626' }} />
              <div>
                <strong style={{ fontSize: '0.92rem', display: 'block' }}>Unable to load dashboard data</strong>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{error}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={loadDashboardData}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 14px' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Attention Banner if Recalled or Expired Batches Exist */}
        {!loading && expiredOrRecalledBatches.length > 0 && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle style={{ width: '22px', height: '22px', color: '#b45309' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#92400e', display: 'block' }}>
                  Attention Required ({expiredOrRecalledBatches.length} {expiredOrRecalledBatches.length === 1 ? 'batch' : 'batches'})
                </strong>
                <span style={{ fontSize: '0.82rem', color: '#78350f' }}>
                  Some manufactured batches have reached expiration or carry active recall status.
                </span>
              </div>
            </div>
            <Link to="/manufacturer/batches" className="btn btn-secondary btn-sm" style={{ borderColor: '#fde68a', color: '#92400e' }}>
              Inspect Batches →
            </Link>
          </div>
        )}

        {/* Real Summary Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '28px',
          }}
        >
          {/* Card 1: Total Batches */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '20px 22px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Batches
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
              {loading ? '-' : totalBatchesCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
              Produced under company license
            </div>
          </div>

          {/* Card 2: Active in Facility */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '20px 22px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active in Facility
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Factory style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#059669', lineHeight: 1 }}>
              {loading ? '-' : activeFacilityBatches.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
              Ready for distribution dispatch
            </div>
          </div>

          {/* Card 3: In Distribution */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '20px 22px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                In Distribution
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#d97706', lineHeight: 1 }}>
              {loading ? '-' : inDistributionBatches.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
              En route or with distributors
            </div>
          </div>

          {/* Card 4: Total Units Produced */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '20px 22px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Units Produced
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#7c3aed', lineHeight: 1 }}>
              {loading ? '-' : totalUnitsProduced.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
              Serialized doses / packages
            </div>
          </div>
        </div>

        {/* Dual Main Content Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: '24px',
            marginBottom: '28px',
          }}
        >
          {/* COLUMN 1: RECENT PRODUCTION BATCHES */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Recent Production Batches
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
                  Latest manufactured pharmaceutical lots
                </p>
              </div>

              <Link
                to="/manufacturer/batches"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>View All</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <RefreshCw style={{ width: '24px', height: '24px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading batch inventory...</span>
              </div>
            ) : batches.length === 0 ? (
              /* Empty State */
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  margin: 'auto 0',
                }}
              >
                <Package style={{ width: '36px', height: '36px', color: '#94a3b8', margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '0.98rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>
                  No batches created yet
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px' }}>
                  You haven't manufactured any pharmaceutical batches yet.
                </p>
                <Link
                  to="/manufacturer/batches/create"
                  className="btn btn-primary btn-sm"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  + Create Your First Batch
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {batches.slice(0, 5).map((b) => (
                  <div
                    key={b._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      gap: '12px',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: '700',
                          fontSize: '0.9rem',
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {b.product?.name || 'Pharmaceutical Batch'}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#475569', fontFamily: 'monospace', marginTop: '2px' }}>
                        Batch #{b.batchNumber} • {b.quantity ? b.quantity.toLocaleString() : '-'} {b.unit || 'units'}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        Mfg: {new Date(b.manufacturingDate).toLocaleDateString()} • Exp:{' '}
                        <span style={{ color: new Date(b.expiryDate) < new Date() ? '#dc2626' : 'inherit', fontWeight: new Date(b.expiryDate) < new Date() ? '700' : 'normal' }}>
                          {new Date(b.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <StatusBadge status={b.status} />
                      <Link
                        to={`/manufacturer/batches/${b._id}`}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          color: '#2563eb',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                        }}
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 2: RECENT CUSTODY TRANSFERS */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Recent Custody Transfers
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
                  Handover records to wholesale distributors
                </p>
              </div>

              <Link
                to="/manufacturer/history"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>View History</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <RefreshCw style={{ width: '24px', height: '24px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading transfer activity...</span>
              </div>
            ) : manufacturerTransfers.length === 0 ? (
              /* Empty State */
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  margin: 'auto 0',
                }}
              >
                <Truck style={{ width: '36px', height: '36px', color: '#94a3b8', margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '0.98rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>
                  No transfers logged yet
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px' }}>
                  Dispatch manufactured batches to verified wholesale distributors.
                </p>
                <Link
                  to="/manufacturer/transfers"
                  className="btn btn-primary btn-sm"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Initiate Transfer
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {manufacturerTransfers.slice(0, 5).map((evt) => (
                  <div
                    key={evt._id}
                    style={{
                      padding: '14px 16px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StatusBadge status={evt.eventType} />
                        <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a', fontFamily: 'monospace' }}>
                          Batch #{evt.batch?.batchNumber || 'Lot'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(evt.eventDate).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                      Recipient: <strong>{evt.toOrganization?.name || 'Wholesale Distributor'}</strong>
                    </div>

                    {evt.transactionHash && (
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600', fontFamily: 'monospace', marginTop: '4px', wordBreak: 'break-all' }}>
                        Proof: {evt.transactionHash.slice(0, 20)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Traceability & Data Integrity Section */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px 28px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#f3e8ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 2px' }}>
                Cryptographic Traceability Status
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                {batches.length} production lots anchored with SHA-256 digital hashes.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
              ✓ Data Integrity Verified
            </span>
            <Link to="/verify" className="btn btn-secondary btn-sm" style={{ fontSize: '0.82rem' }}>
              Verify QR →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
