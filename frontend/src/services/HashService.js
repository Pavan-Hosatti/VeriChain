/**
 * HashService.js
 * Cryptographic logic layer.
 * Domain agnostic: works for files, strings, and structured data.
 */

export const HashService = {
    /**
     * Standard SHA-256 for strings
     */
    async hashString(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Robust hashing for large files
     */
    async hashFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Domain Logic: Create a secure, salted record hash
     * Salting keeps names private even on a public ledger.
     */
    async createSecureRecordHash(data, salt = import.meta.env.VITE_SALT || "RAJ-MED-2026") {
        const combined = `${JSON.stringify(data)}|${salt}`;
        return await this.hashString(combined);
    }
};
