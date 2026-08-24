import React, { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function Timeline({ events = [] }) {
  const [copiedHash, setCopiedHash] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

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
        background: 'linear-gradient(180deg, #10b981 0%, #00f2fe 50%, #8b5cf6 100%)',
        boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)',
      }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              background: '#0a0e17',
              border: '3px solid var(--accent-cyan)',
              boxShadow: '0 0 12px var(--accent-cyan)',
            }}></div>

            {/* Event Box */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              transition: 'border-color 0.2s',
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
                  <strong style={{ color: '#fff', fontSize: '1rem' }}>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{evt.location || 'Verified Supply Chain Checkpoint'}</span>
                {evt.quantity && (
                  <span style={{ marginLeft: '12px', color: 'var(--accent-cyan)' }}>
                    • Qty: {evt.quantity.toLocaleString()} units
                  </span>
                )}
              </div>

              {evt.notes && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontStyle: 'italic' }}>
                  "{evt.notes}"
                </p>
              )}

              {/* Transaction Hash */}
              {evt.transactionHash && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  width: 'fit-content',
                }}>
                  <span>Hash: {evt.transactionHash.slice(0, 16)}...{evt.transactionHash.slice(-8)}</span>
                  <button
                    onClick={() => copyToClipboard(evt.transactionHash, evt._id || idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-cyan)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    {copiedHash === (evt._id || idx) ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
