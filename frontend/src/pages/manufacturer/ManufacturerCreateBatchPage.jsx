import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import StatusBadge from '../../components/StatusBadge';
import {
  Factory,
  Package,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Layers,
  FileText,
  UploadCloud,
  Check,
  QrCode,
  Download,
  ExternalLink,
  Edit3,
} from 'lucide-react';

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Injectable / Vial', 'Syrup / Liquid', 'Ointment / Cream', 'Inhaler / Aerosol'];
const CATEGORIES = [
  'Antibiotic / Anti-Infective',
  'Analgesic / Pain Management',
  'Cardiovascular',
  'Biological / Vaccine',
  'Respiratory',
  'Oncology',
  'General Pharmaceutical',
];

export default function ManufacturerCreateBatchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard Step: 1 = Medicine, 2 = Batch Info, 3 = Dates & Facility, 4 = Review, 5 = Complete
  const [step, setStep] = useState(1);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStageText, setSubmitStageText] = useState('');

  const [generalError, setGeneralError] = useState('');
  const [createdBatchResult, setCreatedBatchResult] = useState(null);

  // Form Mode: select existing or register new drug formulation inline
  const [isNewProduct, setIsNewProduct] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    // New product fields:
    newProductName: '',
    genericName: '',
    category: 'Antibiotic / Anti-Infective',
    dosageForm: 'Capsule',
    strength: '500mg',
    productCode: '',
    // Batch specifications:
    batchNumber: '',
    quantity: 10000,
    unit: 'Units',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: user?.organization?.address || 'Primary Cleanroom Facility #1',
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
          setProducts(res.products || []);
          if (res.products && res.products.length > 0) {
            setFormData((prev) => ({ ...prev, productId: res.products[0]._id }));
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
        if (!formData.newProductName.trim()) errors.newProductName = 'Medicine name is required.';
        if (!formData.productCode.trim()) errors.productCode = 'Product code / NDC is required.';
      } else {
        if (!formData.productId) errors.productId = 'Please select a registered drug formulation.';
      }
    }

    if (currentStep === 2) {
      if (!formData.batchNumber.trim()) {
        errors.batchNumber = 'Unique Batch Number is required.';
      } else if (formData.batchNumber.trim().length < 3) {
        errors.batchNumber = 'Batch Number must be at least 3 characters.';
      }

      if (!formData.quantity || Number(formData.quantity) <= 0) {
        errors.quantity = 'Quantity must be a positive number greater than 0.';
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
    setSubmitStageText('Validating batch payload parameters...');

    try {
      let targetProductId = formData.productId;

      // Register new drug formulation inline if selected
      if (isNewProduct) {
        setSubmitStageText('Registering new drug formulation in formulary...');
        const prodRes = await api.createProduct({
          name: formData.newProductName.trim(),
          genericName: formData.genericName.trim(),
          category: formData.category,
          dosageForm: formData.dosageForm,
          strength: formData.strength,
          productCode: formData.productCode.trim().toUpperCase(),
          storageRequirements: formData.storageRequirements,
          description: formData.description,
        });

        if (!prodRes || !prodRes.success) {
          setGeneralError(prodRes?.message || 'Failed to register new medicine formulation.');
          setSubmitting(false);
          return;
        }

        targetProductId = prodRes.product._id;
      }

      setSubmitStageText('Generating SHA-256 cryptographic batch hash...');
      await new Promise((r) => setTimeout(r, 400));

      setSubmitStageText('Minting batch & recording initial custody event...');
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
        setCreatedBatchResult(res.batch);
        setStep(5); // Complete State
      } else {
        const backendMsg = res?.message || 'Failed to create production batch.';
        if (backendMsg.includes('already exists')) {
          setGeneralError(`Batch Number '${formData.batchNumber.trim().toUpperCase()}' already exists in ledger. Please use a unique lot number.`);
          setFieldErrors({ batchNumber: 'Batch ID already exists.' });
          setStep(2); // Go back to batch info step
        } else {
          setGeneralError(backendMsg);
        }
      }
    } catch (err) {
      setGeneralError(err.message || 'Server connection error during batch creation.');
    } finally {
      setLoadingProducts(false);
      setSubmitting(false);
      setSubmitStageText('');
    }
  };

  const getSelectedProductObj = () => {
    if (isNewProduct) {
      return {
        name: formData.newProductName,
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
    setFormData({
      productId: products.length > 0 ? products[0]._id : '',
      newProductName: '',
      genericName: '',
      category: 'Antibiotic / Anti-Infective',
      dosageForm: 'Capsule',
      strength: '500mg',
      productCode: '',
      batchNumber: '',
      quantity: 10000,
      unit: 'Units',
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: user?.organization?.address || 'Primary Cleanroom Facility #1',
      storageRequirements: 'Store at controlled room temperature (15°C to 25°C)',
      description: '',
    });
    setFieldErrors({});
    setGeneralError('');
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 24px 80px' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        {/* Navigation Top Link */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            to="/manufacturer/batches"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#2563eb',
              fontWeight: '700',
              fontSize: '0.88rem',
              textDecoration: 'none',
              background: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Batch Inventory
          </Link>

          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
            Logged in as: <strong style={{ color: '#0f172a' }}>{user?.organization?.name || user?.name}</strong>
          </span>
        </div>

        {/* Wizard Stepper Progress Bar (Steps 1 to 4) */}
        {step < 5 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px 24px',
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
              { num: 1, label: 'Formulation' },
              { num: 2, label: 'Batch Lot' },
              { num: 3, label: 'Dates & Facility' },
              { num: 4, label: 'Review & Mint' },
            ].map((s) => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isDone ? '#10b981' : isActive ? '#2563eb' : '#f1f5f9',
                      color: isDone || isActive ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                    }}
                  >
                    {isDone ? <Check style={{ width: '16px', height: '16px' }} /> : s.num}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: isActive ? '700' : '600', color: isActive ? '#0f172a' : '#64748b' }}>
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
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* General Error Banner */}
          {generalError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '0.85rem',
                marginBottom: '24px',
              }}
              role="alert"
            >
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0, color: '#dc2626' }} />
              <span>{generalError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: MEDICINE FORMULATION                                              */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                  <Pill style={{ width: '22px', height: '22px' }} />
                  Step 1: Medicine Formulation & Selection
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Select an existing registered drug formulation or register a new one inline.
                </p>
              </div>

              {/* Mode Toggle */}
              {products.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewProduct(false);
                      setFieldErrors({});
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${!isNewProduct ? '#2563eb' : '#e2e8f0'}`,
                      background: !isNewProduct ? '#eff6ff' : '#ffffff',
                      color: !isNewProduct ? '#1e40af' : '#475569',
                      fontWeight: !isNewProduct ? '700' : '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Select Registered Drug
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsNewProduct(true);
                      setFieldErrors({});
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${isNewProduct ? '#2563eb' : '#e2e8f0'}`,
                      background: isNewProduct ? '#eff6ff' : '#ffffff',
                      color: isNewProduct ? '#1e40af' : '#475569',
                      fontWeight: isNewProduct ? '700' : '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Register New Drug Inline
                  </button>
                </div>
              )}

              {!isNewProduct && products.length > 0 ? (
                <div>
                  <label htmlFor="selectProduct" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Select Formulated Drug *
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
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${fieldErrors.productId ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '0.9rem',
                      background: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.productCode}) — {p.dosageForm} ({p.strength})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.productId && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.productId}
                    </span>
                  )}
                </div>
              ) : (
                /* Inline New Product Registration Fields */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="newProductName" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Medicine Commercial Name *
                    </label>
                    <input
                      id="newProductName"
                      type="text"
                      value={formData.newProductName}
                      onChange={(e) => {
                        setFormData({ ...formData, newProductName: e.target.value });
                        if (fieldErrors.newProductName) setFieldErrors({ ...fieldErrors, newProductName: null });
                      }}
                      placeholder="e.g. Paracetamol 500mg Tablets"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${fieldErrors.newProductName ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    />
                    {fieldErrors.newProductName && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.newProductName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="genericName" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Generic Active Ingredient
                    </label>
                    <input
                      id="genericName"
                      type="text"
                      value={formData.genericName}
                      onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                      placeholder="e.g. Acetaminophen"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="productCode" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Product Code / NDC *
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
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${fieldErrors.productCode ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: '0.88rem',
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    />
                    {fieldErrors.productCode && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.productCode}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="category" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Category
                    </label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        background: '#ffffff',
                        outline: 'none',
                      }}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dosageForm" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Dosage Form
                    </label>
                    <select
                      id="dosageForm"
                      value={formData.dosageForm}
                      onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        background: '#ffffff',
                        outline: 'none',
                      }}
                    >
                      {DOSAGE_FORMS.map((form) => (
                        <option key={form} value={form}>
                          {form}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{ padding: '11px 24px', fontSize: '0.92rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Continue to Batch Details</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: BATCH SERIALIZATION & QUANTITY                                    */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                  <Package style={{ width: '22px', height: '22px' }} />
                  Step 2: Batch Serialization & Production Quantity
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Specify unique lot serialization number and manufactured package volume.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="batchNumber" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Unique Batch Number / Lot ID *
                  </label>
                  <input
                    id="batchNumber"
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, batchNumber: e.target.value.toUpperCase() });
                      if (fieldErrors.batchNumber) setFieldErrors({ ...fieldErrors, batchNumber: null });
                    }}
                    placeholder="e.g. BATCH-2026-PARA-001"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${fieldErrors.batchNumber ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      outline: 'none',
                    }}
                  />
                  {fieldErrors.batchNumber && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.batchNumber}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="quantity" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Production Quantity *
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
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${fieldErrors.quantity ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                  {fieldErrors.quantity && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.quantity}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="unit" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Unit Classification
                  </label>
                  <input
                    id="unit"
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. Boxes, Vials, Bottles"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary"
                  style={{ padding: '11px 20px', fontSize: '0.88rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft style={{ width: '16px', height: '16px' }} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{ padding: '11px 24px', fontSize: '0.92rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Continue to Dates & Facility</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: DATES & CLEANROOM FACILITY                                         */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                  <Clock style={{ width: '22px', height: '22px' }} />
                  Step 3: Manufacturing Dates & Cleanroom Facility
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Enter manufacturing date, expiration window, and storage criteria.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label htmlFor="mfgDate" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
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
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${fieldErrors.manufacturingDate ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                  {fieldErrors.manufacturingDate && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.manufacturingDate}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="expDate" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
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
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${fieldErrors.expiryDate ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                  {fieldErrors.expiryDate && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.expiryDate}
                    </span>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="facilityLocation" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Facility Cleanroom Location
                  </label>
                  <input
                    id="facilityLocation"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Sterile Cleanroom Suite 4, Boston MA"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="storageRequirements" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Storage & Cold-Chain Criteria
                  </label>
                  <input
                    id="storageRequirements"
                    type="text"
                    value={formData.storageRequirements}
                    onChange={(e) => setFormData({ ...formData, storageRequirements: e.target.value })}
                    placeholder="e.g. Store at controlled room temperature 15°C to 25°C"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary"
                  style={{ padding: '11px 20px', fontSize: '0.88rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft style={{ width: '16px', height: '16px' }} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{ padding: '11px 24px', fontSize: '0.92rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Review Batch Before Minting</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
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
                  Step 4: Review Batch Specifications
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Please review all parameters prior to minting the SHA-256 cryptographic batch record.
                </p>
              </div>

              {/* Review Specs Summary Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>MEDICINE FORMULATION</span>
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{selectedProdObj?.name || 'Selected Formulation'}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{selectedProdObj?.dosageForm} ({selectedProdObj?.strength})</div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>PRODUCT CODE / NDC</span>
                    <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{selectedProdObj?.productCode || '-'}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>UNIQUE BATCH NUMBER</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#2563eb' }}>{formData.batchNumber.toUpperCase()}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>PRODUCTION VOLUME</span>
                    <strong style={{ color: '#0f172a' }}>{Number(formData.quantity).toLocaleString()} {formData.unit}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>MANUFACTURING DATE</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{new Date(formData.manufacturingDate).toLocaleDateString()}</span>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>EXPIRY DATE</span>
                    <span style={{ fontWeight: '600', color: '#059669' }}>{new Date(formData.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
                  Cleanroom Facility: <strong style={{ color: '#334155' }}>{formData.location}</strong>
                </div>
              </div>

              {submitting ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <RefreshCw style={{ width: '32px', height: '32px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>{submitStageText || 'Creating batch...'}</div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>Please do not close or refresh this page.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px', fontSize: '0.88rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit3 style={{ width: '16px', height: '16px' }} />
                    <span>Edit Parameters</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateBatchSubmit}
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', fontSize: '0.98rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span>Mint & Register Batch</span>
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
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 style={{ width: '36px', height: '36px', color: '#ffffff' }} />
              </div>

              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: '#ecfdf5',
                  color: '#047857',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  marginBottom: '10px',
                  border: '1px solid #a7f3d0',
                }}
              >
                BATCH CREATED & CRYPTOGRAPHICALLY ANCHORED
              </div>

              <h2 style={{ fontSize: '1.7rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Batch #{createdBatchResult.batchNumber} Minted
              </h2>

              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                Production lot has been recorded to the ledger. The QR code below can be printed on physical packaging for public authenticity scanning.
              </p>

              {/* QR Code Card */}
              <div style={{ marginBottom: '28px' }}>
                <QRCodeGenerator
                  identifier={createdBatchResult.qrIdentifier || createdBatchResult.batchNumber}
                  batchNumber={createdBatchResult.batchNumber}
                  productName={selectedProdObj?.name}
                  size={200}
                />
              </div>

              {/* Cryptographic Hash Summary Card */}
              {createdBatchResult.batchHash && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    marginBottom: '28px',
                    textAlign: 'left',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                    SHA-256 Batch Hash Proof
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#1e293b', wordBreak: 'break-all' }}>
                    {createdBatchResult.batchHash}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to={`/manufacturer/batches/${createdBatchResult._id}`}
                  className="btn btn-primary"
                  style={{ padding: '11px 22px', fontSize: '0.9rem', fontWeight: '700' }}
                >
                  View Batch Details
                </Link>

                <Link
                  to={`/verify/${createdBatchResult.qrIdentifier || createdBatchResult.batchNumber}`}
                  className="btn btn-secondary"
                  style={{ padding: '11px 20px', fontSize: '0.9rem', fontWeight: '600' }}
                >
                  Test Public QR Verification
                </Link>

                <button
                  type="button"
                  onClick={resetFormToStart}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '11px 18px',
                    fontSize: '0.9rem',
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
