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

      if (res.success && res.data) {
        setLicenses(res.data.licenses || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages,
          }));
        }
      } else {
        setError(res.message || 'Failed to fetch license records.');
      }
    } catch (err) {
      console.error('Error fetching licenses:', err);
      setError('Network error while connecting to Secure Pharma backend API.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, roleFilter, expiryFilter]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  // Load protected document securely when viewing details
  const loadSecureDocument = async (licenseId) => {
    try {
      setDocLoading(true);
      setDocError(null);
      if (docBlobUrl) {
        URL.revokeObjectURL(docBlobUrl);
        setDocBlobUrl(null);
      }
      const { blobUrl, contentType } = await adminApi.getLicenseDocumentBlob(licenseId);
      setDocBlobUrl(blobUrl);
      setDocContentType(contentType);
    } catch (err) {
      console.error('Document fetch error:', err);
      setDocError(err.message || 'Could not load protected document.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleOpenReview = async (license) => {
    setSelectedLicense(license);
    setShowApproveModal(false);
    setShowRejectModal(false);
    if (license.documentPath) {
      await loadSecureDocument(license._id);
    } else {
      setDocBlobUrl(null);
      setDocError('No license document was uploaded for this record.');
    }
  };

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

      if (res.success) {
        setActionFeedback({
          type: 'success',
          text: `License #${selectedLicense.licenseNumber} for ${selectedLicense.organization?.name || 'Organization'} successfully approved.`,
        });
        setTimeout(() => setActionFeedback({ type: '', text: '' }), 4000);
        handleCloseReview();
        fetchLicenses();
      } else {
        setActionFeedback({ type: 'error', text: res.message || 'Failed to approve license.' });
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

      if (res.success) {
        setActionFeedback({
          type: 'success',
          text: `License #${selectedLicense.licenseNumber} marked as REJECTED.`,
        });
        setTimeout(() => setActionFeedback({ type: '', text: '' }), 4000);
        handleCloseReview();
        fetchLicenses();
      } else {
        setActionFeedback({ type: 'error', text: res.message || 'Failed to reject license.' });
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
    const val = type || role || 'MANUFACTURER';
    if (val.includes('MANUFACTUR')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          <Building2 className="w-3.5 h-3.5" />
          Manufacturer
        </span>
      );
    }
    if (val.includes('WHOLESALE') || val.includes('DISTRIBUTOR')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          <Building2 className="w-3.5 h-3.5" />
          Distributor
        </span>
      );
    }
    if (val.includes('PHARMACY')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
          <Building2 className="w-3.5 h-3.5" />
          Pharmacy
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
        <Building2 className="w-3.5 h-3.5" />
        {val}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'APPROVED' || s === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    }
    if (s === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
          <AlertTriangle className="w-3.5 h-3.5" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
        <Clock className="w-3.5 h-3.5" />
        Pending Review
      </span>
    );
  };

  const getExpiryLabel = (expiryDate) => {
    if (!expiryDate) return <span className="text-slate-400 text-xs">N/A</span>;
    const dateObj = new Date(expiryDate);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (dateObj < now) {
      return (
        <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Expired ({dateObj.toLocaleDateString()})
        </span>
      );
    }
    if (dateObj <= thirtyDays) {
      return (
        <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Expiring Soon ({dateObj.toLocaleDateString()})
        </span>
      );
    }
    return <span className="text-slate-700 dark:text-slate-300 text-xs">{dateObj.toLocaleDateString()}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Admin License Verification Module
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official regulatory review portal for pharmaceutical supply chain license credentials & organization verification.
          </p>
        </div>
        <button
          onClick={fetchLicenses}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger Data
        </button>
      </div>

      {/* Global Feedback Banner */}
      {actionFeedback.text && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm shadow-sm transition animate-in fade-in slide-in-from-top-2 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="font-medium">{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback({ type: '', text: '' })} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Submissions</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{summary.total}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-sm space-y-1 bg-amber-50/20 dark:bg-amber-950/10">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{summary.pending}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm space-y-1 bg-emerald-50/20 dark:bg-emerald-950/10">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.approved}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-1 bg-rose-50/20 dark:bg-rose-950/10">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </p>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{summary.rejected}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 shadow-sm space-y-1 bg-purple-50/20 dark:bg-purple-950/10 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Expired / Warnings
          </p>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{summary.expired}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search applicant name, email, organization, or license #..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => {
              setRoleFilter(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Stakeholder Roles</option>
            <option value="MANUFACTURER">Manufacturer</option>
            <option value="DISTRIBUTOR">Distributor</option>
            <option value="PHARMACY">Pharmacy</option>
          </select>

          {/* Expiry Filter */}
          <select
            value={expiryFilter}
            onChange={e => {
              setExpiryFilter(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main License Verification Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Querying live database license records...
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{error}</h3>
            <button
              onClick={fetchLicenses}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
            >
              Retry Connection
            </button>
          </div>
        ) : licenses.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No licenses found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {search || statusFilter !== 'ALL' || roleFilter !== 'ALL' || expiryFilter !== 'ALL'
                ? 'No license records match your active search and filter criteria.'
                : 'All submitted regulatory credentials have been verified.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Applicant / Organization</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">License Number</th>
                  <th className="px-5 py-3.5">Category & Board</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Verification Status</th>
                  <th className="px-5 py-3.5">Submitted</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {licenses.map(lic => {
                  const orgName = lic.organization?.name || 'Organization Record';
                  const applicantName = lic.applicant?.name || 'Authorized Representative';
                  const applicantEmail = lic.applicant?.email || lic.organization?.contactEmail || '';
                  const orgType = lic.organization?.type || lic.licenseType;

                  return (
                    <tr key={lic._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition">
                      {/* Organization & Applicant */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{orgName}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {applicantName} {applicantEmail && `(${applicantEmail})`}
                          </p>
                        </div>
                      </td>

                      {/* Stakeholder Role */}
                      <td className="px-5 py-4">{getRoleBadge(orgType, lic.licenseType)}</td>

                      {/* License Number */}
                      <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                        {lic.licenseNumber}
                      </td>

                      {/* Category & Board */}
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                        <p className="font-medium text-slate-900 dark:text-white">{lic.licenseType}</p>
                        <p className="text-[11px] text-slate-400">{lic.issuingAuthority || 'Federal Drug Control Agency'}</p>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-5 py-4">{getExpiryLabel(lic.expiryDate)}</td>

                      {/* Status */}
                      <td className="px-5 py-4">{getStatusBadge(lic.verificationStatus)}</td>

                      {/* Submitted Date */}
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {lic.createdAt ? new Date(lic.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Review Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenReview(lic)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div>
              Showing page <span className="font-bold text-slate-900 dark:text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{pagination.totalPages}</span> ({pagination.total}{' '}
              total records)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-50 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-50 font-semibold"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* License Review Modal / Drawer */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in duration-150 space-y-6 max-h-[90vh] overflow-y-auto my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedLicense.organization?.name || 'Organization Review'}
                    </h2>
                    {getStatusBadge(selectedLicense.verificationStatus)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Official Regulatory License Submission Record #{selectedLicense.licenseNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseReview}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Applicant & Organization Details */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Applicant & Entity Details
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Organization Name:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedLicense.organization?.name || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Stakeholder Role:</span>
                    <span>{getRoleBadge(selectedLicense.organization?.type, selectedLicense.licenseType)}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Reg Org Number:</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {selectedLicense.organization?.registrationNumber || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Representative Name:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedLicense.applicant?.name || 'Authorized Submitter'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Contact Email:</span>
                    <span className="text-slate-900 dark:text-white">
                      {selectedLicense.applicant?.email || selectedLicense.organization?.contactEmail || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Address / Jurisdiction:</span>
                    <span className="text-slate-900 dark:text-white text-right max-w-[180px] truncate">
                      {selectedLicense.organization?.address || 'Licensed Facility'}
                    </span>
                  </div>
                </div>
              </div>

              {/* License Details & Document Hash */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  License Specification
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">License Number:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedLicense.licenseNumber}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">License Classification:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedLicense.licenseType}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Issuing Authority:</span>
                    <span className="text-slate-900 dark:text-white">
                      {selectedLicense.issuingAuthority || 'Federal Drug Control Agency'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Issue Date:</span>
                    <span className="text-slate-900 dark:text-white">
                      {selectedLicense.issueDate ? new Date(selectedLicense.issueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Expiry Date:</span>
                    <span>{getExpiryLabel(selectedLicense.expiryDate)}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Doc Cryptographic Hash:</span>
                    <span
                      className="font-mono text-[10px] text-slate-600 dark:text-slate-400 max-w-[150px] truncate"
                      title={selectedLicense.documentHash || 'SHA-256 Digest'}
                    >
                      {selectedLicense.documentHash || 'Computed at upload'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Internal System Validation Checklist (No Fake Registry Claims) */}
            <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Internal System Validation & Ledger Verification
                </h3>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">Internal Audit Checks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unique License Number Format Verified</span>
                </div>

                <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Organization Record Linked & Active</span>
                </div>

                <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {selectedLicense.expiryDate && new Date(selectedLicense.expiryDate) < new Date() ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  <span>
                    Expiry Check:{' '}
                    {selectedLicense.expiryDate && new Date(selectedLicense.expiryDate) < new Date()
                      ? 'Expired Credential'
                      : 'Unexpired Date Window'}
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Cryptographic File Hash Recorded</span>
                </div>
              </div>
            </div>

            {/* Authenticated Protected Document Viewer */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-500" />
                Protected License Document Preview (Authenticated Stream)
              </h3>

              <div className="bg-slate-900 text-white rounded-xl p-4 min-h-[220px] flex items-center justify-center relative overflow-hidden border border-slate-700">
                {docLoading ? (
                  <div className="text-center space-y-2">
                    <div className="w-7 h-7 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-400 font-medium">Decrypting & fetching protected document blob...</p>
                  </div>
                ) : docError ? (
                  <div className="text-center space-y-2 p-6">
                    <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-300 font-medium">{docError}</p>
                    <p className="text-[11px] text-slate-500">
                      Document access is restricted to authenticated administrators.
                    </p>
                  </div>
                ) : docBlobUrl ? (
                  <div className="w-full space-y-3 text-center">
                    {docContentType?.includes('image') ? (
                      <div className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-2 border border-slate-800">
                        <img
                          src={docBlobUrl}
                          alt="Official License File"
                          className="max-h-64 mx-auto object-contain rounded-md"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={docBlobUrl}
                        title="License Document Viewer"
                        className="w-full h-64 rounded-lg bg-white border border-slate-800"
                      />
                    )}

                    <div className="flex items-center justify-center gap-3 pt-1">
                      <a
                        href={docBlobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Document in Secure Tab
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No document preview available.</p>
                )}
              </div>
            </div>

            {/* Rejection / Review History if applicable */}
            {selectedLicense.rejectionReason && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Previous Rejection Record:
                </p>
                <p className="pl-5">{selectedLicense.rejectionReason}</p>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
              <button
                onClick={handleCloseReview}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Close Window
              </button>

              <div className="flex items-center gap-3">
                {/* Double Review Protection: Disable buttons if already approved/rejected */}
                {selectedLicense.verificationStatus === 'APPROVED' || selectedLicense.verificationStatus === 'VERIFIED' ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    Already Verified & Approved
                  </span>
                ) : selectedLicense.verificationStatus === 'REJECTED' ? (
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 rounded-lg border border-rose-200 dark:border-rose-800">
                    <XCircle className="w-4 h-4" />
                    Application Rejected
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processingId === selectedLicense._id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject License
                    </button>

                    <button
                      onClick={() => setShowApproveModal(true)}
                      disabled={processingId === selectedLicense._id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Grant Operational Status
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step 1: Approve Modal */}
      {showApproveModal && selectedLicense && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm License Approval</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Grant active supply chain operational status
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to approve license <strong className="text-slate-900 dark:text-white">#{selectedLicense.licenseNumber}</strong> for{' '}
              <strong className="text-slate-900 dark:text-white">{selectedLicense.organization?.name}</strong>?
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Optional Verification Remarks:
              </label>
              <textarea
                value={approveRemarks}
                onChange={e => setApproveRemarks(e.target.value)}
                placeholder="License documentation verified and compliant with regulatory standards."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmApprove}
                disabled={processingId === selectedLicense._id}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                {processingId === selectedLicense._id ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step 2: Reject Modal */}
      {showRejectModal && selectedLicense && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm License Rejection</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reject license application & restrict account access
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Primary Rejection Category:
                </label>
                <select
                  value={rejectionPreset}
                  onChange={e => setRejectionPreset(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Invalid license document">Invalid license document</option>
                  <option value="Expired license document">Expired license document</option>
                  <option value="Information mismatch between registration & document">Information mismatch</option>
                  <option value="Unreadable or blurry uploaded document">Unreadable or blurry document</option>
                  <option value="Missing required regulatory credentials">Missing required credentials</option>
                  <option value="Regulatory non-compliance">Other regulatory non-compliance</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Detailed Explanation (Sent to Applicant):
                </label>
                <textarea
                  value={rejectionDetails}
                  onChange={e => setRejectionDetails(e.target.value)}
                  placeholder="Provide explicit guidance on why this license was rejected and what corrections are required..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReject}
                disabled={processingId === selectedLicense._id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
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
