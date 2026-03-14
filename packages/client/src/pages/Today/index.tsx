/**
 * Today — The default Apple Health-style dashboard.
 * "I can understand my water & energy impact in 10 seconds."
 */
import { Link } from 'react-router-dom';
import { TripleScoreRings, MetricCard, RecommendationList } from '@/components/health';
import {
  generateUserScores, generateUsageMetrics, generateRecommendations,
  generateRecentActivity, generateDailyTips,
} from '@/mock/generators/health';
import {
  Droplets, Zap, Award, Leaf, ArrowRight, Flame,
  CheckCircle2, Gift, TrendingUp, Lightbulb,
} from 'lucide-react';

const scores = generateUserScores();
const usage = generateUsageMetrics();
const recommendations = generateRecommendations();
const recentActivity = generateRecentActivity();
const tips = generateDailyTips();
const todayTip = tips[Math.floor(Date.now() / 86400000) % tips.length];

const activityIcons = {
  verification: CheckCircle2,
  reward: Gift,
  score: TrendingUp,
  tip: Lightbulb,
};
const activityColors = {
  verification: '#25D695',
  reward: '#f99d07',
  score: '#00b8f0',
  tip: '#A78BFA',
};

export default function Today() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Good {getGreeting()}</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Here's your water & energy impact today
        </p>
      </div>

      {/* Score Rings */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6">
        <TripleScoreRings
          waterScore={scores.waterScore}
          energyScore={scores.energyScore}
          impactScore={scores.impactScore}
          waterDelta={scores.waterDelta}
          energyDelta={scores.energyDelta}
          impactDelta={scores.impactDelta}
        />
        <div className="text-center mt-2">
          <Link
            to="/scores"
            className="text-xs text-[#25D695] hover:text-[#1FBF84] transition-colors inline-flex items-center gap-1"
          >
            View detailed scores <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          value={usage.gallonsSaved.toLocaleString()}
          label="Gallons Saved"
          delta={usage.gallonsDelta}
          deltaDirection="up"
          color="#00b8f0"
          icon={<Droplets size={16} className="text-[#00b8f0]" />}
        />
        <MetricCard
          value={usage.kwhReduced.toLocaleString()}
          label="kWh Reduced"
          delta={usage.kwhDelta}
          deltaDirection="up"
          color="#f99d07"
          icon={<Zap size={16} className="text-[#f99d07]" />}
        />
        <MetricCard
          value={usage.creditsEarned.toLocaleString()}
          label="Credits Earned"
          delta={usage.creditsDelta}
          deltaDirection="up"
          color="#25D695"
          icon={<Award size={16} className="text-[#25D695]" />}
        />
        <MetricCard
          value={`${usage.co2Avoided} tons`}
          label="CO₂ Avoided"
          delta={usage.co2Delta}
          deltaDirection="up"
          color="#A78BFA"
          icon={<Leaf size={16} className="text-[#A78BFA]" />}
        />
      </div>

      {/* Two column: Recommendations + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {/* Recommendations */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <RecommendationList
            recommendations={recommendations}
            limit={3}
            title="Improve Your Score"
          />
          <Link
            to="/improve"
            className="flex items-center gap-1 text-xs text-[#25D695] hover:text-[#1FBF84] mt-4 transition-colors"
          >
            See all recommendations <ArrowRight size={12} />
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 6).map(event => {
              const Icon = activityIcons[event.type];
              const color = activityColors[event.type];
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${color}12` }}
                  >
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-white/80">{event.text}</div>
                    <div className="text-[10px] text-[#475569] mt-0.5">{event.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Streak + Tip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Streak */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#25D695]/[0.08] to-transparent border border-[#25D695]/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#25D695]/15 flex items-center justify-center">
              <Flame size={20} className="text-[#25D695]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{usage.streakDays} days</div>
              <div className="text-xs text-[#64748B]">Verification streak</div>
            </div>
          </div>
          <div className="text-xs text-[#25D695]/80 mt-1">Keep it going! Next milestone: 30 days</div>
        </div>

        {/* Daily Tip */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-[#f99d07]" />
            <span className="text-xs font-medium text-[#f99d07]">Daily Tip</span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{todayTip.text}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/rewards"
          className="px-5 py-2.5 rounded-xl bg-[#25D695] text-white text-sm font-medium hover:bg-[#1FBF84] transition-colors"
        >
          Redeem Rewards
        </Link>
        <Link
          to="/vault"
          className="px-5 py-2.5 rounded-xl bg-white/[0.06] text-white/80 text-sm font-medium hover:bg-white/[0.1] transition-colors"
        >
          View Vault
        </Link>
        <Link
          to="/scores"
          className="px-5 py-2.5 rounded-xl bg-white/[0.06] text-white/80 text-sm font-medium hover:bg-white/[0.1] transition-colors"
        >
          Score Details
        </Link>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
