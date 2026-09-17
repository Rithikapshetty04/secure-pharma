import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
<<<<<<< HEAD
import StatusBadge from '../../components/StatusBadge';

export default function ManufacturerHistoryPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
=======
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
>>>>>>> origin/main

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents({
<<<<<<< HEAD
        limit: 100,
        eventType: eventTypeFilter,
      });
      if (res.success) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error('Error fetching manufacturer supply-chain history:', err);
=======
        limit: 50,
        eventType: eventTypeFilter,
      });

      if (res.success) {
        setEvents(res.events);
        setTotal(res.total);
      }
    } catch (err) {
      console.error('Error fetching manufacturer history:', err);
>>>>>>> origin/main
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [eventTypeFilter]);

<<<<<<< HEAD
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
            ⛓️ Supply Chain Traceability History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Audited custodial events, handovers, and tamper-proof provenance checkpoints
          </p>
        </div>

        <Link to="/manufacturer/transfers" className="btn btn-primary btn-sm">
          🚚 New Transfer Handover
=======
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
>>>>>>> origin/main
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
<<<<<<< HEAD
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
            <option value="MANUFACTURED">MANUFACTURED (Production Release)</option>
            <option value="DISPATCHED">DISPATCHED (Wholesale Handover)</option>
            <option value="RECEIVED">RECEIVED (Partner Check-in)</option>
            <option value="TRANSFERRED">TRANSFERRED (Transit Node)</option>
            <option value="DELIVERED">DELIVERED (Dispensary Arrival)</option>
            <option value="SOLD">SOLD (Patient Dispense)</option>
            <option value="RECALLED">RECALLED (Safety Order)</option>
=======
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
>>>>>>> origin/main
          </select>
        </div>
      </div>

<<<<<<< HEAD
      {/* History Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading provenance ledger history...
          </div>
=======
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
>>>>>>> origin/main
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No supply chain events recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
<<<<<<< HEAD
                  <th>EVENT TYPE</th>
                  <th>BATCH NUMBER</th>
                  <th>FROM ENTITY</th>
                  <th>TO ENTITY</th>
                  <th>LOCATION</th>
                  <th>QUANTITY</th>
                  <th>TIMESTAMP</th>
                  <th style={{ textAlign: 'right' }}>VERIFY</th>
=======
                  <th>EVENT</th>
                  <th>BATCH #</th>
                  <th>MEDICINE</th>
                  <th>FROM ENTITY</th>
                  <th>TO ENTITY</th>
                  <th>LOCATION</th>
                  <th>TIMESTAMP</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
>>>>>>> origin/main
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
<<<<<<< HEAD
                    <td style={{ fontSize: '0.85rem' }}>{evt.fromOrganization?.name || 'Origin Facility'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{evt.toOrganization?.name || 'Destination Node'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evt.location || 'N/A'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{evt.quantity?.toLocaleString() || '-'}</td>
=======
                    <td>{evt.batch?.product?.name || 'Formulary Drug'}</td>
                    <td>{evt.fromOrganization?.name || 'Manufacturer Cleanroom'}</td>
                    <td>{evt.toOrganization?.name || 'Distributor Hub'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evt.location}</td>
>>>>>>> origin/main
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(evt.eventDate).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
<<<<<<< HEAD
                      <Link
                        to={`/verify/${evt.batch?.qrIdentifier || evt.batch?.batchNumber}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Inspect →
                      </Link>
=======
                      <button
                        onClick={() => handleInspectBatch(evt.batch?._id, evt.batch?.batchNumber)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#eff6ff', color: '#1d4ed8' }}
                      >
                        Timeline →
                      </button>
>>>>>>> origin/main
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
