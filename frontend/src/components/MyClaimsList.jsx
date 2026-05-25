import React from 'react';

const CLAIM_ICONS = {
    'Marksheet': '📋',
    'Degree': '🎓',
    'NOC': '📄',
    'Sports': '🏅',
    'Placement': '💼',
    'Certificate': '📜',
    'Internship': '💻'
};

const MyClaimsList = ({ student, claims, onToggleVisibility, credentialRequests, setCredentialRequests }) => {
    const [showRequestForm, setShowRequestForm] = React.useState(false);
    const [reqType, setReqType] = React.useState('Internship');
    const [reqNote, setReqNote] = React.useState('');

    const handleRequest = () => {
        if (!reqNote) return alert("Please enter request details.");
        const newReq = {
            id: `REQ-${Date.now()}`,
            studentId: student.id,
            studentName: student.name,
            claimType: reqType,
            claimValue: reqNote,
            date: new Date().toLocaleDateString()
        };
        setCredentialRequests([...credentialRequests, newReq]);
        setShowRequestForm(false);
        setReqNote('');
        alert(`✅ Request for ${reqType} sent to authority seamlessly.`);
    };

    if (!student) return null;

    // Group by issuer / department
    const grouped = claims.reduce((acc, c) => {
        if (!acc[c.issuer]) acc[c.issuer] = [];
        acc[c.issuer].push(c);
        return acc;
    }, {});

    return (
        <div className="cv-card">
            <div className="cv-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>📂 Student Identity Vault</h2>
                    <p className="cv-hint">Secure storage for your immutable academic assets. Use the visibility toggle to control public access.</p>
                </div>
                <button className="cv-btn-secondary" onClick={() => setShowRequestForm(!showRequestForm)}>
                    {showRequestForm ? 'Close' : '➕ Request Credential'}
                </button>
            </div>

            {showRequestForm && (
                <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff' }}>Request a New Document</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <select className="cv-input" style={{ width: 'auto', flex: 1, minWidth: '150px' }} value={reqType} onChange={(e) => setReqType(e.target.value)}>
                            {Object.keys(CLAIM_ICONS).map(t => <option key={t}>{t}</option>)}
                        </select>
                        <input className="cv-input" style={{ flex: 3, minWidth: '250px' }} placeholder="Provide specific details (e.g. 6-month AI Internship pass)" value={reqNote} onChange={e => setReqNote(e.target.value)} />
                        <button className="cv-btn-primary" onClick={handleRequest}>Send Request</button>
                    </div>
                </div>
            )}

            <div className="cv-student-profile-bar" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem', marginBottom: '2rem', border: '1px solid var(--cv-border)' }}>
                <div className="cv-student-avatar" style={{ width: '64px', height: '64px', background: 'var(--cv-grad-indigo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700', color: '#fff', boxShadow: '0 0 20px var(--cv-primary-glow)' }}>
                    {student.name.charAt(0)}
                </div>
                <div>
                    <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>{student.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--cv-text-dim)' }}>{student.dept} • {student.batch} • <code style={{ color: 'var(--cv-primary)' }}>{student.id}</code></p>
                </div>
            </div>

            {
                Object.keys(grouped).length === 0 && (
                    <div className="cv-empty-state" style={{ padding: '4rem', textAlign: 'center', color: 'var(--cv-text-muted)' }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🧊</span>
                        Your vault is currently empty.
                    </div>
                )
            }

            {
                Object.entries(grouped).map(([issuer, issuedClaims]) => (
                    <div key={issuer} className="cv-asset-group" style={{ marginBottom: '2rem' }}>
                        <div className="cv-group-label" style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--cv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--cv-primary)' }}>🏛️</span> {issuer}
                        </div>
                        <div className="cv-claims-list" style={{ display: 'grid', gap: '1rem' }}>
                            {issuedClaims.map(c => (
                                <div key={c.id} className={`cv-claim-row ${c.status === 'revoked' ? 'revoked' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        background: c.visible ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                                        padding: '1.25rem',
                                        borderRadius: '16px',
                                        border: '1px solid',
                                        borderColor: c.visible ? 'rgba(99, 102, 241, 0.2)' : 'var(--cv-border)',
                                        opacity: c.status === 'revoked' || !c.visible ? 0.7 : 1,
                                        transition: '0.3s'
                                    }}>
                                    <div className="cv-claim-icon" style={{ fontSize: '1.5rem', filter: c.visible ? 'none' : 'grayscale(100%)' }}>{CLAIM_ICONS[c.type] || '📄'}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', color: c.visible ? '#fff' : 'var(--cv-text-dim)' }}>{c.type}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--cv-text-dim)' }}>{c.value}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--cv-text-muted)', marginTop: '4px' }}>MINTED: {c.date}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {c.status === 'revoked' ? (
                                            <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px' }}>REVOKED</span>
                                        ) : (
                                            <>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '800', background: c.visible ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', color: c.visible ? '#22c55e' : 'var(--cv-text-muted)', padding: '4px 8px', borderRadius: '4px' }}>
                                                    {c.visible ? 'PUBLIC' : 'PRIVATE'}
                                                </span>
                                                <button
                                                    className="cv-visibility-btn"
                                                    onClick={() => onToggleVisibility(c.id)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
                                                    title={c.visible ? 'Hide from public verification' : 'Show on profile for verification'}
                                                >
                                                    {c.visible ? '👁️' : '🙈'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            }

            <div className="cv-legend" style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--cv-border)', fontSize: '0.8rem', color: 'var(--cv-text-muted)', display: 'flex', gap: '1.5rem' }}>
                <span>👁️ Visible on QR Profile</span>
                <span>🙈 Hidden from Gateway</span>
                <span style={{ color: '#ef4444' }}>● Revoked assets are unshareable</span>
            </div>
        </div>
    );
};

export default MyClaimsList;
