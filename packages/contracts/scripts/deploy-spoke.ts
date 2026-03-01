import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying NexusGovernanceMirror with account:", deployer.address);

  const GATEWAY_ADDRESS = process.env.AXELAR_GATEWAY || ethers.ZeroAddress;
  const GAS_SERVICE_ADDRESS = process.env.AXELAR_GAS_SERVICE || ethers.ZeroAddress;
  const NXS_TOKEN_ADDRESS = process.env.NXS_TOKEN || ethers.ZeroAddress;

  const Mirror = await ethers.getContractFactory("NexusGovernanceMirror");
  const mirror = await Mirror.deploy(GATEWAY_ADDRESS, GAS_SERVICE_ADDRESS, NXS_TOKEN_ADDRESS);
  await mirror.waitForDeployment();

  const address = await mirror.getAddress();
  console.log("NexusGovernanceMirror deployed to:", address);

  const HUB_CHAIN = process.env.HUB_CHAIN_NAME || "base";
  const HUB_ADDRESS = process.env.HUB_ADDRESS || "";

  if (HUB_ADDRESS) {
    console.log(`Setting hub: chain="${HUB_CHAIN}", address="${HUB_ADDRESS}"`);
    const tx = await mirror.setHub(HUB_CHAIN, HUB_ADDRESS);
    await tx.wait();
    console.log("Hub set successfully.");
  } else {
    console.log("HUB_ADDRESS not set. Call mirror.setHub() manually after deployment.");
  }

  console.log("");
  console.log("Next steps:");
  console.log("1. On Base hub, call: hub.registerRemoteMirror(axelarChainName, " + address + ")");
  console.log("2. Update packages/client/src/lib/contracts/addresses.ts");

  return address;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
