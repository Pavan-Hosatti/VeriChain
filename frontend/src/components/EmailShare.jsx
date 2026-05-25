import React, { useState } from 'react';
import { Mail, Send, Clock, CircleCheck, CircleAlert, Copy } from 'lucide-react';

const EmailShare = ({ student, claims, onShareLogged }) => {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [shareResult, setShareResult] = useState(null);

    const handleShare = (e) => {
        e.preventDefault();
        if (!email.includes('@')) {
            alert('Please enter a valid recruiter email.');
            return;
        }

        const visibleClaims = claims.filter(c => c.visible && c.status === 'active');
        if (visibleClaims.length === 0) {
            alert('No visible active documents to share. Please enable visibility in your vault first.');
            return;
        }

        setSending(true);

        // Generate a real demo token (base64 encoded JSON) matching what the verifier expects
        setTimeout(() => {
            const expiry = Date.now() + 24 * 60 * 60 * 1000;
            const payload = {
                studentId: student.id,
                name: student.name,
                batch: student.batch,
                dept: student.dept,
                expiry: expiry,
                expiryLabel: '24 Hours',
                claims: visibleClaims.map(c => ({
                    type: c.type,
                    value: c.value,
                    issuer: c.issuer,
                    date: c.date,
                })),
                sig: `DEMO_SIG_${student.id}_${expiry}`, // Must match verifier prefix
                issuedAt: Date.now(),
            };

            // Use Unicode-safe base64 encoding (handles special characters like dashes, emojis)
            const token = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
            const magicLink = `https://verify.sealit.com/access?token=${token}`;

            const shareData = {
                id: `S${Date.now()}`,
                token,
                recruiterEmail: email,
                studentId: student.id,
                timestamp: new Date().toLocaleString(),
                expiresAt: new Date(expiry).toLocaleString(),
                docsCount: visibleClaims.length,
                link: magicLink
            };

            setShareResult(shareData);
            setSending(false);

            if (onShareLogged) {
                onShareLogged({
                    action: 'EMAIL_SHARE',
                    metadata: `Shared ${visibleClaims.length} docs with ${email}`,
                    timestamp: shareData.timestamp
                });
            }
        }, 1500);
    };

    const copyToClipboard = () => {
        if (shareResult) {
            navigator.clipboard.writeText(shareResult.link);
            alert('Magic link copied to clipboard!');
        }
    };

    return (
        <div className="cv-card">
            <div className="cv-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Mail size={24} color="var(--cv-primary)" />
                    <h2>Secure Email Sharing</h2>
                </div>
                <p className="cv-hint">Generate a time-limited magic link for recruiters. No wallet or crypto knowledge required for them.</p>
            </div>

            {!shareResult ? (
                <form className="cv-email-share-form" onSubmit={handleShare} style={{ marginTop: '1.5rem' }}>
                    <div className="cv-form-group">
                        <label className="cv-label">Recruiter Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="cv-input"
                                type="email"
                                placeholder="e.g. hr@google.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '2.5rem' }}
                            />
                            <Mail size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--cv-text-dim)' }} />
                        </div>
                    </div>

                    <div className="cv-share-info-box" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '12px', margin: '1.5rem 0' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <Clock size={16} color="var(--cv-primary)" style={{ flexShrink: 0 }} />
                            <span>This will generate a <strong>single-use</strong> link valid for <strong>24 hours</strong>. It will only show documents you have marked as 'Visible' in your vault.</span>
                        </div>
                    </div>

                    <button
                        className={`cv-btn-primary cv-btn-large ${sending ? 'loading' : ''}`}
                        type="submit"
                        disabled={sending}
                    >
                        {sending ? 'Generating Magic Link...' : <><Send size={18} /> Generate & Send Access</>}
                    </button>
                </form>
            ) : (
                <div className="cv-share-success" style={{ marginTop: '1.5rem' }}>
                    <div className="cv-success-banner" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                        <CircleCheck size={48} style={{ margin: '0 auto 1rem' }} />
                        <h3>Access Link Created!</h3>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>A secure invitation has been prepared for<br /><strong>{shareResult.recruiterEmail}</strong></p>
                    </div>

                    <div className="cv-magic-link-box" style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--cv-border)', borderRadius: '12px', padding: '1rem' }}>
                        <label className="cv-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Magic Link (Single Use)</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                                className="cv-input"
                                value={shareResult.link}
                                readOnly
                                style={{ fontSize: '0.85rem' }}
                            />
                            <button className="cv-btn-ghost" onClick={copyToClipboard} title="Copy to clipboard">
                                <Copy size={18} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--cv-text-dim)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> Expires: {shareResult.expiresAt}</span>
                        <span>Docs Included: {shareResult.docsCount}</span>
                    </div>

                    <div style={{
                        marginTop: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.07))',
                        border: '1px solid rgba(99,102,241,0.35)',
                        padding: '1.25rem 1.5rem',
                        borderRadius: '14px',
                    }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>🎯</span>
                            <div>
                                <div style={{ fontWeight: '700', color: '#fff', marginBottom: '0.6rem', fontSize: '0.9rem' }}>What to do next — Demo Flow</div>
                                <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--cv-text-muted)', fontSize: '0.84rem', lineHeight: '2' }}>
                                    <li>Click the copy icon above to <strong style={{ color: '#fff' }}>copy the magic link</strong>.</li>
                                    <li>Click <strong style={{ color: '#fff' }}>Disconnect</strong> (top-right) to log out.</li>
                                    <li>On the login screen, use the <strong style={{ color: '#fff' }}>Recruiter card</strong>:
                                        &nbsp;<code style={{ color: 'var(--cv-primary)', background: 'rgba(99,102,241,0.12)', padding: '1px 6px', borderRadius: '4px' }}>hr@campusvault.ai</code>
                                    </li>
                                    <li>Inside Recruiter view → <strong style={{ color: '#fff' }}>Magic Link</strong> tab → paste and verify.</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <button
                        className="cv-btn-ghost"
                        style={{ width: '100%', marginTop: '1.5rem' }}
                        onClick={() => setShareResult(null)}
                    >
                        Share another document
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmailShare;
