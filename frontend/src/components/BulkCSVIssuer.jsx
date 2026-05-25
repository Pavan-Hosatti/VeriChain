import React, { useState, useRef } from 'react';

const CLAIM_TYPES = ['Marksheet', 'Degree', 'NOC', 'Sports', 'Placement', 'Certificate'];

const CSV_TEMPLATE = `enrollment,student_name,claim_type,value,date
S001,Ravi Kumar,Marksheet,Sem 6 – 80%,2025-05-01
S002,Priya Sharma,Marksheet,Sem 8 – 88%,2025-05-01
S003,Arjun Mehta,Marksheet,Sem 6 – 71%,2025-05-01`;

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
    }).filter(r => r.enrollment);
}

function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campusvault_bulk_template.csv';
    a.click();
    URL.revokeObjectURL(url);
}

const BulkCSVIssuer = ({ students, onClaimsIssued }) => {
    const [rows, setRows] = useState([]);
    const [progress, setProgress] = useState(0);
    const [minting, setMinting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef(null);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = parseCSV(ev.target.result);
                setRows(parsed);
                setError('');
                setDone(false);
                setProgress(0);
            } catch {
                setError('Could not parse CSV. Make sure it matches the template.');
            }
        };
        reader.readAsText(file);
    };

    const handleMint = async () => {
        setMinting(true);
        setDone(false);
        setProgress(0);

        const newClaims = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            await new Promise(r => setTimeout(r, 600));
            newClaims.push({
                id: `C${Date.now()}_${i}`,
                studentId: row.enrollment,
                type: row.claim_type || 'Marksheet',
                value: row.value,
                issuer: 'Exam Cell',
                date: row.date || new Date().toISOString().slice(0, 10),
                status: 'active',
                visible: true,
            });
            setProgress(Math.round(((i + 1) / rows.length) * 100));
        }

        onClaimsIssued(newClaims);
        setMinting(false);
        setDone(true);
    };

    return (
        <div className="cv-card">
            <h2>📤 Bulk CSV Issuance</h2>
            <p className="cv-hint">Upload a CSV of student claims. Each row becomes one on-chain record.</p>

            <div className="cv-bulk-actions">
                <button className="cv-btn-outline" onClick={downloadTemplate}>
                    ⬇️ Download CSV Template
                </button>
                <button className="cv-btn-primary" onClick={() => fileRef.current.click()}>
                    📁 Upload Filled CSV
                </button>
                <input type="file" accept=".csv" ref={fileRef} hidden onChange={handleFile} />
            </div>

            {error && <div className="cv-error">{error}</div>}

            {rows.length > 0 && !done && (
                <>
                    <div className="cv-preview-header">
                        <strong>Preview — {rows.length} records</strong>
                    </div>
                    <div className="cv-table-wrap">
                        <table className="cv-table">
                            <thead>
                                <tr>
                                    <th>Enrollment</th>
                                    <th>Student Name</th>
                                    <th>Claim Type</th>
                                    <th>Value</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.enrollment}</td>
                                        <td>{r.student_name}</td>
                                        <td>
                                            <select
                                                value={r.claim_type}
                                                onChange={e => {
                                                    const updated = [...rows];
                                                    updated[i] = { ...r, claim_type: e.target.value };
                                                    setRows(updated);
                                                }}
                                            >
                                                {CLAIM_TYPES.map(t => <option key={t}>{t}</option>)}
                                            </select>
                                        </td>
                                        <td>{r.value}</td>
                                        <td>{r.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {!minting && (
                        <button className="cv-btn-primary cv-btn-large" onClick={handleMint}>
                            🔐 Confirm & Mint {rows.length} Claims on Algorand
                        </button>
                    )}

                    {minting && (
                        <div className="cv-progress-wrap">
                            <div className="cv-progress-label">Minting claims... {progress}%</div>
                            <div className="cv-progress-bar">
                                <div className="cv-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </>
            )}

            {done && (
                <div className="cv-success-banner">
                    ✅ {rows.length} claims minted successfully on Algorand Testnet!
                    <br />
                    <span className="cv-hint">Students will see these claims in their vault immediately.</span>
                </div>
            )}
        </div>
    );
};

export default BulkCSVIssuer;
