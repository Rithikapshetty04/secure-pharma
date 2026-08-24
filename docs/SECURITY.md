# Secure Pharma — Security & Compliance Architecture

## 1. Compliance Standards

Secure Pharma is designed to align with strict global pharmaceutical security directives:
- **US FDA 21 CFR Part 11**: Electronic Records & Signatures, audit logging, role validation.
- **US DSCSA (Drug Supply Chain Security Act)**: Interoperable serialization, unit verification, and suspect product investigation.
- **EU FMD (Falsified Medicines Directive)**: Unique identifier scanning, anti-tampering verification, and national repository integration.

---

## 2. Authentication & Credential Security

- **Password Hashing**: Salted BCrypt (10 rounds) ensures passwords cannot be reverse-engineered or dictionary attacked.
- **JWT Authorization**: Cryptographically signed HMAC-SHA256 tokens with role-based claims (`SUPER_ADMIN`, `REGULATOR`, `MANUFACTURER`, `DISTRIBUTOR`, `PHARMACY`).
- **Account Verification Gate**: Newly registered entities are assigned `accountStatus = 'PENDING'` and cannot log in or access internal endpoints until authorized by a regulator.
- **No Password Leakage**: Passwords and password hashes are strictly stripped from Mongoose queries via `.select('-password')` and omitted from API responses and audit logs.

---

## 3. Secure File & License Document Storage

- **Allowed Formats**: Strictly restricted via Multer to `.pdf`, `.jpg`, `.jpeg`, `.png`.
- **Size Limits**: Capped at 5MB to prevent denial-of-service memory exhaustion.
- **Safe Filename Generation**: Stored using cryptographic timestamps and random suffixes to prevent path traversal (`../`) vulnerabilities.
- **Document Hashing**: Every uploaded certificate has its SHA-256 hash computed at upload time, making any local file tampering detectable.

---

## 4. QR Code & Privacy Protection

- **No Sensitive Leakage in QR Codes**: QR codes contain only a non-guessable UUID identifier (`SP-<uuid>`) pointing to the public verification endpoint.
- **No Confidential Trade Data**: Financial prices, internal batch costs, and employee personally identifiable information (PII) are omitted from public verification endpoints.

---

## 5. Input Sanitization & Attack Mitigations

- **Helmet Security Headers**: Enables `Cross-Origin-Resource-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and `Strict-Transport-Security`.
- **CORS Configuration**: Restricts origin cross-sharing to trusted domains.
- **SQL / NoSQL Injection Prevention**: Mongoose strict schema casting prevents NoSQL operator injection (`$gt`, `$where`) in payload bodies.
