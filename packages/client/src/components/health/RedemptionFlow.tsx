/**
 * RedemptionFlow — 3-step reward redemption modal.
 * Step 1: Confirm amount (slider + presets)
 * Step 2: Choose payout method
 * Step 3: Success with receipt
 */
import { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Download, Share2, Wallet, Building2, Gift, Sparkles, Shield } from 'lucide-react';

interface RedemptionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  availableCredits: number;
  onRedeem?: (amount: number, method: string) => void;
}

type Step = 1 | 2 | 3;

const PRESETS = [25, 50, 100, 250];
const PAYOUT_METHODS = [
  {
    id: 'nexus-wallet',
    label: 'Nexus Wallet',
    description: 'Instant to your Nexus balance',
    icon: Wallet,
    recommended: true,
  },
  {
    id: 'gift-card',
    label: 'Gift Card',
    description: 'Convert to popular gift cards',
    icon: Gift,
    recommended: false,
  },
  {
    id: 'bank-transfer',
    label: 'Bank Transfer',
    description: 'Direct deposit (2-3 business days)',
    icon: Building2,
    recommended: false,
  },
];

export function RedemptionFlow({ isOpen, onClose, availableCredits, onRedeem }: RedemptionFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [amount, setAmount] = useState(Math.min(100, availableCredits));
  const [method, setMethod] = useState('nexus-wallet');
  const [receiptId] = useState(() => `REC-${Date.now().toString(36).toUpperCase()}`);

  if (!isOpen) return null;

  const handleRedeem = () => {
    onRedeem?.(amount, method);
    setStep(3);
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const selectedMethod = PAYOUT_METHODS.find(m => m.id === method)!;
  const dollarValue = (amount * 0.15).toFixed(2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#111820] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {step === 1 && 'Choose Amount'}
              {step === 2 && 'Payout Method'}
              {step === 3 && 'Redemption Complete'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                      s < step ? 'bg-[#25D695] text-white' :
                      s === step ? 'bg-[#25D695]/20 text-[#25D695] ring-2 ring-[#25D695]/30' :
                      'bg-white/[0.06] text-[#475569]'
                    }`}
                  >
                    {s < step ? <Check size={10} /> : s}
                  </div>
                  {s < 3 && <div className={`w-6 h-px ${s < step ? 'bg-[#25D695]' : 'bg-white/[0.08]'}`} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-[#475569] hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Amount */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-xs text-[#64748B] mb-1">Available credits</div>
                <div className="text-2xl font-bold text-white">{availableCredits.toLocaleString()} credits</div>
              </div>

              {/* Amount display */}
              <div className="text-center py-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-4xl font-bold text-[#25D695] tabular-nums">{amount}</div>
                <div className="text-sm text-[#64748B] mt-1">credits to redeem</div>
                <div className="text-xs text-[#475569] mt-0.5">≈ ${dollarValue} value</div>
              </div>

              {/* Presets */}
              <div className="flex gap-2">
                {PRESETS.filter(p => p <= availableCredits).map(preset => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      amount === preset
                        ? 'bg-[#25D695]/15 text-[#25D695] border border-[#25D695]/30'
                        : 'bg-white/[0.04] text-[#94A3B8] border border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <button
                  onClick={() => setAmount(availableCredits)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    amount === availableCredits
                      ? 'bg-[#25D695]/15 text-[#25D695] border border-[#25D695]/30'
                      : 'bg-white/[0.04] text-[#94A3B8] border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  Max
                </button>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={1}
                max={availableCredits}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full accent-[#25D695] h-1.5 rounded-full bg-white/[0.08]"
              />

              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-xl bg-[#25D695] text-white font-semibold text-sm hover:bg-[#1FBF84] transition-colors flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Payout Method */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {PAYOUT_METHODS.map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                        method === m.id
                          ? 'bg-[#25D695]/[0.08] border-[#25D695]/30'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        method === m.id ? 'bg-[#25D695]/15' : 'bg-white/[0.06]'
                      }`}>
                        <Icon size={18} className={method === m.id ? 'text-[#25D695]' : 'text-[#64748B]'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${method === m.id ? 'text-white' : 'text-[#94A3B8]'}`}>
                            {m.label}
                          </span>
                          {m.recommended && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#25D695]/15 text-[#25D695]">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#475569] mt-0.5">{m.description}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        method === m.id ? 'border-[#25D695] bg-[#25D695]' : 'border-[#475569]'
                      }`}>
                        {method === m.id && <Check size={10} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">Amount</span>
                  <span className="text-white font-medium">{amount} credits</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-[#64748B]">Value</span>
                  <span className="text-white font-medium">${dollarValue}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-[#64748B]">Method</span>
                  <span className="text-white font-medium">{selectedMethod.label}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-white/[0.06] text-[#94A3B8] font-medium text-sm hover:bg-white/[0.1] transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={handleRedeem}
                  className="flex-[2] py-3 rounded-xl bg-[#25D695] text-white font-semibold text-sm hover:bg-[#1FBF84] transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} /> Redeem Now
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#25D695]/15 flex items-center justify-center mx-auto">
                <Check size={32} className="text-[#25D695]" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Redemption Successful!</h3>
                <p className="text-sm text-[#64748B] mt-1">
                  {amount} credits redeemed to {selectedMethod.label}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#64748B]">Receipt ID</span>
                  <span className="text-white font-mono text-xs">{receiptId}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#64748B]">Credits</span>
                  <span className="text-white font-medium">{amount}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#64748B]">Value</span>
                  <span className="text-[#25D695] font-bold">${dollarValue}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">Verified by</span>
                  <span className="text-white text-xs flex items-center gap-1">
                    <Shield size={10} className="text-[#25D695]" /> Nexus Protocol
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl bg-white/[0.06] text-[#94A3B8] font-medium text-sm hover:bg-white/[0.1] transition-colors flex items-center justify-center gap-2">
                  <Download size={14} /> Certificate
                </button>
                <button className="flex-1 py-3 rounded-xl bg-white/[0.06] text-[#94A3B8] font-medium text-sm hover:bg-white/[0.1] transition-colors flex items-center justify-center gap-2">
                  <Share2 size={14} /> Share
                </button>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-[#25D695] text-white font-semibold text-sm hover:bg-[#1FBF84] transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
