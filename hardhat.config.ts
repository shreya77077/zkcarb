import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hedera_testnet: {
      type: "http",
      chainType: "l1",
      url: "https://testnet.hashio.io/api",
      accounts: [configVariable("HEDERA_EVM_PRIVATE_KEY")],
    },
  },
});