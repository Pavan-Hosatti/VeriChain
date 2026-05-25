Secure Signing Key Options

This project ships with a demo file-based key (`backend/issuer_key.json`) for local development only. For any deployment or when connecting AI/services, replace the demo key with a secure signer.

Recommended options (pick one):

1) Use environment-provisioned secret (simple, immediate)
- Store the issuer secret key (ed25519 secretKey bytes) base64-encoded in your deployment secrets as `ISSUER_SECRET_BASE64` and the public key as `ISSUER_PUBLIC_BASE64`.
- Example `.env` (do NOT commit):

  ISSUER_PUBLIC_BASE64=CheeUFSc2x7+pvgv4B49ZP3O5XltJaXTBSZnTZj/A7A=
  ISSUER_SECRET_BASE64=<base64-encoded-64-byte-secret>

- The backend will prefer these env values and will not read/write `issuer_key.json` when provided.

2) Use a KMS or HSM (recommended for production)
- Store the key in AWS KMS, Azure Key Vault, or Google Cloud KMS. Use a small wrapper service or SDK to fetch and use the key for signing.
- Pattern: keep the private key inside the KMS and expose a signing API or use the provider SDK to sign bytes directly.
- If you implement a KMS signer, modify `ensureKeypair()` or add a `getSigner()` that calls KMS and returns `{ publicKey, sign(bytes) }`.

3) Use a managed signing service
- Some providers offer dedicated signing-as-a-service. Integrate via HTTPS from the backend; keep credentials in deployment secrets.

Rotation & security
- Rotate keys regularly and use versioned secrets when possible.
- Audit access to the secret and restrict network access to your backend.
- Never log secret material; don't commit secrets to git.

Local development
- If no env secrets are provided, the backend will generate and persist a demo key to `backend/issuer_key.json` for convenience.

If you want, I can:
- Add an example `backend/test_kms.js` that validates the configured env-based secret and attempts a sign/verify roundtrip (you run locally), or
- Scaffold an AWS KMS signer using the AWS SDK (requires adding `aws-sdk` dependency).

Tell me which of the two you prefer.