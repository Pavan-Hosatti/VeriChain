# RapidAuth Feature Map

This document keeps the project clean by separating the major feature areas.

## 1. Core Credential Flow
- Admin/issuer mints and revokes credentials on Algorand.
- Student manages visibility and shares approved credentials.
- Verifier checks the shared proof.

## 2. AI Detection Layer
- Purpose: detect suspicious or tampered documents before or during issuance.
- Ownership: AI teammate.
- Rule: AI is advisory. If it fails, the core issuance and verification flow must still work.
- Fallback: hardcoded or heuristic result if the external AI service is unavailable.

## 3. Global Verification API
- Purpose: let outside institutions verify a credential without knowing Algorand.
- Inputs: transaction ID, credential ID, or signed share token.
- Outputs: issuer, status, revocation state, and human-readable verification result.
- Rule: API should never block the main app flow.
- Fallback: direct ledger lookup or cached response if the API layer is down.

## 4. Cross-Institution Sharing
- Purpose: make the same credential understandable across colleges, recruiters, and partner institutions.
- Trust anchor: issuer public key, signed proof payload, and revocation state.
- Rule: each institution should read the same proof format.

## 5. Offline-First Verification
- Purpose: keep QR and magic-link verification usable during weak or missing network.
- Verifier checks signature, expiry, issuer trust, and cached revocation data locally first.
- If online, the app upgrades the result with live Algorand confirmation.
- Fallback: never break the user flow if the network is unavailable.

## 6. Ownership Split
- Admin flow: blockchain mint/revoke and lifecycle control.
- Student flow: privacy controls and share proof generation.
- Verifier flow: offline-first validation with online fallback.
- AI flow: document-risk scoring and tamper detection.
- API flow: external verification and interoperability.

## 7. Priority Order
1. Keep the existing mint/share/verify flow working.
2. Keep offline verification stable.
3. Add AI as a separate service with fallbacks.
4. Expose the global API.
5. Polish cross-institution language and demo messaging.

## 8. Demo Rule
If any advanced feature fails, the project must still show the main credential flow end to end.