import React from 'react';
import { Shield } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-inner">
                {/* Top Row */}
                <div className="footer-top">
                    {/* Brand column */}
                    <div className="footer-brand">
                        <div className="footer-brand-row">
                            <Shield size={16} style={{ color: '#6366f1' }} />
                            <span className="footer-brand-name text-gradient-subtle">VeriChain</span>
                            <span className="footer-brand-dot" />
                        </div>
                        <span className="footer-brand-desc">
                            Decentralized academic verification — instant, tamper-proof credential proofs on-chain.
                        </span>
                    </div>

                    {/* Right column */}
                    <div className="footer-right">
                        <div className="footer-links">
                            <a href="#privacy">Privacy</a>
                            <a href="#docs">Documentation</a>
                            <a href="#github">GitHub</a>
                            <a href="#contact">Contact</a>
                        </div>
                        <div className="footer-status">
                            <span className="status-chip">
                                <span className="s-dot" />
                                Operational
                            </span>
                            <span>Testnet</span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="footer-divider" />

                {/* Bottom Row */}
                <div className="footer-bottom">
                    <span className="footer-copy">
                        &copy; {new Date().getFullYear()} VeriChain. All rights reserved.
                    </span>
                    <span className="footer-version">v0.1 Hackathon Build</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
