import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await api.getBatches({ limit: 100, search, status: statusFilter });
      if (res.success) {
        setBatches(res.batches);
      }
    } catch (err) {
      console.error('Error loading admin batches:', err);
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

  const handleStatusUpdate = async (batchId, batchNumber, newStatus) => {
    const reason = window.prompt(`Enter mandatory regulatory reason for updating Batch #${batchNumber} to ${newStatus}:`);
    if (!reason) {
      alert('Reason is required for regulatory batch status updates.');
      return;
    }

    try {
      const res = await api.updateBatchStatus(batchId, newStatus, reason);
      if (res.success) {
        alert(`✓ Batch #${batchNumber} marked as ${newStatus}. Broadcast notification issued.`);
        loadBatches();
      } else {
        alert(`Failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
          📦 System-Wide Batch & Recall Monitoring
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Inspect all serialized medicine production lots, issue regulatory recall orders, and flag anomalies
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch lot #, product code, or manufacturer..."
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
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="MANUFACTURED">MANUFACTURED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="SOLD">SOLD</option>
            <option value="RECALLED">RECALLED</option>
            <option value="FLAGGED">FLAGGED</option>
            <option value="EXPIRED">EXPIRED</option>
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
            Loading system batches...
          </div>
        ) : batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No batches found matching filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>BATCH NUMBER</th>
                  <th>MEDICINE</th>
                  <th>MANUFACTURER</th>
                  <th>QTY</th>
                  <th>EXPIRY</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>REGULATORY CONTROLS</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {b.batchNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                        {b.product?.name || 'Pharmaceutical Formulation'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {b.product?.genericName}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.manufacturer?.name || b.product?.manufacturer?.name || 'Verified Manufacturer'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.quantity?.toLocaleString()} {b.unit}
                    </td>
                    <td
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#059669',
                      }}
                    >
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/verify/${b.qrIdentifier || b.batchNumber}`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Verify
                        </Link>
                        {b.status !== 'RECALLED' && (
                          <button
                            onClick={() => handleStatusUpdate(b._id, b.batchNumber, 'RECALLED')}
                            className="btn btn-danger btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            🛑 Recall
                          </button>
                        )}
                        {b.status !== 'FLAGGED' && (
                          <button
                            onClick={() => handleStatusUpdate(b._id, b.batchNumber, 'FLAGGED')}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#d97706' }}
                          >
                            ⚠️ Flag
                          </button>
                        )}
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
