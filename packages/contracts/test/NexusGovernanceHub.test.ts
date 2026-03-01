import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("NexusGovernanceHub", function () {

  async function deployFixture() {
    const [owner, voter1, voter2, operator, relayer] = await ethers.getSigners();

    // Deploy mock NXS token (simple ERC20)
    const MockToken = await ethers.getContractFactory("MockERC20");
    // We need a simple mock ERC20 — just deploy the hub with zero address for now
    // In a real test, deploy a mock ERC20 first

    // Deploy with zero addresses for gateway/gas service (local testing)
    const Hub = await ethers.getContractFactory("NexusGovernanceHub");
    const hub = await Hub.deploy(
      ethers.ZeroAddress, // gateway (not used in local tests)
      ethers.ZeroAddress, // gas service
      ethers.ZeroAddress, // NXS token (mock)
    );

    return { hub, owner, voter1, voter2, operator, relayer };
  }

  describe("Deployment", function () {
    it("Should set the deployer as owner", async function () {
      const { hub, owner } = await loadFixture(deployFixture);
      expect(await hub.owner()).to.equal(owner.address);
    });

    it("Should start with zero proposals", async function () {
      const { hub } = await loadFixture(deployFixture);
      expect(await hub.proposalSeq()).to.equal(0);
    });

    it("Should not be in migration mode", async function () {
      const { hub } = await loadFixture(deployFixture);
      expect(await hub.migrationActive()).to.equal(false);
    });
  });

  describe("Chain Registry", function () {
    it("Should register a remote mirror", async function () {
      const { hub } = await loadFixture(deployFixture);
      await hub.registerRemoteMirror("arbitrum", "0x1234567890abcdef1234567890abcdef12345678");
      // Verify via supportedChain mapping
      const chainHash = ethers.keccak256(ethers.toUtf8Bytes("arbitrum"));
      expect(await hub.supportedChain(chainHash)).to.equal(true);
    });

    it("Should reject non-owner mirror registration", async function () {
      const { hub, voter1 } = await loadFixture(deployFixture);
      await expect(
        hub.connect(voter1).registerRemoteMirror("arbitrum", "0x1234")
      ).to.be.reverted;
    });

    it("Should remove a remote mirror", async function () {
      const { hub } = await loadFixture(deployFixture);
      const addr = "0x1234567890abcdef1234567890abcdef12345678";
      await hub.registerRemoteMirror("xrpl-evm", addr);
      await hub.removeRemoteMirror("xrpl-evm", addr);

      const key = ethers.keccak256(
        ethers.solidityPacked(["string", "string", "string"], ["xrpl-evm", "|", addr])
      );
      expect(await hub.allowedRemote(key)).to.equal(false);
    });
  });

  describe("Delegation", function () {
    it("Should create a delegation", async function () {
      const { hub, voter1, operator } = await loadFixture(deployFixture);
      const expiry = Math.floor(Date.now() / 1000) + 86400 * 30;

      await hub.connect(voter1).delegate(
        operator.address,
        1,    // SCOPE_NXS
        500,  // 5% fee
        expiry,
      );

      const delegation = await hub.delegations(voter1.address);
      expect(delegation.operator).to.equal(operator.address);
      expect(delegation.active).to.equal(true);
      expect(delegation.feeBps).to.equal(500);
    });

    it("Should reject fee above 20%", async function () {
      const { hub, voter1, operator } = await loadFixture(deployFixture);
      const expiry = Math.floor(Date.now() / 1000) + 86400 * 30;

      await expect(
        hub.connect(voter1).delegate(operator.address, 1, 2500, expiry)
      ).to.be.reverted; // exceeds MAX_FEE_BPS (2000)
    });

    it("Should revoke a delegation", async function () {
      const { hub, voter1, operator } = await loadFixture(deployFixture);
      const expiry = Math.floor(Date.now() / 1000) + 86400 * 30;

      await hub.connect(voter1).delegate(operator.address, 1, 500, expiry);
      await hub.connect(voter1).undelegate();

      const delegation = await hub.delegations(voter1.address);
      expect(delegation.active).to.equal(false);
    });

    it("Should prevent delegating to self", async function () {
      const { hub, voter1 } = await loadFixture(deployFixture);
      const expiry = Math.floor(Date.now() / 1000) + 86400 * 30;

      await expect(
        hub.connect(voter1).delegate(voter1.address, 1, 500, expiry)
      ).to.be.reverted;
    });
  });

  describe("Admin", function () {
    it("Should update proposal threshold", async function () {
      const { hub } = await loadFixture(deployFixture);
      await hub.setProposalThreshold(5000);
      expect(await hub.proposalThreshold()).to.equal(5000);
    });

    it("Should transfer ownership", async function () {
      const { hub, voter1 } = await loadFixture(deployFixture);
      await hub.transferOwnership(voter1.address);
      expect(await hub.owner()).to.equal(voter1.address);
    });

    it("Should set migration hub", async function () {
      const { hub, voter1 } = await loadFixture(deployFixture);
      await hub.setNextHub(voter1.address, "xrpl-evm");
      expect(await hub.migrationActive()).to.equal(true);
      expect(await hub.nextHub()).to.equal(voter1.address);
    });
  });
});
