import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import {
  Package,
  Plus,
  Search,
  Filter,
  QrCode,
  Eye,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Building,
  Clock,
  ArrowRight,
  ExternalLink,
  Pill,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function ManufacturerBatchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQRBatch, setSelectedQRBatch] = useState(null);

  const loadBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getBatches({
        search: search.trim(),
        status: statusFilter,
        limit: 100,
      });
      if (res && res.success) {
        setBatches(res.batches || []);
        setTotal(res.total || 0);
      } else {
        setError(res?.message || 'Failed to load batches.');
      }
    } catch (err) {
      console.error('Error fetching manufacturer batches:', err);
      setError(err.message || 'Server error loading batch inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBatches();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    loadBatches();
  };

  // Derived real summary counts from loaded batch list
  const manufacturedCount = batches.filter((b) => b.status === 'MANUFACTURED' || b.status === 'CREATED').length;
  const inTransitCount = batches.filter((b) => ['IN_TRANSIT', 'SHIPPED', 'DISTRIBUTED', 'TRANSFERRED'].includes(b.status)).length;
  const expiredCount = batches.filter(
    (b) => b.status === 'EXPIRED' || b.status === 'RECALLED' || new Date(b.expiryDate) < new Date()
  ).length;

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                Inventory Workspace
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Org: <strong style={{ color: '#0f172a' }}>{user?.organization?.name || 'Manufacturer'}</strong>
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0, tracking: '-0.02em' }}>
              Batch Management
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              View and manage pharmaceutical batches registered by your organization.
            </p>
          </div>

          <Link
            to="/manufacturer/batches/create"
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '0.92rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            <span>Create Batch</span>
          </Link>
        </div>

        {/* Real Aggregate Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px 22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Total Batches
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>
              {loading ? '...' : total}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Registered in organization ledger
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px 22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Manufactured / Active
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669' }}>
              {loading ? '...' : manufacturedCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Currently in cleanroom storage
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px 22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                In Transit / Transferred
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706' }}>
              {loading ? '...' : inTransitCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Dispatched in supply chain
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px 22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Expired / Recalled
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#dc2626' }}>
              {loading ? '...' : expiredCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Expired or flagged batches
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            marginBottom: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <Search style={{ width: '18px', height: '18px', color: '#94a3b8', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Batch ID, Medicine name, or Product code..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ minWidth: '180px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  background: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="">All Statuses</option>
                <option value="MANUFACTURED">MANUFACTURED</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="RECALLED">RECALLED</option>
                <option value="FLAGGED">FLAGGED</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: '700' }}>
              Search
            </button>

            {(search || statusFilter) && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  color: '#475569',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw style={{ width: '14px', height: '14px' }} />
                <span>Reset</span>
              </button>
            )}
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '16px 20px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#991b1b',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>{error}</span>
            </div>
            <button
              onClick={loadBatches}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Batches Table / Cards */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <RefreshCw style={{ width: '32px', height: '32px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Fetching manufacturer batch ledger...</div>
            </div>
          ) : batches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Package style={{ width: '28px', height: '28px' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                {search || statusFilter ? 'No matching batches found' : 'No batches registered yet'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 20px' }}>
                {search || statusFilter
                  ? 'Try searching with a different batch number, medicine name, or resetting your status filter.'
                  : 'Register your first pharmaceutical lot to start recording supply-chain custody and generating verification QR codes.'}
              </p>
              {search || statusFilter ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: '600' }}
                >
                  Clear Filters & Search
                </button>
              ) : (
                <Link
                  to="/manufacturer/batches/create"
                  className="btn btn-primary"
                  style={{ padding: '11px 22px', fontSize: '0.9rem', fontWeight: '700' }}
                >
                  + Create Your First Batch
                </Link>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px' }}>MEDICINE</th>
                    <th style={{ padding: '12px 14px' }}>BATCH ID</th>
                    <th style={{ padding: '12px 14px' }}>QUANTITY</th>
                    <th style={{ padding: '12px 14px' }}>MFG DATE</th>
                    <th style={{ padding: '12px 14px' }}>EXPIRY DATE</th>
                    <th style={{ padding: '12px 14px' }}>STATUS</th>
                    <th style={{ padding: '12px 14px' }}>QR</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => {
                    const isExpired = new Date(b.expiryDate) < new Date();
                    return (
                      <tr
                        key={b._id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>
                            {b.product?.name || 'Formulated Medicine'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {b.product?.dosageForm} ({b.product?.strength || 'Standard'}) — <span style={{ fontFamily: 'monospace' }}>{b.product?.productCode}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#2563eb', fontSize: '0.9rem' }}>
                            {b.batchNumber}
                          </span>
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.88rem', color: '#334155', fontWeight: '600' }}>
                          {Number(b.quantity).toLocaleString()} {b.unit || 'Units'}
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.85rem', color: '#475569' }}>
                          {new Date(b.manufacturingDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '700', color: isExpired ? '#dc2626' : '#059669' }}>
                            {new Date(b.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                          {isExpired && (
                            <span style={{ fontSize: '0.7rem', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: '700' }}>
                              EXPIRED
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px' }}>
                          <StatusBadge status={b.status} />
                        </td>

                        <td style={{ padding: '14px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedQRBatch(b)}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <QrCode style={{ width: '14px', height: '14px' }} />
                            <span>QR Code</span>
                          </button>
                        </td>

                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Link
                              to={`/manufacturer/batches/${b._id}`}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye style={{ width: '14px', height: '14px' }} />
                              <span>Details</span>
                            </Link>

                            <Link
                              to={`/manufacturer/transfers/${b._id}`}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', fontWeight: '600', color: '#334155', borderColor: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Truck style={{ width: '14px', height: '14px' }} />
                              <span>Transfer</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Interactive QR Overlay Modal */}
      {selectedQRBatch && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedQRBatch(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>Batch QR Authenticity</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Public verification QR identifier</span>
              </div>
              <button
                onClick={() => setSelectedQRBatch(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <QRCodeGenerator
              identifier={selectedQRBatch.qrIdentifier || selectedQRBatch.batchNumber}
              batchNumber={selectedQRBatch.batchNumber}
              productName={selectedQRBatch.product?.name}
              size={220}
              showControls={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
