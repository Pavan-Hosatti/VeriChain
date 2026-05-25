KMS Integration (Quick Guide)

This doc summarizes the KMS integration options and how to enable them for the backend.

Options
- Env-backed raw keys: set `ISSUER_PUBLIC_BASE64` and `ISSUER_SECRET_BASE64` in environment for immediate use (demo only).
- AWS KMS asymmetric Ed25519: set `AWS_KMS_KEY_ID` and `AWS_REGION` in env. Backend will call KMS `GetPublicKey` and `Sign`.

Quick local test (env keys)
1. Generate keys locally (Node):
   ```bash
   node -e "const nacl=require('tweetnacl');const kp=nacl.sign.keyPair();console.log(Buffer.from(kp.publicKey).toString('base64'));console.log(Buffer.from(kp.secretKey).toString('base64'))"
   ```
2. Set in PowerShell:
   ```powershell
   $env:ISSUER_PUBLIC_BASE64="<public>"
   $env:ISSUER_SECRET_BASE64="<secret>"
   node backend/index.js
   ```

AWS KMS (production)
- Create an asymmetric Ed25519 key in KMS and set `AWS_KMS_KEY_ID` and `AWS_REGION`.
- Grant `kms:Sign` and `kms:GetPublicKey` to the IAM principal running the backend.
- The backend will prefer KMS if `AWS_KMS_KEY_ID` is present; otherwise it falls back to local key.

Notes
- KMS usage is optional for demo: the repo defaults to a demo key if no KMS or env keys provided.
