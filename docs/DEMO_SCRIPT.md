RapidAuth — Presenter Demo Script (Step-by-step)

Prepare
- Open two terminals: Backend and Frontend.
- Backend: `node backend/index.js`
- Frontend: `cd frontend && npm run dev`

Script (for presenter) — 7 steps
1. Intro (5s): "I'll show a quick, secure, offline-capable credential verification flow."
2. Start issuer (10s): Click `Connect Pera Wallet` on Authority card; issue a Degree to student S100.
3. Student share (15s): Student logs in with demo OTP, clicks `Share` → `Magic Link`. Copy link.
4. Verifier (20s): Verifier pastes link into Verify UI → shows `Pass` and signature verified.
5. Offline check (15s): Turn off network or simulate offline; show that QR still verifies using cached snapshot.
6. Live confirm (10s): Re-enable network and click `Confirm on-chain` to show live indexer source.
7. Close (5s): Summarize: Ed25519 signing, offline revocation snapshot, indexer live-confirm fallback.

Tip: Keep narration tight; the UI has demo hints (OTP, sample emails) to speed things up.
