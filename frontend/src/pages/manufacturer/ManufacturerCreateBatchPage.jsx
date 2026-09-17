<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useEffect, useState } from 'react';
>>>>>>> origin/main
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function ManufacturerCreateBatchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
<<<<<<< HEAD
  const [useExistingProduct, setUseExistingProduct] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');

  // Form Fields matching specification
  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    category: 'Antibiotics & Anti-Infectives',
    dosageForm: 'Capsule (500mg)',
    batchNumber: '',
    quantity: 10000,
    unit: 'Bottles',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: 'Cleanroom Facility #1, Boston MA',
    description: 'Controlled room temperature between 15°C and 25°C. Keep dry.',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.getProducts({ limit: 100 });
        if (res.success && res.products.length > 0) {
          setProducts(res.products);
          setSelectedProductId(res.products[0]._id);
          setFormData((prev) => ({
            ...prev,
            medicineName: res.products[0].name,
            genericName: res.products[0].genericName || '',
            category: res.products[0].category || prev.category,
            dosageForm: res.products[0].dosageForm || prev.dosageForm,
          }));
        } else {
          setUseExistingProduct(false);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    loadProducts();
  }, []);

  const handleProductSelectChange = (productId) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p._id === productId);
    if (prod) {
      setFormData((prev) => ({
        ...prev,
        medicineName: prod.name,
        genericName: prod.genericName || '',
        category: prod.category || prev.category,
        dosageForm: `${prod.dosageForm || ''} ${prod.strength || ''}`.trim(),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!formData.batchNumber.trim()) {
      setError('Unique Batch Lot Number is required.');
      return;
    }

    if (new Date(formData.expiryDate) <= new Date(formData.manufacturingDate)) {
      setError('Expiry date must be strictly after the manufacturing date.');
      return;
    }

    if (formData.quantity <= 0) {
      setError('Production quantity must be at least 1.');
      return;
    }

    setLoading(true);

    try {
      let finalProductId = selectedProductId;

      // If user is registering a brand new product
      if (!useExistingProduct || !finalProductId) {
        const cleanProductCode = `NDC-${formData.medicineName.replace(/\s+/g, '-').toUpperCase().slice(0, 6)}-${Math.floor(100 + Math.random() * 900)}`;
        const prodRes = await api.createProduct({
          name: formData.medicineName,
          genericName: formData.genericName,
          category: formData.category,
          dosageForm: formData.dosageForm,
          productCode: cleanProductCode,
          description: formData.description,
          storageRequirements: formData.description,
        });

        if (!prodRes.success) {
          setError(`Product registration failed: ${prodRes.message}`);
          setLoading(false);
          return;
        }
        finalProductId = prodRes.product._id;
      }

      // Mint Batch
      const batchRes = await api.createBatch({
        productId: finalProductId,
=======
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mode: select existing or register new inline
  const [isNewProduct, setIsNewProduct] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    // If new product:
    newProductName: '',
    genericName: '',
    category: 'Antibiotic / Anti-Infective',
    dosageForm: 'Capsule',
    strength: '500mg',
    productCode: '',
    // Batch Info:
    batchNumber: '',
    quantity: 10000,
    unit: 'Units',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: user?.organization?.address || 'Primary Cleanroom Facility #1',
    storageRequirements: 'Store at controlled room temperature (15°C to 25°C)',
    description: '',
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await api.getProducts({ limit: 100 });
        if (res.success) {
          setProducts(res.products);
          if (res.products.length > 0) {
            setFormData((prev) => ({ ...prev, productId: res.products[0]._id }));
          } else {
            setIsNewProduct(true);
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validation
    if (!formData.batchNumber.trim()) {
      setError('Batch number is required.');
      return;
    }

    if (Number(formData.quantity) <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    const mfgDate = new Date(formData.manufacturingDate);
    const expDate = new Date(formData.expiryDate);

    if (expDate <= mfgDate) {
      setError('Expiry date must be after manufacturing date.');
      return;
    }

    setSubmitting(true);

    try {
      let targetProductId = formData.productId;

      // If user is registering a new product inline:
      if (isNewProduct) {
        if (!formData.newProductName.trim() || !formData.productCode.trim()) {
          setError('Medicine Name and Product Code are required.');
          setSubmitting(false);
          return;
        }

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

        if (!prodRes.success) {
          setError(prodRes.message || 'Failed to register new medicine formulary.');
          setSubmitting(false);
          return;
        }

        targetProductId = prodRes.product._id;
      }

      if (!targetProductId) {
        setError('Please select or register a pharmaceutical medicine formulation.');
        setSubmitting(false);
        return;
      }

      const batchPayload = {
        productId: targetProductId,
>>>>>>> origin/main
        batchNumber: formData.batchNumber.trim().toUpperCase(),
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
        quantity: Number(formData.quantity),
<<<<<<< HEAD
        unit: formData.unit,
        location: formData.location,
        storageRequirements: formData.description,
      });

      if (batchRes.success) {
        const createdBatchId = batchRes.batch._id;
        navigate(`/manufacturer/batches/${createdBatchId}?created=true`);
      } else {
        setError(batchRes.message || 'Failed to create batch.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while creating batch.');
    } finally {
      setLoading(false);
=======
        unit: formData.unit.trim() || 'Units',
        location: formData.location.trim(),
        storageRequirements: formData.storageRequirements.trim(),
      };

      const res = await api.createBatch(batchPayload);

      if (res.success && res.batch) {
        setSuccessMsg(`✓ Batch #${res.batch.batchNumber} created successfully! Redirecting...`);
        setTimeout(() => {
          navigate(`/manufacturer/batches/${res.batch._id}`);
        }, 1200);
      } else {
        setError(res.message || 'Failed to create batch.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during batch creation.');
    } finally {
      setSubmitting(false);
>>>>>>> origin/main
    }
  };

  return (
<<<<<<< HEAD
    <div style={{ maxWidth: '840px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Back Link & Header */}
=======
    <div style={{ maxWidth: '820px', margin: '30px auto 80px', padding: '0 20px' }}>
>>>>>>> origin/main
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/manufacturer/batches"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
        >
<<<<<<< HEAD
          ← Back to Medicines / Batches
        </Link>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '8px', color: '#1e293b' }}>
          ⚙️ Create & Serialize Production Batch
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Mint an authentic pharmaceutical batch into the supply-chain ledger
        </p>
      </div>

      <div className="glass-card" style={{ padding: '32px', background: '#ffffff' }}>
=======
          ← Back to Batches
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '36px', background: '#ffffff' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>
            ➕ Create & Mint New Pharmaceutical Batch
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Enter medicine details, serialization lot number, quantity, and manufacturing parameters.
          </p>
        </div>

>>>>>>> origin/main
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
<<<<<<< HEAD
              padding: '12px 14px',
=======
              padding: '12px 16px',
>>>>>>> origin/main
              color: '#b91c1c',
              fontSize: '0.85rem',
              marginBottom: '20px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

<<<<<<< HEAD
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Medicine Information */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1d4ed8', letterSpacing: '0.04em' }}>
                1. MEDICINE & PRODUCT INFORMATION
              </h3>
              {products.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseExistingProduct(!useExistingProduct)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  {useExistingProduct ? '+ Create New Formulary Drug' : '↺ Select Existing Drug'}
=======
        {successMsg && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              color: '#047857',
              fontSize: '0.85rem',
              marginBottom: '20px',
              fontWeight: '600',
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Section 1: Medicine Information */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1d4ed8', letterSpacing: '0.04em' }}>
                1. MEDICINE FORMULATION INFORMATION
              </h4>

              {products.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsNewProduct(!isNewProduct)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {isNewProduct ? '← Select Existing Drug' : '+ Register New Formulation'}
>>>>>>> origin/main
                </button>
              )}
            </div>

<<<<<<< HEAD
            {useExistingProduct && products.length > 0 ? (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  SELECT REGISTERED FORMULARY PRODUCT *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelectChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
=======
            {!isNewProduct && products.length > 0 ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  SELECT MEDICINE *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                  }}
>>>>>>> origin/main
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.productCode}) — {p.dosageForm}
                    </option>
                  ))}
                </select>
              </div>
<<<<<<< HEAD
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  MEDICINE NAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.medicineName}
                  onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                  placeholder="e.g. Amoxicillin Trihydrate"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  GENERIC / ACTIVE INGREDIENT
                </label>
                <input
                  type="text"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  placeholder="e.g. Amoxicillin"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  MEDICINE CATEGORY
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                >
                  <option value="Antibiotics & Anti-Infectives">Antibiotics & Anti-Infectives</option>
                  <option value="Cardiovascular & Blood">Cardiovascular & Blood</option>
                  <option value="Analgesics & Anti-Inflammatory">Analgesics & Anti-Inflammatory</option>
                  <option value="Oncology & Immunotherapy">Oncology & Immunotherapy</option>
                  <option value="Vaccines & Biologics">Vaccines & Biologics</option>
                  <option value="General Pharmaceutical">General Pharmaceutical</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  DOSAGE & FORM
                </label>
                <input
                  type="text"
                  value={formData.dosageForm}
                  onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                  placeholder="e.g. Oral Capsule (500mg)"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  MANUFACTURER NAME
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.organization?.name || user?.name || 'Verified Manufacturer'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', background: '#f1f5f9' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Batch & Manufacturing Information */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#059669', marginBottom: '14px', letterSpacing: '0.04em' }}>
              2. BATCH SERIALIZATION & QUANTITY
            </h3>
=======
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    MEDICINE NAME *
                  </label>
                  <input
                    type="text"
                    required={isNewProduct}
                    value={formData.newProductName}
                    onChange={(e) => setFormData({ ...formData, newProductName: e.target.value })}
                    placeholder="e.g. Paracetamol 500mg"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    GENERIC NAME
                  </label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Acetaminophen"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    PRODUCT CODE / NDC *
                  </label>
                  <input
                    type="text"
                    required={isNewProduct}
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    placeholder="e.g. PARA-500MG-TAB"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    CATEGORY
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                  >
                    <option value="Antibiotic / Anti-Infective">Antibiotic / Anti-Infective</option>
                    <option value="Analgesic / Pain">Analgesic / Pain</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Biological / Vaccine">Biological / Vaccine</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="General Pharmaceutical">General Pharmaceutical</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    DOSAGE FORM
                  </label>
                  <input
                    type="text"
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    placeholder="e.g. Tablet, Capsule, Syrup"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    STRENGTH
                  </label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Batch & Serialization Information */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#059669', marginBottom: '14px', letterSpacing: '0.04em' }}>
              2. SERIALIZATION & BATCH SPECIFICATIONS
            </h4>
>>>>>>> origin/main

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  UNIQUE BATCH NUMBER *
                </label>
                <input
                  type="text"
                  required
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
<<<<<<< HEAD
                  placeholder="e.g. BATCH-2026-AMOX-880"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    color: '#1e3a8a',
                  }}
=======
                  placeholder="e.g. BATCH-2026-PARA-001"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: '600' }}
>>>>>>> origin/main
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
<<<<<<< HEAD
                  QUANTITY PRODUCED *
=======
                  MANUFACTURER NAME
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.organization?.name || 'Manufacturer'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', background: '#f1f5f9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  QUANTITY *
>>>>>>> origin/main
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
<<<<<<< HEAD
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
=======
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="10000"
>>>>>>> origin/main
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
<<<<<<< HEAD
                  PACKAGING UNIT
=======
                  UNIT CLASSIFICATION
>>>>>>> origin/main
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
<<<<<<< HEAD
                  placeholder="e.g. Bottles, Vials, Blisters"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

=======
                  placeholder="e.g. Bottles, Boxes, Vials"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Manufacturing Dates & Location */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#7c3aed', marginBottom: '14px', letterSpacing: '0.04em' }}>
              3. MANUFACTURING DATES & FACILITY
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
>>>>>>> origin/main
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  MANUFACTURING DATE *
                </label>
                <input
                  type="date"
                  required
                  value={formData.manufacturingDate}
                  onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
                  EXPIRY DATE *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
<<<<<<< HEAD
                  MANUFACTURING FACILITY / LOCATION
=======
                  MANUFACTURING LOCATION / CLEANROOM FACILITY
>>>>>>> origin/main
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
<<<<<<< HEAD
                  placeholder="e.g. GMP Cleanroom #2, Cambridge MA Facility"
=======
                  placeholder="e.g. Sterile Cleanroom Suite 4, Boston MA"
>>>>>>> origin/main
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
<<<<<<< HEAD
                  STORAGE REQUIREMENTS & DESCRIPTION
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Store at controlled room temp 15°C to 25°C. Protect from moisture."
=======
                  STORAGE & HANDLING REQUIREMENTS
                </label>
                <input
                  type="text"
                  value={formData.storageRequirements}
                  onChange={(e) => setFormData({ ...formData, storageRequirements: e.target.value })}
                  placeholder="e.g. Store at controlled room temperature 15°C to 25°C"
>>>>>>> origin/main
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/manufacturer/batches')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
            >
              {loading ? 'Creating Batch...' : '⚙️ Create Batch'}
            </button>
          </div>
=======
          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ padding: '14px', fontSize: '1rem', marginTop: '6px' }}
          >
            {submitting ? 'Creating & Registering Batch...' : 'Create Batch & Generate Proof'}
          </button>
>>>>>>> origin/main
        </form>
      </div>
    </div>
  );
}
