import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const PrintableSheet = ({ student, claims }) => {
    if (!student) return null;

    const qrPayload = JSON.stringify({
        studentId: student.id,
        name: student.name,
        batch: student.batch,
        dept: student.dept,
        expiry: Date.now() + (24 * 60 * 60 * 1000),
        claims: claims.map(c => ({ type: c.type, value: c.value, issuer: c.issuer, date: c.date })),
        sig: `DEMO_SIG_${student.id}`,
        issuedAt: Date.now(),
    });

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
                    <div className="cv-print-logo">📜 Seal It</div>
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
                        <QRCodeCanvas value={qrPayload} size={180} level="M" includeMargin={true} />
                        <div className="cv-print-qr-label">
                            Scan to verify online at<br />
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
