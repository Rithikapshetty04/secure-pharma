import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import {
  Factory,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  FileText,
  Check,
  QrCode,
  Download,
  ExternalLink,
  Edit3,
  Pill,
  FlaskConical,
  Copy,
  Building,
  Calendar,
  Layers,
} from 'lucide-react';

const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Injectable / Vial',
  'Syrup / Liquid Solution',
  'Ointment / Cream',
  'Inhaler / Aerosol',
  'Transdermal Patch',
];

const CATEGORIES = [
  'Antibiotic / Anti-Infective',
  'Analgesic / Pain Management',
  'Cardiovascular / Antihypertensive',
  'Biological / Vaccine',
  'Respiratory / Antiasthmatic',
  'Oncology / Immunotherapy',
  'General Pharmaceutical',
];

export default function ManufacturerCreateBatchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard Steps: 1 = Medicine Info, 2 = Batch Info, 3 = Dates & Facility, 4 = Review & Mint, 5 = Complete
  const [step, setStep] = useState(1);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStageText, setSubmitStageText] = useState('');

  const [generalError, setGeneralError] = useState('');
  const [createdBatchResult, setCreatedBatchResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form Mode: select existing or register new drug formulation inline
  const [isNewProduct, setIsNewProduct] = useState(false);

  const defaultMfgDate = new Date().toISOString().split('T')[0];
  const defaultExpDate = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    productId: '',
    // New product inline fields:
    newProductName: '',
    genericName: '',
    category: 'Antibiotic / Anti-Infective',
    dosageForm: 'Tablet',
    strength: '500 mg',
    productCode: '',
    // Batch specifications:
    batchNumber: '',
    quantity: 10000,
    unit: 'Units',
    manufacturingDate: defaultMfgDate,
    expiryDate: defaultExpDate,
    location: user?.organization?.address || 'Primary Cleanroom Facility Suite #1',
    storageRequirements: 'Store at controlled room temperature (15°C to 25°C)',
    description: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await api.getProducts({ limit: 100 });
        if (res && res.success) {
          const fetchedProds = res.products || [];
          setProducts(fetchedProds);
          if (fetchedProds.length > 0) {
            setFormData((prev) => ({ ...prev, productId: fetchedProds[0]._id }));
            setIsNewProduct(false);
          } else {
            setIsNewProduct(true);
          }
        }
      } catch (err) {
        console.error('Error fetching formulary products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Validation per step
  const validateStep = (currentStep) => {
    const errors = {};

    if (currentStep === 1) {
      if (isNewProduct) {
        if (!formData.newProductName.trim()) errors.newProductName = 'Medicine commercial name is required.';
        if (!formData.productCode.trim()) errors.productCode = 'Product code / GTIN / NDC is required.';
      } else {
        if (!formData.productId) errors.productId = 'Please select a registered drug formulation from the list.';
      }
    }

    if (currentStep === 2) {
      if (!formData.batchNumber.trim()) {
        errors.batchNumber = 'Unique Batch Number / Lot ID is required.';
      } else if (formData.batchNumber.trim().length < 3) {
        errors.batchNumber = 'Batch Number must be at least 3 characters.';
      }

      if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) <= 0) {
        errors.quantity = 'Quantity must be a positive integer greater than 0.';
      }
    }

    if (currentStep === 3) {
      if (!formData.manufacturingDate) {
        errors.manufacturingDate = 'Manufacturing date is required.';
      }
      if (!formData.expiryDate) {
        errors.expiryDate = 'Expiry date is required.';
      } else if (new Date(formData.expiryDate) <= new Date(formData.manufacturingDate)) {
        errors.expiryDate = 'Expiry date must be strictly later than manufacturing date.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    setGeneralError('');
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setGeneralError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreateBatchSubmit = async () => {
    setGeneralError('');
    setSubmitting(true);

    try {
      setSubmitStageText('Validating batch payload & authorization...');
      await new Promise((r) => setTimeout(r, 250));

      let targetProductId = formData.productId;

      // Register new drug formulation inline if requested
      if (isNewProduct) {
        setSubmitStageText('Registering new medicine formulation in database...');
        const prodRes = await api.createProduct({
          name: formData.newProductName.trim(),
          genericName: formData.genericName.trim(),
          category: formData.category,
          dosageForm: formData.dosageForm,
          strength: formData.strength.trim(),
          productCode: formData.productCode.trim().toUpperCase(),
          storageRequirements: formData.storageRequirements.trim(),
          description: formData.description.trim(),
        });

        if (!prodRes || !prodRes.success) {
          setGeneralError(prodRes?.message || 'Failed to register new medicine formulation.');
          setSubmitting(false);
          return;
        }

        targetProductId = prodRes.product._id;
      }

      setSubmitStageText('Generating SHA-256 cryptographic batch hash...');
      await new Promise((r) => setTimeout(r, 300));

      setSubmitStageText('Storing batch record & anchoring blockchain proof...');
      const batchPayload = {
        productId: targetProductId,
        batchNumber: formData.batchNumber.trim().toUpperCase(),
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
        quantity: Number(formData.quantity),
        unit: formData.unit.trim() || 'Units',
        location: formData.location.trim(),
        storageRequirements: formData.storageRequirements.trim(),
      };

      const res = await api.createBatch(batchPayload);

      if (res && res.success && res.batch) {
        setSubmitStageText('Generating verification QR code...');
        await new Promise((r) => setTimeout(r, 200));

        setCreatedBatchResult(res.batch);
        setStep(5); // Complete State
      } else {
        const backendMsg = res?.message || 'Failed to create production batch.';
        if (backendMsg.includes('already exists')) {
          setGeneralError(`Batch Number '${formData.batchNumber.trim().toUpperCase()}' already exists. Please use a unique Lot ID.`);
          setFieldErrors({ batchNumber: 'Batch ID already exists in ledger.' });
          setStep(2); // Redirect to Step 2 for ID fix
        } else {
          setGeneralError(backendMsg);
        }
      }
    } catch (err) {
      setGeneralError(err.message || 'Server connection error during batch creation.');
    } finally {
      setSubmitting(false);
      setSubmitStageText('');
    }
  };

  const getSelectedProductObj = () => {
    if (isNewProduct) {
      return {
        name: formData.newProductName || 'New Formulation',
        genericName: formData.genericName,
        productCode: formData.productCode.toUpperCase(),
        dosageForm: formData.dosageForm,
        strength: formData.strength,
        category: formData.category,
      };
    }
    return products.find((p) => p._id === formData.productId) || null;
  };

  const selectedProdObj = getSelectedProductObj();

  const resetFormToStart = () => {
    setStep(1);
    setCreatedBatchResult(null);
    setCopiedLink(false);
    setFormData({
      productId: products.length > 0 ? products[0]._id : '',
      newProductName: '',
      genericName: '',
      category: 'Antibiotic / Anti-Infective',
      dosageForm: 'Tablet',
      strength: '500 mg',
      productCode: '',
      batchNumber: '',
      quantity: 10000,
      unit: 'Units',
      manufacturingDate: defaultMfgDate,
      expiryDate: defaultExpDate,
      location: user?.organization?.address || 'Primary Cleanroom Facility Suite #1',
      storageRequirements: 'Store at controlled room temperature (15°C to 25°C)',
      description: '',
    });
    setFieldErrors({});
    setGeneralError('');
  };

  const handleCopyVerificationLink = () => {
    if (!createdBatchResult) return;
    const identifier = createdBatchResult.qrIdentifier || createdBatchResult.batchNumber;
    const url = `${window.location.origin}/verify/${encodeURIComponent(identifier)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Top Header & Navigation */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link
              to="/manufacturer/batches"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#2563eb',
                fontWeight: '700',
                fontSize: '0.85rem',
                textDecoration: 'none',
                background: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              Back to Batch Inventory
            </Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0, tracking: '-0.02em' }}>
              Create New Pharmaceutical Batch
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px', margin: 0 }}>
              Register and anchor a new pharmaceutical lot for supply-chain traceability.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', color: '#475569' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Manufacturer</span>
            <strong style={{ color: '#0f172a' }}>{user?.organization?.name || user?.name || 'Authorized Manufacturer'}</strong>
          </div>
        </div>

        {/* Wizard Stepper Progress Bar (Steps 1 to 4) */}
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
              { num: 1, label: '1. Medicine Info', icon: Pill },
              { num: 2, label: '2. Batch & Lot', icon: Package },
              { num: 3, label: '3. Dates & Facility', icon: Calendar },
              { num: 4, label: '4. Review & Register', icon: ShieldCheck },
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
                      transition: 'all 0.2s',
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

        {/* Main Card Container */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px 28px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* General Error Banner */}
          {generalError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#991b1b',
                fontSize: '0.88rem',
                marginBottom: '24px',
              }}
              role="alert"
            >
              <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0, color: '#dc2626' }} />
              <span style={{ fontWeight: '500' }}>{generalError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: MEDICINE INFORMATION                                              */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                  <Pill style={{ width: '22px', height: '22px' }} />
                  Step 1: Medicine Information
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Select an existing registered drug formulation or register a new medicine formulation inline.
                </p>
              </div>

              {/* Formulation Mode Switcher */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewProduct(false);
                    setFieldErrors({});
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `2px solid ${!isNewProduct ? '#2563eb' : '#e2e8f0'}`,
                    background: !isNewProduct ? '#eff6ff' : '#ffffff',
                    color: !isNewProduct ? '#1e40af' : '#475569',
                    fontWeight: !isNewProduct ? '700' : '600',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s',
                  }}
                >
                  <FlaskConical style={{ width: '18px', height: '18px' }} />
                  Select Registered Drug Formulation
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsNewProduct(true);
                    setFieldErrors({});
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `2px solid ${isNewProduct ? '#2563eb' : '#e2e8f0'}`,
                    background: isNewProduct ? '#eff6ff' : '#ffffff',
                    color: isNewProduct ? '#1e40af' : '#475569',
                    fontWeight: isNewProduct ? '700' : '600',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>+ Register New Medicine Inline</span>
                </button>
              </div>

              {!isNewProduct && products.length > 0 ? (
                <div>
                  <label htmlFor="selectProduct" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Select Formulated Medicine *
                  </label>
                  <select
                    id="selectProduct"
                    value={formData.productId}
                    onChange={(e) => {
                      setFormData({ ...formData, productId: e.target.value });
                      if (fieldErrors.productId) setFieldErrors({ ...fieldErrors, productId: null });
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${fieldErrors.productId ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '0.92rem',
                      background: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.productCode}) — {p.dosageForm || 'Formulation'} {p.strength ? `[${p.strength}]` : ''}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.productId && (
                    <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.productId}
                    </span>
                  )}
                </div>
              ) : (
                /* Inline New Product Registration Fields */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="newProductName" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Medicine Name *
                    </label>
                    <input
                      id="newProductName"
                      type="text"
                      value={formData.newProductName}
                      onChange={(e) => {
                        setFormData({ ...formData, newProductName: e.target.value });
                        if (fieldErrors.newProductName) setFieldErrors({ ...fieldErrors, newProductName: null });
                      }}
                      placeholder="e.g. Paracetamol 500 mg"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${fieldErrors.newProductName ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                    {fieldErrors.newProductName && (
                      <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                        {fieldErrors.newProductName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="genericName" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Generic Name
                    </label>
                    <input
                      id="genericName"
                      type="text"
                      value={formData.genericName}
                      onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                      placeholder="e.g. Acetaminophen"
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

                  <div>
                    <label htmlFor="productCode" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Product Code / NDC / GTIN *
                    </label>
                    <input
                      id="productCode"
                      type="text"
                      value={formData.productCode}
                      onChange={(e) => {
                        setFormData({ ...formData, productCode: e.target.value.toUpperCase() });
                        if (fieldErrors.productCode) setFieldErrors({ ...fieldErrors, productCode: null });
                      }}
                      placeholder="e.g. PARA-500MG-TAB"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${fieldErrors.productCode ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    />
                    {fieldErrors.productCode && (
                      <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                        {fieldErrors.productCode}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="strength" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Strength
                    </label>
                    <input
                      id="strength"
                      type="text"
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                      placeholder="e.g. 500 mg"
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

                  <div>
                    <label htmlFor="dosageForm" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Dosage Form
                    </label>
                    <select
                      id="dosageForm"
                      value={formData.dosageForm}
                      onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        background: '#ffffff',
                        outline: 'none',
                      }}
                    >
                      {DOSAGE_FORMS.map((df) => (
                        <option key={df} value={df}>
                          {df}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{ padding: '12px 26px', fontSize: '0.95rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Continue to Batch Information</span>
                  <ArrowRight style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: BATCH & SERIALIZATION                                             */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                  <Package style={{ width: '22px', height: '22px' }} />
                  Step 2: Batch Information
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Enter unique batch identifier, production volume, and storage criteria.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="batchNumber" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Batch ID / Lot Number *
                  </label>
                  <input
                    id="batchNumber"
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, batchNumber: e.target.value.toUpperCase() });
                      if (fieldErrors.batchNumber) setFieldErrors({ ...fieldErrors, batchNumber: null });
                    }}
                    placeholder="e.g. SP-PARA-001"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${fieldErrors.batchNumber ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      outline: 'none',
                    }}
                  />
                  {fieldErrors.batchNumber && (
                    <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.batchNumber}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="quantity" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Quantity *
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => {
                      setFormData({ ...formData, quantity: e.target.value });
                      if (fieldErrors.quantity) setFieldErrors({ ...fieldErrors, quantity: null });
                    }}
                    placeholder="10000"
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
                  <label htmlFor="unit" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Unit
                  </label>
                  <input
                    id="unit"
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. Units, Boxes, Vials"
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
                  <label htmlFor="storageRequirements" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Storage Conditions
                  </label>
                  <input
                    id="storageRequirements"
                    type="text"
                    value={formData.storageRequirements}
                    onChange={(e) => setFormData({ ...formData, storageRequirements: e.target.value })}
                    placeholder="e.g. Store at controlled room temperature 15°C to 25°C"
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
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary"
                  style={{ padding: '12px 22px', fontSize: '0.9rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft style={{ width: '16px', height: '16px' }} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{ padding: '12px 26px', fontSize: '0.95rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Continue to Dates & Facility</span>
                  <ArrowRight style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: DATES & FACILITY                                                  */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                  <Calendar style={{ width: '22px', height: '22px' }} />
                  Step 3: Dates & Facility Location
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Specify manufacturing date, expiration window, and cleanroom facility location.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                <div>
                  <label htmlFor="mfgDate" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Manufacturing Date *
                  </label>
                  <input
                    id="mfgDate"
                    type="date"
                    value={formData.manufacturingDate}
                    onChange={(e) => {
                      setFormData({ ...formData, manufacturingDate: e.target.value });
                      if (fieldErrors.manufacturingDate) setFieldErrors({ ...fieldErrors, manufacturingDate: null });
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${fieldErrors.manufacturingDate ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  {fieldErrors.manufacturingDate && (
                    <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.manufacturingDate}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="expDate" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Expiry Date *
                  </label>
                  <input
                    id="expDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => {
                      setFormData({ ...formData, expiryDate: e.target.value });
                      if (fieldErrors.expiryDate) setFieldErrors({ ...fieldErrors, expiryDate: null });
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${fieldErrors.expiryDate ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  {fieldErrors.expiryDate && (
                    <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.expiryDate}
                    </span>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="facilityLocation" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Facility Cleanroom Location
                  </label>
                  <input
                    id="facilityLocation"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Sterile Cleanroom Suite #1, Boston Facility"
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
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary"
                  style={{ padding: '12px 22px', fontSize: '0.9rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft style={{ width: '16px', height: '16px' }} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{ padding: '12px 26px', fontSize: '0.95rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Review Batch Details</span>
                  <ArrowRight style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: REVIEW & CONFIRMATION                                             */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                  <ShieldCheck style={{ width: '22px', height: '22px', color: '#2563eb' }} />
                  Step 4: Review Batch Details
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Please review all parameters carefully before registering the batch and anchoring proof.
                </p>
              </div>

              {/* Review Card */}
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
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Medicine</span>
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{selectedProdObj?.name || 'Selected Medicine'}</strong>
                    {selectedProdObj?.genericName && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Generic: {selectedProdObj.genericName}</div>
                    )}
                    {selectedProdObj?.strength && (
                      <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '600' }}>Strength: {selectedProdObj.strength}</div>
                    )}
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Dosage Form</span>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{selectedProdObj?.dosageForm || 'Tablet'}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Batch ID / Lot</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#2563eb' }}>{formData.batchNumber.toUpperCase()}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Quantity</span>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                      {Number(formData.quantity).toLocaleString()} {formData.unit}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Manufacturing Date</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{new Date(formData.manufacturingDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Expiry Date</span>
                    <span style={{ fontWeight: '600', color: '#059669' }}>{new Date(formData.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#64748b' }}>
                  <div>
                    Cleanroom Facility: <strong style={{ color: '#334155' }}>{formData.location}</strong>
                  </div>
                  <div>
                    Storage Criteria: <strong style={{ color: '#334155' }}>{formData.storageRequirements}</strong>
                  </div>
                </div>
              </div>

              {submitting ? (
                <div style={{ textAlign: 'center', padding: '36px 0', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                  <RefreshCw style={{ width: '36px', height: '36px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1e3a8a' }}>{submitStageText || 'Processing Batch Registration...'}</div>
                  <p style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: '6px' }}>Anchoring cryptographic integrity proof to ledger. Please wait...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn-secondary"
                    style={{ padding: '12px 22px', fontSize: '0.9rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit3 style={{ width: '16px', height: '16px' }} />
                    <span>Back to Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateBatchSubmit}
                    className="btn btn-primary"
                    style={{ padding: '13px 32px', fontSize: '1rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span>Create Batch</span>
                    <ArrowRight style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: CREATION SUCCESS VIEW                                             */}
          {/* ========================================================================= */}
          {step === 5 && createdBatchResult && (
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
                ✓ BATCH CREATED SUCCESSFULLY
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                Batch {createdBatchResult.batchNumber} Registered
              </h2>

              <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '560px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                Production lot for <strong style={{ color: '#0f172a' }}>{selectedProdObj?.name || 'Pharmaceutical Product'}</strong> has been saved and anchored.
              </p>

              {/* QR Code Container */}
              <div style={{ marginBottom: '28px' }}>
                <QRCodeGenerator
                  identifier={createdBatchResult.qrIdentifier || createdBatchResult.batchNumber}
                  batchNumber={createdBatchResult.batchNumber}
                  productName={selectedProdObj?.name}
                  size={200}
                  showControls={true}
                />
              </div>

              {/* Integrity Proof Details Card */}
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
                  Blockchain Verification Record
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700' }}>SHA-256 BATCH HASH</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a', wordBreak: 'break-all' }}>
                      {createdBatchResult.batchHash || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700' }}>BLOCKCHAIN TX HASH</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#2563eb', wordBreak: 'break-all' }}>
                      {createdBatchResult.blockchainTxHash || createdBatchResult.batchHash}
                    </span>
                  </div>

                  {createdBatchResult.blockNumber && (
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700' }}>BLOCK NUMBER</span>
                      <span style={{ fontWeight: '700', color: '#334155' }}>#{createdBatchResult.blockNumber}</span>
                    </div>
                  )}

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: '700' }}>NETWORK</span>
                    <span style={{ fontWeight: '700', color: '#059669' }}>{createdBatchResult.blockchainNetwork || 'Sepolia Ethereum Testnet (Simulated Proof)'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to={`/manufacturer/batches/${createdBatchResult._id}`}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '0.92rem', fontWeight: '700' }}
                >
                  View Batch Details
                </Link>

                <Link
                  to={`/verify/${createdBatchResult.qrIdentifier || createdBatchResult.batchNumber}`}
                  className="btn btn-secondary"
                  style={{ padding: '12px 22px', fontSize: '0.92rem', fontWeight: '600' }}
                >
                  Verify Batch
                </Link>

                <button
                  type="button"
                  onClick={handleCopyVerificationLink}
                  style={{
                    background: copiedLink ? '#ecfdf5' : '#ffffff',
                    border: `1px solid ${copiedLink ? '#10b981' : '#cbd5e1'}`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '0.92rem',
                    fontWeight: '600',
                    color: copiedLink ? '#047857' : '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {copiedLink ? <Check style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Verification Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={resetFormToStart}
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
                  + Create Another Batch
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
