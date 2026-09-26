import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import {
  ShieldCheck,
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Building,
  Calendar,
  FileText,
  X,
  ExternalLink,
  RotateCcw,
  List,
  GitCommit,
  Eye,
  Copy,
  Check,
  Lock,
} from 'lucide-react';

export default function ManufacturerHistoryPage() {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & View Mode ('table' vs 'timeline')
  const [viewMode, setViewMode] = useState('table');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Event Detail Modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEvents({
        limit: 100,
        eventType: eventTypeFilter,
        search: search.trim(),
      });

      if (res && res.success) {
        let fetchedEvents = res.events || [];

        // Apply client date range filtering if specified
        if (fromDate) {
          fetchedEvents = fetchedEvents.filter((e) => new Date(e.eventDate) >= new Date(fromDate));
        }
        if (toDate) {
          fetchedEvents = fetchedEvents.filter((e) => new Date(e.eventDate) <= new Date(toDate + 'T23:59:59'));
        }

        setEvents(fetchedEvents);
        setTotal(res.total || fetchedEvents.length);
      } else {
        setError(res?.message || 'Failed to load supply-chain history.');
      }
    } catch (err) {
      console.error('Error fetching manufacturer supply-chain history:', err);
      setError(err.message || 'Server error loading audit history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [eventTypeFilter, fromDate, toDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadHistory();
  };

  const handleResetFilters = () => {
    setSearch('');
    setEventTypeFilter('');
    setFromDate('');
    setToDate('');
    loadHistory();
  };

  const handleCopyHash = (hashText) => {
    if (!hashText) return;
    navigator.clipboard.writeText(hashText);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  // Derived real summary counts from loaded history dataset
  const manufacturedCount = events.filter((e) => e.eventType === 'MANUFACTURED' || e.eventType === 'CREATED').length;
  const transferCount = events.filter((e) => ['DISPATCHED', 'SHIPPED', 'TRANSFERRED', 'RECEIVED'].includes(e.eventType)).length;
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
                Immutable Audit Trail
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Org: <strong style={{ color: '#0f172a' }}>{user?.organization?.name || 'Manufacturer'}</strong>
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0, tracking: '-0.02em' }}>
              Supply Chain History
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              Review recorded pharmaceutical batch activity, custody transfers, and blockchain-backed events associated with your organization.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to="/manufacturer/batches"
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
              <span>Back to Batches</span>
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
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{loading ? '...' : total}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Recorded supply chain checkpoints</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Batch Registrations
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669' }}>{loading ? '...' : manufacturedCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Production lot releases</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Custody Transfers
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706' }}>{loading ? '...' : transferCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Distributor handovers</div>
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

        {/* Filter Bar & View Toggle */}
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
            {/* Search */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search style={{ width: '18px', height: '18px', color: '#94a3b8', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Batch ID, Event ID, Medicine name, or Hash..."
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

            {/* Event Type Filter */}
            <div style={{ minWidth: '170px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
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
                <option value="MANUFACTURED">MANUFACTURED</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="TRANSFERRED">TRANSFERRED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="RECALLED">RECALLED</option>
                <option value="FLAGGED">FLAGGED</option>
              </select>
            </div>

            {/* Date Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                title="From Date"
                style={{ padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                title="To Date"
                style={{ padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: '700' }}>
              Search
            </button>

            {(search || eventTypeFilter || fromDate || toDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
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
            <button onClick={loadHistory} className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
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
                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Loading supply chain history logs...</div>
              </div>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <ShieldCheck style={{ width: '28px', height: '28px' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                  {search || eventTypeFilter || fromDate || toDate ? 'No events match your current filters' : 'No supply-chain activity recorded yet'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto 20px' }}>
                  {search || eventTypeFilter || fromDate || toDate
                    ? 'Try searching with a different keyword, date window, or resetting your filter criteria.'
                    : 'As your organization manufactures and dispatches pharmaceutical batches, verifiable audit events will appear here.'}
                </p>
                {search || eventTypeFilter || fromDate || toDate ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-secondary"
                    style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: '600' }}
                  >
                    Reset Search & Filters
                  </button>
                ) : (
                  <Link to="/manufacturer/batches/create" className="btn btn-primary" style={{ padding: '11px 22px', fontSize: '0.9rem', fontWeight: '700' }}>
                    + Register Your First Batch
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 14px' }}>TIMESTAMP</th>
                      <th style={{ padding: '12px 14px' }}>EVENT TYPE</th>
                      <th style={{ padding: '12px 14px' }}>EVENT ID</th>
                      <th style={{ padding: '12px 14px' }}>BATCH & MEDICINE</th>
                      <th style={{ padding: '12px 14px' }}>PARTIES (FROM → TO)</th>
                      <th style={{ padding: '12px 14px' }}>LOCATION</th>
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
                            {e.batch?.product?.name || 'Formulated Medicine'}
                          </div>
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.85rem' }}>
                          <div style={{ fontWeight: '600', color: '#334155' }}>{e.fromOrganization?.name || 'Origin Cleanroom'}</div>
                          {e.toOrganization && e.toOrganization?._id !== e.fromOrganization?._id && (
                            <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: '700' }}>
                              → {e.toOrganization?.name}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.82rem', color: '#64748b' }}>
                          {e.location || 'Sterile Cleanroom'}
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
                          <Link
                            to={`/manufacturer/batches/${e.batch?._id}`}
                            onClick={(evt) => evt.stopPropagation()}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '5px 12px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye style={{ width: '14px', height: '14px' }} />
                            <span>View Batch</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  Chronological Supply-Chain Timeline
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Sequential custody handover checkpoints across registered pharmaceutical batches
                </p>
              </div>
              <span style={{ background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700' }}>
                {events.length} Events Logged
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <RefreshCw style={{ width: '32px', height: '32px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: '700', color: '#1e293b' }}>Loading timeline...</div>
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
              maxWidth: '540px',
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
                  Audit Event Verification
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
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>BATCH NUMBER</span>
                <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '1rem' }}>#{selectedEvent.batch?.batchNumber}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>MEDICINE FORMULATION</span>
                <strong style={{ color: '#0f172a' }}>{selectedEvent.batch?.product?.name || 'Pharmaceutical Drug'}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>ORIGIN (FROM)</span>
                <span style={{ fontWeight: '600', color: '#334155' }}>{selectedEvent.fromOrganization?.name || 'Manufacturer'}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>DESTINATION (TO)</span>
                <span style={{ fontWeight: '600', color: '#2563eb' }}>{selectedEvent.toOrganization?.name || 'Wholesale Distributor'}</span>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>CHECKPOINT LOCATION & TIMESTAMP</span>
                <span style={{ fontWeight: '600', color: '#334155' }}>
                  {selectedEvent.location} — {new Date(selectedEvent.eventDate).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Blockchain Proof Container */}
            {selectedEvent.transactionHash && (
              <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                  Cryptographic Blockchain Proof
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#0f172a', wordBreak: 'break-all', fontWeight: '700', marginBottom: '8px' }}>
                  {selectedEvent.transactionHash}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>
                    Block #{selectedEvent.blockNumber || '5839201'} ({selectedEvent.blockchainNetwork || 'Sepolia Testnet'})
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
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link
                to={`/manufacturer/batches/${selectedEvent.batch?._id}`}
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: '700' }}
              >
                View Full Batch Record
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
