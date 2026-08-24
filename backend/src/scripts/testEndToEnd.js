const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('   SECURE PHARMA FULL END-TO-END AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`[TEST] ${name.padEnd(55, '.')} `);
    try {
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Health Check
  await test('1. Backend API Health Check', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Health check failed');
  });

  // 2. Public Batch Verification
  await test('2. Public 9-Point Batch Verification (Seed Batch)', async () => {
    const res = await fetch(`${BASE_URL}/api/verify/BATCH-2026-TEST-001`);
    const data = await res.json();
    if (!res.ok || data.status !== 'AUTHENTIC' || !data.verified) {
      throw new Error(`Expected AUTHENTIC, got ${data.status}`);
    }
  });

  // 3. Super Admin Login
  let adminToken = '';
  await test('3. Super Admin Login & JWT Issuance', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@securepharma.gov',
        password: 'SuperAdmin@123456',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.message || 'Admin login failed');
    adminToken = data.token;
  });

  // 4. Register New Organization & License Document
  const testEmail = `e2e_mfg_${Date.now()}@pharmatrust.org`;
  const testLicenseNumber = `MFG-E2E-${Date.now()}`;
  let registeredUserId = '';

  await test('4. Register Organization with License Document Upload', async () => {
    const dummyCertPath = path.join(__dirname, 'dummy_test_license.png');
    if (!fs.existsSync(dummyCertPath)) {
      // 1x1 transparent PNG buffer
      const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      fs.writeFileSync(dummyCertPath, pngBuffer);
    }

    const formData = new FormData();
    formData.append('name', 'Dr. Ronald Sterling');
    formData.append('email', testEmail);
    formData.append('password', 'TestPass@123456');
    formData.append('confirmPassword', 'TestPass@123456');
    formData.append('organizationName', 'Sterling Pharmaceuticals Labs');
    formData.append('organizationType', 'MANUFACTURER');
    formData.append('licenseNumber', testLicenseNumber);
    formData.append('licenseType', 'MANUFACTURING');
    formData.append('address', '888 BioDrive, Raleigh NC');

    const fileBlob = new Blob([fs.readFileSync(dummyCertPath)], { type: 'image/png' });
    formData.append('licenseDocument', fileBlob, 'license_cert.png');

    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Registration failed');
    registeredUserId = data.user.id;
  });

  // 5. Verification Status Lookup
  await test('5. Verification Status Lookup for Pending Entity', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/verification-status?email=${encodeURIComponent(testEmail)}`);
    const data = await res.json();
    if (!res.ok || data.accountStatus !== 'PENDING') {
      throw new Error(`Expected PENDING status, got ${data.accountStatus}`);
    }
  });

  // 6. Regulator Reviews & Approves License
  let newlyApprovedLicId = '';
  await test('6. Regulator License Review & Approval Workflow', async () => {
    // Get pending licenses
    const licRes = await fetch(`${BASE_URL}/api/licenses?status=PENDING`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const licData = await licRes.json();
    const targetLicense = licData.licenses.find((l) => l.licenseNumber === testLicenseNumber);
    if (!targetLicense) throw new Error('Target pending license not found in review queue');

    newlyApprovedLicId = targetLicense._id;

    // Approve
    const appRes = await fetch(`${BASE_URL}/api/licenses/${newlyApprovedLicId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ remarks: 'E2E Inspection Verified.' }),
    });
    const appData = await appRes.json();
    if (!appRes.ok || !appData.success) throw new Error(appData.message || 'License approval failed');
  });

  // 7. Login as Newly Approved Manufacturer
  let mfgToken = '';
  await test('7. Authenticate Newly Approved Organization', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'TestPass@123456' }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.message || 'Approved entity login failed');
    mfgToken = data.token;
  });

  // 8. Create Formulary Drug
  let newProductId = '';
  const testProductCode = `E2E-DRUG-${Date.now()}`;
  await test('8. Register New Formulary Drug Specification', async () => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mfgToken}`,
      },
      body: JSON.stringify({
        name: 'Sterling BioVance 250mg',
        genericName: 'BioVance Sodium',
        brandName: 'SterlingVance',
        productCode: testProductCode,
        regulatoryApprovalNumber: 'NDC-99882-101-01',
        category: 'Antibiotic / Anti-Infective',
        dosageForm: 'Capsule',
        strength: '250mg',
        packageSize: '60 Capsules / Bottle',
        description: 'E2E Validated therapeutic capsule.',
        storageRequirements: 'Store at 15°C to 25°C',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.product) throw new Error(data.message || 'Drug registration failed');
    newProductId = data.product._id;
  });

  // 9. Mint Production Batch with Cryptographic Hash & QR
  let newBatchNumber = `BATCH-E2E-${Date.now()}`;
  let newBatchId = '';
  let newBatchQrId = '';
  await test('9. Mint Serialized Batch with SHA-256 Fingerprint', async () => {
    const res = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mfgToken}`,
      },
      body: JSON.stringify({
        productId: newProductId,
        batchNumber: newBatchNumber,
        manufacturingDate: new Date(),
        expiryDate: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000),
        quantity: 5000,
        unit: 'Bottles',
        storageRequirements: 'Standard 20°C',
        location: 'Cleanroom Suite 2, Raleigh NC',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.batch) throw new Error(data.message || 'Batch minting failed');
    newBatchId = data.batch._id;
    newBatchQrId = data.batch.qrIdentifier;
  });

  // 10. Record Custody Handover Event
  await test('10. Log Supply Chain Custody Handover Event', async () => {
    const res = await fetch(`${BASE_URL}/api/supply-chain/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mfgToken}`,
      },
      body: JSON.stringify({
        batchId: newBatchId,
        eventType: 'DISPATCHED',
        location: 'Sterling Freight Terminal, Raleigh NC',
        quantity: 5000,
        notes: 'Dispatched to verified regional logistics depot.',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Event recording failed');
  });

  // 11. Public Verification of Newly Minted Batch
  await test('11. Public QR Verification of Newly Minted Batch', async () => {
    const res = await fetch(`${BASE_URL}/api/verify/${newBatchQrId}`);
    const data = await res.json();
    if (!res.ok || data.status !== 'AUTHENTIC' || !data.verified) {
      throw new Error(`Expected AUTHENTIC status for new batch, got ${data.status}`);
    }
  });

  // 12. 21 CFR Part 11 Audit Trail Verification
  await test('12. Inspect Regulatory 21 CFR Audit Trail', async () => {
    const res = await fetch(`${BASE_URL}/api/audit-logs?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.logs) || data.logs.length === 0) {
      throw new Error('Audit trail empty or inaccessible');
    }
  });

  // 13. Regulatory Notifications Verification
  await test('13. Notifications Center Retrieval & Read Status', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.notifications)) {
      throw new Error('Notification retrieval failed');
    }
  });

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEndToEndTests();
