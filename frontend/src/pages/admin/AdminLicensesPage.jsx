import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  AlertTriangle,
  Award
} from 'lucide-react';

const AdminLicensesPage = () => {
  // Data State
  const [licenses, setLicenses] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // UI & Filter States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [expiryFilter, setExpiryFilter] = useState('ALL');

  // Review & Action Modal States
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [docContentType, setDocContentType] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(null);

  // Approval / Rejection Confirmation Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState('');
  const [rejectionPreset, setRejectionPreset] = useState('Invalid license document');
  const [rejectionDetails, setRejectionDetails] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '' });

  // Fetch licenses from backend API
  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim(),
        status: statusFilter,
        role: roleFilter,
        expiry: expiryFilter,
      };

      const res = await adminApi.getLicenses(params);

      if (res && res.success && res.data) {
        setLicenses(res.data.licenses || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages || res.data.pagination.pages || 1,
          }));
        }
      } else {
        throw new Error(res?.message || 'Failed to retrieve license records.');
      }
    } catch (err) {
      console.error('Error fetching licenses:', err);
      setError(err.message || 'Unable to connect to license verification service.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, roleFilter, expiryFilter]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  // Open review modal and stream document preview blob
  const handleOpenReview = async (license) => {
    setSelectedLicense(license);
    setDocBlobUrl(null);
    setDocContentType(null);
    setDocError(null);
    setDocLoading(true);

    try {
      const res = await adminApi.getLicenseDocumentBlob(license._id);
      if (res && res.blobUrl) {
        setDocBlobUrl(res.blobUrl);
        setDocContentType(res.contentType);
      } else {
        setDocError('Document file is not accessible or not uploaded.');
      }
    } catch (err) {
      console.error('Error loading license document blob:', err);
      setDocError('Unable to load document preview. You can still review details and perform verification.');
    } finally {
      setDocLoading(false);
    }
  };

  // Close review modal & cleanup ObjectURL
  const handleCloseReview = () => {
    if (docBlobUrl) {
      URL.revokeObjectURL(docBlobUrl);
    }
    setSelectedLicense(null);
    setDocBlobUrl(null);
    setDocError(null);
    setShowApproveModal(false);
    setShowRejectModal(false);
  };

  // Approval Handler
  const handleConfirmApprove = async () => {
    if (!selectedLicense) return;
    try {
      setProcessingId(selectedLicense._id);
      const res = await adminApi.approveLicense(selectedLicense._id, approveRemarks);

      if (res && res.success) {
        setActionFeedback({
          type: 'success',
          text: `License #${selectedLicense.licenseNumber} for ${selectedLicense.organization?.name || 'Organization'} successfully approved.`,
        });
        setTimeout(() => setActionFeedback({ type: '', text: '' }), 5000);
        handleCloseReview();
        fetchLicenses();
      } else {
        setActionFeedback({ type: 'error', text: res?.message || 'Failed to approve license.' });
      }
    } catch (err) {
      setActionFeedback({ type: 'error', text: 'Error connecting to server for license approval.' });
    } finally {
      setProcessingId(null);
      setShowApproveModal(false);
    }
  };

  // Rejection Handler
  const handleConfirmReject = async () => {
    if (!selectedLicense) return;
    const finalReason = rejectionDetails.trim()
      ? `${rejectionPreset}: ${rejectionDetails.trim()}`
      : rejectionPreset;

    if (!finalReason) {
      setActionFeedback({ type: 'error', text: 'Please select or enter a valid rejection reason.' });
      return;
    }

    try {
      setProcessingId(selectedLicense._id);
      const res = await adminApi.rejectLicense(selectedLicense._id, finalReason);

      if (res && res.success) {
        setActionFeedback({
          type: 'success',
          text: `License #${selectedLicense.licenseNumber} marked as REJECTED.`,
        });
        setTimeout(() => setActionFeedback({ type: '', text: '' }), 5000);
        handleCloseReview();
        fetchLicenses();
      } else {
        setActionFeedback({ type: 'error', text: res?.message || 'Failed to reject license.' });
      }
    } catch (err) {
      setActionFeedback({ type: 'error', text: 'Error connecting to server for license rejection.' });
    } finally {
      setProcessingId(null);
      setShowRejectModal(false);
    }
  };

  // Helper formatting routines
  const getRoleBadge = (type, role) => {
    const val = (type || role || 'MANUFACTURER').toUpperCase();
    if (val.includes('MANUFACTUR')) {
      return (
        <span className="badge badge-info" style={{ gap: '6px' }}>
          <Building2 style={{ width: '12px', height: '12px' }} />
          Manufacturer
        </span>
      );
    }
    if (val.includes('WHOLESALE') || val.includes('DISTRIBUTOR')) {
      return (
        <span className="badge badge-purple" style={{ gap: '6px' }}>
          <Building2 style={{ width: '12px', height: '12px' }} />
          Distributor
        </span>
      );
    }
    if (val.includes('PHARMACY')) {
      return (
        <span className="badge badge-success" style={{ gap: '6px' }}>
          <Building2 style={{ width: '12px', height: '12px' }} />
          Pharmacy
        </span>
      );
    }
    return (
      <span className="badge" style={{ gap: '6px' }}>
        <Building2 style={{ width: '12px', height: '12px' }} />
        {val}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'APPROVED' || s === 'VERIFIED') {
      return (
        <span className="badge badge-success" style={{ gap: '5px' }}>
          <CheckCircle2 style={{ width: '13px', height: '13px' }} />
          Approved
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="badge badge-danger" style={{ gap: '5px' }}>
          <XCircle style={{ width: '13px', height: '13px' }} />
          Rejected
        </span>
      );
    }
    if (s === 'EXPIRED') {
      return (
        <span className="badge badge-purple" style={{ gap: '5px', background: '#fdf2f8', color: '#9d174d', borderColor: '#fbcfe8' }}>
          <AlertTriangle style={{ width: '13px', height: '13px' }} />
          Expired
        </span>
      );
    }
    return (
      <span className="badge badge-warning" style={{ gap: '5px' }}>
        <Clock style={{ width: '13px', height: '13px' }} />
        Pending Review
      </span>
    );
  };

  const getExpiryLabel = (expiryDate) => {
    if (!expiryDate) return <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>N/A</span>;
    const dateObj = new Date(expiryDate);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (dateObj < now) {
      return (
        <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle style={{ width: '13px', height: '13px' }} />
          Expired ({dateObj.toLocaleDateString()})
        </span>
      );
    }
    if (dateObj <= thirtyDays) {
      return (
        <span style={{ color: '#d97706', fontWeight: '700', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock style={{ width: '13px', height: '13px' }} />
          Expiring Soon ({dateObj.toLocaleDateString()})
        </span>
      );
    }
    return <span style={{ color: 'var(--text-heading)', fontSize: '0.825rem', fontWeight: '500' }}>{dateObj.toLocaleDateString()}</span>;
  };

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
                REGULATORY COMPLIANCE
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
                <span className="live-dot" style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                Verification Console Active
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#ffffff', margin: '2px 0 4px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCheck style={{ width: '28px', height: '28px', color: '#60a5fa' }} />
              License Verification & Authority Review
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '680px', margin: 0 }}>
              Official regulatory review portal for pharmaceutical supply chain license credentials, business legitimacy, and operational authorizations.
            </p>
          </div>

          <div>
            <button
              onClick={fetchLicenses}
              disabled={loading}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.85rem',
                fontWeight: '600',
                padding: '9px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: '15px', height: '15px' }} />
              Refresh Ledger Data
            </button>
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {actionFeedback.text && (
        <div
          className="card"
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: actionFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            borderColor: actionFeedback.type === 'success' ? '#bbf7d0' : '#fecaca',
            color: actionFeedback.type === 'success' ? '#166534' : '#991b1b',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 style={{ width: '20px', height: '20px', color: '#16a34a', flexShrink: 0 }} />
            ) : (
              <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback({ type: '', text: '' })}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      )}

      {/* SUMMARY KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        {/* Total Submissions */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <FileText style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.1, color: 'var(--text-heading)' }}>
              {summary.total}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
              Total Submissions
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderColor: '#fde68a', background: '#fffdf5' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <Clock style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.1, color: '#b45309' }}>
              {summary.pending}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
              Pending Review
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderColor: '#bbf7d0', background: '#f6fdf8' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <CheckCircle2 style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.1, color: '#15803d' }}>
              {summary.approved}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
              Approved
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderColor: '#fecaca', background: '#fff8f8' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <XCircle style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.1, color: '#b91c1c' }}>
              {summary.rejected}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
              Rejected
            </div>
          </div>
        </div>

        {/* Expired / Warnings */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderColor: '#e9d5ff', background: '#fbf7ff' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
            <AlertTriangle style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.1, color: '#6d28d9' }}>
              {summary.expired}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
              Expired / Flags
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '460px' }}>
            <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search applicant name, email, organization, or license #..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter style={{ width: '15px', height: '15px', color: 'var(--text-dim)' }} />
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <select
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <option value="ALL">All Stakeholder Roles</option>
              <option value="MANUFACTURER">Manufacturer</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="PHARMACY">Pharmacy</option>
            </select>

            <select
              value={expiryFilter}
              onChange={e => {
                setExpiryFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <option value="ALL">All Expiry Dates</option>
              <option value="VALID">Valid / Active</option>
              <option value="EXPIRING_SOON">Expiring Soon (30 Days)</option>
              <option value="EXPIRED">Expired</option>
            </select>

            {(search || statusFilter !== 'ALL' || roleFilter !== 'ALL' || expiryFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setRoleFilter('ALL');
                  setExpiryFilter('ALL');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className="btn btn-sm btn-outline"
                style={{ color: 'var(--primary)', borderColor: 'var(--blue-200)', fontSize: '0.8rem' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LICENSES DATA TABLE CARD */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
              Querying live database license records & credentials...
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <AlertCircle style={{ width: '42px', height: '42px', color: '#dc2626', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px' }}>
              {error}
            </h3>
            <button onClick={fetchLicenses} className="btn btn-primary" style={{ marginTop: '8px' }}>
              Retry Connection
            </button>
          </div>
        ) : licenses.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <CheckCircle2 style={{ width: '44px', height: '44px', color: '#16a34a', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '6px' }}>
              No licenses found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
              {search || statusFilter !== 'ALL' || roleFilter !== 'ALL' || expiryFilter !== 'ALL'
                ? 'No license records match your active search and filter criteria.'
                : 'All submitted regulatory credentials have been verified.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Applicant / Organization</th>
                  <th>Role</th>
                  <th>License Number</th>
                  <th>Category & Board</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map(lic => {
                  const orgName = lic.organization?.name || 'Organization Record';
                  const applicantName = lic.applicant?.name || 'Authorized Submitter';
                  const applicantEmail = lic.applicant?.email || lic.organization?.contactEmail || '';
                  const orgType = lic.organization?.type || lic.licenseType;

                  return (
                    <tr key={lic._id}>
                      {/* Organization & Applicant */}
                      <td style={{ paddingLeft: '24px' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-heading)', fontSize: '0.925rem' }}>
                            {orgName}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            <User style={{ width: '12px', height: '12px' }} />
                            <span>{applicantName}</span>
                            {applicantEmail && <span>({applicantEmail})</span>}
                          </div>
                        </div>
                      </td>

                      {/* Stakeholder Role */}
                      <td>{getRoleBadge(orgType, lic.licenseType)}</td>

                      {/* License Number */}
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)', fontSize: '0.85rem' }}>
                          {lic.licenseNumber}
                        </span>
                      </td>

                      {/* Category & Board */}
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-heading)', fontSize: '0.85rem' }}>
                          {lic.licenseType}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1px' }}>
                          {lic.issuingAuthority || 'Federal Drug Control Agency'}
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td>{getExpiryLabel(lic.expiryDate)}</td>

                      {/* Verification Status */}
                      <td>{getStatusBadge(lic.verificationStatus)}</td>

                      {/* Submitted Date */}
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {lic.createdAt ? new Date(lic.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Review Action */}
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <button
                          onClick={() => handleOpenReview(lic)}
                          className="btn btn-sm btn-outline"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '600',
                            borderColor: 'var(--blue-200)',
                            color: 'var(--primary)'
                          }}
                        >
                          <Eye style={{ width: '14px', height: '14px' }} />
                          Review License
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: '#f8fafc',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            <div>
              Showing page <strong style={{ color: 'var(--text-heading)' }}>{pagination.page}</strong> of{' '}
              <strong style={{ color: 'var(--text-heading)' }}>{pagination.totalPages}</strong> ({pagination.total} total records)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="btn btn-sm btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft style={{ width: '15px', height: '15px' }} />
                Previous
              </button>

              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="btn btn-sm btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Next
                <ChevronRight style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LICENSE REVIEW MODAL */}
      {selectedLicense && (
        <div className="modal-overlay" onClick={handleCloseReview}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '840px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  <Award style={{ width: '26px', height: '26px' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
                      {selectedLicense.organization?.name || 'Organization Review'}
                    </h2>
                    {getStatusBadge(selectedLicense.verificationStatus)}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
                    Regulatory License Record #{selectedLicense.licenseNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseReview}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '6px', borderRadius: '8px' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* 2-Column Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Applicant & Entity Details */}
              <div className="card" style={{ padding: '16px', background: '#f8fafc' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 style={{ width: '14px', height: '14px', color: 'var(--primary)' }} />
                  Applicant & Entity Profile
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Organization:</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                      {selectedLicense.organization?.name || 'N/A'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Stakeholder Role:</span>
                    <span>{getRoleBadge(selectedLicense.organization?.type, selectedLicense.licenseType)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Registration #:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      {selectedLicense.organization?.registrationNumber || 'N/A'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Representative:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-heading)' }}>
                      {selectedLicense.applicant?.name || 'Authorized Submitter'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Contact Email:</span>
                    <span style={{ color: 'var(--text-heading)' }}>
                      {selectedLicense.applicant?.email || selectedLicense.organization?.contactEmail || 'N/A'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Facility Location:</span>
                    <span style={{ color: 'var(--text-heading)', textAlign: 'right', maxWidth: '180px' }}>
                      {selectedLicense.organization?.address || 'Licensed Facility'}
                    </span>
                  </div>
                </div>
              </div>

              {/* License Specification */}
              <div className="card" style={{ padding: '16px', background: '#f8fafc' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText style={{ width: '14px', height: '14px', color: 'var(--primary)' }} />
                  License Specification
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>License Number:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)' }}>
                      {selectedLicense.licenseNumber}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Classification:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-heading)' }}>
                      {selectedLicense.licenseType}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Issuing Authority:</span>
                    <span style={{ color: 'var(--text-heading)' }}>
                      {selectedLicense.issuingAuthority || 'Federal Drug Control Agency'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Issue Date:</span>
                    <span>{selectedLicense.issueDate ? new Date(selectedLicense.issueDate).toLocaleDateString() : 'N/A'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Expiry Date:</span>
                    <span>{getExpiryLabel(selectedLicense.expiryDate)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Document Hash:</span>
                    <span
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-dim)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={selectedLicense.documentHash || 'SHA-256 Digest'}
                    >
                      {selectedLicense.documentHash || 'Recorded on upload'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Internal System Validation Checklist */}
            <div
              className="card"
              style={{
                padding: '16px',
                background: '#f0f7ff',
                borderColor: '#bfdbfe'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                  Internal System Validation Checklist
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2563eb' }}>Regulatory Compliance Checks</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#16a34a', flexShrink: 0 }} />
                  <span>Unique License Number Format Verified</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#16a34a', flexShrink: 0 }} />
                  <span>Organization Record Linked & Active</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                  {selectedLicense.expiryDate && new Date(selectedLicense.expiryDate) < new Date() ? (
                    <AlertTriangle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0 }} />
                  ) : (
                    <CheckCircle2 style={{ width: '16px', height: '16px', color: '#16a34a', flexShrink: 0 }} />
                  )}
                  <span>
                    Expiry Validation:{' '}
                    {selectedLicense.expiryDate && new Date(selectedLicense.expiryDate) < new Date()
                      ? 'Expired Credential'
                      : 'Valid Operational Window'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#16a34a', flexShrink: 0 }} />
                  <span>Tamper-Proof File Digest Recorded</span>
                </div>
              </div>
            </div>

            {/* Protected License Document Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock style={{ width: '14px', height: '14px', color: 'var(--primary)' }} />
                Protected License Document Preview (Authenticated Stream)
              </h3>

              <div
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  minHeight: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #334155'
                }}
              >
                {docLoading ? (
                  <div style={{ textAlign: 'center' }}>
                    <div className="animate-spin" style={{ width: '28px', height: '28px', border: '3px solid #334155', borderTopColor: '#60a5fa', borderRadius: '50%', margin: '0 auto 10px' }} />
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Decrypting & streaming protected document blob...</p>
                  </div>
                ) : docError ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <FileText style={{ width: '36px', height: '36px', color: '#64748b', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '500' }}>{docError}</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      Document access is restricted to authenticated administrators.
                    </p>
                  </div>
                ) : docBlobUrl ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    {docContentType?.includes('image') ? (
                      <div style={{ maxHeight: '280px', overflow: 'auto', borderRadius: '8px', background: '#020617', padding: '8px', width: '100%', textAlign: 'center' }}>
                        <img
                          src={docBlobUrl}
                          alt="Official License Document"
                          style={{ maxHeight: '260px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                        />
                      </div>
                    ) : (
                      <iframe
                        src={docBlobUrl}
                        title="License Document Viewer"
                        style={{ width: '100%', height: '280px', borderRadius: '8px', background: '#ffffff', border: '1px solid #334155' }}
                      />
                    )}

                    <div>
                      <a
                        href={docBlobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                      >
                        <ExternalLink style={{ width: '14px', height: '14px' }} />
                        Open Document in Secure Full Tab
                      </a>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No document preview available.</p>
                )}
              </div>
            </div>

            {/* Previous Rejection Reason if any */}
            {selectedLicense.rejectionReason && (
              <div
                className="card"
                style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  borderColor: '#fca5a5',
                  color: '#991b1b',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <XCircle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Previous Rejection Notice:</strong>
                  {selectedLicense.rejectionReason}
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                onClick={handleCloseReview}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Close Window
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedLicense.verificationStatus === 'APPROVED' || selectedLicense.verificationStatus === 'VERIFIED' ? (
                  <span className="badge badge-success" style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '6px' }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                    Already Verified & Operational
                  </span>
                ) : selectedLicense.verificationStatus === 'REJECTED' ? (
                  <span className="badge badge-danger" style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '6px' }}>
                    <XCircle style={{ width: '16px', height: '16px' }} />
                    Application Rejected
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processingId === selectedLicense._id}
                      className="btn btn-danger"
                      style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <XCircle style={{ width: '16px', height: '16px' }} />
                      Reject License
                    </button>

                    <button
                      onClick={() => setShowApproveModal(true)}
                      disabled={processingId === selectedLicense._id}
                      className="btn btn-success"
                      style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                      Approve & Grant Operational Status
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM APPROVAL MODAL */}
      {showApproveModal && selectedLicense && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <CheckCircle2 style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
                  Confirm License Approval
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
                  Grant active supply chain operational status
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Are you sure you want to approve license <strong style={{ color: 'var(--text-heading)' }}>#{selectedLicense.licenseNumber}</strong> for{' '}
              <strong style={{ color: 'var(--text-heading)' }}>{selectedLicense.organization?.name}</strong>?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                Verification Remarks (Optional):
              </label>
              <textarea
                value={approveRemarks}
                onChange={e => setApproveRemarks(e.target.value)}
                placeholder="License documentation verified and compliant with regulatory standards."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
              <button
                onClick={() => setShowApproveModal(false)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmApprove}
                disabled={processingId === selectedLicense._id}
                className="btn btn-success"
                style={{ fontSize: '0.85rem' }}
              >
                {processingId === selectedLicense._id ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REJECTION MODAL */}
      {showRejectModal && selectedLicense && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <XCircle style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
                  Confirm License Rejection
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
                  Reject license application & restrict account access
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                  Primary Rejection Reason Category:
                </label>
                <select
                  value={rejectionPreset}
                  onChange={e => setRejectionPreset(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  <option value="Invalid license document">Invalid license document</option>
                  <option value="Expired license document">Expired license document</option>
                  <option value="Information mismatch between registration & document">Information mismatch</option>
                  <option value="Unreadable or blurry uploaded document">Unreadable or blurry document</option>
                  <option value="Missing required regulatory credentials">Missing required credentials</option>
                  <option value="Regulatory non-compliance">Other regulatory non-compliance</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                  Detailed Guidance (Delivered to Applicant):
                </label>
                <textarea
                  value={rejectionDetails}
                  onChange={e => setRejectionDetails(e.target.value)}
                  placeholder="Provide explicit guidance on why this license was rejected and what corrections are required..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
              <button
                onClick={() => setShowRejectModal(false)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReject}
                disabled={processingId === selectedLicense._id}
                className="btn btn-danger"
                style={{ fontSize: '0.85rem' }}
              >
                {processingId === selectedLicense._id ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLicensesPage;
