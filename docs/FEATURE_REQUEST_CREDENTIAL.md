# Feature: Automated Student Credential Request Flow

## Overview
We have seamlessly added a new "Request Credential" flow that bridges the gap between the Student Dashboard and the Issuer (Admin) Dashboard without breaking any existing functionality.

It automates the process and makes the UX incredibly fast for the college administrative staff!

This request flow still feeds into the same issuance path: the admin approves the request, mints on Algorand, and then the student can later share the issued document through the offline-first QR or magic-link verifier path.

## How to Test the Flow

1. **Log in as a Student** 
   - On the homepage, enter `ravi@campusvault.ai` and get the OTP (`123456`).
   - You will enter the Student Identity Vault.
2. **Send the Request**
   - Click the new **"➕ Request Credential"** button at the top right of your Identity Vault.
   - A sleek inline form will appear. 
   - Select the Document Type (e.g., "Internship").
   - Type in the specific note/value (e.g., "Google 6-Month Data Science Internship").
   - Click **Send Request**. (You will see a success check and the form will close securely).
3. **Log out as Student** (Click "Disconnect" on top right).
4. **Log in as Authority (Issuer)**
   - Click **Connect Pera Wallet** on the Authority login card (use a Testnet account).
5. **Approve via Auto-Fill**
   - At the very top of your Issuer Dashboard, you will now see a glowing **Pending Student Request** tab.
   - Click the **⚡ Approve & Auto-Fill** button on Ravi's request.
   - **Magic:** The entire Minting form below is instantly auto-populated with Ravi’s ID, the document type, and the description.
   - All the admin has to do is hit "Attach Document" (optional) and click "Mint Credential".
   - Once minted, the request disappears from the pending queue automatically!

## Why This is Better for the Pitch
This feature directly proves to the judges that we thought about the real-world administrative burden. Instead of forcing admins to manually type in students' details, the system is bidirectional and automated. It looks enterprise-ready.

## Relationship to the Offline Flow
- Request creation does not change the mint/revoke process.
- Once the credential exists, the student can mark it visible and share it through the signed QR or magic-link flow.
- The verifier can still validate that share even when the network is weak, because the proof is checked locally first.