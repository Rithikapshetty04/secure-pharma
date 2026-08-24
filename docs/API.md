# Secure Pharma — REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication & Session APIs (`/api/auth`)

### `POST /api/auth/register`
Submits registration application for a new pharmaceutical organization with license proof.
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `name`: Representative full name
  - `email`: Official email
  - `password`: Account password (min 6 chars)
  - `confirmPassword`: Confirmation password
  - `organizationName`: Legal entity name
  - `organizationType`: `MANUFACTURER` | `DISTRIBUTOR` | `PHARMACY`
  - `licenseNumber`: Regulatory certificate number
  - `licenseType`: `MANUFACTURING` | `WHOLESALE` | `PHARMACY` | `IMPORT_EXPORT`
  - `address`: Physical facility location
  - `licenseDocument`: File (`.pdf`, `.jpg`, `.jpeg`, `.png` up to 5MB)
- **Response**: `201 Created`

### `POST /api/auth/login`
Authenticates users and returns JWT bearer token.
- **Body**: `{ "email": "mfg@apexbiopharma.com", "password": "Mfg@123456" }`
- **Response**: `200 OK` with `{ token, user }` (or `403 Forbidden` with `{ accountStatus: "PENDING" }` if awaiting review).

### `POST /api/auth/logout`
Invalidates session and records audit event.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### `GET /api/auth/me`
Fetches authenticated user profile, organization info, and license.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### `POST /api/auth/forgot-password`
Generates reset authorization token.
- **Body**: `{ "email": "..." }`
- **Response**: `200 OK`

### `POST /api/auth/reset-password`
Resets password using valid security token.
- **Body**: `{ "token": "...", "newPassword": "..." }`
- **Response**: `200 OK`

### `GET /api/auth/verification-status`
Public status lookup for registration applications.
- **Query**: `email` or `userId`
- **Response**: `200 OK` with `{ accountStatus, licenseStatus, rejectionReason }`

---

## 2. Public Product & Batch Verification (`/api/verify`)

### `GET /api/verify/:identifier`
Executes 9-point pharmaceutical authenticity verification algorithm.
- **Path Param**: `identifier` (e.g. `BATCH-2026-TEST-001` or `SP-UUID`)
- **Response**: `200 OK` with:
  - `status`: `AUTHENTIC` | `SUSPICIOUS` | `EXPIRED` | `RECALLED` | `NOT_FOUND`
  - `checks`: 9-point boolean inspection map
  - `batch`: Serialized production lot specs
  - `product`: Active formulation and GTIN/NDC codes
  - `manufacturer`: Verified mfg license credentials
  - `timeline`: Chronological chain-of-custody checkpoints

### `POST /api/verify`
Records mobile camera / scanner verification audit entry with geo-telemetry.
- **Body**: `{ "identifier": "...", "scanLocation": "...", "deviceSource": "..." }`

---

## 3. Organizations Management (`/api/organizations`)

- `GET /api/organizations`: List organizations with `type`, `status`, `search`, and `page`/`limit` pagination.
- `GET /api/organizations/:id`: Organization details, formulary drugs, and authorized users.
- `PUT /api/organizations/:id`: Update organization address and contact info.
- `PATCH /api/organizations/:id/status`: Update status (`APPROVED`, `REJECTED`, `SUSPENDED`) with mandatory reason (Regulators & Admins only).

---

## 4. Licenses & Regulatory Review (`/api/licenses`)

- `GET /api/licenses`: Regulator queue for all submitted licenses with auto-expiration detection.
- `GET /api/licenses/:id`: License inspection with verification log history.
- `PATCH /api/licenses/:id/approve`: Approves license, approves organization, and activates user accounts.
- `PATCH /api/licenses/:id/reject`: Rejects license with mandatory reason.

---

## 5. Pharmaceutical Formulary Products (`/api/products`)

- `GET /api/products`: Formulary catalog with search, category filters, and pagination.
- `GET /api/products/:id`: Drug record with all associated production lots.
- `POST /api/products`: Register new drug formulation (Verified Manufacturers only).
- `PUT /api/products/:id`: Update drug formulary specifications.
- `DELETE /api/products/:id`: Deactivate product formulary code.

---

## 6. Batch Serialization & QR Ledger (`/api/batches`)

- `GET /api/batches`: Query serialized lots with status filters.
- `GET /api/batches/:id`: Batch details, QR data, and event history.
- `POST /api/batches`: Mint new production batch, generates SHA-256 fingerprint, creates initial `MANUFACTURED` event.
- `PATCH /api/batches/:id/status`: Recall, flag, or update batch status with mandatory justification.

---

## 7. Supply Chain Custody & Events (`/api/supply-chain`)

- `GET /api/supply-chain/events`: Global stream of chain-of-custody handovers.
- `GET /api/supply-chain/batches/:batchId`: Chronological provenance timeline for a batch.
- `POST /api/supply-chain/events`: Record custodial transition (`DISPATCHED`, `RECEIVED`, `TRANSFERRED`, `DELIVERED`, `SOLD`, `RETURNED`, `RECALLED`, `FLAGGED`) with previous-hash cryptographic linking.

---

## 8. Audit Logs & Notifications (`/api/audit-logs`, `/api/notifications`)

- `GET /api/audit-logs`: 21 CFR Part 11 immutable audit trail.
- `GET /api/notifications`: User and role notification alerts.
- `PATCH /api/notifications/:id/read`: Mark notification read.
- `PATCH /api/notifications/read-all`: Mark all notifications read.
- `GET /api/health`: System health and connectivity probe.
