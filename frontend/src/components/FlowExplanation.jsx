import React from 'react';
import { Wallet, ShieldCheck, Share2, History, ChevronRight } from 'lucide-react';

/**
 * FlowExplanation — Visual 4-step credential lifecycle.
 * Shows judges the full Seal It flow including the new revocation system.
 */
const steps = [
    {
        number: '01',
        title: 'Authority Mints',
        desc: 'University connects via Pera Wallet and issues tamper-proof credentials as on-chain NFTs on Algorand.',
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
        desc: 'Recruiters paste a Magic Link or scan a QR to instantly verify credentials — no wallet or crypto needed.',
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
