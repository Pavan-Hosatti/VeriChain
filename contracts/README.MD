# Smart Contract

## 📌 Overview

It is an ARC-4 smart contract built on the Algorand blockchain.

It enables a college (admin) to:

- Issue placement claims for students
- Revoke issued claims
- Allow recruiters to verify all claims transparently

The contract ensures that only the admin (app creator) can issue or revoke claims.

The share step itself is handled in the frontend as a signed proof envelope. That means the smart contract remains the authority for issuance and revocation, while the verifier can inspect the student QR or magic link locally before falling back to live network confirmation.

---

## 🌐 Network

Algorand Testnet

## 🆔 Application ID

755797878

## 🔎 Explorer Link

https://testnet.algoexplorer.io/application/755797878

---


## 🏗 Architecture

- College (Admin Wallet)  
  ↓  
- ARC4 Smart Contract  
  ↓  
- Algorand Testnet Blockchain  
  ↓  
- Recruiters / Public Users (Read-Only Access)

---

## 🛠 Tech Stack

- Algorand Blockchain
- AlgoKit
- Algopy (ARC4)
- ARC56 ABI Specification
- Python

---
