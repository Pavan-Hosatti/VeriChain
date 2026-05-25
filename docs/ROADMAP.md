# 🚀 Future Roadmap

RapidAuth is designed to grow from a Hackathon prototype into a production-grade infrastructure.

## Phase 1: Decentralized Storage (IPFS)
Currently, high-fidelity data is stored in the local Identiy Vault. We plan to integrate **IPFS (via Pinata or Web3.Storage)** to store encrypted documents, with only the IPFS CID (Content Identifier) anchored on Algorand.

## Phase 2: Zero-Knowledge Proofs (ZKP)
Implement **ZKP (via SnarkyJS or similar)** to allow "Age Verification" or "Qualification Check" without revealing the actual birthdate or GPA to the recruiter.
- *Example*: "Verify that this student has a GPA > 3.5" without showing the actual 3.8.

## Phase 3: Institutional DAO
Move the 'Authority' role to a **Multi-Sig DAO**. Credentials would require signatures from 2/3 department heads before being minted to the blockchain, preventing insider fraud.

## Phase 4: Mobile Wallet App
Native iOS/Android application with biometric unlock for the Identity Vault, allowing students to "Tap to Verify" at job fairs.
