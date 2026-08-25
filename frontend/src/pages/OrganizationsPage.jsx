import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function OrganizationsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const isRegulator = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'REGULATOR';

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const res = await api.getOrganizations({ page, limit: 12, search, type, status });
      if (res.success) {
        setOrganizations(res.organizations);
        setTotal(res.total);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [page, type, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrganizations();
  };

  const handleUpdateStatus = async (orgId, orgName) => {
    const newStatus = window.prompt(`Update status for ${orgName} (APPROVED, REJECTED, SUSPENDED, UNDER_REVIEW):`);
    if (!newStatus) return;

    const normalized = newStatus.trim().toUpperCase();
    let reason = '';
    if (normalized === 'REJECTED' || normalized === 'SUSPENDED') {
      reason = window.prompt(`Enter mandatory reason for setting ${orgName} to ${normalized}:`);
      if (!reason) {
        alert('Reason is required.');
        return;
      }
    }

    try {
      const res = await api.updateOrganizationStatus(orgId, normalized, reason);
      if (res.success) {
        alert(`✓ Organization status updated to ${normalized}.`);
        loadOrganizations();
      } else {
        alert(`Failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
          🏢 Pharmaceutical Organization Registry
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
          Authorized supply chain participants, manufacturing plants, distributors, and licensed pharmacies
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by organization name, email, or registration number..."
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          />

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Entity Types</option>
            <option value="MANUFACTURER">Manufacturers</option>
            <option value="DISTRIBUTOR">Distributors</option>
            <option value="PHARMACY">Pharmacies</option>
            <option value="REGULATOR">Regulators</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PENDING">PENDING</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#2563eb', fontWeight: '600' }}>
          Loading organization registry...
        </div>
      ) : organizations.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', background: '#ffffff' }}>
          No organizations found matching criteria.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
        }}>
          {organizations.map((org) => (
            <div key={org._id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <StatusBadge status={org.type} />
                <StatusBadge status={org.status} />
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1e3a8a', marginBottom: '4px' }}>
                {org.name}
              </h3>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                Reg #: <strong style={{ color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>{org.registrationNumber || 'N/A'}</strong>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '16px',
              }}>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Address: </span>
                  <span style={{ color: 'var(--text-heading)' }}>{org.address || 'Address pending'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Email: </span>
                  <span style={{ color: '#2563eb', fontWeight: '600' }}>{org.contactEmail}</span>
                </div>
                {org.contactPhone && (
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Phone: </span>
                    <span style={{ color: 'var(--text-heading)' }}>{org.contactPhone}</span>
                  </div>
                )}
              </div>

              {isRegulator && (
                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => handleUpdateStatus(org._id, org.name)}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', fontSize: '0.8rem', background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}
                  >
                    🛡️ Manage Status & Compliance
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
