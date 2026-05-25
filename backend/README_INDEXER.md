Indexer Integration Guide

This document explains three straightforward ways to get an Algorand Indexer endpoint for `live-confirm` / on-chain lookups.

1) PureStake (recommended for demos)

- Sign up at https://developer.purestake.io/ and create an API key for Algorand.
- Use the following base URLs (choose TestNet or MainNet):
  - TestNet: https://testnet-algorand.api.purestake.io/idx2
  - MainNet: https://mainnet-algorand.api.purestake.io/idx2
- Set env vars in the repo root `.env` (copy from `.env.example`):

  PowerShell:

  $env:INDEXER_URL="https://testnet-algorand.api.purestake.io/idx2"
  $env:INDEXER_TOKEN="<YOUR_PURESTAKE_KEY>"

  Or put in `.env`:

  INDEXER_URL=https://testnet-algorand.api.purestake.io/idx2
  INDEXER_TOKEN=<YOUR_PURESTAKE_KEY>

- Start backend: `node backend/index.js`
- Test the live-confirm endpoint (replace CLAIM_ID with a tx id or test id):

  curl "http://localhost:4001/api/v1/claim-status/CLAIM_ID"

Notes: PureStake is stable and appropriate for demos; do not commit your key.


2) AlgoExplorer public API (quick, no key required)

- Public indexer endpoints (may be rate-limited):
  - Production / generic: https://algoexplorerapi.io/idx2/v2
  - TestNet: https://api.testnet.algoexplorer.io/idx2/v2

- Set `INDEXER_URL` to the URL above and leave `INDEXER_TOKEN` empty.
- Start backend and test as above.

Limitations: public endpoints can be rate-limited or changed without notice. For reliable demos, prefer PureStake.


3) Local Indexer (Algorand Sandbox)

- For full control, run Algorand Sandbox locally (Docker/WSL). See https://github.com/algorand/sandbox
- Quick steps (Linux/WSL/Docker):

  git clone https://github.com/algorand/sandbox.git
  cd sandbox
  ./sandbox up

- The sandbox output will show indexer endpoints and tokens (usually on localhost with a port like 8980). Use those values in `.env`.


Security hints

- Never commit `INDEXER_TOKEN` into git. Put keys into a `.env` file and add `.env` to `.gitignore`.
- For production-grade deployments, use a secrets manager (AWS Parameter Store, Secrets Manager, Azure KeyVault, etc.).


If you want, I can:

- Wire PureStake into the backend and run an automated confirmation test (you supply the token), or
- Add a small helper script that validates `INDEXER_URL` connectivity without sending keys here.

Tell me which option you prefer and I'll implement it.