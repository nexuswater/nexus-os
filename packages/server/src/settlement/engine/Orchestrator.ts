import type {
  CrossChainIntent,
  Route,
  SagaState,
  SagaStep,
  CrossChainReceipt,
} from '@nexus/shared';
import type { ISettlementAdapter } from '../ISettlementAdapter.js';
import { XRPLAdapter } from '../XRPLAdapter.js';
import { EVMAdapter } from '../EVMAdapter.js';
import { BridgeAdapter } from '../BridgeAdapter.js';

const MAX_RETRIES = 2;

export class Orchestrator {
  private sagas = new Map<string, SagaState>();
  private receipts = new Map<string, CrossChainReceipt>();
  private adapters: Map<string, ISettlementAdapter>;

  constructor() {
    const xrpl = new XRPLAdapter();
    const evm = new EVMAdapter();
    const bridge = new BridgeAdapter();
    this.adapters = new Map<string, ISettlementAdapter>([
      ['XRPL_DEX', xrpl],
      ['EVM_AMM', evm],
      ['BRIDGE', bridge],
    ]);
  }

  /** Start executing a route. Returns the initial SagaState. */
  async execute(intent: CrossChainIntent, route: Route): Promise<SagaState> {
    const sagaSteps: SagaStep[] = route.steps.map((s, i) => ({
      stepIndex: i,
      status: i === 0 ? 'executing' : 'pending',
      retryCount: 0,
    }));

    const state: SagaState = {
      intentId: intent.id,
      routeId: route.id,
      steps: sagaSteps,
      status: 'executing',
      currentStepIndex: 0,
      startedAt: new Date().toISOString(),
    };

    this.sagas.set(intent.id, state);

    // Execute in background (non-blocking)
    this.runSaga(intent, route, state).catch(() => {
      state.status = 'failed';
    });

    return { ...state };
  }

  /** Get current status */
  getStatus(intentId: string): SagaState | null {
    const state = this.sagas.get(intentId);
    return state ? { ...state, steps: [...state.steps] } : null;
  }

  /** Get receipt (completed only) */
  getReceipt(intentId: string): CrossChainReceipt | null {
    return this.receipts.get(intentId) ?? null;
  }

  private async runSaga(intent: CrossChainIntent, route: Route, state: SagaState): Promise<void> {
    for (let i = 0; i < route.steps.length; i++) {
      const routeStep = route.steps[i];
      const sagaStep = state.steps[i];
      state.currentStepIndex = i;
      sagaStep.status = 'executing';

      const adapter = this.adapters.get(routeStep.adapter);
      if (!adapter) {
        sagaStep.status = 'failed';
        sagaStep.error = `No adapter found for ${routeStep.adapter}`;
        state.status = 'failed';
        return;
      }

      let success = false;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        sagaStep.retryCount = attempt;
        try {
          // Build transaction
          const tx = await adapter.buildTx(routeStep, {
            senderAddress: intent.sender,
            maxSlippageBps: intent.maxSlippageBps ?? 50,
          });

          // Sign and send
          const submission = await adapter.signAndSend(tx, {
            senderAddress: intent.sender,
            maxSlippageBps: intent.maxSlippageBps ?? 50,
          });
          sagaStep.txHash = submission.txHash;

          // Wait for finality
          sagaStep.status = 'confirming';
          const receipt = await adapter.waitForFinality(
            submission.txHash,
            routeStep.chainId,
            30_000,
          );
          
          sagaStep.explorerUrl = receipt.explorerUrl;
          sagaStep.status = 'success';
          success = true;
          break;
        } catch (err: any) {
          sagaStep.error = err.message ?? 'Unknown error';
          if (attempt < MAX_RETRIES) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            sagaStep.status = 'executing';
          }
        }
      }

      if (!success) {
        sagaStep.status = 'failed';
        state.status = 'stuck';
        return;
      }
    }

    // All steps complete
    state.status = 'completed';
    state.completedAt = new Date().toISOString();

    // Build receipt
    const explorerLinks = state.steps
      .filter(s => s.explorerUrl)
      .map(s => ({ chainId: route.steps[s.stepIndex].chainId, txHash: s.txHash!, url: s.explorerUrl! }));

    this.receipts.set(intent.id, {
      intentId: intent.id,
      routeId: route.id,
      inputAmount: intent.amount,
      inputToken: intent.fromToken,
      outputAmount: route.totalEstimatedOutput,
      outputToken: intent.toToken,
      fromChain: intent.fromChain,
      toChain: intent.toChain,
      explorerLinks,
      completedAt: state.completedAt,
    });
  }
}
