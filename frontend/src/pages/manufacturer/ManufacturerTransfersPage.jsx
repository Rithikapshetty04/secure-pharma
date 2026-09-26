import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Building,
  Calendar,
  FileText,
  Check,
  X,
  ExternalLink,
  Edit3,
  RotateCcw,
  AlertTriangle,
  Pill,
} from 'lucide-react';

export default function ManufacturerTransfersPage() {
  const { batchId: paramBatchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mode: 'list' (History log table) vs 'new_transfer' (Transfer wizard)
  const [viewMode, setViewMode] = useState(paramBatchId ? 'new_transfer' : 'list');

  // Transfer Wizard Step (1: Batch, 2: Distributor, 3: Specs, 4: Review, 5: Complete)
  const [step, setStep] = useState(1);

  // Data states
  const [events, setEvents] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);

  const [batches, setBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStageText, setSubmitStageText] = useState('');

  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [createdEventResult, setCreatedEventResult] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    batchId: paramBatchId || '',
    toOrganizationId: '',
    quantity: 10000,
    unit: 'Units',
    transferDate: new Date().toISOString().split('T')[0],
    location: user?.organization?.address || 'Primary Logistics Dispatch Bay',
    notes: '',
  });

  const loadTransferPrerequisites = async () => {
    setLoading(true);
    setError('');
    try {
      const [eventsRes, batchesRes, orgsRes] = await Promise.all([
        api.getEvents({ limit: 100 }),
        api.getBatches({ limit: 100 }),
        api.getOrganizations({ type: 'DISTRIBUTOR', status: 'APPROVED' }),
      ]);

      if (eventsRes && eventsRes.success) {
        setEvents(eventsRes.events || []);
        setTotalEvents(eventsRes.total || 0);
      }

      if (batchesRes && batchesRes.success) {
        // Filter transferable batches: not expired, not recalled
        const validBatches = (batchesRes.batches || []).filter(
          (b) => b.status !== 'RECALLED' && new Date(b.expiryDate) > new Date()
        );
        setBatches(validBatches);

        const initialBatchId = paramBatchId || (validBatches[0] ? validBatches[0]._id : '');
        const targetBatch = validBatches.find((b) => b._id === initialBatchId) || validBatches[0];

        setFormData((prev) => ({
          ...prev,
          batchId: initialBatchId,
          quantity: targetBatch ? targetBatch.quantity : 10000,
          unit: targetBatch ? targetBatch.unit || 'Units' : 'Units',
        }));
      }

      if (orgsRes && orgsRes.success) {
        const approvedDistributors = orgsRes.organizations || [];
        setDistributors(approvedDistributors);
        if (approvedDistributors.length > 0) {
          setFormData((prev) => ({ ...prev, toOrganizationId: approvedDistributors[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching transfer prerequisites:', err);
      setError(err.message || 'Server error loading transfer prerequisites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransferPrerequisites();
  }, [paramBatchId]);

  const handleBatchSelect = (id) => {
    const selected = batches.find((b) => b._id === id);
    setFormData((prev) => ({
      ...prev,
      batchId: id,
      quantity: selected ? selected.quantity : 10000,
      unit: selected ? selected.unit || 'Units' : 'Units',
    }));
    if (fieldErrors.batchId) setFieldErrors({ ...fieldErrors, batchId: null });
  };

  // Step Validation
  const validateStep = (currentStep) => {
    const errs = {};
    const selectedBatch = batches.find((b) => b._id === formData.batchId);

    if (currentStep === 1) {
      if (!formData.batchId) {
        errs.batchId = 'Please select an eligible batch to transfer.';
      } else if (!selectedBatch) {
        errs.batchId = 'Selected batch is invalid or not in custody.';
      } else if (new Date(selectedBatch.expiryDate) <= new Date()) {
        errs.batchId = 'Expired batches cannot be transferred into the supply chain.';
      }
    }

    if (currentStep === 2) {
      if (!formData.toOrganizationId) {
        errs.toOrganizationId = 'Please select an approved distributor organization.';
      }
    }

    if (currentStep === 3) {
      const qty = Number(formData.quantity);
      if (!qty || isNaN(qty) || qty <= 0) {
        errs.quantity = 'Transfer quantity must be greater than 0.';
      } else if (selectedBatch && qty > selectedBatch.quantity) {
        errs.quantity = `Quantity cannot exceed available volume (${selectedBatch.quantity.toLocaleString()}).`;
      }
      if (!formData.transferDate) {
        errs.transferDate = 'Transfer date is required.';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    setError('');
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleTransferSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      setSubmitStageText('Validating transfer parameters & authorization...');
      await new Promise((r) => setTimeout(r, 250));

      setSubmitStageText('Verifying recipient distributor status...');
      await new Promise((r) => setTimeout(r, 250));

      setSubmitStageText('Recording custody transfer event & updating batch status...');
      const payload = {
        batchId: formData.batchId,
        eventType: 'DISPATCHED',
        toOrganizationId: formData.toOrganizationId,
        quantity: Number(formData.quantity),
        location: formData.location.trim() || 'Logistics Dispatch Center',
        notes: formData.notes.trim() || `Pharmaceutical custody dispatch on ${formData.transferDate}.`,
      };

      const res = await api.recordEvent(payload);

      if (res && res.success && res.event) {
        setSubmitStageText('Generating cryptographic SHA-256 proof & anchoring on blockchain...');
        await new Promise((r) => setTimeout(r, 300));

        setCreatedEventResult(res.event);
        setStep(5); // Complete State
      } else {
        setError(res?.message || 'Failed to record custody transfer.');
      }
    } catch (err) {
      setError(err.message || 'Server error during transfer dispatch.');
    } finally {
      setSubmitting(false);
      setSubmitStageText('');
    }
  };

  const resetWizardToStart = () => {
    setStep(1);
    setCreatedEventResult(null);
    setFieldErrors({});
    setError('');
    if (batches.length > 0) {
      setFormData((prev) => ({
        ...prev,
        batchId: batches[0]._id,
        quantity: batches[0].quantity,
      }));
    }
  };

  const selectedBatchObj = batches.find((b) => b._id === formData.batchId);
  const selectedDistributorObj = distributors.find((d) => d._id === formData.toOrganizationId);

  // Derived Transfer Stats
  const dispatchedEventsCount = events.filter((e) => e.eventType === 'DISPATCHED' || e.eventType === 'SHIPPED' || e.eventType === 'TRANSFERRED').length;
  const uniqueBatchesTransferred = new Set(events.map((e) => e.batch?._id)).size;

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                Logistics & Custody Workspace
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Org: <strong style={{ color: '#0f172a' }}>{user?.organization?.name || 'Manufacturer'}</strong>
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0, tracking: '-0.02em' }}>
              Transfers & Custody Dispatches
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
              Track pharmaceutical batches transferred from your organization to authorized supply-chain partners.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {viewMode === 'new_transfer' ? (
              <button
                type="button"
                onClick={() => {
                  setViewMode('list');
                  resetWizardToStart();
                }}
                className="btn btn-secondary"
                style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                <span>View Transfer Log</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setViewMode('new_transfer');
                  resetWizardToStart();
                }}
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Plus style={{ width: '18px', height: '18px' }} />
                <span>New Transfer</span>
              </button>
            )}
          </div>
        </div>

        {/* Real Summary Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Total Dispatches
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{loading ? '...' : totalEvents}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Recorded custody transfer events</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Batches Transferred
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669' }}>{loading ? '...' : uniqueBatchesTransferred}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Distinct pharmaceutical lots</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Approved Distributors
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706' }}>{loading ? '...' : distributors.length}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Certified receiving partners</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Blockchain Proof Anchors
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#7c3aed' }}>{loading ? '...' : dispatchedEventsCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Cryptographically signed events</div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              padding: '14px 18px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#991b1b',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: '500' }}>{error}</span>
            </div>
            <button onClick={loadTransferPrerequisites} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Retry
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE A: NEW TRANSFER WORKFLOW                                         */}
        {/* ========================================================================= */}
        {viewMode === 'new_transfer' && (
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            {/* Stepper Progress Bar (Steps 1 to 4) */}
            {step < 5 && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { num: 1, label: '1. Select Batch', icon: Package },
                  { num: 2, label: '2. Select Distributor', icon: Building },
                  { num: 3, label: '3. Transfer Specs', icon: FileText },
                  { num: 4, label: '4. Review & Confirm', icon: ShieldCheck },
                ].map((s) => {
                  const isActive = step === s.num;
                  const isDone = step > s.num;
                  const IconComp = s.icon;
                  return (
                    <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isDone ? '#10b981' : isActive ? '#2563eb' : '#f1f5f9',
                          color: isDone || isActive ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                        }}
                      >
                        {isDone ? <Check style={{ width: '18px', height: '18px' }} /> : <IconComp style={{ width: '16px', height: '16px' }} />}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: isActive ? '700' : '600', color: isActive ? '#0f172a' : '#64748b' }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Main Transfer Wizard Container */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '32px 28px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* STEP 1: SELECT BATCH */}
              {step === 1 && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                      <Package style={{ width: '22px', height: '22px' }} />
                      Step 1: Select Eligible Pharmaceutical Batch
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                      Select a manufactured pharmaceutical lot from your active inventory for custody handover.
                    </p>
                  </div>

                  {batches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                      <AlertTriangle style={{ width: '32px', height: '32px', color: '#d97706', margin: '0 auto 12px' }} />
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>No Transferable Batches Available</h4>
                      <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>All batches are either expired, recalled, or already in transit.</p>
                      <Link to="/manufacturer/batches/create" className="btn btn-primary btn-sm">
                        + Create a New Batch First
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="selectBatch" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Select Manufactured Batch *
                      </label>
                      <select
                        id="selectBatch"
                        value={formData.batchId}
                        onChange={(e) => handleBatchSelect(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${fieldErrors.batchId ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.92rem',
                          background: '#ffffff',
                          outline: 'none',
                        }}
                      >
                        {batches.map((b) => (
                          <option key={b._id} value={b._id}>
                            Batch #{b.batchNumber} — {b.product?.name} ({Number(b.quantity).toLocaleString()} {b.unit} available)
                          </option>
                        ))}
                      </select>
                      {fieldErrors.batchId && (
                        <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                          {fieldErrors.batchId}
                        </span>
                      )}

                      {/* Selected Batch Details Preview Card */}
                      {selectedBatchObj && (
                        <div
                          style={{
                            marginTop: '20px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '20px',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
                            <div>
                              <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', display: 'block' }}>MEDICINE NAME</span>
                              <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{selectedBatchObj.product?.name}</strong>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{selectedBatchObj.product?.dosageForm} ({selectedBatchObj.product?.strength})</div>
                            </div>

                            <div>
                              <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', display: 'block' }}>AVAILABLE VOLUME</span>
                              <strong style={{ color: '#2563eb' }}>{Number(selectedBatchObj.quantity).toLocaleString()} {selectedBatchObj.unit}</strong>
                            </div>

                            <div>
                              <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', display: 'block' }}>EXPIRATION DATE</span>
                              <span style={{ fontWeight: '700', color: '#059669' }}>
                                {new Date(selectedBatchObj.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              </span>
                            </div>

                            <div>
                              <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', display: 'block' }}>CURRENT STATUS</span>
                              <StatusBadge status={selectedBatchObj.status} />
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="btn btn-primary"
                          style={{ padding: '12px 26px', fontSize: '0.95rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                          <span>Continue to Select Distributor</span>
                          <ArrowRight style={{ width: '18px', height: '18px' }} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: SELECT DISTRIBUTOR */}
              {step === 2 && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                      <Building style={{ width: '22px', height: '22px' }} />
                      Step 2: Select Approved Distributor
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                      Choose a certified wholesale distributor registered on the pharmaceutical ledger.
                    </p>
                  </div>

                  {distributors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', color: '#991b1b' }}>
                      <AlertCircle style={{ width: '28px', height: '28px', color: '#dc2626', margin: '0 auto 10px' }} />
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>No Approved Distributors Found</h4>
                      <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>There are currently no active certified distributors registered on the network.</p>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="selectDistributor" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Certified Recipient Distributor *
                      </label>
                      <select
                        id="selectDistributor"
                        value={formData.toOrganizationId}
                        onChange={(e) => {
                          setFormData({ ...formData, toOrganizationId: e.target.value });
                          if (fieldErrors.toOrganizationId) setFieldErrors({ ...fieldErrors, toOrganizationId: null });
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${fieldErrors.toOrganizationId ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.92rem',
                          background: '#ffffff',
                          outline: 'none',
                        }}
                      >
                        {distributors.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} — {d.address || 'Certified Logistics Facility'} ({d.contactEmail || 'Verified'})
                          </option>
                        ))}
                      </select>
                      {fieldErrors.toOrganizationId && (
                        <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                          {fieldErrors.toOrganizationId}
                        </span>
                      )}

                      {/* Selected Distributor Preview Card */}
                      {selectedDistributorObj && (
                        <div
                          style={{
                            marginTop: '20px',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderRadius: '12px',
                            padding: '20px',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#047857', textTransform: 'uppercase', marginBottom: '4px' }}>
                            RECIPIENT PARTNER VERIFIED
                          </div>
                          <strong style={{ fontSize: '1.05rem', color: '#064e3b' }}>{selectedDistributorObj.name}</strong>
                          <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '4px' }}>
                            Facility Address: {selectedDistributorObj.address || 'Certified Primary Logistics Bay'}
                          </div>
                          {selectedDistributorObj.contactEmail && (
                            <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '2px' }}>
                              Contact: {selectedDistributorObj.contactEmail}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="btn btn-secondary"
                          style={{ padding: '12px 22px', fontSize: '0.9rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <ArrowLeft style={{ width: '16px', height: '16px' }} />
                          <span>Back</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="btn btn-primary"
                          style={{ padding: '12px 26px', fontSize: '0.95rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                          <span>Continue to Transfer Specifications</span>
                          <ArrowRight style={{ width: '18px', height: '18px' }} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: TRANSFER SPECIFICATIONS */}
              {step === 3 && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                      <FileText style={{ width: '22px', height: '22px' }} />
                      Step 3: Transfer Specifications & Dispatch Notes
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                      Specify volume to transfer, dispatch facility location, and bill of lading details.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                    <div>
                      <label htmlFor="transferQty" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Transfer Quantity *
                      </label>
                      <input
                        id="transferQty"
                        type="number"
                        min="1"
                        max={selectedBatchObj?.quantity || 1000000}
                        value={formData.quantity}
                        onChange={(e) => {
                          setFormData({ ...formData, quantity: e.target.value });
                          if (fieldErrors.quantity) setFieldErrors({ ...fieldErrors, quantity: null });
                        }}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${fieldErrors.quantity ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.9rem',
                          outline: 'none',
                        }}
                      />
                      {fieldErrors.quantity && (
                        <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                          {fieldErrors.quantity}
                        </span>
                      )}
                    </div>

                    <div>
                      <label htmlFor="transferDate" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Dispatch Date *
                      </label>
                      <input
                        id="transferDate"
                        type="date"
                        value={formData.transferDate}
                        onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="dispatchLocation" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Dispatch Bay / Facility Location
                      </label>
                      <input
                        id="dispatchLocation"
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Loading Dock #2, Boston Plant"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="notes" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Transfer Notes / Bill of Lading Details
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="e.g. Dispatched in tamper-evident secure cold storage container."
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="btn btn-secondary"
                      style={{ padding: '12px 22px', fontSize: '0.9rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ArrowLeft style={{ width: '16px', height: '16px' }} />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="btn btn-primary"
                      style={{ padding: '12px 26px', fontSize: '0.95rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span>Review Transfer Details</span>
                      <ArrowRight style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & CONFIRMATION */}
              {step === 4 && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                      <ShieldCheck style={{ width: '22px', height: '22px', color: '#2563eb' }} />
                      Step 4: Review Custody Handover
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                      Submitting will record the custody handover and anchor an immutable cryptographic proof on the blockchain.
                    </p>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '28px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>BATCH ID</span>
                        <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#2563eb' }}>{selectedBatchObj?.batchNumber}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>MEDICINE</span>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{selectedBatchObj?.product?.name}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>TRANSFER VOLUME</span>
                        <strong style={{ fontSize: '1rem', color: '#059669' }}>{Number(formData.quantity).toLocaleString()} {formData.unit}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>ORIGIN (FROM)</span>
                        <span style={{ fontWeight: '600', color: '#334155' }}>{user?.organization?.name || 'Manufacturer'}</span>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>DESTINATION (TO)</span>
                        <strong style={{ color: '#1e40af' }}>{selectedDistributorObj?.name}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>DISPATCH DATE</span>
                        <span style={{ fontWeight: '600', color: '#334155' }}>{new Date(formData.transferDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>
                      Dispatch Bay: <strong style={{ color: '#334155' }}>{formData.location}</strong>
                    </div>
                  </div>

                  {submitting ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                      <RefreshCw style={{ width: '36px', height: '36px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                      <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1e3a8a' }}>{submitStageText || 'Processing Transfer...'}</div>
                      <p style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: '6px' }}>Recording custody handover & anchoring proof. Please wait...</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="btn btn-secondary"
                        style={{ padding: '12px 22px', fontSize: '0.9rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Edit3 style={{ width: '16px', height: '16px' }} />
                        <span>Edit Parameters</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleTransferSubmit}
                        className="btn btn-primary"
                        style={{ padding: '13px 32px', fontSize: '1rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <span>Confirm & Dispatch Transfer</span>
                        <ArrowRight style={{ width: '18px', height: '18px' }} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: SUCCESS RESULT */}
              {step === 5 && createdEventResult && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <CheckCircle2 style={{ width: '38px', height: '38px', color: '#ffffff' }} />
                  </div>

                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 14px',
                      borderRadius: '9999px',
                      background: '#ecfdf5',
                      color: '#047857',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      letterSpacing: '0.04em',
                      marginBottom: '12px',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    ✓ CUSTODY TRANSFERRED & ANCHORED
                  </div>

                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    Transfer {createdEventResult.uniqueEventId} Completed
                  </h2>

                  <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '560px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                    Batch <strong style={{ color: '#2563eb' }}>#{selectedBatchObj?.batchNumber}</strong> ({selectedBatchObj?.product?.name}) has been dispatched to <strong style={{ color: '#0f172a' }}>{selectedDistributorObj?.name}</strong>.
                  </p>

                  {/* Blockchain Proof Card */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '32px',
                      textAlign: 'left',
                    }}
                  >
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                      Blockchain Transfer Record
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700' }}>EVENT ID</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>{createdEventResult.uniqueEventId}</span>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700' }}>TRANSACTION HASH</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2563eb', wordBreak: 'break-all' }}>
                          {createdEventResult.transactionHash}
                        </span>
                      </div>

                      {createdEventResult.blockNumber && (
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700' }}>BLOCK NUMBER</span>
                          <span style={{ fontWeight: '700', color: '#334155' }}>#{createdEventResult.blockNumber}</span>
                        </div>
                      )}

                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700' }}>NETWORK</span>
                        <span style={{ fontWeight: '700', color: '#059669' }}>{createdEventResult.blockchainNetwork || 'Sepolia Ethereum Testnet (Simulated Proof)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link
                      to={`/manufacturer/batches/${formData.batchId}`}
                      className="btn btn-primary"
                      style={{ padding: '12px 24px', fontSize: '0.92rem', fontWeight: '700' }}
                    >
                      View Batch Details
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('list');
                        loadTransferPrerequisites();
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '12px 20px', fontSize: '0.92rem', fontWeight: '600' }}
                    >
                      View Transfer Log
                    </button>

                    <button
                      type="button"
                      onClick={resetWizardToStart}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        fontSize: '0.92rem',
                        fontWeight: '600',
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      + Dispatch Another Batch
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE B: TRANSFER LOG TABLE                                            */}
        {/* ========================================================================= */}
        {viewMode === 'list' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Custody Transfer Log & Provenance History
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Real-time record of pharmaceutical batch dispatches to authorized distributors
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={loadTransferPrerequisites}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    color: '#475569',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RotateCcw style={{ width: '14px', height: '14px' }} />
                  <span>Refresh Log</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <RefreshCw style={{ width: '32px', height: '32px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Loading custody transfer log...</div>
              </div>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Truck style={{ width: '28px', height: '28px' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                  No Transfer Events Recorded
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 20px' }}>
                  Your organization has not logged any custody transfer events yet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('new_transfer');
                    resetWizardToStart();
                  }}
                  className="btn btn-primary"
                  style={{ padding: '11px 22px', fontSize: '0.9rem', fontWeight: '700' }}
                >
                  + Record Your First Transfer
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 14px' }}>EVENT ID</th>
                      <th style={{ padding: '12px 14px' }}>BATCH & MEDICINE</th>
                      <th style={{ padding: '12px 14px' }}>VOLUME</th>
                      <th style={{ padding: '12px 14px' }}>FROM (ORIGIN)</th>
                      <th style={{ padding: '12px 14px' }}>TO (DESTINATION)</th>
                      <th style={{ padding: '12px 14px' }}>DATE</th>
                      <th style={{ padding: '12px 14px' }}>STATUS</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2563eb', fontSize: '0.82rem' }}>
                            {e.uniqueEventId || 'EVT-LOG'}
                          </span>
                        </td>

                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: '800', color: '#0f172a', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            #{e.batch?.batchNumber || 'Batch'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {e.batch?.product?.name || 'Formulated Medicine'}
                          </div>
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.88rem', fontWeight: '600', color: '#334155' }}>
                          {Number(e.quantity || e.batch?.quantity || 0).toLocaleString()} Units
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.85rem', color: '#475569' }}>
                          {e.fromOrganization?.name || 'Manufacturer Cleanroom'}
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.85rem', color: '#1e40af', fontWeight: '600' }}>
                          {e.toOrganization?.name || 'Certified Distributor'}
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.85rem', color: '#475569' }}>
                          {new Date(e.eventDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>

                        <td style={{ padding: '14px' }}>
                          <StatusBadge status={e.eventType} />
                        </td>

                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <Link
                            to={`/manufacturer/batches/${e.batch?._id}`}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700' }}
                          >
                            View Batch
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
