const crypto = require("crypto");
const fs = require("fs");

class BlockchainService {
  /**
   * Generates a SHA-256 hash for uploaded regulatory documents for tamper detection
   */
  static generateDocumentHash(filePathOrBuffer) {
    try {
      if (Buffer.isBuffer(filePathOrBuffer)) {
        return crypto.createHash("sha256").update(filePathOrBuffer).digest("hex");
      }
      if (typeof filePathOrBuffer === "string" && fs.existsSync(filePathOrBuffer)) {
        const fileBuffer = fs.readFileSync(filePathOrBuffer);
        return crypto.createHash("sha256").update(fileBuffer).digest("hex");
      }
      return crypto.createHash("sha256").update(String(filePathOrBuffer)).digest("hex");
    } catch (err) {
      console.error("Error generating document hash:", err.message);
      return `0x${crypto.randomBytes(32).toString("hex")}`;
    }
  }

  /**
   * Generates an immutable cryptographic hash for a pharmaceutical production batch
   */
  static generateBatchHash({
    batchNumber,
    productCode,
    manufacturingDate,
    expiryDate,
    quantity,
    manufacturerId,
  }) {
    const payload = [
      batchNumber,
      productCode,
      new Date(manufacturingDate).toISOString(),
      new Date(expiryDate).toISOString(),
      String(quantity),
      String(manufacturerId),
    ].join("::");

    return `0x${crypto.createHash("sha256").update(payload).digest("hex")}`;
  }

  /**
   * Generates an immutable cryptographic hash for supply chain custodial transitions
   */
  static generateSupplyChainEventHash({
    batchNumber,
    eventType,
    fromOrgId,
    toOrgId,
    location,
    timestamp,
    previousHash = "",
  }) {
    const payload = [
      batchNumber,
      eventType,
      String(fromOrgId || "ORIGIN"),
      String(toOrgId || "DESTINATION"),
      location || "UNKNOWN",
      new Date(timestamp || Date.now()).toISOString(),
      previousHash,
    ].join("::");

    return `0x${crypto.createHash("sha256").update(payload).digest("hex")}`;
  }

  /**
   * Future smart contract on-chain recording interface (ready for Sepolia/Polygon/Hyperledger)
   */
  static async recordBatchOnChain(batchData) {
    const txHash = this.generateBatchHash(batchData);
    // In production with connected RPC provider, this calls smart contract method:
    // await pharmaContract.registerBatch(...)
    return {
      success: true,
      transactionHash: txHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 5000000,
      network: "Sepolia Ethereum Testnet (Simulated Proof)",
    };
  }

  /**
   * Future smart contract event recording interface
   */
  static async recordEventOnChain(eventData) {
    const txHash = this.generateSupplyChainEventHash(eventData);
    return {
      success: true,
      transactionHash: txHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 5000000,
      network: "Sepolia Ethereum Testnet (Simulated Proof)",
    };
  }

  /**
   * Verifies data integrity against stored cryptographic hash
   */
  static verifyRecordIntegrity(calculatedHash, storedHash) {
    if (!calculatedHash || !storedHash) return false;
    return calculatedHash.toLowerCase() === storedHash.toLowerCase();
  }
}

module.exports = BlockchainService;
