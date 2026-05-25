import React from "react";
import { QRCodeSVG } from "qrcode.react";

const DegreeQRCode = ({ degreeHash, university, studentName }) => {
    const qrData = JSON.stringify({
        type: "University Academic Credential",
        name: studentName,
        hash: degreeHash,
        issuedBy: university,
        issuedOn: new Date().toLocaleDateString(),
        network: "Algorand Testnet"
    });

    return (
        <div className="qr-card">
            <h4>📱 Verification QR Code</h4>
            <div className="qr-wrapper">
                <QRCodeSVG value={qrData} size={200} includeMargin={true} />
            </div>
            <div className="qr-info">
                <p><strong>Holder:</strong> {studentName}</p>
                <p className="hash-text"><strong>Hash:</strong> {degreeHash.slice(0, 16)}...</p>
                <button className="download-qr-btn" onClick={() => window.print()}>
                    🖨️ Print Certificate with QR
                </button>
            </div>
        </div>
    );
};

export default DegreeQRCode;
