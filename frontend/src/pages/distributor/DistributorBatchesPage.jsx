import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function DistributorBatchesPage() {
  const [batches, setBatches] = useState([]);
<<<<<<< HEAD
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
=======
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
>>>>>>> origin/main

  const loadBatches = async () => {
    setLoading(true);
    try {
<<<<<<< HEAD
      const res = await api.getBatches({ limit: 100, search });
      if (res.success) {
        setBatches(res.batches);
      }
    } catch (err) {
      console.error('Error fetching distributor received batches:', err);
=======
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
>>>>>>> origin/main
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
<<<<<<< HEAD
  }, []);
=======
  }, [statusFilter]);
>>>>>>> origin/main

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBatches();
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
            📥 Received Manufacturer Batches
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Batches transferred from certified pharmaceutical manufacturers into wholesale custody
          </p>
        </div>

        <Link to="/distributor/transfers" className="btn btn-primary btn-sm">
          🚚 Transfer to Pharmacy
        </Link>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
=======
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
>>>>>>> origin/main
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
<<<<<<< HEAD
            placeholder="Search by batch lot #, product name, or manufacturer..."
            style={{
              flex: 1,
=======
            placeholder="Search by batch number or medicine name..."
            style={{
              flex: 1,
              minWidth: '240px',
>>>>>>> origin/main
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          />
<<<<<<< HEAD
=======

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

>>>>>>> origin/main
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
<<<<<<< HEAD
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No received batches found in wholesale custody.
=======
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No received batches found matching criteria.
>>>>>>> origin/main
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
<<<<<<< HEAD
                  <th>BATCH NUMBER</th>
                  <th>MEDICINE</th>
                  <th>QUANTITY</th>
                  <th>MANUFACTURER</th>
                  <th>EXPIRATION</th>
=======
                  <th>MEDICINE</th>
                  <th>BATCH #</th>
                  <th>QTY</th>
                  <th>MANUFACTURER</th>
                  <th>EXPIRY DATE</th>
>>>>>>> origin/main
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
<<<<<<< HEAD
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {b.batchNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                        {b.product?.name || 'Pharmaceutical Product'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {b.product?.dosageForm} ({b.product?.strength})
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.quantity?.toLocaleString()} {b.unit}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.manufacturer?.name || b.product?.manufacturer?.name || 'Verified Mfg'}
=======
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
>>>>>>> origin/main
                    </td>
                    <td
                      style={{
                        fontSize: '0.85rem',
<<<<<<< HEAD
                        fontWeight: '600',
                        color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#059669',
=======
                        color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#059669',
                        fontWeight: '600',
>>>>>>> origin/main
                      }}
                    >
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
<<<<<<< HEAD
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/distributor/batches/${b._id}`}
                          className="btn btn-outline btn-sm"
=======
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <Link
                          to={`/distributor/batches/${b._id}`}
                          className="btn btn-primary btn-sm"
>>>>>>> origin/main
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          View
                        </Link>
                        <Link
                          to={`/distributor/transfers/${b._id}`}
<<<<<<< HEAD
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Transfer →
=======
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Transfer
>>>>>>> origin/main
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
