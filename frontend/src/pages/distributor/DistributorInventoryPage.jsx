import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function DistributorInventoryPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await api.getBatches({
        search,
        limit: 50,
      });
      if (res.success) {
        // Active inventory held by distributor
        const active = res.batches.filter((b) => b.status !== 'SOLD' && b.status !== 'EXPIRED');
        setBatches(active);
      }
    } catch (err) {
      console.error('Error fetching distributor inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInventory();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
            📦 Distributor Warehouse Inventory
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Active medicine lots in storage available for certified pharmacy fulfillment ({batches.length} lots)
          </p>
        </div>

        <Link to="/distributor/transfers" className="btn btn-primary">
          🚚 Transfer to Pharmacy
        </Link>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory by medicine name or batch lot..."
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

      {/* Inventory Grid / Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading warehouse inventory...
          </div>
        ) : batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No active medicine batches in inventory.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>MEDICINE</th>
                  <th>BATCH LOT #</th>
                  <th>AVAILABLE QTY</th>
                  <th>SOURCE MANUFACTURER</th>
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
                      <strong style={{ color: '#059669' }}>{b.quantity?.toLocaleString()}</strong> {b.unit}
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
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/distributor/transfers/${b._id}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Transfer to Pharmacy →
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
