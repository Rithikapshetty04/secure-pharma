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
        api.getBatches({ limit: 20 }),
        api.getEvents({ limit: 20 }),
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

  const receivedBatches = batches.filter(
    (b) => b.status === 'RECEIVED' || b.status === 'IN_TRANSIT' || b.status === 'MANUFACTURED'
  );
  const activeInventory = batches.filter((b) => b.status !== 'SOLD' && b.status !== 'EXPIRED');
  const pendingTransfers = batches.filter((b) => b.status === 'IN_TRANSIT').length;
  const completedTransfers = events.filter((e) => e.eventType === 'DELIVERED' || e.eventType === 'TRANSFERRED').length;

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
              🚚 Wholesale Distributor Dashboard
            </h1>
            <StatusBadge status="DISTRIBUTOR" />
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>
            Wholesale Logistics & Cold-Chain Transit Hub — <strong style={{ color: '#1e3a8a' }}>{user?.organization?.name || user?.name}</strong>
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/distributor/batches" className="btn btn-primary btn-sm">
            📥 View Received Batches
          </Link>
          <Link to="/distributor/inventory" className="btn btn-outline btn-sm">
            📦 View Inventory
          </Link>
          <Link to="/distributor/transfers" className="btn btn-outline btn-sm">
            🚚 Transfer to Pharmacy
          </Link>
          <Link to="/verify" className="btn btn-outline btn-sm">
            🔍 Verify QR
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#7c3aed' }}>
            {receivedBatches.length}
          </div>
          <div className="stat-label">Received Batches</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>From certified manufacturers</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#059669' }}>
            {activeInventory.length}
          </div>
          <div className="stat-label">Active Inventory</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>In warehouse facilities</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#d97706' }}>
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
        </div>
      </div>
    </div>
  );
}
