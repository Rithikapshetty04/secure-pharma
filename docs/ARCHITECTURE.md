# Secure Pharma — System Architecture Document

## 1. System Architecture Overview

Secure Pharma operates as a multi-tier pharmaceutical digital trust ecosystem engineered for zero-trust authenticity validation, regulatory compliance (FDA 21 CFR Part 11, DSCSA, EU FMD), and immutable chain-of-custody tracking.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|                                                                                   |
|  [ Public Consumer ]    [ Pharmacy ]    [ Distributor ]    [ Manufacturer ]       |
|   - QR Verification      - Dispense      - Transfer         - Drug Formulation    |
|   - Authenticity Scan    - Vault Check   - Inbound Scan     - Batch Serialization |
|                                                                                   |
|                        [ Regulatory Authority / Admin ]                           |
|                         - License Inspection Queue                                |
|                         - Entity Suspensions / Approvals                          |
|                         - 21 CFR Part 11 Audit Trail                              |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON / Multipart
                                           v
+-----------------------------------------------------------------------------------+
|                              BACKEND API GATEWAY                                  |
|                                                                                   |
|  [ Express.js REST API Layer ]                                                    |
|    - Rate Limiting, Helmet Security Headers, CORS Policy                          |
|    - JWT Authentication & RBAC Authorization Middleware                           |
|    - Multer Secure File Processing (MIME & Size Restrictions)                     |
|                                                                                   |
|  [ Core Micro-Services ]                                                          |
|    - AuthService (Registration, BCrypt Hashing, Password Resets)                 |
|    - VerificationService (9-Point Integrity Algorithm)                           |
|    - BlockchainService (SHA-256 State Fingerprinting & On-Chain Anchoring)        |
|    - NotificationService (Role-Based Real-Time Alert Distribution)                |
|    - AuditLogger (Append-Only Immutable Compliance Ledger)                        |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    v                                             v
+---------------------------------------+     +-------------------------------------+
|        PRIMARY DATA STORE             |     |       IMMUTABLE LEDGER LAYER        |
|                                       |     |                                     |
|  [ MongoDB Replica Set / Atlas ]      |     |  [ Cryptographic Hash Engine ]      |
|    - 9 Normalized Indexed Collections |     |    - SHA-256 Document Fingerprints  |
|    - User & Organization Registries   |     |    - Batch Merkle Root Hashes       |
|    - Formulary Drugs & Serial Batches |     |    - Chained Custodial Hashes       |
|    - Supply Chain Checkpoints         |     |                                     |
|    - Append-Only 21 CFR Audit Logs    |     |  [ Ready: Ethereum Sepolia / L2 ]   |
|                                       |     |    - PharmaSupplyChain.sol          |
+---------------------------------------+     +-------------------------------------+
```

---

## 2. 9-Point Pharmaceutical Authenticity Verification Algorithm

When a QR code or batch lot identifier is queried via `/api/verify/:identifier`:

1. **Formulary Existence Check**: Confirms product is officially registered with NDC/GTIN code and marked `ACTIVE`.
2. **Batch Serialization Check**: Verifies batch number and UUID `qrIdentifier` exist on the central ledger.
3. **Manufacturer Entity Verification**: Confirms manufacturer is in `APPROVED` status with active compliance standing.
4. **Regulatory License Validation**: Verifies mfg regulatory license is marked `VERIFIED` and expiration date is in the future.
5. **Batch Expiration Verification**: Validates production lot expiration date (`expiryDate > Date.now()`).
6. **Active Recall Inspection**: Asserts batch status is NOT `RECALLED`.
7. **Supply Chain Consistency**: Asserts initial origin is `MANUFACTURED` and chain-of-custody nodes maintain chronological integrity.
8. **Tamper-Evident Identifier Validation**: Asserts QR payload signature has not been duplicated across multiple manufacturers.
9. **Adverse Anomaly Screening**: Confirms neither batch nor product has been marked `FLAGGED` or `SUSPENDED`.

---

## 3. Cryptographic State & Blockchain Readiness

Secure Pharma uses a modular service abstraction (`BlockchainService.js`) that produces tamper-evident hashes for:
- **Document Tamper Detection**: SHA-256 hash of submitted PDF/PNG license certificates.
- **Batch State Hashing**: Fingerprint combining `{ batchNumber, productCode, mfgDate, expDate, quantity, manufacturerId }`.
- **Chain-of-Custody Linking**: Each supply chain event hashes `{ batchNumber, eventType, fromOrg, toOrg, location, timestamp, previousHash }`, forming an immutable hash chain anchored to the initial batch state.
- **Solidity Smart Contract**: Included in `blockchain/contracts/PharmaSupplyChain.sol` with Viem test suite passing 6/6 tests for future decentralized mainnet anchoring.
