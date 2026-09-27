import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import {
  History,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building2,
  Clock,
  RefreshCw,
  Eye,
  ShoppingBag,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react';

const PharmacyHistoryPage = () => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [daysFilter, setDaysFilter] = useState('ALL');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPharmacyHistory({
        search: search.trim(),
        category: categoryFilter,
        days: daysFilter,
      });

      if (res && res.success) {
        setEvents(res.events || []);
        setTotal(res.total || (res.events ? res.events.length : 0));
      } else {
        setError(res?.message || 'Failed to fetch pharmacy history log.');
      }
    } catch (err) {
      console.error('Error fetching pharmacy history:', err);
      setError(err.message || 'Server connection error loading audit trail.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, daysFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  // Counts by category
  const orderEventsCount = events.filter((e) => e.category === 'ORDERS').length;
  const receiptEventsCount = events.filter((e) => e.category === 'RECEIPTS' || e.category === 'TRANSFERS').length;
  const auditEventsCount = events.filter((e) => e.category === 'AUDIT' || e.category === 'CANCELLATIONS').length;

  const getCategoryBadge = (category, eventType) => {
    switch (category) {
      case 'RECEIPTS':
      case 'TRANSFERS':
        return (
          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Package style={{ width: '12px', height: '12px' }} />
            {eventType || 'Inventory Transfer'}
          </span>
        );
      case 'ORDERS':
        return (
          <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShoppingBag style={{ width: '12px', height: '12px' }} />
            {eventType || 'Purchase Order'}
          </span>
        );
      case 'CANCELLATIONS':
        return (
          <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle style={{ width: '12px', height: '12px' }} />
            Order Cancelled
          </span>
        );
      case 'AUDIT':
      default:
        return (
          <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FileText style={{ width: '12px', height: '12px' }} />
            System Audit
          </span>
        );
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                Operational Log
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Authenticated Pharmacy Audit & Provenance History
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Pharmacy History & Audit Trail
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              Chronological ledger of purchase orders, batch receipts, custody transfers, and system audit actions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => fetchHistory()}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              title="Refresh History Logs"
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              Sync Trail
            </button>
            <Link
              to="/pharmacy/orders"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem', fontWeight: '700', background: '#059669', borderColor: '#059669' }}
            >
              <ShoppingBag style={{ width: '16px', height: '16px' }} />
              View Orders
            </Link>
          </div>
        </div>

        {/* Summary Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Total Trail Entries</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>{total}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Order Events</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>{orderEventsCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Batch & Receipts</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>{receiptEventsCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Audit & Actions</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>{auditEventsCount}</div>
            </div>
          </div>
        </div>

        {/* Search, Filter & Date Bar */}
        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search style={{ width: '18px', height: '18px', color: '#94a3b8', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Order ID, batch number, medicine name, action..."
                style={{ width: '100%', padding: '9px 14px 9px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: '#ffffff' }}
              >
                <option value="ALL">All Categories</option>
                <option value="ORDERS">Orders</option>
                <option value="RECEIPTS">Batch Receipts</option>
                <option value="TRANSFERS">Supply Transfers</option>
                <option value="CANCELLATIONS">Cancellations</option>
                <option value="AUDIT">System Audit</option>
              </select>

              <select
                value={daysFilter}
                onChange={(e) => setDaysFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: '#ffffff' }}
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today Only</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
              </select>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', fontSize: '0.88rem' }}>
            <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Timeline Container */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', padding: '24px' }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 style={{ width: '36px', height: '36px', color: '#059669', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.92rem', fontWeight: '600' }}>Loading audit history entries from database...</p>
            </div>
          ) : events.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <History style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>No Activity Recorded Yet</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 auto 20px', maxWidth: '420px', lineHeight: '1.5' }}>
                {search || categoryFilter !== 'ALL' || daysFilter !== 'ALL'
                  ? 'No audit log entries match your search filters.'
                  : 'Operational events and purchase orders recorded for your pharmacy will appear here chronologically.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <Link
                  to="/pharmacy/medicines"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem', background: '#059669', borderColor: '#059669' }}
                >
                  <ShoppingBag style={{ width: '16px', height: '16px' }} />
                  Browse Medicines
                </Link>
                <Link
                  to="/pharmacy/orders"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }}
                >
                  View Orders
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {events.map((evt) => {
                const eventDate = new Date(evt.timestamp).toLocaleString();
                const hasOrderLink = evt.orderMongoId || evt.orderId;
                const hasBatchLink = evt.batchId || evt.batchNumber;

                return (
                  <div
                    key={evt._id}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {getCategoryBadge(evt.category, evt.eventType)}
                        {evt.batchNumber && (
                          <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                            Batch #{evt.batchNumber}
                          </span>
                        )}
                        {evt.orderId && (
                          <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                            Order #{evt.orderId}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                        <Clock style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                        {eventDate}
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                      {evt.title}
                    </h3>

                    <p style={{ fontSize: '0.86rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                      {evt.description}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#64748b', paddingTop: '6px' }}>
                      {evt.actorName && (
                        <span>
                          Actor: <strong style={{ color: '#0f172a' }}>{evt.actorName}</strong>
                        </span>
                      )}
                      {evt.actorOrg && (
                        <span>
                          Entity: <strong style={{ color: '#0f172a' }}>{evt.actorOrg}</strong>
                        </span>
                      )}
                      {evt.quantity && (
                        <span>
                          Quantity: <strong style={{ color: '#059669' }}>{evt.quantity} units</strong>
                        </span>
                      )}
                    </div>

                    {evt.transactionHash && (
                      <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#64748b', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', wordBreak: 'break-all' }}>
                        Ledger Hash: {evt.transactionHash}
                      </div>
                    )}

                    {/* Contextual Links Row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                      {hasOrderLink && (
                        <Link
                          to={`/pharmacy/orders/${evt.orderMongoId || evt.orderId}`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700' }}
                        >
                          <ShoppingBag style={{ width: '13px', height: '13px' }} />
                          View Purchase Order
                          <ArrowRight style={{ width: '12px', height: '12px' }} />
                        </Link>
                      )}

                      {hasBatchLink && (
                        <Link
                          to={`/pharmacy/batches/${evt.batchId || evt.batchNumber}`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700' }}
                        >
                          <Package style={{ width: '13px', height: '13px' }} />
                          View Batch Details
                          <ArrowRight style={{ width: '12px', height: '12px' }} />
                        </Link>
                      )}

                      {evt.batchNumber && (
                        <Link
                          to={`/verify/${encodeURIComponent(evt.batchNumber)}`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#047857' }}
                        >
                          <ShieldCheck style={{ width: '13px', height: '13px' }} />
                          Verify
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyHistoryPage;
