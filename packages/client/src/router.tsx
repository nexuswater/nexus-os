import { createBrowserRouter, Navigate } from 'react-router-dom';
import { WebLayout } from '@/components/layout/WebLayout';
import { XAppLayout } from '@/components/layout/XAppLayout';
import ErrorPage from '@/pages/ErrorPage';

// ─── New customer-first pages ──────────────────────────────
import Landing from '@/pages/Landing';
import Today from '@/pages/Today';
import Scores from '@/pages/Scores';
import Improve from '@/pages/Improve';
import Rewards from '@/pages/Rewards';
import VaultLayout from '@/pages/VaultTrust';
import VaultVerification from '@/pages/VaultTrust/Verification';
import TrustCenter from '@/pages/VaultTrust/TrustCenter';
import YourData from '@/pages/VaultTrust/YourData';

// ─── Existing page imports ─────────────────────────────────
import Home from '@/pages/Home';
import Assets from '@/pages/Assets';
import BatchBreakdown from '@/pages/Assets/BatchBreakdown';
import NFTGallery from '@/pages/Assets/NFTGallery';
import Mint from '@/pages/Mint';
import InstallationSetup from '@/pages/Mint/InstallationSetup';
import ProofSubmission from '@/pages/Mint/ProofSubmission';
import ReviewQueue from '@/pages/Mint/ReviewQueue';
import BatchMint from '@/pages/Mint/BatchMint';
import MintReceipt from '@/pages/Mint/MintReceipt';
import Marketplace from '@/pages/Marketplace';
import NFTListings from '@/pages/Marketplace/NFTListings';
import TokenListings from '@/pages/Marketplace/TokenListings';
import ListingDetail from '@/pages/Marketplace/ListingDetail';
import TradePreview from '@/pages/Marketplace/TradePreview';
import DAO from '@/pages/DAO';
import Proposals from '@/pages/DAO/Proposals';
import ProposalDetail from '@/pages/DAO/ProposalDetail';
import CreateProposal from '@/pages/DAO/CreateProposal';
import Treasury from '@/pages/DAO/Treasury';
import VotingPower from '@/pages/DAO/VotingPower';
import Rules from '@/pages/DAO/Rules';
import Delegation from '@/pages/DAO/Delegation';
import Impact from '@/pages/Impact';
import ImpactDashboard from '@/pages/Impact/ImpactDashboard';
import NFTImpact from '@/pages/Impact/NFTImpact';
import MapDashboard from '@/pages/Map/MapDashboard';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import ProofQueue from '@/pages/Admin/ProofQueue';
import Allowlist from '@/pages/Admin/Allowlist';
import EmergencyControls from '@/pages/Admin/EmergencyControls';
import AuditLog from '@/pages/Admin/AuditLog';
import Networks from '@/pages/Admin/Networks';
import ProtocolHealth from '@/pages/Admin/ProtocolHealth';
import Yield from '@/pages/Yield';
import Bills from '@/pages/Vault/Bills';
import UtilityConnect from '@/pages/Vault/UtilityConnect';
import IoTDevices from '@/pages/Vault/IoTDevices';
import Verification from '@/pages/Vault/Verification';
import AgentsHub from '@/pages/Agents';
import MyAgents from '@/pages/Agents/MyAgents';
import SkillMarketplace from '@/pages/Agents/Marketplace';
import CreateAgent from '@/pages/Agents/CreateAgent';
import AgentTrading from '@/pages/Agents/Trading';
import AgentIntents from '@/pages/Agents/Intents';

import Swap from '@/pages/Swap';
import Registry from '@/pages/Registry';
import Settings from '@/pages/Settings';
import Transparency from '@/pages/Transparency';
import FeedbackLab from '@/pages/Intelligence/FeedbackLab';
import WaterMarket from '@/pages/Intelligence/WaterMarket';
import EvolutionSimulator from '@/pages/Intelligence/EvolutionSimulator';
import NFTGiveaway from '@/pages/Rewards/NFTGiveaway';

import ScoringHub from '@/pages/Scoring';
import SubjectDetail from '@/pages/Scoring/SubjectDetail';
import VerifyCertificate from '@/pages/Scoring/VerifyCertificate';

import Elementalz from '@/pages/Elementalz';
import ElementalzGenesis from '@/pages/Elementalz/Genesis';
import ElementalzTournaments from '@/pages/Elementalz/Tournaments';

// ─── Agent Economy pages ──────────────────────────────────
import EconomyLayout from '@/pages/Economy';
import SkillsMarketEcon from '@/pages/Economy/SkillsMarket';
import EnvironmentalMarket from '@/pages/Economy/EnvironmentalMarket';
import NegotiationsPage from '@/pages/Economy/Negotiations';
import TrustPage from '@/pages/Economy/Trust';
import ReceiptsPage from '@/pages/Economy/Receipts';
import BotsPage from '@/pages/Economy/Bots';
import NEX from '@/pages/Exchange/NEX';

// ─── Market / Environmental Asset pages ─────────────────
import AssetRouter from '@/pages/Market/AssetRouter';
import MercyNetwork from '@/pages/Market/MercyNetwork';
import CarbonMarket from '@/pages/Market/CarbonMarket';
import ImpactCard from '@/pages/Market/ImpactCard';
import PlanetaryDashboard from '@/pages/Market/PlanetaryDashboard';

/** Web dApp router — customer-first IA + advanced power tools */
export const webRouter = createBrowserRouter([
  {
    element: <WebLayout />,
    errorElement: <ErrorPage />,
    children: [
      // ══════════════════════════════════════════
      // CUSTOMER-FIRST PRIMARY ROUTES
      // ══════════════════════════════════════════

      // Landing page (benefit-led)
      { index: true, element: <Landing /> },

      // Today dashboard (Apple Health style)
      { path: 'today', element: <Today /> },

      // Scores (Water / Energy / Impact)
      { path: 'scores', element: <Scores /> },

      // Improve (recommendation engine)
      { path: 'improve', element: <Improve /> },

      // Rewards (credits + redemption)
      { path: 'rewards', element: <Rewards /> },

      // Vault (verification, trust center, your data)
      {
        path: 'vault',
        element: <VaultLayout />,
        children: [
          { index: true, element: <VaultVerification /> },
          { path: 'trust', element: <TrustCenter /> },
          { path: 'data', element: <YourData /> },
        ],
      },

      // ══════════════════════════════════════════
      // EXPLORE
      // ══════════════════════════════════════════

      { path: 'map', element: <MapDashboard /> },
      { path: 'transparency', element: <Transparency /> },

      // Community / Scoring
      {
        path: 'scoring',
        children: [
          { index: true, element: <ScoringHub /> },
          { path: ':subjectId', element: <SubjectDetail /> },
          { path: 'verify/:hash', element: <VerifyCertificate /> },
        ],
      },

      // ══════════════════════════════════════════
      // ADVANCED / POWER TOOLS
      // ══════════════════════════════════════════

      { path: 'swap', element: <Swap /> },
      { path: 'liquidity', element: <Yield /> },
      {
        path: 'registry',
        children: [
          { index: true, element: <Registry /> },
          { path: 'batches/:tokenType', element: <BatchBreakdown /> },
          { path: 'nfts', element: <NFTGallery /> },
          { path: 'mint/installation/new', element: <InstallationSetup /> },
          { path: 'mint/proof/submit', element: <ProofSubmission /> },
          { path: 'mint/review', element: <ReviewQueue /> },
          { path: 'mint/batch/create', element: <BatchMint /> },
          { path: 'mint/receipt/:batchId', element: <MintReceipt /> },
        ],
      },
      {
        path: 'governance',
        children: [
          { index: true, element: <DAO /> },
          { path: 'proposals', element: <Proposals /> },
          { path: 'proposals/:proposalId', element: <ProposalDetail /> },
          { path: 'proposals/new', element: <CreateProposal /> },
          { path: 'treasury', element: <Treasury /> },
          { path: 'voting-power', element: <VotingPower /> },
          { path: 'rules', element: <Rules /> },
          { path: 'delegation', element: <Delegation /> },
        ],
      },
      {
        path: 'agents',
        children: [
          { index: true, element: <AgentsHub /> },
          { path: 'my', element: <MyAgents /> },
          { path: 'marketplace', element: <SkillMarketplace /> },
          { path: 'create', element: <CreateAgent /> },
          { path: ':agentId/trading', element: <AgentTrading /> },
          { path: 'intents', element: <AgentIntents /> },
        ],
      },
      {
        path: 'elementalz',
        children: [
          { index: true, element: <Elementalz /> },
          { path: 'genesis', element: <ElementalzGenesis /> },
          { path: 'tournaments', element: <ElementalzTournaments /> },
        ],
      },

      // ══════════════════════════════════════════
      // AGENT ECONOMY
      // ══════════════════════════════════════════
      {
        path: 'economy',
        element: <EconomyLayout />,
        children: [
          { index: true, element: <SkillsMarketEcon /> },
          { path: 'market', element: <EnvironmentalMarket /> },
          { path: 'negotiations', element: <NegotiationsPage /> },
          { path: 'trust', element: <TrustPage /> },
          { path: 'bots', element: <BotsPage /> },
          { path: 'receipts', element: <ReceiptsPage /> },
        ],
      },

      // ══════════════════════════════════════════
      // ANALYTICS / INTELLIGENCE (legacy)
      // ══════════════════════════════════════════

      {
        path: 'analytics',
        children: [
          { index: true, element: <Impact /> },
          { path: 'dashboard', element: <ImpactDashboard /> },
          { path: 'nft/:nftId', element: <NFTImpact /> },
        ],
      },

      // Legacy oracle → now vault
      {
        path: 'oracle',
        children: [
          { index: true, element: <Bills /> },
          { path: 'connect', element: <UtilityConnect /> },
          { path: 'iot', element: <IoTDevices /> },
          { path: 'verification', element: <Verification /> },
        ],
      },

      // ══════════════════════════════════════════
      // SYSTEM
      // ══════════════════════════════════════════

      { path: 'settings', element: <Settings /> },
      { path: 'intelligence', element: <FeedbackLab /> },
      { path: 'simulator', element: <EvolutionSimulator /> },
      { path: 'water-market', element: <WaterMarket /> },
      { path: 'giveaways', element: <NFTGiveaway /> },
      { path: 'nex', element: <NEX /> },

      // ══════════════════════════════════════════
      // ENVIRONMENTAL MARKET
      // ══════════════════════════════════════════

      { path: 'asset-router', element: <AssetRouter /> },
      { path: 'mercy', element: <MercyNetwork /> },
      { path: 'carbon', element: <CarbonMarket /> },
      { path: 'impact-card', element: <ImpactCard /> },
      { path: 'planetary', element: <PlanetaryDashboard /> },

      // ══════════════════════════════════════════
      // LEGACY REDIRECTS
      // ══════════════════════════════════════════

      { path: 'assets', element: <Navigate to="/registry" replace /> },
      { path: 'assets/batches/:tokenType', element: <Navigate to="/registry/batches/:tokenType" replace /> },
      { path: 'assets/nfts', element: <Navigate to="/registry/nfts" replace /> },
      { path: 'mint', element: <Navigate to="/registry" replace /> },
      { path: 'mint/installation/new', element: <Navigate to="/registry/mint/installation/new" replace /> },
      { path: 'mint/proof/submit', element: <Navigate to="/registry/mint/proof/submit" replace /> },
      { path: 'mint/review', element: <Navigate to="/registry/mint/review" replace /> },
      { path: 'mint/batch/create', element: <Navigate to="/registry/mint/batch/create" replace /> },
      {
        path: 'marketplace',
        children: [
          { index: true, element: <Marketplace /> },
          { path: 'nfts', element: <NFTListings /> },
          { path: 'tokens/:tokenType', element: <TokenListings /> },
          { path: 'listing/:listingId', element: <ListingDetail /> },
          { path: 'trade/:listingId', element: <TradePreview /> },
        ],
      },
      { path: 'dao', element: <Navigate to="/governance" replace /> },
      { path: 'dao/proposals', element: <Navigate to="/governance/proposals" replace /> },
      { path: 'dao/proposals/new', element: <Navigate to="/governance/proposals/new" replace /> },
      { path: 'dao/proposals/:proposalId', element: <Navigate to="/governance/proposals/:proposalId" replace /> },
      { path: 'dao/treasury', element: <Navigate to="/governance/treasury" replace /> },
      { path: 'dao/voting-power', element: <Navigate to="/governance/voting-power" replace /> },
      { path: 'dao/rules', element: <Navigate to="/governance/rules" replace /> },
      { path: 'dao/delegation', element: <Navigate to="/governance/delegation" replace /> },
      { path: 'impact', element: <Navigate to="/analytics" replace /> },
      { path: 'impact/dashboard', element: <Navigate to="/analytics/dashboard" replace /> },
      { path: 'yield', element: <Navigate to="/liquidity" replace /> },
      { path: 'vault/bills', element: <Navigate to="/oracle" replace /> },
      { path: 'vault/connect', element: <Navigate to="/oracle/connect" replace /> },
      { path: 'vault/iot', element: <Navigate to="/oracle/iot" replace /> },
      { path: 'vault/verification', element: <Navigate to="/oracle/verification" replace /> },
      { path: 'profile', element: <Navigate to="/settings" replace /> },

      // Admin routes
      {
        path: 'admin',
        children: [
          { index: true, element: <Admin /> },
          { path: 'proofs', element: <ProofQueue /> },
          { path: 'allowlist', element: <Allowlist /> },
          { path: 'emergency', element: <EmergencyControls /> },
          { path: 'audit', element: <AuditLog /> },
          { path: 'networks', element: <Networks /> },
          { path: 'protocol-health', element: <ProtocolHealth /> },
        ],
      },
    ],
  },
]);

/** Xaman xApp router — mobile-first reduced route set */
export const xappRouter = createBrowserRouter([
  {
    element: <XAppLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Today /> },
      { path: 'scores', element: <Scores /> },
      { path: 'improve', element: <Improve /> },
      { path: 'rewards', element: <Rewards /> },
      {
        path: 'vault',
        element: <VaultLayout />,
        children: [
          { index: true, element: <VaultVerification /> },
          { path: 'trust', element: <TrustCenter /> },
          { path: 'data', element: <YourData /> },
        ],
      },
      {
        path: 'assets',
        children: [
          { index: true, element: <Assets /> },
          { path: 'batches/:tokenType', element: <BatchBreakdown /> },
          { path: 'nfts', element: <NFTGallery /> },
        ],
      },
      {
        path: 'marketplace',
        children: [
          { index: true, element: <Marketplace /> },
          { path: 'listing/:listingId', element: <ListingDetail /> },
          { path: 'trade/:listingId', element: <TradePreview /> },
        ],
      },
      {
        path: 'dao',
        children: [
          { index: true, element: <DAO /> },
          { path: 'proposals/:proposalId', element: <ProposalDetail /> },
          { path: 'voting-power', element: <VotingPower /> },
          { path: 'delegation', element: <Delegation /> },
        ],
      },
      {
        path: 'mint',
        children: [
          { index: true, element: <Mint /> },
          { path: 'proof/submit', element: <ProofSubmission /> },
        ],
      },
      {
        path: 'impact',
        children: [
          { index: true, element: <Impact /> },
        ],
      },
      { path: 'yield', element: <Yield /> },
      {
        path: 'agents',
        children: [
          { index: true, element: <AgentsHub /> },
          { path: 'my', element: <MyAgents /> },
          { path: 'intents', element: <AgentIntents /> },
        ],
      },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
