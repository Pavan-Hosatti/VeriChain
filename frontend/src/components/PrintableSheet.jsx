import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { buildShareProof, encodeShareToken } from '../services/OfflineVerificationService';

const PrintableSheet = ({ student, claims }) => {
    const [qrPayload, setQrPayload] = useState('');

    useEffect(() => {
        if (!student) {
            return;
        }

        let mounted = true;

        buildShareProof({
            student,
            claims,
            mode: 'qr',
            validityMs: 24 * 60 * 60 * 1000,
        }).then((payload) => {
            if (mounted) {
                setQrPayload(encodeShareToken(payload, 'json'));
            }
        });

        return () => {
            mounted = false;
        };
    }, [student, claims]);

    if (!student) return null;

    const handlePrint = () => window.print();

    return (
        <div className="cv-card">
            <div className="cv-print-toolbar no-print">
                <h2>🖨️ Printable Verification Sheet</h2>
                <button className="cv-btn-primary" onClick={handlePrint}>
                    🖨️ Print / Save as PDF
                </button>
            </div>

            <div className="cv-printable" id="printable-sheet">
                <div className="cv-print-header">
                    <div className="cv-print-logo">📜 VeriChain</div>
                    <div className="cv-print-tagline">Algorand-Verified Academic Credential Sheet</div>
                </div>

                <div className="cv-print-body">
                    <div className="cv-print-left">
                        <table className="cv-print-info-table">
                            <tbody>
                                <tr><td>Student Name</td><td><strong>{student.name}</strong></td></tr>
                                <tr><td>Enrollment No.</td><td><strong>{student.id}</strong></td></tr>
                                <tr><td>Department</td><td>{student.dept}</td></tr>
                                <tr><td>Batch</td><td>{student.batch}</td></tr>
                                <tr><td>Generated On</td><td>{new Date().toLocaleDateString('en-IN')}</td></tr>
                                <tr><td>QR Valid For</td><td>24 Hours</td></tr>
                            </tbody>
                        </table>

                        <div className="cv-print-claims">
                            <strong>Verified Claims:</strong>
                            <table className="cv-print-claims-table">
                                <thead>
                                    <tr><th>#</th><th>Type</th><th>Value</th><th>Issuer</th><th>Date</th></tr>
                                </thead>
                                <tbody>
                                    {claims.map((c, i) => (
                                        <tr key={c.id}>
                                            <td>{i + 1}</td>
                                            <td>{c.type}</td>
                                            <td>{c.value}</td>
                                            <td>{c.issuer}</td>
                                            <td>{c.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="cv-print-right">
                        <QRCodeCanvas value={qrPayload || 'Generating proof...'} size={180} level="M" includeMargin={true} />
                        <div className="cv-print-qr-label">
                            Scan to verify offline first at<br />
                            <strong>sealit.ai/verify</strong>
                        </div>
                    </div>
                </div>

                <div className="cv-print-footer">
                    This document is backed by an immutable Algorand blockchain record.
                    Tampering is detectable. Verify online for real-time status.
                </div>
            </div>
        </div>
    );
};

export default PrintableSheet;
