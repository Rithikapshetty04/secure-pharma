import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auditApi } from '../../services/api';
import {
  Activity,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Building2,
  RefreshCw,
  Lock,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Server,
  Link2,
  Cpu,
  Package,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

const AdminAuditPage = () => {
  const { user: currentUser } = useAuth();

  // Data States
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    applicationEvents: 0,
    blockchainEvents: 0,
    onChainBatches: 0,
  });
  const [blockchainMonitoring, setBlockchainMonitoring] = useState({
    status: 'NOT_CONFIGURED',
    network: null,
    rpcUrl: null,
    latestBlock: null,
    contractAddress: null,
    isContractConfigured: false,
    message: null,
    totalOnChainEvents: 0,
    totalOnChainBatches: 0,
    latestTx: null,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  // UI & Filter States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copiedHash, setCopiedHash] = useState('');

  // Detail Modal State
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Role verification (ADMIN, SUPER_ADMIN, REGULATOR)
  const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'REGULATOR'].includes(currentUser?.role?.toUpperCase());

  // Fetch paginated audit logs from backend
  const fetchLogs = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim(),
        source: sourceFilter,
        action: actionFilter,
        status: statusFilter,
        startDate: startDate || '',
        endDate: endDate || '',
      };

      const res = await auditApi.getLogs(params);

      if (res && res.success && res.data) {
        setLogs(res.data.logs || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.blockchainMonitoring) {
          setBlockchainMonitoring(res.data.blockchainMonitoring);
        }
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages || Math.ceil(res.data.pagination.total / prev.limit) || 1,
          }));
        }
      } else {
        throw new Error(res?.message || 'Failed to retrieve immutable audit ledger records.');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Unable to connect to audit logging ledger service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, search, sourceFilter, actionFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    if (isAdminRole) {
      fetchLogs();
    }
  }, [fetchLogs, isAdminRole]);

  // Open log detail modal
  const handleOpenDetail = async (logId) => {
    setSelectedLogId(logId);
    setSelectedLog(null);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const res = await auditApi.getLogById(logId);
      if (res && res.success && res.data && res.data.log) {
        setSelectedLog(res.data.log);
      } else {
        throw new Error(res?.message || 'Failed to load audit record details.');
      }
    } catch (err) {
      console.error('Error fetching log details:', err);
      // Fallback: check if record already exists in current logs array
      const localLog = logs.find(l => l._id === logId);
      if (localLog) {
        setSelectedLog(localLog);
      } else {
        setDetailError(err.message || 'Could not fetch record details.');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedLogId(null);
    setSelectedLog(null);
    setDetailError(null);
  };

  // Copy helper
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(''), 2500);
  };

  // Source Badge Formatter: Clearly distinguishing Off-Chain vs On-Chain
  const getSourceBadge = (source) => {
    const s = (source || 'APPLICATION').toUpperCase();
    if (s === 'BLOCKCHAIN') {
      return (
        <span
          className="badge"
          style={{
            background: '#e0e7ff',
            color: '#3730a3',
            borderColor: '#c7d2fe',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            gap: '5px'
          }}
        >
          <Layers style={{ width: '12px', height: '12px' }} />
          Blockchain (On-Chain)
        </span>
      );
    }
    return (
      <span
        className="badge"
        style={{
          background: '#f1f5f9',
          color: '#334155',
          borderColor: '#cbd5e1',
          fontSize: '0.72rem',
          gap: '5px'
        }}
      >
        <Server style={{ width: '12px', height: '12px' }} />
        Application (Off-Chain)
      </span>
    );
  };

  // Status Badge Formatter
  const getStatusBadge = (status) => {
    const s = (status || 'SUCCESS').toUpperCase();
    if (s === 'CONFIRMED' || s === 'SUCCESS') {
      return (
        <span className="badge badge-success" style={{ gap: '4px', fontSize: '0.72rem' }}>
          <CheckCircle2 style={{ width: '12px', height: '12px' }} />
          {s === 'CONFIRMED' ? 'Confirmed' : 'Success'}
        </span>
      );
    }
    if (s === 'FAILED' || s === 'REJECTED') {
      return (
        <span className="badge badge-danger" style={{ gap: '4px', fontSize: '0.72rem' }}>
          <XCircle style={{ width: '12px', height: '12px' }} />
          Failed
        </span>
      );
    }
    return (
      <span className="badge badge-warning" style={{ gap: '4px', fontSize: '0.72rem' }}>
        <Clock style={{ width: '12px', height: '12px' }} />
        {s}
      </span>
    );
  };

  // Guard for non-admin users
  if (!currentUser || !isAdminRole) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <Lock style={{ width: '48px', height: '48px', color: '#e11d48', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            You do not have administrative authorization to access the immutable audit ledger.
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            Return to Authorized Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const hasActiveFilters = Boolean(
    search ||
    sourceFilter !== 'ALL' ||
    actionFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    startDate ||
    endDate
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* TOP BREADCRUMB & TABS NAVIGATION */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Admin Dashboard
          </Link>
          <span>/</span>
          <span style={{ fontWeight: '700', color: '#2563eb' }}>Audit & Monitoring</span>
        </div>

        <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '4px', borderRadius: '10px', gap: '4px' }}>
          <Link
            to="/admin/audit"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '700',
              color: '#1d4ed8',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Activity style={{ width: '14px', height: '14px' }} />
            Audit & Compliance Logs
          </Link>
          <Link
            to="/admin/audit/ledger"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '600',
              color: '#475569',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers style={{ width: '14px', height: '14px' }} />
            Blockchain Ledger
          </Link>
        </div>
      </div>

      {/* 1. PAGE HEADER */}
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
                REGULATORY COMPLIANCE LEDGER
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
                Read-Only Audit Portal Active
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#ffffff', margin: '2px 0 4px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity style={{ width: '28px', height: '28px', color: '#60a5fa' }} />
              Audit & Blockchain Monitoring
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '680px', margin: 0 }}>
              Read-only compliance audit portal providing immutable verification of off-chain application activity and on-chain blockchain protocol events.
            </p>
          </div>

          <div>
            <button
              onClick={() => fetchLogs(true)}
              disabled={loading || refreshing}
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
              <RefreshCw className={refreshing || loading ? 'animate-spin' : ''} style={{ width: '15px', height: '15px' }} />
              Refresh Audit Ledger
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL SUMMARY METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Total Audit Events */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Activity style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.1, color: 'var(--text-heading)' }}>
              {summary.totalEvents}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
              Total Audit Events
            </div>
          </div>
        </div>

        {/* Application Events (Off-Chain) */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <Server style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.1, color: 'var(--text-heading)' }}>
              {summary.applicationEvents}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
              Application (Off-Chain)
            </div>
          </div>
        </div>

        {/* Blockchain Events (On-Chain) */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderColor: '#c7d2fe', background: '#f8f9ff' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
            <Layers style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.1, color: '#4338ca' }}>
              {summary.blockchainEvents}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#3730a3', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
              Blockchain (On-Chain)
            </div>
          </div>
        </div>

        {/* Blockchain Provider Status */}
        <div
          className="card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderColor: blockchainMonitoring.status === 'CONNECTED' ? '#bbf7d0' : '#fed7aa',
            background: blockchainMonitoring.status === 'CONNECTED' ? '#f6fdf8' : '#fffaf0'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: blockchainMonitoring.status === 'CONNECTED' ? '#dcfce7' : '#ffedd5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: blockchainMonitoring.status === 'CONNECTED' ? '#16a34a' : '#d97706'
            }}
          >
            <Cpu style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: blockchainMonitoring.status === 'CONNECTED' ? '#15803d' : '#9a3412', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {blockchainMonitoring.status === 'CONNECTED' ? (
                <>
                  <span className="live-dot" style={{ background: '#16a34a', width: '8px', height: '8px' }} />
                  CONNECTED
                </>
              ) : blockchainMonitoring.status === 'UNAVAILABLE' ? (
                <>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                  UNAVAILABLE
                </>
              ) : (
                <>
                  <Info style={{ width: '16px', height: '16px', color: '#d97706' }} />
                  NOT CONFIGURED
                </>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
              Provider RPC Status
            </div>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED BLOCKCHAIN MONITORING PANEL */}
      <div
        className="card"
        style={{
          padding: '22px 26px',
          background: '#0f172a',
          color: '#ffffff',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #334155', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu style={{ width: '22px', height: '22px', color: '#818cf8' }} />
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f1f5f9', margin: 0 }}>
                Blockchain Infrastructure & Smart Contract Monitoring
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Real-time status of configured blockchain provider node and deployed smart contract telemetry.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/admin/audit/ledger"
              style={{
                background: '#2563eb',
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
              }}
            >
              <Layers style={{ width: '13px', height: '13px' }} />
              Open Blockchain Ledger →
            </Link>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: '700',
                background: blockchainMonitoring.status === 'CONNECTED' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: blockchainMonitoring.status === 'CONNECTED' ? '#34d399' : '#fbbf24',
                border: `1px solid ${blockchainMonitoring.status === 'CONNECTED' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                padding: '4px 12px',
                borderRadius: '9999px'
              }}
            >
            {blockchainMonitoring.status === 'CONNECTED' ? (
              <>
                <span className="live-dot" style={{ width: '6px', height: '6px', background: '#34d399' }} />
                RPC Node Active
              </>
            ) : blockchainMonitoring.status === 'UNAVAILABLE' ? (
              <>
                <AlertTriangle style={{ width: '13px', height: '13px', color: '#f87171' }} />
                Node Offline
              </>
            ) : (
              <>
                <Info style={{ width: '13px', height: '13px', color: '#fbbf24' }} />
                Provider Unconfigured
              </>
            )}
          </span>
        </div>
      </div>

        {/* Telemetry Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          {/* Target Network Card */}
          <div style={{ background: '#1e293b', padding: '14px 16px', borderRadius: '10px', border: '1px solid #334155' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Target Blockchain Network
            </div>
            <div style={{ color: '#93c5fd', fontWeight: '700', fontSize: '0.875rem' }}>
              {blockchainMonitoring.network || '—'}
            </div>
            {blockchainMonitoring.latestBlock && (
              <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '4px' }}>
                Node Block Height: #{blockchainMonitoring.latestBlock}
              </div>
            )}
          </div>

          {/* Smart Contract Address Card */}
          <div style={{ background: '#1e293b', padding: '14px 16px', borderRadius: '10px', border: '1px solid #334155', gridColumn: 'span 2' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Deployed Smart Contract Address
            </div>
            {blockchainMonitoring.contractAddress ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ color: '#818cf8', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                  {blockchainMonitoring.contractAddress}
                </span>
                <button
                  onClick={() => copyToClipboard(blockchainMonitoring.contractAddress)}
                  style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer', color: '#94a3b8', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
                  title="Copy Contract Address"
                >
                  {copiedHash === blockchainMonitoring.contractAddress ? (
                    <>
                      <Check style={{ width: '13px', height: '13px', color: '#34d399' }} />
                      <span style={{ color: '#34d399' }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy style={{ width: '13px', height: '13px' }} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Contract address not configured in environment (CONTRACT_ADDRESS)
              </span>
            )}
          </div>
        </div>

        {/* Real Status / Non-Breaking Notice */}
        {blockchainMonitoring.status !== 'CONNECTED' && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.8rem',
              color: '#fef3c7'
            }}
          >
            <Info style={{ width: '16px', height: '16px', color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fde68a', display: 'block', marginBottom: '2px' }}>
                {blockchainMonitoring.status === 'NOT_CONFIGURED' ? 'Blockchain Provider Unconfigured' : 'Blockchain Provider Unavailable'}
              </strong>
              {blockchainMonitoring.message || 'Blockchain provider is not configured. Historical on-chain event records and batch cryptographic hashes stored in the ledger remain fully accessible below.'}
            </div>
          </div>
        )}

        {/* Latest Verified On-Chain Transaction Feed */}
        {blockchainMonitoring.latestTx ? (
          <div
            style={{
              background: '#1e293b',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #334155',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link2 style={{ width: '16px', height: '16px', color: '#818cf8', flexShrink: 0 }} />
              <span style={{ color: '#cbd5e1' }}>
                Latest Recorded Checkpoint:{' '}
                <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {blockchainMonitoring.latestTx.batchNumber ? `#${blockchainMonitoring.latestTx.batchNumber}` : 'Batch'}
                </strong>{' '}
                ({blockchainMonitoring.latestTx.eventType})
                {blockchainMonitoring.latestTx.from && (
                  <span style={{ color: '#94a3b8' }}> • {blockchainMonitoring.latestTx.from} → {blockchainMonitoring.latestTx.to}</span>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#93c5fd', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={blockchainMonitoring.latestTx.txHash}
              >
                Tx: {blockchainMonitoring.latestTx.txHash}
              </span>
              <button
                onClick={() => copyToClipboard(blockchainMonitoring.latestTx.txHash)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                title="Copy Transaction Hash"
              >
                {copiedHash === blockchainMonitoring.latestTx.txHash ? (
                  <Check style={{ width: '14px', height: '14px', color: '#34d399' }} />
                ) : (
                  <Copy style={{ width: '14px', height: '14px' }} />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontStyle: 'italic' }}>
            No on-chain transaction checkpoints recorded in ledger database yet.
          </div>
        )}
      </div>

      {/* 4. SEARCH AND FILTERS TOOLBAR */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search action, actor, details, entity, or tx hash..."
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
            {/* Source Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter style={{ width: '15px', height: '15px', color: 'var(--text-dim)' }} />
              <select
                value={sourceFilter}
                onChange={e => {
                  setSourceFilter(e.target.value);
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                <option value="ALL">All Event Sources</option>
                <option value="APPLICATION">Application (Off-Chain)</option>
                <option value="BLOCKCHAIN">Blockchain (On-Chain)</option>
              </select>
            </div>

            {/* Action Category Filter */}
            <select
              value={actionFilter}
              onChange={e => {
                setActionFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <option value="ALL">All Action Categories</option>
              <option value="USER_AUTH">User & Authentication</option>
              <option value="LICENSE">License Verification</option>
              <option value="BATCH">Batch Operations</option>
              <option value="SUPPLY_CHAIN">Supply Chain Custody</option>
            </select>

            {/* Status Filter */}
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
              <option value="ALL">All Result Statuses</option>
              <option value="SUCCESS">Success / Confirmed</option>
              <option value="FAILED">Failed / Rejected</option>
            </select>

            {/* Date Filters */}
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              title="Start Date (UTC)"
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem'
              }}
            />

            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              title="End Date (UTC)"
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem'
              }}
            />

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch('');
                  setSourceFilter('ALL');
                  setActionFilter('ALL');
                  setStatusFilter('ALL');
                  setStartDate('');
                  setEndDate('');
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

      {/* 5. AUDIT LOGS DATA TABLE CARD */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && !refreshing ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
              Querying database audit logs & blockchain event records...
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <AlertCircle style={{ width: '42px', height: '42px', color: '#dc2626', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px' }}>
              {error}
            </h3>
            <button onClick={() => fetchLogs()} className="btn btn-primary" style={{ marginTop: '8px' }}>
              Retry Connection
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Activity style={{ width: '44px', height: '44px', color: 'var(--text-dim)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '6px' }}>
              No audit records found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
              {hasActiveFilters
                ? 'No audit logs or blockchain events match your filter parameters.'
                : 'System events will be appended to the immutable audit log as operational activity occurs.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Timestamp (UTC)</th>
                  <th>Source</th>
                  <th>Action / Event</th>
                  <th>Actor / Role</th>
                  <th>Target Entity</th>
                  <th>Status</th>
                  <th>Operational Details & Proof</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const actorName = log.actor?.name || (log.source === 'BLOCKCHAIN' ? 'Custodian Node' : 'System');
                  const actorRole = log.actor?.role || log.organization?.type || (log.source === 'BLOCKCHAIN' ? 'Node' : 'System');

                  return (
                    <tr key={log._id}>
                      {/* Timestamp */}
                      <td style={{ paddingLeft: '24px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {log.timestamp ? new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '—'}
                      </td>

                      {/* Source Badge */}
                      <td style={{ whiteSpace: 'nowrap' }}>{getSourceBadge(log.source)}</td>

                      {/* Action / Event */}
                      <td>
                        <span style={{ fontWeight: '800', color: 'var(--text-heading)', fontSize: '0.825rem', letterSpacing: '0.02em' }}>
                          {log.action || '—'}
                        </span>
                      </td>

                      {/* Actor */}
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-heading)', fontSize: '0.85rem' }}>
                          {actorName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1px' }}>
                          {actorRole}
                        </div>
                      </td>

                      {/* Target Entity */}
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-heading)', fontSize: '0.825rem' }}>
                          {log.entityType || 'System'}
                        </div>
                        {log.batchNumber && log.batchNumber !== '—' && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', marginTop: '1px' }}>
                            #{log.batchNumber}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ whiteSpace: 'nowrap' }}>{getStatusBadge(log.status)}</td>

                      {/* Operational Details & Proof */}
                      <td style={{ maxWidth: '280px' }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={log.details}
                        >
                          {log.details || '—'}
                        </div>
                        {log.transactionHash && (
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.72rem',
                              color: 'var(--primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px'
                            }}
                            title={log.transactionHash}
                          >
                            Tx: {log.transactionHash.substring(0, 14)}...
                          </div>
                        )}
                      </td>

                      {/* Inspect Record Action */}
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <button
                          onClick={() => handleOpenDetail(log._id)}
                          className="btn btn-sm btn-outline"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderColor: 'var(--blue-200)',
                            color: 'var(--primary)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <Eye style={{ width: '13px', height: '13px' }} />
                          Inspect Record
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. SERVER-SIDE PAGINATION FOOTER */}
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
              <strong style={{ color: 'var(--text-heading)' }}>{pagination.totalPages}</strong> ({pagination.total} total events)
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

      {/* 7. DETAILED INSPECTION MODAL */}
      {selectedLogId && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '760px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  <Activity style={{ width: '26px', height: '26px' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
                      {selectedLog?.action || 'Audit Record'}
                    </h2>
                    {selectedLog && getSourceBadge(selectedLog.source)}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '3px 0 0', fontFamily: 'var(--font-mono)' }}>
                    Ledger Identifier: {selectedLogId}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseDetail}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '6px', borderRadius: '8px' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading audit metadata & correlated proofs...</p>
              </div>
            ) : detailError ? (
              <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                <AlertCircle style={{ width: '36px', height: '36px', color: '#dc2626', margin: '0 auto 10px' }} />
                <p style={{ fontWeight: '700', color: 'var(--text-heading)' }}>{detailError}</p>
              </div>
            ) : selectedLog ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.825rem' }}>
                {/* 1. Event Attributes */}
                <div className="card" style={{ padding: '16px', background: '#f8fafc' }}>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '10px' }}>
                    Event Specification
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Timestamp (UTC):</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--text-heading)' }}>
                        {selectedLog.timestamp ? new Date(selectedLog.timestamp).toUTCString() : '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Verification Result:</span>
                      <span>{getStatusBadge(selectedLog.status)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Target Entity Type:</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-heading)' }}>{selectedLog.entityType || 'System'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Origin IP Address:</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedLog.ipAddress || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Actor Attribution */}
                <div className="card" style={{ padding: '16px', background: '#f8fafc' }}>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '10px' }}>
                    Actor Attribution
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Recorded By:</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                        {selectedLog.actor?.name || 'System / Automated Ledger'}
                      </span>
                    </div>

                    {selectedLog.actor?.email && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Actor Email:</span>
                        <span>{selectedLog.actor.email}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Actor Role:</span>
                      <span style={{ fontWeight: '600' }}>{selectedLog.actor?.role || 'System'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Organization:</span>
                      <span style={{ color: 'var(--text-heading)' }}>
                        {selectedLog.organization?.name || 'Secure Pharma Network'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Operational Details (Redacted & Sanitized) */}
                <div className="card" style={{ padding: '16px', background: '#f8fafc' }}>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '8px' }}>
                    Operational Event Details
                  </h3>
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      lineHeight: '1.6',
                      color: 'var(--text-heading)',
                      wordBreak: 'break-all'
                    }}
                  >
                    {selectedLog.details || 'No additional details logged.'}
                  </div>
                </div>

                {/* 4. Real Correlation & Cryptographic Proof (Established Only by Real Identifiers) */}
                {(selectedLog.transactionHash || selectedLog.correlatedBatch || (selectedLog.correlatedBlockchainEvents && selectedLog.correlatedBlockchainEvents.length > 0)) && (
                  <div
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 18px',
                      border: '1px solid #334155',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock style={{ width: '14px', height: '14px' }} />
                      Correlated On-Chain Proof & Batch Provenance
                    </div>

                    {selectedLog.correlatedBatch && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #334155' }}>
                        <span style={{ color: '#94a3b8' }}>Correlated Batch:</span>
                        <span style={{ color: '#60a5fa', fontWeight: '700' }}>
                          #{selectedLog.correlatedBatch.batchNumber}{' '}
                          {selectedLog.correlatedBatch.product?.name ? `(${selectedLog.correlatedBatch.product.name})` : ''}
                        </span>
                      </div>
                    )}

                    {selectedLog.transactionHash && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>On-Chain Transaction Hash:</span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#1e293b', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
                          <span style={{ color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {selectedLog.transactionHash}
                          </span>
                          <button
                            onClick={() => copyToClipboard(selectedLog.transactionHash)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                            title="Copy Hash"
                          >
                            {copiedHash === selectedLog.transactionHash ? (
                              <Check style={{ width: '14px', height: '14px', color: '#34d399' }} />
                            ) : (
                              <Copy style={{ width: '14px', height: '14px' }} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Correlated Blockchain Custody Events if applicable */}
                    {selectedLog.correlatedBlockchainEvents && selectedLog.correlatedBlockchainEvents.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                          On-Chain Custody Checkpoints ({selectedLog.correlatedBlockchainEvents.length}):
                        </span>
                        {selectedLog.correlatedBlockchainEvents.map((evt, i) => (
                          <div
                            key={i}
                            style={{
                              background: '#1e293b',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>
                              <strong>{evt.eventType}</strong>: {evt.fromOrganization?.name || 'Origin'} → {evt.toOrganization?.name || 'Destination'}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                              {evt.eventDate ? new Date(evt.eventDate).toLocaleDateString() : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                Read-Only Compliance Record • Immutable Audit Ledger
              </span>
              <button
                onClick={handleCloseDetail}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditPage;
