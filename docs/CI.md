CI Smoke Test

The repo includes a lightweight GitHub Actions workflow `.github/workflows/ci-smoke.yml` that runs on push/PR to `main`.

What it does
- Checks out code
- Installs backend and frontend dependencies
- Starts the backend locally
- Runs the `frontend/scripts/e2e_offline_test.mjs` smoke test to validate sign/verify + revocation snapshot behavior

Why this is safe
- The workflow exercises only local demo behavior (no external API keys required).
- If you enable KMS in CI, add appropriate secrets and adjust IAM policies.

How to run locally (equivalent)
```bash
# start backend
node backend/index.js &
# wait until ready, then in frontend
node frontend/scripts/e2e_offline_test.mjs
```
