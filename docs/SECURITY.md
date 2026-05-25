# 🔐 Security & Privacy Analysis

## 1. Cryptographic Integrity
RapidAuth uses **SHA-256** for all credential anchoring. Even if the student's local data is compromised, any tampering with the credential value or issuer name will result in a hash mismatch against the Algorand blockchain record.

## 2. Privacy via Salting
To prevent "Rainbow Table" attacks or brute-force guessing of student names on a public ledger:
- Every hash is salted with a unique institutional salt (`VITE_SALT`).
- This ensures that two students with the same name and degree have unique, unguessable ledger hashes.

## 3. Revocation Logic
RapidAuth handles revocation through **Supersede Transactions**:
- When a claim is updated (e.g., corrected Grade), the new transaction carries a pointer (`previousVersion`) to the old record.
- The UI automatically flags the old record as `REPLACED` or `REVOKED`.

## 4. Unicode Safety
Standard Base64 encoding (btoa/atob) often crashes on non-ASCII characters (e.g., accents in names, emojis). RapidAuth uses a **cross-platform UTF-8 encoding** strategy to ensure global compatibility without data loss or application crashes.
