import React from 'react';
import { Globe, Zap, BarChart3, TrendingUp, ShieldCheck, Users } from 'lucide-react';

const MarketImpact = () => {
    const highlights = [
        {
            icon: <Globe size={24} />,
            title: 'Infrastructure for Billions',
            desc: 'Built on Algorand to handle national-scale identity workloads with 10,000+ TPS and instant finality.'
        },
        {
            icon: <Zap size={24} />,
            title: 'The Cost of Trust: $0.001',
            desc: 'Eliminate the $50+ fee for manual registrar checks. VeriChain scales verification costs to near-zero.'
        },
        {
            icon: <BarChart3 size={24} />,
            title: 'Massive Market Opportunity',
            desc: 'Targeting the $20B Global EdTech and HR-Tech market by replacing insecure PDFs with verified on-chain assets.'
        },
        {
            icon: <TrendingUp size={24} />,
            title: 'Enterprise Scalability',
            desc: 'Our role-based architecture is ready for Enterprise SSO integration, making it the standard for global hiring.'
        }
    ];

    return (
        <section className="cv-market-impact">
            <div className="cv-section-header">
                <span className="cv-badge cv-badge-primary">WHY VERICHAIN?</span>
                <h2 className="text-gradient">Designed for Real-World Scale</h2>
                <p>We're not just building a demo; we're building the infrastructure for the future of global academic identity.</p>
            </div>

            <div className="cv-impact-grid">
                {highlights.map((h, i) => (
                    <div key={i} className="cv-impact-card">
                        <div className="cv-impact-icon">{h.icon}</div>
                        <h3>{h.title}</h3>
                        <p>{h.desc}</p>
                    </div>
                ))}
            </div>

            <div className="cv-real-world-footer">
                <div className="cv-impact-stat">
                    <strong>100%</strong>
                    <span>Recruiter Friction Removed</span>
                </div>
                <div className="cv-impact-divider"></div>
                <div className="cv-impact-stat">
                    <strong><ShieldCheck size={20} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> AVM</strong>
                    <span>Native Smart Contract Security</span>
                </div>
                <div className="cv-impact-divider"></div>
                <div className="cv-impact-stat">
                    <strong>Zero</strong>
                    <span>Manual Verification Required</span>
                </div>
            </div>
        </section>
    );
};

export default MarketImpact;
