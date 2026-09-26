import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function DistributorInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    totalActiveBatches: 0,
    totalAvailableUnits: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expiryFilter, setExpiryFilter] = useState('ALL');

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDistributorInventory({
        search,
        status: statusFilter,
        expiry: expiryFilter,
        page,
        limit: 20,
      });

      if (res.success) {
        setInventory(res.inventory || []);
        if (res.stats) {
          setStats(res.stats);
        }
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else {
        setError(res.message || 'Failed to load distributor inventory.');
      }
    } catch (err) {
      console.error('Error loading distributor inventory:', err);
      setError(err.message || 'Network error while fetching warehouse inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [statusFilter, expiryFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadInventory();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setExpiryFilter('ALL');
    setPage(1);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>📦</span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
              Distributor Warehouse Inventory
            </h1>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginTop: '6px' }}>
            Active pharmaceutical medicine lots currently stocked in warehouse storage, available for licensed pharmacy fulfillment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/distributor/batches" className="btn btn-outline">
            📋 Full Batch Ledger
          </Link>
          <Link to="/distributor/transfers" className="btn btn-primary">
            🚚 Transfer to Pharmacy →
          </Link>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #2563eb' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Active Inventory Lots
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
            {stats.totalActiveBatches}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #059669' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Total Stock Quantity
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
            {stats.totalAvailableUnits?.toLocaleString() || 0} <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dim)' }}>Units</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #d97706' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Expiring Soon (≤ 30 Days)
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
            {stats.expiringSoonCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid #dc2626' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Expired Stock
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: stats.expiredCount > 0 ? '#dc2626' : '#64748b', marginTop: '4px' }}>
            {stats.expiredCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search active inventory by medicine name, code, or batch lot..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                border: '1px solid #cbd5e1',
              }}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                border: '1px solid #cbd5e1',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="MANUFACTURED">MANUFACTURED</option>
              <option value="RECALLED">RECALLED</option>
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              value={expiryFilter}
              onChange={(e) => {
                setExpiryFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                border: '1px solid #cbd5e1',
              }}
            >
              <option value="ALL">All Expiry Statuses</option>
              <option value="VALID">Valid (&gt; 30 Days)</option>
              <option value="EXPIRING_SOON">Expiring Soon (≤ 30 Days)</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Search Inventory
          </button>
          <button type="button" onClick={handleResetFilters} className="btn btn-outline btn-sm">
            Reset
          </button>
        </form>
      </div>

      {/* Error Message Banner */}
      {error && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#b91c1c', fontSize: '0.88rem' }}>
            ⚠️ <strong>Error loading inventory:</strong> {error}
          </div>
          <button onClick={loadInventory} className="btn btn-outline btn-sm" style={{ color: '#b91c1c', borderColor: '#fecaca' }}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* Warehouse Inventory Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>Loading active warehouse inventory...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🏭</span>
            <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '6px' }}>
              No active pharmaceutical inventory available
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto 16px' }}>
              {search || statusFilter !== 'ALL' || expiryFilter !== 'ALL'
                ? 'No active warehouse lots match your search or filter parameters.'
                : 'Your distributor warehouse currently has no active pharmaceutical stock. Batches received from manufacturers will automatically populate here.'}
            </p>
            {(search || statusFilter !== 'ALL' || expiryFilter !== 'ALL') && (
              <button onClick={handleResetFilters} className="btn btn-outline btn-sm">
                Clear Filters & Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>MEDICINE / FORMULARY</th>
                    <th>BATCH LOT #</th>
                    <th>AVAILABLE STOCK</th>
                    <th>SOURCE MANUFACTURER</th>
                    <th>EXPIRY DATE</th>
                    <th>STATUS</th>
                    <th>RECEIVED ON</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((b) => {
                    const isExpiringSoon = b.isExpiringSoon;
                    const isExpired = b.isExpired;

                    return (
                      <tr key={b._id}>
                        <td>
                          <div style={{ fontWeight: '700', color: '#1e3a8a' }}>
                            {b.product?.name || 'Medicine'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {b.product?.productCode}
                          </div>
                        </td>
                        <td>
                          <Link
                            to={`/distributor/batches/${b._id}`}
                            style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#2563eb', textDecoration: 'none' }}
                          >
                            {b.batchNumber}
                          </Link>
                        </td>
                        <td>
                          <strong style={{ color: '#059669', fontSize: '1rem' }}>
                            {b.quantity?.toLocaleString()}
                          </strong>{' '}
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{b.unit || 'Units'}</span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {b.manufacturer?.name || b.product?.manufacturer?.name || 'Authorized Mfg'}
                        </td>
                        <td>
                          <div>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                color: isExpired ? '#dc2626' : isExpiringSoon ? '#d97706' : '#059669',
                              }}
                            >
                              {new Date(b.expiryDate).toLocaleDateString()}
                            </span>
                            {isExpired && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#dc2626', fontWeight: '700' }}>
                                ⚠️ EXPIRED
                              </span>
                            )}
                            {isExpiringSoon && !isExpired && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#d97706', fontWeight: '700' }}>
                                ⏳ EXPIRING SOON
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                          {new Date(b.receivedDate || b.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                            {!isExpired && b.status !== 'RECALLED' ? (
                              <Link
                                to={`/distributor/transfers/${b._id}`}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                              >
                                Transfer to Pharmacy →
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '0.75rem', padding: '4px 10px', opacity: 0.5, cursor: 'not-allowed' }}
                                title={isExpired ? 'Expired batches cannot be transferred' : 'Recalled batches are locked'}
                              >
                                Transfer Locked
                              </button>
                            )}
                            <Link
                              to={`/distributor/batches/${b._id}`}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            >
                              Details
                            </Link>
                            <Link
                              to={`/verify/${b.qrIdentifier || b.batchNumber}`}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            >
                              Verify
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ color: 'var(--text-dim)' }}>
                  Page {page} of {totalPages} ({total} inventory items)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="btn btn-outline btn-sm"
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="btn btn-outline btn-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
