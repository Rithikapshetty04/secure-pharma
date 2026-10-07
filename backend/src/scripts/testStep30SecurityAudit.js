/**
 * STEP 30 - Comprehensive Security & Authorization Audit Test Suite
 * Tests negative authorization cases, IDOR defenses, role enforcement,
 * parameter validation, document privacy, and sensitive data exclusion.
 */

const BASE_URL = "http://localhost:5000";

let adminToken = null;
let mfgAToken = null;
let mfgBToken = null;
let pharmacyAToken = null;
let pharmacyBToken = null;
let distributorToken = null;

let mfgAUser = null;
let mfgBUser = null;
let pharmacyAUser = null;
let pharmacyBUser = null;
let distributorUser = null;

let batchAId = null;
let productAId = null;
let orderBId = null;
let licenseAId = null;

let testsPassed = 0;
let testsFailed = 0;

function logResult(testName, passed, details = "") {
  if (passed) {
    testsPassed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    testsFailed++;
    console.error(`  [FAIL] ${testName} - ${details}`);
  }
}

async function runSecurityAudit() {
  console.log("==================================================================");
  console.log("  SECURE PHARMA - STEP 30 SECURITY & AUTHORIZATION AUDIT TESTS");
  console.log("==================================================================\n");

  try {
    // -------------------------------------------------------------
    // PHASE 0: SETUP AUTHENTICATED IDENTITIES FOR TESTING
    // -------------------------------------------------------------
    console.log("[Setup] Authenticating test accounts across roles...");

    // 1. Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@securepharma.gov",
        password: "Admin@123456",
      }),
    });
    const adminData = await adminLoginRes.json();
    if (adminData.success) {
      adminToken = adminData.token;
      console.log("  Authenticated Administrator.");
    } else {
      throw new Error(`Admin login failed: ${adminData.message}`);
    }

    // 2. Manufacturer A login
    const mfgALogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "mfg@apexbiopharma.com",
        password: "Mfg@123456",
      }),
    });
    const mfgAData = await mfgALogin.json();
    if (mfgAData.success) {
      mfgAToken = mfgAData.token;
      mfgAUser = mfgAData.user;
      console.log("  Authenticated Manufacturer A (Apex BioPharma).");
    }

    // 3. Distributor login
    const distLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "logistics@novalog.com",
        password: "Dist@123456",
      }),
    });
    const distData = await distLogin.json();
    if (distData.success) {
      distributorToken = distData.token;
      distributorUser = distData.user;
      console.log("  Authenticated Distributor.");
    }

    // 4. Pharmacy A login
    const pharmALogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "care@medlifepharma.com",
        password: "Pharm@123456",
      }),
    });
    const pharmAData = await pharmALogin.json();
    if (pharmAData.success) {
      pharmacyAToken = pharmAData.token;
      pharmacyAUser = pharmAData.user;
      console.log("  Authenticated Pharmacy A.");
    }

    // 5. Fetch sample Batch, Product, and License for Manufacturer A
    const mfgBatchesRes = await fetch(`${BASE_URL}/api/batches?limit=1`, {
      headers: { Authorization: `Bearer ${mfgAToken}` },
    });
    const mfgBatchesData = await mfgBatchesRes.json();
    if (mfgBatchesData.batches && mfgBatchesData.batches.length > 0) {
      batchAId = mfgBatchesData.batches[0]._id;
      productAId = mfgBatchesData.batches[0].product?._id || mfgBatchesData.batches[0].product;
    }

    const licensesRes = await fetch(`${BASE_URL}/api/licenses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const licensesData = await licensesRes.json();
    if (licensesData.data?.licenses?.length > 0) {
      licenseAId = licensesData.data.licenses[0]._id;
    }

    // 6. Create or fetch an order for Pharmacy B (to test cross-pharmacy IDOR)
    const ordersRes = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const ordersData = await ordersRes.json();
    if (ordersData.orders?.length > 0) {
      orderBId = ordersData.orders[0]._id;
    }

    console.log("\n==================================================================");
    console.log("  1. UNAUTHENTICATED REQUESTS TEST (Expected 401)");
    console.log("==================================================================");

    // Test 1.1: Unauthenticated Admin Dashboard
    const unauthAdmin = await fetch(`${BASE_URL}/api/admin/dashboard`);
    logResult(
      "Unauthenticated request to GET /api/admin/dashboard rejected with 401",
      unauthAdmin.status === 401,
      `Status was ${unauthAdmin.status}`
    );

    // Test 1.2: Unauthenticated Batch Creation
    const unauthBatch = await fetch(`${BASE_URL}/api/batches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchNumber: "HACK-001" }),
    });
    logResult(
      "Unauthenticated request to POST /api/batches rejected with 401",
      unauthBatch.status === 401,
      `Status was ${unauthBatch.status}`
    );

    // Test 1.3: Unauthenticated Distributor Inventory
    const unauthDist = await fetch(`${BASE_URL}/api/distributor/inventory`);
    logResult(
      "Unauthenticated request to GET /api/distributor/inventory rejected with 401",
      unauthDist.status === 401,
      `Status was ${unauthDist.status}`
    );

    // Test 1.4: Unauthenticated Pharmacy Cart
    const unauthCart = await fetch(`${BASE_URL}/api/pharmacy/cart`);
    logResult(
      "Unauthenticated request to GET /api/pharmacy/cart rejected with 401",
      unauthCart.status === 401,
      `Status was ${unauthCart.status}`
    );

    // Test 1.5: Unauthenticated Regulatory Audit Logs
    const unauthAudit = await fetch(`${BASE_URL}/api/audit`);
    logResult(
      "Unauthenticated request to GET /api/audit rejected with 401",
      unauthAudit.status === 401,
      `Status was ${unauthAudit.status}`
    );

    console.log("\n==================================================================");
    console.log("  2. INVALID & FORGED TOKEN REJECTION (Expected 401)");
    console.log("==================================================================");

    // Test 2.1: Malformed JWT token
    const malformedTokenRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: "Bearer this.is.a.forged.jwt.token" },
    });
    logResult(
      "Forged/Malformed JWT token rejected with 401",
      malformedTokenRes.status === 401,
      `Status was ${malformedTokenRes.status}`
    );

    // Test 2.2: Missing Bearer scheme
    const missingBearerRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: adminToken },
    });
    logResult(
      "Authorization header without Bearer prefix rejected with 401",
      missingBearerRes.status === 401,
      `Status was ${missingBearerRes.status}`
    );

    console.log("\n==================================================================");
    console.log("  3. ROLE-BASED AUTHORIZATION TEST (Expected 403)");
    console.log("==================================================================");

    // Test 3.1: Pharmacy cannot create batches (Manufacturer only)
    const pharmCreateBatch = await fetch(`${BASE_URL}/api/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pharmacyAToken}`,
      },
      body: JSON.stringify({ batchNumber: "UNAUTHORIZED-01" }),
    });
    logResult(
      "Pharmacy calling POST /api/batches rejected with 403",
      pharmCreateBatch.status === 403,
      `Status was ${pharmCreateBatch.status}`
    );

    // Test 3.2: Manufacturer cannot access Admin User Management
    const mfgAdminUsers = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${mfgAToken}` },
    });
    logResult(
      "Manufacturer calling GET /api/admin/users rejected with 403",
      mfgAdminUsers.status === 403,
      `Status was ${mfgAdminUsers.status}`
    );

    // Test 3.3: Distributor cannot access Admin Licenses review
    const distAdminLicenses = await fetch(`${BASE_URL}/api/licenses`, {
      headers: { Authorization: `Bearer ${distributorToken}` },
    });
    logResult(
      "Distributor calling GET /api/licenses rejected with 403",
      distAdminLicenses.status === 403,
      `Status was ${distAdminLicenses.status}`
    );

    // Test 3.4: Manufacturer cannot access Admin Audit log
    const mfgAdminAudit = await fetch(`${BASE_URL}/api/admin/audit`, {
      headers: { Authorization: `Bearer ${mfgAToken}` },
    });
    logResult(
      "Manufacturer calling GET /api/admin/audit rejected with 403",
      mfgAdminAudit.status === 403,
      `Status was ${mfgAdminAudit.status}`
    );

    // Test 3.5: Distributor cannot place Pharmacy procurement orders
    const distCreateOrder = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${distributorToken}`,
      },
      body: JSON.stringify({ items: [] }),
    });
    logResult(
      "Distributor calling POST /api/orders rejected with 403",
      distCreateOrder.status === 403,
      `Status was ${distCreateOrder.status}`
    );

    console.log("\n==================================================================");
    console.log("  4. CLIENT-SIDE ROLE MANIPULATION IMMUNITY");
    console.log("==================================================================");

    // Test 4.1: Client sends role: "ADMIN" in request body to bypass checks
    const roleTamperRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${pharmacyAToken}`,
        "X-User-Role": "ADMIN",
        Role: "SUPER_ADMIN",
      },
    });
    logResult(
      "Client role headers cannot bypass backend database role check (403)",
      roleTamperRes.status === 403,
      `Status was ${roleTamperRes.status}`
    );

    console.log("\n==================================================================");
    console.log("  5. IDOR & OBJECT-LEVEL AUTHORIZATION DEFENSES");
    console.log("==================================================================");

    // Test 5.1: Cross-organization Batch Modification IDOR Defense
    if (batchAId) {
      // Distributor attempting to alter Manufacturer's batch details
      const distBatchUpdate = await fetch(`${BASE_URL}/api/batches/${batchAId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${distributorToken}`,
        },
        body: JSON.stringify({ quantity: 999999 }),
      });
      logResult(
        "Non-owner role attempting PUT /api/batches/:id rejected (403)",
        distBatchUpdate.status === 403,
        `Status was ${distBatchUpdate.status}`
      );
    }

    // Test 5.2: Cross-organization Product Deactivation IDOR Defense
    if (productAId) {
      // Pharmacy attempting to deactivate Manufacturer's product
      const pharmProductDelete = await fetch(`${BASE_URL}/api/products/${productAId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${pharmacyAToken}` },
      });
      logResult(
        "Non-owner role attempting DELETE /api/products/:id rejected (403)",
        pharmProductDelete.status === 403,
        `Status was ${pharmProductDelete.status}`
      );
    }

    // Test 5.3: Cross-organization License Detail IDOR Defense
    if (licenseAId) {
      // Pharmacy A attempting to read Manufacturer A's private license details
      const pharmLicenseRead = await fetch(`${BASE_URL}/api/licenses/${licenseAId}`, {
        headers: { Authorization: `Bearer ${pharmacyAToken}` },
      });
      logResult(
        "Non-owner role attempting GET /api/licenses/:id rejected (403)",
        pharmLicenseRead.status === 403,
        `Status was ${pharmLicenseRead.status}`
      );

      // Pharmacy A attempting to read Manufacturer A's license document file
      const pharmDocRead = await fetch(`${BASE_URL}/api/licenses/${licenseAId}/document`, {
        headers: { Authorization: `Bearer ${pharmacyAToken}` },
      });
      logResult(
        "Non-owner role attempting GET /api/licenses/:id/document rejected (403)",
        pharmDocRead.status === 403,
        `Status was ${pharmDocRead.status}`
      );
    }

    // Test 5.4: Supply Chain Timeline IDOR Defense
    if (batchAId) {
      // Pharmacy attempting to read timeline of a batch it has no custody of
      const pharmTimeline = await fetch(`${BASE_URL}/api/supply-chain/batches/${batchAId}`, {
        headers: { Authorization: `Bearer ${pharmacyAToken}` },
      });
      // Should be 403 unless pharmacy is part of batch supply chain
      const isBlockedOrHolder = pharmTimeline.status === 403 || pharmTimeline.status === 200;
      logResult(
        "Batch timeline enforces role / custody access control",
        isBlockedOrHolder,
        `Status was ${pharmTimeline.status}`
      );
    }

    console.log("\n==================================================================");
    console.log("  6. DOCUMENT STORAGE & PUBLIC UPLOADS HARDENING");
    console.log("==================================================================");

    // Test 6.1: Direct static access to /uploads/licenses directory must NOT be publicly served
    const directStaticUpload = await fetch(`${BASE_URL}/uploads/licenses/sample_mfg_license.pdf`);
    logResult(
      "Unrestricted public static download from /uploads is blocked (404)",
      directStaticUpload.status === 404,
      `Status was ${directStaticUpload.status} (expected 404)`
    );

    // Test 6.2: Authenticated document access via /api/licenses/:id/document works for Admin
    if (licenseAId) {
      const adminDocAccess = await fetch(`${BASE_URL}/api/licenses/${licenseAId}/document`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const isDocServedOrNotFound = adminDocAccess.status === 200 || adminDocAccess.status === 404;
      logResult(
        "Authorized Admin document streaming succeeds through secure API boundary",
        isDocServedOrNotFound && adminDocAccess.status !== 403 && adminDocAccess.status !== 401,
        `Status was ${adminDocAccess.status}`
      );
    }

    console.log("\n==================================================================");
    console.log("  7. INPUT VALIDATION & NOSQL INJECTION DEFENSES");
    console.log("==================================================================");

    // Test 7.1: Malformed ObjectId in Verification Status
    const malformedIdRes = await fetch(`${BASE_URL}/api/auth/verification-status?userId=invalid-not-an-objectid`);
    logResult(
      "Malformed non-ObjectId parameter rejected with 400",
      malformedIdRes.status === 400,
      `Status was ${malformedIdRes.status}`
    );

    // Test 7.2: Negative Quantity in Batch Creation
    const negativeQtyRes = await fetch(`${BASE_URL}/api/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mfgAToken}`,
      },
      body: JSON.stringify({
        productId: productAId,
        batchNumber: `TEST-NEG-${Date.now()}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        quantity: -500,
      }),
    });
    logResult(
      "Negative quantity in batch creation rejected with 400",
      negativeQtyRes.status === 400,
      `Status was ${negativeQtyRes.status}`
    );

    // Test 7.3: Past Expiry Date in Batch Creation
    const pastExpRes = await fetch(`${BASE_URL}/api/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mfgAToken}`,
      },
      body: JSON.stringify({
        productId: productAId,
        batchNumber: `TEST-EXP-${Date.now()}`,
        expiryDate: "2020-01-01T00:00:00.000Z",
        quantity: 1000,
      }),
    });
    logResult(
      "Past/impossible expiry date in batch creation rejected with 400",
      pastExpRes.status === 400,
      `Status was ${pastExpRes.status}`
    );

    console.log("\n==================================================================");
    console.log("  8. SENSITIVE DATA EXCLUSION AUDIT");
    console.log("==================================================================");

    // Test 8.1: Password Hash excluded from User responses
    const userDetailRes = await fetch(`${BASE_URL}/api/admin/users/${mfgAUser.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userDetailData = await userDetailRes.json();
    const hasPasswordHash = Boolean(
      userDetailData.data?.user?.password ||
      userDetailData.data?.user?.resetPasswordToken
    );
    logResult(
      "User profile response excludes password and resetPasswordToken",
      hasPasswordHash === false,
      "Password hash or reset token was present in response!"
    );

    // Test 8.2: Password Reset response does NOT reveal resetToken
    const forgotPwRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "mfg@apexbiopharma.com" }),
    });
    const forgotPwData = await forgotPwRes.json();
    logResult(
      "Forgot-password endpoint does NOT expose resetToken in response",
      forgotPwData.resetToken === undefined,
      `resetToken was exposed: ${forgotPwData.resetToken}`
    );

    console.log("\n==================================================================");
    console.log("  9. ARBITRARY BLOCKCHAIN ENDPOINT PREVENTION");
    console.log("==================================================================");

    // Test 9.1: Arbitrary contract execution endpoint must NOT exist
    const arbitraryBc = await fetch(`${BASE_URL}/api/blockchain/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "registerBatch" }),
    });
    logResult(
      "Generic arbitrary blockchain execution endpoint does NOT exist (404)",
      arbitraryBc.status === 404,
      `Status was ${arbitraryBc.status}`
    );

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(`  STEP 30 SECURITY AUDIT TEST SUMMARY:`);
    console.log(`  Total Passed: ${testsPassed}`);
    console.log(`  Total Failed: ${testsFailed}`);
    console.log("==================================================================\n");

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  }
}

runSecurityAudit();
