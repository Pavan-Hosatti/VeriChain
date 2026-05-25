# Offline Flow Plan - Implemented Slice Notes

## Goal
Add an offline-friendly verifier flow without breaking the existing issuance, sharing, or revocation paths.

## Current Behavior
- Admin/issuer uses Pera Wallet to mint and revoke credentials on Algorand.
- Student can mark credentials visible or private.
- Student can generate a QR token or magic link from visible active claims.
- Verifier can scan QR or paste a magic link and verify the signed proof locally first.
- The verifier can still fall back to live network confirmation when the network exists.

## New Offline Flow We Want
- Admin keeps minting and revoking on-chain as before.
- Student keeps generating QR/magic links as before.
- The verifier app verifies the proof locally first.
- If network exists, the app can also confirm live blockchain status.
- If network is missing, the app still works using cached trust data.

## What Offline Verification Will Check
1. Signature validity
2. Token expiry
3. Trusted issuer public key
4. Cached revocation state
5. Optional live on-chain confirmation when internet exists

## Fallback Rules
- If live blockchain lookup fails, show cached or pending status instead of crashing.
- If QR scan fails, allow manual paste of the token.
- If magic link fails, allow QR verification fallback.
- If cache is stale, show a warning but keep the flow usable.

## What Must Stay Untouched
- Mint on Algorand through Pera Wallet.
- Revocation on Algorand through Pera Wallet.
- Student visibility controls.
- Existing QR and magic-link generation UI.

## Already Implemented in the Frontend
- Signed share proof generation.
- Offline-first QR and magic-link verification.
- Local cache for claims and revocation state.
- Graceful fallback to live registry verification when available.

## Next Implementation Target
Build the verifier-side offline check first, then add issuer key cache and revocation cache support.
