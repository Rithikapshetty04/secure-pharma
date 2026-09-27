import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api';
import {
  Users,
  FileCheck,
  Package,
  Activity,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Building2,
  Lock,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Boxes,
  Truck,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await adminApi.getDashboard();

      if (response && response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response?.message || 'Failed to retrieve admin dashboard summary.');
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.message || 'Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'REGULATOR'].includes(user?.role?.toUpperCase());

  if (!user || !isAdminRole) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <Lock style={{ width: '48px', height: '48px', color: '#e11d48', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            You do not have administrative permissions to view the system dashboard.
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            Return to Authorized Area
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // LOADING SKELETON
  // ---------------------------------------------------------------------------
  if (loading && !data) {
    return (
      <div style={{ padding: '24px', maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Skeleton */}
        <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff' }}>
          <div style={{ height: '18px', width: '180px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '12px' }} />
          <div style={{ height: '32px', width: '320px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', marginBottom: '8px' }} />
          <div style={{ height: '16px', width: '480px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
        </div>

        {/* Overview Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div key={idx} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ height: '14px', width: '60%', background: '#e2e8f0', borderRadius: '4px' }} />
              <div style={{ height: '32px', width: '40%', background: '#cbd5e1', borderRadius: '6px' }} />
              <div style={{ height: '12px', width: '75%', background: '#f1f5f9', borderRadius: '4px' }} />
            </div>
          ))}
        </div>

        {/* Section Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="card" style={{ padding: '24px' }}>
              <div style={{ height: '20px', width: '50%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '16px' }} />
              <div style={{ height: '80px', background: '#f8fafc', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ERROR STATE
  // ---------------------------------------------------------------------------
  if (error && !data) {
    return (
      <div style={{ padding: '24px', maxWidth: '1360px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center', borderColor: '#fca5a5', background: '#fff5f5' }}>
          <AlertTriangle style={{ width: '48px', height: '48px', color: '#e11d48', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#991b1b', marginBottom: '8px' }}>
            Unable to Load Dashboard Data
          </h2>
          <p style={{ color: '#7f1d1d', fontSize: '0.9rem', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
            {error}
          </p>
          <button
            onClick={() => fetchDashboardData()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Retry Data Fetch
          </button>
        </div>
      </div>
    );
  }

  const {
    users = {},
    licenses = {},
    batches = {},
    supplyChain = {},
    orders = {},
    blockchain = {},
    attentionRequired = {},
    recentAuditLogs = []
  } = data || {};

  return (
    <div style={{ padding: '24px', maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* PAGE HEADER */}
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
                ADMINISTRATIVE CONTROL
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  fontWeight: '600'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                Real-Time Monitoring Active
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#ffffff', margin: '2px 0 4px', letterSpacing: '-0.02em' }}>
              Admin Dashboard
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '680px', margin: 0 }}>
              Monitor users, pharmaceutical batches, licenses, supply-chain activity, and system integrity.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => fetchDashboardData(true)}
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
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw
                style={{
                  width: '16px',
                  height: '16px',
                  animation: refreshing ? 'spin 1s linear infinite' : 'none'
                }}
              />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* OVERVIEW METRICS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        
        {/* Total Users */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Users
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-heading)', margin: '4px 0 2px' }}>
              {users.total ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Registered Stakeholders
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        {/* Active Accounts */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Users
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#059669', margin: '4px 0 2px' }}>
              {users.active ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Approved System Accounts
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        {/* Manufacturers */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Manufacturers
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-heading)', margin: '4px 0 2px' }}>
              {users.manufacturers ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Pharma Producers
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        {/* Distributors */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Distributors
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-heading)', margin: '4px 0 2px' }}>
              {users.distributors ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Wholesale Logistics
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        {/* Pharmacies */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pharmacies
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-heading)', margin: '4px 0 2px' }}>
              {users.pharmacies ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Retail Outlets
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Boxes style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        {/* Pending Licenses */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Licenses
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: (licenses.pending > 0) ? '#d97706' : 'var(--text-heading)', margin: '4px 0 2px' }}>
              {licenses.pending ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Awaiting Verification
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        {/* Registered Batches */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Registered Batches
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-heading)', margin: '4px 0 2px' }}>
              {batches.total ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Total Batch Catalog
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fae8ff', color: '#c026d3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        {/* Supply-Chain Transfers */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Transfers
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-heading)', margin: '4px 0 2px' }}>
              {supplyChain.totalTransfers ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Custody Transitions
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        <Link
          to="/admin/users"
          style={{ textDecoration: 'none' }}
          className="card"
        >
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}>
                <Users style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-heading)' }}>Manage Users</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Roles, status & access</div>
              </div>
            </div>
            <ArrowRight style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
          </div>
        </Link>

        <Link
          to="/admin/licenses"
          style={{ textDecoration: 'none' }}
          className="card"
        >
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}>
                <FileCheck style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-heading)' }}>Review Licenses</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Verify regulatory status</div>
              </div>
            </div>
            <ArrowRight style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
          </div>
        </Link>

        <Link
          to="/admin/batches"
          style={{ textDecoration: 'none' }}
          className="card"
        >
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#fae8ff', color: '#c026d3' }}>
                <Package style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-heading)' }}>Manage Batches</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Oversight & status checks</div>
              </div>
            </div>
            <ArrowRight style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
          </div>
        </Link>

        <Link
          to="/admin/audit"
          style={{ textDecoration: 'none' }}
          className="card"
        >
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
                <Activity style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-heading)' }}>View Audit Trail</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>21 CFR Part 11 records</div>
              </div>
            </div>
            <ArrowRight style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
          </div>
        </Link>
      </div>

      {/* MODULE OVERVIEW CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* USER & STAKEHOLDER OVERVIEW */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users style={{ width: '20px', height: '20px', color: '#2563eb' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
                User & Entity Overview
              </h2>
            </div>
            <Link to="/admin/users" style={{ fontSize: '0.82rem', fontWeight: '600', color: '#2563eb', textDecoration: 'none' }}>
              Manage Users →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase' }}>Total</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '2px' }}>{users.total ?? 0}</div>
            </div>
            <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: '600', textTransform: 'uppercase' }}>Active</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#065f46', marginTop: '2px' }}>{users.active ?? 0}</div>
            </div>
            <div style={{ background: '#fff7ed', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #fed7aa' }}>
              <div style={{ fontSize: '0.72rem', color: '#c2410c', fontWeight: '600', textTransform: 'uppercase' }}>Pending</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#9a3412', marginTop: '2px' }}>{users.pending ?? 0}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Role Distribution
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Building2 style={{ width: '14px', height: '14px' }} /> Manufacturers: <strong>{users.manufacturers ?? 0}</strong>
              </span>
              <span className="badge badge-warning" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Truck style={{ width: '14px', height: '14px' }} /> Distributors: <strong>{users.distributors ?? 0}</strong>
              </span>
              <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Boxes style={{ width: '14px', height: '14px' }} /> Pharmacies: <strong>{users.pharmacies ?? 0}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* LICENSE VERIFICATION OVERVIEW */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCheck style={{ width: '20px', height: '20px', color: '#d97706' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
                License Verification State
              </h2>
            </div>
            <Link to="/admin/licenses" style={{ fontSize: '0.82rem', fontWeight: '600', color: '#d97706', textDecoration: 'none' }}>
              Review Licenses →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#fffbeb', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: '600', textTransform: 'uppercase' }}>Pending</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#92400e', marginTop: '2px' }}>{licenses.pending ?? 0}</div>
            </div>
            <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: '600', textTransform: 'uppercase' }}>Approved</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#065f46', marginTop: '2px' }}>{licenses.approved ?? 0}</div>
            </div>
            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: '600', textTransform: 'uppercase' }}>Rejected</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#991b1b', marginTop: '2px' }}>{licenses.rejected ?? 0}</div>
            </div>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', background: '#f8fafc', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            {licenses.pending > 0 ? (
              <span style={{ color: '#b45309', fontWeight: '600' }}>
                ⚠️ {licenses.pending} stakeholder license application{licenses.pending > 1 ? 's require' : ' requires'} regulatory verification.
              </span>
            ) : (
              <span style={{ color: '#059669', fontWeight: '600' }}>
                ✓ All submitted stakeholder licenses have been processed.
              </span>
            )}
          </div>
        </div>

        {/* BATCH & SUPPLY-CHAIN OVERVIEW */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package style={{ width: '20px', height: '20px', color: '#c026d3' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
                Batch & Custody Activity
              </h2>
            </div>
            <Link to="/admin/batches" style={{ fontSize: '0.82rem', fontWeight: '600', color: '#c026d3', textDecoration: 'none' }}>
              Manage Batches →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase' }}>Total</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '2px' }}>{batches.total ?? 0}</div>
            </div>
            <div style={{ background: '#f5f3ff', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd6fe' }}>
              <div style={{ fontSize: '0.72rem', color: '#6d28d9', fontWeight: '600', textTransform: 'uppercase' }}>In Transit</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#5b21b6', marginTop: '2px' }}>{batches.transferred ?? 0}</div>
            </div>
            <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: '600', textTransform: 'uppercase' }}>Delivered</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#065f46', marginTop: '2px' }}>{batches.delivered ?? 0}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span>Recalled: <strong style={{ color: batches.recalled > 0 ? '#e11d48' : 'var(--text-main)' }}>{batches.recalled ?? 0}</strong></span>
            <span>Flagged: <strong style={{ color: batches.flagged > 0 ? '#d97706' : 'var(--text-main)' }}>{batches.flagged ?? 0}</strong></span>
            <span>Expired: <strong>{batches.expired ?? 0}</strong></span>
          </div>
        </div>

      </div>

      {/* BLOCKCHAIN & TRACEABILITY MONITORING SECTION */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid #312e81'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#a5b4fc', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                ON-CHAIN INTEGRITY MONITORING
              </span>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.25)', color: '#c7d2fe', border: '1px solid rgba(199, 210, 254, 0.3)', fontSize: '0.7rem' }}>
                Read-Only Mode
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
              Blockchain & Traceability Status
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#6ee7b7',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
              Network {blockchain.status || 'CONNECTED'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: '600' }}>Target Blockchain</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginTop: '4px' }}>
              {blockchain.network || 'Sepolia Ethereum Testnet (Simulated Proof)'}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: '600' }}>On-Chain Hashed Batches</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>
              {blockchain.totalOnChainBatches ?? 0}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: '600' }}>On-Chain Custody Events</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>
              {blockchain.totalOnChainEvents ?? 0}
            </div>
          </div>
        </div>

        {/* Latest Verified Blockchain Event */}
        {blockchain.latestTx ? (
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', marginBottom: '8px' }}>
              Latest Verified Blockchain Transaction
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Tx Hash:</span>{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', wordBreak: 'break-all' }}>
                  {blockchain.latestTx.txHash}
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Block:</span>{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>#{blockchain.latestTx.blockNumber}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Batch Number:</span>{' '}
                <strong style={{ color: '#ffffff' }}>{blockchain.latestTx.batchNumber}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Event:</span>{' '}
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{blockchain.latestTx.eventType}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#94a3b8' }}>
            ℹ️ No blockchain-backed transactions registered yet. On-chain event monitoring will display live cryptographic hashes here as custody transfers occur.
          </div>
        )}
      </div>

      {/* ATTENTION REQUIRED & RECENT AUDIT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        
        {/* ATTENTION REQUIRED */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle style={{ width: '20px', height: '20px', color: attentionRequired.hasOutstandingIssues ? '#d97706' : '#059669' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
                Attention Required
              </h2>
            </div>
            {attentionRequired.hasOutstandingIssues && (
              <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Action Needed</span>
            )}
          </div>

          {!attentionRequired.hasOutstandingIssues ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-subtle)' }}>
              <CheckCircle2 style={{ width: '36px', height: '36px', color: '#059669', margin: '0 auto 8px' }} />
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                No outstanding issues detected.
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                All licenses, user accounts, and pharmaceutical batches are in compliance.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Pending License Item */}
              {attentionRequired.pendingLicenses && attentionRequired.pendingLicenses.length > 0 && (
                <div style={{ padding: '14px', background: '#fffbeb', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#92400e' }}>
                      📜 Pending License Approvals ({attentionRequired.pendingLicenses.length})
                    </span>
                    <Link to="/admin/licenses" style={{ fontSize: '0.78rem', fontWeight: '700', color: '#b45309', textDecoration: 'none' }}>
                      Review All
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {attentionRequired.pendingLicenses.map((lic) => (
                      <div key={lic._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', background: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #feefc3' }}>
                        <div>
                          <strong>{lic.organization?.name || 'Organization'}</strong> ({lic.licenseType || 'License'})
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#b45309' }}>
                          #{lic.licenseNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Users Item */}
              {attentionRequired.pendingUsers && attentionRequired.pendingUsers.length > 0 && (
                <div style={{ padding: '14px', background: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1e40af' }}>
                      👥 Pending Stakeholder Accounts ({attentionRequired.pendingUsers.length})
                    </span>
                    <Link to="/admin/users" style={{ fontSize: '0.78rem', fontWeight: '700', color: '#2563eb', textDecoration: 'none' }}>
                      Manage Users
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {attentionRequired.pendingUsers.map((u) => (
                      <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', background: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #dbeafe' }}>
                        <div>
                          <strong>{u.name}</strong> ({u.email})
                        </div>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recalled/Flagged Batches Item */}
              {attentionRequired.recalledBatches && attentionRequired.recalledBatches.length > 0 && (
                <div style={{ padding: '14px', background: '#fff1f2', borderRadius: 'var(--radius-sm)', border: '1px solid #fecdd3' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#9f1239' }}>
                      🚨 Recalled / Flagged Batches ({attentionRequired.recalledBatches.length})
                    </span>
                    <Link to="/admin/batches" style={{ fontSize: '0.78rem', fontWeight: '700', color: '#e11d48', textDecoration: 'none' }}>
                      Inspect Batches
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {attentionRequired.recalledBatches.map((b) => (
                      <div key={b._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', background: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ffe4e6' }}>
                        <div>
                          Batch <strong>{b.batchNumber}</strong> - {b.product?.name || 'Product'}
                        </div>
                        <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* RECENT AUDIT ACTIVITY */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity style={{ width: '20px', height: '20px', color: '#059669' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
                Recent Audit Activity
              </h2>
            </div>
            <Link to="/admin/audit" style={{ fontSize: '0.82rem', fontWeight: '600', color: '#059669', textDecoration: 'none' }}>
              View Audit Trail →
            </Link>
          </div>

          {recentAuditLogs.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No audit records currently logged in system.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentAuditLogs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase', fontSize: '0.76rem', letterSpacing: '0.02em' }}>
                      {log.action}
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                      {log.details || log.entityType || 'System Log Event'}
                    </div>
                    {log.user && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        Actor: <strong>{log.user.name || log.user.email}</strong> {log.user.role ? `(${log.user.role})` : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
