import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { blockchainLedgerApi } from '../../services/api';
import {
  Activity,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileCode,
  Package,
  Clock,
  ShieldCheck,
  Server,
  Hash,
  Database
} from 'lucide-react';

export default function AdminBlockchainLedgerPage() {
  const { user: currentUser } = useAuth();

  // Role verification (ADMIN, SUPER_ADMIN, REGULATOR)
  const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'REGULATOR'].includes(
    currentUser?.role?.toUpperCase()
  );

  // Ledger Data State
  const [networkOverview, setNetworkOverview] = useState({
    status: 'LOADING',
    network: null,
    chainId: null,
    latestBlock: null,
    contractAddress: null,
    isContractConfigured: false,
    isContractReachable: false,
    message: null,
    totalTransactions: 0,
    totalEvents: 0,
    totalOnChainBatches: 0,
    rpcUrl: null,
  });

  const [transactions, setTransactions] = useState([]);
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
  const [copiedText, setCopiedText] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [batchIdFilter, setBatchIdFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [blockFilter, setBlockFilter] = useState('');

  // Transaction Details Modal State
  const [selectedTxHash, setSelectedTxHash] = useState(null);
  const [txDetails, setTxDetails] = useState(null);
  const [txDetailsLoading, setTxDetailsLoading] = useState(false);
  const [txDetailsError, setTxDetailsError] = useState(null);

  // Fetch ledger data from backend
  const fetchLedger = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const params = {
          page: pagination.page,
          limit: pagination.limit,
          search: search.trim(),
          batchId: batchIdFilter.trim(),
          eventType: eventTypeFilter,
          blockNumber: blockFilter.trim(),
        };

        const res = await blockchainLedgerApi.getLedger(params);

        if (res && res.success && res.data) {
          if (res.data.networkOverview) {
            setNetworkOverview(res.data.networkOverview);
          }
          setTransactions(res.data.transactions || []);
          if (res.data.pagination) {
            setPagination((prev) => ({
              ...prev,
              total: res.data.pagination.total,
              totalPages:
                res.data.pagination.totalPages ||
                Math.ceil(res.data.pagination.total / prev.limit) ||
                1,
            }));
          }
        } else {
          throw new Error(res?.message || 'Failed to retrieve blockchain ledger.');
        }
      } catch (err) {
        console.error('Error fetching blockchain ledger:', err);
        setError(err.message || 'Unable to load blockchain ledger.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pagination.page, pagination.limit, search, batchIdFilter, eventTypeFilter, blockFilter]
  );

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // Copy helper
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2500);
  };

  // Truncate hash
  const truncateHash = (hash, lead = 8, trail = 6) => {
    if (!hash) return '—';
    if (hash.length <= lead + trail) return hash;
    return `${hash.slice(0, lead)}...${hash.slice(-trail)}`;
  };

  // Inspect transaction details in modal
  const handleInspectTx = async (txHash) => {
    try {
      setSelectedTxHash(txHash);
      setTxDetails(null);
      setTxDetailsLoading(true);
      setTxDetailsError(null);

      const res = await blockchainLedgerApi.getTxDetails(txHash);
      if (res && res.success && res.data) {
        setTxDetails(res.data);
      } else {
        throw new Error(res?.message || 'Failed to load transaction receipt details.');
      }
    } catch (err) {
      console.error('Error fetching tx details:', err);
      setTxDetailsError(err.message || 'Could not load transaction receipt.');
    } finally {
      setTxDetailsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedTxHash(null);
    setTxDetails(null);
    setTxDetailsError(null);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearch('');
    setBatchIdFilter('');
    setEventTypeFilter('ALL');
    setBlockFilter('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const hasActiveFilters = Boolean(
    search || batchIdFilter || eventTypeFilter !== 'ALL' || blockFilter
  );

  // Unauthorized guard
  if (!currentUser || !isAdminRole) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <Lock style={{ width: '48px', height: '48px', color: '#e11d48', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Administrative clearance is required to inspect the on-chain blockchain ledger.
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            Return to Authorized Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1360px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* 1. TOP BREADCRUMB & TABS NAVIGATION */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Admin Dashboard
          </Link>
          <span>/</span>
          <Link to="/admin/audit" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Audit & Monitoring
          </Link>
          <span>/</span>
          <span style={{ fontWeight: '700', color: '#2563eb' }}>Blockchain Ledger</span>
        </div>

        {/* Sub-Navigation Tabs */}
        <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '4px', borderRadius: '10px', gap: '4px' }}>
          <Link
            to="/admin/audit"
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
            <Activity style={{ width: '14px', height: '14px' }} />
            Audit & Compliance Logs
          </Link>
          <Link
            to="/admin/audit/ledger"
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
            <Layers style={{ width: '14px', height: '14px' }} />
            Blockchain Ledger
          </Link>
        </div>
      </div>

      {/* 2. HERO PAGE HEADER */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #090d16 0%, #172033 100%)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid #1e293b',
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
                  background: 'rgba(59, 130, 246, 0.25)',
                  color: '#93c5fd',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  textTransform: 'uppercase',
                }}
              >
                ON-CHAIN PROTOCOL LEDGER
              </span>

              {networkOverview.status === 'CONNECTED' ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    color: '#34d399',
                    fontWeight: '600',
                  }}
                >
                  <span className="live-dot" style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                  Live Smart Contract Node Synchronized
                </span>
              ) : networkOverview.status === 'UNAVAILABLE' ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    color: '#f87171',
                    fontWeight: '600',
                  }}
                >
                  <AlertTriangle style={{ width: '14px', height: '14px', color: '#f87171' }} />
                  Blockchain Node Disconnected
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    color: '#fbbf24',
                    fontWeight: '600',
                  }}
                >
                  <Info style={{ width: '14px', height: '14px', color: '#fbbf24' }} />
                  RPC Provider Not Configured
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: '800',
                color: '#ffffff',
                margin: '2px 0 4px',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Layers style={{ width: '28px', height: '28px', color: '#60a5fa' }} />
              PharmaSupplyChain Blockchain Ledger
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '720px', margin: 0 }}>
              Direct on-chain cryptographic ledger of verified pharmaceutical batch creations and custody transitions
              emitted by the deployed Solidity smart contract.
            </p>
          </div>

          <div>
            <button
              onClick={() => fetchLedger(true)}
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
                gap: '8px',
              }}
            >
              <RefreshCw className={refreshing || loading ? 'animate-spin' : ''} style={{ width: '15px', height: '15px' }} />
              Refresh On-Chain Ledger
            </button>
          </div>
        </div>
      </div>

      {/* 3. SECTION A: NETWORK OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Network & Chain ID */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Connected Network
            </span>
            <Server style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            {networkOverview.network || '—'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Chain ID:{' '}
            <strong style={{ color: 'var(--text-heading)' }}>
              {networkOverview.chainId !== null ? networkOverview.chainId : '—'}
            </strong>
          </div>
        </div>

        {/* Latest Block Height */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Latest Block Height
            </span>
            <Hash style={{ width: '16px', height: '16px', color: '#059669' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#059669', fontFamily: 'var(--font-mono)' }}>
            {networkOverview.latestBlock !== null ? `#${networkOverview.latestBlock}` : '—'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Node confirmation height
          </div>
        </div>

        {/* Total On-Chain Transactions */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8f9ff', borderColor: '#c7d2fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#3730a3', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Smart Contract Transactions
            </span>
            <Layers style={{ width: '16px', height: '16px', color: '#4f46e5' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#4338ca' }}>
            {networkOverview.totalTransactions}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6366f1' }}>
            {networkOverview.totalEvents} contract event logs recorded
          </div>
        </div>

        {/* On-Chain Batches Count */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              On-Chain Registered Batches
            </span>
            <Package style={{ width: '16px', height: '16px', color: '#d97706' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#b45309' }}>
            {networkOverview.totalOnChainBatches}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Tracked in contract state array
          </div>
        </div>
      </div>

      {/* CONTRACT TELEMETRY & CONNECTION BANNER */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          background: '#0f172a',
          color: '#ffffff',
          border: '1px solid #1e293b',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <FileCode style={{ width: '22px', height: '22px', color: '#818cf8', flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Deployed Smart Contract Address (PharmaSupplyChain)
            </div>
            {networkOverview.contractAddress ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: '#c7d2fe',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={networkOverview.contractAddress}
                >
                  {networkOverview.contractAddress}
                </span>
                <button
                  onClick={() => copyToClipboard(networkOverview.contractAddress)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid #475569',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedText === networkOverview.contractAddress ? (
                    <>
                      <Check style={{ width: '12px', height: '12px', color: '#34d399' }} />
                      <span style={{ color: '#34d399' }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy style={{ width: '12px', height: '12px' }} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <span style={{ color: '#f87171', fontSize: '0.82rem' }}>
                Contract address not configured in environment (CONTRACT_ADDRESS).
              </span>
            )}
          </div>
        </div>

        {networkOverview.rpcUrl && (
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
            RPC Provider: <span style={{ color: '#cbd5e1' }}>{networkOverview.rpcUrl}</span>
          </div>
        )}
      </div>

      {/* DISCONNECTED OR UNCONFIGURED WARNING (NOT DISGUISED AS EMPTY) */}
      {networkOverview.status !== 'CONNECTED' && (
        <div
          className="card"
          style={{
            padding: '20px 24px',
            background: networkOverview.status === 'UNAVAILABLE' ? '#fff1f2' : '#fffbeb',
            borderColor: networkOverview.status === 'UNAVAILABLE' ? '#fecdd3' : '#fde68a',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <AlertTriangle
            style={{
              width: '24px',
              height: '24px',
              color: networkOverview.status === 'UNAVAILABLE' ? '#e11d48' : '#d97706',
              flexShrink: 0,
              marginTop: '2px',
            }}
          />
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: '700',
                color: networkOverview.status === 'UNAVAILABLE' ? '#9f1239' : '#92400e',
                margin: '0 0 4px',
              }}
            >
              {networkOverview.status === 'UNAVAILABLE'
                ? 'Blockchain Network Provider Offline'
                : 'Blockchain Environment Unconfigured'}
            </h3>
            <p
              style={{
                fontSize: '0.85rem',
                color: networkOverview.status === 'UNAVAILABLE' ? '#881337' : '#78350f',
                margin: '0 0 10px',
              }}
            >
              {networkOverview.message ||
                'Unable to communicate with the configured blockchain network. Transactions cannot be verified on-chain.'}
            </p>
            {networkOverview.status === 'UNAVAILABLE' && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#475569',
                }}
              >
                Local Hardhat Node Setup: Run <code>npx hardhat node</code> inside <code>blockchain/</code> and deploy contract with <code>npx hardhat run scripts/deploy.ts --network localhost</code>.
              </div>
            )}
          </div>
          <button
            onClick={() => fetchLedger(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 4. SECTION B: FILTERS TOOLBAR */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          {/* Main Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <Search
              style={{
                width: '16px',
                height: '16px',
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
              }}
            />
            <input
              type="text"
              placeholder="Search by transaction hash, batch ID, or address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Event Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter style={{ width: '15px', height: '15px', color: 'var(--text-dim)' }} />
              <select
                value={eventTypeFilter}
                onChange={(e) => {
                  setEventTypeFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                }}
              >
                <option value="ALL">All Event Types</option>
                <option value="MANUFACTURED">MANUFACTURED</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="TRANSFERRED">TRANSFERRED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="BatchRegistered">BatchRegistered</option>
                <option value="EventRecorded">EventRecorded</option>
              </select>
            </div>

            {/* Batch ID Quick Filter */}
            <input
              type="text"
              placeholder="Filter by Batch ID..."
              value={batchIdFilter}
              onChange={(e) => {
                setBatchIdFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                width: '160px',
              }}
            />

            {/* Block Number Filter */}
            <input
              type="number"
              placeholder="Block #..."
              value={blockFilter}
              onChange={(e) => {
                setBlockFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                width: '100px',
              }}
            />

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. SECTION C: TRANSACTION LEDGER TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database style={{ width: '18px', height: '18px', color: '#2563eb' }} />
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
              Immutable Transaction Ledger
            </h2>
            <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
              {pagination.total} Verified Transactions
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing page {pagination.page} of {pagination.totalPages}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <RefreshCw className="animate-spin" style={{ width: '32px', height: '32px', color: '#2563eb', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: '600', color: 'var(--text-heading)' }}>
              Querying EVM Smart Contract Ledger...
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Fetching logs and transaction receipts directly from the blockchain provider.
            </div>
          </div>
        ) : transactions.length === 0 ? (
          /* GENUINE EMPTY STATE */
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Layers style={{ width: '48px', height: '48px', color: '#94a3b8', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '6px' }}>
              {hasActiveFilters
                ? 'No Transactions Match Filters'
                : networkOverview.status === 'CONNECTED'
                ? 'No Smart Contract Transactions Found'
                : 'Ledger Unavailable'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 16px' }}>
              {hasActiveFilters
                ? 'Try adjusting your search criteria or clear filters to view all on-chain transactions.'
                : networkOverview.status === 'CONNECTED'
                ? `The smart contract at ${truncateHash(networkOverview.contractAddress, 10, 8)} is connected, but no batches or custodial transitions have been registered on-chain yet.`
                : 'Transactions cannot be queried while the blockchain node is offline.'}
            </p>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                Clear Active Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-muted)', width: '100px' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-muted)' }}>Tx Hash</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-muted)', width: '90px' }}>Block</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-muted)' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-muted)' }}>Event / Action</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-muted)' }}>Batch ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-muted)' }}>Sender (From)</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.transactionHash} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      {tx.status === 'SUCCESS' ? (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem', gap: '4px' }}>
                          <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                          Confirmed
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ fontSize: '0.72rem', gap: '4px' }}>
                          <XCircle style={{ width: '12px', height: '12px' }} />
                          Reverted
                        </span>
                      )}
                    </td>

                    {/* Transaction Hash */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleInspectTx(tx.transactionHash)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            color: '#2563eb',
                            fontWeight: '600',
                            fontSize: '0.82rem',
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                          title="Click to view full transaction details"
                        >
                          {truncateHash(tx.transactionHash, 8, 6)}
                        </button>
                        <button
                          onClick={() => copyToClipboard(tx.transactionHash)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '2px',
                          }}
                          title="Copy full transaction hash"
                        >
                          {copiedText === tx.transactionHash ? (
                            <Check style={{ width: '13px', height: '13px', color: '#16a34a' }} />
                          ) : (
                            <Copy style={{ width: '13px', height: '13px' }} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Block Number */}
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', fontWeight: '600' }}>
                      #{tx.blockNumber}
                    </td>

                    {/* Timestamp */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {tx.timestamp ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                          <Clock style={{ width: '13px', height: '13px' }} />
                          {new Date(tx.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Event Name & Action */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span
                          className="badge"
                          style={{
                            background: tx.eventType === 'MANUFACTURED' ? '#ecfdf5' : '#eff6ff',
                            color: tx.eventType === 'MANUFACTURED' ? '#047857' : '#1d4ed8',
                            borderColor: tx.eventType === 'MANUFACTURED' ? '#a7f3d0' : '#bfdbfe',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            alignSelf: 'flex-start',
                          }}
                        >
                          {tx.eventType || tx.eventName}
                        </span>
                        {tx.eventDetails && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {tx.eventDetails}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Associated Batch ID */}
                    <td style={{ padding: '14px 16px' }}>
                      {tx.batchId ? (
                        <span
                          className="badge"
                          style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            borderColor: '#fde68a',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                          }}
                        >
                          #{tx.batchId}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>

                    {/* Sender Address */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }} title={tx.from}>
                          {truncateHash(tx.from, 6, 4)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.from)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '1px' }}
                          title="Copy address"
                        >
                          {copiedText === tx.from ? (
                            <Check style={{ width: '12px', height: '12px', color: '#16a34a' }} />
                          ) : (
                            <Copy style={{ width: '12px', height: '12px' }} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleInspectTx(tx.transactionHash)}
                        className="btn btn-secondary"
                        style={{
                          fontSize: '0.76rem',
                          padding: '5px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye style={{ width: '13px', height: '13px' }} />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft style={{ width: '14px', height: '14px' }} />
                Previous
              </button>

              <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-heading)', padding: '0 8px' }}>
                Page {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Next
                <ChevronRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. SECTION D: TRANSACTION DETAILS MODAL */}
      {selectedTxHash && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={handleCloseModal}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 28px',
              position: 'relative',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Layers style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
                    Blockchain Transaction Inspection
                  </h2>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Verified cryptographic receipt retrieved directly from JSON-RPC node.
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  borderRadius: '6px',
                }}
                aria-label="Close modal"
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Content */}
            {txDetailsLoading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <RefreshCw className="animate-spin" style={{ width: '32px', height: '32px', color: '#2563eb', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: '600', color: 'var(--text-heading)' }}>
                  Fetching Transaction Receipt & Decoding Events...
                </div>
              </div>
            ) : txDetailsError ? (
              <div style={{ padding: '24px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3', color: '#9f1239' }}>
                <AlertTriangle style={{ width: '24px', height: '24px', marginBottom: '8px' }} />
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>Transaction Query Failed</div>
                <div style={{ fontSize: '0.85rem' }}>{txDetailsError}</div>
              </div>
            ) : txDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Full Transaction Hash Banner */}
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Full Transaction Hash
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#1e40af', wordBreak: 'break-all' }}>
                      {txDetails.transactionHash}
                    </span>
                    <button
                      onClick={() => copyToClipboard(txDetails.transactionHash)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 8px', flexShrink: 0 }}
                    >
                      {copiedText === txDetails.transactionHash ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Key Receipt Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {/* Status */}
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Receipt Status</div>
                    <div style={{ marginTop: '4px' }}>
                      {txDetails.status === 'SUCCESS' ? (
                        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                          <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                          Status 1 (Success)
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                          <XCircle style={{ width: '12px', height: '12px' }} />
                          Status 0 (Reverted)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Block Number */}
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Block Number</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', marginTop: '4px' }}>
                      #{txDetails.blockNumber}
                    </div>
                  </div>

                  {/* Gas Used */}
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gas Used</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', marginTop: '4px' }}>
                      {Number(txDetails.gasUsed).toLocaleString()} units
                    </div>
                  </div>

                  {/* Value */}
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Value Transferred</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', marginTop: '4px' }}>
                      {txDetails.value || '0 ETH'}
                    </div>
                  </div>
                </div>

                {/* Sender & Recipient Addresses */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Transaction Sender (From)
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', wordBreak: 'break-all' }}>
                      {txDetails.from}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Recipient / Target Contract (To)
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', wordBreak: 'break-all' }}>
                      {txDetails.to}
                    </div>
                  </div>
                </div>

                {/* Decoded Contract Events */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCode style={{ width: '16px', height: '16px', color: '#6366f1' }} />
                    Decoded Smart Contract Events ({txDetails.decodedEvents?.length || 0})
                  </h3>

                  {(!txDetails.decodedEvents || txDetails.decodedEvents.length === 0) ? (
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      No recognized PharmaSupplyChain events emitted by this transaction.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {txDetails.decodedEvents.map((evt, idx) => (
                        <div key={idx} style={{ padding: '14px', background: '#f8f9ff', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: '700', fontSize: '0.78rem' }}>
                              Event: {evt.name}
                            </span>
                            {evt.batchNumber && (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#4338ca', fontWeight: '700' }}>
                                Batch #{evt.batchNumber}
                              </span>
                            )}
                          </div>

                          <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e0e7ff', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            {Object.entries(evt.args || {}).map(([k, v]) => (
                              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#64748b' }}>{k}:</span>
                                <span style={{ color: '#0f172a', fontWeight: '600', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* On-Chain Batch State (If Associated) */}
                {txDetails.onChainBatchInfo && (
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Package style={{ width: '16px', height: '16px', color: '#d97706' }} />
                      Associated On-Chain Batch Record
                    </h3>

                    <div style={{ padding: '14px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.82rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                        <div>
                          <strong>Batch Number:</strong> {txDetails.onChainBatchInfo.batchNumber}
                        </div>
                        <div>
                          <strong>Product Code:</strong> {txDetails.onChainBatchInfo.productCode}
                        </div>
                        <div>
                          <strong>Manufacturer Org:</strong> {txDetails.onChainBatchInfo.manufacturerOrg}
                        </div>
                        <div>
                          <strong>Creation Time:</strong>{' '}
                          {new Date(txDetails.onChainBatchInfo.creationTimestamp * 1000).toLocaleString()}
                        </div>
                      </div>

                      {txDetails.onChainBatchInfo.events && txDetails.onChainBatchInfo.events.length > 0 && (
                        <div>
                          <strong style={{ display: 'block', marginBottom: '6px', color: '#92400e' }}>
                            On-Chain Custodial Timeline ({txDetails.onChainBatchInfo.events.length} checkpoints):
                          </strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {txDetails.onChainBatchInfo.events.map((e, idx) => (
                              <div key={idx} style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '4px', border: '1px solid #fef3c7', fontSize: '0.78rem' }}>
                                <span style={{ fontWeight: '700', color: '#b45309' }}>[{e.eventType}]</span>{' '}
                                <span>{e.custodianOrg}</span> at <span>{e.location}</span> •{' '}
                                <span style={{ color: '#64748b' }}>{new Date(e.timestamp * 1000).toLocaleTimeString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Footer */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleCloseModal} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
