import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function ManufacturerDashboardPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, eventsRes] = await Promise.all([
        api.getBatches({ limit: 10 }),
        api.getEvents({ limit: 10 }),
      ]);

      if (batchesRes.success) {
        setBatches(batchesRes.batches);
      }
      if (eventsRes.success) {
        setEvents(eventsRes.events);
      }
    } catch (err) {
      console.error('Error loading manufacturer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBatches = batches.length;
  const activeBatches = batches.filter((b) => b.status === 'MANUFACTURED' || b.status === 'CREATED').length;
  const inDistribution = batches.filter((b) => b.status === 'IN_TRANSIT').length;
  const completedBatches = batches.filter((b) => b.status === 'DELIVERED' || b.status === 'SOLD' || b.status === 'RECEIVED').length;

  const transfers = events.filter(
    (e) => e.eventType === 'DISPATCHED' || e.eventType === 'SHIPPED' || e.eventType === 'TRANSFERRED'
  );

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
            Production & Batch Management Hub — <strong style={{ color: '#1e3a8a' }}>{user?.organization?.name || user?.name}</strong>
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/manufacturer/batches/create" className="btn btn-primary btn-sm">
            ➕ Create New Batch
          </Link>
          <Link to="/manufacturer/batches" className="btn btn-outline btn-sm">
            📦 View Batches
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
          <div className="stat-value" style={{ color: '#2563eb' }}>
            {totalBatches}
          </div>
          <div className="stat-label">Total Batches</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Produced under license</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#059669' }}>
            {activeBatches}
          </div>
          <div className="stat-label">Active Batches</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>In facility cleanrooms</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#d97706' }}>
            {inDistribution}
          </div>
          <div className="stat-label">Batches in Distribution</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>In transit to distributors</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#7c3aed' }}>
            {completedBatches}
          </div>
          <div className="stat-label">Completed / Delivered</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Received downstream</div>
        </div>
      </div>

      {/* Main Dual Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Section A: Recent Batches */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#1e3a8a' }}>📦 Recent Production Batches</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Latest manufactured pharmaceutical lots
              </p>
            </div>
            <Link to="/manufacturer/batches" className="btn btn-outline btn-sm">
              View All →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#2563eb' }}>Loading batches...</div>
          ) : batches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
              No batches created yet. Click "Create New Batch" to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {batches.slice(0, 5).map((b) => (
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
                      Mfg: {new Date(b.manufacturingDate).toLocaleDateString()} | Exp: {new Date(b.expiryDate).toLocaleDateString()}
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

        {/* Section B: Recent Transfers */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#1e3a8a' }}>🚚 Recent Custody Transfers</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Handover records to distributors
              </p>
            </div>
            <Link to="/manufacturer/history" className="btn btn-outline btn-sm">
              View History →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#2563eb' }}>Loading transfers...</div>
          ) : transfers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
              No transfers recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {transfers.slice(0, 5).map((evt) => (
                <div
                  key={evt._id}
                  style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={evt.eventType} />
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-heading)' }}>
                        Batch #{evt.batch?.batchNumber || 'Batch Lot'}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(evt.eventDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Destination: <strong>{evt.toOrganization?.name || 'Authorized Distributor'}</strong> ({evt.location || 'In Transit'})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
