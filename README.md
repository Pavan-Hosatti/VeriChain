# VeriChain

Blockchain-based academic credential verification platform built on Algorand.

Universities issue tamper-proof digital credentials anchored on-chain. Students control their vault. Verifiers check authenticity instantly. An AI forensic layer catches forged documents before they ever reach the blockchain.

**Live demo:** https://veri-chain-s5q7.vercel.app  
**Smart contract (testnet):** App ID `755797878` — [View on Lora Explorer](https://lora.algokit.io/testnet/application/755797878)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Demo Credentials](#demo-credentials)
- [Team](#team)

---

## Overview

Academic credential fraud costs Indian companies an estimated ₹1,200 crore annually. Existing solutions cover only degrees and exclude college-level documents — NOCs, LORs, internship proofs, and achievement certificates have no standard verification layer.

VeriChain introduces a three-role system:

- **University Authority** — issues credentials by signing Algorand transactions via Pera Wallet
- **Student** — manages a private credential vault, shares via QR code or magic link
- **Recruiter / Verifier** — verifies any credential by hash, QR scan, or API call — no account required

Every issuance produces a real Algorand transaction ID. Every document is forensically analyzed before minting. Nothing can be altered or silently deleted.

![System Architecture](system%20architecture%20diagram.jpeg)

---

## Features

### AI Forensic Analysis
Before any credential reaches the blockchain, the attached document passes through a three-layer forensic pipeline:

- **Layer A — Error Level Analysis (ELA):** Detects pixel-level manipulation via JPEG recompression artifact comparison
- **Layer B — OCR Structural Analysis:** Checks text confidence scores and font-height clustering for signs of text substitution
- **Layer C — Gemini Vision API:** Evaluates layout consistency, seal authenticity, and text alignment. Automatically falls back through available models on quota exhaustion

Returns a weighted trust score and a colored badge: green (≥0.75), amber (0.45–0.74), or red (<0.45). Admins see full flag breakdown; students see the badge only.

### Blockchain Anchoring
Document SHA-256 hashes are anchored to Algorand testnet via the transaction note field (scalable note anchoring pattern). No per-app storage limits. Flat fee of ~0.001 ALGO per issuance.

### Federated B2B Verification API
Large organizations cannot manually verify credentials one by one. VeriChain exposes a programmatic API gateway so external HR systems and partner universities can automate verification entirely.

**API Key Management**
Institution admins generate `live_sk_...` API keys from the in-app dashboard. Keys are hashed and persisted on the backend — they survive server restarts and form a real system of record.

**Protected Endpoints**
All programmatic requests pass through custom Express middleware that validates the `x-api-key` header before any data is returned. Invalid or missing keys receive a `401 Unauthorized` immediately.

```
POST /api/v1/generate-key           — provision a new live API key
GET  /api/v1/credential/:id         — fetch credential metadata (requires x-api-key)
GET  /api/v1/verify/:txId           — verify by Algorand Tx ID (requires x-api-key)
GET  /api/v1/public/verify/:id      — browser-based public verification (no key required)
```

**Response payload (authenticated)**
```json
{
  "credentialId": "C001",
  "documentType": "Marksheet",
  "issuer": "Academic Office",
  "holderName": "Ravi Kumar",
  "value": "Sem 5 - 8.8 CGPA",
  "status": "active",
  "issuedAt": "2024-11-01",
  "txId": "mock-tx-C001",
  "verified": true
}
```

Verification endpoints independently re-compute the SHA-256 hash of the credential payload and return a strict boolean `verified` flag — external systems can trust the result without any manual lookup.

### Global API Key Manager
Institution admins generate and manage live API keys directly from the recruiter dashboard. The UI provisions a `live_sk_...` key with a one-click copy button and inline usage instructions — no backend access or manual configuration required.

Keys are passed via the `x-api-key` header on all programmatic requests. A **Roll New Key** option instantly revokes and replaces a compromised key without touching the backend.

### W3C Verifiable Credential Export
Credentials can be exported in W3C Verifiable Credential JSON-LD format, enabling import into any compliant university or employer portal. VeriChain does not lock credentials into a proprietary schema.

### Offline PWA Verification
Built on Web Crypto API (Ed25519 asymmetric cryptography), canonical JSON serialization, and Service Worker + Cache API. Credentials can be cryptographically verified offline with no internet connection. State is persisted via localStorage.

### Credential Lifecycle
Live status per document: Active, Expiring Soon, Expired, Revoked, or Superseded. Revocations require a reason code. Superseding preserves full version history on-chain. The audit trail is append-only.

### Student Vault
Email OTP authentication — no wallet, no seed phrase required. Each credential shows its AI badge and live blockchain status. Students control per-document visibility.

### Sharing
QR codes with configurable expiry (1h / 24h / 7d) and email-based magic links for remote recruiter access.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Algorand Testnet |
| Smart Contract | Algopy — ARC-4 / ARC-56 |
| Contract Tooling | AlgoKit |
| Frontend | React, Vite, Pera Wallet Connect, lucide-react, qrcode.react |
| AI Service | FastAPI, Pillow, pytesseract, pdf2image, pypdf, Google Gemini API |
| Backend | Express.js, algosdk |
| Auth | Firebase Auth (Email OTP) |
| Offline | Web Crypto API, Service Worker, Cache API, localStorage |
| Deployment | Vercel (frontend), Render (AI service) |

---

## Getting Started

### 1. Prerequisites

You need the following installed before running anything:

| Tool | Linux | Windows |
|---|---|---|
| Node.js v18+ | `apt install nodejs` | [nodejs.org](https://nodejs.org) |
| Python 3.11+ | `apt install python3` | [python.org](https://python.org) |
| Tesseract OCR | `apt install tesseract-ocr` | [UB-Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki) |
| Poppler | `apt install poppler-utils` | [oschwartz10612/poppler-windows](https://github.com/oschwartz10612/poppler-windows) |
| Git | `apt install git` | [git-scm.com](https://git-scm.com) |

You also need a free Gemini API key — get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

---

### 2. Clone the Repository

```bash
git clone git@github.com:Pavan-Hosatti/VeriChain.git
cd VeriChain
```

---

### 3. AI Service

The AI service must be running before the frontend — it handles document analysis at file-attach time.

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Set your Gemini key and start the server:

```bash
# Linux / macOS
export GEMINI_API_KEY="your-key-here"
./start.sh

# Windows
set GEMINI_API_KEY=your-key-here
uvicorn main:app --port 8000 --host 0.0.0.0
```

`start.sh` activates the venv automatically if present and warns if `GEMINI_API_KEY` is not set — the service still starts, but the Gemini Vision layer will be skipped.

Confirm it's running:

```bash
curl http://localhost:8000/health
# {"status":"ok","gemini_configured":true,"tesseract":"available"}
```

---

### 4. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_AI_SERVICE_URL=http://localhost:8000
```

```bash
npm run dev
# http://localhost:3000
```

---

### 5. Backend

Copy the env template and fill in your values:

```bash
cd backend
cp .env.example .env
npm install
node index.js
# http://localhost:4001
```

Key environment variables (`backend/.env`):

```
PORT=4001
ALGOD_SERVER=https://testnet-api.algonode.cloud
APP_ID=755797878
JWT_SECRET=your-secret-here
```

Handles B2B API key provisioning, revocation snapshots, live claim status, and the global verification API (`backend/global-api/`). The core minting and on-chain verification runs directly through the frontend — the backend is required for the full API federation and cross-institution features.

---

## Project Structure

```
VeriChain/
│
├── .github/
│   └── workflows/
│       └── ci-smoke.yml               # CI: build + E2E offline smoke test on push
│
├── ai-service/                        # Forensic analysis microservice (FastAPI)
│   ├── main.py                        # ELA + OCR + Gemini Vision pipeline
│   ├── requirements.txt
│   ├── Dockerfile
│   └── start.sh                       # Local startup script
│
├── backend/                           # Express.js API server
│   ├── index.js                       # Health check, B2B key provisioning, credential endpoints
│   ├── package.json
│   ├── test_kms.js                    # KMS integration test
│   ├── .env.example
│   └── global-api/
│       ├── routes.js                  # Global verification API routes
│       ├── controller.js
│       ├── service.js
│       └── utils.js
│
├── contracts/                         # Algorand smart contract
│   ├── src/
│   │   ├── contract.py                # Algopy ARC-4 contract — mint, revoke, supersede
│   │   ├── deploy_config.py
│   │   ├── __init__.py
│   │   └── __main__.py
│   ├── artifacts/
│   │   ├── PlacementVerify.approval.teal
│   │   ├── PlacementVerify.clear.teal
│   │   ├── PlacementVerify.arc56.json  # ABI imported by frontend
│   │   └── placement_verify_client.py
│   └── README.md
│
├── frontend/                          # React + Vite app
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   │   ├── manifest.json              # PWA manifest
│   │   ├── sw.js                      # Service worker for offline support
│   │   └── favicon.ico
│   ├── scripts/
│   │   └── e2e_offline_test.mjs       # E2E offline verification smoke test
│   └── src/
│       ├── App.jsx                    # Root component, role routing
│       ├── index.jsx
│       ├── index.css
│       ├── contract_abi.json          # ARC-56 ABI (synced from contracts/)
│       ├── components/
│       │   ├── ContractCaller.jsx     # Credential minting form + AI badge
│       │   ├── MyClaimsList.jsx       # Student credential vault
│       │   ├── AuditTrail.jsx         # Admin audit trail with search + revocation
│       │   ├── VerifyCredential.jsx   # Public verifier — no auth required
│       │   ├── GlobalVerify.jsx       # Global cross-institution verification
│       │   ├── ApiKeyManager.jsx      # Live API key generation + management UI
│       │   ├── DegreeSharing.jsx      # QR code + magic link sharing
│       │   ├── DegreeQRCode.jsx       # QR generation with expiry options
│       │   ├── EmailShare.jsx         # Magic link generation
│       │   ├── BulkVerify.jsx         # Batch credential verification
│       │   ├── BulkCSVIssuer.jsx      # Bulk issuance via CSV upload
│       │   ├── RoleSelector.jsx       # Auth entry — wallet / email OTP
│       │   ├── CampusWalletConnector.jsx  # Campus wallet integration
│       │   ├── MultiSigDegree.jsx     # Multi-signature degree issuance
│       │   ├── VirtualWalletShield.jsx    # Wallet security layer
│       │   ├── DemoTour.jsx           # Guided demo walkthrough
│       │   ├── FlowExplanation.jsx    # Visual flow explainer
│       │   ├── ProblemSolution.jsx    # Landing page copy
│       │   ├── MarketImpact.jsx       # Market stats display
│       │   ├── FAQAccordion.jsx       # FAQ section
│       │   ├── LiquidAuthButton.jsx   # Liquid auth UI component
│       │   ├── PrintableSheet.jsx     # Printable credential sheet
│       │   ├── Footer.jsx
│       │   ├── PremiumFooter.jsx
│       │   └── hashUtils.js           # Client-side hashing utilities
│       └── services/
│           ├── BlockchainService.js        # Algorand client, tx builder, indexer queries
│           ├── HashService.js              # SHA-256 document hashing
│           ├── WalletService.js            # Pera Wallet session management
│           ├── OfflineVerificationService.js  # Ed25519 offline credential verification
│           ├── LiveConfirmService.js       # Live claim status confirmation via backend
│           └── RevocationService.js        # Revocation snapshot sync from backend
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── ROADMAP.md
│   ├── DEPLOY.md                      # Production deployment guide
│   ├── CI.md                          # CI/CD pipeline documentation
│   ├── DEMO.md                        # Demo walkthrough
│   ├── DEMO_SCRIPT.md                 # Scripted demo for presentations
│   ├── FEATURE_MAP.md                 # Feature coverage map
│   ├── KMS_INTEGRATION.md             # KMS setup guide
│   ├── OFFLINE_FLOW_NEXT_STEPS.md
│   └── images/                        # Screenshots and diagrams
│
└── .env.example                       # Root environment variable template
```

---

## CI / Automated Testing

A smoke test pipeline runs on every push to `main` via GitHub Actions (`.github/workflows/ci-smoke.yml`):

- Installs backend and frontend dependencies
- Builds the frontend
- Starts the backend on port 4001
- Runs `frontend/scripts/e2e_offline_test.mjs` — an end-to-end offline verification test using Ed25519 signatures

To run the smoke test locally:

```bash
node backend/index.js &
cd frontend && node scripts/e2e_offline_test.mjs
```

---

## Demo Credentials

| Role | Login |
|---|---|
| University Authority | Connect Pera Wallet (Algorand testnet) |
| Student | Email: `ravi@campusvault.ai` / OTP: `123456` |
| Recruiter | Email: `hr@campusvault.ai` / OTP: `123456` |

---

## Team

| Name | Contribution |
|---|---|
| Pavan Hosatti | Core platform — Algorand integration, Pera Wallet, credential lifecycle, offline PWA verification, W3C VC export |
| Chandan | AI forensic pipeline — ELA, OCR structural analysis, Gemini Vision API integration, pre-mint badge UI |
| Harshita | Cross-institution verification, B2B API key system, federated verification endpoints |
| Sharath | Smart contract development, AlgoKit setup, testnet deployment |
| Manisha | Frontend UI, student vault, QR sharing, demo flows |

---

*Built on Algorand — 4-second finality, ~0.001 ALGO per issuance, post-quantum Falcon signatures.*
