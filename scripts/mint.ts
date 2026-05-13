import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const wallet = new ethers.Wallet(process.env.HEDERA_EVM_PRIVATE_KEY!, provider);

  // Load proof
  const proof = JSON.parse(readFileSync("circuits/build/proof.json", "utf8"));
  const publicSignals = JSON.parse(readFileSync("circuits/build/public.json", "utf8"));

  // Load CarbonCredit contract
  const artifact = JSON.parse(
    readFileSync("artifacts/contracts/CarbonCredit.sol/CarbonCredit.json", "utf8")
  );
  const contract = new ethers.Contract(
    process.env.CARBON_CREDIT_ADDRESS!,
    artifact.abi,
    wallet
  );

  // Format proof for Solidity
  const pA = [proof.pi_a[0], proof.pi_a[1]];
  const pB = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const pC = [proof.pi_c[0], proof.pi_c[1]];
  const pubSignals = publicSignals.slice(0, 4);

  console.log("Calling verifyAndMint...");
  const tx = await contract.verifyAndMint(pA, pB, pC, pubSignals, 1);
  await tx.wait();
  console.log("Transaction hash:", tx.hash);

  // Check balance
  const balance = await contract.creditBalance(wallet.address);
  console.log("Carbon credit balance:", balance.toString());
}

main().catch(console.error);