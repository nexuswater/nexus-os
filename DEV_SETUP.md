# Nexus OS — Developer Setup & Deployment Guide

## 1. Overview

Nexus Water DAO is a multi-chain governance dApp built on a hub-and-spoke architecture.

- **Hub**: Base (canonical source of truth for all governance state)
- **Spokes**: XRPL EVM, Arbitrum, HyperEVM
- **Cross-chain messaging**: Axelar GMP (General Message Passing)
- **Wallet support**: Dual wallet (XRPL + EVM) or EVM-only. Both modes are fully functional.

Users can vote, delegate, and participate in governance from any supported chain. The Base hub aggregates all cross-chain vote data into unified tallies.

---

## 2. Prerequisites

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | >= 18 |
| npm | >= 9 |
| Git | Latest stable |
| MetaMask or WalletConnect-compatible wallet | -- |
| Xaman wallet (optional, for XRPL) | -- |

---

## 3. Environment Variables

### Client (`packages/client/.env`)

```env
VITE_API_URL=http://localhost:3001/api
VITE_SQUID_INTEGRATOR_ID=         # Squid Router integration ID (mock mode if empty)
VITE_WALLET_CONNECT_PROJECT_ID=   # WalletConnect v2 project ID (optional)
```

### Server (`packages/server/.env`)

```env
PORT=3001
NODE_ENV=development
```

> **Note:** All env vars are optional. The system runs in full mock mode without any of them configured.

---

## 4. Local Development

```bash
# Install dependencies
npm install

# Start server (port 3001)
npm run dev --workspace=packages/server

# Start client (port 5173)
npm run dev --workspace=packages/client
```

All features work in mock mode without any env vars. Mock data is served by the Express server and the EVM client layer returns simulated responses.

---

## 5. Project Structure

```
packages/
  shared/          # Types, governance logic, chain config
  client/          # React + Vite frontend
  server/          # Express mock API server
  contracts/       # Smart contracts
    evm/           # Solidity contracts (Hub + Spoke)
    hooks/         # Xahau Hook (C)
    config/        # Deployment configs
```

---

## 6. Smart Contract Deployment Order

Contracts must be deployed in the following order:

1. **Deploy NXS ERC-20 token on Base** (or use an existing deployment)
2. **Deploy `NexusGovernanceHub` on Base**
3. **Deploy `NexusGovernanceMirror` on each spoke** (XRPL EVM, Arbitrum, HyperEVM)
4. **On hub** — call `registerRemoteMirror(axelarChainName, spokeAddress)` for each spoke
5. **On each spoke** — call `setHub("base", hubAddress)`
6. **Update `packages/client/src/lib/contracts/addresses.ts`** with all deployed addresses
7. **Deploy NXS ERC-20 on each spoke chain** (or bridge from Base)

### Hardhat Commands (when set up)

```bash
npx hardhat compile
npx hardhat deploy --network base
npx hardhat deploy --network xrplevm
npx hardhat deploy --network arbitrum
npx hardhat deploy --network hyperevm
```

---

## 7. Chain Configuration

| Chain | Chain ID | Role | Axelar Name | Gas Token | RPC |
|-------|----------|------|-------------|-----------|-----|
| Base | 8453 | HUB | base | ETH | https://mainnet.base.org |
| XRPL EVM | 1440000 | SPOKE | xrpl-evm | XRP | https://rpc.xrplevm.org/ |
| Arbitrum | 42161 | SPOKE | arbitrum | ETH | https://arb1.arbitrum.io/rpc |
| HyperEVM | 998 | SPOKE | hyperevm | HYPE | https://rpc.hyperliquid.xyz/evm |

### Adding a New Chain

1. Deploy `NexusGovernanceMirror` on the new chain
2. Call `hub.registerRemoteMirror(axelarChainName, mirrorAddress)`
3. Call `spoke.setHub("base", hubAddress)`
4. Add chain config to `packages/shared/src/types/chains.ts` (`NEXUS_CHAINS`)
5. Add contract address to `packages/client/src/lib/contracts/addresses.ts`
6. Chain appears automatically in the UI

---

## 8. Architecture

### Governance Flow

```
User votes on Spoke (e.g. Arbitrum)
  -> Spoke records local vote
  -> Spoke broadcasts VOTE_DELTA to Base via Axelar GMP
  -> Base Hub aggregates unified tallies
  -> UI reads unified state from Base Hub
```

### Proposal Lifecycle

```
1. Proposal created on Base Hub
2. Hub broadcasts PROPOSAL_CREATED to all spokes via Axelar
3. Voting period (3 days default)
4. Anyone calls finalize() on hub after end time
5. If passed + quorum met -> status = Passed
6. Owner calls execute() on hub -> executes payload
```

### Delegation

```
- EVM: On-chain via NexusGovernanceHub.delegate()
- XRPL: Via Xahau Hook (nexus_delegation.c)
- Operator fee: 0-20% cap, fee-for-service model
- Delegation is hub-only in v1
```

---

## 9. Key Adapter Files

| File | Purpose |
|------|---------|
| `lib/governance/governanceHubReader.ts` | Read unified state from Base hub |
| `lib/governance/multiChainGovernanceAdapter.ts` | Route write actions to correct chain |
| `lib/evm/evmClient.ts` | EVM contract interaction layer |
| `lib/assets/canonicalAssets.ts` | Token registry (plug-and-play) |
| `lib/contracts/addresses.ts` | Deployed contract addresses |
| `lib/delegation/delegationAdapter.ts` | Delegation CRUD |
| `lib/delegation/delegationRewards.ts` | Fee-for-service reward estimation |

---

## 10. Hub Migration (Base to XRPL EVM)

The system is designed for future hub migration with zero governance history lost:

1. DAO proposal passes: `setNextHub(xrplEvmAddress, "xrpl-evm")`
2. `migrationActive = true` — new proposals paused
3. Snapshot full state
4. Broadcast state to new hub
5. Update frontend `hubChainId` in config
6. Zero governance history lost

---

## 11. Non-Negotiable UX Rules

- No "APY", "guaranteed yield", "profit" language
- Delegation is "operator fee for governance service"
- Always show which chain the user is interacting with
- Always show hub unified tallies (Base) as source of truth
- "Bridge (preview)" label until real bridge integration
- "Supply" not "Deposit" for yield markets

---

## 12. Testing Checklist

- [ ] Start both dev servers (client 5173, server 3001)
- [ ] Navigate every sidebar link — no empty placeholders
- [ ] DAO proposals show per-chain vote breakdown
- [ ] Vote buttons work from any supported chain (mock mode)
- [ ] Delegation wizard creates and revokes delegations
- [ ] Swap tab shows token pairs with rates
- [ ] Cross-chain tab shows bridge routes
- [ ] Yield page shows markets and positions
- [ ] Admin > Networks shows chain registry
- [ ] Profile toggles work
- [ ] Mobile responsive via hamburger menu
