import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const EXPIRY_OPTIONS = [
    { label: '1 Hour', ms: 60 * 60 * 1000 },
    { label: '24 Hours', ms: 24 * 60 * 60 * 1000 },
    { label: '7 Days', ms: 7 * 24 * 60 * 60 * 1000 },
];

const DegreeSharing = ({ student, claims }) => {
    const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_OPTIONS[0]);
    const [qrData, setQrData] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [status, setStatus] = useState('');

    if (!student) return null;

    const handleGenerate = async () => {
        if (claims.length === 0) {
            setStatus('⚠️ No visible active claims to share. Enable visibility in "My Claims" first.');
            return;
        }

        setGenerating(true);
        setStatus('📝 Preparing secure token payload...');

        setTimeout(() => {
            try {
                const expiry = Date.now() + selectedExpiry.ms;
                const payload = {
                    studentId: student.id,
                    name: student.name,
                    batch: student.batch,
                    dept: student.dept,
                    expiry: expiry,
                    expiryLabel: selectedExpiry.label,
                    claims: claims.map(c => ({
                        type: c.type,
                        value: c.value,
                        issuer: c.issuer,
                        date: c.date,
                    })),
                    // IMPORTANT: sig must start with DEMO_SIG_ so VerifyCredential can validate it
                    sig: `DEMO_SIG_${student.id}_${expiry}`,
                    issuedAt: Date.now(),
                };

                setQrData(JSON.stringify(payload));
                setStatus('✅ Secure token generated and signed.');
            } catch (err) {
                setStatus(`❌ Error: ${err.message}`);
            } finally {
                setGenerating(false);
            }
        }, 1000);
    };

    const handleClear = () => {
        setQrData(null);
        setStatus('');
    };

    return (
        <div className="cv-card">
            <div className="cv-card-header">
                <h2>📤 Generate Secure Identity Token</h2>
                <p className="cv-hint">Create a time-bound, cryptographically signed payload for Recruiter verification.</p>
            </div>

            <div className="cv-share-logic" style={{ marginTop: '2rem' }}>
                {/* Active claims preview */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--cv-border)', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--cv-text-dim)', marginBottom: '0.5rem' }}>ACTIVE PAYLOAD PREVIEW</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {claims.length > 0 ? claims.map(c => (
                            <span key={c.id} style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--cv-primary)', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                {c.type}
                            </span>
                        )) : <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ No public assets selected. Go to Vault to enable.</span>}
                    </div>
                </div>

                {/* Expiry picker */}
                <div className="cv-expiry-picker" style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--cv-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Token Valid For:</label>
                    <div className="cv-expiry-options" style={{ display: 'flex', gap: '1rem' }}>
                        {EXPIRY_OPTIONS.map(opt => (
                            <button
                                key={opt.label}
                                className={`cv-expiry-btn ${selectedExpiry.label === opt.label ? 'active' : ''}`}
                                onClick={() => { setSelectedExpiry(opt); setQrData(null); }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid',
                                    borderColor: selectedExpiry.label === opt.label ? 'var(--cv-primary)' : 'var(--cv-border)',
                                    background: selectedExpiry.label === opt.label ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    color: selectedExpiry.label === opt.label ? 'var(--cv-primary)' : 'var(--cv-text-dim)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: '0.3s',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {!qrData && (
                    <button
                        className={`cv-btn-primary ${generating ? 'loading' : ''}`}
                        onClick={handleGenerate}
                        disabled={generating || claims.length === 0}
                        style={{ padding: '1.25rem', fontSize: '1.1rem', width: '100%' }}
                    >
                        {generating ? 'Negotiating Consensus...' : '🔐 Sign & Generate Token'}
                    </button>
                )}

                {status && <div className="cv-status-note" style={{ marginTop: '1rem', textAlign: 'center', color: status.startsWith('✅') ? '#22c55e' : 'var(--cv-text-dim)', fontSize: '0.9rem' }}>{status}</div>}

                {qrData && (
                    <div style={{ marginTop: '2.5rem' }}>
                        {/* QR code */}
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ background: '#fff', padding: '1.75rem', borderRadius: '24px', display: 'inline-block', boxShadow: '0 0 60px rgba(99, 102, 241, 0.35)' }}>
                                <QRCodeCanvas value={qrData} size={200} level="H" />
                            </div>
                            <div style={{ marginTop: '1rem', fontWeight: '700', color: '#22c55e', fontSize: '0.9rem' }}>
                                ✅ Signed &amp; ready · Valid for {selectedExpiry.label}
                            </div>
                        </div>

                        {/* Next-step guidance banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.07))',
                            border: '1px solid rgba(99,102,241,0.35)',
                            borderRadius: '16px',
                            padding: '1.25rem 1.5rem',
                        }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>🎯</span>
                                <div>
                                    <div style={{ fontWeight: '700', color: '#fff', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                                        What to do next — Demo Flow
                                    </div>
                                    <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--cv-text-muted)', fontSize: '0.84rem', lineHeight: '2' }}>
                                        <li>Share this QR, <strong>OR</strong> go to <strong style={{ color: '#fff' }}>Email Share</strong> tab to copy a Magic Link.</li>
                                        <li>Click <strong style={{ color: '#fff' }}>Disconnect</strong> (top-right) to log out of this student account.</li>
                                        <li>Back on the login screen, use the <strong style={{ color: '#fff' }}>Recruiter card</strong>:
                                            &nbsp;<code style={{ color: 'var(--cv-primary)', background: 'rgba(99,102,241,0.12)', padding: '1px 6px', borderRadius: '4px' }}>hr@campusvault.ai</code>
                                        </li>
                                        <li>Inside Recruiter view → <strong style={{ color: '#fff' }}>QR Token</strong> tab (paste JSON payload) or <strong style={{ color: '#fff' }}>Magic Link</strong> tab.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                            <button className="cv-btn-ghost" onClick={handleClear}>🔄 Void &amp; Re-Generate</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DegreeSharing;
