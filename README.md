# SECURE PHARMA
### *Secure Pharmaceutical Supply Chain & License Verification Platform*

![Secure Pharma Header](https://img.shields.io/badge/Security-21%20CFR%20Part%2011-blue?style=for-the-badge)
![DSCSA Compliant](https://img.shields.io/badge/DSCSA-Compliant-success?style=for-the-badge)
![Full-Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20MongoDB%20%7C%20Solidity-cyan?style=for-the-badge)

Secure Pharma is an enterprise-grade digital trust platform engineered to eliminate counterfeit medicines, unverified distributors, and fake licenses from the global pharmaceutical supply chain through cryptographic serialization, QR-code authentication, and regulatory digital workflows.

---

## 🚀 Key Platform Features

- **Mandatory License Verification Gate**: Organizations (Manufacturers, Wholesalers, Pharmacies) submit official licenses which are verified and hashed by regulatory authorities before account activation.
- **9-Point Authenticity Algorithm**: Public verification evaluates product legitimacy, manufacturer license standing, unexpired status, active recall orders, and custodial consistency.
- **Tamper-Evident QR Serialization**: Unique non-guessable identifiers generated for each production lot with 1-click PNG/SVG download.
- **Multi-Node Supply Chain Provenance**: Real-time tracking from cleanroom manufacturing to wholesale distributors and dispensing pharmacies.
- **21 CFR Part 11 Audit Trail**: Immutable append-only logging of all authentication events, license decisions, and custodial handovers.
- **Role-Based Workspaces**: Tailored dashboards for Super Admin, Field Regulators, Manufacturers, Distributors, and Retail Pharmacies.
- **Blockchain Ready**: Includes SHA-256 state hashing and a tested Solidity smart contract (`PharmaSupplyChain.sol`).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, React Router v7, Context API, CSS Design System, `qrcode`
- **Backend**: Node.js, Express.js 5, Multer, Helmet, BCryptJS, JSONWebToken, Crypto
- **Database**: MongoDB & Mongoose (9 normalized models with compound indexing)
- **Blockchain**: Solidity 0.8.28, Hardhat, Viem unit testing (6/6 tests passing)

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- Node.js >= 18.x
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 2. Backend Setup
```bash
cd backend
npm install
node src/scripts/seedSampleData.js # Populates demo accounts, drugs, and provenance
npm run dev # or: npm start (Runs on http://localhost:5000)
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev # Runs on http://localhost:5173
```

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@securepharma.gov` | `SuperAdmin@123456` | `/admin/dashboard` |
| **Regulator** | `regulator@securepharma.gov` | `Regulator@123456` | `/regulator/licenses` |
| **Manufacturer** | `mfg@apexbiopharma.com` | `Mfg@123456` | `/manufacturer/batches` |
| **Distributor** | `logistics@novalog.com` | `Dist@123456` | `/distributor/shipments` |
| **Pharmacy** | `care@medlifepharma.com` | `Pharm@123456` | `/pharmacy/products` |

---

## 🧪 Automated Testing

### Backend End-to-End Test Suite (13/13 passing):
```bash
cd backend
node src/scripts/testEndToEnd.js
```

### Blockchain Hardhat Unit Tests (6/6 passing):
```bash
cd blockchain
npx hardhat test
```

### Frontend Production Bundle:
```bash
cd frontend
npm run build
```

---

## 📚 Complete Technical Documentation

- **[REST API Reference](docs/API.md)**: Specifications for all 25+ endpoints.
- **[Database Schemas & Data Model](docs/DATABASE.md)**: Mongoose schemas, relationships, and indexes.
- **[System Architecture & 9-Point Flow](docs/ARCHITECTURE.md)**: Architectural diagrams and cryptographic state model.
- **[Security & Compliance Standards](docs/SECURITY.md)**: Threat modeling, document hashing, and DSCSA/21 CFR Part 11 protocols.
