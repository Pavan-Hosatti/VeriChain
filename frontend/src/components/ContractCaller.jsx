import React, { useState, useRef } from 'react';
import { Shield, Zap, CircleCheck, History } from 'lucide-react';
import * as algosdk from 'algosdk';
import { peraWallet } from '../services/WalletService';
import { HashService } from '../services/HashService';
import { BlockchainService, APP_ID } from '../services/BlockchainService';

const CLAIM_TYPES = ['Marksheet', 'Degree', 'NOC', 'Sports', 'Placement', 'Certificate', 'Internship'];

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

// ── Inline badge component (student sees dot only, admin sees this with flags) ──
const AiBadge = ({ badge, flags = [], showFlags = false }) => {
    const [expanded, setExpanded] = useState(false);
    if (!badge) return null;

    const config = {
        green:  { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)',  label: '🛡️ AI Verified' },
        amber:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', label: '⚠️ Needs Review' },
        red:    { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)',  label: '🚨 Suspected Forgery' },
    }[badge] || { color: '#888', bg: 'rgba(128,128,128,0.1)', border: 'rgba(128,128,128,0.2)', label: 'AI Checked' };

    return (
        <div style={{ marginTop: '0.5rem' }}>
            <div
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: config.bg, border: `1px solid ${config.border}`,
                    borderRadius: '6px', padding: '3px 10px',
                    fontSize: '0.72rem', fontWeight: '700', color: config.color,
                    cursor: showFlags && flags.length > 0 ? 'pointer' : 'default',
                }}
                onClick={() => showFlags && flags.length > 0 && setExpanded(e => !e)}
                title={showFlags && flags.length > 0 ? 'Click to view AI analysis flags' : ''}
            >
                {config.label}
                {showFlags && flags.length > 0 && (
                    <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>{expanded ? '▲' : '▼'}</span>
                )}
            </div>
            {showFlags && expanded && flags.length > 0 && (
                <div style={{
                    marginTop: '0.5rem', padding: '0.75rem',
                    background: 'rgba(0,0,0,0.25)', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {flags.map((f, i) => (
                        <div key={i} style={{
                            fontSize: '0.75rem', color: 'var(--cv-text-dim)',
                            marginBottom: i < flags.length - 1 ? '0.4rem' : 0,
                            display: 'flex', gap: '0.4rem',
                        }}>
                            <span style={{ color: config.color, flexShrink: 0 }}>›</span>
                            <span>{f.message || f}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ContractCaller = ({ address, students, onClaimIssued, issuers, claims, onRevoke, credentialRequests, setCredentialRequests }) => {
    const [studentId, setStudentId] = useState('');
    const [claimType, setClaimType] = useState('Marksheet');
    const [claimValue, setClaimValue] = useState('');
    const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10));
    const [issuerLabel, setIssuerLabel] = useState('Exam Cell');
    const [certificate, setCertificate] = useState(null);
    const [baseRecordId, setBaseRecordId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [txId, setTxId] = useState('');
    const fileRef = useRef(null);

    // AI analysis state
    const [aiBadge, setAiBadge] = useState(null);
    const [aiFlags, setAiFlags] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiStatus, setAiStatus] = useState('');

    const isWhitelisted = issuers.includes(address);

    // ── AI Analysis ──────────────────────────────────────
    const analyzeFile = async (file) => {
        setAiBadge(null);
        setAiFlags([]);
        setAiStatus('');
        setAiLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${AI_SERVICE_URL}/analyze`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                setAiStatus('Analysis service returned an error. Proceeding without AI check.');
                setAiLoading(false);
                return;
            }

            const data = await res.json();
            setAiBadge(data.badge);
            setAiFlags(data.flags || []);
            setAiStatus(
                data.layer_status?.vision_api !== 'ok'
                    ? 'Vision AI fallback active — local analysis only'
                    : ''
            );
        } catch {
            // Network failure — fail silently, don't block minting
            setAiStatus('AI service unreachable. Document will be minted without analysis.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCertificate(file);
        analyzeFile(file);
    };

    // ── Issue Credential ─────────────────────────────────
    const handleIssue = async (e) => {
        e.preventDefault();
        if (!studentId || !claimValue) {
            setResult('❌ Please select a student and provide claim details.');
            return;
        }

        setLoading(true);
        setResult('');
        setTxId('');

        try {
            let fileHash = '';
            if (certificate) {
                setResult('🛡️ Hashing document (SHA-256)...');
                fileHash = await HashService.hashFile(certificate);
            }

            const secureHash = await HashService.createSecureRecordHash({
                studentId,
                claimType,
                claimValue,
                fileHash,
            });

            setResult('⛓️ Preparing Algorand transaction...');
            let confirmedTxId = '';

            try {
                const txn = await BlockchainService.prepareAssetTransaction(
                    address,
                    secureHash,
                    {
                        type: claimType,
                        studentId: studentId,
                        issuer: issuerLabel,
                        val: claimValue
                    }
                );

                setResult('📱 Approve on Pera Wallet...');
                const signedTxn = await peraWallet.signTransaction([[{ txn, signers: [address] }]]);
                confirmedTxId = await BlockchainService.sendTransaction(signedTxn[0]);

                if (confirmedTxId) {
                    await BlockchainService.waitForConfirmation(confirmedTxId);
                    setTxId(confirmedTxId);
                    setResult(`✅ ${claimType === 'Placement' ? 'Placement verified' : 'Credential minted'} on Testnet!`);
                }
            } catch (err) {
                console.error('On-chain failed:', err);
                setResult(`❌ Error: ${err.message || 'Transaction failed'}`);
                return;
            }

            const student = students.find(s => s.id === studentId);
            onClaimIssued({
                studentId,
                studentName: student ? student.name : 'Unknown',
                type: claimType,
                value: claimValue,
                issuer: address,
                date: claimDate,
                txId: confirmedTxId,
                secureHash,
                previousVersion: baseRecordId || null,
                // AI fields — undefined if no file was attached or analysis failed
                aiBadge: aiBadge || undefined,
                aiFlags: aiFlags.length > 0 ? aiFlags : undefined,
            });

            setStudentId('');
            setClaimValue('');
            setCertificate(null);
            setAiBadge(null);
            setAiFlags([]);
            setAiStatus('');

            if (credentialRequests && credentialRequests.length > 0) {
                setCredentialRequests(credentialRequests.filter(
                    req => !(req.studentId === studentId && req.claimType === claimType)
                ));
            }

            setResult('✅ Success! Hash anchored to Algorand. Tip: Log out and log in as the Student (Ravi) to see it!');
        } catch (err) {
            console.error('Blockchain tx error:', err);
            setResult(`❌ Transaction failed: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoFillForm = (req) => {
        setStudentId(req.studentId);
        setClaimType(req.claimType);
        setClaimValue(req.claimValue);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    return (
        <div className="cv-card">
            {credentialRequests && credentialRequests.length > 0 && (
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></span>
                        {credentialRequests.length} Pending Student {credentialRequests.length > 1 ? 'Requests' : 'Request'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {credentialRequests.map(req => (
                            <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                                <div>
                                    <strong style={{ color: 'var(--cv-primary)', fontSize: '1.1rem' }}>{req.studentName}</strong> requested a <strong>{req.claimType}</strong> ({req.date})
                                    <div style={{ fontSize: '0.9rem', color: 'var(--cv-text-dim)', marginTop: '0.25rem' }}>Note: {req.claimValue}</div>
                                </div>
                                <button className="cv-btn-secondary" onClick={() => handleAutoFillForm(req)}>
                                    ⚡ Approve & Auto-Fill
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <h2>🔐 Mint Academic Credential</h2>
            <p className="cv-hint">Broadcast a verifiable record to the distributed ledger. Each issuance produces a real Tx ID.</p>

            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.8rem 1rem', borderRadius: '12px', margin: '1rem 0', color: '#22c55e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Shield size={16} /> Institutional Authorization Verified (Wallet Connected)
            </div>

            <div className="cv-form-grid">
                <div className="cv-form-group">
                    <label className="cv-label">Student</label>
                    <select className="cv-input" value={studentId} onChange={e => setStudentId(e.target.value)}>
                        <option value="">— Select Student —</option>
                        {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                        ))}
                    </select>
                </div>

                <div className="cv-form-group">
                    <label className="cv-label">Claim Type</label>
                    <select className="cv-input" value={claimType} onChange={e => setClaimType(e.target.value)}>
                        {CLAIM_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>

                <div className="cv-form-group">
                    <label className="cv-label">Value / Description</label>
                    <input
                        className="cv-input"
                        placeholder="e.g. Sem 5 – 78% or B.Tech CS"
                        value={claimValue}
                        onChange={e => setClaimValue(e.target.value)}
                    />
                </div>

                <div className="cv-form-group">
                    <label className="cv-label">Issuing Department</label>
                    <select className="cv-input" value={issuerLabel} onChange={e => setIssuerLabel(e.target.value)}>
                        {['Exam Cell', 'Registrar', 'Admin Office', 'Placement Cell', 'Sports Dept'].map(d => (
                            <option key={d}>{d}</option>
                        ))}
                    </select>
                </div>

                <div className="cv-form-group">
                    <label className="cv-label">Issue Date</label>
                    <input
                        className="cv-input"
                        type="date"
                        value={claimDate}
                        onChange={e => setClaimDate(e.target.value)}
                    />
                </div>

                <div className="cv-form-group">
                    <label className="cv-label">
                        Attach Document (Optional)
                        {aiLoading && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: 'var(--cv-primary)', fontWeight: 600 }}>
                                ⏳ AI analysing...
                            </span>
                        )}
                    </label>
                    <div className="cv-file-zone" onClick={() => fileRef.current.click()}>
                        <input
                            type="file"
                            hidden
                            ref={fileRef}
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />
                        {certificate ? `📄 ${certificate.name}` : '📁 Click to attach (hashed locally)'}
                    </div>

                    {/* AI badge renders here after analysis */}
                    {aiBadge && !aiLoading && (
                        <AiBadge badge={aiBadge} flags={aiFlags} showFlags={true} />
                    )}
                    {aiStatus && !aiLoading && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--cv-text-muted)', marginTop: '0.3rem' }}>
                            ℹ️ {aiStatus}
                        </div>
                    )}
                </div>

                <div className="cv-form-group">
                    <label className="cv-label">Base Record ID (Revision Only)</label>
                    <input
                        className="cv-input"
                        placeholder="e.g. C1700000000 (if revising)"
                        value={baseRecordId}
                        onChange={e => setBaseRecordId(e.target.value)}
                    />
                    <span className="cv-auth-hint">Enter ID of the record this is replacing</span>
                </div>
            </div>

            <button
                className={`cv-btn-primary cv-btn-large ${loading ? 'loading' : ''} ${(studentId && claimValue && !loading) ? 'cv-tour-pulse' : ''}`}
                onClick={handleIssue}
                disabled={loading}
            >
                {loading ? 'Broadcasting to Algorand...' : '🔐 Mint Credential on Algorand'}
            </button>

            {result && (
                <div className={`cv-status-banner ${result.startsWith('✅') ? 'success' : result.startsWith('❌') ? 'error' : 'info'}`}>
                    {result}
                    {result.startsWith('✅') && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#fff', fontWeight: '700' }}>
                            👉 Next Tip: Disconnect and log in as "Student" to see this record in your private vault!
                        </div>
                    )}
                </div>
            )}

            {txId && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <a className="cv-algo-link" href={`https://lora.algokit.io/testnet/transaction/${txId}`} target="_blank" rel="noreferrer">
                        🛠️ View on AlgoKit Lora ↗
                    </a>
                </div>
            )}

            <hr style={{ margin: '2rem 0', borderColor: 'rgba(255,255,255,0.05)' }} />

            <div className="cv-nft-logs" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>📋 Issuance Registry</h3>
                    <span className="cv-badge" style={{ fontSize: '0.65rem' }}>TESTNET</span>
                </div>

                {claims.filter(c => c.issuer === address || c.issuer === 'Academic Office').length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--cv-text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px solid var(--cv-border)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
                        <div style={{ fontSize: '0.9rem' }}>No credentials minted yet. Use the form above to issue your first claim.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {claims.filter(c => c.issuer === address || c.issuer === 'Academic Office').map(claim => (
                            <div key={claim.id} style={{
                                background: claim.status === 'revoked' ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                                border: '1px solid',
                                borderColor: claim.status === 'revoked' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.15)',
                                borderRadius: '14px',
                                padding: '1rem 1.25rem',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem',
                                flexWrap: 'wrap',
                            }}>
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '6px',
                                    background: claim.status === 'active' ? '#22c55e' : claim.status === 'revoked' ? '#ef4444' : '#f59e0b'
                                }} />

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
                                            {students.find(s => s.id === claim.studentId)?.name || 'Unknown'}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(99,102,241,0.12)', color: 'var(--cv-primary)', fontWeight: '600' }}>
                                            {claim.type}
                                        </span>
                                        <span className={`cv-tag cv-tag-${claim.status}`} style={{ fontSize: '0.65rem' }}>
                                            {claim.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--cv-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {claim.value}
                                    </div>
                                    {claim.status === 'revoked' && (
                                        <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.25rem' }}>
                                            ⛔ {claim.revocationReason}
                                        </div>
                                    )}
                                    {/* Admin sees badge + expandable flags in the issuance registry */}
                                    <AiBadge badge={claim.aiBadge} flags={claim.aiFlags} showFlags={true} />
                                </div>

                                {claim.status === 'active' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                                        <select
                                            className="cv-input cv-input-small"
                                            style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', minWidth: '130px' }}
                                            onChange={async (e) => {
                                                const reason = e.target.value;
                                                if (!reason) return;
                                                const currentClaimId = claim.id;
                                                if (window.confirm(`Permanently revoke this credential for ${students.find(s => s.id === claim.studentId)?.name || 'Unknown'}?\nReason: ${reason}`)) {
                                                    setLoading(true);
                                                    setResult('⛓️ Preparing on-chain revocation anchor...');
                                                    try {
                                                        const txn = await BlockchainService.prepareAssetTransaction(
                                                            address,
                                                            "REVOKED",
                                                            {
                                                                type: "REVOKE",
                                                                id: currentClaimId,
                                                                reason: reason,
                                                                target: claim.txId
                                                            }
                                                        );
                                                        setResult('📱 Approve on Pera Wallet...');
                                                        const signedTxn = await peraWallet.signTransaction([[{ txn, signers: [address] }]]);
                                                        const confirmedTxId = await BlockchainService.sendTransaction(signedTxn[0]);
                                                        if (confirmedTxId) {
                                                            await BlockchainService.waitForConfirmation(confirmedTxId);
                                                            onRevoke(currentClaimId, reason);
                                                            setResult(`✅ Revocation anchored on Algorand! Tx: ${confirmedTxId.slice(0, 8)}...`);
                                                        }
                                                    } catch (err) {
                                                        console.error('Revocation failed:', err);
                                                        setResult(`❌ Revocation failed: ${err.message}`);
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                                e.target.value = '';
                                            }}
                                        >
                                            <option value="">🚫 Revoke…</option>
                                            <option value="Fraudulent Document">Fraudulent</option>
                                            <option value="Error in Issuance">Data Error</option>
                                            <option value="Administrative Policy">Policy Change</option>
                                            <option value="Expired Early">Early Expiry</option>
                                        </select>
                                        <button
                                            className="cv-btn-ghost cv-btn-small"
                                            style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
                                            onClick={() => {
                                                setStudentId(claim.studentId);
                                                setClaimType(claim.type);
                                                setBaseRecordId(claim.id);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        >
                                            🔄 Revise
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContractCaller;
