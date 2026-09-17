import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function DistributorDashboardPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, eventsRes] = await Promise.all([
<<<<<<< HEAD
        api.getBatches({ limit: 100 }),
        api.getEvents({ limit: 50 }),
=======
        api.getBatches({ limit: 20 }),
        api.getEvents({ limit: 20 }),
>>>>>>> origin/main
      ]);

      if (batchesRes.success) {
        setBatches(batchesRes.batches);
      }
      if (eventsRes.success) {
        setEvents(eventsRes.events);
      }
    } catch (err) {
      console.error('Error loading distributor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

<<<<<<< HEAD
  const receivedBatchesCount = batches.filter(
    (b) => b.status === 'RECEIVED' || b.status === 'IN_TRANSIT' || b.status === 'MANUFACTURED'
  ).length;
  const activeInventoryCount = batches.filter(
    (b) => b.status !== 'EXPIRED' && b.status !== 'RECALLED' && b.status !== 'SOLD'
  ).length;
  const pendingTransfersCount = events.filter((e) => e.eventType === 'DISPATCHED' || e.eventType === 'TRANSFERRED').length;
  const completedTransfersCount = events.filter((e) => e.eventType === 'DELIVERED' || e.eventType === 'RECEIVED').length;

  const recentReceivedBatches = batches.slice(0, 6);
=======
  const receivedBatches = batches.filter(
    (b) => b.status === 'RECEIVED' || b.status === 'IN_TRANSIT' || b.status === 'MANUFACTURED'
  );
  const activeInventory = batches.filter((b) => b.status !== 'SOLD' && b.status !== 'EXPIRED');
  const pendingTransfers = batches.filter((b) => b.status === 'IN_TRANSIT').length;
  const completedTransfers = events.filter((e) => e.eventType === 'DELIVERED' || e.eventType === 'TRANSFERRED').length;
>>>>>>> origin/main

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
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
<<<<<<< HEAD
              🚚 Distributor Logistics Hub
=======
              🚚 Wholesale Distributor Dashboard
>>>>>>> origin/main
            </h1>
            <StatusBadge status="DISTRIBUTOR" />
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>
<<<<<<< HEAD
            {user?.organization?.name || user?.name} • Wholesale Inventory & Pharmacy Distribution
          </p>
        </div>

        {/* Action Shortcuts */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/distributor/transfers" className="btn btn-primary btn-sm">
            🚚 Transfer to Pharmacy
=======
            Wholesale Logistics & Cold-Chain Transit Hub — <strong style={{ color: '#1e3a8a' }}>{user?.organization?.name || user?.name}</strong>
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/distributor/batches" className="btn btn-primary btn-sm">
            📥 View Received Batches
>>>>>>> origin/main
          </Link>
          <Link to="/distributor/inventory" className="btn btn-outline btn-sm">
            📦 View Inventory
          </Link>
<<<<<<< HEAD
=======
          <Link to="/distributor/transfers" className="btn btn-outline btn-sm">
            🚚 Transfer to Pharmacy
          </Link>
>>>>>>> origin/main
          <Link to="/verify" className="btn btn-outline btn-sm">
            🔍 Verify QR
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#7c3aed' }}>
<<<<<<< HEAD
            {loading ? '...' : receivedBatchesCount}
          </div>
          <div className="stat-label">Received Batches</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            From verified manufacturers
          </div>
=======
            {receivedBatches.length}
          </div>
          <div className="stat-label">Received Batches</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>From certified manufacturers</div>
>>>>>>> origin/main
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#059669' }}>
<<<<<<< HEAD
            {loading ? '...' : activeInventoryCount}
          </div>
          <div className="stat-label">Active Inventory</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Available for pharmacy fulfillment
          </div>
=======
            {activeInventory.length}
          </div>
          <div className="stat-label">Active Inventory</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>In warehouse facilities</div>
>>>>>>> origin/main
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#d97706' }}>
<<<<<<< HEAD
            {loading ? '...' : pendingTransfersCount}
          </div>
          <div className="stat-label">Pending Transfers</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Shipments in transit
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#1d4ed8' }}>
            {loading ? '...' : completedTransfersCount}
          </div>
          <div className="stat-label">Completed Transfers</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Delivered to dispensary vaults
          </div>
        </div>
      </div>

      {/* Recent Received Batches Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff', marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#1e3a8a' }}>📥 Recently Received Batches</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Batches checked in from pharmaceutical manufacturers
            </p>
          </div>
          <Link to="/distributor/batches" className="btn btn-outline btn-sm">
            All Received Batches →
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#2563eb' }}>
            Loading received inventory...
          </div>
        ) : recentReceivedBatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
            No received batches found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>BATCH NUMBER</th>
                  <th>MEDICINE</th>
                  <th>QUANTITY</th>
                  <th>MANUFACTURER</th>
                  <th>EXPIRATION</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {recentReceivedBatches.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {b.batchNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                        {b.product?.name || 'Pharmaceutical Formulation'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {b.product?.dosageForm}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.quantity?.toLocaleString()} {b.unit}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {b.manufacturer?.name || b.product?.manufacturer?.name || 'Verified Mfg'}
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
                          to={`/distributor/batches/${b._id}`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          View
                        </Link>
                        <Link
                          to={`/distributor/transfers/${b._id}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Transfer →
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

      {/* Quick Actions Navigation Grid */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#1e3a8a' }}>
          ⚡ Distributor Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <Link
            to="/distributor/batches"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>📥</span>
            <strong>View Received Batches</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Check incoming manufacturer lots</span>
          </Link>

          <Link
            to="/distributor/inventory"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>📦</span>
            <strong>View Inventory</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Manage current stock</span>
          </Link>

          <Link
            to="/distributor/transfers"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>🚚</span>
            <strong>Transfer to Pharmacy</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Fulfill dispensary orders</span>
          </Link>

          <Link
            to="/verify"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>🔍</span>
            <strong>Verify QR</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Scan & authenticate batch</span>
          </Link>
=======
            {pendingTransfers}
          </div>
          <div className="stat-label">Pending Transfers</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Dispatched & in transit</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#2563eb' }}>
            {completedTransfers}
          </div>
          <div className="stat-label">Completed Transfers</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Fulfilled to pharmacies</div>
        </div>
      </div>

      {/* Main Sections */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Recent Received Batches */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#1e3a8a' }}>📥 Recent Received Batches</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Pharmaceutical lots in distribution network
              </p>
            </div>
            <Link to="/distributor/batches" className="btn btn-outline btn-sm">
              View All →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#2563eb' }}>Loading batches...</div>
          ) : receivedBatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
              No batches received yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {receivedBatches.slice(0, 5).map((b) => (
                <div
                  key={b._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-heading)' }}>
                      {b.product?.name || 'Pharmaceutical Batch'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      Batch #{b.batchNumber} • Qty: {b.quantity?.toLocaleString()} {b.unit}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Manufacturer: {b.manufacturer?.name || b.product?.manufacturer?.name || 'Verified Mfg'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={b.status} />
                    <Link
                      to={`/distributor/batches/${b._id}`}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Inventory Overview */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#1e3a8a' }}>📦 Active Wholesale Inventory</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Lots available for pharmacy dispatch
              </p>
            </div>
            <Link to="/distributor/inventory" className="btn btn-outline btn-sm">
              Full Inventory →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#2563eb' }}>Loading inventory...</div>
          ) : activeInventory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
              No inventory currently held in facility.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeInventory.slice(0, 5).map((b) => (
                <div
                  key={b._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e3a8a' }}>
                      {b.product?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      Lot #{b.batchNumber} • Exp: {new Date(b.expiryDate).toLocaleDateString()}
                    </div>
                  </div>

                  <Link
                    to={`/distributor/transfers/${b._id}`}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    Transfer →
                  </Link>
                </div>
              ))}
            </div>
          )}
>>>>>>> origin/main
        </div>
      </div>
    </div>
  );
}
