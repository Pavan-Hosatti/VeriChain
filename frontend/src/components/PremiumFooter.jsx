import React from 'react';
import { Shield, Github, Twitter, Linkedin, ExternalLink, Globe } from 'lucide-react';

const PremiumFooter = () => {
    return (
        <footer className="cv-premium-footer">
            <div className="cv-footer-glow"></div>
            <div className="cv-footer-content">
                <div className="cv-footer-top">
                    <div className="cv-footer-brand">
                        <div className="cv-footer-logo">
                            <Shield size={24} color="var(--cv-primary)" />
                            <span className="text-gradient">VeriChain</span>
                        </div>
                        <p>The global standard for decentralized academic verification. Built for the future of work on Algorand.</p>
                        <div className="cv-footer-social">
                            <button className="cv-social-btn"><Github size={18} /></button>
                            <button className="cv-social-btn"><Twitter size={18} /></button>
                            <button className="cv-social-btn"><Linkedin size={18} /></button>
                        </div>
                    </div>

                    <div className="cv-footer-links-grid">
                        <div className="cv-footer-column">
                            <h4>Platform</h4>
                            <a href="#">Authority Portal</a>
                            <a href="#">Student Vault</a>
                            <a href="#">Recruiter Verify</a>
                            <a href="#">Magic Link FAQ</a>
                        </div>
                        <div className="cv-footer-column">
                            <h4>Ecosystem</h4>
                            <a href="#" className="cv-link-ext">Testnet <ExternalLink size={12} /></a>
                            <a href="#" className="cv-link-ext">AlgoExplorer <ExternalLink size={12} /></a>
                            <a href="#" className="cv-link-ext">AVM Docs <ExternalLink size={12} /></a>
                            <a href="#" className="cv-link-ext">Wallet Connect <ExternalLink size={12} /></a>
                        </div>
                        <div className="cv-footer-column">
                            <h4>Hackathon</h4>
                            <div className="cv-hackathon-badge">
                                <strong>CAMPUS VAULT</strong>
                                <span>Track: Identity & Social</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cv-footer-bottom">
                    <div className="cv-copy">© 2026 VeriChain. Designed for the Algorand Hackathon.</div>
                    <div className="cv-footer-status">
                        <span className="cv-status-dot"></span>
                        SYSTEMS OPERATIONAL - TESTNET
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PremiumFooter;
