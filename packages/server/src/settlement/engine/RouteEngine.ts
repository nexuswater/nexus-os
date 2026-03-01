import { v4 as uuid } from 'uuid';
import type {
  CrossChainIntent,
  CrossChainQuote,
  Route,
  RouteStep,
} from '@nexus/shared';
import type { ISettlementAdapter } from '../ISettlementAdapter.js';
import { XRPLAdapter } from '../XRPLAdapter.js';
import { EVMAdapter } from '../EVMAdapter.js';
import { BridgeAdapter } from '../BridgeAdapter.js';

export class RouteEngine {
  private adapters: ISettlementAdapter[];

  constructor() {
    this.adapters = [new XRPLAdapter(), new EVMAdapter(), new BridgeAdapter()];
  }

  /**
   * Generate a CrossChainQuote with ranked routes for the given intent.
   */
  async generateQuote(intent: CrossChainIntent): Promise<CrossChainQuote> {
    const routes: Route[] = [];

    // Strategy 1: Direct swap (same chain)
    if (intent.fromChain === intent.toChain) {
      const directRoute = await this.buildDirectSwapRoute(intent);
      if (directRoute) routes.push(directRoute);
    }

    // Strategy 2: Bridge only (same token, different chains)
    if (intent.fromChain !== intent.toChain && intent.fromToken === intent.toToken) {
      const bridgeRoute = await this.buildBridgeOnlyRoute(intent);
      if (bridgeRoute) routes.push(bridgeRoute);
    }

    // Strategy 3: Swap + Bridge (different token, different chain)
    if (intent.fromChain !== intent.toChain && intent.fromToken !== intent.toToken) {
      // Try swap-then-bridge
      const swapBridgeRoute = await this.buildSwapBridgeRoute(intent);
      if (swapBridgeRoute) routes.push(swapBridgeRoute);

      // Try bridge-then-swap  
      const bridgeSwapRoute = await this.buildBridgeSwapRoute(intent);
      if (bridgeSwapRoute) routes.push(bridgeSwapRoute);
    }

    // Strategy 4: Full 3-hop (swap + bridge + swap)
    if (intent.fromChain !== intent.toChain && intent.fromToken !== intent.toToken) {
      const fullRoute = await this.buildFullCrossChainRoute(intent);
      if (fullRoute) routes.push(fullRoute);
    }

    // Rank routes by net output (descending)
    routes.sort((a, b) => b.netOutputAfterFees - a.netOutputAfterFees);
    routes.forEach((r, i) => { r.rank = i + 1; });

    return {
      intentId: intent.id,
      routes,
      bestRouteId: routes[0]?.id ?? '',
      expiresAt: new Date(Date.now() + 30_000).toISOString(), // 30s quote validity
    };
  }

  private findAdapter(chainId: string, type: string): ISettlementAdapter | undefined {
    return this.adapters.find(a => 
      a.supportedChains.includes(chainId as any) && a.rail === type
    );
  }

  private async buildDirectSwapRoute(intent: CrossChainIntent): Promise<Route | null> {
    const adapter = this.adapters.find(a => 
      a.supportedChains.includes(intent.fromChain) && a.rail !== 'BRIDGE'
    );
    if (!adapter) return null;

    const step: RouteStep = {
      stepIndex: 0,
      type: 'SWAP',
      adapter: adapter.rail,
      chainId: intent.fromChain,
      inputToken: intent.fromToken,
      outputToken: intent.toToken,
      estimatedInput: intent.amount,
      estimatedOutput: 0,
      estimatedGas: '0.001',
      estimatedTimeSeconds: 5,
    };

    try {
      const quote = await adapter.quote(step, { senderAddress: intent.sender, maxSlippageBps: intent.maxSlippageBps ?? 50 });
      step.estimatedOutput = quote.estimatedOutput;
      step.estimatedGas = quote.estimatedGas;
    } catch {
      return null;
    }

    const routeId = uuid();
    const totalFees = intent.amount * 0.0012; // ~0.12% fee estimate
    return {
      id: routeId,
      intentId: intent.id,
      steps: [step],
      totalEstimatedOutput: step.estimatedOutput,
      netOutputAfterFees: step.estimatedOutput,
      totalEstimatedTimeSeconds: step.estimatedTimeSeconds,
      totalEstimatedGas: step.estimatedGas,
      reliability: 0.98,
      rank: 0,
    };
  }

  private async buildBridgeOnlyRoute(intent: CrossChainIntent): Promise<Route | null> {
    const bridgeAdapter = this.adapters.find(a => a.rail === 'BRIDGE');
    if (!bridgeAdapter) return null;

    const step: RouteStep = {
      stepIndex: 0,
      type: 'BRIDGE',
      adapter: 'BRIDGE',
      chainId: intent.fromChain,
      inputToken: intent.fromToken,
      outputToken: intent.toToken,
      estimatedInput: intent.amount,
      estimatedOutput: 0,
      estimatedGas: '0.002',
      estimatedTimeSeconds: 120,
    };

    try {
      const quote = await bridgeAdapter.quote(step, { senderAddress: intent.sender, maxSlippageBps: intent.maxSlippageBps ?? 50 });
      step.estimatedOutput = quote.estimatedOutput;
      step.estimatedTimeSeconds = quote.estimatedTimeSeconds ?? 120;
    } catch {
      return null;
    }

    return {
      id: uuid(),
      intentId: intent.id,
      steps: [step],
      totalEstimatedOutput: step.estimatedOutput,
      netOutputAfterFees: step.estimatedOutput,
      totalEstimatedTimeSeconds: step.estimatedTimeSeconds,
      totalEstimatedGas: step.estimatedGas,
      reliability: 0.92,
      rank: 0,
    };
  }

  private async buildSwapBridgeRoute(intent: CrossChainIntent): Promise<Route | null> {
    // Step 1: Swap on source chain to a bridgeable token (e.g., NXS)
    // Step 2: Bridge NXS across chains
    const swapAdapter = this.adapters.find(a => a.supportedChains.includes(intent.fromChain) && a.rail !== 'BRIDGE');
    const bridgeAdapter = this.adapters.find(a => a.rail === 'BRIDGE');
    if (!swapAdapter || !bridgeAdapter) return null;

    const step1: RouteStep = {
      stepIndex: 0,
      type: 'SWAP',
      adapter: swapAdapter.rail,
      chainId: intent.fromChain,
      inputToken: intent.fromToken,
      outputToken: 'NXS',
      estimatedInput: intent.amount,
      estimatedOutput: 0,
      estimatedGas: '0.001',
      estimatedTimeSeconds: 5,
    };

    const step2: RouteStep = {
      stepIndex: 1,
      type: 'BRIDGE',
      adapter: 'BRIDGE',
      chainId: intent.fromChain,
      inputToken: 'NXS',
      outputToken: intent.toToken,
      estimatedInput: 0,
      estimatedOutput: 0,
      estimatedGas: '0.002',
      estimatedTimeSeconds: 120,
    };

    try {
      const q1 = await swapAdapter.quote(step1, { senderAddress: intent.sender, maxSlippageBps: intent.maxSlippageBps ?? 50 });
      step1.estimatedOutput = q1.estimatedOutput;
      step2.estimatedInput = q1.estimatedOutput;
      
      const q2 = await bridgeAdapter.quote(step2, { senderAddress: intent.sender, maxSlippageBps: intent.maxSlippageBps ?? 50 });
      step2.estimatedOutput = q2.estimatedOutput;
      step2.estimatedTimeSeconds = q2.estimatedTimeSeconds ?? 120;
    } catch {
      return null;
    }

    return {
      id: uuid(),
      intentId: intent.id,
      steps: [step1, step2],
      totalEstimatedOutput: step2.estimatedOutput,
      netOutputAfterFees: step2.estimatedOutput,
      totalEstimatedTimeSeconds: step1.estimatedTimeSeconds + step2.estimatedTimeSeconds,
      totalEstimatedGas: '0.003',
      reliability: 0.88,
      rank: 0,
    };
  }

  private async buildBridgeSwapRoute(intent: CrossChainIntent): Promise<Route | null> {
    // Step 1: Bridge from source to target chain
    // Step 2: Swap on target chain
    const bridgeAdapter = this.adapters.find(a => a.rail === 'BRIDGE');
    const swapAdapter = this.adapters.find(a => a.supportedChains.includes(intent.toChain) && a.rail !== 'BRIDGE');
    if (!bridgeAdapter || !swapAdapter) return null;

    const step1: RouteStep = {
      stepIndex: 0,
      type: 'BRIDGE',
      adapter: 'BRIDGE',
      chainId: intent.fromChain,
      inputToken: intent.fromToken,
      outputToken: intent.fromToken,
      estimatedInput: intent.amount,
      estimatedOutput: 0,
      estimatedGas: '0.002',
      estimatedTimeSeconds: 120,
    };

    const step2: RouteStep = {
      stepIndex: 1,
      type: 'SWAP',
      adapter: swapAdapter.rail,
      chainId: intent.toChain,
      inputToken: intent.fromToken,
      outputToken: intent.toToken,
      estimatedInput: 0,
      estimatedOutput: 0,
      estimatedGas: '0.001',
      estimatedTimeSeconds: 10,
    };

    try {
      const q1 = await bridgeAdapter.quote(step1, { senderAddress: intent.sender, maxSlippageBps: intent.maxSlippageBps ?? 50 });
      step1.estimatedOutput = q1.estimatedOutput;
      step1.estimatedTimeSeconds = q1.estimatedTimeSeconds ?? 120;
      step2.estimatedInput = q1.estimatedOutput;
      
      const q2 = await swapAdapter.quote(step2, { senderAddress: intent.sender, maxSlippageBps: intent.maxSlippageBps ?? 50 });
      step2.estimatedOutput = q2.estimatedOutput;
    } catch {
      return null;
    }

    return {
      id: uuid(),
      intentId: intent.id,
      steps: [step1, step2],
      totalEstimatedOutput: step2.estimatedOutput,
      netOutputAfterFees: step2.estimatedOutput,
      totalEstimatedTimeSeconds: step1.estimatedTimeSeconds + step2.estimatedTimeSeconds,
      totalEstimatedGas: '0.003',
      reliability: 0.85,
      rank: 0,
    };
  }

  private async buildFullCrossChainRoute(intent: CrossChainIntent): Promise<Route | null> {
    // 3-hop: swap on source → bridge → swap on target
    const srcSwap = this.adapters.find(a => a.supportedChains.includes(intent.fromChain) && a.rail !== 'BRIDGE');
    const bridge = this.adapters.find(a => a.rail === 'BRIDGE');
    const dstSwap = this.adapters.find(a => a.supportedChains.includes(intent.toChain) && a.rail !== 'BRIDGE');
    if (!srcSwap || !bridge || !dstSwap) return null;

    const bridgeToken = 'NXS'; // Use NXS as bridge intermediary
    
    const step1: RouteStep = {
      stepIndex: 0, type: 'SWAP', adapter: srcSwap.rail,
      chainId: intent.fromChain, inputToken: intent.fromToken, outputToken: bridgeToken,
      estimatedInput: intent.amount, estimatedOutput: 0, estimatedGas: '0.001', estimatedTimeSeconds: 5,
    };
    const step2: RouteStep = {
      stepIndex: 1, type: 'BRIDGE', adapter: 'BRIDGE',
      chainId: intent.fromChain, inputToken: bridgeToken, outputToken: bridgeToken,
      estimatedInput: 0, estimatedOutput: 0, estimatedGas: '0.002', estimatedTimeSeconds: 120,
    };
    const step3: RouteStep = {
      stepIndex: 2, type: 'SWAP', adapter: dstSwap.rail,
      chainId: intent.toChain, inputToken: bridgeToken, outputToken: intent.toToken,
      estimatedInput: 0, estimatedOutput: 0, estimatedGas: '0.001', estimatedTimeSeconds: 10,
    };

    try {
      const q1 = await srcSwap.quote(step1, { senderAddress: intent.sender, maxSlippageBps: intent.maxSlippageBps ?? 50 });
      step1.estimatedOutput = q1.estimatedOutput;
      step2.estimatedInput = q1.estimatedOutput;

      const q2 = await bridge.quote(step2, { senderAddress: intent.sender, maxSlippageBps: intent.maxSlippageBps ?? 50 });
      step2.estimatedOutput = q2.estimatedOutput;
      step2.estimatedTimeSeconds = q2.estimatedTimeSeconds ?? 120;
      step3.estimatedInput = q2.estimatedOutput;

      const q3 = await dstSwap.quote(step3, { senderAddress: intent.sender, maxSlippageBps: intent.maxSlippageBps ?? 50 });
      step3.estimatedOutput = q3.estimatedOutput;
    } catch {
      return null;
    }

    return {
      id: uuid(),
      intentId: intent.id,
      steps: [step1, step2, step3],
      totalEstimatedOutput: step3.estimatedOutput,
      netOutputAfterFees: step3.estimatedOutput,
      totalEstimatedTimeSeconds: step1.estimatedTimeSeconds + step2.estimatedTimeSeconds + step3.estimatedTimeSeconds,
      totalEstimatedGas: '0.004',
      reliability: 0.80,
      rank: 0,
    };
  }
}
