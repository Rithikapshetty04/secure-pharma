# Secure Pharma — Security Architecture & Hardening Guide

## 1. Overview
Secure Pharma implements a zero-trust backend authorization model where the frontend is strictly treated as an untrusted client interface. All security policies, custody transitions, object-level authorizations, and regulatory compliance rules are evaluated and enforced exclusively on the backend API and anchored cryptographically on-chain.

---

## 2. Authentication & Session Hygiene
- **Password Protection**: Passwords are cryptographically hashed using `bcryptjs` with 10 salt rounds. The `User` Mongoose schema enforces `select: false` on `password`, `resetPasswordToken`, and `resetPasswordExpires` by default, ensuring sensitive credentials are never inadvertently returned in API queries.
- **JWT Verification**: Every protected route executes `authenticateToken` middleware, verifying signature integrity and expiration (`process.env.JWT_SECRET`). 
- **Server-Side Identity Derivation**: User identity, role, and organization references are loaded from the database record rather than trusted blindly from token claims or HTTP headers.
- **Account Status Gating**: Non-administrator accounts in `PENDING`, `UNDER_REVIEW`, `REJECTED`, or `SUSPENDED` states are strictly rejected (`403 Forbidden`).
- **Password Reset Protection**: Password reset tokens are single-use SHA-256 digests with a 1-hour expiration window. Reset tokens are dispatched through secure notification channels and are **never** returned in HTTP API responses.

---

## 3. Role-Based Access Control (RBAC) & Privilege Separation
The platform enforces strict role boundaries:
- `SUPER_ADMIN` / `ADMIN` / `REGULATOR`: System governance, license verification, user lifecycle management, administrative batch recall/flagging, and immutable audit inspection.
- `MANUFACTURER`: Production batch minting, cryptographic batch hashing, formulary registration, and initial dispatch to certified distributors.
- `DISTRIBUTOR`: Bulk inventory receiving, inward custody verification, and dispatch to licensed dispensaries/pharmacies.
- `PHARMACY`: Dispensary inward custody confirmation, formulary medicine catalog procurement, and order placement.

Self-registration is strictly restricted to `MANUFACTURER`, `DISTRIBUTOR`, and `PHARMACY`. Privileged administrative roles (`REGULATOR`, `ADMIN`) cannot be self-assigned during registration.

---

## 4. Insecure Direct Object Reference (IDOR) & Custody Enforcement
Every endpoint operating on an identified resource enforces contextual relation checks:
- **Batches (`/api/batches/:id`)**: Only the manufacturer that created the batch or an administrator can update batch attributes. Once a batch enters active downstream transit (`IN_TRANSIT`, `RECEIVED`, `DISTRIBUTED`), specifications cannot be modified.
- **Transfers & Custody (`/api/supply-chain/events`)**: Custody transitions require proof of physical possession (`batch.currentHolder == authenticatedUser.organization`). Sender ID is derived strictly from server-side session data (`req.user.organization`).
- **Orders (`/api/orders/:id`)**: Pharmacies can only access and cancel their own procurement orders. Distributors can only view orders assigned to them or unassigned orders awaiting fulfillment.
- **Procurement Cart (`/api/pharmacy/cart`)**: Cart state is bound strictly to `req.user.organization`. Arbitrary user or organization IDs in request bodies are ignored.
- **Licenses (`/api/licenses/:id`)**: Detailed license metadata and history are accessible solely to authorized administrators or the organization owning that license.

---

## 5. Regulatory Document & File Upload Security
- **Elimination of Public Static Uploads**: Unrestricted public access to `/uploads` has been eliminated. Document files are stored in a dedicated local directory with random UUID-based filenames.
- **Authorized Document Streaming (`GET /api/licenses/:id/document`)**: License documents can only be retrieved by authorized regulators/admins or the license owner organization via authenticated streaming.
- **Upload Validation**: File uploads are restricted to `.pdf`, `.jpg`, `.jpeg`, and `.png` with MIME validation and a 5MB size limit.

---

## 6. Blockchain Security & Key Isolation
- **Backend Signer Isolation**: Private keys, mnemonic phrases, and server signer credentials exist **exclusively** on the backend server environment (`.env`). No private blockchain key or mnemonic is ever exposed to React frontend builds or API responses.
- **Domain-Specific Contract Calls**: Generic contract execution endpoints (e.g. `POST /api/blockchain/execute`) are prohibited. All blockchain transactions are executed internally by `BlockchainService` after backend business validation passes.
- **Smart Contract Guards**: `PharmaSupplyChain.sol` prevents duplicate batch registration and enforces on-chain event emission.

---

## 7. Public QR Verification Boundary
Public QR scanning (`GET /api/verify/:identifier`) is accessible without authentication to allow consumers and healthcare workers to verify authenticity. However:
- Private business data (user emails, telephone numbers, document storage paths, internal audit logs) is redacted.
- Only safe pharmaceutical traceability information (batch number, product name, generic formulation, dosage form, manufacturer name, expiry date, status, timeline) is returned.

---

## 8. Network Infrastructure & Security Headers
- **Rate Limiting**: `express-rate-limit` protects authentication endpoints (30 req/15min) and public verification endpoints (60 req/min) against brute-force attacks and automated enumeration.
- **Restricted CORS**: Cross-Origin Resource Sharing is locked to configured frontend origins (`FRONTEND_URL` / `localhost:5173`) with explicit allowed HTTP methods and headers.
- **Security Headers (`helmet`)**: Content security policies, frameguards (`SAMEORIGIN`), MIME-type sniffing prevention (`noSniff`), and strict referrer policies are enabled.
