import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const wallet = new ethers.Wallet(process.env.HEDERA_EVM_PRIVATE_KEY!, provider);
  console.log("Deploying from:", wallet.address);

  // ── Deploy MRVVerifier ──
  const mrvArtifact = JSON.parse(
    readFileSync("artifacts/contracts/MRVVerifier.sol/Groth16Verifier.json", "utf8")
  );
  const mrvFactory = new ethers.ContractFactory(mrvArtifact.abi, mrvArtifact.bytecode, wallet);
  const mrvVerifier = await mrvFactory.deploy();
  await mrvVerifier.waitForDeployment();
  const mrvAddress = await mrvVerifier.getAddress();
  console.log("MRVVerifier deployed to:", mrvAddress);

  // ── Deploy CarbonCredit ──
  const ccArtifact = JSON.parse(
    readFileSync("artifacts/contracts/CarbonCredit.sol/CarbonCredit.json", "utf8")
  );
  const ccFactory = new ethers.ContractFactory(ccArtifact.abi, ccArtifact.bytecode, wallet);
  const carbonCredit = await ccFactory.deploy(mrvAddress);
  await carbonCredit.waitForDeployment();
  const ccAddress = await carbonCredit.getAddress();
  console.log("CarbonCredit deployed to:", ccAddress);
}

main().catch(console.error);