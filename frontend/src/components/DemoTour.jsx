import React, { useState, useEffect } from 'react';
import { MousePointer2, ChevronRight, Info, X, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

const TOUR_STEPS = {
    CHOOSE_ROLE: {
        id: 'CHOOSE_ROLE',
        title: 'Step 1: Choose Your Persona',
        text: 'To understand the ecosystem, start as the University Authority (Issuer). This is where credentials begin their life on Algorand.',
        target: '.cv-role-card:first-child',
        align: 'top',
        persona: null
    },
    MINT_CREDENTIAL: {
        id: 'MINT_CREDENTIAL',
        title: 'Step 2: Minting Trust',
        text: 'Click "Mint". A real ARC-4 transaction will be sent to App 1002 on Algorand. Approve it on your Pera Wallet!',
        target: '.cv-btn-primary.cv-btn-large',
        align: 'top',
        persona: 'issuer'
    },
    REVOKE_ON_CHAIN: {
        id: 'REVOKE_ON_CHAIN',
        title: 'Step 3: Cryptographic Revocation',
        text: 'Advanced Feature: Try revoking a record in the logs below. It triggers an on-chain "revoke_claim" call. Witness the power of on-chain lifecycle management!',
        target: '.cv-nft-logs',
        align: 'top',
        persona: 'issuer'
    },
    SWITCH_TO_STUDENT: {
        id: 'SWITCH_TO_STUDENT',
        title: 'Step 4: Ownership Shift',
        text: 'The record is live! Now, disconnect and log in as the Student (Ravi) to manage your verified academic vault.',
        target: '.cv-btn-ghost', // Disconnect button
        align: 'bottom',
        persona: 'issuer'
    },
    STUDENT_VAULT: {
        id: 'STUDENT_VAULT',
        title: 'Step 4: Your Identity Vault',
        text: 'As a student, you own your records. Toggle "Visible" to decide what recruiters can see. This is self-sovereign identity in action.',
        target: '.cv-sidebar-btn:first-child',
        align: 'right',
        persona: 'student'
    },
    SHARE_CREDENTIAL: {
        id: 'SHARE_CREDENTIAL',
        title: 'Step 5: Share Your Proof',
        text: 'Generate a "Magic Link" or use "QR Share". This creates a verifiable cryptographic proof. Go ahead and generate a link now!',
        target: '.cv-sidebar-btn:nth-child(2)',
        align: 'right',
        persona: 'student'
    },
    COPY_LINK: {
        id: 'COPY_LINK',
        title: 'Step 6: Copy & Prepare',
        text: 'Link generated! 1. Copy the magic link. 2. Log out (top right). 3. Log in as a Recruiter using the demo credentials.',
        target: '.cv-btn-primary',
        align: 'bottom',
        persona: 'student'
    },
    VERIFY_PROOF: {
        id: 'VERIFY_PROOF',
        title: 'Step 7: Final Verification',
        text: 'Paste the copied magic link into the "MAGIC LINK" tab and click Verify. You will see the live, on-chain truth!',
        target: '.cv-filter-btn:nth-child(2)',
        align: 'top',
        persona: 'verifier'
    }
};

const DemoTour = ({ userRole, step, claims, address }) => {
    const [currentStep, setCurrentStep] = useState(null);
    const [isVisible, setIsVisible] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (dismissed) return;

        // Logic to determine the current tour step based on App state
        if (!address) {
            setCurrentStep(TOUR_STEPS.CHOOSE_ROLE);
            setIsVisible(true);
        } else if (userRole === 'issuer') {
            if (claims.length <= 6) {
                setCurrentStep(TOUR_STEPS.MINT_CREDENTIAL);
            } else if (!claims.some(c => c.status === 'revoked')) {
                setCurrentStep(TOUR_STEPS.REVOKE_ON_CHAIN);
            } else {
                setCurrentStep(TOUR_STEPS.SWITCH_TO_STUDENT);
            }
            setIsVisible(true);
        } else if (userRole === 'student') {
            const currentSteps = [TOUR_STEPS.STUDENT_VAULT, TOUR_STEPS.SHARE_CREDENTIAL, TOUR_STEPS.COPY_LINK];
            if (step === 1) setCurrentStep(TOUR_STEPS.STUDENT_VAULT);
            else if (step === 2 || step === 3) setCurrentStep(TOUR_STEPS.SHARE_CREDENTIAL);
            setIsVisible(true);
        } else if (userRole === 'verifier') {
            setCurrentStep(TOUR_STEPS.VERIFY_PROOF);
            setIsVisible(true);
        }
    }, [userRole, step, claims.length, address, dismissed]);

    if (!isVisible || !currentStep || dismissed) return null;

    return (
        <div className={`cv-tour-guide tour-align-${currentStep.align}`}>
            <div className="cv-tour-card">
                <div className="cv-tour-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={16} color="var(--cv-primary)" fill="var(--cv-primary)" />
                        <span className="cv-tour-title">{currentStep.title}</span>
                    </div>
                    <button className="cv-tour-close" onClick={() => setDismissed(true)}>
                        <X size={14} />
                    </button>
                </div>
                <div className="cv-tour-body">
                    <p>{currentStep.text}</p>
                </div>
                <div className="cv-tour-footer">
                    <div className="cv-tour-progress">
                        {Object.keys(TOUR_STEPS).map((k, i) => (
                            <div key={k} className={`cv-tour-dot ${currentStep.id === k ? 'active' : ''}`} />
                        ))}
                    </div>
                    <div className="cv-tour-hint">
                        <MousePointer2 size={12} />
                        <span>Look for the pulse</span>
                    </div>
                </div>
            </div>
            <div className="cv-tour-arrow">
                <ArrowRight size={24} />
            </div>
        </div>
    );
};

export default DemoTour;
