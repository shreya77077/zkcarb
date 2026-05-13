import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const wallet = new ethers.Wallet(process.env.HEDERA_EVM_PRIVATE_KEY!, provider);

  const artifact = JSON.parse(
    readFileSync("artifacts/contracts/CarbonCredit.sol/CarbonCredit.json", "utf8")
  );
  const contract = new ethers.Contract(
    process.env.CARBON_CREDIT_ADDRESS!,
    artifact.abi,
    wallet
  );

  // Generate a nullifier from wallet + action
  const nullifier = ethers.keccak256(
    ethers.toUtf8Bytes(wallet.address + "retire_action_1")
  );

  console.log("Retiring 1 credit with nullifier:", nullifier);
  const tx = await contract.retireCredit(1, nullifier);
  await tx.wait();
  console.log("Transaction hash:", tx.hash);

  const balance = await contract.creditBalance(wallet.address);
  console.log("Remaining balance:", balance.toString());

  // Try retiring again with same nullifier (should fail)
  console.log("Attempting double retirement...");
  try {
    const tx2 = await contract.retireCredit(1, nullifier);
    await tx2.wait();
    console.log("ERROR: Should have failed!");
  } catch (e: any) {
    console.log("Double retirement correctly rejected!");
  }
}

main().catch(console.error);