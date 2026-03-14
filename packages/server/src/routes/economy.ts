/**
 * Agent Economy Routes — comprehensive REST API for the NexusOS Agent Economy.
 *
 * Covers: Agent Registry, Skills Marketplace, Environmental Assets,
 * Receipts, RFQ/Negotiation, Trust, Disputes, Bots, Escrow, Balances.
 */
import { Router } from 'express';
import { store } from '../services/agentEconomyStore.js';
import { computeSkillCallFees, computeTradeFees } from '../services/feeEngine.js';
import { lockFunds, releaseFunds, refundFunds } from '../services/escrowEngine.js';
import { evaluatePolicy } from '../services/policyEngine.js';
import { executeSkill, isSkillRegistered } from '../services/skillRegistry.js';
import { recordAgentEvent, recomputeAgentReputation, mapTier } from '../services/reputationEngine.js';
import { runBot } from '../services/botEngine.js';

import type {
  EconAgent,
  EconQuote,
  EconPermit,
  EconExecution,
  EconReceipt,
  RFQ,
  Offer,
  NegotiationMessage,
  TradeIntent,
  RetirementIntent,
  AgentEvent,
  Dispute,
} from '@nexus/shared';

export const economyRouter = Router();

// ═══════════════════════════════════════════════════════════
// AGENT REGISTRY
// ═══════════════════════════════════════════════════════════

/** GET /economy/agents — List all agents */
economyRouter.get('/agents', (req, res) => {
  let result = store.agents;
  const { type, status, verification } = req.query;
  if (type) result = result.filter((a) => a.type === type);
  if (status) result = result.filter((a) => a.status === status);
  if (verification) result = result.filter((a) => a.verificationLevel === verification);
  res.json({ success: true, data: result, total: result.length });
});

/** GET /economy/agents/:id — Get agent by ID */
economyRouter.get('/agents/:id', (req, res) => {
  const agent = store.getAgent(req.params.id);
  if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });
  const reputation = store.getAgentReputation(agent.id);
  const policy = store.getAgentPolicyProfile(agent.id);
  const balances = store.getBalances(agent.id);
  res.json({ success: true, data: { agent, reputation, policy, balances } });
});

/** POST /economy/agents — Register a new agent */
economyRouter.post('/agents', (req, res) => {
  const { name, type, description, endpoints, pubkeys } = req.body;
  if (!name || !type) {
    return res.status(400).json({ success: false, error: 'name and type are required' });
  }

  const agent: EconAgent = {
    id: store.nextId('agent'),
    name,
    type: type || 'THIRD_PARTY',
    status: 'ACTIVE',
    verificationLevel: 'UNVERIFIED',
    description: description || '',
    endpoints: endpoints || {},
    pubkeys: pubkeys || {},
    reputationScore: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addAgent(agent);
  res.status(201).json({ success: true, data: agent });
});

/** PATCH /economy/agents/:id — Update agent */
economyRouter.patch('/agents/:id', (req, res) => {
  const agent = store.getAgent(req.params.id);
  if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });

  const allowed = ['name', 'description', 'endpoints', 'pubkeys', 'status', 'verificationLevel'] as const;
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      (agent as unknown as Record<string, unknown>)[key] = req.body[key];
    }
  }
  agent.updatedAt = new Date().toISOString();
  res.json({ success: true, data: agent });
});

// ═══════════════════════════════════════════════════════════
// SKILLS MARKETPLACE
// ═══════════════════════════════════════════════════════════

/** GET /economy/skills — List all skills */
economyRouter.get('/skills', (req, res) => {
  let result = store.skills.filter((s) => s.enabled);
  const { category, agentId } = req.query;
  if (category) result = result.filter((s) => s.category === category);
  if (agentId) result = result.filter((s) => s.agentId === agentId);

  // Enrich with listing info
  const enriched = result.map((s) => {
    const listing = store.skillListings.find((l) => l.skillId === s.id);
    const agent = store.getAgent(s.agentId);
    return { ...s, listing, agentName: agent?.name };
  });

  res.json({ success: true, data: enriched, total: enriched.length });
});

/** GET /economy/skills/:id — Get skill details */
economyRouter.get('/skills/:id', (req, res) => {
  const skill = store.getSkill(req.params.id);
  if (!skill) return res.status(404).json({ success: false, error: 'Skill not found' });
  const listing = store.skillListings.find((l) => l.skillId === skill.id);
  const agent = store.getAgent(skill.agentId);
  res.json({ success: true, data: { skill, listing, agent } });
});

/** POST /economy/skills — Register a new skill */
economyRouter.post('/skills', (req, res) => {
  const { agentId, slug, name, description, category, pricingModel, basePrice, meterUnit } = req.body;
  if (!agentId || !slug || !name || !category) {
    return res.status(400).json({ success: false, error: 'agentId, slug, name, and category are required' });
  }

  const agent = store.getAgent(agentId);
  if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });

  const skill = {
    id: store.nextId('skill'),
    agentId,
    slug,
    name,
    description: description || '',
    category,
    pricingModel: pricingModel || 'PER_CALL',
    basePrice: basePrice || 0,
    successFeeBps: req.body.successFeeBps || 0,
    meterUnit: meterUnit || 'EVENTS',
    enabled: true,
    policyTags: req.body.policyTags || {},
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.skills.push(skill);
  res.status(201).json({ success: true, data: skill });
});

/** POST /economy/skills/:id/quote — Get a price quote for calling a skill */
economyRouter.post('/skills/:id/quote', (req, res) => {
  const skill = store.getSkill(req.params.id);
  if (!skill) return res.status(404).json({ success: false, error: 'Skill not found' });

  const { callerAgentId, inputSummary, estimatedUnits } = req.body;
  if (!callerAgentId) {
    return res.status(400).json({ success: false, error: 'callerAgentId is required' });
  }

  const feeConfig = store.getFeeConfig();
  const agent = store.getAgent(skill.agentId);
  const fees = computeSkillCallFees({
    basePrice: skill.basePrice,
    unitsUsed: estimatedUnits || 1,
    estimatedUnits: estimatedUnits || 1,
    pricingModel: skill.pricingModel,
    sellerType: agent?.type || 'THIRD_PARTY',
    feeConfig,
    successFeeBps: skill.successFeeBps,
  });

  const quote: EconQuote = {
    id: store.nextId('quote'),
    callerAgentId,
    skillId: skill.id,
    inputSummary: inputSummary || {},
    estimatedUnits: estimatedUnits || 1,
    estimatedCost: fees.totalCost,
    currency: 'RLUSD',
    expiresAt: new Date(Date.now() + 300_000).toISOString(), // 5 minutes
    createdAt: new Date().toISOString(),
  };

  store.addQuote(quote);
  res.status(201).json({ success: true, data: { quote, feeBreakdown: fees } });
});

/** POST /economy/skills/:id/permit — Issue a permit to execute a skill */
economyRouter.post('/skills/:id/permit', (req, res) => {
  const skill = store.getSkill(req.params.id);
  if (!skill) return res.status(404).json({ success: false, error: 'Skill not found' });

  const { callerAgentId, quoteId, paymentMode } = req.body;
  if (!callerAgentId || !quoteId) {
    return res.status(400).json({ success: false, error: 'callerAgentId and quoteId are required' });
  }

  const quote = store.getQuote(quoteId);
  if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });

  // Policy check
  const policyDecision = evaluatePolicy({
    callerAgentId,
    counterpartyAgentId: skill.agentId,
    skillPolicyTags: skill.policyTags,
  });

  if (!policyDecision.allowed) {
    return res.status(403).json({ success: false, error: 'Policy check failed', details: policyDecision });
  }

  const permit: EconPermit = {
    id: store.nextId('permit'),
    callerAgentId,
    skillId: skill.id,
    quoteId,
    expiresAt: new Date(Date.now() + 600_000).toISOString(), // 10 minutes
    maxUnits: quote.estimatedUnits * 2,
    maxCost: quote.estimatedCost * 1.5,
    paymentMode: paymentMode || 'PREPAID',
    status: 'ISSUED',
    signature: `sig:permit_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  store.addPermit(permit);

  // If escrow mode, lock funds
  if (permit.paymentMode === 'ESCROW') {
    const lockResult = lockFunds({
      rfqId: '',
      payerAgentId: callerAgentId,
      payeeAgentId: skill.agentId,
      asset: 'RLUSD',
      amount: permit.maxCost,
      releaseCondition: 'EXECUTION_SUCCESS',
    });

    if (!lockResult.success) {
      permit.status = 'CANCELLED';
      return res.status(402).json({ success: false, error: lockResult.error });
    }
  }

  res.status(201).json({ success: true, data: { permit, policyDecision } });
});

/** POST /economy/executions — Execute a skill (validate permit, run skill, settle, create receipt) */
economyRouter.post('/executions', (req, res) => {
  const { permitId, input } = req.body;
  if (!permitId) {
    return res.status(400).json({ success: false, error: 'permitId is required' });
  }

  const permit = store.getPermit(permitId);
  if (!permit) return res.status(404).json({ success: false, error: 'Permit not found' });
  if (permit.status !== 'ISSUED') {
    return res.status(400).json({ success: false, error: `Permit is ${permit.status}, expected ISSUED` });
  }

  const skill = store.getSkill(permit.skillId);
  if (!skill) return res.status(404).json({ success: false, error: 'Skill not found' });

  const now = new Date().toISOString();

  // Create execution record
  const execution: EconExecution = {
    id: store.nextId('exec'),
    permitId,
    callerAgentId: permit.callerAgentId,
    sellerAgentId: skill.agentId,
    skillId: skill.id,
    status: 'RUNNING',
    unitsUsed: 0,
    costFinal: 0,
    resultRef: '',
    startedAt: now,
  };

  // Execute the skill (mock)
  let skillResult;
  if (isSkillRegistered(skill.slug)) {
    skillResult = executeSkill(skill.slug, input || {});
  } else {
    // Generic mock for unregistered skills
    skillResult = {
      success: true,
      data: { result: 'Skill executed successfully', input },
      metricsUsed: 1,
      latencyMs: 200,
    };
  }

  if (!skillResult.success) {
    execution.status = 'FAILED';
    execution.finishedAt = new Date().toISOString();
    store.addExecution(execution);

    // Record failure event
    recordAgentEvent({
      id: store.nextId('evt'),
      agentId: skill.agentId,
      type: 'EXECUTION_FAILED',
      severity: 'MEDIUM',
      subject: { executionId: execution.id, skillSlug: skill.slug },
      metrics: { latencyMs: skillResult.latencyMs },
      createdAt: new Date().toISOString(),
    });

    return res.status(500).json({ success: false, error: 'Skill execution failed', data: skillResult.data });
  }

  // Compute fees
  const feeConfig = store.getFeeConfig();
  const sellerAgent = store.getAgent(skill.agentId);
  const fees = computeSkillCallFees({
    basePrice: skill.basePrice,
    unitsUsed: skillResult.metricsUsed,
    estimatedUnits: permit.maxUnits,
    pricingModel: skill.pricingModel,
    sellerType: sellerAgent?.type || 'THIRD_PARTY',
    feeConfig,
    successFeeBps: skill.successFeeBps,
  });

  // Finalize execution
  execution.status = 'SUCCEEDED';
  execution.unitsUsed = skillResult.metricsUsed;
  execution.costFinal = fees.totalCost;
  execution.resultRef = `ipfs://QmExec_${execution.id}`;
  execution.finishedAt = new Date().toISOString();

  // Redeem permit
  permit.status = 'REDEEMED';

  // Settle fees: deduct from caller, credit to seller and platform
  store.updateBalance(permit.callerAgentId, 'RLUSD', -fees.totalCost);
  store.updateBalance(skill.agentId, 'RLUSD', fees.sellerPayout);
  store.updateBalance('agent_001', 'RLUSD', fees.platformFee + fees.receiptFee);

  // Create receipt
  const callerRep = store.getAgentReputation(permit.callerAgentId);
  const sellerRep = store.getAgentReputation(skill.agentId);

  const receipt: EconReceipt = {
    id: store.nextId('receipt'),
    type: 'SKILL_CALL',
    subject: {
      executionId: execution.id,
      skillSlug: skill.slug,
      skillName: skill.name,
      callerAgentId: permit.callerAgentId,
      sellerAgentId: skill.agentId,
    },
    proofs: { ipfsRef: execution.resultRef, resultData: skillResult.data },
    policy: skill.policyTags,
    financials: {
      totalCost: fees.totalCost,
      platformFee: fees.platformFee,
      sellerPayout: fees.sellerPayout,
      receiptFee: fees.receiptFee,
      settlementFee: 0,
      currency: 'RLUSD',
      splits: [
        { label: 'Platform', amount: fees.platformFee, bps: feeConfig.platformTakeRateBps },
        { label: 'Seller', amount: fees.sellerPayout, bps: Math.round((fees.sellerPayout / fees.totalCost) * 10000) },
        { label: 'Receipt', amount: fees.receiptFee, bps: Math.round((fees.receiptFee / fees.totalCost) * 10000) },
      ],
    },
    signatures: { nexus: `sig:nexus_${execution.id}`, caller: `sig:caller_${execution.id}` },
    trustContext: {
      callerTier: callerRep?.riskTier || 'C',
      counterpartyTier: sellerRep?.riskTier || 'C',
      trustScoreAtTime: sellerRep?.trustScore || 50,
      reasonSummary: `Skill execution: ${skill.name}`,
    },
    createdAt: new Date().toISOString(),
  };

  store.addExecution(execution);
  store.addReceipt(receipt);

  // Record success event
  recordAgentEvent({
    id: store.nextId('evt'),
    agentId: skill.agentId,
    type: 'EXECUTION_SUCCEEDED',
    severity: 'LOW',
    subject: { executionId: execution.id, skillSlug: skill.slug },
    metrics: { latencyMs: skillResult.latencyMs, unitsUsed: skillResult.metricsUsed },
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: { execution, receipt, skillResult: skillResult.data, feeBreakdown: fees },
  });
});

// ═══════════════════════════════════════════════════════════
// ENVIRONMENTAL ASSETS
// ═══════════════════════════════════════════════════════════

/** GET /economy/assets — List all environmental assets */
economyRouter.get('/assets', (_req, res) => {
  res.json({ success: true, data: store.envAssets, total: store.envAssets.length });
});

/** GET /economy/assets/:id — Get asset details */
economyRouter.get('/assets/:id', (req, res) => {
  const asset = store.envAssets.find((a) => a.id === req.params.id);
  if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });
  res.json({ success: true, data: asset });
});

/** POST /economy/trades/quote — Get a trade quote */
economyRouter.post('/trades/quote', (req, res) => {
  const { callerAgentId, fromAssetId, toAssetId, amountIn, slippageBps, routePreference } = req.body;
  if (!callerAgentId || !fromAssetId || !toAssetId || !amountIn) {
    return res.status(400).json({ success: false, error: 'callerAgentId, fromAssetId, toAssetId, and amountIn are required' });
  }

  const fromAsset = store.envAssets.find((a) => a.id === fromAssetId);
  const toAsset = store.envAssets.find((a) => a.id === toAssetId);
  if (!fromAsset || !toAsset) {
    return res.status(404).json({ success: false, error: 'Asset not found' });
  }

  // Use best execution router mock if available
  const routeResult = executeSkill('best-execution-router-v1', {
    fromAsset: fromAsset.symbol,
    toAsset: toAsset.symbol,
    amountIn,
    slippageBps: slippageBps || 100,
  });

  const feeConfig = store.getFeeConfig();
  const fees = computeTradeFees({ amountIn, feeConfig });

  const trade: TradeIntent = {
    id: store.nextId('trade'),
    callerAgentId,
    fromAssetId,
    toAssetId,
    amountIn,
    slippageBps: slippageBps || 100,
    routePreference: routePreference || 'BEST',
    status: 'QUOTED',
    quote: routeResult.data,
    txRefs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addTradeIntent(trade);

  res.status(201).json({
    success: true,
    data: { trade, feeBreakdown: fees, routeDetails: routeResult.data },
  });
});

/** POST /economy/trades/submit — Submit a quoted trade for execution */
economyRouter.post('/trades/submit', (req, res) => {
  const { tradeIntentId } = req.body;
  if (!tradeIntentId) {
    return res.status(400).json({ success: false, error: 'tradeIntentId is required' });
  }

  const trade = store.getTradeIntent(tradeIntentId);
  if (!trade) return res.status(404).json({ success: false, error: 'Trade intent not found' });
  if (trade.status !== 'QUOTED') {
    return res.status(400).json({ success: false, error: `Trade is ${trade.status}, expected QUOTED` });
  }

  // Policy check
  const toAsset = store.envAssets.find((a) => a.id === trade.toAssetId);
  const policyDecision = evaluatePolicy({
    callerAgentId: trade.callerAgentId,
    transferPolicy: toAsset?.transferPolicy,
  });

  if (!policyDecision.allowed) {
    return res.status(403).json({ success: false, error: 'Policy check failed', details: policyDecision });
  }

  // Compute fees
  const feeConfig = store.getFeeConfig();
  const fees = computeTradeFees({ amountIn: trade.amountIn, feeConfig });

  // Settle: deduct fees and simulate trade fill
  store.updateBalance(trade.callerAgentId, 'RLUSD', -(trade.amountIn + fees.totalFees));

  const bestRoute = (trade.quote as Record<string, unknown>).bestRoute as Record<string, unknown> | undefined;
  const estimatedOut = (bestRoute?.estimatedOut as number) || Math.floor(trade.amountIn / 0.88);
  store.updateBalance(trade.callerAgentId, toAsset?.symbol || 'WTR', estimatedOut);

  // Platform gets fees
  store.updateBalance('agent_001', 'RLUSD', fees.totalFees);

  // Update trade
  trade.status = 'FILLED';
  trade.txRefs = [`0xtrade_${trade.id}`];
  trade.updatedAt = new Date().toISOString();

  // Create receipt
  const receipt: EconReceipt = {
    id: store.nextId('receipt'),
    type: 'TRADE',
    subject: {
      tradeIntentId: trade.id,
      fromAsset: store.envAssets.find((a) => a.id === trade.fromAssetId)?.symbol,
      toAsset: toAsset?.symbol,
      amountIn: trade.amountIn,
      amountOut: estimatedOut,
    },
    proofs: { txHash: trade.txRefs[0] },
    policy: { transferPolicy: toAsset?.transferPolicy },
    financials: {
      totalCost: trade.amountIn,
      platformFee: 0,
      sellerPayout: 0,
      receiptFee: fees.receiptFee,
      settlementFee: fees.settlementFee,
      currency: 'RLUSD',
      splits: [
        { label: 'Settlement', amount: fees.settlementFee, bps: feeConfig.settlementFeeBps },
        { label: 'Receipt', amount: fees.receiptFee, bps: Math.round((fees.receiptFee / trade.amountIn) * 10000) },
      ],
    },
    signatures: { nexus: `sig:nexus_trade_${trade.id}` },
    createdAt: new Date().toISOString(),
  };

  store.addReceipt(receipt);

  // Record event
  recordAgentEvent({
    id: store.nextId('evt'),
    agentId: trade.callerAgentId,
    type: 'TRADE_FILLED',
    severity: 'LOW',
    subject: { tradeIntentId: trade.id },
    metrics: { amountIn: trade.amountIn, amountOut: estimatedOut },
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, data: { trade, receipt, feeBreakdown: fees } });
});

/** POST /economy/redeem — Redeem environmental asset credits */
economyRouter.post('/redeem', (req, res) => {
  const { callerAgentId, assetId, amount, program } = req.body;
  if (!callerAgentId || !assetId || !amount) {
    return res.status(400).json({ success: false, error: 'callerAgentId, assetId, and amount are required' });
  }

  const asset = store.envAssets.find((a) => a.id === assetId);
  if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });

  // Deduct from balance
  const balance = store.getBalance(callerAgentId, asset.symbol);
  if (!balance || balance.available < amount) {
    return res.status(402).json({ success: false, error: 'Insufficient balance' });
  }

  store.updateBalance(callerAgentId, asset.symbol, -amount);

  const feeConfig = store.getFeeConfig();

  const receipt: EconReceipt = {
    id: store.nextId('receipt'),
    type: 'REDEEM',
    subject: { asset: asset.symbol, amount, redeemer: callerAgentId, program: program || 'General' },
    proofs: { txHash: `0xredeem_${Date.now()}`, burnTx: `0xburn_${Date.now()}` },
    policy: { transferPolicy: asset.transferPolicy },
    financials: {
      totalCost: 0,
      platformFee: 0,
      sellerPayout: 0,
      receiptFee: feeConfig.receiptFlatFee,
      settlementFee: 0,
      currency: 'RLUSD',
      splits: [{ label: 'Receipt', amount: feeConfig.receiptFlatFee, bps: 0 }],
    },
    signatures: { nexus: `sig:nexus_redeem_${Date.now()}` },
    createdAt: new Date().toISOString(),
  };

  store.addReceipt(receipt);
  store.updateBalance(callerAgentId, 'RLUSD', -feeConfig.receiptFlatFee);
  store.updateBalance('agent_001', 'RLUSD', feeConfig.receiptFlatFee);

  res.status(201).json({ success: true, data: { receipt, redeemedAmount: amount, asset: asset.symbol } });
});

/** POST /economy/retire — Retire environmental credits */
economyRouter.post('/retire', (req, res) => {
  const { callerAgentId, assetId, amount, beneficiary } = req.body;
  if (!callerAgentId || !assetId || !amount || !beneficiary) {
    return res.status(400).json({ success: false, error: 'callerAgentId, assetId, amount, and beneficiary are required' });
  }

  const asset = store.envAssets.find((a) => a.id === assetId);
  if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });

  const balance = store.getBalance(callerAgentId, asset.symbol);
  if (!balance || balance.available < amount) {
    return res.status(402).json({ success: false, error: 'Insufficient balance' });
  }

  store.updateBalance(callerAgentId, asset.symbol, -amount);

  const retirement: RetirementIntent = {
    id: store.nextId('retire'),
    callerAgentId,
    assetId,
    amount,
    beneficiary,
    status: 'COMPLETED',
    proofs: {
      txHash: `0xretire_${Date.now()}`,
      burnTx: `0xburn_${Date.now()}`,
      certificate: `ipfs://QmRetireCert_${Date.now()}`,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addRetirementIntent(retirement);

  const feeConfig = store.getFeeConfig();

  const receipt: EconReceipt = {
    id: store.nextId('receipt'),
    type: 'RETIRE',
    subject: {
      retirementId: retirement.id,
      asset: asset.symbol,
      amount,
      beneficiary: beneficiary.name,
    },
    proofs: retirement.proofs,
    policy: { transferPolicy: 'NON_TRANSFERABLE' },
    financials: {
      totalCost: 0,
      platformFee: 0,
      sellerPayout: 0,
      receiptFee: feeConfig.receiptFlatFee,
      settlementFee: 0,
      currency: 'RLUSD',
      splits: [{ label: 'Receipt', amount: feeConfig.receiptFlatFee, bps: 0 }],
    },
    signatures: { nexus: `sig:nexus_retire_${retirement.id}` },
    createdAt: new Date().toISOString(),
  };

  store.addReceipt(receipt);
  store.updateBalance(callerAgentId, 'RLUSD', -feeConfig.receiptFlatFee);
  store.updateBalance('agent_001', 'RLUSD', feeConfig.receiptFlatFee);

  res.status(201).json({ success: true, data: { retirement, receipt } });
});

// ═══════════════════════════════════════════════════════════
// RECEIPTS
// ═══════════════════════════════════════════════════════════

/** GET /economy/receipts — List receipts */
economyRouter.get('/receipts', (req, res) => {
  let result = store.receipts;
  const { type } = req.query;
  if (type) result = result.filter((r) => r.type === type);

  // Support pagination
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const paged = result.slice(offset, offset + limit);

  res.json({ success: true, data: paged, total: result.length, limit, offset });
});

/** GET /economy/receipts/:id — Get receipt by ID */
economyRouter.get('/receipts/:id', (req, res) => {
  const receipt = store.getReceipt(req.params.id);
  if (!receipt) return res.status(404).json({ success: false, error: 'Receipt not found' });
  res.json({ success: true, data: receipt });
});

// ═══════════════════════════════════════════════════════════
// RFQ / NEGOTIATION
// ═══════════════════════════════════════════════════════════

/** POST /economy/rfq — Create a new RFQ */
economyRouter.post('/rfq', (req, res) => {
  const { requesterAgentId, targetAgentId, category, subject, expiresInMs } = req.body;
  if (!requesterAgentId || !category || !subject) {
    return res.status(400).json({ success: false, error: 'requesterAgentId, category, and subject are required' });
  }

  const rfq: RFQ = {
    id: store.nextId('rfq'),
    requesterAgentId,
    targetAgentId,
    category,
    subject,
    status: 'OPEN',
    expiresAt: new Date(Date.now() + (expiresInMs || 86400_000)).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addRFQ(rfq);

  // Add initial negotiation message
  const msg: NegotiationMessage = {
    id: store.nextId('nmsg'),
    rfqId: rfq.id,
    senderAgentId: requesterAgentId,
    type: 'MESSAGE',
    payload: { text: `RFQ created: ${JSON.stringify(subject)}` },
    createdAt: new Date().toISOString(),
  };
  store.addNegotiationMessage(msg);

  res.status(201).json({ success: true, data: { rfq, message: msg } });
});

/** GET /economy/rfq — List RFQs */
economyRouter.get('/rfq', (req, res) => {
  let result = store.rfqs;
  const { status, category, requesterAgentId } = req.query;
  if (status) result = result.filter((r) => r.status === status);
  if (category) result = result.filter((r) => r.category === category);
  if (requesterAgentId) result = result.filter((r) => r.requesterAgentId === requesterAgentId);
  res.json({ success: true, data: result, total: result.length });
});

/** GET /economy/rfq/:id — Get RFQ details with messages and offers */
economyRouter.get('/rfq/:id', (req, res) => {
  const rfq = store.getRFQ(req.params.id);
  if (!rfq) return res.status(404).json({ success: false, error: 'RFQ not found' });
  const messages = store.getMessagesForRFQ(rfq.id);
  const offers = store.getOffersForRFQ(rfq.id);
  res.json({ success: true, data: { rfq, messages, offers } });
});

/** POST /economy/rfq/:id/offer — Submit an offer for an RFQ */
economyRouter.post('/rfq/:id/offer', (req, res) => {
  const rfq = store.getRFQ(req.params.id);
  if (!rfq) return res.status(404).json({ success: false, error: 'RFQ not found' });
  if (rfq.status === 'ACCEPTED' || rfq.status === 'REJECTED' || rfq.status === 'EXPIRED') {
    return res.status(400).json({ success: false, error: `RFQ is ${rfq.status}, cannot accept new offers` });
  }

  const { senderAgentId, terms } = req.body;
  if (!senderAgentId || !terms) {
    return res.status(400).json({ success: false, error: 'senderAgentId and terms are required' });
  }

  const offer: Offer = {
    id: store.nextId('offer'),
    rfqId: rfq.id,
    senderAgentId,
    terms,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  store.addOffer(offer);

  // Update RFQ status to NEGOTIATING if it was OPEN
  if (rfq.status === 'OPEN') {
    rfq.status = 'NEGOTIATING';
    rfq.updatedAt = new Date().toISOString();
  }

  // Add negotiation message
  const msg: NegotiationMessage = {
    id: store.nextId('nmsg'),
    rfqId: rfq.id,
    senderAgentId,
    type: 'OFFER',
    payload: { offerId: offer.id, terms },
    createdAt: new Date().toISOString(),
  };
  store.addNegotiationMessage(msg);

  res.status(201).json({ success: true, data: { offer, message: msg } });
});

/** POST /economy/offer/:id/counter — Counter an offer */
economyRouter.post('/offer/:id/counter', (req, res) => {
  const offer = store.getOffer(req.params.id);
  if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
  if (offer.status !== 'PENDING') {
    return res.status(400).json({ success: false, error: `Offer is ${offer.status}, cannot counter` });
  }

  const { senderAgentId, counterTerms } = req.body;
  if (!senderAgentId || !counterTerms) {
    return res.status(400).json({ success: false, error: 'senderAgentId and counterTerms are required' });
  }

  // Mark original offer as countered
  offer.status = 'COUNTERED';

  // Create new counter-offer
  const counterOffer: Offer = {
    id: store.nextId('offer'),
    rfqId: offer.rfqId,
    senderAgentId,
    terms: counterTerms,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  store.addOffer(counterOffer);

  // Add negotiation message
  const msg: NegotiationMessage = {
    id: store.nextId('nmsg'),
    rfqId: offer.rfqId,
    senderAgentId,
    type: 'OFFER',
    payload: { offerId: counterOffer.id, counterToOfferId: offer.id, terms: counterTerms },
    createdAt: new Date().toISOString(),
  };
  store.addNegotiationMessage(msg);

  const rfq = store.getRFQ(offer.rfqId);
  if (rfq) rfq.updatedAt = new Date().toISOString();

  res.status(201).json({ success: true, data: { originalOffer: offer, counterOffer, message: msg } });
});

/** POST /economy/offer/:id/accept — Accept an offer */
economyRouter.post('/offer/:id/accept', (req, res) => {
  const offer = store.getOffer(req.params.id);
  if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
  if (offer.status !== 'PENDING') {
    return res.status(400).json({ success: false, error: `Offer is ${offer.status}, cannot accept` });
  }

  offer.status = 'ACCEPTED';

  // Update RFQ status
  const rfq = store.getRFQ(offer.rfqId);
  if (rfq) {
    rfq.status = 'ACCEPTED';
    rfq.updatedAt = new Date().toISOString();
  }

  // Reject all other pending offers for this RFQ
  const otherOffers = store.getOffersForRFQ(offer.rfqId);
  for (const o of otherOffers) {
    if (o.id !== offer.id && o.status === 'PENDING') {
      o.status = 'REJECTED';
    }
  }

  // Create negotiation receipt
  const feeConfig = store.getFeeConfig();
  const totalValue = offer.terms.price * offer.terms.units;
  const platformFee = Math.round((totalValue * feeConfig.platformTakeRateBps) / 10000 * 100) / 100;

  const receipt: EconReceipt = {
    id: store.nextId('receipt'),
    type: 'NEGOTIATION',
    subject: {
      rfqId: offer.rfqId,
      offerId: offer.id,
      agreedPrice: offer.terms.price,
      agreedUnits: offer.terms.units,
      settlementType: offer.terms.settlementType,
    },
    proofs: { signatureChain: [`sig:${offer.senderAgentId}`, `sig:${rfq?.requesterAgentId}`] },
    policy: {},
    financials: {
      totalCost: totalValue,
      platformFee,
      sellerPayout: Math.round((totalValue - platformFee - feeConfig.receiptFlatFee) * 100) / 100,
      receiptFee: feeConfig.receiptFlatFee,
      settlementFee: 0,
      currency: offer.terms.currency || 'RLUSD',
      splits: [
        { label: 'Platform', amount: platformFee, bps: feeConfig.platformTakeRateBps },
        { label: 'Seller', amount: Math.round((totalValue - platformFee - feeConfig.receiptFlatFee) * 100) / 100, bps: 10000 - feeConfig.platformTakeRateBps },
        { label: 'Receipt', amount: feeConfig.receiptFlatFee, bps: 0 },
      ],
    },
    signatures: { nexus: `sig:nexus_nego_${offer.id}` },
    createdAt: new Date().toISOString(),
  };

  store.addReceipt(receipt);

  // Record event
  recordAgentEvent({
    id: store.nextId('evt'),
    agentId: offer.senderAgentId,
    type: 'OFFER_ACCEPTED',
    severity: 'LOW',
    subject: { offerId: offer.id, rfqId: offer.rfqId },
    metrics: { agreedPrice: offer.terms.price, units: offer.terms.units },
    createdAt: new Date().toISOString(),
  });

  // Add negotiation message
  const msg: NegotiationMessage = {
    id: store.nextId('nmsg'),
    rfqId: offer.rfqId,
    senderAgentId: rfq?.requesterAgentId || 'unknown',
    type: 'MESSAGE',
    payload: { text: `Offer ${offer.id} accepted.`, offerId: offer.id },
    createdAt: new Date().toISOString(),
  };
  store.addNegotiationMessage(msg);

  res.json({ success: true, data: { offer, receipt, rfq } });
});

/** POST /economy/offer/:id/reject — Reject an offer */
economyRouter.post('/offer/:id/reject', (req, res) => {
  const offer = store.getOffer(req.params.id);
  if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
  if (offer.status !== 'PENDING') {
    return res.status(400).json({ success: false, error: `Offer is ${offer.status}, cannot reject` });
  }

  offer.status = 'REJECTED';

  // Record event
  recordAgentEvent({
    id: store.nextId('evt'),
    agentId: offer.senderAgentId,
    type: 'OFFER_REJECTED',
    severity: 'LOW',
    subject: { offerId: offer.id, rfqId: offer.rfqId },
    metrics: { reason: req.body.reason || 'No reason provided' },
    createdAt: new Date().toISOString(),
  });

  // Add negotiation message
  const msg: NegotiationMessage = {
    id: store.nextId('nmsg'),
    rfqId: offer.rfqId,
    senderAgentId: req.body.senderAgentId || 'unknown',
    type: 'MESSAGE',
    payload: { text: `Offer ${offer.id} rejected. Reason: ${req.body.reason || 'N/A'}` },
    createdAt: new Date().toISOString(),
  };
  store.addNegotiationMessage(msg);

  const rfq = store.getRFQ(offer.rfqId);
  if (rfq) rfq.updatedAt = new Date().toISOString();

  res.json({ success: true, data: { offer } });
});

// ═══════════════════════════════════════════════════════════
// TRUST / REPUTATION
// ═══════════════════════════════════════════════════════════

/** GET /economy/trust/agents — List all agent reputations */
economyRouter.get('/trust/agents', (req, res) => {
  let result = store.agentReputations;
  const { riskTier, minScore } = req.query;
  if (riskTier) result = result.filter((r) => r.riskTier === riskTier);
  if (minScore) result = result.filter((r) => r.trustScore >= Number(minScore));

  // Enrich with agent name
  const enriched = result.map((r) => {
    const agent = store.getAgent(r.agentId);
    return { ...r, agentName: agent?.name, agentType: agent?.type };
  });

  res.json({ success: true, data: enriched, total: enriched.length });
});

/** GET /economy/trust/agents/:id — Get reputation for a specific agent */
economyRouter.get('/trust/agents/:id', (req, res) => {
  const rep = store.getAgentReputation(req.params.id);
  if (!rep) return res.status(404).json({ success: false, error: 'Agent reputation not found' });
  const agent = store.getAgent(req.params.id);
  const events = store.getEventsForAgent(req.params.id).slice(-20);
  res.json({ success: true, data: { reputation: rep, agent, recentEvents: events } });
});

/** GET /economy/trust/events — List recent agent events */
economyRouter.get('/trust/events', (req, res) => {
  let result = store.agentEvents;
  const { agentId, type, severity } = req.query;
  if (agentId) result = result.filter((e) => e.agentId === agentId);
  if (type) result = result.filter((e) => e.type === type);
  if (severity) result = result.filter((e) => e.severity === severity);

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const paged = result.slice(offset, offset + limit);

  res.json({ success: true, data: paged, total: result.length, limit, offset });
});

/** POST /economy/trust/recompute — Recompute trust scores for all or specific agents */
economyRouter.post('/trust/recompute', (req, res) => {
  const { agentId } = req.body;
  const results: Array<{ agentId: string; trustScore: number; riskTier: string }> = [];

  if (agentId) {
    const rep = recomputeAgentReputation(agentId);
    if (rep) results.push({ agentId: rep.agentId, trustScore: rep.trustScore, riskTier: rep.riskTier });
  } else {
    // Recompute all
    for (const agent of store.agents) {
      const rep = recomputeAgentReputation(agent.id);
      if (rep) results.push({ agentId: rep.agentId, trustScore: rep.trustScore, riskTier: rep.riskTier });
    }
  }

  res.json({ success: true, data: { recomputed: results.length, results } });
});

// ═══════════════════════════════════════════════════════════
// DISPUTES
// ═══════════════════════════════════════════════════════════

/** POST /economy/disputes — Open a new dispute */
economyRouter.post('/disputes', (req, res) => {
  const { openedByAgentId, againstAgentId, reason, evidence, rfqId, executionId, tradeIntentId } = req.body;
  if (!openedByAgentId || !againstAgentId || !reason) {
    return res.status(400).json({ success: false, error: 'openedByAgentId, againstAgentId, and reason are required' });
  }

  const dispute: Dispute = {
    id: store.nextId('dispute'),
    rfqId,
    executionId,
    tradeIntentId,
    openedByAgentId,
    againstAgentId,
    reason,
    evidence: evidence || { receiptIds: [], logs: [] },
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  store.addDispute(dispute);

  // Record event
  recordAgentEvent({
    id: store.nextId('evt'),
    agentId: againstAgentId,
    type: 'DISPUTE_OPENED',
    severity: 'MEDIUM',
    subject: { disputeId: dispute.id, openedBy: openedByAgentId },
    metrics: {},
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, data: dispute });
});

/** GET /economy/disputes — List disputes */
economyRouter.get('/disputes', (req, res) => {
  let result = store.disputes;
  const { status, agentId } = req.query;
  if (status) result = result.filter((d) => d.status === status);
  if (agentId) result = result.filter((d) => d.openedByAgentId === agentId || d.againstAgentId === agentId);
  res.json({ success: true, data: result, total: result.length });
});

/** GET /economy/disputes/:id — Get dispute by ID */
economyRouter.get('/disputes/:id', (req, res) => {
  const dispute = store.getDispute(req.params.id);
  if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });
  res.json({ success: true, data: dispute });
});

/** POST /economy/disputes/:id/resolve — Resolve a dispute */
economyRouter.post('/disputes/:id/resolve', (req, res) => {
  const dispute = store.getDispute(req.params.id);
  if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });
  if (dispute.status === 'RESOLVED' || dispute.status === 'REJECTED') {
    return res.status(400).json({ success: false, error: `Dispute is already ${dispute.status}` });
  }

  const { resolution } = req.body;
  if (!resolution) {
    return res.status(400).json({ success: false, error: 'resolution object is required' });
  }

  dispute.status = 'RESOLVED';
  dispute.resolution = resolution;
  dispute.resolvedAt = new Date().toISOString();

  // Record event
  recordAgentEvent({
    id: store.nextId('evt'),
    agentId: dispute.againstAgentId,
    type: 'DISPUTE_RESOLVED',
    severity: 'LOW',
    subject: { disputeId: dispute.id },
    metrics: { refundAmount: resolution.refundAmount, penaltyBps: resolution.penaltyBps },
    createdAt: new Date().toISOString(),
  });

  // If refund, credit opener
  if (resolution.refundAmount > 0) {
    store.updateBalance(dispute.openedByAgentId, 'RLUSD', resolution.refundAmount);
    store.updateBalance(dispute.againstAgentId, 'RLUSD', -resolution.refundAmount);
  }

  res.json({ success: true, data: dispute });
});

// ═══════════════════════════════════════════════════════════
// BOTS
// ═══════════════════════════════════════════════════════════

/** GET /economy/bots — List all bots */
economyRouter.get('/bots', (_req, res) => {
  const enriched = store.autonomousBots.map((b) => {
    const runs = store.getRunsForBot(b.id);
    const signals = store.getSignalsForBot(b.id);
    return {
      ...b,
      totalRuns: runs.length,
      totalSignals: signals.length,
      lastRunStatus: runs.length > 0 ? runs[runs.length - 1].status : null,
    };
  });
  res.json({ success: true, data: enriched, total: enriched.length });
});

/** POST /economy/bots/:id/pause — Pause a bot */
economyRouter.post('/bots/:id/pause', (req, res) => {
  const bot = store.getBot(req.params.id);
  if (!bot) return res.status(404).json({ success: false, error: 'Bot not found' });
  bot.status = 'PAUSED';
  bot.updatedAt = new Date().toISOString();
  res.json({ success: true, data: bot });
});

/** POST /economy/bots/:id/resume — Resume a bot */
economyRouter.post('/bots/:id/resume', (req, res) => {
  const bot = store.getBot(req.params.id);
  if (!bot) return res.status(404).json({ success: false, error: 'Bot not found' });
  bot.status = 'ACTIVE';
  bot.updatedAt = new Date().toISOString();
  res.json({ success: true, data: bot });
});

/** GET /economy/bots/:id/signals — Get signals for a bot */
economyRouter.get('/bots/:id/signals', (req, res) => {
  const bot = store.getBot(req.params.id);
  if (!bot) return res.status(404).json({ success: false, error: 'Bot not found' });
  const signals = store.getSignalsForBot(bot.id);
  res.json({ success: true, data: signals, total: signals.length });
});

/** POST /economy/bots/:id/run — Trigger a bot run */
economyRouter.post('/bots/:id/run', (req, res) => {
  const bot = store.getBot(req.params.id);
  if (!bot) return res.status(404).json({ success: false, error: 'Bot not found' });

  const result = runBot(bot.id);
  res.status(201).json({
    success: true,
    data: {
      run: result.run,
      signals: result.signals,
      signalCount: result.signals.length,
    },
  });
});

// ═══════════════════════════════════════════════════════════
// ESCROW
// ═══════════════════════════════════════════════════════════

/** GET /economy/escrows — List all escrows */
economyRouter.get('/escrows', (req, res) => {
  let result = store.escrows;
  const { status, payerAgentId } = req.query;
  if (status) result = result.filter((e) => e.status === status);
  if (payerAgentId) result = result.filter((e) => e.payerAgentId === payerAgentId);
  res.json({ success: true, data: result, total: result.length });
});

// ═══════════════════════════════════════════════════════════
// BALANCES
// ═══════════════════════════════════════════════════════════

/** GET /economy/balances/:ownerId — Get all balances for an owner */
economyRouter.get('/balances/:ownerId', (req, res) => {
  const balances = store.getBalances(req.params.ownerId);
  if (balances.length === 0) {
    return res.status(404).json({ success: false, error: 'No balances found for this owner' });
  }

  const totalValueRLUSD = balances.reduce((sum, b) => {
    // Approximate value in RLUSD
    const rates: Record<string, number> = { RLUSD: 1, XRP: 0.55, NXS: 0.12, WTR: 0.88, ENG: 0.35 };
    return sum + b.available * (rates[b.asset] || 0);
  }, 0);

  res.json({
    success: true,
    data: {
      ownerId: req.params.ownerId,
      balances,
      totalValueRLUSD: Math.round(totalValueRLUSD * 100) / 100,
    },
  });
});
