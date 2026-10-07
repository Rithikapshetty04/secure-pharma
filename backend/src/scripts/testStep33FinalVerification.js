/**
 * SECURE PHARMA — STEP 33 FINAL PROJECT-WIDE VERIFICATION SUITE
 * 
 * Comprehensive end-to-end integration, security, role authorization,
 * blockchain confirmation, QR verification, and deployment readiness test.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
    throw new Error(message);
  } else {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  }
}

function makeRequest(method, endpoint, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

function makeMultipartUpload(endpoint, fields, fileField, filePath, headers = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const url = new URL(endpoint, BASE_URL);

    let bodyParts = [];

    for (const [key, val] of Object.entries(fields)) {
      bodyParts.push(
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`)
      );
    }

    if (filePath && fs.existsSync(filePath)) {
      const filename = path.basename(filePath);
      const fileData = fs.readFileSync(filePath);
      bodyParts.push(
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`)
      );
      bodyParts.push(fileData);
      bodyParts.push(Buffer.from('\r\n'));
    }

    bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBody = Buffer.concat(bodyParts);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function runStep33FinalVerification() {
  console.log('================================================================================');
  console.log('  SECURE PHARMA — STEP 33 FINAL PROJECT-WIDE VERIFICATION PASS');
  console.log('================================================================================\n');

  const timestamp = Date.now();
  let adminToken = '';
  let mfgToken = '';
  let mfgOrgId = '';
  let distToken = '';
  let distOrgId = '';
  let pharmToken = '';
  let pharmOrgId = '';

  let createdProductCode = `NDC-S33-${timestamp.toString().slice(-6)}`;
  let testBatchId = `LOT-S33-${timestamp}`;
  let batchQrIdentifier = '';
  let onChainTxHash = '';
  let createdOrderId = '';

  try {
    // -------------------------------------------------------------------------
    // 1. HEALTH & CONNECTIVITY
    // -------------------------------------------------------------------------
    console.log('--- 1. Core API & System Health Verification ---');
    const healthRes = await makeRequest('GET', '/api/health');
    assert(healthRes.status === 200, 'Health endpoint responds with HTTP 200 OK');
    assert(healthRes.data.success === true, 'System status reports healthy and online');
    assert(healthRes.data.message.includes('Secure Pharma backend is running'), 'Health service confirmation verified');

    // -------------------------------------------------------------------------
    // 2. AUTHENTICATION & LOGIN
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Governance & Entity Authentication ---');
    
    // Admin Login
    const adminLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'superadmin@securepharma.gov',
      password: 'SuperAdmin@123456',
    });
    assert(adminLogin.status === 200, 'SuperAdmin login successful (HTTP 200)');
    assert(adminLogin.data.token && adminLogin.data.user?.role === 'SUPER_ADMIN', 'SuperAdmin token and role verified');
    adminToken = adminLogin.data.token;

    // Distributor Login
    const distLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'logistics@novalog.com',
      password: 'Dist@123456',
    });
    assert(distLogin.status === 200, 'Authorized Distributor login successful (HTTP 200)');
    distToken = distLogin.data.token;
    distOrgId = distLogin.data.user?.organization?._id || distLogin.data.user?.organization;

    // Pharmacy Login
    const pharmLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'care@medlifepharma.com',
      password: 'Pharm@123456',
    });
    assert(pharmLogin.status === 200, 'Authorized Pharmacy login successful (HTTP 200)');
    pharmToken = pharmLogin.data.token;
    pharmOrgId = pharmLogin.data.user?.organization?._id || pharmLogin.data.user?.organization;

    // Invalid Login Rejection
    const invalidLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'superadmin@securepharma.gov',
      password: 'WrongPassword!123',
    });
    assert(invalidLogin.status === 401, 'Invalid password correctly rejected with HTTP 401');

    // -------------------------------------------------------------------------
    // 3. REGISTRATION & LICENSE ONBOARDING WORKFLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Stakeholder Registration & License Governance ---');
    const dummyPdf = path.join(__dirname, `test_license_${timestamp}.pdf`);
    fs.writeFileSync(dummyPdf, '%PDF-1.4\n1 0 obj\n<< /Title (Regulatory License) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

    const mfgEmail = `mfg_${timestamp}@apexbiopharma.com`;
    const mfgLicNo = `LIC-S33-${timestamp}`;

    const regRes = await makeMultipartUpload(
      '/api/auth/register',
      {
        name: `Director ${timestamp}`,
        email: mfgEmail,
        password: 'Password@123456',
        confirmPassword: 'Password@123456',
        organizationName: `Apex Biopharma Lot ${timestamp}`,
        organizationType: 'MANUFACTURER',
        licenseNumber: mfgLicNo,
        licenseType: 'MANUFACTURING',
        address: '500 Pharma Way, Cambridge, MA',
        contactPhone: '+1-617-555-0199',
      },
      'licenseDocument',
      dummyPdf
    );

    if (fs.existsSync(dummyPdf)) fs.unlinkSync(dummyPdf);

    assert(regRes.status === 201, 'Manufacturer registration accepted with HTTP 201');
    assert(regRes.data.user?.accountStatus === 'PENDING', 'New registration placed in PENDING approval state');

    // Attempt login before approval
    const preApprovalLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: mfgEmail,
      password: 'Password@123456',
    });
    assert(preApprovalLogin.status === 403, 'Unapproved stakeholder login blocked (HTTP 403)');

    // Admin reviews license
    const licensesRes = await makeRequest('GET', '/api/licenses?status=PENDING', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(licensesRes.status === 200, 'Admin successfully queried pending licenses');
    const targetLicense = (licensesRes.data?.data?.licenses || licensesRes.data?.licenses || []).find((l) => l.licenseNumber === mfgLicNo);
    assert(Boolean(targetLicense), `Admin located pending license record #${mfgLicNo}`);

    // Admin approves license
    const approveRes = await makeRequest(
      'PATCH',
      `/api/licenses/${targetLicense._id}/approve`,
      { Authorization: `Bearer ${adminToken}` },
      { remarks: 'Verified against State Board of Pharmacy Registry.' }
    );
    assert(approveRes.status === 200, 'Admin approved regulatory license (HTTP 200)');

    // Approved stakeholder logs in
    const postApprovalLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: mfgEmail,
      password: 'Password@123456',
    });
    assert(postApprovalLogin.status === 200, 'Approved stakeholder successfully logs in');
    mfgToken = postApprovalLogin.data.token;
    mfgOrgId = postApprovalLogin.data.user?.organization?._id || postApprovalLogin.data.user?.organization;

    // -------------------------------------------------------------------------
    // 4. FORMULARY PRODUCT & PRODUCTION BATCH REGISTRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Formulary Product & Production Batch Registration ---');
    const productRes = await makeRequest(
      'POST',
      '/api/products',
      { Authorization: `Bearer ${mfgToken}` },
      {
        productCode: createdProductCode,
        name: `Amoxicillin Trihydrate ${timestamp.toString().slice(-4)}`,
        genericName: 'Amoxicillin',
        category: 'ANTIBIOTIC',
        dosageForm: 'Capsule',
        strength: '500mg',
        unitPrice: 12.5,
        storageRequirements: 'Store below 25C',
      }
    );
    const productId = productRes.data?.data?.product?._id || productRes.data?.product?._id;
    assert(Boolean(productId), `Formulary product registered with code ${createdProductCode}`);

    // Manufacturer creates batch
    const mfgDate = new Date();
    const expDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year ahead
    const batchRes = await makeRequest(
      'POST',
      '/api/batches',
      { Authorization: `Bearer ${mfgToken}` },
      {
        productId,
        batchNumber: testBatchId,
        manufacturingDate: mfgDate.toISOString(),
        expiryDate: expDate.toISOString(),
        quantity: 5000,
        unitPrice: 12.5,
      }
    );
    assert(batchRes.status === 201, `Manufacturer created batch #${testBatchId} (HTTP 201)`);
    const createdBatch = batchRes.data.batch || batchRes.data.data?.batch;
    const blockchainRecord = batchRes.data.blockchainRecord || batchRes.data.blockchain;
    assert(Boolean(createdBatch?.qrIdentifier), 'Tamper-evident QR identifier generated');
    batchQrIdentifier = createdBatch.qrIdentifier;
    assert(Boolean(blockchainRecord?.transactionHash), 'Real blockchain transaction hash generated');
    onChainTxHash = blockchainRecord.transactionHash;
    console.log(`    -> Anchored on Blockchain: Tx ${onChainTxHash.slice(0, 16)}... Block #${blockchainRecord.blockNumber}`);

    // -------------------------------------------------------------------------
    // 5. PUBLIC QR VERIFICATION (ZERO-AUTH FRESH LOOKUP)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Public QR Verification & Cryptographic Proof ---');
    const publicVerifyRes = await makeRequest('GET', `/api/verify/${encodeURIComponent(batchQrIdentifier)}`);
    assert(publicVerifyRes.status === 200, 'Public QR verification accessible without authentication');
    assert(publicVerifyRes.data.status === 'AUTHENTIC', 'Verification status is AUTHENTIC');
    assert(publicVerifyRes.data.blockchainVerification?.status === 'VERIFIED', 'Cryptographic on-chain verification confirmed');
    assert(publicVerifyRes.data.timeline?.length === 1, 'Initial timeline has exactly 1 MANUFACTURED checkpoint');

    // -------------------------------------------------------------------------
    // 6. MANUFACTURER -> DISTRIBUTOR CUSTODIAL TRANSFER
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Manufacturer → Distributor Custodial Transfer ---');
    const mfgTransferRes = await makeRequest(
      'POST',
      '/api/supply-chain/events',
      { Authorization: `Bearer ${mfgToken}` },
      {
        batchId: createdBatch._id,
        eventType: 'DISPATCHED',
        toOrganizationId: distOrgId,
        quantity: 5000,
        location: 'Apex Regional Distribution Center, Boston MA',
        notes: 'Dispatched in cold-chain logistics transport.',
      }
    );
    assert(mfgTransferRes.status === 200 || mfgTransferRes.status === 201, 'Manufacturer dispatched batch to Distributor');

    // -------------------------------------------------------------------------
    // 7. DISTRIBUTOR RECEIVING & INVENTORY INGESTION
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Distributor Receiving & Inventory Ingestion ---');
    const distReceiveRes = await makeRequest(
      'POST',
      '/api/distributor/transfers/receive',
      { Authorization: `Bearer ${distToken}` },
      {
        batchId: createdBatch._id,
        location: 'Novalog Logistics Central Hub, Newark NJ',
        notes: 'Cold chain temperature verified within 2-8C range.',
      }
    );
    assert(distReceiveRes.status === 200, 'Distributor confirmed receipt of shipment');

    // Verify appears in distributor inventory
    const distInvRes = await makeRequest('GET', '/api/distributor/inventory', {
      Authorization: `Bearer ${distToken}`,
    });
    assert(distInvRes.status === 200, 'Distributor queried active inventory');
    const foundInInv = (distInvRes.data.inventory || []).some((b) => b.batchNumber === testBatchId);
    assert(foundInInv, `Batch #${testBatchId} present in active distributor inventory`);

    // -------------------------------------------------------------------------
    // 8. PHARMACY COMMERCE & ORDER FULFILLMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Pharmacy Commerce & Order Fulfillment ---');
    // Add to cart
    const addToCartRes = await makeRequest(
      'POST',
      '/api/pharmacy/cart/items',
      { Authorization: `Bearer ${pharmToken}` },
      {
        batchId: createdBatch._id,
        quantity: 500,
      }
    );
    assert(addToCartRes.status === 200, 'Pharmacy added batch to procurement cart');

    // Place Purchase Order
    const placeOrderRes = await makeRequest(
      'POST',
      '/api/orders',
      { Authorization: `Bearer ${pharmToken}` },
      {
        distributorId: distOrgId,
        deliveryAddress: 'MedLife Dispensary #12, 100 Main St, Boston MA',
      }
    );
    assert(placeOrderRes.status === 201, 'Pharmacy placed commercial purchase order');
    const createdOrder = placeOrderRes.data.order || placeOrderRes.data.data?.order;
    createdOrderId = createdOrder?.orderId || createdOrder?._id;

    // Distributor confirms order
    const confirmOrderRes = await makeRequest(
      'PATCH',
      `/api/distributor/orders/${createdOrder._id}/status`,
      { Authorization: `Bearer ${distToken}` },
      { status: 'CONFIRMED' }
    );
    assert(confirmOrderRes.status === 200, `Distributor confirmed order #${createdOrderId}`);

    // -------------------------------------------------------------------------
    // 9. DISTRIBUTOR -> PHARMACY CUSTODIAL TRANSFER & DISPATCH
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Distributor → Pharmacy Custodial Transfer ---');
    const distTransferRes = await makeRequest(
      'POST',
      '/api/distributor/transfers/dispatch',
      { Authorization: `Bearer ${distToken}` },
      {
        batchId: createdBatch._id,
        toOrganizationId: pharmOrgId,
        quantity: 500,
        location: 'Novalog Logistics Outbound Dock, Newark NJ',
        notes: 'Dispatched to MedLife Hospital Dispensary.',
      }
    );
    assert(distTransferRes.status === 200 || distTransferRes.status === 201, 'Distributor dispatched batch to Pharmacy');

    // -------------------------------------------------------------------------
    // 10. PHARMACY INWARD RECEIVING & DISPENSARY STOCKING
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Pharmacy Inward Receiving & Custody Settlement ---');
    const pharmReceiveRes = await makeRequest(
      'POST',
      '/api/pharmacy/transfers/receive',
      { Authorization: `Bearer ${pharmToken}` },
      {
        batchId: createdBatch._id,
        location: 'MedLife Pharmacy Dispensary Storage Vault, Boston MA',
        notes: 'Seal inspected. Integrity certified for patient dispensing.',
      }
    );
    assert(pharmReceiveRes.status === 200, 'Pharmacy received and logged batch into dispensary');

    // Verify in pharmacy received inventory
    const pharmReceivedRes = await makeRequest('GET', '/api/pharmacy/received', {
      Authorization: `Bearer ${pharmToken}`,
    });
    assert(pharmReceivedRes.status === 200, 'Pharmacy queried received inventory');
    const foundInPharm = (pharmReceivedRes.data.batches || []).some((b) => b.batchNumber === testBatchId);
    assert(foundInPharm, `Batch #${testBatchId} present in pharmacy received dispensary stock`);

    // -------------------------------------------------------------------------
    // 11. END-TO-END SUPPLY CHAIN TRACEABILITY (ALL CHECKPOINTS)
    // -------------------------------------------------------------------------
    console.log('\n--- 11. Complete Supply Chain Traceability Audit ---');
    const finalVerifyRes = await makeRequest('GET', `/api/verify/${encodeURIComponent(batchQrIdentifier)}`);
    assert(finalVerifyRes.status === 200, 'Final public QR verification retrieved');
    assert(finalVerifyRes.data.status === 'AUTHENTIC', 'Final product authenticity verified');
    const timeline = finalVerifyRes.data.timeline || [];
    assert(timeline.length >= 4, `Complete timeline reflects at least 4 logged checkpoints (Actual: ${timeline.length})`);
    
    const eventSequence = timeline.map((e) => e.eventType);
    console.log(`    -> Recorded sequence: ${eventSequence.join(' -> ')}`);
    assert(eventSequence[0] === 'MANUFACTURED', 'First event is MANUFACTURED');
    assert(eventSequence.includes('DISPATCHED') || eventSequence.includes('TRANSFERRED'), 'Dispatched event present');
    assert(eventSequence.includes('RECEIVED'), 'Received event present');

    // -------------------------------------------------------------------------
    // 12. ROLE-BASED SECURITY & IDOR INTEGRITY CHECKS
    // -------------------------------------------------------------------------
    console.log('\n--- 12. Security, IDOR & Cross-Role Access Defenses ---');
    
    // Pharmacy cannot create batches
    const pharmCreateBatch = await makeRequest(
      'POST',
      '/api/batches',
      { Authorization: `Bearer ${pharmToken}` },
      { batchNumber: `FORGED-${timestamp}`, productCode: createdProductCode, quantity: 100 }
    );
    assert(pharmCreateBatch.status === 403, 'Pharmacy attempting batch creation blocked (HTTP 403)');

    // Manufacturer cannot access admin users
    const mfgAdminAccess = await makeRequest('GET', '/api/admin/users', {
      Authorization: `Bearer ${mfgToken}`,
    });
    assert(mfgAdminAccess.status === 403, 'Manufacturer attempting Admin access blocked (HTTP 403)');

    // Distributor cannot access pharmacy cart
    const distCartAccess = await makeRequest('GET', '/api/pharmacy/cart', {
      Authorization: `Bearer ${distToken}`,
    });
    assert(distCartAccess.status === 403, 'Distributor attempting Pharmacy Cart access blocked (HTTP 403)');

    // Unauthenticated request to audit log
    const unauthAudit = await makeRequest('GET', '/api/audit');
    assert(unauthAudit.status === 401, 'Unauthenticated request to /api/audit rejected (HTTP 401)');

    // Duplicate receiving blocked
    const duplicateReceive = await makeRequest(
      'POST',
      '/api/pharmacy/transfers/receive',
      { Authorization: `Bearer ${pharmToken}` },
      { batchId: createdBatch._id }
    );
    assert(duplicateReceive.status === 400 || duplicateReceive.status === 403, 'Duplicate inward receipt blocked');

    // Invalid non-existent QR lookup fails safely
    const invalidQrRes = await makeRequest('GET', '/api/verify/SP-DOES-NOT-EXIST-9999');
    assert(invalidQrRes.status === 200, 'Invalid QR query responds safely without server error');
    assert(invalidQrRes.data.status === 'NOT_FOUND', 'Invalid QR lookup correctly returns NOT_FOUND status');

    // -------------------------------------------------------------------------
    // 13. ADMIN AUDIT & IMMUTABLE LOG OBSERVABILITY
    // -------------------------------------------------------------------------
    console.log('\n--- 13. Admin Audit & Blockchain Monitoring Telemetry ---');
    const adminAuditRes = await makeRequest('GET', `/api/audit?search=${encodeURIComponent(testBatchId)}`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminAuditRes.status === 200, 'Admin successfully queried correlated audit log');
    assert((adminAuditRes.data.logs || adminAuditRes.data.data?.logs || []).length >= 1, `Audit log correlated events for batch #${testBatchId}`);

    console.log('\n================================================================================');
    console.log(`  STEP 33 VERIFICATION SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
    console.log('================================================================================\n');

    if (totalFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('\n[FATAL ERROR IN STEP 33 TEST]:', err.message);
    process.exit(1);
  }
}

runStep33FinalVerification();
