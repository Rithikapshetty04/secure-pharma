import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminUsersPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const res = await api.getOrganizations({ limit: 100, search, type: typeFilter });
      if (res.success) {
        setOrganizations(res.organizations);
      }
    } catch (err) {
      console.error('Error fetching organizations/users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOrganizations();
  };

  const handleUpdateStatus = async (orgId, orgName, newStatus) => {
    const reason = window.prompt(`Enter reason for updating status of '${orgName}' to ${newStatus}:`, 'Administrative oversight adjustment');
    if (reason === null) return;

    try {
      const res = await api.updateOrganizationStatus(orgId, newStatus, reason);
      if (res.success) {
        alert(`✓ Status of ${orgName} updated to ${newStatus}.`);
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
          👥 Stakeholder & Organization Management
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Review registered manufacturers, distributors, and pharmacy entities with access permissions
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by organization name or email..."
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">All Organization Types</option>
            <option value="MANUFACTURER">Manufacturers</option>
            <option value="DISTRIBUTOR">Distributors</option>
            <option value="PHARMACY">Pharmacies</option>
          </select>

          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#2563eb', fontWeight: '600' }}>
            Loading stakeholders...
          </div>
        ) : organizations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            No registered organizations found matching search criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ORGANIZATION NAME</th>
                  <th>TYPE</th>
                  <th>CONTACT EMAIL</th>
                  <th>FACILITY ADDRESS</th>
                  <th>VERIFICATION STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org._id}>
                    <td>
                      <strong style={{ color: 'var(--text-heading)' }}>{org.name}</strong>
                    </td>
                    <td>
                      <StatusBadge status={org.type} />
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{org.contactEmail || 'N/A'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{org.address || 'Headquarters'}</td>
                    <td>
                      <StatusBadge status={org.status || 'PENDING'} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {org.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(org._id, org.name, 'APPROVED')}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#059669' }}
                          >
                            ✓ Approve
                          </button>
                        )}
                        {org.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => handleUpdateStatus(org._id, org.name, 'SUSPENDED')}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#dc2626' }}
                          >
                            Suspend
                          </button>
                        )}
                      </div>
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
