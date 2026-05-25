RapidAuth — 60–90s Demo (Concise)

Goal: Show end-to-end credential sharing and verification with offline fallback.

1) Start services (10s)
   - Backend: `node backend/index.js`
   - Frontend dev: `cd frontend && npm run dev`

2) Issuer (Authority) — mint & sign (20s)
   - Click `Connect Pera Wallet` (Authority card).
   - Issue a sample claim (e.g., Degree) to student S100.
   - The backend returns an Ed25519-signed proof immediately for that claim.

3) Student — share (15s)
   - Student logs in with the demo email (OTP displayed in UI).
   - Open `My Credentials` → `Share` and pick `QR` or `Magic Link`.
   - Copy the Magic Link or scan the QR with the Verifier UI.

4) Verifier — verify (20s)
   - Verifier logs in (demo OTP).
   - Paste the Magic Link or scan QR; verifier verifies signature and shows `PASS`.
   - Click `Confirm on-chain (live)` to show indexer/live-confirm fallback.

5) Offline demo (20s)
   - Toggle network off (or simulate offline in browser devtools).
   - Re-run verification with previously generated QR — offline verify should still work using cached revocation snapshot.
   - Bring network back -> click `Confirm on-chain` to show live status again.

Talking points
- Ed25519 issuer signing provides cryptographic non-repudiation.
- Revocation snapshots enable offline verification and small trust windows.
- Live-confirm uses Algorand indexer for authoritative checks (optional).

Timing: 60–90 seconds total. Keep explanations short and show the UI steps.
