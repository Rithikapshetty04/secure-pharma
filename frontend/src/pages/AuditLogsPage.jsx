import React, { useEffect, useState } from 'react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({ page, limit: 20, search, action });
      if (res.success) {
        setLogs(res.logs);
        setTotal(res.total);
      }
    } catch (err) {
      console.error('Error fetching audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, action]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
            21 CFR PART 11 COMPLIANT
          </span>
          <span className="live-dot"></span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
          📋 Regulatory Audit & Compliance Ledger
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
          Append-only tamper-evident record of all system events, authentication, and custody updates
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit details, IP addresses, or metadata..."
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />

          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '10px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Audited Actions</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="LICENSE_SUBMITTED">LICENSE_SUBMITTED</option>
            <option value="LICENSE_APPROVED">LICENSE_APPROVED</option>
            <option value="LICENSE_REJECTED">LICENSE_REJECTED</option>
            <option value="PRODUCT_CREATED">PRODUCT_CREATED</option>
            <option value="BATCH_CREATED">BATCH_CREATED</option>
            <option value="BATCH_RECALLED">BATCH_RECALLED</option>
            <option value="PRODUCT_FLAGGED">PRODUCT_FLAGGED</option>
          </select>

          <button type="submit" className="btn btn-primary btn-sm">
            Filter Logs
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--accent-cyan)' }}>
            Loading tamper-evident audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No audit records matching query.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ACTION</th>
                  <th>USER / ACTOR</th>
                  <th>ORGANIZATION</th>
                  <th>DETAILS / METADATA</th>
                  <th>IP ORIGIN</th>
                  <th style={{ textAlign: 'right' }}>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <StatusBadge status={log.action} />
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{log.user?.name || 'System / Public'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{log.user?.email || 'Public Client'}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {log.organization?.name || 'Network'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '360px', wordBreak: 'break-word' }}>
                      {log.details ? String(log.details) : 'Audit entry logged.'}
                    </td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
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
