import React from 'react';

export default function StatusBadge({ status, style = {} }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  let badgeClass = 'badge-info';
  let icon = '•';

  switch (normalized) {
    case 'APPROVED':
    case 'VERIFIED':
    case 'AUTHENTIC':
    case 'ACTIVE':
    case 'DELIVERED':
    case 'MANUFACTURED':
    case 'SOLD':
      badgeClass = 'badge-success';
      icon = '✓';
      break;

    case 'PENDING':
    case 'UNDER_REVIEW':
    case 'IN_TRANSIT':
    case 'DISPATCHED':
    case 'SHIPPED':
    case 'RECEIVED':
    case 'TRANSFERRED':
      badgeClass = 'badge-warning';
      icon = '⏳';
      break;

    case 'REJECTED':
    case 'SUSPENDED':
    case 'RECALLED':
    case 'EXPIRED':
    case 'FLAGGED':
    case 'SUSPICIOUS':
    case 'NOT_FOUND':
    case 'INACTIVE':
      badgeClass = 'badge-danger';
      icon = '⚠️';
      break;

    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'REGULATOR':
      badgeClass = 'badge-danger';
      icon = '🛡️';
      break;

    case 'MANUFACTURER':
      badgeClass = 'badge-success';
      icon = '🏭';
      break;

    case 'DISTRIBUTOR':
      badgeClass = 'badge-purple';
      icon = '🚚';
      break;

    case 'PHARMACY':
      badgeClass = 'badge-info';
      icon = '🏥';
      break;

    default:
      badgeClass = 'badge-info';
      icon = '•';
  }

  return (
    <span className={`badge ${badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', ...style }}>
      <span style={{ fontSize: '0.75rem' }}>{icon}</span>
      <span>{normalized.replace(/_/g, ' ')}</span>
    </span>
  );
}
