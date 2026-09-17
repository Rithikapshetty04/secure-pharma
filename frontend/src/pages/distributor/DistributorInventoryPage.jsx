import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function DistributorInventoryPage() {
<<<<<<< HEAD
  const [inventory, setInventory] = useState([]);
=======
  const [batches, setBatches] = useState([]);
>>>>>>> origin/main
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadInventory = async () => {
    setLoading(true);
    try {
<<<<<<< HEAD
      const res = await api.getBatches({ limit: 100, search });
      if (res.success) {
        // Filter out recalled or expired batches
        setInventory(res.batches.filter((b) => b.status !== 'RECALLED'));
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
=======
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
>>>>>>> origin/main
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
<<<<<<< HEAD
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
            📦 Wholesale Medicine Inventory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Active medicine lots in distributor warehouse storage ready for dispensary fulfillment
          </p>
        </div>

        <Link to="/distributor/transfers" className="btn btn-primary btn-sm">
=======
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
>>>>>>> origin/main
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
<<<<<<< HEAD
            placeholder="Search active inventory by medicine name or batch #..."
=======
            placeholder="Search inventory by medicine name or batch lot..."
>>>>>>> origin/main
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          />
          <button type="submit" className="btn btn-primary btn-sm">
<<<<<<< HEAD
            Search Inventory
=======
            Search
>>>>>>> origin/main
          </button>
        </form>
      </div>

<<<<<<< HEAD
      {/* Inventory Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading active inventory...
          </div>
        ) : inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
=======
      {/* Inventory Grid / Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading warehouse inventory...
          </div>
        ) : batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
>>>>>>> origin/main
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
<<<<<<< HEAD
                {inventory.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                        {item.product?.name || 'Pharmaceutical Formulation'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {item.product?.genericName || item.product?.dosageForm}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {item.batchNumber}
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {item.quantity?.toLocaleString()} {item.unit}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {item.manufacturer?.name || item.product?.manufacturer?.name || 'Verified Manufacturer'}
=======
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
>>>>>>> origin/main
                    </td>
                    <td
                      style={{
                        fontSize: '0.85rem',
<<<<<<< HEAD
                        fontWeight: '600',
                        color: new Date(item.expiryDate) < new Date() ? '#dc2626' : '#059669',
                      }}
                    >
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
=======
                        color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#059669',
                        fontWeight: '600',
                      }}
                    >
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
>>>>>>> origin/main
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link
<<<<<<< HEAD
                          to={`/distributor/transfers/${item._id}`}
=======
                          to={`/distributor/transfers/${b._id}`}
>>>>>>> origin/main
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Transfer to Pharmacy →
                        </Link>
                        <Link
<<<<<<< HEAD
                          to={`/verify/${item.qrIdentifier || item.batchNumber}`}
=======
                          to={`/verify/${b.qrIdentifier || b.batchNumber}`}
>>>>>>> origin/main
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
