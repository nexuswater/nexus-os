import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying NexusGovernanceHub with account:", deployer.address);

  // These addresses must be set before deployment
  const GATEWAY_ADDRESS = process.env.AXELAR_GATEWAY || ethers.ZeroAddress;
  const GAS_SERVICE_ADDRESS = process.env.AXELAR_GAS_SERVICE || ethers.ZeroAddress;
  const NXS_TOKEN_ADDRESS = process.env.NXS_TOKEN || ethers.ZeroAddress;

  if (GATEWAY_ADDRESS === ethers.ZeroAddress) {
    console.warn("WARNING: Using zero address for Axelar Gateway. Set AXELAR_GATEWAY env var.");
  }

  const Hub = await ethers.getContractFactory("NexusGovernanceHub");
  const hub = await Hub.deploy(GATEWAY_ADDRESS, GAS_SERVICE_ADDRESS, NXS_TOKEN_ADDRESS);
  await hub.waitForDeployment();

  const address = await hub.getAddress();
  console.log("NexusGovernanceHub deployed to:", address);
  console.log("");
  console.log("Next steps:");
  console.log("1. Deploy spoke mirrors on each chain");
  console.log("2. Call hub.registerRemoteMirror(axelarChainName, spokeAddress) for each spoke");
  console.log("3. Update packages/client/src/lib/contracts/addresses.ts with:", address);

  return address;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
