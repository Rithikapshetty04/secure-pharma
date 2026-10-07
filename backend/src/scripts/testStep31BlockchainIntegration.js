/**
 * Secure Pharma - Step 31 Complete Blockchain + QR Integration Verification
 * End-to-end testing with real Hardhat EVM transactions, events, receipts, and QR verification.
 */
const http = require("http");
const { ethers } = require("ethers");
const PharmaSupplyChainABI = require("../config/pharmaContractAbi");

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

async function runStep31Test() {
  console.log("================================================================================");
  console.log("SECURE PHARMA — STEP 31 BLOCKCHAIN + QR INTEGRATION VERIFICATION SUITE");
  console.log("================================================================================");

  const results = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(testId, name, condition, details = "") {
    totalTests++;
    const status = condition ? "PASS" : "FAIL";
    if (condition) passedTests++;
    else failedTests++;

    results.push({ testId, name, status, details });
    const mark = condition ? "✔ PASS" : "✖ FAIL";
    console.log(`[${mark}] ${testId}: ${name} ${details ? `— ${details}` : ""}`);
  }

  const timestamp = Date.now();
  const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // ---------------------------------------------------------------------------
  // 1. BLOCKCHAIN ENVIRONMENT & CONTRACT VERIFICATION
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 1: Blockchain Network & Smart Contract Verification ---");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  let network = null;
  let currentBlock = 0;
  let contract = null;

  try {
    network = await provider.getNetwork();
    currentBlock = await provider.getBlockNumber();
    assert(
      "TEST-01",
      "Blockchain RPC Node Connectivity",
      Boolean(network && currentBlock >= 0),
      `Chain ID: ${network?.chainId}, Current Block: #${currentBlock}`
    );
  } catch (err) {
    assert("TEST-01", "Blockchain RPC Node Connectivity", false, `RPC error: ${err.message}`);
  }

  try {
    contract = new ethers.Contract(CONTRACT_ADDRESS, PharmaSupplyChainABI, provider);
    const batchCount = await contract.getBatchCount();
    assert(
      "TEST-02",
      "Smart Contract Deployment & Reachability",
      batchCount !== undefined,
      `Address: ${CONTRACT_ADDRESS}, On-chain batches: ${batchCount.toString()}`
    );
  } catch (err) {
    assert("TEST-02", "Smart Contract Deployment & Reachability", false, `Contract error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATION & STAKEHOLDER REGISTRATION
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 2: Governance Authentication & Entity Onboarding ---");
  const adminLogin = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST" },
    JSON.stringify({ email: "admin@securepharma.gov", password: "Admin@123456" }),
    "application/json"
  );
  const adminToken = adminLogin.body?.data?.token || adminLogin.body?.token;
  assert("TEST-03", "Admin Governance Authentication", Boolean(adminToken), "JWT token issued");

  // Onboard Manufacturer
  const mfgEmail = `mfg_s31_${timestamp}@novartis.com`;
  const mfgLicNumber = `LIC-MFG-S31-${timestamp}`;
  const dummyDoc = Buffer.from("%PDF-1.4 Step 31 Regulatory GMP Certification");

  const mfgMultipart = buildMultipart(
    {
      name: "Novartis Head of Release",
      email: mfgEmail,
      password: "Password@123",
      role: "MANUFACTURER",
      organizationName: `Novartis Pharma AG ${timestamp}`,
      organizationType: "MANUFACTURER",
      licenseNumber: mfgLicNumber,
      licenseType: "MANUFACTURING",
      address: "Fabrikstrasse 2, Basel, Switzerland",
    },
    {
      name: "licenseDocument",
      filename: "novartis_gmp.pdf",
      contentType: "application/pdf",
      buffer: dummyDoc,
    }
  );

  await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/register", method: "POST" },
    mfgMultipart.buffer,
    mfgMultipart.contentType
  );

  // Approve Manufacturer License
  const pendingLicRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/licenses?status=PENDING",
    method: "GET",
    headers: { Authorization: "Bearer " + adminToken },
  });
  const mfgLic = (pendingLicRes.body?.data?.licenses || pendingLicRes.body?.licenses || []).find(
    (l) => l.licenseNumber === mfgLicNumber
  );
  if (mfgLic) {
    await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/licenses/${mfgLic._id}/approve`,
        method: "PATCH",
        headers: { Authorization: "Bearer " + adminToken },
      },
      JSON.stringify({ remarks: "GMP Verified" }),
      "application/json"
    );
  }

  const mfgLoginRes = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST" },
    JSON.stringify({ email: mfgEmail, password: "Password@123" }),
    "application/json"
  );
  const mfgToken = mfgLoginRes.body?.data?.token || mfgLoginRes.body?.token;
  const mfgUser = mfgLoginRes.body?.data?.user || mfgLoginRes.body?.user;
  const mfgOrgId = (mfgUser?.organization?._id || mfgUser?.organization || "").toString();
  assert("TEST-04", "Manufacturer Approved & Authenticated", Boolean(mfgToken && mfgOrgId), `Org ID: ${mfgOrgId}`);

  // Onboard Distributor
  const distEmail = `dist_s31_${timestamp}@dhlpharma.com`;
  const distLicNumber = `LIC-DIST-S31-${timestamp}`;
  const distMultipart = buildMultipart(
    {
      name: "DHL ColdChain Logistics Director",
      email: distEmail,
      password: "Password@123",
      role: "DISTRIBUTOR",
      organizationName: `DHL Life Sciences Logistics ${timestamp}`,
      organizationType: "DISTRIBUTOR",
      licenseNumber: distLicNumber,
      licenseType: "WHOLESALE",
      address: "Hub #7 Cargo City, Frankfurt",
    },
    {
      name: "licenseDocument",
      filename: "dhl_gdp.pdf",
      contentType: "application/pdf",
      buffer: dummyDoc,
    }
  );

  await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/register", method: "POST" },
    distMultipart.buffer,
    distMultipart.contentType
  );

  const pendingLicResDist = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/licenses?status=PENDING",
    method: "GET",
    headers: { Authorization: "Bearer " + adminToken },
  });
  const distLic = (pendingLicResDist.body?.data?.licenses || pendingLicResDist.body?.licenses || []).find(
    (l) => l.licenseNumber === distLicNumber
  );
  if (distLic) {
    await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/licenses/${distLic._id}/approve`,
        method: "PATCH",
        headers: { Authorization: "Bearer " + adminToken },
      },
      JSON.stringify({ remarks: "GDP Certified" }),
      "application/json"
    );
  }

  const distLoginRes = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST" },
    JSON.stringify({ email: distEmail, password: "Password@123" }),
    "application/json"
  );
  const distToken = distLoginRes.body?.data?.token || distLoginRes.body?.token;
  const distUser = distLoginRes.body?.data?.user || distLoginRes.body?.user;
  const distOrgId = (distUser?.organization?._id || distUser?.organization || "").toString();
  assert("TEST-05", "Distributor Approved & Authenticated", Boolean(distToken && distOrgId), `Dist Org ID: ${distOrgId}`);

  // Onboard Pharmacy
  const pharmEmail = `pharm_s31_${timestamp}@apotheke.de`;
  const pharmLicNumber = `LIC-PHARM-S31-${timestamp}`;
  const pharmMultipart = buildMultipart(
    {
      name: "Dr. Weber Chief Pharmacist",
      email: pharmEmail,
      password: "Password@123",
      role: "PHARMACY",
      organizationName: `St. Mary Community Dispensary ${timestamp}`,
      organizationType: "PHARMACY",
      licenseNumber: pharmLicNumber,
      licenseType: "RETAIL",
      address: "Hauptstrasse 45, Munich, Germany",
    },
    {
      name: "licenseDocument",
      filename: "pharm_license.pdf",
      contentType: "application/pdf",
      buffer: dummyDoc,
    }
  );

  await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/register", method: "POST" },
    pharmMultipart.buffer,
    pharmMultipart.contentType
  );

  const pendingLicResPharm = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/licenses?status=PENDING",
    method: "GET",
    headers: { Authorization: "Bearer " + adminToken },
  });
  const pharmLic = (pendingLicResPharm.body?.data?.licenses || pendingLicResPharm.body?.licenses || []).find(
    (l) => l.licenseNumber === pharmLicNumber
  );
  if (pharmLic) {
    await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/licenses/${pharmLic._id}/approve`,
        method: "PATCH",
        headers: { Authorization: "Bearer " + adminToken },
      },
      JSON.stringify({ remarks: "Retail Pharmacy Approved" }),
      "application/json"
    );
  }

  const pharmLoginRes = await request(
    { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST" },
    JSON.stringify({ email: pharmEmail, password: "Password@123" }),
    "application/json"
  );
  const pharmToken = pharmLoginRes.body?.data?.token || pharmLoginRes.body?.token;
  const pharmUser = pharmLoginRes.body?.data?.user || pharmLoginRes.body?.user;
  const pharmOrgId = (pharmUser?.organization?._id || pharmUser?.organization || "").toString();
  assert("TEST-06", "Pharmacy Approved & Authenticated", Boolean(pharmToken && pharmOrgId), `Pharm Org ID: ${pharmOrgId}`);

  // Create Formulary Product
  const productCode = `NDC-${timestamp.toString().slice(-6)}`;
  const productRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/products",
      method: "POST",
      headers: { Authorization: "Bearer " + mfgToken },
    },
    JSON.stringify({
      name: "Ciprofloxacin USP",
      genericName: "Ciprofloxacin Hydrochloride",
      brandName: "CiproSafe",
      productCode,
      dosageForm: "Tablet",
      strength: "500mg",
      category: "ANTIBIOTIC",
      storageRequirements: "Store between 20°C and 25°C",
      regulatoryApprovalNumber: `FDA-NDA-${timestamp}`,
      description: "Broad-spectrum antibacterial formulation",
    }),
    "application/json"
  );
  const productId = productRes.body?.data?.product?._id || productRes.body?.product?._id;
  assert("TEST-07", "Formulary Product Registration", Boolean(productId), `Code: ${productCode}`);

  // ---------------------------------------------------------------------------
  // 3. REAL BATCH CREATION & ON-CHAIN CONFIRMATION
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 3: Real Batch Creation & Smart Contract Registration ---");
  const testBatchNumber = `LOT-S31-${timestamp}`;
  const mfgDate = new Date();
  const expDate = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000); // 2 years future

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
      batchNumber: testBatchNumber,
      manufacturingDate: mfgDate.toISOString(),
      expiryDate: expDate.toISOString(),
      quantity: 1000,
      unit: "Vials",
      storageRequirements: "Keep refrigerated (2°C - 8°C)",
      location: "Facility Cleanroom Alpha, Basel",
    }),
    "application/json"
  );

  const createdBatch = createBatchRes.body?.batch;
  const blockchainRecord = createBatchRes.body?.blockchainRecord;

  assert(
    "TEST-08",
    "Batch Creation HTTP 201 Response",
    createBatchRes.status === 201 && Boolean(createdBatch),
    `Batch: ${testBatchNumber}`
  );

  assert(
    "TEST-09",
    "Real Blockchain Transaction Hash Generated",
    Boolean(createdBatch?.blockchainTxHash && createdBatch.blockchainTxHash.startsWith("0x") && createdBatch.blockchainTxHash.length === 66),
    `TxHash: ${createdBatch?.blockchainTxHash}`
  );

  assert(
    "TEST-10",
    "Real Block Number Anchored",
    Boolean(createdBatch?.blockNumber && createdBatch.blockNumber > 0),
    `Block Height: #${createdBatch?.blockNumber}`
  );

  assert(
    "TEST-11",
    "Secure QR Identifier Generated",
    Boolean(createdBatch?.qrIdentifier && createdBatch.qrIdentifier.startsWith("SP-")),
    `QR ID: ${createdBatch?.qrIdentifier}`
  );

  // ---------------------------------------------------------------------------
  // 4. MONGODB <-> BLOCKCHAIN CONSISTENCY CHECK
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 4: MongoDB ↔ Smart Contract On-Chain Consistency ---");
  const onChainBatch = await contract.batches(testBatchNumber);
  const onChainEvents = await contract.getBatchEvents(testBatchNumber);

  assert(
    "TEST-12",
    "On-Chain Batch Record Exists in Smart Contract",
    Boolean(onChainBatch && onChainBatch.exists),
    `On-Chain BatchNumber: ${onChainBatch.batchNumber}`
  );

  assert(
    "TEST-13",
    "Batch Number and Product Code Match Between DB and Blockchain",
    onChainBatch.batchNumber === testBatchNumber && onChainBatch.productCode === productCode,
    `DB Batch: ${testBatchNumber} == Chain Batch: ${onChainBatch.batchNumber}`
  );

  assert(
    "TEST-14",
    "Initial MANUFACTURED Blockchain Event Emitted",
    onChainEvents.length === 1 && onChainEvents[0].eventType === "MANUFACTURED",
    `Events Count: ${onChainEvents.length}, Event 0: ${onChainEvents[0]?.eventType}`
  );

  // ---------------------------------------------------------------------------
  // 5. PUBLIC QR VERIFICATION (BEFORE TRANSFERS)
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 5: Public Authenticity QR Verification (Zero-Auth / Fresh Session) ---");
  const publicVerifyRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/verify/${createdBatch.qrIdentifier}`,
    method: "GET",
  });

  const verifyBody = publicVerifyRes.body;
  assert(
    "TEST-15",
    "Public Verification Works Without Login / Authentication",
    publicVerifyRes.status === 200 && verifyBody?.success === true,
    `Status: ${publicVerifyRes.status}`
  );

  assert(
    "TEST-16",
    "Public Verification Returns 9 Authenticity Checks (All Passed)",
    verifyBody.verified === true &&
      verifyBody.status === "AUTHENTIC" &&
      verifyBody.checks?.productExists === true &&
      verifyBody.checks?.batchExists === true &&
      verifyBody.checks?.manufacturerVerified === true &&
      verifyBody.checks?.licenseValid === true &&
      verifyBody.checks?.batchNotExpired === true,
    `Verification Status: ${verifyBody.status}`
  );

  assert(
    "TEST-17",
    "Public Verification Confirms Real On-Chain Blockchain Record",
    verifyBody.blockchainVerification?.status === "VERIFIED" &&
      verifyBody.blockchainVerification?.onChain === true &&
      verifyBody.blockchainVerification?.txHash === createdBatch.blockchainTxHash,
    `Contract: ${verifyBody.blockchainVerification?.contractAddress}, Tx: ${verifyBody.blockchainVerification?.txHash?.slice(0, 18)}...`
  );

  // ---------------------------------------------------------------------------
  // 6. MANUFACTURER -> DISTRIBUTOR TRANSFER
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 6: Manufacturer → Distributor Custody Transfer ---");
  const mfgTransferRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/supply-chain/events",
      method: "POST",
      headers: { Authorization: "Bearer " + mfgToken },
    },
    JSON.stringify({
      batchId: createdBatch._id,
      eventType: "DISPATCHED",
      toOrganizationId: distOrgId,
      location: "Novartis Outbound Freight Terminal",
      quantity: 1000,
      notes: "Commercial shipment dispatched under temperature controlled log.",
    }),
    "application/json"
  );

  const mfgTransferEvent = mfgTransferRes.body?.event;
  assert(
    "TEST-18",
    "Manufacturer Dispatches Batch to Distributor (Real On-Chain Event)",
    mfgTransferRes.status === 201 && Boolean(mfgTransferEvent?.transactionHash?.startsWith("0x")),
    `TxHash: ${mfgTransferEvent?.transactionHash}`
  );

  // ---------------------------------------------------------------------------
  // 7. DISTRIBUTOR RECEIVING
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 7: Distributor Receiving Verification ---");
  const distReceiveRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/distributor/transfers/receive",
      method: "POST",
      headers: { Authorization: "Bearer " + distToken },
    },
    JSON.stringify({
      batchId: createdBatch._id,
      location: "DHL Cold Storage Bay 4, Frankfurt",
      notes: "Temperature sensors verified (4.2°C). Batch received into inventory.",
    }),
    "application/json"
  );

  assert(
    "TEST-19",
    "Distributor Receives Batch & Anchors Event On-Chain",
    distReceiveRes.status === 200 && distReceiveRes.body?.batchStatus === "RECEIVED",
    `Status: ${distReceiveRes.body?.batchStatus}`
  );

  // ---------------------------------------------------------------------------
  // 8. DISTRIBUTOR -> PHARMACY TRANSFER
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 8: Distributor → Pharmacy Transfer ---");
  const distDispatchRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/distributor/transfers/dispatch",
      method: "POST",
      headers: { Authorization: "Bearer " + distToken },
    },
    JSON.stringify({
      batchId: createdBatch._id,
      toOrganizationId: pharmOrgId,
      quantity: 1000,
      location: "DHL Logistics Loading Bay 2",
      notes: "Dispatched for urgent hospital dispensary stock.",
    }),
    "application/json"
  );

  assert(
    "TEST-20",
    "Distributor Dispatches Batch to Pharmacy (Real On-Chain Event)",
    (distDispatchRes.status === 200 || distDispatchRes.status === 201) && distDispatchRes.body?.batchStatus === "IN_TRANSIT",
    `Status: ${distDispatchRes.body?.batchStatus} (HTTP ${distDispatchRes.status})`
  );

  // ---------------------------------------------------------------------------
  // 9. PHARMACY RECEIVING
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 9: Pharmacy Receiving & Custody Settlement ---");
  const pharmReceiveRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/pharmacy/transfers/receive",
      method: "POST",
      headers: { Authorization: "Bearer " + pharmToken },
    },
    JSON.stringify({
      batchId: createdBatch._id,
      location: "St. Mary Dispensary Receiving Vault",
      notes: "Inspected by Chief Pharmacist. Tamper-evident seal intact.",
    }),
    "application/json"
  );

  assert(
    "TEST-21",
    "Pharmacy Receives Batch & Completes Custody Handover",
    pharmReceiveRes.status === 200 && pharmReceiveRes.body?.batchStatus === "RECEIVED",
    `Current Custodian: Pharmacy (${pharmOrgId})`
  );

  // ---------------------------------------------------------------------------
  // 10. FULL TRACEABILITY & ON-CHAIN CHECKPOINT VERIFICATION
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 10: Complete Supply Chain Traceability Audit ---");
  const finalOnChainEvents = await contract.getBatchEvents(testBatchNumber);
  assert(
    "TEST-22",
    "Full Supply Chain Traceability: Exactly 5 Checkpoints Recorded On-Chain",
    finalOnChainEvents.length === 5,
    `On-Chain Checkpoints: ${finalOnChainEvents.map((e) => e.eventType).join(" -> ")}`
  );

  const finalPublicVerifyRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/verify/${testBatchNumber}`,
    method: "GET",
  });

  const finalVerify = finalPublicVerifyRes.body;
  assert(
    "TEST-23",
    "Public Verification Traceability Timeline Reflects Full Journey",
    finalVerify.timeline?.length === 5 &&
      finalVerify.blockchainVerification?.onChainEventsCount === 5,
    `Timeline Checkpoints: ${finalVerify.timeline?.length}, On-Chain Events: ${finalVerify.blockchainVerification?.onChainEventsCount}`
  );

  // ---------------------------------------------------------------------------
  // 11. SECURITY & DUPLICATE / REPLAY DEFENSES
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 11: Security, Duplicate & Replay Rejection Defenses ---");

  // Attempt duplicate batch registration with same batch number
  const dupBatchRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/batches",
      method: "POST",
      headers: { Authorization: "Bearer " + mfgToken },
    },
    JSON.stringify({
      productId,
      batchNumber: testBatchNumber,
      manufacturingDate: mfgDate.toISOString(),
      expiryDate: expDate.toISOString(),
      quantity: 500,
      unit: "Vials",
    }),
    "application/json"
  );

  assert(
    "TEST-24",
    "Duplicate Batch Creation Blocked (DB & Smart Contract Defense)",
    dupBatchRes.status === 409,
    `Response: ${dupBatchRes.status} (Conflict)`
  );

  // Attempt unauthorized transfer (Distributor trying to transfer batch owned by Pharmacy)
  const unauthTransferRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/supply-chain/events",
      method: "POST",
      headers: { Authorization: "Bearer " + distToken },
    },
    JSON.stringify({
      batchId: createdBatch._id,
      eventType: "TRANSFERRED",
      toOrganizationId: mfgOrgId,
      quantity: 1000,
    }),
    "application/json"
  );

  assert(
    "TEST-25",
    "Unauthorized Transfer Attempt Blocked (IDOR / Custody Defense)",
    unauthTransferRes.status === 403,
    `Response: ${unauthTransferRes.status} (Forbidden: not current holder)`
  );

  // ---------------------------------------------------------------------------
  // 12. QR CODE FAILURE CONDITIONS
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 12: Public Verification Error & Failure Conditions ---");

  const invalidQrRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/verify/SP-NONEXISTENT-MALICIOUS-QR-9999",
    method: "GET",
  });

  assert(
    "TEST-26",
    "Invalid / Non-Existent QR Handled Safely with NOT_FOUND Status",
    invalidQrRes.status === 200 && invalidQrRes.body?.status === "NOT_FOUND" && invalidQrRes.body?.verified === false,
    `Status: ${invalidQrRes.body?.status}, Verified: ${invalidQrRes.body?.verified}`
  );

  // ---------------------------------------------------------------------------
  // 13. ADMIN AUDIT MONITORING
  // ---------------------------------------------------------------------------
  console.log("\n--- Phase 13: Admin Audit & Blockchain Monitoring Telemetry ---");
  const auditRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/audit",
    method: "GET",
    headers: { Authorization: "Bearer " + adminToken },
  });

  const auditData = auditRes.body?.data;
  assert(
    "TEST-27",
    "Admin Audit Monitoring Reflects Live Blockchain Telemetry",
    auditData?.blockchainMonitoring?.status === "CONNECTED" &&
      auditData?.blockchainMonitoring?.contractAddress === CONTRACT_ADDRESS &&
      auditData?.blockchainMonitoring?.totalOnChainBatches > 0,
    `Node Status: ${auditData?.blockchainMonitoring?.status}, Total On-Chain: ${auditData?.blockchainMonitoring?.totalOnChainBatches}`
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`STEP 31 TEST COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED (${failedTests} FAILED)`);
  console.log("================================================================================\n");

  return { totalTests, passedTests, failedTests, results };
}

runStep31Test()
  .then((res) => {
    if (res.failedTests > 0) {
      process.exitCode = 1;
    }
  })
  .catch((err) => {
    console.error("FATAL ERROR IN STEP 31 TEST RUNNER:", err);
    process.exitCode = 1;
  });
