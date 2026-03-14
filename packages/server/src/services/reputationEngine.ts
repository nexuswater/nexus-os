/**
 * Reputation Engine — records events and computes agent trust scores.
 *
 * Weights:
 *   Reliability 25%, Success 25%, Fraud Risk 20%, Disputes 10%, Speed 10%, Liquidity 10%
 *
 * Tier mapping:
 *   A = 85-100, B = 70-84, C = 50-69, D = 0-49
 */
import type { AgentEvent, AgentReputation, RiskTier, TrustBreakdown } from '@nexus/shared';
import { store } from './agentEconomyStore.js';

const WEIGHTS = {
  reliability: 0.25,
  success: 0.25,
  fraudRisk: 0.20,
  disputes: 0.10,
  speed: 0.10,
  liquidity: 0.10,
} as const;

/**
 * Record an agent event and persist it in the store.
 */
export function recordAgentEvent(event: AgentEvent): void {
  store.addAgentEvent(event);
}

/**
 * Recompute the reputation for a specific agent based on all stored events and metrics.
 * Updates the AgentReputation record in place.
 */
export function recomputeAgentReputation(agentId: string): AgentReputation | null {
  const rep = store.getAgentReputation(agentId);
  if (!rep) return null;

  const events = store.getEventsForAgent(agentId);

  // Compute sub-scores from events and existing metrics
  const subScores = computeSubScores(agentId, events, rep);

  // Compute weighted trust score
  const trustScore = computeTrustScore(subScores);

  // Map to tier
  const riskTier = mapTier(trustScore);

  // Build breakdown
  const recentEvents = events
    .slice(-10)
    .map((e) => ({
      type: e.type,
      impact: eventImpact(e),
      createdAt: e.createdAt,
    }));

  const delta = trustScore - rep.trustScore;
  const deltaSummary = delta > 2
    ? `Improved by ${delta.toFixed(1)} points`
    : delta < -2
      ? `Declined by ${Math.abs(delta).toFixed(1)} points`
      : 'Stable, no significant changes';

  const breakdown: TrustBreakdown = {
    subScores,
    weights: { ...WEIGHTS },
    recentEvents,
    deltaSummary,
  };

  // Update the reputation object in the store
  rep.trustScore = trustScore;
  rep.riskTier = riskTier;
  rep.reliabilityScore = subScores.reliability;
  rep.successScore = subScores.success;
  rep.fraudRiskScore = subScores.fraudRisk;
  rep.disputeScore = subScores.disputes;
  rep.executionSpeedScore = subScores.speed;
  rep.liquidityScore = subScores.liquidity;
  rep.lastBreakdown = breakdown;
  rep.lastComputedAt = new Date().toISOString();
  rep.updatedAt = new Date().toISOString();

  // Also update the agent's top-level reputation score
  const agent = store.getAgent(agentId);
  if (agent) {
    agent.reputationScore = trustScore;
    agent.updatedAt = new Date().toISOString();
  }

  return rep;
}

/**
 * Deterministic trust score computation using weighted sub-scores.
 * All sub-scores are 0-100. Returns 0-100.
 */
export function computeTrustScore(subScores: {
  reliability: number;
  success: number;
  fraudRisk: number;
  disputes: number;
  speed: number;
  liquidity: number;
}): number {
  const weighted =
    subScores.reliability * WEIGHTS.reliability +
    subScores.success * WEIGHTS.success +
    subScores.fraudRisk * WEIGHTS.fraudRisk +
    subScores.disputes * WEIGHTS.disputes +
    subScores.speed * WEIGHTS.speed +
    subScores.liquidity * WEIGHTS.liquidity;

  return Math.round(Math.min(100, Math.max(0, weighted)) * 10) / 10;
}

/**
 * Map a trust score to a risk tier.
 */
export function mapTier(score: number): RiskTier {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

// ── Internal helpers ──────────────────────────────────────

function computeSubScores(
  agentId: string,
  events: AgentEvent[],
  rep: AgentReputation,
): TrustBreakdown['subScores'] {
  // Count event types
  let successes = 0;
  let failures = 0;
  let fraudFlags = 0;
  let disputesOpened = 0;
  let disputesResolved = 0;
  let escrowReleased = 0;
  let escrowRefunded = 0;

  for (const e of events) {
    switch (e.type) {
      case 'EXECUTION_SUCCEEDED':
      case 'TRADE_FILLED':
      case 'OFFER_ACCEPTED':
        successes++;
        break;
      case 'EXECUTION_FAILED':
      case 'TRADE_FAILED':
        failures++;
        break;
      case 'FRAUD_FLAG':
        fraudFlags++;
        break;
      case 'DISPUTE_OPENED':
        disputesOpened++;
        break;
      case 'DISPUTE_RESOLVED':
        disputesResolved++;
        break;
      case 'ESCROW_RELEASED':
        escrowReleased++;
        break;
      case 'ESCROW_REFUNDED':
        escrowRefunded++;
        break;
    }
  }

  const total = successes + failures;

  // Reliability: based on successful execution/escrow release ratio
  const reliabilityRaw = total > 0
    ? ((successes + escrowReleased) / (total + escrowReleased + escrowRefunded)) * 100
    : 50;
  const reliability = clamp(reliabilityRaw);

  // Success: success rate as percentage
  const successRaw = total > 0 ? (successes / total) * 100 : 50;
  const success = clamp(successRaw);

  // Fraud Risk: inversely proportional to fraud flags. 0 flags = 100 score.
  const fraudRisk = clamp(100 - fraudFlags * 20);

  // Disputes: based on dispute resolution rate. Fewer disputes = better.
  const totalDisputes = disputesOpened + disputesResolved;
  const disputesRaw = totalDisputes === 0
    ? 90
    : disputesResolved > 0
      ? ((disputesResolved / totalDisputes) * 50) + (50 - disputesOpened * 10)
      : Math.max(0, 70 - disputesOpened * 15);
  const disputes = clamp(disputesRaw);

  // Speed: based on average latency. Lower is better. Use stored metric.
  const avgLatency = rep.avgLatencyMs30d || 500;
  const speedRaw = avgLatency < 200 ? 95
    : avgLatency < 500 ? 80
    : avgLatency < 1000 ? 65
    : avgLatency < 2000 ? 45
    : 25;
  const speed = clamp(speedRaw);

  // Liquidity: based on 30d volume relative to all-time average
  const vol30d = rep.volume30d || 0;
  const volAll = rep.volumeAllTime || 1;
  const expectedMonthly = volAll / 12;
  const liquidityRaw = expectedMonthly > 0
    ? Math.min(100, (vol30d / expectedMonthly) * 70 + 15)
    : 30;
  const liquidity = clamp(liquidityRaw);

  return { reliability, success, speed, disputes, fraudRisk, liquidity };
}

function eventImpact(event: AgentEvent): number {
  switch (event.type) {
    case 'EXECUTION_SUCCEEDED':
    case 'TRADE_FILLED':
    case 'OFFER_ACCEPTED':
    case 'ESCROW_RELEASED':
      return 1;
    case 'DISPUTE_RESOLVED':
      return 0.5;
    case 'EXECUTION_FAILED':
    case 'TRADE_FAILED':
    case 'OFFER_REJECTED':
      return -1;
    case 'ESCROW_REFUNDED':
      return -1.5;
    case 'DISPUTE_OPENED':
      return -2;
    case 'FRAUD_FLAG':
      return -5;
    default:
      return 0;
  }
}

function clamp(v: number): number {
  return Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
}
