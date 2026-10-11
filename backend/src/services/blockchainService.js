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
        // Auto-anchor batch if present in database to prevent broken provenance chain
        try {
          const BatchModel = require("../../models/Batch");
          const dbBatch = await BatchModel.findOne({ batchNumber: eventData.batchNumber }).populate("product manufacturer");
          if (dbBatch) {
            await this.recordBatchOnChain({
              batchNumber: dbBatch.batchNumber,
              productCode: dbBatch.product?.productCode || "PC-FORMULARY",
              manufacturingDate: dbBatch.manufacturingDate,
              expiryDate: dbBatch.expiryDate,
              quantity: dbBatch.quantity,
              manufacturerId: dbBatch.manufacturer?._id || dbBatch.manufacturer,
              manufacturerOrgName: dbBatch.manufacturer?.name || "Manufacturer",
              location: dbBatch.location || "Cleanroom Facility",
              batchHash: dbBatch.batchHash,
            });
          } else {
            return {
              success: false,
              transactionHash: null,
              blockNumber: null,
              network: providerStatus.network,
              eventHash,
              message: `Batch '${eventData.batchNumber}' is not registered on-chain.`,
            };
          }
        } catch (autoErr) {
          console.warn(`Automatic on-chain batch anchor skipped: ${autoErr.message}`);
          return {
            success: false,
            transactionHash: null,
            blockNumber: null,
            network: providerStatus.network,
            eventHash,
            message: autoErr.message,
          };
        }
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
      return {
        success: false,
        transactionHash: null,
        blockNumber: null,
        network: providerStatus.network,
        eventHash,
        message: err.message,
      };
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

  /**
   * Fetches real on-chain transaction ledger directly from the deployed smart contract
   * and EVM provider. Decodes real contract events and associates batch IDs strictly
   * when supported by actual event data.
   */
  static async getBlockchainLedger(queryOptions = {}) {
    const {
      page = 1,
      limit = 15,
      search = "",
      batchId = "",
      eventType = "ALL",
      blockNumber = "",
    } = queryOptions;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));

    const providerStatus = await this.getProviderStatus();
    const contractInfo = this.getContractInfo();

    // 1. Handle unconfigured or unavailable provider
    if (providerStatus.status !== "CONNECTED") {
      return {
        networkOverview: {
          status: providerStatus.status,
          network: providerStatus.network,
          chainId: providerStatus.chainId,
          latestBlock: null,
          contractAddress: contractInfo.contractAddress,
          isContractConfigured: contractInfo.isConfigured,
          isContractReachable: false,
          message: providerStatus.message,
          totalTransactions: 0,
          totalEvents: 0,
          totalOnChainBatches: 0,
          rpcUrl: providerStatus.rpcUrl,
        },
        transactions: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 1,
        },
      };
    }

    // 2. Handle missing contract address
    if (!contractInfo.isConfigured || !contractInfo.contractAddress) {
      return {
        networkOverview: {
          status: "NOT_CONFIGURED",
          network: providerStatus.network,
          chainId: providerStatus.chainId,
          latestBlock: providerStatus.latestBlock,
          contractAddress: null,
          isContractConfigured: false,
          isContractReachable: false,
          message: "Smart contract address is not configured in environment (CONTRACT_ADDRESS).",
          totalTransactions: 0,
          totalEvents: 0,
          totalOnChainBatches: 0,
          rpcUrl: providerStatus.rpcUrl,
        },
        transactions: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 1,
        },
      };
    }

    const provider = this.getProvider();

    // 3. Verify contract bytecode exists at configured address on EVM
    try {
      const bytecode = await provider.getCode(contractInfo.contractAddress);
      if (!bytecode || bytecode === "0x" || bytecode === "0x0") {
        return {
          networkOverview: {
            status: "CONNECTED",
            network: providerStatus.network,
            chainId: providerStatus.chainId,
            latestBlock: providerStatus.latestBlock,
            contractAddress: contractInfo.contractAddress,
            isContractConfigured: true,
            isContractReachable: false,
            message: `Connected to blockchain network (Chain ID: ${providerStatus.chainId}), but no smart contract bytecode was found at address ${contractInfo.contractAddress}. Contract may need to be deployed to this network.`,
            totalTransactions: 0,
            totalEvents: 0,
            totalOnChainBatches: 0,
            rpcUrl: providerStatus.rpcUrl,
          },
          transactions: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 1,
          },
        };
      }
    } catch (err) {
      return {
        networkOverview: {
          status: "UNAVAILABLE",
          network: providerStatus.network,
          chainId: providerStatus.chainId,
          latestBlock: null,
          contractAddress: contractInfo.contractAddress,
          isContractConfigured: true,
          isContractReachable: false,
          message: `Failed to inspect contract bytecode at ${contractInfo.contractAddress}: ${err.message}`,
          totalTransactions: 0,
          totalEvents: 0,
          totalOnChainBatches: 0,
          rpcUrl: providerStatus.rpcUrl,
        },
        transactions: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 1,
        },
      };
    }

    try {
      const readContract = await this.getContract(false);
      const latestBlock = await provider.getBlockNumber();

      // 4. Fetch on-chain batches and build reverse topic index
      // In Solidity, indexed string event parameters are hashed as keccak256(bytes(str)) in topics
      const onChainBatchesMap = new Map();
      const topicToBatchMap = new Map();
      let totalOnChainBatches = 0;

      try {
        const batchCountBn = await readContract.getBatchCount();
        totalOnChainBatches = Number(batchCountBn);

        for (let i = 0; i < totalOnChainBatches; i++) {
          try {
            const batchNo = await readContract.allBatchNumbers(i);
            const [batchInfo, batchEvts] = await Promise.all([
              readContract.batches(batchNo),
              readContract.getBatchEvents(batchNo).catch(() => []),
            ]);

            const batchHashTopic = ethers.keccak256(ethers.toUtf8Bytes(batchNo)).toLowerCase();
            topicToBatchMap.set(batchHashTopic, batchNo);

            onChainBatchesMap.set(batchNo, {
              batchNumber: batchNo,
              productCode: batchInfo.productCode,
              manufacturer: batchInfo.manufacturer,
              manufacturerOrg: batchInfo.manufacturerOrg,
              creationTimestamp: Number(batchInfo.creationTimestamp),
              events: (batchEvts || []).map((e) => ({
                eventType: e.eventType,
                recordedBy: e.recordedBy,
                custodianOrg: e.custodianOrg,
                location: e.location,
                timestamp: Number(e.timestamp),
                txHash: e.txHash,
              })),
            });
          } catch (batchErr) {
            console.warn(`Error reading on-chain batch index ${i}:`, batchErr.message);
          }
        }
      } catch (countErr) {
        console.warn("Could not retrieve getBatchCount from contract:", countErr.message);
      }

      // 5. Query all on-chain event logs emitted by the smart contract
      let rawLogs = [];
      try {
        rawLogs = await provider.getLogs({
          address: contractInfo.contractAddress,
          fromBlock: 0,
          toBlock: "latest",
        });
      } catch (logsErr) {
        console.warn("Failed to query contract logs:", logsErr.message);
        rawLogs = [];
      }

      // Collect all distinct transaction hashes interacting with the contract
      const txHashMap = new Map();

      // Collect from event logs
      for (const log of rawLogs) {
        if (!txHashMap.has(log.transactionHash)) {
          txHashMap.set(log.transactionHash, {
            hash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
            logs: [log],
          });
        } else {
          txHashMap.get(log.transactionHash).logs.push(log);
        }
      }

      // Collect any on-chain event txHashes stored in batchEvents if valid 66-hex
      for (const batch of onChainBatchesMap.values()) {
        for (const evt of batch.events) {
          if (evt.txHash && /^0x[0-9a-fA-F]{64}$/.test(evt.txHash)) {
            if (!txHashMap.has(evt.txHash)) {
              txHashMap.set(evt.txHash, {
                hash: evt.txHash,
                blockNumber: null,
                logs: [],
                associatedBatchId: batch.batchNumber,
                associatedEventType: evt.eventType,
              });
            }
          }
        }
      }

      // 6. Fetch receipts and block timestamps for each transaction
      const blockTimestampCache = new Map();
      const getBlockTime = async (blockNum) => {
        if (!blockNum) return null;
        if (blockTimestampCache.has(blockNum)) return blockTimestampCache.get(blockNum);
        try {
          const b = await provider.getBlock(blockNum);
          const ts = b ? Number(b.timestamp) * 1000 : null;
          blockTimestampCache.set(blockNum, ts);
          return ts;
        } catch {
          return null;
        }
      };

      const ledgerRecords = [];

      for (const [txHash, meta] of txHashMap.entries()) {
        try {
          const [receipt, tx] = await Promise.all([
            provider.getTransactionReceipt(txHash).catch(() => null),
            provider.getTransaction(txHash).catch(() => null),
          ]);

          if (!receipt) continue;

          const blockNum = Number(receipt.blockNumber);
          const timestamp = await getBlockTime(blockNum);

          // Decode logs inside this transaction
          const contractLogs = receipt.logs.filter(
            (l) => l.address.toLowerCase() === contractInfo.contractAddress.toLowerCase()
          );

          let decodedEvent = null;
          let eventName = null;
          let eventType = null;
          let batchId = meta.associatedBatchId || null;
          let eventDetails = null;

          for (const l of contractLogs) {
            try {
              const parsed = readContract.interface.parseLog(l);
              if (parsed) {
                eventName = parsed.name;
                if (parsed.name === "BatchRegistered") {
                  // Arg 0 is indexed batchNumber (topic 1), resolve plain string
                  const topicHash = (l.topics[1] || "").toLowerCase();
                  const resolvedBatch = topicToBatchMap.get(topicHash) || (parsed.args[0] && !parsed.args[0].startsWith("0x") ? parsed.args[0] : null);
                  if (resolvedBatch) batchId = resolvedBatch;

                  eventType = "MANUFACTURED";
                  decodedEvent = {
                    name: "BatchRegistered",
                    batchNumber: resolvedBatch || parsed.args[0],
                    productCode: parsed.args[1],
                    manufacturer: parsed.args[2],
                    manufacturerOrg: parsed.args[3],
                    timestamp: Number(parsed.args[4]) * 1000,
                  };
                  eventDetails = `Batch Registered: #${decodedEvent.batchNumber || "Unknown"} (Product: ${decodedEvent.productCode}, Org: ${decodedEvent.manufacturerOrg})`;
                  break;
                } else if (parsed.name === "EventRecorded") {
                  const topicHash = (l.topics[1] || "").toLowerCase();
                  const resolvedBatch = topicToBatchMap.get(topicHash) || (parsed.args[0] && !parsed.args[0].startsWith("0x") ? parsed.args[0] : null);
                  if (resolvedBatch) batchId = resolvedBatch;

                  eventType = parsed.args[1];
                  decodedEvent = {
                    name: "EventRecorded",
                    batchNumber: resolvedBatch || parsed.args[0],
                    eventType: parsed.args[1],
                    custodian: parsed.args[2],
                    custodianOrg: parsed.args[3],
                    location: parsed.args[4],
                    timestamp: Number(parsed.args[5]) * 1000,
                  };
                  eventDetails = `Custody Event: ${eventType} by ${decodedEvent.custodianOrg} at ${decodedEvent.location}`;
                  break;
                }
              }
            } catch {
              // Log belongs to other ABI or unindexed log
            }
          }

          if (!eventName) {
            eventName = meta.associatedEventType ? "EventRecorded" : "ContractCall";
            eventType = meta.associatedEventType || "TRANSACTION";
            eventDetails = "Direct contract execution";
          }

          const record = {
            transactionHash: receipt.hash,
            blockNumber: blockNum,
            from: receipt.from,
            to: receipt.to || contractInfo.contractAddress,
            status: receipt.status === 1 ? "SUCCESS" : "FAILED",
            gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : "0",
            effectiveGasPrice: receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : "0",
            value: tx && tx.value ? `${ethers.formatEther(tx.value)} ETH` : "0 ETH",
            timestamp: timestamp || (decodedEvent?.timestamp) || null,
            eventName,
            eventType: eventType || "CALL",
            batchId,
            eventDetails,
            decodedEvent,
          };

          ledgerRecords.push(record);
        } catch (itemErr) {
          console.warn(`Error compiling ledger entry for tx ${txHash}:`, itemErr.message);
        }
      }

      // 7. Sort by block number descending (latest first)
      ledgerRecords.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));

      // 8. Apply search and query filters
      let filteredRecords = ledgerRecords;

      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        filteredRecords = filteredRecords.filter((r) =>
          (r.transactionHash && r.transactionHash.toLowerCase().includes(s)) ||
          (r.from && r.from.toLowerCase().includes(s)) ||
          (r.to && r.to.toLowerCase().includes(s)) ||
          (r.batchId && r.batchId.toLowerCase().includes(s)) ||
          (r.eventType && r.eventType.toLowerCase().includes(s)) ||
          (r.eventDetails && r.eventDetails.toLowerCase().includes(s))
        );
      }

      if (batchId && batchId.trim()) {
        const b = batchId.trim().toLowerCase();
        filteredRecords = filteredRecords.filter(
          (r) => r.batchId && r.batchId.toLowerCase().includes(b)
        );
      }

      if (eventType && eventType.toUpperCase() !== "ALL") {
        const e = eventType.toUpperCase();
        filteredRecords = filteredRecords.filter(
          (r) => r.eventType && r.eventType.toUpperCase() === e
        );
      }

      if (blockNumber && blockNumber.toString().trim()) {
        const bNum = parseInt(blockNumber.toString().trim(), 10);
        if (!isNaN(bNum)) {
          filteredRecords = filteredRecords.filter((r) => r.blockNumber === bNum);
        }
      }

      // 9. Server-side pagination
      const totalFiltered = filteredRecords.length;
      const skip = (pageNum - 1) * limitNum;
      const paginatedRecords = filteredRecords.slice(skip, skip + limitNum);

      return {
        networkOverview: {
          status: "CONNECTED",
          network: providerStatus.network,
          chainId: providerStatus.chainId,
          latestBlock,
          contractAddress: contractInfo.contractAddress,
          isContractConfigured: true,
          isContractReachable: true,
          message: "Successfully synchronized with live smart contract ledger.",
          totalTransactions: ledgerRecords.length,
          totalEvents: rawLogs.length,
          totalOnChainBatches,
          rpcUrl: providerStatus.rpcUrl,
        },
        transactions: paginatedRecords,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / limitNum) || 1,
        },
      };
    } catch (err) {
      console.error("Error in getBlockchainLedger:", err);
      return {
        networkOverview: {
          status: "UNAVAILABLE",
          network: providerStatus.network,
          chainId: providerStatus.chainId,
          latestBlock: null,
          contractAddress: contractInfo.contractAddress,
          isContractConfigured: true,
          isContractReachable: false,
          message: `Blockchain query failed: ${err.message}`,
          totalTransactions: 0,
          totalEvents: 0,
          totalOnChainBatches: 0,
          rpcUrl: providerStatus.rpcUrl,
        },
        transactions: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 1,
        },
      };
    }
  }

  /**
   * Fetches full cryptographic details for a single blockchain transaction
   * directly from provider receipts, EVM block headers, and contract event logs.
   */
  static async getBlockchainTxDetails(txHash) {
    if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash.trim())) {
      const err = new Error("Invalid transaction hash format. Expected 66-character hex string.");
      err.statusCode = 400;
      throw err;
    }

    const providerStatus = await this.getProviderStatus();
    if (providerStatus.status !== "CONNECTED") {
      const err = new Error("Blockchain provider is not currently connected.");
      err.statusCode = 503;
      throw err;
    }

    const provider = this.getProvider();
    const contractInfo = this.getContractInfo();

    const [receipt, tx] = await Promise.all([
      provider.getTransactionReceipt(txHash.trim()),
      provider.getTransaction(txHash.trim()),
    ]);

    if (!receipt) {
      const err = new Error(`Transaction '${txHash}' was not found on the connected blockchain network.`);
      err.statusCode = 404;
      throw err;
    }

    const block = await provider.getBlock(receipt.blockNumber);
    const contract = await this.getContract(false);

    // Decode all logs belonging to the smart contract in this receipt
    const decodedEvents = [];
    let associatedBatchId = null;

    // Build reverse lookup of topic hashes to batch numbers
    const topicToBatchMap = new Map();
    try {
      const count = await contract.getBatchCount();
      for (let i = 0; i < Number(count); i++) {
        const candidate = await contract.allBatchNumbers(i);
        const topic = ethers.keccak256(ethers.toUtf8Bytes(candidate)).toLowerCase();
        topicToBatchMap.set(topic, candidate);
      }
    } catch {
      // Continue
    }

    for (const log of receipt.logs) {
      if (
        contractInfo.contractAddress &&
        log.address.toLowerCase() === contractInfo.contractAddress.toLowerCase()
      ) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed) {
            let batchNo = null;
            const topic1 = (log.topics[1] || "").toLowerCase();
            batchNo = topicToBatchMap.get(topic1) || null;

            if (!batchNo && parsed.args[0]) {
              if (typeof parsed.args[0] === "string" && !parsed.args[0].startsWith("0x")) {
                batchNo = parsed.args[0];
              }
            }

            if (batchNo) associatedBatchId = batchNo;

            // Safe serialization of event args (handling BigInt & Indexed objects)
            const safeArgs = {};
            parsed.fragment.inputs.forEach((input, idx) => {
              const val = parsed.args[idx];
              if (typeof val === "bigint") {
                safeArgs[input.name] = val.toString();
              } else if (val && typeof val === "object" && val.hash) {
                safeArgs[input.name] = (batchNo && input.name === "batchNumber") ? batchNo : val.hash;
              } else {
                safeArgs[input.name] = val;
              }
            });

            decodedEvents.push({
              name: parsed.name,
              batchNumber: batchNo || (parsed.args[0]?.hash || String(parsed.args[0])),
              args: safeArgs,
            });
          }
        } catch (logErr) {
          console.warn("Could not parse log in getBlockchainTxDetails:", logErr.message);
        }
      }
    }

    // If associated with a batch, fetch on-chain batch info
    let onChainBatchInfo = null;
    if (associatedBatchId) {
      try {
        const onChain = await this.getBatchFromChain(associatedBatchId);
        if (onChain.exists) {
          onChainBatchInfo = onChain;
        }
      } catch {
        // Continue
      }
    }

    return {
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber),
      blockHash: receipt.blockHash,
      timestamp: block ? Number(block.timestamp) * 1000 : null,
      from: receipt.from,
      to: receipt.to,
      status: receipt.status === 1 ? "SUCCESS" : "FAILED",
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : "0",
      effectiveGasPrice: receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : "0",
      cumulativeGasUsed: receipt.cumulativeGasUsed ? receipt.cumulativeGasUsed.toString() : null,
      value: tx && tx.value ? `${ethers.formatEther(tx.value)} ETH` : "0 ETH",
      nonce: tx ? tx.nonce : null,
      type: receipt.type,
      contractAddress: contractInfo.contractAddress,
      associatedBatchId,
      decodedEvents,
      onChainBatchInfo,
      rawReceipt: {
        transactionIndex: receipt.index,
        logsCount: receipt.logs.length,
      },
    };
  }
}

module.exports = BlockchainService;

