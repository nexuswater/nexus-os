/**
 * Skill Registry — mock execution runtime for 5 core skills.
 * Each skill returns realistic structured results.
 */

export interface SkillExecutionResult {
  success: boolean;
  data: Record<string, unknown>;
  metricsUsed: number;
  latencyMs: number;
}

type SkillHandler = (input: Record<string, unknown>) => SkillExecutionResult;

const skillHandlers: Record<string, SkillHandler> = {
  /**
   * bill-parse-v1: Parses a utility bill and returns structured data + fraud flags.
   */
  'bill-parse-v1': (input) => {
    const docType = (input.docType as string) || 'water_bill';
    const pages = (input.pages as number) || 2;
    const utility = (input.utility as string) || 'Generic Utility Co.';

    const usageGallons = 4200 + Math.floor(Math.random() * 3000);
    const ratePerGallon = 0.0045 + Math.random() * 0.003;
    const totalCharge = Math.round(usageGallons * ratePerGallon * 100) / 100;
    const fraudFlags = Math.random() > 0.85 ? 1 : 0;

    return {
      success: true,
      data: {
        documentType: docType,
        utility,
        billingPeriod: { start: '2026-01-01', end: '2026-01-31' },
        accountNumber: `ACCT-${Math.floor(Math.random() * 900000 + 100000)}`,
        meterRead: { previous: 12450, current: 12450 + usageGallons, unit: 'gallons' },
        usage: { value: usageGallons, unit: 'gallons' },
        charges: {
          baseCharge: 8.50,
          usageCharge: totalCharge,
          taxes: Math.round(totalCharge * 0.08 * 100) / 100,
          total: Math.round((8.50 + totalCharge + totalCharge * 0.08) * 100) / 100,
        },
        rateSchedule: { tier1Rate: ratePerGallon, tier1Cap: 5000, tier2Rate: ratePerGallon * 1.5 },
        fraudFlags,
        fraudDetails: fraudFlags > 0 ? ['Meter read inconsistency detected'] : [],
        confidence: 0.94 + Math.random() * 0.05,
        pagesProcessed: pages,
      },
      metricsUsed: pages,
      latencyMs: 180 + Math.floor(Math.random() * 150),
    };
  },

  /**
   * home-score-v1: Returns WaterScore and EnergyScore + certificate data for a property.
   */
  'home-score-v1': (input) => {
    const propertyId = (input.propertyId as string) || 'prop_unknown';
    const monthsOfData = (input.monthsOfData as number) || 12;

    const waterScore = 60 + Math.floor(Math.random() * 35);
    const energyScore = 55 + Math.floor(Math.random() * 40);
    const combinedScore = Math.round((waterScore * 0.5 + energyScore * 0.5) * 10) / 10;
    const grade = combinedScore >= 85 ? 'A' : combinedScore >= 75 ? 'B+' : combinedScore >= 65 ? 'B' : combinedScore >= 55 ? 'C+' : 'C';

    return {
      success: true,
      data: {
        propertyId,
        monthsAnalyzed: monthsOfData,
        waterScore: {
          score: waterScore,
          percentile: waterScore - 5 + Math.floor(Math.random() * 10),
          trend: waterScore > 75 ? 'improving' : 'stable',
          avgMonthlyUsageGallons: 3500 + Math.floor(Math.random() * 2000),
          peerAvgGallons: 4800,
        },
        energyScore: {
          score: energyScore,
          percentile: energyScore - 3 + Math.floor(Math.random() * 8),
          trend: energyScore > 70 ? 'improving' : 'declining',
          avgMonthlyUsageKwh: 650 + Math.floor(Math.random() * 400),
          peerAvgKwh: 890,
        },
        combined: { score: combinedScore, grade },
        certificate: {
          eligible: combinedScore >= 65,
          certificateType: combinedScore >= 85 ? 'GOLD' : combinedScore >= 75 ? 'SILVER' : 'BRONZE',
          nftTokenId: combinedScore >= 65 ? `nft_cert_${Date.now()}` : null,
          issuedAt: new Date().toISOString(),
        },
        recommendations: [
          waterScore < 80 ? 'Install low-flow fixtures to improve WaterScore' : null,
          energyScore < 70 ? 'Consider smart thermostat for better EnergyScore' : null,
          combinedScore < 75 ? 'Schedule an energy audit for personalized recommendations' : null,
        ].filter(Boolean),
      },
      metricsUsed: Math.ceil(monthsOfData * 10),
      latencyMs: 200 + Math.floor(Math.random() * 200),
    };
  },

  /**
   * audit-pack-v1: Returns a zipped manifest reference for a compliance audit pack.
   */
  'audit-pack-v1': (input) => {
    const programId = (input.programId as string) || 'UNKNOWN_PROGRAM';
    const quarter = (input.quarter as string) || 'Q1';
    const agentCount = (input.agentCount as number) || 10;

    const docCount = agentCount * 3 + 5; // 3 docs per agent + 5 summary docs
    const manifestHash = `sha256:${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    return {
      success: true,
      data: {
        programId,
        quarter,
        agentsIncluded: agentCount,
        manifest: {
          hash: manifestHash,
          ipfsRef: `ipfs://QmAuditPack_${Date.now()}`,
          documentCount: docCount,
          totalSizeBytes: docCount * 45000 + Math.floor(Math.random() * 100000),
        },
        contents: [
          { type: 'SUMMARY_REPORT', count: 1, description: 'Executive summary with key findings' },
          { type: 'AGENT_COMPLIANCE_SHEETS', count: agentCount, description: 'Individual agent compliance reports' },
          { type: 'TRANSACTION_LOGS', count: agentCount, description: 'Transaction logs per agent' },
          { type: 'RECEIPT_BUNDLE', count: agentCount, description: 'Receipt bundles per agent' },
          { type: 'REGULATORY_COVER_SHEET', count: 1, description: 'Regulatory submission cover sheet' },
          { type: 'APPENDICES', count: 3, description: 'Supporting appendices and methodology notes' },
        ],
        compliance: {
          passRate: 0.85 + Math.random() * 0.14,
          flaggedAgents: Math.floor(agentCount * 0.1),
          criticalFindings: Math.floor(Math.random() * 3),
        },
        generatedAt: new Date().toISOString(),
      },
      metricsUsed: docCount,
      latencyMs: 800 + Math.floor(Math.random() * 500),
    };
  },

  /**
   * oracle-price-v1: Returns water/energy price vectors across markets.
   */
  'oracle-price-v1': (input) => {
    const assets = (input.assets as string[]) || ['WTR', 'ENG'];
    const timeRange = (input.timeRange as string) || '24h';

    const priceVectors: Record<string, unknown>[] = [];
    for (const asset of assets) {
      const basePrice = asset === 'WTR' ? 0.88 : asset === 'ENG' ? 0.35 : 0.12;
      const jitter = () => Math.round((Math.random() * 0.06 - 0.03) * 10000) / 10000;

      priceVectors.push({
        asset,
        prices: {
          xrplAmm: basePrice + jitter(),
          xrplDex: basePrice + jitter(),
          evmDex: basePrice + jitter() + 0.01,
          evmAmm: basePrice + jitter() + 0.005,
        },
        volume24h: {
          xrplAmm: Math.floor(50000 + Math.random() * 200000),
          xrplDex: Math.floor(30000 + Math.random() * 150000),
          evmDex: Math.floor(20000 + Math.random() * 100000),
          evmAmm: Math.floor(15000 + Math.random() * 80000),
        },
        stats: {
          high24h: basePrice + 0.04,
          low24h: basePrice - 0.03,
          change24hPct: Math.round((Math.random() * 6 - 3) * 100) / 100,
          vwap24h: basePrice + jitter(),
        },
      });
    }

    return {
      success: true,
      data: {
        timeRange,
        timestamp: new Date().toISOString(),
        priceVectors,
        sources: ['XRPL_AMM', 'XRPL_DEX', 'EVM_UNISWAP', 'EVM_CURVE'],
        staleness: 'FRESH',
        confidenceScore: 0.96 + Math.random() * 0.03,
      },
      metricsUsed: assets.length * 1000,
      latencyMs: 50 + Math.floor(Math.random() * 80),
    };
  },

  /**
   * best-execution-router-v1: Returns the optimal route quote for a trade.
   */
  'best-execution-router-v1': (input) => {
    const fromAsset = (input.fromAsset as string) || 'RLUSD';
    const toAsset = (input.toAsset as string) || 'WTR';
    const amountIn = (input.amountIn as number) || 1000;
    const slippageBps = (input.slippageBps as number) || 100;

    const baseRate = toAsset === 'WTR' ? 0.88 : toAsset === 'ENG' ? 0.35 : 1.0;
    const routes = [
      {
        venue: 'XRPL_AMM',
        rate: baseRate + 0.005,
        estimatedOut: Math.floor(amountIn / (baseRate + 0.005)),
        slippageEstBps: 12,
        gasCost: 0.001,
        confidence: 0.95,
      },
      {
        venue: 'XRPL_DEX',
        rate: baseRate,
        estimatedOut: Math.floor(amountIn / baseRate),
        slippageEstBps: 25,
        gasCost: 0.002,
        confidence: 0.91,
      },
      {
        venue: 'EVM_UNISWAP',
        rate: baseRate + 0.015,
        estimatedOut: Math.floor(amountIn / (baseRate + 0.015)),
        slippageEstBps: 18,
        gasCost: 0.50,
        confidence: 0.88,
      },
    ];

    // Sort by best effective output (highest estimatedOut)
    routes.sort((a, b) => b.estimatedOut - a.estimatedOut);
    const bestRoute = routes[0];

    return {
      success: true,
      data: {
        fromAsset,
        toAsset,
        amountIn,
        slippageBps,
        bestRoute: {
          venue: bestRoute.venue,
          rate: bestRoute.rate,
          estimatedOut: bestRoute.estimatedOut,
          slippageEstBps: bestRoute.slippageEstBps,
          gasCost: bestRoute.gasCost,
          confidence: bestRoute.confidence,
          expiresIn: '30s',
        },
        alternativeRoutes: routes.slice(1),
        splitRoute: amountIn > 5000 ? {
          recommended: true,
          legs: [
            { venue: routes[0].venue, pct: 60, amount: Math.floor(amountIn * 0.6) },
            { venue: routes[1].venue, pct: 40, amount: Math.floor(amountIn * 0.4) },
          ],
          estimatedSavingsBps: 8,
        } : { recommended: false },
        timestamp: new Date().toISOString(),
      },
      metricsUsed: 1,
      latencyMs: 120 + Math.floor(Math.random() * 100),
    };
  },
};

/**
 * Execute a skill by slug. Returns the mock result.
 */
export function executeSkill(slug: string, input: Record<string, unknown>): SkillExecutionResult {
  const handler = skillHandlers[slug];
  if (!handler) {
    return {
      success: false,
      data: { error: `Skill '${slug}' not found in registry` },
      metricsUsed: 0,
      latencyMs: 0,
    };
  }
  return handler(input);
}

/**
 * Check if a skill slug is registered.
 */
export function isSkillRegistered(slug: string): boolean {
  return slug in skillHandlers;
}

/**
 * List all registered skill slugs.
 */
export function listRegisteredSlugs(): string[] {
  return Object.keys(skillHandlers);
}
