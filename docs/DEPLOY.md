Deploy & Run (Simple)

This file covers quick deployment options for the demo and recommended settings for judges.

Local (recommended for demos)
- Prereqs: Node.js 18+, npm
- Commands:
  ```bash
  # from repo root
  node backend/index.js

  # in a separate shell
  cd frontend
  npm install
  npm run dev
  ```
- Notes: Backend defaults to AlgoExplorer TestNet indexer so no API key required.

Preview (production build)
```bash
cd frontend
npm run build
npm run preview
```

Deploy to Vercel (frontend-only)
- Push the `frontend` directory to a GitHub repo and connect to Vercel.
- Set environment variable `VITE_API_BASE` to your backend URL.

Deploy backend
- For demo, any Node-capable host (Heroku, Render, DigitalOcean App Platform) works.
- Use `.env` to set `PORT`, `INDEXER_URL`, `INDEXER_TOKEN`, and `ISSUER_*` secrets.

Security & secrets
- Never commit `.env` or keys.
- Use platform secret management for `INDEXER_TOKEN`, `ISSUER_SECRET_BASE64`, or `AWS_KMS_KEY_ID`.
