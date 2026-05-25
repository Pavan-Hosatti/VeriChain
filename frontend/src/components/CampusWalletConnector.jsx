import React, { useState, useEffect } from "react";
import { peraWallet } from "../services/WalletService";

const CampusWalletConnector = ({ onAddressChange }) => {
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        // Reconnect on refresh
        let mounted = true;

        peraWallet.reconnectSession()
            .then((accounts) => {
                if (!mounted) return;
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                    onAddressChange(accounts[0]);
                }
                peraWallet.connector?.on("disconnect", handleDisconnect);
            })
            .catch(() => { });

        return () => {
            mounted = false;
        };
    }, []);

    const handleConnect = async () => {
        try {
            const accounts = await peraWallet.connect();
            setAddress(accounts[0]);
            onAddressChange(accounts[0]);
            setError("");
        } catch (err) {
            if (err?.data?.type === "CONNECT_MODAL_CLOSED") {
                setError("Connection cancelled.");
            } else {
                setError("Failed to connect wallet.");
            }
        }
    };

    const handleDisconnect = () => {
        try { peraWallet.disconnect().catch(() => {}); } catch (e) { }
        setAddress("");
        onAddressChange("");
    };

    const truncateAddress = (addr) => {
        return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
    };

    return (
        <div className="campus-wallet-card">
            {!address ? (
                <div className="connector-ui">
                    <button className="connect-btn authority" onClick={handleConnect}>
                        🏛️ Connect Authority Wallet
                    </button>
                    <p className="hint">Secured by Algorand Testnet</p>
                </div>
            ) : (
                <div className="connected-ui">
                    <span className="status-badge">✅ Authority Verified</span>
                    <p className="address-text">ID: {truncateAddress(address)}</p>
                    <button className="disconnect-btn" onClick={handleDisconnect}>
                        Disconnect
                    </button>
                </div>
            )}
            {error && <p className="error-text">{error}</p>}
        </div>
    );
};

export default CampusWalletConnector;
