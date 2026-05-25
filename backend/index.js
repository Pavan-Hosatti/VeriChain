const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const algosdk = require('algosdk');
require('dotenv').config();

const app = express();

// 🚀 Production CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'https://rapid-auth-two.vercel.app',
    'https://rapid-auth-ac8wmtkq8-pavan-hosattis-projects.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json({ limit: '25mb' }));

// ─────────────────────────────────────────────────────────────────────────────
// RAPIDAUTH BACKEND (SIMULATED)
// In a full production deployment, this layer would:
// 1. Generate and verify OTPs via Twilio/AWS SES.
// 2. Fetch on-chain claim data from the Algorand Indexer for the Registry.
// 3. Store non-sensitive metadata (e.g. university logs, student profiles).
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        network: 'Algorand Testnet',
        timestamp: new Date().toISOString()
    });
});

// Endpoint for the Identity Hub to fetch verified claims
app.get('/api/claims/:studentId', (req, res) => {
    // Simulated lookup logic
    res.json({ message: "Lookup redirected to Algorand Testnet AVM" });
});

// Revocation snapshot endpoint (for offline clients to download revocation state)
// Serves a simple JSON snapshot file located at backend/revocations.json
app.get('/api/v1/revocations', (req, res) => {
    try {
        // Lazy read so edits to the JSON file are reflected without restart in dev
        // (in production you'd read from a DB or generate dynamically)
        const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'revocations.json'), 'utf8'));
        res.json(snapshot);
    } catch (err) {
        res.status(500).json({ error: 'Could not load revocation snapshot' });
    }
});

// Dynamic revocation registrar endpoint
// Appends a revoked claim ID to the revocations.json snapshot
app.post('/api/v1/revoke', (req, res) => {
    const { claimId } = req.body || {};
    if (!claimId) {
        return res.status(400).json({ error: 'Missing claimId payload parameter' });
    }
    try {
        const filePath = path.join(__dirname, 'revocations.json');
        const snapshot = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!Array.isArray(snapshot.revokedIds)) {
            snapshot.revokedIds = [];
        }
        if (!snapshot.revokedIds.includes(claimId)) {
            snapshot.revokedIds.push(claimId);
            snapshot.snapshotAt = new Date().toISOString();
            fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
            console.log(`[REVOCATION] Claim ${claimId} successfully added to revocation index`);
        }
        return res.status(200).json({ success: true, snapshot });
    } catch (err) {
        console.error('[REVOCATION] Failed to update snapshot file:', err);
        return res.status(500).json({ error: 'Failed to update revocation snapshot index' });
    }
});

app.post('/api/v1/ai/analyze', async (req, res) => {
    try {
        const { filename, mimeType, base64 } = req.body || {};
        if (!base64) {
            return res.status(400).json({ error: 'Missing base64 payload' });
        }

        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
        const buffer = Buffer.from(base64, 'base64');
        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: mimeType || 'application/octet-stream' }), filename || 'certificate.bin');

        const response = await fetch(`${aiServiceUrl.replace(/\/$/, '')}/analyze`, {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        if (!response.ok) {
            return res.status(response.status).json({ error: 'AI service returned an error', details: text });
        }

        try {
            return res.status(200).json(JSON.parse(text));
        } catch (parseErr) {
            return res.status(502).json({ error: 'AI service returned invalid JSON', details: text });
        }
    } catch (err) {
        return res.status(502).json({ error: 'Could not reach AI service', details: err.message || String(err) });
    }
});

// Shared state for global-api module — do not remove
app.locals.firestoreDb = null;  // Firestore instance, or null if not configured
// --- Persistent Storage Helpers ---
const CREDENTIALS_DB_PATH = path.join(__dirname, 'credentials.json');
const API_KEYS_DB_PATH = path.join(__dirname, 'api_keys.json');

// Load credentials
let inMemoryCredentials = {};
try {
    if (fs.existsSync(CREDENTIALS_DB_PATH)) {
        inMemoryCredentials = JSON.parse(fs.readFileSync(CREDENTIALS_DB_PATH, 'utf8'));
    }
} catch (e) {
    console.error('Failed to load credentials DB', e);
}
app.locals.credentials = inMemoryCredentials;

// Load API Keys
let apiKeys = ['live_sk_rapidauth_demo_123']; // default fallback
try {
    if (fs.existsSync(API_KEYS_DB_PATH)) {
        apiKeys = JSON.parse(fs.readFileSync(API_KEYS_DB_PATH, 'utf8'));
    } else {
        // Init file if it doesn't exist
        fs.writeFileSync(API_KEYS_DB_PATH, JSON.stringify(apiKeys, null, 2));
    }
} catch (e) {
    console.error('Failed to load API keys DB', e);
}

app.locals.addAudit    = (action, details) => console.log('[AUDIT]', action, details);

// Endpoint to populate the store when a credential is minted
app.post('/api/v1/store-credential', (req, res) => {
    const cred = req.body;
    if (!cred || !cred.verificationId) return res.status(400).json({error: 'Missing verificationId'});

    // Auto-compute SHA-256 documentHash from canonical payload fields
    // This ensures the verify endpoint's tamper-detection check will pass
    if (!cred.documentHash || cred.documentHash === 'mock-hash') {
        const crypto = require('crypto');
        const canonical = {
            studentId:   cred.studentId,
            studentName: cred.studentName,
            docType:     cred.docType,
            value:       cred.value,
            issuer:      cred.issuer,
            issuedAt:    cred.issuedAt,
        };
        cred.documentHash = crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
    }

    app.locals.credentials[cred.verificationId] = cred;
    if (cred.txId) app.locals.credentials[cred.txId] = cred;
    
    // Persist to disk
    try {
        fs.writeFileSync(CREDENTIALS_DB_PATH, JSON.stringify(app.locals.credentials, null, 2));
        console.log(`[STORE] Credential ${cred.verificationId} persisted (hash: ${cred.documentHash.slice(0,12)}...)`);
    } catch(e) { console.error('Write failed for credentials', e); }
    
    res.json({success: true, documentHash: cred.documentHash});
});

// Endpoint to generate a new live API key
app.post('/api/v1/generate-key', (req, res) => {
    // Generate a secure 32-byte hex key
    const newKey = 'live_sk_' + require('crypto').randomBytes(16).toString('hex');
    if (!apiKeys.includes(newKey)) {
        apiKeys.push(newKey);
        try {
            fs.writeFileSync(API_KEYS_DB_PATH, JSON.stringify(apiKeys, null, 2));
        } catch(e) { console.error('Write failed for API keys', e); }
    }
    res.json({ apiKey: newKey, status: 'Active' });
});

// --- VIP API Key Bouncer ---
app.use((req, res, next) => {
    // Only protect /api/v1/verify and /api/v1/credential
    if (req.path.startsWith('/api/v1/verify') || req.path.startsWith('/api/v1/credential')) {
        const apiKey = req.headers['x-api-key'] || req.query.api_key;
        if (!apiKey || !apiKeys.includes(apiKey)) {
            return res.status(401).json({
                error: "Unauthorized: Invalid or Missing API Key. Purchase a VIP Key to use the Global API.",
                code: "UNAUTHORIZED"
            });
        }
    }
    next();
});

// --- Public Verification Endpoints (No API Key Required) ---
// These are used by shareable links, QR codes, and the /verify/:id frontend route.
// External recruiters, HR portals, and anyone with a link can verify credentials here.
const { verifyCredentialByTxId, getCredentialPublic } = require('./global-api/service');

app.get('/api/v1/public/verify/:txId', async (req, res) => {
    const { txId } = req.params;
    const db    = req.app.locals.firestoreDb;
    const store = req.app.locals.credentials;
    const { status, body } = await verifyCredentialByTxId(txId, db, store);
    if (req.app.locals.addAudit) {
        const outcome = body.verified ? 'VERIFIED' : `REJECTED:${body.status || body.code}`;
        req.app.locals.addAudit('PUBLIC_VERIFY', `txId=${txId} → ${outcome}`);
    }
    res.status(status).json(body);
});

app.get('/api/v1/public/credential/:credentialId', async (req, res) => {
    const { credentialId } = req.params;
    const db    = req.app.locals.firestoreDb;
    const store = req.app.locals.credentials;
    const { status, body } = await getCredentialPublic(credentialId, db, store);
    res.status(status).json(body);
});

// Global Credential Verification API (Private — requires API key) — plug-and-play, do not modify
app.use('/api/v1', require('./global-api/routes'));

const PORT = process.env.PORT || 4001;

// Default to AlgoExplorer TestNet public indexer so demos run without an API key.
// You can override by setting INDEXER_URL / INDEXER_TOKEN in .env
const DEFAULT_INDEXER = 'https://api.testnet.algoexplorer.io/idx2/v2';
const INDEXER_URL = process.env.INDEXER_URL || process.env.ALGOD_INDEXER_URL || DEFAULT_INDEXER;
const INDEXER_TOKEN = process.env.INDEXER_TOKEN || process.env.ALGOD_INDEXER_TOKEN || '';

app.listen(PORT, () => {
    console.log(`🚀 RapidAuth Backend running on port ${PORT}`);
    try {
        const parsed = new URL(INDEXER_URL);
        if (INDEXER_URL === DEFAULT_INDEXER) {
            console.log(`Using default public indexer for demo: ${parsed.host}`);
            console.log('No API key required for this public endpoint (may be rate-limited).');
        } else {
            console.log(`Indexer configured: ${parsed.host}`);
        }
    } catch (e) {
        console.log('Indexer configured (invalid URL format)');
    }
});

// ------------------------------------------------------------------
// Ed25519 signing endpoint for issuer proof signing (simulated)
// POST /api/v1/sign-proof
// Body: { payload: { ... } }
// Response: { signature: base64, publicKey: base64, proofType: 'offline-ed25519' }
// ------------------------------------------------------------------
const KEY_PATH = path.join(__dirname, 'issuer_key.json');

function ensureKeypair() {
    // First prefer explicit env-based secret (use a secrets manager to populate these in prod)
    const envSecret = process.env.ISSUER_SECRET_BASE64 || null;
    const envPublic = process.env.ISSUER_PUBLIC_BASE64 || null;
    if (envSecret && envPublic) {
        try {
            return {
                publicKey: Buffer.from(envPublic, 'base64'),
                secretKey: Buffer.from(envSecret, 'base64')
            };
        } catch (err) {
            // fall through to other sources
        }
    }

    // Next try the on-disk demo key (existing behavior)
    if (fs.existsSync(KEY_PATH)) {
        try {
            const raw = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
            return {
                publicKey: Buffer.from(raw.publicKey, 'base64'),
                secretKey: Buffer.from(raw.secretKey, 'base64')
            };
        } catch (err) {
            // fallthrough to generate
        }
    }

    // Fallback: generate and persist a demo keypair (only for local/dev)
    const kp = nacl.sign.keyPair();
    const toSave = {
        publicKey: Buffer.from(kp.publicKey).toString('base64'),
        secretKey: Buffer.from(kp.secretKey).toString('base64'),
        createdAt: new Date().toISOString()
    };
    try {
        fs.writeFileSync(KEY_PATH, JSON.stringify(toSave, null, 2));
    } catch (err) {
        // ignore write failures (e.g., read-only deployments)
    }
    return { publicKey: Buffer.from(kp.publicKey), secretKey: Buffer.from(kp.secretKey) };
}

// canonical stringify reused from frontend implementation
function sortValue(value) {
    if (Array.isArray(value)) return value.map(sortValue);
    if (value && typeof value === 'object' && value.constructor === Object) {
        return Object.keys(value).sort().reduce((acc, key) => {
            acc[key] = sortValue(value[key]);
            return acc;
        }, {});
    }
    return value;
}

function canonicalStringify(v) {
    return JSON.stringify(sortValue(v));
}

app.post('/api/v1/sign-proof', async (req, res) => {
    const body = req.body || {};
    const payload = body.payload;
    if (!payload) return res.status(400).json({ error: 'Missing payload' });

    try {
        // Remove any signature fields before signing
        const unsigned = { ...payload };
        delete unsigned.signature;
        delete unsigned.sig;
        delete unsigned.proofType;
        delete unsigned.proofPublicKey;

        const canonical = canonicalStringify(unsigned);

        // Optional: use AWS KMS to sign if configured (non-breaking; falls back to local key)
        const AWS_KMS_KEY_ID = process.env.AWS_KMS_KEY_ID || null;
        if (AWS_KMS_KEY_ID) {
            try {
                // dynamically require AWS SDK to avoid adding runtime dependency unless used
                // eslint-disable-next-line global-require
                const { KMSClient, SignCommand, GetPublicKeyCommand } = require('@aws-sdk/client-kms');
                const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
                // Retrieve public key
                const pubResp = await kmsClient.send(new GetPublicKeyCommand({ KeyId: AWS_KMS_KEY_ID }));
                const pubKey = pubResp.PublicKey; // Uint8Array
                // Sign the canonical bytes
                const signResp = await kmsClient.send(new SignCommand({ KeyId: AWS_KMS_KEY_ID, Message: Buffer.from(canonical, 'utf8'), MessageType: 'RAW', SigningAlgorithm: 'Ed25519' }));
                const sig = signResp.Signature;
                return res.json({ signature: Buffer.from(sig).toString('base64'), publicKey: Buffer.from(pubKey).toString('base64'), proofType: 'offline-ed25519' });
            } catch (kmsErr) {
                console.error('KMS signing failed, falling back to local key:', kmsErr && kmsErr.message ? kmsErr.message : kmsErr);
                // fall through to local signing
            }
        }

        const { publicKey, secretKey } = ensureKeypair();
        const sig = nacl.sign.detached(Buffer.from(canonical, 'utf8'), new Uint8Array(secretKey));
        return res.json({ signature: Buffer.from(sig).toString('base64'), publicKey: Buffer.from(publicKey).toString('base64'), proofType: 'offline-ed25519' });
    } catch (err) {
        console.error('sign-proof error', err);
        return res.status(500).json({ error: 'Signing failed' });
    }
});

// Simulated on-chain claim status lookup for live-confirm
// GET /api/v1/claim-status/:claimId
// Simple in-memory cache for claim status (helpful during demos to avoid repeated indexer calls)
const claimStatusCache = new Map(); // claimId -> { status, source, snapshotAt, expiresAt }
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

app.get('/api/v1/claim-status/:claimId', async (req, res) => {
    const claimId = req.params.claimId;
    try {
        // Check cache first
        const cached = claimStatusCache.get(claimId);
        if (cached && Date.now() < cached.expiresAt) {
            return res.json({ claimId, status: cached.status, source: cached.source, snapshotAt: cached.snapshotAt || null, cached: true });
        }
        // If an Indexer URL is configured, try to use it for live lookups
        const INDEXER_URL = process.env.INDEXER_URL || process.env.ALGOD_INDEXER_URL || null;
        const INDEXER_TOKEN = process.env.INDEXER_TOKEN || process.env.ALGOD_INDEXER_TOKEN || '';

        if (INDEXER_URL) {
            try {
                const indexerClient = new algosdk.Indexer(INDEXER_TOKEN, INDEXER_URL, '');
                // Try lookup by transaction id (if it exists)
                try {
                    const info = await indexerClient.lookupTransactionByID(claimId).do();
                    // Found transaction => treat as active for demo purposes
                    const out = { claimId, status: 'active', source: 'indexer', snapshotAt: null, cached: false, found: true };
                    claimStatusCache.set(claimId, { ...out, expiresAt: Date.now() + CACHE_TTL_MS });
                    return res.json(out);
                } catch (err) {
                    // Not found or error, continue to fallback
                }
            } catch (err) {
                // Indexer init failed, continue to fallback
            }
        }

        // Default fallback: use local revocations.json snapshot
        // Use fs.readFileSync (not require) so edits to the file are reflected without restart
        const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'revocations.json'), 'utf8'));
        const revoked = Array.isArray(snapshot.revokedIds) && snapshot.revokedIds.includes(claimId);
        const out = { claimId, status: revoked ? 'revoked' : 'active', source: 'snapshot', snapshotAt: snapshot.snapshotAt || null, cached: false };
        claimStatusCache.set(claimId, { ...out, expiresAt: Date.now() + CACHE_TTL_MS });
        return res.json(out);
    } catch (err) {
        res.status(500).json({ error: 'Could not read revocation snapshot' });
    }
});
