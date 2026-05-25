// E2E Offline Flow Test
// Polyfills limited browser globals used by the frontend services and runs a few scenarios.

// Simple localStorage polyfill
globalThis.window = globalThis;
class LocalStorageMock {
    constructor() { this.store = {}; }
    getItem(k) { return this.store.hasOwnProperty(k) ? this.store[k] : null; }
    setItem(k, v) { this.store[k] = String(v); }
    removeItem(k) { delete this.store[k]; }
}
globalThis.localStorage = new LocalStorageMock();

// btoa/atob using Buffer
globalThis.btoa = (str) => Buffer.from(str, 'utf8').toString('base64');
globalThis.atob = (b64) => Buffer.from(b64, 'base64').toString('utf8');

// Minimal fetch using node's fetch if available
if (typeof globalThis.fetch === 'undefined') {
    try { globalThis.fetch = (await import('node-fetch')).default; } catch (e) { /* leave undefined */ }
}

import { buildShareProof, encodeShareToken, decodeShareToken, verifyShareToken, applyRevocationSnapshot, loadOfflineCaches, canonicalStringify } from '../src/services/OfflineVerificationService.js';
import { HashService } from '../src/services/HashService.js';

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
    console.log('Starting E2E offline flow test');

    const student = { id: 'S100', name: 'Test Student', batch: '2022', dept: 'CS' };
    const claims = [
        { id: 'TC1', studentId: 'S100', type: 'Degree', value: 'B.Sc', issuer: 'Uni', date: '2024-01-01', status: 'active', visible: true },
        { id: 'TC2', studentId: 'S100', type: 'Marks', value: 'CGPA 8.2', issuer: 'Uni', date: '2024-01-02', status: 'active', visible: true },
    ];

    // Build proof (student shares)
    const proof = await buildShareProof({ student, claims, mode: 'qr', validityMs: 60 * 60 * 1000 });
    const unsigned = { ...proof };
    delete unsigned.signature;
    delete unsigned.sig;
    delete unsigned.proofType;
    delete unsigned.proofPublicKey;
    
    let localCalcOk = false;
    if (proof.proofType === 'offline-ed25519') {
        const sigBytes = Uint8Array.from(Buffer.from(proof.signature, 'base64'));
        const pubBytes = Uint8Array.from(Buffer.from(proof.proofPublicKey, 'base64'));
        const canonical = canonicalStringify(unsigned);
        const nacl = (await import('tweetnacl')).default;
        localCalcOk = nacl.sign.detached.verify(new TextEncoder().encode(canonical), sigBytes, pubBytes);
    } else {
        const expectedNow = await HashService.hashString(canonicalStringify(unsigned));
        localCalcOk = expectedNow === proof.signature;
    }
    console.log('Expected (local) signature calc matches:', localCalcOk);

    // Ask backend to sign this payload with ed25519 (simulated issuer)
    const signRes = await fetch('http://localhost:4001/api/v1/sign-proof', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: proof })
    });
    const signJson = await signRes.json();
    if (signJson && signJson.signature) {
        // Attach signature and public key to payload
        proof.signature = signJson.signature;
        proof.proofType = signJson.proofType || 'offline-ed25519';
        proof.proofPublicKey = signJson.publicKey;

        // Debug: locally verify signature against computed canonical
        const unsigned = { ...proof };
        delete unsigned.signature;
        delete unsigned.sig;
        delete unsigned.proofType;
        delete unsigned.proofPublicKey;
        const canonical = canonicalStringify(unsigned);
        const sigBytes = Uint8Array.from(Buffer.from(signJson.signature, 'base64'));
        const pubBytes = Uint8Array.from(Buffer.from(signJson.publicKey, 'base64'));
        const nacl = (await import('tweetnacl')).default;
        const ok = nacl.sign.detached.verify(new TextEncoder().encode(canonical), sigBytes, pubBytes);
        console.log('Server signature local-verify:', ok);
        console.log('Client canonical:', canonical);
        console.log('Server publicKey (base64):', signJson.publicKey ? signJson.publicKey.slice(0, 24) + '...' : '<none>');
    }

    const magic = encodeShareToken(proof, 'magic');
    console.log('Encoded magic token length:', magic.length);

    // Verify online: currentClaims includes same claims
    const onlineResult = await verifyShareToken(magic, claims);
    console.log('Online verification result:', onlineResult.ok ? 'PASS' : 'FAIL', '-', onlineResult.stage);

    // Now simulate revocation: mark claim TC2 as revoked on-chain but offline verifier hasn't synced
    const liveClaims = claims.map(c => c.id === 'TC2' ? { ...c, status: 'revoked' } : c);
    const revokedResult = await verifyShareToken(magic, liveClaims);
    console.log('Live revoked verification result:', revokedResult.ok ? 'PASS' : 'FAIL', '-', revokedResult.stage);

    // Simulate offline: currentClaims is older (no revocation), but revocation snapshot lists TC2
    // Apply snapshot
    const snapshot = { snapshotAt: new Date().toISOString(), revokedIds: ['TC2'] };
    applyRevocationSnapshot(snapshot);
    console.log('Applied revocation snapshot to local cache.');

    // Verify with stale currentClaims (claims) but with snapshot present
    const offlineResult = await verifyShareToken(magic, claims);
    console.log('Offline (snapshot) verification result:', offlineResult.ok ? 'PASS' : 'FAIL', '-', offlineResult.stage);

    console.log('Cache contents sample:', JSON.stringify(loadOfflineCaches(), null, 2));

    console.log('E2E offline flow test completed');
}

run().catch(err => {
    console.error('E2E test failed:', err);
    process.exit(2);
});
