/**
 * Secure Pharma - Step 29 Comprehensive End-to-End Supply Chain Integration Test
 * Verifies the complete real workflow from Registration to Public QR Verification.
 */
const http = require("http");

function request(options, bodyBuffer, contentType) {
  return new Promise((resolve, reject) => {
    const headers = { ...options.headers };
    if (contentType) headers["Content-Type"] = contentType;
    if (bodyBuffer) headers["Content-Length"] = Buffer.byteLength(bodyBuffer);

    const req = http.request({ ...options, headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", reject);
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

function buildMultipart(fields, fileField) {
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const parts = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
      )
    );
  }

  if (fileField) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\nContent-Type: ${fileField.contentType}\r\n\r\n`
      )
    );
    parts.push(fileField.buffer);
    parts.push(Buffer.from("\r\n"));
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const fullBuffer = Buffer.concat(parts);
  return { buffer: fullBuffer, contentType: `multipart/form-data; boundary=${boundary}` };
}

async function runStep29Integration() {
  console.log("================================================================================");
  console.log("SECURE PHARMA - STEP 29 END-TO-END SUPPLY CHAIN INTEGRATION VERIFICATION");
  console.log("================================================================================");

  const timestamp = Date.now();
  let passedTests = 0;
  let totalTests = 0;

  function assert(name, condition, extra = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${name} ${extra ? `(${extra})` : ""}`);
    } else {
      console.error(`[FAIL] ${name} ${extra ? `(${extra})` : ""}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. ADMIN AUTHENTICATION
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 1: Administrative Governance Authentication ---");
  const adminLoginRes = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST" },
    JSON.stringify({ email: "admin@securepharma.gov", password: "Admin@123456" }),
    "application/json"
  );
  const adminToken = adminLoginRes.body?.data?.token || adminLoginRes.body?.token;
  assert("Admin Authenticated via JWT", Boolean(adminToken), `Status ${adminLoginRes.status}`);

  // ---------------------------------------------------------------------------
  // 2. STAKEHOLDER REGISTRATION & DOCUMENT PROOF (MANUFACTURER)
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 2: Stakeholder Registration & License Proof ---");
  const mfgEmail = `mfg_${timestamp}@roche.com`;
  const mfgLicNumber = `LIC-ROCHE-${timestamp}`;
  const dummyPdf = Buffer.from("%PDF-1.4 Mock Regulatory Certificate Content For Secure Pharma Testing");

  const mfgMultipart = buildMultipart(
    {
      name: "Roche Quality Director",
      email: mfgEmail,
      password: "Password@123",
      role: "MANUFACTURER",
      organizationName: `F. Hoffmann-La Roche Ltd ${timestamp}`,
      organizationType: "MANUFACTURER",
      licenseNumber: mfgLicNumber,
      licenseType: "MANUFACTURING",
      address: "Grenzacherstrasse 124, Basel, Switzerland",
    },
    {
      name: "licenseDocument",
      filename: "roche_gmp_cert.pdf",
      contentType: "application/pdf",
      buffer: dummyPdf,
    }
  );

  const mfgRegRes = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/register", method: "POST" },
    mfgMultipart.buffer,
    mfgMultipart.contentType
  );
  assert("Manufacturer Registration with License Document", mfgRegRes.status === 201, `Status ${mfgRegRes.status}`);

  // Test that unverified user cannot log in
  const prematureLogin = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST" },
    JSON.stringify({ email: mfgEmail, password: "Password@123" }),
    "application/json"
  );
  assert(
    "Unapproved Stakeholder Access Blocked",
    prematureLogin.status === 403 && prematureLogin.body?.accountStatus === "PENDING",
    `Account status: ${prematureLogin.body?.accountStatus}`
  );

  // Admin approves manufacturer license
  const pendingLicRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/licenses?status=PENDING",
      method: "GET",
      headers: { Authorization: "Bearer " + adminToken },
    }
  );
  const mfgLic = (pendingLicRes.body?.data?.licenses || pendingLicRes.body?.licenses || []).find(
    (l) => l.licenseNumber === mfgLicNumber
  );
  assert("Admin Located Pending License Record", Boolean(mfgLic), `Lic #${mfgLicNumber}`);

  const approveRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/licenses/${mfgLic._id}/approve`,
      method: "PATCH",
      headers: { Authorization: "Bearer " + adminToken },
    },
    JSON.stringify({ remarks: "FDA/EMA Good Manufacturing Practice certified." }),
    "application/json"
  );
  assert("Admin Approved License Record", approveRes.status === 200, `Status ${approveRes.status}`);

  // Approved stakeholder can now log in
  const mfgLoginRes = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST" },
    JSON.stringify({ email: mfgEmail, password: "Password@123" }),
    "application/json"
  );
  const mfgToken = mfgLoginRes.body?.data?.token || mfgLoginRes.body?.token;
  const mfgUser = mfgLoginRes.body?.data?.user || mfgLoginRes.body?.user;
  const mfgOrgId = (mfgUser?.organization?._id || mfgUser?.organization || "").toString();
  assert("Approved Stakeholder Successfully Logged In", Boolean(mfgToken), `Org ID: ${mfgOrgId}`);

  // ---------------------------------------------------------------------------
  // 3. REJECTION WORKFLOW TEST
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 3: Stakeholder Rejection Governance Workflow ---");
  const rejEmail = `rej_${timestamp}@fakepharma.com`;
  const rejLicNumber = `LIC-FAKE-${timestamp}`;
  const rejMultipart = buildMultipart(
    {
      name: "Illicit Distributor Applicant",
      email: rejEmail,
      password: "Password@123",
      role: "DISTRIBUTOR",
      organizationName: `Shady Logistics ${timestamp}`,
      organizationType: "DISTRIBUTOR",
      licenseNumber: rejLicNumber,
      licenseType: "WHOLESALE",
      address: "Unregistered Industrial Plot",
    },
    {
      name: "licenseDocument",
      filename: "fake_cert.pdf",
      contentType: "application/pdf",
      buffer: dummyPdf,
    }
  );

  await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/register", method: "POST" },
    rejMultipart.buffer,
    rejMultipart.contentType
  );

  const pendingLicRes2 = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/licenses?status=PENDING",
      method: "GET",
      headers: { Authorization: "Bearer " + adminToken },
    }
  );
  const rejLic = (pendingLicRes2.body?.data?.licenses || pendingLicRes2.body?.licenses || []).find(
    (l) => l.licenseNumber === rejLicNumber
  );

  const rejectRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/licenses/${rejLic._id}/reject`,
      method: "PATCH",
      headers: { Authorization: "Bearer " + adminToken },
    },
    JSON.stringify({ reason: "Unregistered storage facility. Failed compliance audit." }),
    "application/json"
  );
  assert("Admin Successfully Rejected License", rejectRes.status === 200, `Status ${rejectRes.status}`);

  const rejLoginRes = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST" },
    JSON.stringify({ email: rejEmail, password: "Password@123" }),
    "application/json"
  );
  assert(
    "Rejected User Login Returns 403 with Rejection Reason",
    rejLoginRes.status === 403 && rejLoginRes.body?.accountStatus === "REJECTED",
    `Message: ${rejLoginRes.body?.message}`
  );

  // ---------------------------------------------------------------------------
  // 4. DISTRIBUTOR & PHARMACY STAKEHOLDER ACCOUNTS FOR INTEGRATION
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 4: Setting up Downstream Stakeholders (Distributor & Pharmacy) ---");
  // Login as existing approved distributor Nova Wholesale Logistics
  const distLogin = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST" },
    JSON.stringify({ email: "logistics@novalog.com", password: "Dist@123456" }),
    "application/json"
  );
  const distToken = distLogin.body?.data?.token || distLogin.body?.token;
  const distUser = distLogin.body?.data?.user || distLogin.body?.user;
  const distOrgId = (distUser?.organization?._id || distUser?.organization || "").toString();
  assert("Distributor Logged In", Boolean(distToken), `Org ID: ${distOrgId}`);

  // Login as existing approved pharmacy MedLife Central Pharmacy
  const pharmLogin = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST" },
    JSON.stringify({ email: "care@medlifepharma.com", password: "Pharm@123456" }),
    "application/json"
  );
  const pharmToken = pharmLogin.body?.data?.token || pharmLogin.body?.token;
  const pharmUser = pharmLogin.body?.data?.user || pharmLogin.body?.user;
  const pharmOrgId = (pharmUser?.organization?._id || pharmUser?.organization || "").toString();
  assert("Pharmacy Logged In", Boolean(pharmToken), `Org ID: ${pharmOrgId}`);

  // ---------------------------------------------------------------------------
  // 5. PRODUCT & BATCH CREATION (MANUFACTURER)
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 5: Formulary Product & Production Batch Creation ---");
  // Register manufacturer's own formulary product
  const createProdRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/products",
      method: "POST",
      headers: { Authorization: "Bearer " + mfgToken },
    },
    JSON.stringify({
      name: "Ocrevus (Ocrelizumab)",
      genericName: "Ocrelizumab Intravenous Solution",
      productCode: `PC-OCR-${timestamp}`,
      category: "Immunology",
      dosageForm: "Injection",
      strength: "300 mg/10 mL",
      unitPrice: 1250,
      description: "Humanized anti-CD20 monoclonal antibody",
    }),
    "application/json"
  );
  assert("Manufacturer Registered Own Formulary Product", createProdRes.status === 201, `Status ${createProdRes.status}`);
  const productId = createProdRes.body?.product?._id || createProdRes.body?.data?.product?._id;

  // Create Batch
  const batchNumber = `BATCH-E2E-${timestamp}`;
  const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const createBatchRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/batches",
      method: "POST",
      headers: { Authorization: "Bearer " + mfgToken },
    },
    JSON.stringify({
      productId,
      batchNumber,
      manufacturingDate: new Date().toISOString(),
      expiryDate,
      quantity: 500,
      unit: "Vials",
      storageRequirements: "Store refrigerated at 2°C to 8°C (36°F to 46°F)",
      location: "Roche Biotech Cleanroom Alpha, Basel",
    }),
    "application/json"
  );

  assert("Manufacturer Created Batch in Ledger", createBatchRes.status === 201, `Batch: ${batchNumber}`);
  const createdBatch = createBatchRes.body?.batch || createBatchRes.body?.data?.batch;
  const qrIdentifier = createdBatch?.qrIdentifier;
  const batchId = createdBatch?._id;

  assert("Batch Cryptographic Hash Anchored", Boolean(createdBatch?.batchHash), `Hash: ${createdBatch?.batchHash?.substring(0, 16)}...`);
  assert("Unique QR Identifier Generated", Boolean(qrIdentifier), `QR Code: ${qrIdentifier}`);
  assert("Initial Custodian Set to Manufacturer", createdBatch?.currentHolder?.toString() === mfgOrgId || createdBatch?.manufacturer?.toString() === mfgOrgId);

  // ---------------------------------------------------------------------------
  // 6. INITIAL PUBLIC QR VERIFICATION (MANUFACTURER CHECKPOINT)
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 6: Public Authenticity Verification (Post-Creation) ---");
  const pubVerify1 = await request(
    { hostname: "localhost", port: 5000, path: `/api/verify/${encodeURIComponent(batchNumber)}`, method: "GET" }
  );
  assert("Public QR Verification Accessible (No Auth Required)", pubVerify1.status === 200);
  assert("Status is AUTHENTIC", pubVerify1.body?.status === "AUTHENTIC");
  assert("Timeline Contains 1 Event (MANUFACTURED)", pubVerify1.body?.timeline?.length === 1 && pubVerify1.body?.timeline[0].eventType === "MANUFACTURED");

  // ---------------------------------------------------------------------------
  // 7. MANUFACTURER -> DISTRIBUTOR TRANSFER
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 7: Manufacturer -> Distributor Custodial Transfer ---");
  const mfgDispatchRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/supply-chain/events",
      method: "POST",
      headers: { Authorization: "Bearer " + mfgToken },
    },
    JSON.stringify({
      batchId,
      eventType: "DISPATCHED",
      toOrganizationId: distOrgId,
      quantity: 500,
      location: "Roche Intermodal Logistics Terminal, Basel",
      notes: "Temperature-controlled refrigerated freight dispatched to Nova Wholesale Logistics.",
    }),
    "application/json"
  );
  assert("Manufacturer Dispatched Shipment to Distributor", mfgDispatchRes.status === 201, `Status: ${mfgDispatchRes.body?.batchStatus}`);
  assert("Batch Status Shifted to IN_TRANSIT", mfgDispatchRes.body?.batchStatus === "IN_TRANSIT");

  // ---------------------------------------------------------------------------
  // 8. DISTRIBUTOR RECEIVING
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 8: Distributor Inward Receiving & Inventory Ingestion ---");
  const distReceiveRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/distributor/transfers/receive",
      method: "POST",
      headers: { Authorization: "Bearer " + distToken },
    },
    JSON.stringify({
      batchId,
      location: "Nova Wholesale Logistics Central Hub, Hall A",
      notes: "Cold chain telemetry verified. Sealed pallet intact.",
    }),
    "application/json"
  );
  assert("Distributor Confirmed Receipt of Shipment", distReceiveRes.status === 200, `Event: ${distReceiveRes.body?.event?.eventType}`);
  assert("Batch Status Shifted to RECEIVED", distReceiveRes.body?.batchStatus === "RECEIVED");

  // Verify batch appears in Distributor Inventory
  const distInvRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/distributor/inventory?limit=50",
      method: "GET",
      headers: { Authorization: "Bearer " + distToken },
    }
  );
  const foundInDistInv = (distInvRes.body?.inventory || []).some((b) => b._id === batchId || b.batchNumber === batchNumber);
  assert("Batch Lot Appears in Active Distributor Inventory", foundInDistInv, `Batch #${batchNumber}`);

  // ---------------------------------------------------------------------------
  // 9. DISTRIBUTOR -> PHARMACY TRANSFER
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 9: Distributor -> Pharmacy Transfer & Dispatch ---");
  const distDispatchRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/distributor/transfers/dispatch",
      method: "POST",
      headers: { Authorization: "Bearer " + distToken },
    },
    JSON.stringify({
      batchId,
      toOrganizationId: pharmOrgId,
      quantity: 500,
      location: "Nova Logistics Outbound Fleet Bay 4",
      notes: "Local medical courier transit to MedLife Central Pharmacy.",
    }),
    "application/json"
  );
  assert("Distributor Dispatched Transfer to Pharmacy", distDispatchRes.status === 201, `Status: ${distDispatchRes.body?.batchStatus}`);
  assert("Batch Status Shifted to IN_TRANSIT", distDispatchRes.body?.batchStatus === "IN_TRANSIT");

  // ---------------------------------------------------------------------------
  // 10. PHARMACY RECEIVING
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 10: Pharmacy Dispensary Receiving & Verification ---");
  const pharmReceiveRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/pharmacy/transfers/receive",
      method: "POST",
      headers: { Authorization: "Bearer " + pharmToken },
    },
    JSON.stringify({
      batchId,
      location: "MedLife Dispensary Inward Receiving Bay, Boston",
      notes: "Delivered via secured courier. Package integrity and digital seals verified.",
    }),
    "application/json"
  );
  assert("Pharmacy Confirmed Inward Receipt", pharmReceiveRes.status === 200, `Message: ${pharmReceiveRes.body?.message}`);
  assert("Batch Status Shifted to RECEIVED", pharmReceiveRes.body?.batchStatus === "RECEIVED");

  // Verify batch appears in Pharmacy Received Batches
  const pharmRecRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/pharmacy/received?search=${encodeURIComponent(batchNumber)}`,
      method: "GET",
      headers: { Authorization: "Bearer " + pharmToken },
    }
  );
  const foundInPharmRec = (pharmRecRes.body?.batches || []).some((b) => b._id === batchId || b.batchNumber === batchNumber);
  assert("Batch Lot Appears in Pharmacy Received Inventory", foundInPharmRec, `Batch #${batchNumber}`);

  // ---------------------------------------------------------------------------
  // 11. PUBLIC QR VERIFICATION AFTER FULL JOURNEY
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 11: End-to-End Public QR Verification (All 5 Provenance Checkpoints) ---");
  const pubVerifyFinal = await request(
    { hostname: "localhost", port: 5000, path: `/api/verify/${encodeURIComponent(qrIdentifier)}`, method: "GET" }
  );
  assert("Public QR Lookup by UUID Identifier Succeeded", pubVerifyFinal.status === 200);
  assert("Overall Verification Status is AUTHENTIC", pubVerifyFinal.body?.status === "AUTHENTIC");

  const timeline = pubVerifyFinal.body?.timeline || [];
  assert("Timeline Tracks Exactly 5 Complete Checkpoints", timeline.length === 5, `Events: ${timeline.map((e) => e.eventType).join(" -> ")}`);

  const expectedOrder = ["MANUFACTURED", "DISPATCHED", "RECEIVED", "TRANSFERRED", "RECEIVED"];
  const actualOrder = timeline.map((e) => e.eventType);
  const isSequenceCorrect = expectedOrder.every((evt, idx) => actualOrder[idx] === evt);
  assert("Supply-Chain Sequence Matches Expected Custody Flow", isSequenceCorrect, actualOrder.join(" -> "));

  // ---------------------------------------------------------------------------
  // 12. SECURITY & DEFENSE CHECKS (INVALID ACTIONS)
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 12: Rigorous Security & Custody Enforcement Checks ---");
  // A. Manufacturer attempts to transfer a batch they no longer own
  const illicitMfgTransfer = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/supply-chain/events",
      method: "POST",
      headers: { Authorization: "Bearer " + mfgToken },
    },
    JSON.stringify({
      batchId,
      eventType: "DISPATCHED",
      toOrganizationId: distOrgId,
      quantity: 500,
      location: "Unauthorized Facility",
    }),
    "application/json"
  );
  // Batch is now in custody of Pharmacy, so Manufacturer attempt is blocked
  assert("Manufacturer Transfer of Relinquished Custody Blocked", illicitMfgTransfer.status === 400 || illicitMfgTransfer.status === 403, `Status ${illicitMfgTransfer.status}`);

  // B. Distributor attempts to transfer batch already transferred away
  const illicitDistTransfer = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/distributor/transfers/dispatch",
      method: "POST",
      headers: { Authorization: "Bearer " + distToken },
    },
    JSON.stringify({
      batchId,
      toOrganizationId: pharmOrgId,
      quantity: 500,
    }),
    "application/json"
  );
  assert("Distributor Duplicate Transfer Blocked", illicitDistTransfer.status === 400 || illicitDistTransfer.status === 403, `Status ${illicitDistTransfer.status}`);

  // C. Pharmacy attempts duplicate receiving
  const duplicatePharmReceive = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/pharmacy/transfers/receive",
      method: "POST",
      headers: { Authorization: "Bearer " + pharmToken },
    },
    JSON.stringify({ batchId }),
    "application/json"
  );
  assert("Pharmacy Duplicate Receiving Blocked", duplicatePharmReceive.status === 400, `Message: ${duplicatePharmReceive.body?.message}`);

  // D. Distributor attempts duplicate receiving
  const duplicateDistReceive = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/distributor/transfers/receive",
      method: "POST",
      headers: { Authorization: "Bearer " + distToken },
    },
    JSON.stringify({ batchId }),
    "application/json"
  );
  assert("Distributor Duplicate Receiving Blocked", duplicateDistReceive.status === 400, `Message: ${duplicateDistReceive.body?.message}`);

  // ---------------------------------------------------------------------------
  // 13. PHARMACY COMMERCE (CART & ORDER SEPARATION)
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 13: Pharmacy Commerce & Order Separation from Custody ---");
  // Add item to cart
  const addToCartRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/pharmacy/cart/items",
      method: "POST",
      headers: { Authorization: "Bearer " + pharmToken },
    },
    JSON.stringify({
      productId,
      batchId,
      quantity: 15,
      unitPrice: 45,
    }),
    "application/json"
  );
  assert("Pharmacy Added Medicine to Cart", addToCartRes.status === 200 || addToCartRes.status === 201, `Status ${addToCartRes.status}`);

  // Create Order
  const createOrderRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/orders",
      method: "POST",
      headers: { Authorization: "Bearer " + pharmToken },
    },
    JSON.stringify({
      distributorId: distOrgId,
      shippingAddress: "MedLife Store #1042, 218 Hanover St, Boston, MA",
      notes: "Expedited replenishment order",
    }),
    "application/json"
  );
  assert("Pharmacy Purchase Order Placed Off-Chain in MongoDB", createOrderRes.status === 201, `Order ID: ${createOrderRes.body?.order?.orderId}`);
  const orderId = createOrderRes.body?.order?.orderId;

  // Distributor updates order status to CONFIRMED and PROCESSING
  if (orderId) {
    const updateOrderRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/distributor/orders/${orderId}/status`,
        method: "PATCH",
        headers: { Authorization: "Bearer " + distToken },
      },
      JSON.stringify({ status: "CONFIRMED", notes: "Order confirmed by logistics desk." }),
      "application/json"
    );
    assert("Distributor Confirmed Order Status in MongoDB", updateOrderRes.status === 200, `Status: ${updateOrderRes.body?.order?.status}`);
  }

  // ---------------------------------------------------------------------------
  // 14. ADMIN AUDIT & IMMUTABLE LEDGER MONITORING
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 14: Administrative Audit & Ledger Observability ---");
  const auditRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/audit?search=${encodeURIComponent(batchNumber)}&limit=10`,
      method: "GET",
      headers: { Authorization: "Bearer " + adminToken },
    }
  );
  assert("Admin Audit Successfully Queried Integrated Activity", auditRes.status === 200);
  const foundLogs = auditRes.body?.data?.logs || [];
  assert("Batch Appears in Admin Audit History", foundLogs.length > 0, `Found ${foundLogs.length} events matching #${batchNumber}`);

  // Check detail correlation
  if (foundLogs.length > 0) {
    const detailRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/audit/${foundLogs[0]._id}`,
        method: "GET",
        headers: { Authorization: "Bearer " + adminToken },
      }
    );
    assert("Admin Correlated Audit Inspection Modal Accessible", detailRes.status === 200);
    assert("Audit Detail Links to Real Correlated Batch", Boolean(detailRes.body?.data?.log?.correlatedBatch), `Batch #${detailRes.body?.data?.log?.correlatedBatch?.batchNumber}`);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY RESULTS
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`STEP 29 VERIFICATION COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("================================================================================");

  if (passedTests === totalTests) {
    console.log("SUCCESS: End-to-end supply chain integration is 100% verified and operational.");
    process.exit(0);
  } else {
    console.error(`FAILURE: ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

runStep29Integration().catch((err) => {
  console.error("FATAL ERROR in test execution:", err);
  process.exit(1);
});
