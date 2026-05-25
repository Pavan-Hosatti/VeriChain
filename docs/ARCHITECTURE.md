# 🏗️ RapidAuth Architecture Deep-Dive

## 🔗 The Scalable Note Anchoring Pattern
Traditional smart contract storage (Global/Local State) on Algorand is efficient but limited by physical per-app storage slots. For a "Medical Degree" or "Academic Registry" with thousands of students, a single contract would eventually hit a storage wall.

**RapidAuth solves this via Scalable Note Anchoring:**
- **Proof Generation**: The Authority generates a SHA-256 hash of the credential (salted for privacy).
- **Public Anchor**: This hash is embedded into the `Note` field of a 0-ALGO transaction sent from the Authority to itself.
- **Verification**: The Verification Gateway retrieves this transaction and compares the on-chain hash with the student's presented token.

In the current implementation, the on-chain anchor remains the source of truth for issuance and revocation, while the student-facing QR code and magic link are signed share proofs that the verifier can inspect locally first.

### Benefits
1. **Infinite Scaling**: No per-app storage limits.
2. **Cost Efficiency**: Flat 0.001 ALGO fee per issuance.
3. **Data Integrity**: Cryptographically anchored at a specific Timestamp (Round).

## 🛡️ Zero-Trust Identity Flow
RapidAuth implements a Zero-Trust architecture where the server never sees the student's private data in plaintext during the verification phase.

1. **Student Vault**: Data is stored locally or in a private encrypted database.
2. **Dynamic Tokens**: Magic links and QR codes carry time-bound, signed payloads.
3. **Signature Verification**: Validated client-side using the Authority's public key.
4. **Offline-First Verifier**: The verifier checks signature, expiry, and cached revocation state locally before falling back to live ledger confirmation.
5. **Online Fallback**: If the network is available, the verifier upgrades the result with live Algorand status.

### Current Trust Boundary
- Admin/issuer actions remain on-chain and require Pera Wallet.
- Student sharing is proof generation only and does not require blockchain interaction.
- Verifier reads the share proof first, then consults network state when possible.
