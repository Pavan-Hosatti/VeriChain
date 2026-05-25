import React, { useState, useEffect } from 'react';

/**
 * A premium, simulated mobile wallet approval interface.
 * Mimics Pera Wallet / Shield experience for high-fidelity demos.
 */
const VirtualWalletShield = ({ txData, onApprove, onCancel }) => {
    const [status, setStatus] = useState('pending'); // pending, signing, broadcasting, success
    const [progress, setProgress] = useState(0);

    const handleConfirm = () => {
        setStatus('signing');
        // Simulate local biometric signing
        setTimeout(() => setStatus('broadcasting'), 1500);
    };

    useEffect(() => {
        if (status === 'broadcasting') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => onApprove(), 800);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [status, onApprove]);

    return (
        <div className="cv-simulation-overlay">
            <div className="cv-shield-container">
                {/* Simulated Phone Frame */}
                <div className="cv-phone-notch"></div>

                <div className="cv-shield-content">
                    {status === 'pending' && (
                        <div className="cv-shield-request fadeInScale">
                            <div className="cv-shield-header">
                                <span className="cv-shield-logo">🛡️</span>
                                <h4>Virtual Shield</h4>
                                <span className="cv-shield-network">TESTNET</span>
                            </div>

                            <div className="cv-tx-details">
                                <div className="cv-tx-type">TRANSACTION REQUEST</div>
                                <div className="cv-tx-amount">{txData?.type || 'Record Broadcast'}</div>
                                <div className="cv-tx-desc">{txData?.desc || 'Authentication & Minting Payload'}</div>

                                <div className="cv-tx-meta">
                                    <span>Fee: 0.001 ALGO</span>
                                    <span>From: DEMO_VAULT...</span>
                                </div>
                            </div>

                            <div className="cv-shield-actions">
                                <button className="cv-btn-cancel" onClick={onCancel}>Cancel</button>
                                <button className="cv-btn-approve-pulse" onClick={handleConfirm}>
                                    Confirm Approval
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'signing' && (
                        <div className="cv-shield-loading">
                            <div className="cv-faceid-icon">🧤</div>
                            <p>Authenticating Biometrics...</p>
                        </div>
                    )}

                    {status === 'broadcasting' && (
                        <div className="cv-shield-broadcasting">
                            <div className="cv-spinner-ring"></div>
                            <h4>Broadcasting to AVM</h4>
                            <p>Establishing consensus on Algorand...</p>
                            <div className="cv-progress-bar">
                                <div className="cv-progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="cv-shield-success">
                            <div className="cv-success-check">✓</div>
                            <h4>Transaction Finalized</h4>
                            <p>Block #44921 confirmed.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VirtualWalletShield;
