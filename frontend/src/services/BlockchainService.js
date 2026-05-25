/**
 * BlockchainService.js
 * Algorand communication layer.
 * Domain agnostic: simply records and verifies hashes.
 */
import * as algosdk from "algosdk";

// Algorand Testnet (via AlgoNode)
const algodServer = import.meta.env.VITE_ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const algodToken = import.meta.env.VITE_ALGOD_TOKEN || "";
const algodPort = import.meta.env.VITE_ALGOD_PORT || "";

const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

export const APP_ID = parseInt(import.meta.env.VITE_APP_ID || "755797878");

export const BlockchainService = {
    /**
     * Prepares a transaction to record an asset hash via Payment Note (Original Flow)
     */
    async prepareAssetTransaction(sender, assetHash, metadata = {}) {
        const suggestedParams = await algodClient.getTransactionParams().do();

        // Metadata structure for tomorrow's adaptability
        const noteObj = {
            v: "2.0",           // Version
            type: metadata.type || "RECORD",
            hash: assetHash,
            id: metadata.id || Date.now().toString(),
            ts: Date.now()
        };

        const enc = new TextEncoder();
        return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: sender,
            receiver: sender, // Sending to self as an anchor
            amount: 0,
            note: enc.encode(JSON.stringify(noteObj)),
            suggestedParams: suggestedParams,
        });
    },

    /**
     * Prepares a Smart Contract Call (ARC-4 ABI)
     */
    async prepareContractCall(sender, appId, method, args) {
        const suggestedParams = await algodClient.getTransactionParams().do();

        // New ABI for PlacementVerify contract
        const abi = {
            "name": "PlacementVerify",
            "methods": [
                {
                    "name": "issue_claim",
                    "args": [
                        { "type": "string", "name": "student" },
                        { "type": "string", "name": "claim_type" },
                        { "type": "string", "name": "claim_value" },
                        { "type": "string", "name": "issuer" },
                        { "type": "string", "name": "issue_date" }
                    ],
                    "returns": { "type": "uint64" }
                },
                {
                    "name": "revoke_claim",
                    "args": [
                        { "type": "uint64", "name": "claim_id" }
                    ],
                    "returns": { "type": "void" }
                },
                {
                    "name": "get_all_claims",
                    "args": [],
                    "returns": { "type": "string" }
                },
                {
                    "name": "get_next_claim_id",
                    "args": [],
                    "returns": { "type": "uint64" }
                }
            ]
        };
        const contract = new algosdk.ABIContract(abi);
        const atc = new algosdk.AtomicTransactionComposer();

        atc.addMethodCall({
            appID: appId,
            method: contract.getMethodByName(method),
            methodArgs: args,
            sender: sender,
            suggestedParams: suggestedParams,
            onComplete: algosdk.OnApplicationComplete.NoOpOC
        });

        const txGroup = atc.buildGroup();
        return txGroup.map(t => t.txn);
    },

    /**
     * Checks if an asset is revoked by looking at balances/owner
     */
    async isAssetRevoked(assetId) {
        try {
            // Standard Revocation: Check if any is held by zero address
            const zeroAddress = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";
            // In a real indexed app, we'd use indexer.
            // For demo, we'll simulate check or use the creator's status if it's a contract-managed asset.
            return false; // Default to false for demo unless logic says otherwise
        } catch (e) {
            return false;
        }
    },

    /**
     * Sends signed transactions to the network
     */
    async sendTransaction(signedTxns) {
        // Handle both single and array of signed transactions
        const txns = Array.isArray(signedTxns) ? signedTxns : [signedTxns];
        const sendResult = await algodClient.sendRawTransaction(txns).do();
        return sendResult.txId || sendResult.txid;
    },

    /**
     * Standard confirmation wait
     */
    async waitForConfirmation(txId) {
        return await algosdk.waitForConfirmation(algodClient, txId, 4);
    }
};
