import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function PharmacyHistoryPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents({
        limit: 100,
        eventType: eventTypeFilter,
      });
      if (res.success) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error('Error fetching pharmacy supply-chain history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [eventTypeFilter]);

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
            ⛓️ Pharmacy Custody & Verification History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            End-to-end pharmaceutical lineage from manufacture to dispensary reception
          </p>
        </div>

        <Link to="/pharmacy/medicines" className="btn btn-primary btn-sm">
          💊 Browse Medicines
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e3a8a' }}>
            Filter Custodial Checkpoints
          </div>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Checkpoints</option>
            <option value="DELIVERED">DELIVERED (Dispensary Arrival)</option>
            <option value="SOLD">SOLD (Dispensed to Patient)</option>
            <option value="TRANSFERRED">TRANSFERRED (Transit Hub)</option>
            <option value="MANUFACTURED">MANUFACTURED (Origin Release)</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading custody history...
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No supply chain events recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>EVENT TYPE</th>
                  <th>BATCH NUMBER</th>
                  <th>FROM ENTITY</th>
                  <th>TO ENTITY</th>
                  <th>LOCATION</th>
                  <th>QUANTITY</th>
                  <th>TIMESTAMP</th>
                  <th style={{ textAlign: 'right' }}>VERIFY</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt._id}>
                    <td>
                      <StatusBadge status={evt.eventType} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1e3a8a' }}>
                      {evt.batch?.batchNumber || 'Batch Lot'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{evt.fromOrganization?.name || 'Wholesale Supplier'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{evt.toOrganization?.name || 'Pharmacy Dispensary'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evt.location || 'N/A'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{evt.quantity?.toLocaleString() || '-'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(evt.eventDate).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/verify/${evt.batch?.qrIdentifier || evt.batch?.batchNumber}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Inspect →
                      </Link>
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
