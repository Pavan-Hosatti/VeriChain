/**
 * hashUtils.js - JavaScript version of the Python hashing code
 * Converts: hash_utils.py → Browser-compatible SHA-256
 * Uses: Web Crypto API (built into all browsers, no library needed)
 */

/**
 * Hash a string using SHA-256 (equivalent to Python's hash_string)
 * @param {string} text - The text to hash
 * @returns {Promise<string>} - Hex digest of the hash
 */
export async function hashString(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash raw bytes (equivalent to Python's hash_bytes)
 * @param {Uint8Array} dataBytes - Raw bytes to hash
 * @returns {Promise<string>} - Hex digest
 */
export async function hashBytes(dataBytes) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a file from browser file input (equivalent to Python's hash_file)
 * @param {File} file - File object from <input type="file">
 * @returns {Promise<string>} - Hex digest
 */
export async function hashFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a degree hash from structured data
 * This is the main function used in the medical portal
 * @param {Object} degreeData - { studentName, university, degreeType, year }  
 * @returns {Promise<string>} - Hex digest
 */
export async function hashDegree(degreeData) {
    const { studentName, university, degreeType, year } = degreeData;
    const combined = `${studentName}|${university}|${degreeType}|${year}`;
    return await hashString(combined);
}

/**
 * Verify if a hash matches (equivalent to Python's verify_match)
 * @param {string} originalHash - The stored hash
 * @param {string} currentHash - The hash to verify
 * @returns {boolean}
 */
export function verifyMatch(originalHash, currentHash) {
    return originalHash === currentHash;
}
