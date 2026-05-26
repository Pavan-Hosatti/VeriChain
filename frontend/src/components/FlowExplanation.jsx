import React from 'react';
import { Wallet, ShieldCheck, Share2, History, ChevronRight, BrainCircuit, Globe, WifiOff } from 'lucide-react';

/**
 * FlowExplanation — Visual 4-step credential lifecycle.
 * Shows judges the full Seal It flow including the new revocation system.
 */
const steps = [
    {
        number: '01',
        title: 'Authority Mints',
        desc: 'Documents pass through an AI forensic pipeline before the University mints them as tamper-proof credentials on Algorand.',
        Icon: Wallet,
        colorClass: 'icon-blue',
    },
    {
        number: '02',
        title: 'Student Controls',
        desc: 'Students log in via secure OTP, manage visibility of each claim, and share via Magic Links or QR codes.',
        Icon: Share2,
        colorClass: 'icon-purple',
    },
    {
        number: '03',
        title: 'Recruiter Verifies',
        desc: 'Recruiters verify instantly via QR, Magic Link, or Global API. Cryptographic proofs enable fully offline verification.',
        Icon: ShieldCheck,
        colorClass: 'icon-cyan',
    },
    {
        number: '04',
        title: 'Lifecycle & Revocation',
        desc: 'Authorities can revoke credentials with reasons or supersede them. The entire audit history is preserved on-chain.',
        Icon: History,
        colorClass: 'icon-green',
    },
];

const FlowExplanation = () => {
    return (
        <section className="flow-section">
            <h2 className="flow-heading text-gradient">How It Works</h2>
            <p className="flow-subheading">
                A complete credential lifecycle — from issuance to revocation — secured by Algorand.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '3.5rem', color: 'var(--cv-text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BrainCircuit size={18} color="#38bdf8" /> AI Forensic Pipeline
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Globe size={18} color="#22c55e" /> Global B2B API
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <WifiOff size={18} color="#a855f7" /> Offline Verification
                </div>
            </div>

            <div className="flow-steps">
                {steps.map((step, i) => (
                    <React.Fragment key={step.number}>
                        <div className="flow-step">
                            <div className={`flow-step-icon ${step.colorClass}`}>
                                <step.Icon size={30} />
                            </div>
                            <div className="flow-step-number">{step.number}</div>
                            <div className="flow-step-title">{step.title}</div>
                            <div className="flow-step-desc">{step.desc}</div>
                        </div>

                        {/* Connector arrow between steps */}
                        {i < steps.length - 1 && (
                            <div className="flow-connector">
                                <ChevronRight size={24} />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </section>
    );
};

export default FlowExplanation;
