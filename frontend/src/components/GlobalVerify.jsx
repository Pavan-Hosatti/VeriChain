import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const GlobalVerify = ({ initialId }) => {
    const [txId, setTxId] = useState(initialId || '');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialId) {
            handleVerify();
        }
    }, [initialId]);

    const handleVerify = async () => {
        if (!txId.trim()) return;
        setLoading(true);
        setResult(null);
        setError('');

        try {
            // Test both credential ID or TX ID endpoints depending on input format
            // If it looks like a short UUID/ID, it might be a credential ID. Otherwise TxID.
            const isProbablyTxId = txId.length > 20;
            const API_BASE = import.meta.env.VITE_API_BASE || 'https://verichain-backend-o862.onrender.com';
            const endpoint = isProbablyTxId 
                ? `${API_BASE}/api/v1/verify/${txId.trim()}`
                : `${API_BASE}/api/v1/credential/${txId.trim()}`;

            const res = await fetch(endpoint, {
                headers: {
                    'x-api-key': 'live_sk_rapidauth_demo_123'
                }
            });
            const data = await res.json();
            
            if (!res.ok) {
                setError(data.error || 'Verification failed');
            } else {
                setResult(data);
            }
        } catch (err) {
            setError('Could not connect to the Global Verification API. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cv-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Search size={24} style={{ color: 'var(--cv-primary)' }}/> Global Public Verification
            </h2>
            <p style={{ color: 'var(--cv-text-muted)', marginBottom: '2rem' }}>
                Verify a credential instantly via its Algorand Transaction ID or Credential ID. 
                No authentication required.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input
                    type="text"
                    className="cv-input"
                    placeholder="Enter TxID or Credential ID..."
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    style={{ flex: 1 }}
                />
                <button 
                    className="cv-btn-primary" 
                    onClick={handleVerify}
                    disabled={loading || !txId.trim()}
                    style={{ minWidth: '120px' }}
                >
                    {loading ? <Loader2 className="cv-spinner" size={18} /> : 'Verify'}
                </button>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <XCircle size={20} />
                    {error}
                </div>
            )}

            {result && (
                <div style={{ 
                    padding: '1.5rem', 
                    background: 'var(--cv-bg-alt)', 
                    borderRadius: '12px',
                    border: `1px solid ${result.verified !== false ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: result.verified !== false ? '#22c55e' : '#ef4444' }}>
                        {result.verified !== false ? <CheckCircle size={24} /> : <XCircle size={24} />}
                        <h3 style={{ margin: 0 }}>{result.verified !== false ? 'Credential Verified' : 'Verification Failed'}</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', fontSize: '0.95rem' }}>
                        <div style={{ color: 'var(--cv-text-muted)' }}>Status</div>
                        <div style={{ fontWeight: '600', color: result.status === 'Active' ? '#22c55e' : (result.status === 'Revoked' ? '#ef4444' : 'inherit') }}>
                            {result.status || 'Unknown'}
                        </div>

                        <div style={{ color: 'var(--cv-text-muted)' }}>Holder</div>
                        <div style={{ fontWeight: '500' }}>{result.holderName || 'N/A'}</div>

                        <div style={{ color: 'var(--cv-text-muted)' }}>Document Type</div>
                        <div>{result.documentType}</div>

                        <div style={{ color: 'var(--cv-text-muted)' }}>Issuer</div>
                        <div>{result.issuer}</div>

                        <div style={{ color: 'var(--cv-text-muted)' }}>Credential ID</div>
                        <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                            {result.credentialId}
                        </div>

                        {result.txId && (
                            <>
                                <div style={{ color: 'var(--cv-text-muted)' }}>Transaction ID</div>
                                <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                                    {result.txId}
                                </div>
                            </>
                        )}
                        
                        {result.blockchainConfirmed !== undefined && (
                            <>
                                <div style={{ color: 'var(--cv-text-muted)' }}>On-Chain Confirm</div>
                                <div style={{ color: result.blockchainConfirmed ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                                    {result.blockchainConfirmed ? 'Yes (Algorand Testnet)' : 'No'}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalVerify;
