import { Client, TopicMessageSubmitTransaction, AccountId, PrivateKey, TopicId } from "@hashgraph/sdk";
import { buildPoseidon } from "circomlibjs";
import dotenv from "dotenv";
dotenv.config();

async function submitMRVCommitment(co2, biomass, area) {
    // Compute Poseidon commitment
    const poseidon = await buildPoseidon();
    const hash = poseidon([BigInt(co2), BigInt(biomass), BigInt(area)]);
    const commitment = poseidon.F.toString(hash);
    console.log("Commitment:", commitment);

    // Submit to HCS
    const client = Client.forTestnet();
    client.setOperator(
        AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
        PrivateKey.fromStringECDSA(process.env.HEDERA_EVM_PRIVATE_KEY)
    );
    client.setRequestTimeout(60000);

    const tx = await new TopicMessageSubmitTransaction({
        topicId: TopicId.fromString(process.env.HCS_TOPIC_ID),
        message: JSON.stringify({
            commitment,
            timestamp: new Date().toISOString(),
            project: "ZKCarb-Demo"
        })
    }).execute(client);

    const receipt = await tx.getReceipt(client);
    console.log("HCS message status:", receipt.status.toString());
    console.log("Sequence number:", receipt.topicSequenceNumber.toString());
    console.log("View on HashScan: https://hashscan.io/testnet/topic/" + process.env.HCS_TOPIC_ID);

    client.close();
    return commitment;
}

// Test with our MRV values
submitMRVCommitment(1250, 85, 500).catch(console.error);