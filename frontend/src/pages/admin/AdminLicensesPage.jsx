import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';

const AdminLicensesPage = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '' });
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPendingLicenses();
      setLicenses(res.data?.licenses || res.data || []);
    } catch (err) {
      console.error('Error fetching licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (licenseId) => {
    try {
      setProcessingId(licenseId);
      if (adminApi.verifyLicense) {
        await adminApi.verifyLicense(licenseId, { status: 'APPROVED' });
      }
      setLicenses(licenses.map(lic => lic._id === licenseId ? { ...lic, status: 'APPROVED' } : lic));
      setActionFeedback({ type: 'success', text: 'License successfully approved and verified.' });
      setTimeout(() => setActionFeedback({ type: '', text: '' }), 3500);
      setSelectedLicense(null);
    } catch (err) {
      console.error('Error approving license:', err);
      setActionFeedback({ type: 'error', text: 'Failed to approve license.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (licenseId) => {
    try {
      setProcessingId(licenseId);
      if (adminApi.verifyLicense) {
        await adminApi.verifyLicense(licenseId, { status: 'REJECTED' });
      }
      setLicenses(licenses.map(lic => lic._id === licenseId ? { ...lic, status: 'REJECTED' } : lic));
      setActionFeedback({ type: 'success', text: 'License application marked as rejected.' });
      setTimeout(() => setActionFeedback({ type: '', text: '' }), 3500);
      setSelectedLicense(null);
    } catch (err) {
      console.error('Error rejecting license:', err);
      setActionFeedback({ type: 'error', text: 'Failed to reject license.' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredLicenses = licenses.filter(lic => {
    const org = lic.organization?.name || lic.organizationName || '';
    const num = lic.licenseNumber || '';
    const type = lic.licenseType || '';

    const matchesSearch =
      org.toLowerCase().includes(search.toLowerCase()) ||
      num.toLowerCase().includes(search.toLowerCase()) ||
      type.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      lic.status?.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <FileCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          Regulatory License Verification Queue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review state and federal pharmaceutical licensing documentation for all supply chain participants
        </p>
      </div>

      {actionFeedback.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {actionFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search organization or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="ALL">All License Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved / Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading licenses...</p>
          </div>
        ) : filteredLicenses.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-900 dark:text-white">No licenses in queue</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              All submitted regulatory credentials have been processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Organization</th>
                  <th className="px-5 py-3.5">License Number</th>
                  <th className="px-5 py-3.5">Type & Jurisdiction</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLicenses.map((lic) => (
                  <tr key={lic._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition">
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{lic.organization?.name || lic.organizationName || 'Stakeholder Org'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {lic.licenseNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{lic.licenseType || 'Pharmaceutical'}</p>
                        <p className="text-xs text-slate-400">{lic.issuingAuthority || 'State Board of Pharmacy'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {lic.expiryDate ? new Date(lic.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        lic.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : lic.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {lic.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedLicense(lic)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold transition"
                        >
                          View Details
                        </button>

                        {lic.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleApprove(lic._id)}
                            disabled={processingId === lic._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}

                        {lic.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleReject(lic._id)}
                            disabled={processingId === lic._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
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

      {/* Details / Document Preview Modal */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in duration-150 space-y-5">
            <button
              onClick={() => setSelectedLicense(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedLicense.organization?.name || selectedLicense.organizationName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  License #{selectedLicense.licenseNumber}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">License Category:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedLicense.licenseType || 'General Pharma'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issuing Board:</span>
                <span>{selectedLicense.issuingAuthority || 'FDA / State Board'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issued Date:</span>
                <span>{selectedLicense.issueDate ? new Date(selectedLicense.issueDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expiration Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedLicense.expiryDate ? new Date(selectedLicense.expiryDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold uppercase">{selectedLicense.status || 'PENDING'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedLicense(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                onClick={() => handleReject(selectedLicense._id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Reject License
              </button>
              <button
                onClick={() => handleApprove(selectedLicense._id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Approve & Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLicensesPage;
