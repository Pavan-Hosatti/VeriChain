const API_BASE = import.meta.env.VITE_API_BASE || '';

export const confirmClaimLive = async (claimId) => {
    try {
        const res = await fetch(`${API_BASE}/api/v1/claim-status/${encodeURIComponent(claimId)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Normalize response for frontend usage
        return {
            claimId: json.claimId,
            status: json.status,
            source: json.source || (json.found ? 'indexer' : 'snapshot'),
            snapshotAt: json.snapshotAt || null,
            cached: json.cached || false
        };
    } catch (err) {
        console.warn('confirmClaimLive failed', err);
        return null;
    }
};

export default { confirmClaimLive };
