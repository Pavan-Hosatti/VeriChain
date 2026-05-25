import React, { useState } from "react";

const MultiSigDegree = ({ degreeId, threshold = 2 }) => {
    // Demo state for signatures
    const [approvers, setApprovers] = useState([
        { name: "Dr. Vijay (Dean)", signed: true, role: "Dean" },
        { name: "Dr. Anita (Registrar)", signed: false, role: "Registrar" },
        { name: "Prof. Verma (Head)", signed: true, role: "Dept. Head" }
    ]);

    const signedCount = approvers.filter(a => a.signed).length;
    const progress = (signedCount / threshold) * 100;

    return (
        <div className="multi-sig-card">
            <div className="card-header">
                <h4>📜 Degree Issuance: {degreeId}</h4>
                <span className="status-pill active">In Progress</span>
            </div>

            <div className="progress-container">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
                <span className="progress-text">{signedCount}/{threshold} Official Signatures</span>
            </div>

            <div className="approvers-list">
                {approvers.map(approver => (
                    <div key={approver.name} className={`approver-item ${approver.signed ? 'signed' : 'pending'}`}>
                        <span className="approver-icon">{approver.signed ? '✅' : '⏳'}</span>
                        <div className="approver-info">
                            <span className="approver-name">{approver.name}</span>
                            <span className="approver-role">{approver.role}</span>
                        </div>
                    </div>
                ))}
            </div>

            {signedCount >= threshold && (
                <button className="execute-btn animate-pulse">
                    ✅ Seal & Record Blockchain Degree
                </button>
            )}
        </div>
    );
};

export default MultiSigDegree;
