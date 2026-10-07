import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  QrCode,
  Layers,
  MapPin,
  User,
  History,
  Lock,
  ArrowRight,
  Truck,
  Store,
  Factory,
  Tag
} from 'lucide-react';

const AdminBatchesPage = () => {
  // Data State
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    delivered: 0,
    issues: 0,
    expired: 0,
    onChain: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // UI & Filter States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [expiryFilter, setExpiryFilter] = useState('ALL');
  const [blockchainFilter, setBlockchainFilter] = useState('ALL');

  // Detail Modal State
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batchDetail, setBatchDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Regulatory Action Modal States (Recall / Flag / Clear)
  const [actionBatch, setActionBatch] = useState(null);
  const [actionType, setActionType] = useState('RECALL'); // RECALL | FLAG | CLEAR
  const [actionReasonCategory, setActionReasonCategory] = useState('Quality Control Failure');
  const [actionReasonDetails, setActionReasonDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Fetch paginated batches
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim(),
        status: statusFilter,
        role: roleFilter,
        expiry: expiryFilter,
        blockchain: blockchainFilter,
      };

      const res = await adminApi.getBatches(params);

      if (res && res.success && res.data) {
        setBatches(res.data.batches || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages || res.data.pagination.pages || 1,
          }));
        }
      } else {
        throw new Error(res?.message || 'Failed to retrieve batch ledger records.');
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err.message || 'Unable to connect to batch monitoring service.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, roleFilter, expiryFilter, blockchainFilter]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Open batch detail & custody history modal
  const handleOpenDetails = async (batchId) => {
    setSelectedBatchId(batchId);
    setBatchDetail(null);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const res = await adminApi.getBatchById(batchId);
      if (res && res.success && res.data) {
        setBatchDetail(res.data);
      } else {
        throw new Error(res?.message || 'Failed to load batch traceability data.');
      }
    } catch (err) {
      console.error('Error loading batch details:', err);
      setDetailError(err.message || 'Could not fetch batch details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedBatchId(null);
    setBatchDetail(null);
    setDetailError(null);
  };

  // Open regulatory action modal
  const handleOpenAction = (batch, type) => {
    setActionBatch(batch);
    setActionType(type);
    setActionReasonCategory(
      type === 'RECALL'
        ? 'Quality Control Failure'
        : type === 'FLAG'
        ? 'Suspicious Supply Chain Anomaly'
        : 'Administrative Inspection Cleared'
    );
    setActionReasonDetails('');
  };

  // Execute recall / flag / clear action
  const handleExecuteAction = async () => {
    if (!actionBatch) return;

    const fullReason = actionReasonDetails.trim()
      ? `${actionReasonCategory}: ${actionReasonDetails.trim()}`
      : actionReasonCategory;

    try {
      setSubmitting(true);
      let res;

      if (actionType === 'RECALL') {
        res = await adminApi.recallBatch(actionBatch._id, fullReason);
      } else if (actionType === 'FLAG') {
        res = await adminApi.flagBatch(actionBatch._id, fullReason);
      } else {
        res = await adminApi.updateBatchStatus(actionBatch._id, 'MANUFACTURED', fullReason);
      }

      if (res && res.success) {
        setFeedback({
          type: 'success',
          text: `Batch #${actionBatch.batchNumber} status successfully updated to ${
            actionType === 'RECALL' ? 'RECALLED' : actionType === 'FLAG' ? 'FLAGGED' : 'MANUFACTURED'
          }.`,
        });
        setTimeout(() => setFeedback({ type: '', text: '' }), 5000);
        setActionBatch(null);
        fetchBatches();
      } else {
        setFeedback({ type: 'error', text: res?.message || 'Failed to apply regulatory action.' });
      }
    } catch (err) {
      console.error('Error executing action:', err);
      setFeedback({ type: 'error', text: 'Error connecting to server for regulatory batch update.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper formatting routines
  const getStatusBadge = (status) => {
    const s = (status || 'MANUFACTURED').toUpperCase();
    if (s === 'RECALLED') {
      return (
        <span className="badge badge-danger" style={{ gap: '5px' }}>
          <XCircle style={{ width: '13px', height: '13px' }} />
          Recalled
        </span>
      );
    }
    if (s === 'FLAGGED') {
      return (
        <span className="badge badge-warning" style={{ gap: '5px', background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>
          <AlertTriangle style={{ width: '13px', height: '13px' }} />
          Flagged
        </span>
      );
    }
    if (s === 'EXPIRED') {
      return (
        <span className="badge badge-purple" style={{ gap: '5px', background: '#fdf2f8', color: '#9d174d', borderColor: '#fbcfe8' }}>
          <Clock style={{ width: '13px', height: '13px' }} />
          Expired
        </span>
      );
    }
    if (s === 'IN_TRANSIT') {
      return (
        <span className="badge badge-info" style={{ gap: '5px' }}>
          <Truck style={{ width: '13px', height: '13px' }} />
          In Transit
        </span>
      );
    }
    if (s === 'RECEIVED' || s === 'DELIVERED' || s === 'DISTRIBUTED' || s === 'SOLD') {
      return (
        <span className="badge badge-success" style={{ gap: '5px' }}>
          <CheckCircle2 style={{ width: '13px', height: '13px' }} />
          {s}
        </span>
      );
    }
    return (
      <span className="badge" style={{ gap: '5px' }}>
        <Factory style={{ width: '13px', height: '13px' }} />
        {s}
      </span>
    );
  };

  const getRoleIcon = (role) => {
    const r = (role || 'MANUFACTURER').toUpperCase();
    if (r.includes('DISTRIBUTOR')) return <Truck style={{ width: '14px', height: '14px', color: '#7c3aed' }} />;
    if (r.includes('PHARMACY')) return <Store style={{ width: '14px', height: '14px', color: '#059669' }} />;
    return <Factory style={{ width: '14px', height: '14px', color: '#2563eb' }} />;
  };

  const getExpiryLabel = (expiryDate) => {
    if (!expiryDate) return <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>N/A</span>;
    const dateObj = new Date(expiryDate);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (dateObj < now) {
      return (
        <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle style={{ width: '13px', height: '13px' }} />
          Expired ({dateObj.toLocaleDateString()})
        </span>
      );
    }
    if (dateObj <= thirtyDays) {
      return (
        <span style={{ color: '#d97706', fontWeight: '700', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock style={{ width: '13px', height: '13px' }} />
          Expiring Soon ({dateObj.toLocaleDateString()})
        </span>
      );
    }
    return <span style={{ color: 'var(--text-heading)', fontSize: '0.825rem', fontWeight: '500' }}>{dateObj.toLocaleDateString()}</span>;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* PAGE HEADER */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid #334155'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  background: 'rgba(37, 99, 235, 0.25)',
                  color: '#93c5fd',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  textTransform: 'uppercase'
                }}
              >
                LIFECYCLE MONITORING
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  fontWeight: '600'
                }}
              >
                <span className="live-dot" style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                Global Ledger Active
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#ffffff', margin: '2px 0 4px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package style={{ width: '28px', height: '28px', color: '#60a5fa' }} />
              Pharmaceutical Batch Monitoring & Traceability
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '680px', margin: 0 }}>
              Controlled administrative console for global pharmaceutical lifecycle monitoring, current custody tracking, and blockchain traceability verification.
            </p>
          </div>

          <div>
            <button
              onClick={fetchBatches}
              disabled={loading}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.85rem',
                fontWeight: '600',
                padding: '9px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: '15px', height: '15px' }} />
              Refresh Ledger Batches
            </button>
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST ALERT */}
      {feedback.text && (
        <div
          className="card"
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            borderColor: feedback.type === 'success' ? '#bbf7d0' : '#fecaca',
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {feedback.type === 'success' ? (
              <CheckCircle2 style={{ width: '20px', height: '20px', color: '#16a34a', flexShrink: 0 }} />
            ) : (
              <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', text: '' })}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      )}

      {/* KPI SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
        {/* Total Batches */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Package style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', lineHeight: 1.1, color: 'var(--text-heading)' }}>
              {summary.total}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
              Total Batches
            </div>
          </div>
        </div>

        {/* Active / In Transit */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: '#bfdbfe', background: '#f8fbff' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
            <Truck style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', lineHeight: 1.1, color: '#1d4ed8' }}>
              {summary.active}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
              In Transit
            </div>
          </div>
        </div>

        {/* Delivered / Sold */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: '#bbf7d0', background: '#f6fdf8' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <CheckCircle2 style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', lineHeight: 1.1, color: '#15803d' }}>
              {summary.delivered}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
              Delivered
            </div>
          </div>
        </div>

        {/* On-Chain Registered */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: '#c7d2fe', background: '#f8f9ff' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
            <ShieldCheck style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', lineHeight: 1.1, color: '#4338ca' }}>
              {summary.onChain}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#3730a3', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
              On-Chain Proof
            </div>
          </div>
        </div>

        {/* Recalled / Flagged */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: '#fecaca', background: '#fff8f8' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <ShieldAlert style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', lineHeight: 1.1, color: '#b91c1c' }}>
              {summary.issues}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
              Recalled / Flag
            </div>
          </div>
        </div>

        {/* Expired Batches */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: '#e9d5ff', background: '#fbf7ff' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
            <Clock style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', lineHeight: 1.1, color: '#6d28d9' }}>
              {summary.expired}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
              Expired
            </div>
          </div>
        </div>
      </div>

      {/* ATTENTION / ANOMALY BANNER */}
      {summary.issues > 0 ? (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            background: '#fff1f2',
            borderColor: '#fecdd3',
            color: '#9f1239',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert style={{ width: '24px', height: '24px', color: '#e11d48', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>
                Attention Required: {summary.issues} Batch Anomaly / Recall Orders Detected
              </div>
              <div style={{ fontSize: '0.8rem', color: '#be123c', marginTop: '2px' }}>
                Certain batches have active regulatory recalls or suspicious quarantine flags attached.
              </div>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('RECALLED')}
            className="btn btn-sm btn-danger"
            style={{ fontWeight: '700' }}
          >
            Filter Recalled Batches
          </button>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: '12px 18px',
            background: '#f0fdf4',
            borderColor: '#bbf7d0',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}
        >
          <ShieldCheck style={{ width: '18px', height: '18px', color: '#16a34a', flexShrink: 0 }} />
          <span>System Healthy: No active recall orders or supply chain anomalies reported across active batches.</span>
        </div>
      )}

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '440px' }}>
            <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search batch #, QR ID, product, or manufacturer..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter style={{ width: '15px', height: '15px', color: 'var(--text-dim)' }} />
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="MANUFACTURED">Manufactured</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="RECEIVED">Received</option>
                <option value="DELIVERED">Delivered</option>
                <option value="DISTRIBUTED">Distributed</option>
                <option value="SOLD">Sold</option>
                <option value="EXPIRED">Expired</option>
                <option value="RECALLED">Recalled</option>
                <option value="FLAGGED">Flagged</option>
              </select>
            </div>

            <select
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <option value="ALL">All Custodian Roles</option>
              <option value="MANUFACTURER">At Manufacturer</option>
              <option value="DISTRIBUTOR">At Distributor</option>
              <option value="PHARMACY">At Pharmacy</option>
            </select>

            <select
              value={expiryFilter}
              onChange={e => {
                setExpiryFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <option value="ALL">All Expiry Dates</option>
              <option value="VALID">Valid / Unexpired</option>
              <option value="EXPIRING_SOON">Expiring Soon (30 Days)</option>
              <option value="EXPIRED">Expired</option>
            </select>

            <select
              value={blockchainFilter}
              onChange={e => {
                setBlockchainFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <option value="ALL">All Proof Types</option>
              <option value="ON_CHAIN">On-Chain Registered</option>
              <option value="OFF_CHAIN">Off-Chain Only</option>
            </select>

            {(search || statusFilter !== 'ALL' || roleFilter !== 'ALL' || expiryFilter !== 'ALL' || blockchainFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setRoleFilter('ALL');
                  setExpiryFilter('ALL');
                  setBlockchainFilter('ALL');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className="btn btn-sm btn-outline"
                style={{ color: 'var(--primary)', borderColor: 'var(--blue-200)', fontSize: '0.8rem' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BATCHES DATA TABLE CARD */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
              Fetching pharmaceutical batch records & custody states...
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <AlertCircle style={{ width: '42px', height: '42px', color: '#dc2626', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px' }}>
              {error}
            </h3>
            <button onClick={fetchBatches} className="btn btn-primary" style={{ marginTop: '8px' }}>
              Retry Connection
            </button>
          </div>
        ) : batches.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Package style={{ width: '44px', height: '44px', color: 'var(--text-dim)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '6px' }}>
              No batch records found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
              {search || statusFilter !== 'ALL' || roleFilter !== 'ALL' || expiryFilter !== 'ALL'
                ? 'No batches match your active search or filter criteria.'
                : 'No pharmaceutical batches have been minted in the system ledger yet.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Batch Number</th>
                  <th>Formulary Product</th>
                  <th>Manufacturer</th>
                  <th>Current Custodian</th>
                  <th>Quantity</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Blockchain Proof</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => {
                  const prodName = batch.product?.name || 'Pharmaceutical Item';
                  const prodCode = batch.product?.productCode || '';
                  const mfgName = batch.manufacturer?.name || 'Origin Manufacturer';
                  const custodianName = batch.currentCustodian?.name || mfgName;

                  return (
                    <tr key={batch._id}>
                      {/* Batch Number */}
                      <td style={{ paddingLeft: '24px' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)', fontSize: '0.925rem' }}>
                            {batch.batchNumber}
                          </div>
                          <a
                            href={`/verify/${batch.qrIdentifier || batch.batchNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-dim)', textDecoration: 'none', marginTop: '2px', fontFamily: 'var(--font-mono)' }}
                          >
                            <QrCode style={{ width: '12px', height: '12px', color: 'var(--primary)' }} />
                            <span>{batch.qrIdentifier ? batch.qrIdentifier.substring(0, 14) + '...' : 'Verify QR'}</span>
                          </a>
                        </div>
                      </td>

                      {/* Product */}
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-heading)', fontSize: '0.9rem' }}>
                          {prodName}
                        </div>
                        {prodCode && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1px', fontFamily: 'var(--font-mono)' }}>
                            SKU: {prodCode}
                          </div>
                        )}
                      </td>

                      {/* Manufacturer */}
                      <td style={{ fontWeight: '500', color: 'var(--text-heading)', fontSize: '0.85rem' }}>
                        {mfgName}
                      </td>

                      {/* Current Custodian */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text-heading)', fontSize: '0.85rem' }}>
                          {getRoleIcon(batch.currentRole)}
                          <span>{custodianName}</span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td style={{ fontWeight: '700', color: 'var(--text-heading)', fontSize: '0.875rem' }}>
                        {batch.quantity} {batch.unit || 'Units'}
                      </td>

                      {/* Expiry Date */}
                      <td>{getExpiryLabel(batch.expiryDate)}</td>

                      {/* Status */}
                      <td>{getStatusBadge(batch.status)}</td>

                      {/* Blockchain Proof */}
                      <td>
                        {batch.blockchainTxHash ? (
                          <span
                            className="badge"
                            style={{ fontFamily: 'var(--font-mono)', background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe', fontSize: '0.75rem', gap: '4px' }}
                            title={batch.blockchainTxHash}
                          >
                            <ShieldCheck style={{ width: '12px', height: '12px', color: '#2563eb' }} />
                            {batch.blockchainTxHash.substring(0, 10)}...
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '500' }}>Off-Chain</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenDetails(batch._id)}
                            className="btn btn-sm btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', borderColor: 'var(--blue-200)', color: 'var(--primary)' }}
                          >
                            <Eye style={{ width: '13px', height: '13px' }} />
                            Inspect Batch
                          </button>

                          {batch.status !== 'RECALLED' ? (
                            <button
                              onClick={() => handleOpenAction(batch, 'RECALL')}
                              className="btn btn-sm btn-danger"
                              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            >
                              Recall
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenAction(batch, 'CLEAR')}
                              className="btn btn-sm btn-success"
                              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            >
                              Clear Flag
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: '#f8fafc',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            <div>
              Showing page <strong style={{ color: 'var(--text-heading)' }}>{pagination.page}</strong> of{' '}
              <strong style={{ color: 'var(--text-heading)' }}>{pagination.totalPages}</strong> ({pagination.total} total batches)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="btn btn-sm btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft style={{ width: '15px', height: '15px' }} />
                Previous
              </button>

              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="btn btn-sm btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Next
                <ChevronRight style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COMPREHENSIVE BATCH TRACEABILITY MODAL */}
      {selectedBatchId && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '880px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  <Package style={{ width: '26px', height: '26px' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
                      Batch Traceability Ledger
                    </h2>
                    {batchDetail?.batch && getStatusBadge(batchDetail.batch.status)}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--primary)', margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                    #{batchDetail?.batch?.batchNumber || 'Batch Identifier'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseDetails}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '6px', borderRadius: '8px' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading batch history & supply chain timeline...</p>
              </div>
            ) : detailError ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <AlertCircle style={{ width: '36px', height: '36px', color: '#dc2626', margin: '0 auto 10px' }} />
                <p style={{ fontWeight: '700', color: 'var(--text-heading)' }}>{detailError}</p>
              </div>
            ) : batchDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* 1. Identity & Custody Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {/* Formulary Product Info */}
                  <div className="card" style={{ padding: '16px', background: '#f8fafc' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag style={{ width: '14px', height: '14px', color: 'var(--primary)' }} />
                      Formulary Product Specification
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.825rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Medicine Name:</span>
                        <span style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                          {batchDetail.batch.product?.name || 'N/A'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Generic Name:</span>
                        <span style={{ color: 'var(--text-heading)' }}>
                          {batchDetail.batch.product?.genericName || 'N/A'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Product Code / SKU:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                          {batchDetail.batch.product?.productCode || 'N/A'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Dosage & Strength:</span>
                        <span style={{ color: 'var(--text-heading)' }}>
                          {batchDetail.batch.product?.dosageForm || 'Formulation'} ({batchDetail.batch.product?.strength || 'Std'})
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Storage Requirements:</span>
                        <span style={{ color: 'var(--text-heading)' }}>
                          {batchDetail.batch.storageRequirements || 'Controlled Room Temperature'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Custody & Stakeholder Info */}
                  <div className="card" style={{ padding: '16px', background: '#f8fafc' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 style={{ width: '14px', height: '14px', color: 'var(--primary)' }} />
                      Manufacturer & Current Custody
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.825rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Origin Manufacturer:</span>
                        <span style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                          {batchDetail.batch.manufacturer?.name || 'N/A'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Current Custodian:</span>
                        <span style={{ fontWeight: '700', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          {getRoleIcon(batchDetail.batch.currentRole)}
                          {batchDetail.batch.currentCustodian?.name || batchDetail.batch.manufacturer?.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Custodian Email:</span>
                        <span style={{ color: 'var(--text-heading)' }}>
                          {batchDetail.batch.currentCustodian?.contactEmail || 'N/A'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Minted Quantity:</span>
                        <span style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                          {batchDetail.batch.quantity} {batchDetail.batch.unit || 'Units'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Expiry Window:</span>
                        <span>{getExpiryLabel(batchDetail.batch.expiryDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Chronological Supply Chain Event Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History style={{ width: '15px', height: '15px', color: 'var(--primary)' }} />
                    Custodial Provenance & Transfer Event Log ({batchDetail.events?.length || 0} Events)
                  </h3>

                  <div className="card" style={{ padding: '18px 20px', background: '#f8fafc' }}>
                    {(!batchDetail.events || batchDetail.events.length === 0) ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center', margin: '12px 0' }}>
                        No supply chain transfer events recorded yet.
                      </p>
                    ) : (
                      <div style={{ position: 'relative', borderLeft: '2px solid #bfdbfe', marginLeft: '12px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {batchDetail.events.map((evt, idx) => (
                          <div key={evt._id || idx} style={{ position: 'relative', fontSize: '0.825rem' }}>
                            {/* Timeline dot */}
                            <div
                              style={{
                                position: 'absolute',
                                left: '-31px',
                                top: '2px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#2563eb',
                                border: '2px solid #ffffff',
                                boxShadow: '0 0 0 2px #93c5fd'
                              }}
                            />

                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '800', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {evt.eventType}
                                {evt.transactionHash && (
                                  <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                    On-Chain
                                  </span>
                                )}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                                {evt.eventDate ? new Date(evt.eventDate).toLocaleString() : 'N/A'}
                              </span>
                            </div>

                            <p style={{ color: 'var(--text-muted)', margin: '2px 0 4px' }}>
                              <strong style={{ color: 'var(--text-heading)' }}>{evt.fromOrganization?.name || 'Origin'}</strong>{' '}
                              <ArrowRight style={{ width: '12px', height: '12px', display: 'inline', color: 'var(--text-dim)' }} />{' '}
                              <strong style={{ color: 'var(--text-heading)' }}>{evt.toOrganization?.name || 'Destination'}</strong>
                            </p>

                            {evt.notes && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}>
                                {evt.notes}
                              </div>
                            )}

                            {evt.transactionHash && (
                              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: '4px' }}>
                                Tx: {evt.transactionHash}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Blockchain Information (Read-Only Section) */}
                <div
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                    <h3 style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Lock style={{ width: '14px', height: '14px' }} />
                      Read-Only Blockchain Proof & Integrity Ledger
                    </h3>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)', padding: '2px 8px', borderRadius: '4px' }}>
                      {batchDetail.verification?.state || 'ON-CHAIN'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Blockchain Network:</div>
                      <div style={{ color: '#e2e8f0', fontWeight: '600' }}>{batchDetail.verification?.network || 'Sepolia Ethereum Testnet'}</div>
                    </div>

                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>On-Chain Block Number:</div>
                      <div style={{ color: '#e2e8f0', fontWeight: '600' }}>{batchDetail.verification?.blockNumber || 'Recorded in protocol'}</div>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Batch Cryptographic SHA-256 Digest:</div>
                      <div style={{ color: '#60a5fa', wordBreak: 'break-all' }}>{batchDetail.verification?.calculatedHash || 'N/A'}</div>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>On-Chain Transaction Hash:</div>
                      <div style={{ color: '#60a5fa', wordBreak: 'break-all' }}>{batchDetail.verification?.storedHash || batchDetail.batch.blockchainTxHash || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* 4. Public QR Verification Link */}
                <div
                  className="card"
                  style={{
                    padding: '12px 18px',
                    background: '#eff6ff',
                    borderColor: '#bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <QrCode style={{ width: '22px', height: '22px', color: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-heading)', fontSize: '0.85rem' }}>
                        Public Consumer Verification Gateway
                      </div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                        QR ID: {batchDetail.batch.qrIdentifier || batchDetail.batch.batchNumber}
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/verify/${batchDetail.batch.qrIdentifier || batchDetail.batch.batchNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                  >
                    <ExternalLink style={{ width: '13px', height: '13px' }} />
                    Open Public Verification
                  </a>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                onClick={handleCloseDetails}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Close Traceability Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGULATORY ACTION MODAL (Recall / Flag / Clear) */}
      {actionBatch && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: actionType === 'RECALL' ? '#fee2e2' : actionType === 'FLAG' ? '#fef3c7' : '#dcfce7',
                  color: actionType === 'RECALL' ? '#dc2626' : actionType === 'FLAG' ? '#d97706' : '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldAlert style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
                  {actionType === 'RECALL'
                    ? 'Issue Regulatory Batch Recall'
                    : actionType === 'FLAG'
                    ? 'Flag Suspicious Anomaly'
                    : 'Clear Batch Flag'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>
                  Batch #{actionBatch.batchNumber}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                  Regulatory Action Category:
                </label>
                <select
                  value={actionReasonCategory}
                  onChange={e => setActionReasonCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  {actionType === 'RECALL' ? (
                    <>
                      <option value="Quality Control Failure">Quality Control Failure</option>
                      <option value="Sub-standard Potency or Formulation">Sub-standard Potency or Formulation</option>
                      <option value="Packaging / Seal Contamination">Packaging / Seal Contamination</option>
                      <option value="Temperature Excursion in Transit">Temperature Excursion in Transit</option>
                      <option value="Regulatory Order Revocation">Regulatory Order Revocation</option>
                      <option value="Other Safety Precaution">Other Safety Precaution</option>
                    </>
                  ) : actionType === 'FLAG' ? (
                    <>
                      <option value="Suspicious Supply Chain Anomaly">Suspicious Supply Chain Anomaly</option>
                      <option value="Unexplained Custody Gap">Unexplained Custody Gap</option>
                      <option value="Documentation Discrepancy">Documentation Discrepancy</option>
                      <option value="Counterfeit Suspect Alert">Counterfeit Suspect Alert</option>
                      <option value="Other Suspicious Activity">Other Suspicious Activity</option>
                    </>
                  ) : (
                    <option value="Administrative Inspection Cleared">Administrative Inspection Cleared</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                  Regulatory Notice Observations / Notes:
                </label>
                <textarea
                  value={actionReasonDetails}
                  onChange={e => setActionReasonDetails(e.target.value)}
                  placeholder="Enter specific audit observations, test results, or official regulatory notice notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
              <button
                onClick={() => setActionBatch(null)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteAction}
                disabled={submitting}
                className={actionType === 'RECALL' ? 'btn btn-danger' : actionType === 'FLAG' ? 'btn' : 'btn btn-success'}
                style={{
                  fontSize: '0.85rem',
                  ...(actionType === 'FLAG' ? { background: '#d97706', color: '#ffffff' } : {})
                }}
              >
                {submitting ? 'Processing...' : 'Confirm Regulatory Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBatchesPage;
