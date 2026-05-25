import React, { useState } from "react";
import { PeraWalletConnect } from "@perawallet/connect";

const peraWallet = new PeraWalletConnect();

const LiquidAuthButton = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState("");

    const loginHospitalStaff = async () => {
        setLoading(true);
        setError("");
        setScanning(true);

        try {
            // STEP 1: Hardware-Level Biometric Check (Passkey/WebAuthn)
            // This is the "Passport" for the doctor on this specific PC.
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: crypto.getRandomValues(new Uint8Array(32)),
                    rp: { name: "Rajasthan Medical Registry" },
                    user: {
                        id: crypto.getRandomValues(new Uint8Array(16)),
                        name: "dr-sharma-admin",
                        displayName: "Dr. Sharma (Admin ID: 772)"
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: {
                        userVerification: "required",
                        authenticatorAttachment: "platform" // FORCES Windows Hello / TouchID Fingerprint
                    },
                    timeout: 60000
                }
            });

            if (credential) {
                setScanning(false);
                setError("👆 Biometrics Verified locally. Connecting Secure Wallet...");
                // STEP 2: Securely Link the Wallet
                const accounts = await peraWallet.connect();
                onSuccess(accounts[0]);
            }
        } catch (err) {
            setScanning(false);
            console.error(err);
            if (err.name === "NotAllowedError") {
                setError("👆 Fingerprint/Passkey prompt cancelled. Please use your device's biometric sensor.");
            } else {
                setError(`Auth Error: ${err.message || "Device check failed. Fall back to QR."}`);
                // Simple fallback to standard connect if biometrics aren't configured on PC
                const accounts = await peraWallet.connect();
                onSuccess(accounts[0]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="liquid-auth-container">
            <button
                className={`liquid-auth-btn ${scanning ? 'scanning' : ''}`}
                onClick={loginHospitalStaff}
                disabled={loading}
            >
                {scanning ? "🛑 TOUCH SENSOR..." : "👆 Login with Fingerprint"}
            </button>

            {scanning && (
                <div className="biometric-overlay">
                    <div className="scanning-icon">🧤</div>
                    <p>Browser is verifying your hardware passkey...</p>
                </div>
            )}

            <p className="hint">Uses <strong>W3C WebAuthn</strong> (Passkeys). No passwords ever stored.</p>
            {error && <p className="error-text">{error}</p>}
        </div>
    );
};

export default LiquidAuthButton;
