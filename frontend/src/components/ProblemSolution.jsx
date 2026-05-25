import React from 'react';
import { CircleAlert, CircleCheck, ShieldAlert, FileSearch, UserMinus, Clock } from 'lucide-react';

const ProblemSolution = () => {
    return (
        <section className="cv-problem-solution">
            <div className="cv-section-header">
                <span className="cv-badge cv-badge-danger">THE PROBLEM</span>
                <h2 className="text-gradient">The Trust Gap in Academic Identity</h2>
                <p>Traditional verification is siloed, manual, and prone to error. Seal It creates a seamless bridge of trust.</p>
            </div>

            <div className="cv-comparison-grid">
                {/* PROBLEM SIDE */}
                <div className="cv-comparison-column problem">
                    <div className="cv-column-header">
                        <ShieldAlert size={24} color="#ef4444" />
                        <h3>Legacy Verification</h3>
                    </div>
                    <ul className="cv-comparison-list">
                        <li>
                            <Clock size={18} />
                            <div>
                                <strong>Slow Processing</strong>
                                <p>Verification through registrars often takes days or weeks.</p>
                            </div>
                        </li>
                        <li>
                            <UserMinus size={18} />
                            <div>
                                <strong>Manual Oversight</strong>
                                <p>Heavy reliance on individual manual checks and emails.</p>
                            </div>
                        </li>
                        <li>
                            <FileSearch size={18} />
                            <div>
                                <strong>Discovery Friction</strong>
                                <p>Recruiters struggle to instantly validate academic claims.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* VS DIVIDER */}
                <div className="cv-vs-divider">
                    <div className="cv-vs-line"></div>
                    <div className="cv-vs-circle">VS</div>
                    <div className="cv-vs-line"></div>
                </div>

                {/* SOLUTION SIDE */}
                <div className="cv-comparison-column solution">
                    <div className="cv-column-header">
                        <CircleCheck size={24} color="#22c55e" />
                        <h3>Seal It Solution</h3>
                    </div>
                    <ul className="cv-comparison-list">
                        <li>
                            <CircleCheck size={18} />
                            <div>
                                <strong>Instant Proof</strong>
                                <p>On-chain verification in seconds with zero manual overhead.</p>
                            </div>
                        </li>
                        <li>
                            <CircleCheck size={18} />
                            <div>
                                <strong>Asset Immutability</strong>
                                <p>Tamper-proof academic NFTs anchored directly to Algorand.</p>
                            </div>
                        </li>
                        <li>
                            <CircleCheck size={18} />
                            <div>
                                <strong>Full Lifecycle</strong>
                                <p>Revoke, supersede, and track history with complete transparency.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default ProblemSolution;
