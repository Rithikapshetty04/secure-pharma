import React from 'react';
import StatusBadge from './StatusBadge';

export default function Timeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
        No supply chain custody events logged for this item yet.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '24px' }}>
      {/* Glowing Vertical Line */}
      <div style={{
        position: 'absolute',
        left: '7px',
        top: '12px',
        bottom: '12px',
        width: '2px',
        background: 'linear-gradient(180deg, #10b981 0%, #2563eb 50%, #7c3aed 100%)',
      }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {events.map((evt, idx) => (
          <div key={evt._id || evt.id || idx} style={{ position: 'relative' }}>
            {/* Dot Node */}
            <div style={{
              position: 'absolute',
              left: '-24px',
              top: '6px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '3px solid #2563eb',
              boxShadow: '0 0 8px rgba(37, 99, 235, 0.4)',
            }}></div>

            {/* Event Box */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge status={evt.eventType} />
                  <strong style={{ color: 'var(--text-heading)', fontSize: '0.95rem' }}>
                    {evt.fromOrganization?.name || evt.fromOrganization || 'Origin Facility'}
                    {evt.toOrganization && evt.toOrganization !== evt.fromOrganization
                      ? ` → ${evt.toOrganization?.name || evt.toOrganization}`
                      : ''}
                  </strong>
                </div>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(evt.eventDate || evt.timestamp).toLocaleString()}
                </span>
              </div>

              {/* Location & Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{evt.location || 'Verified Supply Chain Checkpoint'}</span>
                {evt.quantity && (
                  <span style={{ marginLeft: '12px', color: '#2563eb', fontWeight: '600' }}>
                    • Qty: {evt.quantity.toLocaleString()} units
                  </span>
                )}
              </div>

              {evt.notes && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                  "{evt.notes}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
