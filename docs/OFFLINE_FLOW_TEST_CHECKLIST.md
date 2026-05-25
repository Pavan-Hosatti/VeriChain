# Offline Flow Test Checklist - Current

## Please test the current flow before I change anything

### Admin Flow
- Log in as issuer/admin using Pera Wallet.
- Mint a credential on Algorand.
- Confirm a Tx ID is generated.
- Revoke one credential and confirm the revoked status appears.

### Student Flow
- Log in as student.
- Open My Credentials.
- Mark one active credential as visible.
- Open QR Share and generate a QR token.
- Open Email Share and generate a magic link.

### Verifier Flow
- Log in as verifier.
- Paste the QR token into the QR tab and verify it.
- Paste the magic link into the Magic Link tab and verify it.
- Check that visible active credentials are shown correctly.
- Confirm revoked or hidden credentials do not appear as shareable.

### Offline-First Check
- Refresh the browser and verify the verifier still works with cached claim state.
- Test a QR or link after disconnecting network, if possible.
- Confirm the verifier shows a safe error or fallback instead of breaking.

### What I Need From You
- Tell me whether the current flow works end to end.
- Tell me if any screen fails or feels confusing.
- Tell me if the QR or magic-link step is the one you want to improve first.
