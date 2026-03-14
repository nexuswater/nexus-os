/**
 * Rewards — Credits overview + 3-step redemption flow.
 * "I can earn rewards without learning crypto."
 */
import { useState } from 'react';
import { MetricCard, RedemptionFlow } from '@/components/health';
import { generateRewardsData } from '@/mock/generators/health';
import {
  Award, Clock, CheckCircle2, History, Gift,
  Droplets, Zap, Sparkles, ArrowRight,
} from 'lucide-react';

const rewards = generateRewardsData();

const earningTypeConfig = {
  water: { icon: Droplets, color: '#00b8f0', bg: 'bg-[#00b8f0]/10' },
  energy: { icon: Zap, color: '#f99d07', bg: 'bg-[#f99d07]/10' },
  bonus: { icon: Sparkles, color: '#A78BFA', bg: 'bg-[#A78BFA]/10' },
};

export default function Rewards() {
  const [showRedemption, setShowRedemption] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Rewards</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Earn credits for verified water & energy savings
          </p>
        </div>
        <button
          onClick={() => setShowRedemption(true)}
          className="px-5 py-2.5 rounded-xl bg-[#25D695] text-white text-sm font-semibold hover:bg-[#1FBF84] transition-colors flex items-center gap-2"
        >
          <Gift size={16} /> Redeem
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          value={rewards.totalCredits.toLocaleString()}
          label="Total Credits"
          color="#25D695"
          icon={<Award size={16} className="text-[#25D695]" />}
        />
        <MetricCard
          value={rewards.pendingVerification.toLocaleString()}
          label="Pending Verification"
          color="#f99d07"
          icon={<Clock size={16} className="text-[#f99d07]" />}
        />
        <MetricCard
          value={rewards.redeemableNow.toLocaleString()}
          label="Redeemable Now"
          color="#00b8f0"
          icon={<CheckCircle2 size={16} className="text-[#00b8f0]" />}
        />
        <MetricCard
          value={rewards.lifetimeRedeemed.toLocaleString()}
          label="Lifetime Redeemed"
          color="#A78BFA"
          icon={<History size={16} className="text-[#A78BFA]" />}
        />
      </div>

      {/* Two columns: Earnings + Redemptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Earning History */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-4">How You Earned</h3>
          <div className="space-y-2">
            {rewards.earningHistory.map(e => {
              const cfg = earningTypeConfig[e.type];
              const Icon = cfg.icon;
              return (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}
                  >
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 truncate">{e.reason}</div>
                    <div className="text-[10px] text-[#475569]">{e.date}</div>
                  </div>
                  <div className="text-sm font-bold text-[#25D695] shrink-0">
                    +{e.amount}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Redemption History */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-4">Redemption History</h3>
          {rewards.recentRedemptions.length === 0 ? (
            <div className="text-center py-12">
              <Gift size={32} className="text-[#475569] mx-auto mb-3" />
              <p className="text-sm text-[#64748B]">No redemptions yet</p>
              <button
                onClick={() => setShowRedemption(true)}
                className="text-sm text-[#25D695] hover:text-[#1FBF84] mt-2 transition-colors inline-flex items-center gap-1"
              >
                Redeem your first credits <ArrowRight size={12} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {rewards.recentRedemptions.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                  <div>
                    <div className="text-sm text-white/80">{r.method}</div>
                    <div className="text-[10px] text-[#475569]">{r.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{r.amount} credits</div>
                    <div className={`text-[10px] font-medium ${r.status === 'completed' ? 'text-[#25D695]' : 'text-[#f99d07]'}`}>
                      {r.status === 'completed' ? '✓ Completed' : '⏳ Processing'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Big CTA */}
          <button
            onClick={() => setShowRedemption(true)}
            className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-[#25D695]/10 to-[#00b8f0]/10 border border-[#25D695]/20 text-center hover:from-[#25D695]/15 hover:to-[#00b8f0]/15 transition-all"
          >
            <div className="text-lg font-bold text-[#25D695]">{rewards.redeemableNow} credits</div>
            <div className="text-xs text-[#64748B] mt-0.5">
              ≈ ${(rewards.redeemableNow * 0.15).toFixed(2)} available to redeem
            </div>
          </button>
        </div>
      </div>

      {/* Redemption Flow Modal */}
      <RedemptionFlow
        isOpen={showRedemption}
        onClose={() => setShowRedemption(false)}
        availableCredits={rewards.redeemableNow}
      />
    </div>
  );
}
