import React, { useState } from 'react';
import { Key, Copy, CheckCircle, RefreshCw } from 'lucide-react';

const ApiKeyManager = () => {
    const [apiKey, setApiKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateKey = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:4001/api/v1/generate-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) {
                setApiKey(data.apiKey);
                setCopied(false);
            } else {
                alert('Failed to generate key: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('API Error:', err);
            alert('Failed to generate key. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="cv-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="cv-card-header">
                <h2><Key size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--cv-primary)' }} /> Global API Key Manager</h2>
                <p className="cv-hint" style={{ marginTop: '0.5rem' }}>
                    Generate a live API Key to programmatically access the Global Verification API.
                    Use this key in your background check automation scripts.
                </p>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--cv-border)' }}>
                {apiKey ? (
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--cv-text-muted)', marginBottom: '0.5rem' }}>Your Live Secret Key</label>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <code style={{ 
                                flex: 1, 
                                background: '#1e1e24', 
                                padding: '1rem', 
                                borderRadius: '8px',
                                color: '#a78bfa',
                                fontSize: '1.1rem',
                                border: '1px solid rgba(167, 139, 250, 0.2)'
                            }}>
                                {apiKey}
                            </code>
                            <button 
                                onClick={copyToClipboard}
                                className="cv-btn-secondary"
                                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                            >
                                {copied ? <CheckCircle size={16} color="#22c55e" /> : <Copy size={16} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '8px', fontSize: '0.9rem' }}>
                            <strong>Usage:</strong> Pass this key in the <code>x-api-key</code> header when making requests to <code>http://localhost:4001/api/v1/verify/:txId</code>.
                        </div>
                        
                        <button 
                            onClick={generateKey} 
                            disabled={loading}
                            style={{ 
                                marginTop: '2rem',
                                background: 'transparent',
                                border: '1px solid var(--cv-border)',
                                color: 'var(--cv-text-dim)',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.85rem'
                            }}
                        >
                            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Roll New Key
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <Key size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ color: 'var(--cv-text-dim)', marginBottom: '1.5rem' }}>No active API key</h3>
                        <button 
                            className="cv-btn-primary" 
                            onClick={generateKey}
                            disabled={loading}
                            style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}
                        >
                            {loading ? <RefreshCw size={16} className="spin" /> : <Key size={16} />}
                            Generate Live Key
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiKeyManager;
