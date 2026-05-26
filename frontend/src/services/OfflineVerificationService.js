import { HashService } from './HashService.js';
import nacl from 'tweetnacl';

const STORAGE_KEYS = {
    claims: 'rapidauth.offline.claims',
    issuers: 'rapidauth.offline.issuers',
    revokedIds: 'rapidauth.offline.revokedIds',
    revocationSnapshot: 'rapidauth.offline.revocationSnapshot',
    revocationSnapshotAt: 'rapidauth.offline.revocationSnapshotAt',
    lastProof: 'rapidauth.offline.lastProof',
};

const DEFAULT_ISSUER_NAME = 'VeriChain Authority';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const sortValue = (value) => {
    if (Array.isArray(value)) {
        return value.map(sortValue);
    }

    if (value && typeof value === 'object' && value.constructor === Object) {
        return Object.keys(value)
            .sort()
            .reduce((accumulator, key) => {
                accumulator[key] = sortValue(value[key]);
                return accumulator;
            }, {});
    }

    return value;
};

export const canonicalStringify = (value) => JSON.stringify(sortValue(value));

export const encodeBase64Url = (text) => {
    const base64 = btoa(unescape(encodeURIComponent(text)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const decodeBase64Url = (token) => {
    const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return decodeURIComponent(escape(atob(padded)));
};

export const safeJsonParse = (input) => {
    try {
        return JSON.parse(input);
    } catch {
        return null;
    }
};

export const loadCachedClaims = (fallbackClaims = []) => {
    if (!isBrowser()) {
        return fallbackClaims;
    }

    const stored = window.localStorage.getItem(STORAGE_KEYS.claims);
    if (!stored) {
        return fallbackClaims;
    }

    const parsed = safeJsonParse(stored);
    return Array.isArray(parsed) ? parsed : fallbackClaims;
};

export const syncOfflineCachesFromClaims = (claims = []) => {
    if (!isBrowser()) {
        return;
    }

    const issuerMap = claims.reduce((accumulator, claim) => {
        const issuerId = claim.issuer || 'unknown-issuer';
        if (!accumulator[issuerId]) {
            accumulator[issuerId] = {
                id: issuerId,
                name: claim.issuerLabel || DEFAULT_ISSUER_NAME,
                lastSeenAt: claim.date || new Date().toISOString(),
            };
        }

        if (claim.status === 'revoked' && claim.id) {
            accumulator[issuerId].revokedClaimIds = accumulator[issuerId].revokedClaimIds || [];
            accumulator[issuerId].revokedClaimIds.push(claim.id);
        }

        return accumulator;
    }, {});

    const revokedIds = claims
        .filter((claim) => claim.status === 'revoked' && claim.id)
        .map((claim) => claim.id);

    window.localStorage.setItem(STORAGE_KEYS.claims, JSON.stringify(claims));
    window.localStorage.setItem(STORAGE_KEYS.issuers, JSON.stringify(issuerMap));
    window.localStorage.setItem(STORAGE_KEYS.revokedIds, JSON.stringify(revokedIds));
}

export const loadOfflineCaches = () => {
    if (!isBrowser()) {
        return {
            claims: [],
            issuers: {},
            revokedIds: [],
            revocationSnapshot: null,
            revocationSnapshotAt: null,
            lastProof: null,
        };
    }

    return {
        claims: safeJsonParse(window.localStorage.getItem(STORAGE_KEYS.claims) || '[]') || [],
        issuers: safeJsonParse(window.localStorage.getItem(STORAGE_KEYS.issuers) || '{}') || {},
        revokedIds: safeJsonParse(window.localStorage.getItem(STORAGE_KEYS.revokedIds) || '[]') || [],
        revocationSnapshot: safeJsonParse(window.localStorage.getItem(STORAGE_KEYS.revocationSnapshot) || 'null'),
        // revocationSnapshotAt is stored as an ISO string, not JSON
        revocationSnapshotAt: window.localStorage.getItem(STORAGE_KEYS.revocationSnapshotAt) || null,
        lastProof: safeJsonParse(window.localStorage.getItem(STORAGE_KEYS.lastProof) || 'null'),
    };
};

export const saveLastProof = (proof) => {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.setItem(STORAGE_KEYS.lastProof, JSON.stringify(proof));
};

export const applyRevocationSnapshot = (snapshot) => {
    if (!isBrowser() || !snapshot) return;
    try {
        window.localStorage.setItem(STORAGE_KEYS.revocationSnapshot, JSON.stringify(snapshot));

        // Also update the simpler revokedIds list for legacy code paths
        if (Array.isArray(snapshot.revokedIds)) {
            window.localStorage.setItem(STORAGE_KEYS.revokedIds, JSON.stringify(snapshot.revokedIds));
        }

        if (snapshot.snapshotAt) {
            window.localStorage.setItem(STORAGE_KEYS.revocationSnapshotAt, snapshot.snapshotAt);
        } else {
            window.localStorage.setItem(STORAGE_KEYS.revocationSnapshotAt, new Date().toISOString());
        }
    } catch (err) {
        // noop
    }
};

const buildClaimSnapshot = (claim) => ({
    id: claim.id || null,
    studentId: claim.studentId || null,
    type: claim.type || 'Document',
    value: claim.value || '',
    issuer: claim.issuer || '',
    issuerLabel: claim.issuerLabel || claim.issuer || DEFAULT_ISSUER_NAME,
    date: claim.date || '',
    status: claim.status || 'active',
    visible: claim.visible !== false,
    txId: claim.txId || null,
    secureHash: claim.secureHash || null,
    previousVersion: claim.previousVersion || null,
    nextVersion: claim.nextVersion || null,
    revocationReason: claim.revocationReason || null,
});

export const buildShareProof = async ({
    student,
    claims,
    mode = 'qr',
    validityMs = 24 * 60 * 60 * 1000,
    issuerId = 'algorand:testnet',
    issuerName = DEFAULT_ISSUER_NAME,
    source = 'student-portal',
}) => {
    const issuedAt = Date.now();
    const expiresAt = issuedAt + validityMs;
    const claimSnapshot = claims.map(buildClaimSnapshot);

    const payload = {
        version: 1,
        kind: 'rapidauth.share-proof',
        mode,
        source,
        issuedAt,
        expiresAt,
        student: {
            id: student.id,
            name: student.name,
            batch: student.batch,
            dept: student.dept,
        },
        issuer: {
            id: issuerId,
            name: issuerName,
        },
        claims: claimSnapshot,
        summary: {
            claimCount: claimSnapshot.length,
            activeCount: claimSnapshot.filter((claim) => claim.status === 'active').length,
            visibleCount: claimSnapshot.filter((claim) => claim.visible).length,
        },
    };

    // Try asymmetric Ed25519 signing via local backend
    const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'https://verichain-backend-o862.onrender.com';
    try {
        const response = await fetch(`${API_BASE}/api/v1/sign-proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data && data.signature && data.publicKey) {
                console.log('[CRYPTO] Asymmetric Ed25519 signature generated via issuer KMS/keypair.');
                return {
                    ...payload,
                    signature: data.signature,
                    sig: data.signature,
                    proofType: data.proofType || 'offline-ed25519',
                    proofPublicKey: data.publicKey,
                };
            }
        }
    } catch (err) {
        console.warn('[CRYPTO] Failed to fetch asymmetric signature from backend, falling back to local SHA-256:', err);
    }

    // Local fallback: simple SHA-256 (for offline / local demo use)
    const signature = await HashService.hashString(canonicalStringify(payload));

    return {
        ...payload,
        signature,
        sig: signature,
        proofType: 'offline-sha256',
    };
};

export const encodeShareToken = (payload, transport = 'json') => {
    const serialized = JSON.stringify(payload);

    if (transport === 'magic') {
        return encodeBase64Url(serialized);
    }

    return serialized;
};

export const decodeShareToken = (input) => {
    if (!input) {
        return null;
    }

    const trimmed = String(input).trim();

    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith('http')) {
        try {
            const url = new URL(trimmed);
            const token = url.searchParams.get('token');
            if (!token) {
                return null;
            }

            const decoded = decodeBase64Url(token);
            return safeJsonParse(decoded);
        } catch {
            return null;
        }
    }

    const asJson = safeJsonParse(trimmed);
    if (asJson) {
        return asJson;
    }

    try {
        const decoded = decodeBase64Url(trimmed);
        return safeJsonParse(decoded);
    } catch {
        return null;
    }
};

export const verifyShareToken = async (rawInput, currentClaims = []) => {
    const payload = decodeShareToken(rawInput);

    if (!payload) {
        return {
            ok: false,
            stage: 'parse',
            message: 'Could not read the QR or link. Paste the full QR JSON or magic-link URL again.',
        };
    }

    const signature = payload.signature || payload.sig || '';
    const unsignedPayload = { ...payload };
    delete unsignedPayload.signature;
    delete unsignedPayload.sig;
    // Some payloads include a proofType added after signing; remove before hash comparison
    delete unsignedPayload.proofType;
    // proofPublicKey is attached after signing by the issuer; exclude it from canonicalization
    delete unsignedPayload.proofPublicKey;

    const expectedSignature = await HashService.hashString(canonicalStringify(unsignedPayload));
    const legacyDemoSignature = typeof signature === 'string' && signature.startsWith('DEMO_SIG');

    // Ed25519 verification (payload.proofType === 'offline-ed25519')
    let signatureValid = false;
    if (payload.proofType === 'offline-ed25519' && payload.proofPublicKey) {
        try {
            const base64ToUint8 = (b64) => {
                if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
                    return Uint8Array.from(Buffer.from(b64, 'base64'));
                }
                // browser fallback
                const bin = atob(b64);
                return Uint8Array.from(bin.split('').map(c => c.charCodeAt(0)));
            };

            const sigBytes = base64ToUint8(signature);
            const pubBytes = base64ToUint8(payload.proofPublicKey);
            const canonical = canonicalStringify(unsignedPayload);
            signatureValid = nacl.sign.detached.verify(new TextEncoder().encode(canonical), sigBytes, pubBytes);
        } catch (e) {
            signatureValid = false;
        }
    } else {
        signatureValid = signature === expectedSignature || legacyDemoSignature;
    }

    if (!signatureValid) {
        return {
            ok: false,
            stage: 'signature',
            message: 'Signature check failed. This token was modified or not created by the student portal.',
        };
    }

    const now = Date.now();
    const expiryValid = typeof payload.expiresAt === 'number' ? now <= payload.expiresAt : true;

    if (!expiryValid) {
        return {
            ok: false,
            stage: 'expiry',
            message: 'This token has expired. Ask the student to generate a fresh share link or QR.',
        };
    }

    const liveClaimsById = currentClaims.reduce((accumulator, claim) => {
        if (claim.id) {
            accumulator[claim.id] = claim;
        }

        if (claim.txId) {
            accumulator[claim.txId] = claim;
        }

        return accumulator;
    }, {});

    const revokedClaims = [];
    const hiddenClaims = [];

    // Also consult any locally-downloaded revocation snapshot (for offline checks)
    const caches = loadOfflineCaches();
    const snapshot = caches && caches.revocationSnapshot ? caches.revocationSnapshot : null;
    const snapshotRevokedIds = Array.isArray(snapshot && snapshot.revokedIds) ? snapshot.revokedIds : [];

    (payload.claims || []).forEach((claim) => {
        const liveClaim = claim.id ? liveClaimsById[claim.id] : claim.txId ? liveClaimsById[claim.txId] : null;
        const sourceClaim = liveClaim || claim;

        // Consider revoked if either live claim indicates revoked or the snapshot contains the id/txId
        const claimId = claim.id || claim.txId || null;
        const revokedBySnapshot = claimId && snapshotRevokedIds.includes(claimId);

        if (sourceClaim.status === 'revoked' || revokedBySnapshot) {
            const annotated = { ...sourceClaim, revokedBySnapshot: !!revokedBySnapshot };
            revokedClaims.push(annotated);
        }

        if (sourceClaim.visible === false) {
            hiddenClaims.push(sourceClaim);
        }
    });

    if (revokedClaims.length > 0) {
        return {
            ok: false,
            stage: 'revocation',
            message: 'This credential has been revoked. The verifier should not trust this share token.',
            revokedClaims,
        };
    }

    const visibleClaims = (payload.claims || []).filter((claim) => claim.visible !== false && claim.status !== 'revoked');

    return {
        ok: true,
        stage: 'verified',
        mode: payload.mode || 'qr',
        message: 'Verified offline from signed proof.',
        payload,
        student: payload.student || {
            id: payload.studentId || 'unknown',
            name: payload.name || 'Unknown Student',
            batch: payload.batch || '',
            dept: payload.dept || '',
        },
        claims: visibleClaims,
        warnings: hiddenClaims.length > 0 ? ['Some shared claims were hidden from the live vault.'] : [],
        signatureValid,
        expiryValid,
        revocationClear: revokedClaims.length === 0,
        proofType: payload.proofType || 'offline-sha256',
        publicKey: payload.proofPublicKey || null,
    };
};
