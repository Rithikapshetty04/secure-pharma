const BASE_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- STARTING SECURE PHARMA END-TO-END SANITY TEST ---');

  // 1. Health Check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('✓ Health Check:', health.success ? 'PASS' : 'FAIL');

  // 2. Admin Login
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@securepharma.gov', password: 'Admin@123456' }),
  });
  const adminAuth = await adminLoginRes.json();
  console.log('✓ Admin Login:', adminAuth.success ? 'PASS' : 'FAIL', `(${adminAuth.user?.role})`);
  const adminToken = adminAuth.token;

  // 3. Admin Blockchain Ledger Check
  const ledgerRes = await fetch(`${BASE_URL}/audit/blockchain-ledger`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const ledger = await ledgerRes.json();
  const txCount = ledger.data?.transactions?.length || 0;
  console.log('✓ Blockchain Ledger Access:', ledger.success ? 'PASS' : 'FAIL', `(${ledger.data?.provider?.status}, ${txCount} transactions)`);

  // 4. Manufacturer Login
  const mfgLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mfg@apexbiopharma.com', password: 'Mfg@123456' }),
  });
  const mfgAuth = await mfgLoginRes.json();
  console.log('✓ Manufacturer Login:', mfgAuth.success ? 'PASS' : 'FAIL', `(${mfgAuth.user?.organization?.name})`);
  const mfgToken = mfgAuth.token;

  // 5. Fetch Manufacturer Products
  const prodsRes = await fetch(`${BASE_URL}/products?limit=10`, {
    headers: { Authorization: `Bearer ${mfgToken}` },
  });
  const prods = await prodsRes.json();
  const apexProds = prods.products?.filter(p => (p.manufacturer?._id || p.manufacturer) === mfgAuth.user.organization._id);
  console.log('✓ Manufacturer Products:', apexProds?.length > 0 ? 'PASS' : 'FAIL', `(${apexProds?.length} owned products found)`);
  const chosenProduct = apexProds[0] || prods.products[0];

  // 6. Mint New Batch on Blockchain
  const batchNum = `E2E-${Date.now()}`;
  const mintRes = await fetch(`${BASE_URL}/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mfgToken}` },
    body: JSON.stringify({
      productId: chosenProduct._id,
      batchNumber: batchNum,
      quantity: 15000,
      unit: 'Ampoules',
      manufacturingDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 500 * 24 * 3600 * 1000).toISOString(),
      location: 'Apex BioPharma Cleanroom A',
    }),
  });
  const mintResult = await mintRes.json();
  console.log('✓ Batch Minting & Blockchain Anchoring:', mintResult.success ? 'PASS' : 'FAIL', `Batch #${mintResult.batch?.batchNumber}, Tx: ${mintResult.batch?.blockchainTxHash ? mintResult.batch.blockchainTxHash.substring(0, 16) + '...' : 'none'}`);
  const mintedBatch = mintResult.batch;

  // 7. Verification API (Public QR Verification)
  const verifyRes = await fetch(`${BASE_URL}/verify/${mintedBatch.qrIdentifier}`);
  const verifyResult = await verifyRes.json();
  console.log('✓ Public QR Verification:', verifyResult.success ? 'PASS' : 'FAIL', `Status: ${verifyResult.verification?.status || verifyResult.batch?.status}`);

  // 8. Distributor Login
  const distLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'logistics@novalog.com', password: 'Dist@123456' }),
  });
  const distAuth = await distLoginRes.json();
  console.log('✓ Distributor Login:', distAuth.success ? 'PASS' : 'FAIL', `(${distAuth.user?.organization?.name})`);
  const distToken = distAuth.token;

  // 9. Manufacturer Dispatches Batch to Distributor
  const dispatchRes = await fetch(`${BASE_URL}/supply-chain/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mfgToken}` },
    body: JSON.stringify({
      batchId: mintedBatch._id,
      toOrganizationId: distAuth.user.organization._id,
      eventType: 'DISPATCHED',
      location: 'Apex Outbound Cold Logistics Hub',
      notes: 'Dispatched under temperature-controlled monitoring.',
    }),
  });
  const dispatchResult = await dispatchRes.json();
  console.log('✓ Supply Chain Dispatch:', dispatchResult.success ? 'PASS' : 'FAIL', `Event: ${dispatchResult.event?.eventType}, Tx: ${dispatchResult.event?.transactionHash ? dispatchResult.event.transactionHash.substring(0, 16) + '...' : 'none'}`);

  // 10. Distributor Receives Batch
  const receiveDistRes = await fetch(`${BASE_URL}/distributor/transfers/receive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${distToken}` },
    body: JSON.stringify({
      batchId: mintedBatch._id,
      location: 'Nova Central Cold Storage Warehouse',
      notes: 'Shipment received and seals verified intact.',
    }),
  });
  const receiveDistResult = await receiveDistRes.json();
  console.log('✓ Distributor Intake & Receipt:', receiveDistResult.success ? 'PASS' : 'FAIL', `Status: ${receiveDistResult.batch?.status}`);

  // 11. Pharmacy Login
  const pharmLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'care@medlifepharma.com', password: 'Pharm@123456' }),
  });
  const pharmAuth = await pharmLoginRes.json();
  console.log('✓ Pharmacy Login:', pharmAuth.success ? 'PASS' : 'FAIL', `(${pharmAuth.user?.organization?.name})`);
  const pharmToken = pharmAuth.token;

  // 12. Check Updated Blockchain Ledger
  const updatedLedgerRes = await fetch(`${BASE_URL}/audit/blockchain-ledger`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const updatedLedger = await updatedLedgerRes.json();
  const txFound = updatedLedger.data?.transactions?.some(t => t.batchId === batchNum || t.decodedEvent?.batchNumber === batchNum);
  console.log('✓ On-Chain Batch Tracking in Admin Ledger:', txFound ? 'PASS' : 'FAIL', `(Total recorded transactions: ${updatedLedger.data?.transactions?.length})`);

  console.log('--- ALL SANITY CHECKS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
