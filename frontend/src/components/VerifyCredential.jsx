import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, Link2, Search, AlertTriangle, CheckCircle2, X, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const TABS = [
    { id: 'qr', label: 'QR Token', icon: <QrCode size={15} /> },
    { id: 'magic', label: 'Magic Link', icon: <Link2 size={15} /> },
    { id: 'registry', label: 'Registry', icon: <Search size={15} /> },
];

const VerifyCredential = ({ claims, students }) => {
    const [activeTab, setActiveTab] = useState('qr');
    const [payload, setPayload] = useState('');
    const [magicToken, setMagicToken] = useState('');
    const [registryId, setRegistryId] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (!isScanning) return;

        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        }, false);

        scanner.render((decodedText) => {
            setPayload(decodedText);
            setIsScanning(false);
            scanner.clear();
            // Automatically verify if it's a valid sig
            if (decodedText.includes('DEMO_SIG')) {
                // Short timeout to let state update
                setTimeout(() => {
                    document.getElementById('verify-qr-btn')?.click();
                }, 200);
            }
        }, (err) => {
            // Errors happen every frame when no QR detected, ignore them
        });

        return () => {
            scanner.clear().catch(() => { });
        };
    }, [isScanning]);

    const reset = () => {
        setResult(null);
        setError('');
        setPayload('');
        setMagicToken('');
        setRegistryId('');
        setIsScanning(false);
    };

    // ── QR Token Verify ──
    const handleVerifyQR = () => {
        setError(''); setResult(null); setLoading(true);
        setTimeout(() => {
            try {
                const parsed = JSON.parse(payload.trim());
                if (!parsed.sig || !parsed.sig.startsWith('DEMO_SIG')) {
                    setError('Invalid token — signature verification failed. Make sure you generated the QR from the Student portal.');
                    setLoading(false);
                    return;
                }
                if (Date.now() > parsed.expiry) {
                    setError('This token has expired. Ask the student to generate a new one.');
                    setLoading(false);
                    return;
                }
                const student = students.find(s => s.id === parsed.studentId);
                setResult({ student: student || { name: parsed.name, id: parsed.studentId, dept: parsed.dept, batch: parsed.batch }, claims: parsed.claims, source: 'QR Token' });
            } catch {
                setError('Could not parse payload. Copy the full JSON from the QR code generator and paste it here.');
            }
            setLoading(false);
        }, 900);
    };

    // ── Magic Link Verify ──
    const handleVerifyMagic = () => {
        setError(''); setResult(null); setLoading(true);
        setTimeout(() => {
            try {
                const url = magicToken.trim();
                const tokenParam = url.includes('?token=') ? url.split('?token=')[1].split('&')[0] : url;
                // Use Unicode-safe base64 decoding
                const decoded = decodeURIComponent(escape(atob(tokenParam)));
                const parsed = JSON.parse(decoded);
                if (!parsed.sig || !parsed.sig.startsWith('DEMO_SIG')) {
                    setError('Invalid magic link — signature check failed.');
                    setLoading(false);
                    return;
                }
                if (Date.now() > parsed.expiry) {
                    setError('This magic link has expired. Ask the student to generate a new one.');
                    setLoading(false);
                    return;
                }
                const student = students.find(s => s.id === parsed.studentId);
                setResult({ student: student || { name: parsed.name, id: parsed.studentId, dept: parsed.dept, batch: parsed.batch }, claims: parsed.claims, source: 'Magic Link' });
            } catch {
                setError('Invalid magic link format. Paste the full URL or token from the student\'s Email Share.');
            }
            setLoading(false);
        }, 900);
    };

    // ── Registry Lookup ──
    const handleRegistryLookup = () => {
        setError(''); setResult(null); setLoading(true);
        setTimeout(() => {
            const id = registryId.trim().toUpperCase();
            const student = students.find(s => s.id === id);
            if (!student) {
                setError(`No student found with ID "${id}". Try S001 or S002.`);
                setLoading(false);
                return;
            }
            const studentClaims = claims.filter(c => c.studentId === id && c.status === 'active' && c.visible !== false);
            setResult({ student, claims: studentClaims.map(c => ({ type: c.type, value: c.value, issuer: c.issuer, date: c.date })), source: 'On-Chain Registry' });
            setLoading(false);
        }, 700);
    };

    return (
        <div className="cv-card">
            <div className="cv-card-header">
                <h2>🔍 Recruiter Verification Gateway</h2>
                <p className="cv-hint">Instantly validate candidate credentials via cryptographic proof or direct ledger lookup.</p>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.75rem', borderBottom: '1px solid var(--cv-border)', paddingBottom: '0' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); reset(); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.7rem 1.25rem',
                            borderRadius: '10px 10px 0 0',
                            border: 'none',
                            background: activeTab === tab.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--cv-primary)' : 'var(--cv-text-dim)',
                            borderBottom: activeTab === tab.id ? '2px solid var(--cv-primary)' : '2px solid transparent',
                            fontWeight: activeTab === tab.id ? '700' : '500',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '1.75rem 0' }}>

                {/* ── QR TOKEN tab ── */}
                {activeTab === 'qr' && (
                    <div>
                        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.84rem', color: 'var(--cv-text-muted)', lineHeight: 1.7 }}>
                            <strong style={{ color: 'var(--cv-primary)' }}>How to use:</strong> Use the camera to scan the student's QR code or paste the JSON payload below.
                        </div>

                        {isScanning ? (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <div id="reader" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--cv-border)' }}></div>
                                <button
                                    className="cv-btn-ghost"
                                    onClick={() => setIsScanning(false)}
                                    style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.85rem' }}
                                >
                                    Cancel Scanning
                                </button>
                            </div>
                        ) : (
                            <button
                                className="cv-btn-secondary"
                                onClick={() => setIsScanning(true)}
                                style={{
                                    width: '100%', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                    padding: '0.85rem', background: 'rgba(99,102,241,0.1)', border: '1px dashed var(--cv-primary)', color: 'var(--cv-primary)'
                                }}
                            >
                                <Camera size={20} /> Use Camera Scanner
                            </button>
                        )}

                        <textarea
                            className="cv-input"
                            rows={3}
                            placeholder='Paste the JSON payload from the student QR generator here…'
                            value={payload}
                            onChange={e => setPayload(e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                        />
                        <button
                            id="verify-qr-btn"
                            className="cv-btn-primary"
                            onClick={handleVerifyQR}
                            disabled={!payload.trim() || loading}
                            style={{ marginTop: '1rem', width: '100%', padding: '0.85rem' }}
                        >
                            {loading ? 'Verifying on AVM...' : '🔐 Verify Token'}
                        </button>
                    </div>
                )}

                {/* ── MAGIC LINK tab ── */}
                {activeTab === 'magic' && (
                    <div>
                        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.84rem', color: 'var(--cv-text-muted)', lineHeight: 1.7 }}>
                            <strong style={{ color: 'var(--cv-primary)' }}>How to use:</strong> Ask the student to go to their <strong>Email Share</strong> tab, generate a Magic Link, and send it to you. Paste the full URL below.
                        </div>
                        <input
                            className="cv-input"
                            type="text"
                            placeholder="Paste magic link URL here — https://verify.sealit.com/access?token=..."
                            value={magicToken}
                            onChange={e => setMagicToken(e.target.value)}
                        />
                        <button
                            className="cv-btn-primary"
                            onClick={handleVerifyMagic}
                            disabled={!magicToken.trim() || loading}
                            style={{ marginTop: '1rem', width: '100%', padding: '0.85rem' }}
                        >
                            {loading ? 'Verifying...' : '🔗 Verify Magic Link'}
                        </button>
                    </div>
                )}

                {/* ── REGISTRY tab ── */}
                {activeTab === 'registry' && (
                    <div>
                        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.84rem', color: 'var(--cv-text-muted)', lineHeight: 1.7 }}>
                            <strong style={{ color: 'var(--cv-primary)' }}>How to use:</strong> Enter the student's Enrollment ID directly — this queries the on-chain Algorand registry in real time.
                            <br />Demo IDs: <code style={{ color: 'var(--cv-primary)' }}>S001</code>, <code style={{ color: 'var(--cv-primary)' }}>S002</code>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <input
                                className="cv-input"
                                type="text"
                                placeholder="Enrollment ID (e.g. S001)"
                                value={registryId}
                                onChange={e => setRegistryId(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleRegistryLookup()}
                                style={{ flex: 1 }}
                            />
                            <button
                                className="cv-btn-primary"
                                onClick={handleRegistryLookup}
                                disabled={!registryId.trim() || loading}
                                style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
                            >
                                {loading ? 'Looking up...' : '🔎 Lookup'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '1rem 1.25rem', marginTop: '1.25rem' }}>
                        <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span style={{ color: '#ef4444', fontSize: '0.88rem' }}>{error}</span>
                    </div>
                )}

                {/* Success result */}
                {result && (
                    <div style={{ marginTop: '1.5rem', animation: 'fadeInScale 0.4s ease-out' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                            <CheckCircle2 size={22} color="#22c55e" />
                            <div>
                                <div style={{ fontWeight: '700', color: '#22c55e', fontSize: '0.9rem' }}>Identity Verified on Algorand</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--cv-text-dim)' }}>Source: {result.source}</div>
                            </div>
                        </div>

                        {/* Student profile */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--cv-border)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                                <div><span style={{ color: 'var(--cv-text-dim)' }}>Name</span><div style={{ fontWeight: '700', color: '#fff' }}>{result.student.name}</div></div>
                                <div><span style={{ color: 'var(--cv-text-dim)' }}>ID</span><div style={{ fontWeight: '700', color: '#fff' }}>{result.student.id}</div></div>
                                <div><span style={{ color: 'var(--cv-text-dim)' }}>Department</span><div style={{ color: '#fff' }}>{result.student.dept}</div></div>
                                <div><span style={{ color: 'var(--cv-text-dim)' }}>Batch</span><div style={{ color: '#fff' }}>{result.student.batch}</div></div>
                            </div>
                        </div>

                        {/* Claims */}
                        <div style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--cv-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Verified Credentials ({result.claims.length})</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {result.claims.length === 0 ? (
                                <div style={{ color: 'var(--cv-text-dim)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--cv-border)' }}>
                                    No public credentials found for this student.
                                </div>
                            ) : result.claims.map((c, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px', padding: '0.85rem 1.1rem' }}>
                                    <ShieldCheck size={16} color="#22c55e" style={{ flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.88rem', color: '#fff' }}>{c.type}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--cv-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.value}</div>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--cv-text-dim)', flexShrink: 0, textAlign: 'right' }}>
                                        {c.issuer}<br />{c.date}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="cv-btn-ghost" onClick={reset} style={{ marginTop: '1.25rem', width: '100%', fontSize: '0.85rem' }}>
                            ↩ Verify Another
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyCredential;
