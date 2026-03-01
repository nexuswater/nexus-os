import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle, Clock, ArrowRight } from 'lucide-react';

interface SagaStep {
  stepIndex: number;
  status: 'pending' | 'executing' | 'confirming' | 'success' | 'failed' | 'retrying';
  txHash?: string;
  explorerUrl?: string;
  error?: string;
  retryCount: number;
}

interface SagaTimelineProps {
  steps: SagaStep[];
  routeSteps?: Array<{
    type: string;
    adapter: string;
    inputToken: string;
    outputToken: string;
  }>;
  className?: string;
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: '#475569', bg: '#475569/10', label: 'Pending' },
  executing: { icon: Loader2, color: '#25D695', bg: '#25D695/10', label: 'Executing' },
  confirming: { icon: Loader2, color: '#F5C542', bg: '#F5C542/10', label: 'Confirming' },
  success: { icon: Check, color: '#25D695', bg: '#25D695/15', label: 'Complete' },
  failed: { icon: AlertCircle, color: '#EF4444', bg: '#EF4444/10', label: 'Failed' },
  retrying: { icon: Loader2, color: '#F5C542', bg: '#F5C542/10', label: 'Retrying' },
};

const ADAPTER_LABELS: Record<string, string> = {
  XRPL_DEX: 'XRPL DEX Swap',
  EVM_AMM: 'EVM AMM Swap',
  BRIDGE: 'Axelar Bridge Transfer',
};

export default function SagaTimeline({ steps, routeSteps, className }: SagaTimelineProps) {
  return (
    <div className={`space-y-0 ${className ?? ''}`}>
      <AnimatePresence>
        {steps.map((step, i) => {
          const config = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.pending;
          const Icon = config.icon;
          const routeStep = routeSteps?.[i];
          const isSpinning = step.status === 'executing' || step.status === 'confirming' || step.status === 'retrying';
          const isLast = i === steps.length - 1;
          
          return (
            <motion.div
              key={step.stepIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="flex gap-3"
            >
              {/* Vertical line + icon */}
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center border"
                  style={{
                    backgroundColor: step.status === 'success' ? 'rgba(37,214,149,0.15)' : 'rgba(28,36,50,0.5)',
                    borderColor: config.color,
                  }}
                >
                  <Icon
                    size={14}
                    style={{ color: config.color }}
                    className={isSpinning ? 'animate-spin' : ''}
                  />
                </div>
                {!isLast && (
                  <div
                    className="w-px flex-1 min-h-[24px]"
                    style={{
                      backgroundColor: step.status === 'success' ? '#25D69540' : '#1C2432',
                    }}
                  />
                )}
              </div>
              
              {/* Step content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-white">
                    Step {step.stepIndex + 1}: {routeStep ? ADAPTER_LABELS[routeStep.adapter] ?? routeStep.type : `Step ${step.stepIndex + 1}`}
                  </span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ color: config.color, backgroundColor: `${config.color}15` }}
                  >
                    {config.label}
                  </span>
                </div>
                
                {routeStep && (
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#64748B]">
                    <span>{routeStep.inputToken}</span>
                    <ArrowRight size={10} />
                    <span>{routeStep.outputToken}</span>
                  </div>
                )}
                
                {step.txHash && (
                  <div className="mt-1">
                    {step.explorerUrl ? (
                      <a
                        href={step.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono text-[#25D695] hover:underline"
                      >
                        {step.txHash.slice(0, 10)}...{step.txHash.slice(-6)}
                      </a>
                    ) : (
                      <span className="text-[10px] font-mono text-[#475569]">
                        {step.txHash.slice(0, 10)}...{step.txHash.slice(-6)}
                      </span>
                    )}
                  </div>
                )}
                
                {step.error && (
                  <p className="text-[10px] text-red-400 mt-1">{step.error}</p>
                )}
                
                {step.retryCount > 0 && step.status !== 'success' && (
                  <p className="text-[10px] text-[#F5C542] mt-0.5">Retry #{step.retryCount}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
