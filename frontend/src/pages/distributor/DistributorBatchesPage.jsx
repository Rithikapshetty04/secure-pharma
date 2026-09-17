import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function DistributorBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await api.getBatches({
        search,
        status: statusFilter,
        limit: 50,
      });
      if (res.success) {
        setBatches(res.batches);
        setTotal(res.total);
      }
    } catch (err) {
      console.error('Error fetching distributor batches:', err);
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

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
            📥 Received Pharmaceutical Batches
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Batches transferred from licensed pharmaceutical manufacturers ({total} total)
          </p>
        </div>

        <Link to="/distributor/transfers" className="btn btn-primary">
          🚚 Transfer Batch to Pharmacy
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch number or medicine name..."
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Statuses</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="MANUFACTURED">MANUFACTURED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="RECALLED">RECALLED</option>
          </select>

          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Batches Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading received batches...
          </div>
        ) : batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No received batches found matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>MEDICINE</th>
                  <th>BATCH #</th>
                  <th>QTY</th>
                  <th>MANUFACTURER</th>
                  <th>EXPIRY DATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#1e3a8a' }}>
                        {b.product?.name || 'Medicine'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {b.product?.productCode}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-heading)' }}>
                      {b.batchNumber}
                    </td>
                    <td>
                      {b.quantity?.toLocaleString()} {b.unit}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.manufacturer?.name || b.product?.manufacturer?.name || 'Authorized Mfg'}
                    </td>
                    <td
                      style={{
                        fontSize: '0.85rem',
                        color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#059669',
                        fontWeight: '600',
                      }}
                    >
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <Link
                          to={`/distributor/batches/${b._id}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          View
                        </Link>
                        <Link
                          to={`/distributor/transfers/${b._id}`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Transfer
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
