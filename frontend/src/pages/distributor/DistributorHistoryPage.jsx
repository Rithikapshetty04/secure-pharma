import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  ArrowLeft,
  RefreshCw,
  Building,
  Calendar,
  X,
  Eye,
  Copy,
  Check,
  List,
  GitCommit,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  Truck,
} from 'lucide-react';

export default function DistributorHistoryPage() {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingIncomingCount: 0,
    receivedIncomingCount: 0,
    outgoingCount: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Controls
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'INCOMING' | 'OUTGOING'
  const [eventTypeFilter, setEventTypeFilter] = useState(''); // 'ALL' | 'RECEIVED' | 'TRANSFERRED' | 'DISPATCHED' etc.
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Event Detail Modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDistributorTransfers({
        category: categoryFilter,
        status: eventTypeFilter,
        search: search.trim(),
        sort: sortOrder,
        fromDate,
        toDate,
        page,
        limit,
      });

      if (res && res.success) {
        setEvents(res.transfers || []);
        setStats(
          res.stats || {
            totalEvents: res.transfers?.length || 0,
            pendingIncomingCount: 0,
            receivedIncomingCount: 0,
            outgoingCount: 0,
          }
        );
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else {
        setError(res?.message || 'Failed to load distributor supply-chain history.');
      }
    } catch (err) {
      console.error('Error loading distributor history:', err);
      setError(err.message || 'Server connection error loading audit history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [categoryFilter, eventTypeFilter, sortOrder, fromDate, toDate, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setEventTypeFilter('');
    setSortOrder('newest');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const setQuickDate = (days) => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];

    if (days === 0) {
      setFromDate(end);
      setToDate(end);
    } else {
      const start = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(end);
    }
    setPage(1);
  };

  const handleCopyHash = (hashText) => {
    if (!hashText) return;
    navigator.clipboard.writeText(hashText);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  // Derive counts from current dataset for summary metrics if needed
  const blockchainAnchoredCount = events.filter((e) => Boolean(e.transactionHash)).length;

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
                Immutable Distributor Audit Trail
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Org: <strong style={{ color: '#0f172a' }}>{user?.organization?.name || 'Wholesale Distributor'}</strong>
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0, tracking: '-0.02em' }}>
              Distributor Activity & Audit Trail
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              Trusted chronological history of batch receipts, pharmacy dispatches, inventory movements, and blockchain proofs scoped to your organization.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchHistory}
              className="btn btn-secondary"
              style={{
                padding: '10px 16px',
                fontSize: '0.88rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>Refresh</span>
            </button>
            <Link
              to="/distributor/dashboard"
              className="btn btn-secondary"
              style={{
                padding: '10px 16px',
                fontSize: '0.88rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Real Summary Metrics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Total Audit Events
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{loading ? '...' : stats.totalEvents || total}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Supply chain checkpoints recorded</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Incoming Receipts
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowDownLeft style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669' }}>{loading ? '...' : stats.receivedIncomingCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Confirmed batch receipts</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Pharmacy Dispatches
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706' }}>{loading ? '...' : stats.outgoingCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Transfers to certified pharmacies</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Blockchain Anchors
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#7c3aed' }}>{loading ? '...' : blockchainAnchoredCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Cryptographically signed events</div>
          </div>
        </div>

        {/* Filter Bar & Controls */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '18px 20px',
            marginBottom: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Top Row: Search input + Category + EventType + Search button */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search style={{ width: '18px', height: '18px', color: '#94a3b8', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Batch ID, Medicine name, Event ID, Transaction Hash, or Location..."
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

              {/* Category Filter */}
              <div style={{ minWidth: '150px' }}>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  title="Category Filter"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none',
                    fontWeight: '600',
                  }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="INCOMING">Incoming (Receipts)</option>
                  <option value="OUTGOING">Outgoing (Transfers)</option>
                </select>
              </div>

              {/* Event Type Filter */}
              <div style={{ minWidth: '160px' }}>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => {
                    setEventTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  title="Event Type Filter"
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
                  <option value="">All Event Types</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="TRANSFERRED">TRANSFERRED</option>
                  <option value="DISPATCHED">DISPATCHED</option>
                  <option value="MANUFACTURED">MANUFACTURED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="RECALLED">RECALLED</option>
                  <option value="FLAGGED">FLAGGED</option>
                </select>
              </div>

              {/* Sort Selector */}
              <div style={{ minWidth: '135px' }}>
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setPage(1);
                  }}
                  title="Sort Order"
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
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: '700' }}>
                Search
              </button>
            </div>

            {/* Bottom Row: Date Range & Quick Presets & View Mode Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar style={{ width: '15px', height: '15px', color: '#64748b' }} />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setPage(1);
                    }}
                    title="From Date"
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setPage(1);
                    }}
                    title="To Date"
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>

                {/* Quick Date Presets */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '0.78rem', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(7)}
                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '0.78rem', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Last 7d
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(30)}
                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '0.78rem', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Last 30d
                  </button>
                </div>

                {(search || categoryFilter !== 'ALL' || eventTypeFilter || fromDate || toDate || sortOrder !== 'newest') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      color: '#475569',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw style={{ width: '13px', height: '13px' }} />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

              {/* View Mode Switcher */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    background: viewMode === 'table' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '7px 12px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    color: viewMode === 'table' ? '#2563eb' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <List style={{ width: '15px', height: '15px' }} />
                  <span>Audit Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  style={{
                    background: viewMode === 'timeline' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '7px 12px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    color: viewMode === 'timeline' ? '#2563eb' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <GitCommit style={{ width: '15px', height: '15px' }} />
                  <span>Timeline</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Global Error Alert */}
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
            <button onClick={fetchHistory} className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              Retry Connection
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE A: AUDIT LOG TABLE                                               */}
        {/* ========================================================================= */}
        {viewMode === 'table' && (
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
                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Loading distributor audit history...</div>
              </div>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <ShieldCheck style={{ width: '28px', height: '28px' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                  {search || categoryFilter !== 'ALL' || eventTypeFilter || fromDate || toDate ? 'No activity matches your filters' : 'No supply-chain activity yet'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto 20px' }}>
                  {search || categoryFilter !== 'ALL' || eventTypeFilter || fromDate || toDate
                    ? 'Try adjusting your search terms, date window, or clearing active filter criteria.'
                    : 'As your organization receives pharmaceutical batches from manufacturers or transfers them to pharmacies, verifiable audit records will appear here.'}
                </p>
                {search || categoryFilter !== 'ALL' || eventTypeFilter || fromDate || toDate ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-secondary"
                    style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: '600' }}
                  >
                    Clear Filters
                  </button>
                ) : (
                  <Link to="/distributor/transfers" className="btn btn-primary" style={{ padding: '11px 22px', fontSize: '0.9rem', fontWeight: '700' }}>
                    View Incoming Transfers
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '12px 14px' }}>TIMESTAMP</th>
                        <th style={{ padding: '12px 14px' }}>EVENT TYPE</th>
                        <th style={{ padding: '12px 14px' }}>EVENT ID</th>
                        <th style={{ padding: '12px 14px' }}>BATCH & MEDICINE</th>
                        <th style={{ padding: '12px 14px' }}>PARTIES (FROM → TO)</th>
                        <th style={{ padding: '12px 14px' }}>QUANTITY</th>
                        <th style={{ padding: '12px 14px' }}>BLOCKCHAIN PROOF</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr
                          key={e._id}
                          onClick={() => setSelectedEvent(e)}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                        >
                          <td style={{ padding: '14px', fontSize: '0.85rem', color: '#334155' }}>
                            <span style={{ fontWeight: '600', display: 'block', color: '#0f172a' }}>
                              {new Date(e.eventDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {new Date(e.eventDate).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                            </span>
                          </td>

                          <td style={{ padding: '14px' }}>
                            <StatusBadge status={e.eventType} />
                          </td>

                          <td style={{ padding: '14px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2563eb', fontSize: '0.82rem' }}>
                              {e.uniqueEventId ? e.uniqueEventId.slice(0, 14) + '...' : 'EVT-LOG'}
                            </span>
                          </td>

                          <td style={{ padding: '14px' }}>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                              #{e.batch?.batchNumber || 'Batch'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {e.batch?.product?.name || 'Pharmaceutical Product'}
                            </div>
                          </td>

                          <td style={{ padding: '14px', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: '600', color: '#334155' }}>{e.fromOrganization?.name || 'Origin Node'}</div>
                            {e.toOrganization && e.toOrganization?._id !== e.fromOrganization?._id && (
                              <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: '700' }}>
                                → {e.toOrganization?.name}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '14px', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                            {e.quantity ? `${e.quantity.toLocaleString()} units` : 'N/A'}
                          </td>

                          <td style={{ padding: '14px' }}>
                            {e.transactionHash ? (
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                  color: '#059669',
                                  background: '#ecfdf5',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #a7f3d0',
                                  fontWeight: '700',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <ShieldCheck style={{ width: '13px', height: '13px' }} />
                                {e.transactionHash.slice(0, 8)}...{e.transactionHash.slice(-6)}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                App Record
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <button
                              onClick={(evt) => {
                                evt.stopPropagation();
                                setSelectedEvent(e);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 12px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye style={{ width: '14px', height: '14px' }} />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Server Pagination Bar */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total audit records)
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 12px', opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                      >
                        <ChevronLeft style={{ width: '16px', height: '16px' }} />
                        <span>Previous</span>
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 12px', opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                      >
                        <span>Next</span>
                        <ChevronRight style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE B: CHRONOLOGICAL TIMELINE                                        */}
        {/* ========================================================================= */}
        {viewMode === 'timeline' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '28px 32px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Chronological Distributor Audit Timeline
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Sequential custody handover events involving your distribution center
                </p>
              </div>
              <span style={{ background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700' }}>
                {events.length} Events Listed
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <RefreshCw style={{ width: '32px', height: '32px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: '700', color: '#1e293b' }}>Loading timeline events...</div>
              </div>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                No timeline records match your search criteria.
              </div>
            ) : (
              <Timeline events={events} />
            )}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
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
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px 32px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <StatusBadge status={selectedEvent.eventType} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: '800', color: '#2563eb' }}>
                    {selectedEvent.uniqueEventId}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  Distributor Audit Verification
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', marginBottom: '20px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>BATCH LOT NUMBER</span>
                <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '1rem' }}>#{selectedEvent.batch?.batchNumber}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>MEDICINE FORMULATION</span>
                <strong style={{ color: '#0f172a' }}>{selectedEvent.batch?.product?.name || 'Pharmaceutical Drug'}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>ORIGIN SENDER (FROM)</span>
                <span style={{ fontWeight: '600', color: '#334155' }}>{selectedEvent.fromOrganization?.name || 'Manufacturer Node'}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>DESTINATION RECIPIENT (TO)</span>
                <span style={{ fontWeight: '600', color: '#2563eb' }}>{selectedEvent.toOrganization?.name || 'Distributor / Pharmacy Node'}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>QUANTITY INVOLVED</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>
                  {selectedEvent.quantity ? `${selectedEvent.quantity.toLocaleString()} units` : 'Full Batch Lot'}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>RECORDING USER</span>
                <span style={{ fontWeight: '600', color: '#475569' }}>
                  {selectedEvent.user?.name ? `${selectedEvent.user.name} (${selectedEvent.user.role})` : 'System Dispatcher'}
                </span>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>CHECKPOINT LOCATION & TIMESTAMP</span>
                <span style={{ fontWeight: '600', color: '#334155' }}>
                  {selectedEvent.location || 'Distribution Logistics Warehouse'} — {new Date(selectedEvent.eventDate).toLocaleString()}
                </span>
              </div>

              {selectedEvent.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>AUDIT NOTES</span>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.82rem', fontStyle: 'italic' }}>
                    "{selectedEvent.notes}"
                  </div>
                </div>
              )}
            </div>

            {/* Cryptographic Blockchain Proof Container */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                Cryptographic Blockchain Ledger Proof
              </div>
              {selectedEvent.transactionHash ? (
                <>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#0f172a', wordBreak: 'break-all', fontWeight: '700', marginBottom: '8px' }}>
                    {selectedEvent.transactionHash}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>
                      Block #{selectedEvent.blockNumber || 'Recorded'} ({selectedEvent.blockchainNetwork || 'Sepolia Testnet'})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(selectedEvent.transactionHash)}
                      style={{
                        background: copiedHash ? '#ecfdf5' : '#ffffff',
                        border: `1px solid ${copiedHash ? '#10b981' : '#cbd5e1'}`,
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: copiedHash ? '#047857' : '#334155',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {copiedHash ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
                      <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                  Blockchain verification data unavailable for this local operational record.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link
                to={`/distributor/batches/${selectedEvent.batch?._id}`}
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: '700' }}
              >
                View Batch Record
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
