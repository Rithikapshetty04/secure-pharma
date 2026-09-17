import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';

export default function ManufacturerHistoryPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [inspectedBatchEvents, setInspectedBatchEvents] = useState(null);
  const [inspectedBatchNum, setInspectedBatchNum] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents({
        limit: 50,
        eventType: eventTypeFilter,
      });

      if (res.success) {
        setEvents(res.events);
        setTotal(res.total);
      }
    } catch (err) {
      console.error('Error fetching manufacturer history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [eventTypeFilter]);

  const handleInspectBatch = async (batchId, batchNum) => {
    try {
      const res = await api.getBatchEvents(batchId);
      if (res.success) {
        setInspectedBatchEvents(res.events);
        setInspectedBatchNum(batchNum);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
            ⛓️ Manufacturer Supply-Chain History
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Auditable custody logs of batch manufacturing, releases, and distributor handovers ({total} total events)
          </p>
        </div>

        <Link to="/manufacturer/batches" className="btn btn-outline btn-sm">
          ← Back to Batches
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-dim)' }}>Filter by Event Type:</span>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Supply Chain Events</option>
            <option value="MANUFACTURED">MANUFACTURED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="TRANSFERRED">TRANSFERRED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="RECALLED">RECALLED</option>
            <option value="FLAGGED">FLAGGED</option>
          </select>
        </div>
      </div>

      {/* Selected Batch Timeline Modal / View */}
      {inspectedBatchEvents && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '28px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#1e3a8a', margin: 0 }}>
                Chronological Provenance: Batch #{inspectedBatchNum}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Full verified journey across supply chain checkpoints
              </p>
            </div>
            <button onClick={() => setInspectedBatchEvents(null)} className="btn btn-outline btn-sm">
              ✕ Close
            </button>
          </div>

          <Timeline events={inspectedBatchEvents} />
        </div>
      )}

      {/* History Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#2563eb' }}>Loading history logs...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No supply chain events recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>EVENT</th>
                  <th>BATCH #</th>
                  <th>MEDICINE</th>
                  <th>FROM ENTITY</th>
                  <th>TO ENTITY</th>
                  <th>LOCATION</th>
                  <th>TIMESTAMP</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
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
                    <td>{evt.batch?.product?.name || 'Formulary Drug'}</td>
                    <td>{evt.fromOrganization?.name || 'Manufacturer Cleanroom'}</td>
                    <td>{evt.toOrganization?.name || 'Distributor Hub'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evt.location}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(evt.eventDate).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleInspectBatch(evt.batch?._id, evt.batch?.batchNumber)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#eff6ff', color: '#1d4ed8' }}
                      >
                        Timeline →
                      </button>
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
