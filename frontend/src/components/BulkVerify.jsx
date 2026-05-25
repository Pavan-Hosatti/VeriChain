import React, { useRef, useState } from 'react';

function parseCSV(text) {
    const lines = text.trim().split('\n');
    return lines.slice(1).map(l => l.split(',')[0]?.trim()).filter(Boolean);
}

function generateResultCSV(results) {
    const rows = [['Enrollment', 'Name', 'Batch', 'Dept', 'Claims'].join(',')];
    results.forEach(r => {
        if (r.found) {
            const claimsStr = r.claims.map(c => `${c.type}:${c.value}`).join(' | ');
            rows.push([r.id, r.name, r.batch, r.dept, `"${claimsStr}"`].join(','));
        } else {
            rows.push([r.id, 'NOT FOUND', '', '', ''].join(','));
        }
    });
    return rows.join('\n');
}

const BulkVerify = ({ allClaims, students }) => {
    const [enrollments, setEnrollments] = useState('');
    const [results, setResults] = useState([]);
    const [processed, setProcessed] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileRef = useRef(null);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const parsed = parseCSV(ev.target.result);
            setEnrollments(parsed.join('\n'));
        };
        reader.readAsText(file);
    };

    const handleProcess = async () => {
        const ids = enrollments.split('\n').map(l => l.trim()).filter(Boolean);
        if (ids.length === 0) return;

        setProcessing(true);
        setProcessed(false);
        setProgress(0);

        const out = [];
        for (let i = 0; i < ids.length; i++) {
            await new Promise(r => setTimeout(r, 200));
            const student = students.find(s => s.id === ids[i]);
            if (student) {
                const claims = allClaims.filter(c =>
                    c.studentId === student.id && c.visible && c.status === 'active'
                );
                out.push({ id: ids[i], found: true, ...student, claims });
            } else {
                out.push({ id: ids[i], found: false });
            }
            setProgress(Math.round(((i + 1) / ids.length) * 100));
        }

        setResults(out);
        setProcessing(false);
        setProcessed(true);
    };

    const handleDownload = () => {
        const csv = generateResultCSV(results);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'campusvault_bulk_results.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const found = results.filter(r => r.found);
    const notFound = results.filter(r => !r.found);

    return (
        <div className="cv-card">
            <h2>📦 Bulk Credential Verification</h2>
            <p className="cv-hint">
                Upload a CSV or paste enrollment numbers — one per line.
                Get a verified credential sheet for all of them instantly.
            </p>

            <div className="cv-bulk-actions">
                <button className="cv-btn-outline" onClick={() => fileRef.current.click()}>
                    📁 Upload Enrollment CSV
                </button>
                <input type="file" accept=".csv" ref={fileRef} hidden onChange={handleFile} />
            </div>

            <textarea
                className="cv-textarea"
                placeholder={`Paste enrollment numbers here, one per line:\nS001\nS002\nS003`}
                value={enrollments}
                onChange={e => setEnrollments(e.target.value)}
                rows={6}
            />

            {!processing && (
                <button className="cv-btn-primary cv-btn-large" onClick={handleProcess}
                    disabled={!enrollments.trim()}>
                    🔍 Verify All
                </button>
            )}

            {processing && (
                <div className="cv-progress-wrap">
                    <div className="cv-progress-label">Verifying... {progress}%</div>
                    <div className="cv-progress-bar">
                        <div className="cv-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {processed && (
                <>
                    <div className="cv-result-stats">
                        <div className="cv-stat">
                            <div className="cv-stat-num">{results.length}</div>
                            <div className="cv-stat-label">Processed</div>
                        </div>
                        <div className="cv-stat">
                            <div className="cv-stat-num" style={{ color: 'var(--cv-green)' }}>{found.length}</div>
                            <div className="cv-stat-label">Verified</div>
                        </div>
                        <div className="cv-stat">
                            <div className="cv-stat-num" style={{ color: 'var(--cv-red)' }}>{notFound.length}</div>
                            <div className="cv-stat-label">Not Found</div>
                        </div>
                    </div>

                    <div className="cv-table-wrap">
                        <table className="cv-table">
                            <thead>
                                <tr>
                                    <th>Enrollment</th>
                                    <th>Name</th>
                                    <th>Batch</th>
                                    <th>Verified Claims</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i} className={!r.found ? 'row-not-found' : ''}>
                                        <td>{r.id}</td>
                                        <td>{r.found ? r.name : <span className="cv-muted">Not Found</span>}</td>
                                        <td>{r.batch || '—'}</td>
                                        <td>
                                            {r.found ? (
                                                r.claims.length > 0
                                                    ? r.claims.map(c => (
                                                        <span key={c.type} className="cv-mini-badge">{c.type}: {c.value}</span>
                                                    ))
                                                    : <span className="cv-muted">No visible claims</span>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button className="cv-btn-primary" onClick={handleDownload}>
                        ⬇️ Download Results CSV
                    </button>
                </>
            )}
        </div>
    );
};

export default BulkVerify;
