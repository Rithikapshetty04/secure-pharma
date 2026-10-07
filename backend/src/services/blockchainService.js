const crypto = require("crypto");
const fs = require("fs");
const { ethers } = require("ethers");
const PharmaSupplyChainABI = require("../config/pharmaContractAbi");

class BlockchainService {
  static providerCache = null;
  static providerUrlCache = null;

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
   * Returns a cached ethers JSON-RPC provider instance
   */
  static getProvider() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    if (!rpcUrl) return null;

    if (this.providerCache && this.providerUrlCache === rpcUrl) {
      return this.providerCache;
    }

    this.providerCache = new ethers.JsonRpcProvider(rpcUrl);
    this.providerUrlCache = rpcUrl;
    return this.providerCache;
  }

  /**
   * Returns an ethers signer (either derived from private key or node default signer)
   */
  static async getSigner() {
    const provider = this.getProvider();
    if (!provider) throw new Error("Blockchain provider is not configured");

    const privateKey = process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY;
    if (privateKey && privateKey.trim()) {
      return new ethers.Wallet(privateKey.trim(), provider);
    }

    // Default to first account from JSON-RPC node (e.g., Hardhat local node)
    return await provider.getSigner(0);
  }

  /**
   * Returns smart contract instance with or without signer
   */
  static async getContract(withSigner = false) {
    const provider = this.getProvider();
    if (!provider) throw new Error("Blockchain provider is not configured");

    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) throw new Error("Contract address is not configured");

    if (withSigner) {
      const signer = await this.getSigner();
      return new ethers.Contract(contractAddress, PharmaSupplyChainABI, signer);
    }

    return new ethers.Contract(contractAddress, PharmaSupplyChainABI, provider);
  }

  /**
   * Verifies live blockchain provider connectivity via JSON-RPC.
   * Does NOT generate fake block numbers or claim active connection if unconfigured.
   */
  static async getProviderStatus() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const configuredNetwork = process.env.BLOCKCHAIN_NETWORK;

    if (!rpcUrl) {
      return {
        status: "NOT_CONFIGURED",
        isConfigured: false,
        network: configuredNetwork || null,
        chainId: null,
        rpcUrl: null,
        latestBlock: null,
        message: "Blockchain provider RPC is not configured in server environment (BLOCKCHAIN_RPC_URL).",
      };
    }

    try {
      const provider = this.getProvider();
      if (!provider) throw new Error("Provider initialization failed");

      // Set a strict timeout
      const networkPromise = provider.getNetwork();
      const blockPromise = provider.getBlockNumber();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("RPC request timed out")), 3500)
      );

      const [network, latestBlock] = await Promise.race([
        Promise.all([networkPromise, blockPromise]),
        timeoutPromise,
      ]);

      const chainId = Number(network.chainId);
      const displayNetwork = configuredNetwork || `EVM Chain (ID: ${chainId})`;

      return {
        status: "CONNECTED",
        isConfigured: true,
        network: displayNetwork,
        chainId,
        rpcUrl: rpcUrl.replace(/\/\/[^:]+:[^@]+@/, "//"), // Redact basic auth if present
        latestBlock,
        message: "Successfully connected to blockchain RPC provider.",
      };
    } catch (err) {
      return {
        status: "UNAVAILABLE",
        isConfigured: true,
        network: configuredNetwork || null,
        chainId: null,
        rpcUrl: rpcUrl.replace(/\/\/[^:]+:[^@]+@/, "//"),
        latestBlock: null,
        message: `Unable to connect to blockchain provider: ${err.message}`,
      };
    }
  }

  /**
   * Returns smart contract deployment configuration.
   */
  static getContractInfo() {
    const address = process.env.CONTRACT_ADDRESS || null;
    return {
      contractAddress: address,
      isConfigured: Boolean(address),
    };
  }

  /**
   * Cryptographic record registration for a pharmaceutical batch.
   * Executes real smart contract transaction when configured and awaits receipt confirmation.
   * Does NOT fabricate fake transaction hashes if unconfigured or failed.
   */
  static async recordBatchOnChain(batchData) {
    const batchHash = this.generateBatchHash(batchData);
    const providerStatus = await this.getProviderStatus();
    const contractInfo = this.getContractInfo();

    // If blockchain is not configured, record locally without fake tx hash
    if (providerStatus.status !== "CONNECTED" || !contractInfo.isConfigured) {
      return {
        success: false,
        notConfigured: true,
        transactionHash: null,
        blockNumber: null,
        network: providerStatus.network,
        batchHash,
        message: "Blockchain is not configured or reachable. Cryptographic state hash computed locally.",
      };
    }

    try {
      // 1. Verify batch is not already registered on-chain
      const readContract = await this.getContract(false);
      const onChainBatch = await readContract.batches(batchData.batchNumber);
      if (onChainBatch && onChainBatch.exists) {
        const error = new Error(`Batch '${batchData.batchNumber}' is already registered on-chain.`);
        error.code = "DUPLICATE_ON_CHAIN";
        throw error;
      }

      // 2. Submit transaction with real signer
      const writeContract = await this.getContract(true);
      const tx = await writeContract.registerBatch(
        batchData.batchNumber,
        batchData.productCode || "PC-FORMULARY",
        batchData.manufacturerOrgName || "Manufacturer",
        batchData.location || "Cleanroom Facility",
        batchHash
      );

      // 3. Await real blockchain confirmation receipt
      const receipt = await tx.wait(1);
      if (!receipt || receipt.status !== 1) {
        throw new Error("Blockchain transaction failed or reverted by EVM.");
      }

      // 4. Parse emitted BatchRegistered event from receipt logs
      let registeredEvent = null;
      for (const log of receipt.logs) {
        try {
          const parsed = writeContract.interface.parseLog(log);
          if (parsed && parsed.name === "BatchRegistered") {
            registeredEvent = {
              batchNumber: parsed.args[0],
              productCode: parsed.args[1],
              manufacturer: parsed.args[2],
              manufacturerOrg: parsed.args[3],
              timestamp: Number(parsed.args[4]),
            };
            break;
          }
        } catch {
          // Log from different contract or unindexed topic
        }
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: Number(receipt.blockNumber),
        network: providerStatus.network,
        batchHash,
        event: registeredEvent,
      };
    } catch (err) {
      console.error(`Blockchain batch registration error for ${batchData.batchNumber}:`, err.message);
      throw err;
    }
  }

  /**
   * Cryptographic record registration for a supply chain event.
   * Executes real smart contract transaction when configured and awaits receipt confirmation.
   * Does NOT fabricate fake transaction hashes if unconfigured or failed.
   */
  static async recordEventOnChain(eventData) {
    const eventHash = this.generateSupplyChainEventHash(eventData);
    const providerStatus = await this.getProviderStatus();
    const contractInfo = this.getContractInfo();

    if (providerStatus.status !== "CONNECTED" || !contractInfo.isConfigured) {
      return {
        success: false,
        notConfigured: true,
        transactionHash: null,
        blockNumber: null,
        network: providerStatus.network,
        eventHash,
        message: "Blockchain is not configured or reachable. Supply chain event hash computed locally.",
      };
    }

    try {
      // 1. Verify batch exists on-chain before recording event
      const readContract = await this.getContract(false);
      const onChainBatch = await readContract.batches(eventData.batchNumber);
      if (!onChainBatch || !onChainBatch.exists) {
        const error = new Error(`Batch '${eventData.batchNumber}' is not registered on-chain.`);
        error.code = "NOT_FOUND_ON_CHAIN";
        throw error;
      }

      // 2. Submit transaction with real signer
      const writeContract = await this.getContract(true);
      const tx = await writeContract.recordEvent(
        eventData.batchNumber,
        eventData.eventType,
        eventData.custodianOrgName || "Supply Chain Node",
        eventData.location || "Logistics Facility",
        eventHash
      );

      // 3. Await real blockchain confirmation receipt
      const receipt = await tx.wait(1);
      if (!receipt || receipt.status !== 1) {
        throw new Error("Blockchain event transaction failed or reverted by EVM.");
      }

      // 4. Parse emitted EventRecorded event from receipt logs
      let recordedEvent = null;
      for (const log of receipt.logs) {
        try {
          const parsed = writeContract.interface.parseLog(log);
          if (parsed && parsed.name === "EventRecorded") {
            recordedEvent = {
              batchNumber: parsed.args[0],
              eventType: parsed.args[1],
              custodian: parsed.args[2],
              custodianOrg: parsed.args[3],
              location: parsed.args[4],
              timestamp: Number(parsed.args[5]),
            };
            break;
          }
        } catch {
          // Log from different contract or unindexed topic
        }
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: Number(receipt.blockNumber),
        network: providerStatus.network,
        eventHash,
        event: recordedEvent,
      };
    } catch (err) {
      console.error(`Blockchain event registration error for ${eventData.batchNumber} (${eventData.eventType}):`, err.message);
      throw err;
    }
  }

  /**
   * Fetches on-chain batch state and full immutable event history
   */
  static async getBatchFromChain(batchNumber) {
    const providerStatus = await this.getProviderStatus();
    const contractInfo = this.getContractInfo();

    if (providerStatus.status !== "CONNECTED" || !contractInfo.isConfigured) {
      return {
        onChain: false,
        reason: providerStatus.status === "NOT_CONFIGURED" ? "NOT_CONFIGURED" : "UNAVAILABLE",
        message: providerStatus.message,
      };
    }

    try {
      const contract = await this.getContract(false);
      const batchInfo = await contract.batches(batchNumber);

      if (!batchInfo || !batchInfo.exists) {
        return {
          onChain: true,
          exists: false,
          reason: "NOT_FOUND",
          message: `Batch '${batchNumber}' was not found on the smart contract ledger.`,
        };
      }

      const rawEvents = await contract.getBatchEvents(batchNumber);
      const events = (rawEvents || []).map((e) => ({
        eventType: e.eventType,
        recordedBy: e.recordedBy,
        custodianOrg: e.custodianOrg,
        location: e.location,
        timestamp: Number(e.timestamp),
        txHash: e.txHash,
      }));

      return {
        onChain: true,
        exists: true,
        batchNumber: batchInfo.batchNumber,
        productCode: batchInfo.productCode,
        manufacturer: batchInfo.manufacturer,
        manufacturerOrg: batchInfo.manufacturerOrg,
        creationTimestamp: Number(batchInfo.creationTimestamp),
        events,
      };
    } catch (err) {
      return {
        onChain: false,
        error: err.message,
      };
    }
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
