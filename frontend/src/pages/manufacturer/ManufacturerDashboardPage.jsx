import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function ManufacturerDashboardPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, eventsRes] = await Promise.all([
        api.getBatches({ limit: 100 }),
        api.getEvents({ limit: 50 }),
      ]);

      if (batchesRes.success) {
        setBatches(batchesRes.batches);
      }
      if (eventsRes.success) {
        // Filter events initiated by manufacturer
        setTransfers(eventsRes.events.filter((e) => e.eventType !== 'MANUFACTURED'));
      }
    } catch (err) {
      console.error('Error loading manufacturer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBatches = batches.length;
  const activeBatches = batches.filter(
    (b) => b.status === 'MANUFACTURED' || b.status === 'CREATED' || b.status === 'IN_TRANSIT' || b.status === 'RECEIVED'
  ).length;
  const inDistributionBatches = batches.filter((b) => b.status === 'IN_TRANSIT' || b.status === 'DISTRIBUTED').length;
  const deliveredBatches = batches.filter((b) => b.status === 'DELIVERED' || b.status === 'SOLD').length;

  const recentBatches = batches.slice(0, 6);
  const recentTransfers = transfers.slice(0, 6);

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
              🏭 Manufacturer Dashboard
            </h1>
            <StatusBadge status="MANUFACTURER" />
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>
            {user?.organization?.name || user?.name} • Pharmaceutical Production & Batch Release
          </p>
        </div>

        {/* Quick Actions Header Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/manufacturer/batches/create" className="btn btn-primary btn-sm">
            ➕ Create New Batch
          </Link>
          <Link to="/manufacturer/transfers" className="btn btn-outline btn-sm">
            🚚 Transfer Batch
          </Link>
          <Link to="/verify" className="btn btn-outline btn-sm">
            🔍 Verify QR
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#1d4ed8' }}>
            {loading ? '...' : totalBatches}
          </div>
          <div className="stat-label">Total Batches</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Minted & registered on ledger
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#059669' }}>
            {loading ? '...' : activeBatches}
          </div>
          <div className="stat-label">Active Batches</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Valid & unexpired inventory
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#7c3aed' }}>
            {loading ? '...' : inDistributionBatches}
          </div>
          <div className="stat-label">Batches in Distribution</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            In transit to wholesale nodes
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#0284c7' }}>
            {loading ? '...' : deliveredBatches}
          </div>
          <div className="stat-label">Delivered / Dispensed</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Reached dispensary pharmacies
          </div>
        </div>
      </div>

      {/* Main Dual Section Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Recent Batches */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#1e3a8a' }}>📦 Recent Batches</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Latest manufactured production lots
              </p>
            </div>
            <Link to="/manufacturer/batches" className="btn btn-outline btn-sm">
              View All Batches →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#2563eb' }}>
              Loading batches...
            </div>
          ) : recentBatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
              No batches created yet.{' '}
              <Link to="/manufacturer/batches/create" style={{ color: '#2563eb', fontWeight: '600' }}>
                Create one now
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentBatches.map((b) => (
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
                      {b.product?.name || 'Pharmaceutical Product'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        fontFamily: 'var(--font-mono)',
                        marginTop: '2px',
                      }}
                    >
                      Lot #{b.batchNumber} • Qty: {b.quantity?.toLocaleString()} {b.unit} • Exp:{' '}
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={b.status} />
                    <Link
                      to={`/manufacturer/batches/${b._id}`}
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

        {/* Recent Transfers */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#1e3a8a' }}>🚚 Recent Transfers</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Custody handovers to distribution partners
              </p>
            </div>
            <Link to="/manufacturer/history" className="btn btn-outline btn-sm">
              Full History →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#2563eb' }}>
              Loading transfers...
            </div>
          ) : recentTransfers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
              No transfers recorded yet.{' '}
              <Link to="/manufacturer/transfers" style={{ color: '#2563eb', fontWeight: '600' }}>
                Initiate a transfer
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentTransfers.map((t) => (
                <div
                  key={t._id}
                  style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={t.eventType} />
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-heading)' }}>
                        Batch #{t.batch?.batchNumber || 'Batch'}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(t.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Destination: <strong>{t.toOrganization?.name || 'Wholesale Distributor'}</strong> ({t.location || 'In Transit'})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#1e3a8a' }}>
          ⚡ Manufacturer Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <Link
            to="/manufacturer/batches/create"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>⚙️</span>
            <strong>Create New Batch</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Mint & serialize lot</span>
          </Link>

          <Link
            to="/manufacturer/batches"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>📦</span>
            <strong>View Batches</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Browse inventory lots</span>
          </Link>

          <Link
            to="/manufacturer/transfers"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>🚚</span>
            <strong>Transfer Batch</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Dispatch to distributor</span>
          </Link>

          <Link
            to="/verify"
            className="btn btn-outline"
            style={{ padding: '16px', flexDirection: 'column', gap: '8px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>🔍</span>
            <strong>Verify QR</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Run 9-point verification</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
