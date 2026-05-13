import { Client, TopicCreateTransaction, AccountId, PrivateKey } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const client = Client.forTestnet();
    client.setOperator(
        AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
        PrivateKey.fromStringECDSA(process.env.HEDERA_EVM_PRIVATE_KEY)
    );
    client.setRequestTimeout(60000);

    console.log("Creating HCS topic...");
    const topicTx = await new TopicCreateTransaction()
        .setTopicMemo("ZKCarb MRV Audit Log")
        .execute(client);
    
    const topicReceipt = await topicTx.getReceipt(client);
    const topicId = topicReceipt.topicId.toString();
    console.log("Topic ID:", topicId);
    console.log("Add to .env: HCS_TOPIC_ID=" + topicId);
    
    client.close();
}

main().catch(console.error);