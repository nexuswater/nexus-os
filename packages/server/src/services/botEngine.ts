/**
 * Bot Engine — simple implementations for Liquidity Router, Negotiation Assist, and Risk Sentinel bots.
 */
import type { BotRun, BotSignal } from '@nexus/shared';
import { store } from './agentEconomyStore.js';

export interface BotRunResult {
  run: BotRun;
  signals: BotSignal[];
}

/**
 * Run a bot by its ID. Dispatches to the correct bot implementation.
 */
export function runBot(botId: string): BotRunResult {
  const bot = store.getBot(botId);
  if (!bot) {
    const failedRun: BotRun = {
      id: store.nextId('botrun'),
      botId,
      status: 'FAILED',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      metrics: { error: `Bot ${botId} not found` },
    };
    return { run: failedRun, signals: [] };
  }

  if (bot.status === 'PAUSED') {
    const pausedRun: BotRun = {
      id: store.nextId('botrun'),
      botId,
      status: 'FAILED',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      metrics: { error: `Bot ${bot.name} is currently paused` },
    };
    store.addBotRun(pausedRun);
    return { run: pausedRun, signals: [] };
  }

  let result: BotRunResult;
  switch (bot.botType) {
    case 'LIQUIDITY_ROUTER':
      result = runLiquidityRouter(botId);
      break;
    case 'NEGOTIATION_ASSIST':
      result = runNegotiationAssist(botId);
      break;
    case 'RISK_SENTINEL':
      result = runRiskSentinel(botId);
      break;
    default:
      result = {
        run: {
          id: store.nextId('botrun'),
          botId,
          status: 'FAILED',
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          metrics: { error: `Unsupported bot type: ${bot.botType}` },
        },
        signals: [],
      };
  }

  // Persist
  store.addBotRun(result.run);
  for (const sig of result.signals) {
    store.addBotSignal(sig);
  }

  // Update bot last run
  bot.lastRunAt = result.run.startedAt;
  bot.updatedAt = new Date().toISOString();

  return result;
}

// ─── Liquidity Router Bot ─────────────────────────────────

function runLiquidityRouter(botId: string): BotRunResult {
  const now = new Date().toISOString();
  const signals: BotSignal[] = [];

  // Scan open/submitted trade intents for routing recommendations
  const pendingTrades = store.tradeIntents.filter(
    (t) => t.status === 'QUOTED' || t.status === 'SUBMITTED'
  );

  const routesEvaluated = pendingTrades.length * 3; // 3 venues each
  let recommendationCount = 0;

  for (const trade of pendingTrades) {
    const toAsset = store.envAssets.find((a) => a.id === trade.toAssetId);
    const baseRate = toAsset?.symbol === 'WTR' ? 0.88 : toAsset?.symbol === 'ENG' ? 0.35 : 0.12;
    const bestVenue = trade.amountIn > 5000 ? 'XRPL_AMM' : 'XRPL_DEX';

    signals.push({
      id: store.nextId('sig'),
      botId,
      type: 'TRADE_ROUTE_RECOMMENDED',
      severity: 'INFO',
      payload: {
        tradeIntentId: trade.id,
        fromAsset: trade.fromAssetId,
        toAsset: trade.toAssetId,
        amountIn: trade.amountIn,
        recommendedVenue: bestVenue,
        expectedRate: baseRate + (Math.random() * 0.02 - 0.01),
        estimatedSavingsBps: Math.floor(5 + Math.random() * 20),
      },
      createdAt: now,
    });
    recommendationCount++;
  }

  // Check for liquidity gaps
  const envAssetSymbols = ['WTR', 'ENG'] as const;
  for (const sym of envAssetSymbols) {
    const totalAvailable = store.balanceLedgers
      .filter((b) => b.asset === sym && b.ownerId !== 'agent_001')
      .reduce((sum, b) => sum + b.available, 0);

    if (totalAvailable < 20000) {
      signals.push({
        id: store.nextId('sig'),
        botId,
        type: 'LIQUIDITY_GAP',
        severity: 'WARN',
        payload: {
          asset: sym,
          totalMarketAvailable: totalAvailable,
          threshold: 20000,
          recommendation: `Consider incentivizing ${sym} deposits`,
        },
        createdAt: now,
      });
    }
  }

  const run: BotRun = {
    id: store.nextId('botrun'),
    botId,
    status: 'SUCCEEDED',
    startedAt: now,
    finishedAt: now,
    metrics: {
      routesEvaluated,
      tradesAnalyzed: pendingTrades.length,
      recommendationsMade: recommendationCount,
      signalsGenerated: signals.length,
    },
  };

  return { run, signals };
}

// ─── Negotiation Assist Bot ──────────────────────────────

function runNegotiationAssist(botId: string): BotRunResult {
  const now = new Date().toISOString();
  const signals: BotSignal[] = [];

  // Analyze open and negotiating RFQs
  const activeRfqs = store.rfqs.filter(
    (r) => r.status === 'OPEN' || r.status === 'NEGOTIATING'
  );

  let recommendationsMade = 0;

  for (const rfq of activeRfqs) {
    const existingOffers = store.getOffersForRFQ(rfq.id);
    const hasAccepted = existingOffers.some((o) => o.status === 'ACCEPTED');

    if (hasAccepted) continue;

    if (rfq.status === 'OPEN' && !rfq.targetAgentId) {
      // Suggest a target agent
      const relevantAgents = store.agents.filter(
        (a) => a.id !== rfq.requesterAgentId && a.status === 'ACTIVE' && a.reputationScore >= 70
      );
      if (relevantAgents.length > 0) {
        const suggested = relevantAgents[Math.floor(Math.random() * relevantAgents.length)];
        signals.push({
          id: store.nextId('sig'),
          botId,
          type: 'RFQ_TARGET_FOUND',
          severity: 'INFO',
          payload: {
            rfqId: rfq.id,
            suggestedTargetAgentId: suggested.id,
            suggestedTargetName: suggested.name,
            reason: `High reputation (${suggested.reputationScore}) and active status`,
            confidence: 0.75 + Math.random() * 0.2,
          },
          createdAt: now,
        });
        recommendationsMade++;
      }
    }

    if (rfq.status === 'NEGOTIATING' && existingOffers.length > 0) {
      // Suggest a counter-offer or acceptance
      const pendingOffers = existingOffers.filter((o) => o.status === 'PENDING' || o.status === 'COUNTERED');
      for (const offer of pendingOffers) {
        const suggestedPrice = offer.terms.price * (0.93 + Math.random() * 0.05);
        signals.push({
          id: store.nextId('sig'),
          botId,
          type: 'OFFER_RECOMMENDED',
          severity: 'INFO',
          payload: {
            rfqId: rfq.id,
            offerId: offer.id,
            currentPrice: offer.terms.price,
            suggestedCounterPrice: Math.round(suggestedPrice * 10000) / 10000,
            suggestedAction: suggestedPrice / offer.terms.price > 0.97 ? 'ACCEPT' : 'COUNTER',
            confidence: 0.70 + Math.random() * 0.25,
          },
          createdAt: now,
        });
        recommendationsMade++;
      }
    }
  }

  const run: BotRun = {
    id: store.nextId('botrun'),
    botId,
    status: 'SUCCEEDED',
    startedAt: now,
    finishedAt: now,
    metrics: {
      rfqsAnalyzed: activeRfqs.length,
      recommendationsMade,
      signalsGenerated: signals.length,
    },
  };

  return { run, signals };
}

// ─── Risk Sentinel Bot ────────────────────────────────────

function runRiskSentinel(botId: string): BotRunResult {
  const now = new Date().toISOString();
  const signals: BotSignal[] = [];

  const flaggedAgents: string[] = [];
  let alertsGenerated = 0;

  for (const agent of store.agents) {
    const rep = store.getAgentReputation(agent.id);
    if (!rep) continue;

    // Check for high fraud flags
    if (rep.fraudFlags30d >= 3) {
      signals.push({
        id: store.nextId('sig'),
        botId,
        type: 'RISK_ALERT',
        severity: 'CRITICAL',
        payload: {
          agentId: agent.id,
          agentName: agent.name,
          fraudFlags30d: rep.fraudFlags30d,
          trustScore: rep.trustScore,
          riskTier: rep.riskTier,
          reason: `${rep.fraudFlags30d} fraud flags in last 30 days`,
          recommendAction: agent.status === 'SUSPENDED' ? 'MAINTAIN_SUSPENSION' : 'SUSPEND',
        },
        createdAt: now,
      });
      flaggedAgents.push(agent.id);
      alertsGenerated++;
    }

    // Check for low trust tier with high volume (suspicious)
    if (rep.riskTier === 'D' && rep.volume30d > 5000) {
      signals.push({
        id: store.nextId('sig'),
        botId,
        type: 'RISK_ALERT',
        severity: 'WARN',
        payload: {
          agentId: agent.id,
          agentName: agent.name,
          trustScore: rep.trustScore,
          volume30d: rep.volume30d,
          reason: 'Low trust tier with abnormally high trading volume',
          recommendAction: 'REVIEW',
        },
        createdAt: now,
      });
      alertsGenerated++;
    }

    // Check for high dispute rate
    if (rep.disputeRateAllTime > 0.10) {
      signals.push({
        id: store.nextId('sig'),
        botId,
        type: 'RISK_ALERT',
        severity: 'WARN',
        payload: {
          agentId: agent.id,
          agentName: agent.name,
          disputeRate: rep.disputeRateAllTime,
          reason: `Dispute rate ${(rep.disputeRateAllTime * 100).toFixed(1)}% exceeds 10% threshold`,
          recommendAction: 'REVIEW',
        },
        createdAt: now,
      });
      alertsGenerated++;
    }
  }

  // Check for price anomalies on env assets
  const assetPrices: Record<string, number> = { WTR: 0.88, ENG: 0.35 };
  for (const [symbol, expectedPrice] of Object.entries(assetPrices)) {
    const deviation = (Math.random() * 0.08 - 0.04);
    const currentPrice = expectedPrice + deviation;
    if (Math.abs(deviation) / expectedPrice > 0.03) {
      signals.push({
        id: store.nextId('sig'),
        botId,
        type: 'PRICE_ANOMALY',
        severity: Math.abs(deviation) / expectedPrice > 0.05 ? 'CRITICAL' : 'WARN',
        payload: {
          asset: symbol,
          currentPrice: Math.round(currentPrice * 10000) / 10000,
          expectedPrice,
          deviationPct: Math.round((deviation / expectedPrice) * 10000) / 100,
          recommendation: 'Check oracle feeds and recent large trades',
        },
        createdAt: now,
      });
      alertsGenerated++;
    }
  }

  const run: BotRun = {
    id: store.nextId('botrun'),
    botId,
    status: 'SUCCEEDED',
    startedAt: now,
    finishedAt: now,
    metrics: {
      agentsScanned: store.agents.length,
      alertsGenerated,
      flaggedAgents,
      signalsGenerated: signals.length,
    },
  };

  return { run, signals };
}
