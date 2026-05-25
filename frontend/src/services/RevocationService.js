/* RevocationService: fetches revocation snapshot from backend and applies it locally
   The snapshot is stored via OfflineVerificationService.applyRevocationSnapshot
*/
import { applyRevocationSnapshot } from './OfflineVerificationService';

export const fetchRevocationSnapshot = async (baseUrl = '') => {
    const url = (baseUrl || '') + '/api/v1/revocations';
    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const snapshot = await res.json();
        applyRevocationSnapshot(snapshot);
        return snapshot;
    } catch (err) {
        // Caller can handle null fallback
        // Keep console warning for developer debugging
        // eslint-disable-next-line no-console
        console.warn('fetchRevocationSnapshot failed', err);
        return null;
    }
};

export const scheduleRevocationSync = (intervalMs = 24 * 60 * 60 * 1000, baseUrl = '') => {
    // Kick off an immediate sync, then schedule periodic updates
    fetchRevocationSnapshot(baseUrl);
    return setInterval(() => fetchRevocationSnapshot(baseUrl), intervalMs);
};

export default {
    fetchRevocationSnapshot,
    scheduleRevocationSync,
};
