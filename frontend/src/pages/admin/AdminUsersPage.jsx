import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  UserCheck,
  UserX,
  AlertCircle,
  Eye,
  RefreshCw,
  Lock,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Calendar,
  Phone,
  Shield,
  X
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    manufacturers: 0,
    distributors: 0,
    pharmacies: 0,
    admins: 0,
    pending: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Details states
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const fetchUsers = async (pageToFetch = pagination.page, isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = {
        page: pageToFetch,
        limit: pagination.limit,
        search,
        role: roleFilter,
        status: statusFilter
      };

      const res = await adminApi.getUsers(params);

      if (res && res.success && res.data) {
        setUsers(res.data.users || []);
        if (res.data.pagination) setPagination(res.data.pagination);
        if (res.data.summary) setSummary(res.data.summary);
      } else {
        throw new Error(res?.message || 'Failed to retrieve user directory.');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Unable to load user list. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  const openStatusModal = (userToUpdate, newStatus) => {
    setStatusModalUser(userToUpdate);
    setTargetStatus(newStatus);
    setStatusReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalUser || !targetStatus) return;

    // Self protection check
    if (currentUser?._id === statusModalUser._id) {
      setActionMessage({
        type: 'error',
        text: 'Self-Protection Enforced: You cannot alter the status of your own admin account.'
      });
      setStatusModalUser(null);
      return;
    }

    try {
      setSubmittingStatus(true);
      const res = await adminApi.updateUserStatus(statusModalUser._id, targetStatus, statusReason);

      if (res && res.success) {
        setActionMessage({
          type: 'success',
          text: res.message || `Account status updated to ${targetStatus}.`
        });
        setStatusModalUser(null);
        fetchUsers(pagination.page, true);

        // Update selected details drawer if open
        if (selectedUser && selectedUser._id === statusModalUser._id) {
          setSelectedUser(prev => ({
            ...prev,
            accountStatus: targetStatus
          }));
        }
      } else {
        throw new Error(res?.message || 'Failed to update user status.');
      }
    } catch (err) {
      console.error('Status change error:', err);
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to update user account status.'
      });
    } finally {
      setSubmittingStatus(false);
    }
  };

  const openUserDetails = async (userObj) => {
    try {
      setSelectedUser(userObj);
      setDetailsLoading(true);

      const res = await adminApi.getUserById(userObj._id);
      if (res && res.success && res.data?.user) {
        setSelectedUser(res.data.user);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'REGULATOR'].includes(currentUser?.role?.toUpperCase());

  if (!currentUser || !isAdminRole) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <Lock style={{ width: '48px', height: '48px', color: '#e11d48', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            You do not have administrative authorization to view user management.
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            Return to Authorized Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role) => {
    switch (role?.toUpperCase()) {
      case 'MANUFACTURER':
        return <span className="badge badge-info">MANUFACTURER</span>;
      case 'DISTRIBUTOR':
        return <span className="badge badge-warning">DISTRIBUTOR</span>;
      case 'PHARMACY':
        return <span className="badge badge-success">PHARMACY</span>;
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'REGULATOR':
        return <span className="badge" style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' }}>ADMINISTRATOR</span>;
      default:
        return <span className="badge">{role}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
      case 'ACTIVE':
        return <span className="badge badge-success">APPROVED</span>;
      case 'PENDING':
      case 'UNDER_REVIEW':
        return <span className="badge badge-warning">PENDING APPROVAL</span>;
      case 'SUSPENDED':
        return <span className="badge badge-danger">SUSPENDED</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">REJECTED</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid #334155'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  background: 'rgba(37, 99, 235, 0.25)',
                  color: '#93c5fd',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  textTransform: 'uppercase'
                }}
              >
                PLATFORM GOVERNANCE
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#ffffff', margin: '2px 0 4px', letterSpacing: '-0.02em' }}>
              Stakeholder & User Management
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '680px', margin: 0 }}>
              Monitor registered users, inspect entity details, manage account access, and enforce regulatory compliance.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => fetchUsers(pagination.page, true)}
              disabled={refreshing}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.85rem',
                fontWeight: '600',
                padding: '9px 16px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: refreshing ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw style={{ width: '16px', height: '16px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb' }}>
            <Users style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Users</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)' }}>{summary.total ?? 0}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a' }}>
            <Building2 style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Makers</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)' }}>{summary.manufacturers ?? 0}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed' }}>
            <Building2 style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Distributors</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)' }}>{summary.distributors ?? 0}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7' }}>
            <Building2 style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pharmacies</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)' }}>{summary.pharmacies ?? 0}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: '#fffbeb', color: '#d97706' }}>
            <Clock style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pending Review</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: summary.pending > 0 ? '#d97706' : 'var(--text-heading)' }}>
              {summary.pending ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* ACTION MESSAGE TOAST / BANNER */}
      {actionMessage.text && (
        <div
          className="card"
          style={{
            padding: '14px 18px',
            borderColor: actionMessage.type === 'success' ? '#a7f3d0' : '#fecaca',
            background: actionMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: actionMessage.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {actionMessage.type === 'success' ? <CheckCircle2 style={{ width: '20px', height: '20px' }} /> : <AlertCircle style={{ width: '20px', height: '20px' }} />}
            <strong>{actionMessage.text}</strong>
          </div>
          <button onClick={() => setActionMessage({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', flex: '1 1 300px', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="input"
                placeholder="Search by name, email, or organization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px', height: '40px', fontSize: '0.88rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '40px', padding: '0 16px', fontSize: '0.85rem' }}>
              Search
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter style={{ width: '14px', height: '14px', color: 'var(--text-dim)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dim)' }}>Role:</span>
              <select
                className="input"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ height: '40px', padding: '0 12px', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Roles</option>
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dim)' }}>Status:</span>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: '40px', padding: '0 12px', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved / Active</option>
                <option value="PENDING">Pending Approval</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn"
                style={{ height: '40px', background: '#f1f5f9', color: 'var(--text-main)', fontSize: '0.82rem', padding: '0 12px' }}
              >
                Clear Filters
              </button>
            )}
          </div>

        </form>
      </div>

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="card" style={{ padding: '24px', textAlign: 'center', borderColor: '#fca5a5', background: '#fff5f5' }}>
          <AlertCircle style={{ width: '40px', height: '40px', color: '#e11d48', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#991b1b', marginBottom: '6px' }}>
            Unable to Load User Directory
          </h3>
          <p style={{ color: '#7f1d1d', fontSize: '0.88rem', marginBottom: '16px' }}>{error}</p>
          <button onClick={() => fetchUsers(pagination.page)} className="btn btn-primary">
            Retry Data Load
          </button>
        </div>
      )}

      {/* USERS TABLE */}
      {!error && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading user directory from database...</p>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Users style={{ width: '44px', height: '44px', color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-heading)' }}>No users found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px', maxWidth: '400px', margin: '4px auto 16px' }}>
                No registered users match your search query or status filter criteria.
              </p>
              <button onClick={handleClearFilters} className="btn" style={{ background: '#f1f5f9', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>User & Contact</th>
                    <th>Role</th>
                    <th>Organization / Company</th>
                    <th>Account Status</th>
                    <th>License Status</th>
                    <th>Registration Date</th>
                    <th style={{ textAlign: 'right' }}>Administrative Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = currentUser?._id === u._id;
                    const isOtherAdmin = ['ADMIN', 'SUPER_ADMIN', 'REGULATOR'].includes(u.role?.toUpperCase());

                    return (
                      <tr key={u._id} style={{ opacity: u.accountStatus === 'SUSPENDED' ? 0.75 : 1 }}>
                        {/* Name & Email */}
                        <td>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-heading)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {u.name}
                              {isSelf && (
                                <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', background: '#eff6ff', color: '#2563eb', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                  YOU (Self)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Mail style={{ width: '12px', height: '12px' }} /> {u.email}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td>{getRoleBadge(u.role)}</td>

                        {/* Organization */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
                            <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                              {u.organization?.name || 'Independent / Platform Admin'}
                            </span>
                          </div>
                          {u.organization?.registrationNumber && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginLeft: '20px' }}>
                              Reg #{u.organization.registrationNumber}
                            </div>
                          )}
                        </td>

                        {/* Account Status */}
                        <td>{getStatusBadge(u.accountStatus)}</td>

                        {/* License Status */}
                        <td>
                          {u.license ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.76rem', fontWeight: '700', color: u.license.verificationStatus === 'APPROVED' || u.license.verificationStatus === 'VERIFIED' ? '#059669' : '#d97706' }}>
                                {u.license.verificationStatus === 'APPROVED' || u.license.verificationStatus === 'VERIFIED' ? '✓ Verified License' : `⏳ License ${u.license.verificationStatus}`}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                #{u.license.licenseNumber}
                              </span>
                            </div>
                          ) : u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN' ? (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', italic: 'true' }}>No license filed</span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>N/A (Admin)</span>
                          )}
                        </td>

                        {/* Registration Date */}
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            
                            {/* View Details button */}
                            <button
                              onClick={() => openUserDetails(u)}
                              className="btn"
                              style={{ padding: '6px 10px', fontSize: '0.78rem', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye style={{ width: '14px', height: '14px' }} />
                              Details
                            </button>

                            {/* Status Change button */}
                            {isSelf ? (
                              <button
                                disabled
                                title="Self-Protection Enforced: Cannot modify own account status"
                                className="btn"
                                style={{ padding: '6px 10px', fontSize: '0.78rem', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1', cursor: 'not-allowed' }}
                              >
                                Protected
                              </button>
                            ) : u.accountStatus === 'SUSPENDED' ? (
                              <button
                                onClick={() => openStatusModal(u, 'APPROVED')}
                                className="btn"
                                style={{ padding: '6px 10px', fontSize: '0.78rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <UserCheck style={{ width: '14px', height: '14px' }} />
                                Activate
                              </button>
                            ) : u.accountStatus === 'PENDING' || u.accountStatus === 'UNDER_REVIEW' ? (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => openStatusModal(u, 'APPROVED')}
                                  className="btn btn-success"
                                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => openStatusModal(u, 'REJECTED')}
                                  className="btn btn-danger"
                                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openStatusModal(u, 'SUSPENDED')}
                                className="btn"
                                style={{ padding: '6px 10px', fontSize: '0.78rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <UserX style={{ width: '14px', height: '14px' }} />
                                Suspend
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {pagination.pages > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} total registered users)
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    background: pagination.page <= 1 ? '#f1f5f9' : '#ffffff',
                    color: pagination.page <= 1 ? '#cbd5e1' : 'var(--text-main)',
                    border: '1px solid var(--border-subtle)',
                    cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} /> Previous
                </button>

                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    background: pagination.page >= pagination.pages ? '#f1f5f9' : '#ffffff',
                    color: pagination.page >= pagination.pages ? '#cbd5e1' : 'var(--text-main)',
                    border: '1px solid var(--border-subtle)',
                    cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next <ChevronRight style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* USER DETAILS DRAWER / MODAL */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              height: '100vh',
              background: '#ffffff',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
                  User Profile & Entity Record
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedUser._id}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="btn" style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px', color: 'var(--text-dim)' }} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {detailsLoading ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ width: '28px', height: '28px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading user details...</p>
                </div>
              ) : (
                <>
                  {/* Account Summary Box */}
                  <div className="card" style={{ padding: '16px 20px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '12px' }}>
                      <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-heading)' }}>
                        {selectedUser.name}
                      </div>
                      {getStatusBadge(selectedUser.accountStatus)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Mail style={{ width: '15px', height: '15px', color: '#2563eb' }} />
                        <span>{selectedUser.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Shield style={{ width: '15px', height: '15px', color: '#7c3aed' }} />
                        <span>Role: {getRoleBadge(selectedUser.role)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Calendar style={{ width: '15px', height: '15px', color: '#059669' }} />
                        <span>Registered: {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Organization Section */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                      Linked Organization
                    </h4>
                    {selectedUser.organization ? (
                      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                        <div><strong>Name:</strong> {selectedUser.organization.name}</div>
                        <div><strong>Type:</strong> {selectedUser.organization.type}</div>
                        {selectedUser.organization.registrationNumber && (
                          <div><strong>Registration #:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedUser.organization.registrationNumber}</span></div>
                        )}
                        {selectedUser.organization.contactEmail && (
                          <div><strong>Contact Email:</strong> {selectedUser.organization.contactEmail}</div>
                        )}
                        {selectedUser.organization.contactPhone && (
                          <div><strong>Contact Phone:</strong> {selectedUser.organization.contactPhone}</div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', italic: 'true' }}>
                        No organization linked. Independent system user.
                      </div>
                    )}
                  </div>

                  {/* License Section */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                        Regulatory License Information
                      </h4>
                      <Link to="/admin/licenses" style={{ fontSize: '0.78rem', fontWeight: '600', color: '#2563eb', textDecoration: 'none' }}>
                        Review Licenses →
                      </Link>
                    </div>
                    {selectedUser.license ? (
                      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', background: '#fffbeb', borderColor: '#fde68a' }}>
                        <div><strong>License Number:</strong> <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>#{selectedUser.license.licenseNumber}</span></div>
                        <div><strong>Type:</strong> {selectedUser.license.licenseType}</div>
                        <div><strong>Status:</strong> <span style={{ fontWeight: '700', color: '#b45309' }}>{selectedUser.license.verificationStatus}</span></div>
                        {selectedUser.license.issuingAuthority && (
                          <div><strong>Authority:</strong> {selectedUser.license.issuingAuthority}</div>
                        )}
                        {selectedUser.license.expiryDate && (
                          <div><strong>Expires:</strong> {new Date(selectedUser.license.expiryDate).toLocaleDateString()}</div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        No regulatory license on file for this user's organization.
                      </div>
                    )}
                  </div>

                  {/* Audit Logs History Section */}
                  {selectedUser.auditLogs && selectedUser.auditLogs.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                        Recent User Activity Log
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedUser.auditLogs.map((log) => (
                          <div key={log._id} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-heading)' }}>{log.action}</div>
                            <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{log.details}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedUser(null)} className="btn" style={{ background: '#e2e8f0', color: 'var(--text-main)' }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE CONFIRMATION MODAL */}
      {statusModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setStatusModalUser(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '50%', background: targetStatus === 'SUSPENDED' || targetStatus === 'REJECTED' ? '#fef2f2' : '#ecfdf5', color: targetStatus === 'SUSPENDED' || targetStatus === 'REJECTED' ? '#e11d48' : '#059669' }}>
                <AlertTriangle style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
                  Confirm Status Change
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Target: <strong>{statusModalUser.name}</strong> ({statusModalUser.email})
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
              Are you sure you want to change this user's status from <strong>{statusModalUser.accountStatus}</strong> to <strong style={{ color: targetStatus === 'APPROVED' ? '#059669' : '#b91c1c' }}>{targetStatus}</strong>?
              {targetStatus === 'SUSPENDED' && ' This will block the user from accessing the platform until restored.'}
            </p>

            {(targetStatus === 'SUSPENDED' || targetStatus === 'REJECTED') && (
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Reason for {targetStatus} (Optional):
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Provide administrative justification for this status update..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                disabled={submittingStatus}
                className="btn"
                style={{ background: '#f1f5f9', color: 'var(--text-main)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={submittingStatus}
                className={`btn ${targetStatus === 'APPROVED' ? 'btn-success' : 'btn-danger'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {submittingStatus ? 'Updating...' : `Confirm ${targetStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
