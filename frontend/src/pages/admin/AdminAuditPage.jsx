import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({ limit: 100, action: actionFilter });
      if (res.success) {
        setLogs(res.logs || res.auditLogs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
          📋 21 CFR Part 11 Regulatory Audit Ledger
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Immutable cryptographic log of all license reviews, batch mints, status changes, and custody transfers
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e3a8a' }}>
            Filter Actions
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Regulatory Actions</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
            <option value="USER_LOGGED_IN">USER_LOGGED_IN</option>
            <option value="LICENSE_APPROVED">LICENSE_APPROVED</option>
            <option value="LICENSE_REJECTED">LICENSE_REJECTED</option>
            <option value="BATCH_CREATED">BATCH_CREATED</option>
            <option value="BATCH_RECALLED">BATCH_RECALLED</option>
            <option value="BATCH_FLAGGED">BATCH_FLAGGED</option>
            <option value="PRODUCT_CREATED">PRODUCT_CREATED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading tamper-proof audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No audit records matching filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ACTION</th>
                  <th>ACTOR / USER</th>
                  <th>ORGANIZATION</th>
                  <th>ENTITY</th>
                  <th>TIMESTAMP</th>
                  <th>IP / CLIENT</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <StatusBadge status={log.action} />
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-heading)' }}>{log.user?.name || log.user?.email || 'System'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{log.user?.role}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{log.organization?.name || 'Federal Node'}</td>
                    <td style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                      {log.entityType} ({log.entityId ? log.entityId.slice(-6) : '-'})
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {log.ipAddress || '127.0.0.1'}
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
