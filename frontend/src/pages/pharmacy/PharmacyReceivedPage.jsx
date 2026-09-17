import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function PharmacyReceivedPage() {
  const [receivedBatches, setReceivedBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadReceivedMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.getBatches({ limit: 100, search });
      if (res.success) {
        // Filter for batches with delivered/received/active status in pharmacy
        setReceivedBatches(res.batches.filter((b) => b.status !== 'RECALLED'));
      }
    } catch (err) {
      console.error('Error loading received medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceivedMedicines();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReceivedMedicines();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
            📥 Received Medicines & Dispensary Inventory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Authentic medicine lots delivered to pharmacy storage ready for point-of-sale verification
          </p>
        </div>

        <Link to="/pharmacy/medicines" className="btn btn-primary btn-sm">
          ➕ Order More Medicines
        </Link>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search received stock by medicine name or batch lot #..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Received Medicines Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading dispensary inventory...
          </div>
        ) : receivedBatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No received medicines currently recorded in dispensary vault.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>MEDICINE</th>
                  <th>BATCH NUMBER</th>
                  <th>IN-STOCK QTY</th>
                  <th>MANUFACTURER</th>
                  <th>EXPIRY DATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {receivedBatches.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                        {b.product?.name || 'Pharmaceutical Product'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {b.product?.genericName} • {b.product?.dosageForm}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {b.batchNumber}
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {b.quantity?.toLocaleString()} {b.unit}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.manufacturer?.name || b.product?.manufacturer?.name || 'Verified Manufacturer'}
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
                          to={`/pharmacy/batches/${b._id}`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          View
                        </Link>
                        <Link
                          to={`/verify/${b.qrIdentifier || b.batchNumber}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Verify QR →
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
