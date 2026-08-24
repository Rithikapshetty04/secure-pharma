import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("PharmaSupplyChain Contract", async function () {
  it("should register a batch and record supply chain events", async function () {
    const { viem } = await network.create();
    const [owner, distributor] = await viem.getWalletClients();

    const pharmaSupplyChain = await viem.deployContract("PharmaSupplyChain");

    const batchNo = "BATCH-2026-TEST-001";
    const productCode = "AMOX-500MG";
    const mfgOrg = "Apex BioPharma";
    const mfgLocation = "Facility #4, Boston MA";
    const initialHash = "0x1234567890abcdef";

    await pharmaSupplyChain.write.registerBatch([
      batchNo,
      productCode,
      mfgOrg,
      mfgLocation,
      initialHash,
    ]);

    const batchInfo = await pharmaSupplyChain.read.batches([batchNo]);
    assert.equal(batchInfo[0], batchNo);
    assert.equal(batchInfo[1], productCode);
    assert.equal(batchInfo[3], mfgOrg);
    assert.equal(batchInfo[5], true);

    // Record a SHIPPED event
    await pharmaSupplyChain.write.recordEvent([
      batchNo,
      "SHIPPED",
      "Apex Logistics",
      "Transit Hub #2, NY",
      "0xabcdef1234567890",
    ]);

    const events = await pharmaSupplyChain.read.getBatchEvents([batchNo]);
    assert.equal(events.length, 2);
    assert.equal(events[0].eventType, "MANUFACTURED");
    assert.equal(events[1].eventType, "SHIPPED");
  });
});
