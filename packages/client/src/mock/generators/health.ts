/**
 * Health mock data — scores, rewards, recommendations, verification steps.
 * Powers the customer-first "Apple Health" experience.
 */
import type { Recommendation } from '@/components/health/RecommendationList';
import type { VerificationStep } from '@/components/health/ReceiptViewer';

// ─── Score Data ────────────────────────────────────────────

export interface UserScores {
  waterScore: number;
  energyScore: number;
  impactScore: number;
  waterDelta: string;
  energyDelta: string;
  impactDelta: string;
  waterHistory: number[];
  energyHistory: number[];
  impactHistory: number[];
}

export interface ScoreDriver {
  id: string;
  label: string;
  impact: number;        // points attributed
  category: 'water' | 'energy';
  direction: 'up' | 'down';
}

export function generateUserScores(): UserScores {
  return {
    waterScore: 74,
    energyScore: 68,
    impactScore: 71,
    waterDelta: '↑ 3 this week',
    energyDelta: '↑ 5 this week',
    impactDelta: '↑ 4 this week',
    waterHistory:  [58, 61, 63, 65, 67, 69, 70, 71, 72, 73, 73, 74],
    energyHistory: [52, 54, 55, 58, 60, 61, 62, 63, 65, 66, 67, 68],
    impactHistory: [55, 58, 59, 62, 64, 65, 66, 67, 69, 70, 70, 71],
  };
}

export function generateScoreDrivers(): ScoreDriver[] {
  return [
    { id: 'd1', label: 'Reduced daily water usage by 12%', impact: 8, category: 'water', direction: 'up' },
    { id: 'd2', label: 'Smart meter detected efficient appliance cycle', impact: 5, category: 'energy', direction: 'up' },
    { id: 'd3', label: 'Verified 3 consecutive monthly bills', impact: 4, category: 'water', direction: 'up' },
    { id: 'd4', label: 'Peak-hour energy usage slightly above average', impact: -2, category: 'energy', direction: 'down' },
    { id: 'd5', label: 'Greywater recycling system connected', impact: 6, category: 'water', direction: 'up' },
  ];
}

// ─── Usage Metrics ─────────────────────────────────────────

export interface UsageMetrics {
  gallonsSaved: number;
  gallonsDelta: string;
  kwhReduced: number;
  kwhDelta: string;
  creditsEarned: number;
  creditsDelta: string;
  co2Avoided: number;
  co2Delta: string;
  treesEquivalent: number;
  streakDays: number;
}

export function generateUsageMetrics(): UsageMetrics {
  return {
    gallonsSaved: 12_840,
    gallonsDelta: '+1,200 this month',
    kwhReduced: 3_450,
    kwhDelta: '+380 this month',
    creditsEarned: 847,
    creditsDelta: '+62 this month',
    co2Avoided: 2.4,
    co2Delta: '+0.3 tons this month',
    treesEquivalent: 14,
    streakDays: 23,
  };
}

// ─── Recommendations ───────────────────────────────────────

export function generateRecommendations(): Recommendation[] {
  return [
    {
      id: 'r1',
      title: 'Install a low-flow showerhead',
      description: 'Reduces water usage by up to 40% per shower without losing pressure.',
      impact: '+5 pts',
      category: 'water',
      difficulty: 'easy',
      estimatedSaving: '$8/mo',
    },
    {
      id: 'r2',
      title: 'Shift laundry to off-peak hours',
      description: 'Running appliances during off-peak hours reduces energy costs and grid strain.',
      impact: '+3 pts',
      category: 'energy',
      difficulty: 'easy',
      estimatedSaving: '$12/mo',
    },
    {
      id: 'r3',
      title: 'Connect a smart water meter',
      description: 'Real-time monitoring helps detect leaks early and improves your verification score.',
      impact: '+8 pts',
      category: 'water',
      difficulty: 'moderate',
      estimatedSaving: '$25/mo',
    },
    {
      id: 'r4',
      title: 'Seal air leaks around windows',
      description: 'Prevents heat loss in winter and keeps cool air in during summer.',
      impact: '+4 pts',
      category: 'energy',
      difficulty: 'moderate',
      estimatedSaving: '$15/mo',
    },
    {
      id: 'r5',
      title: 'Install a greywater recycling system',
      description: 'Reuse shower and laundry water for irrigation. Major long-term savings.',
      impact: '+12 pts',
      category: 'both',
      difficulty: 'advanced',
      estimatedSaving: '$40/mo',
    },
    {
      id: 'r6',
      title: 'Switch to LED lighting throughout',
      description: 'LEDs use 75% less energy than incandescent bulbs and last 25x longer.',
      impact: '+3 pts',
      category: 'energy',
      difficulty: 'easy',
      estimatedSaving: '$6/mo',
    },
    {
      id: 'r7',
      title: 'Fix running toilets',
      description: 'A running toilet can waste 200+ gallons per day. Quick fix, big impact.',
      impact: '+6 pts',
      category: 'water',
      difficulty: 'easy',
      estimatedSaving: '$30/mo',
    },
  ];
}

// ─── Rewards ───────────────────────────────────────────────

export interface RewardsData {
  totalCredits: number;
  pendingVerification: number;
  redeemableNow: number;
  lifetimeRedeemed: number;
  recentRedemptions: RedemptionRecord[];
  earningHistory: EarningRecord[];
}

export interface RedemptionRecord {
  id: string;
  amount: number;
  method: string;
  date: string;
  status: 'completed' | 'processing';
}

export interface EarningRecord {
  id: string;
  amount: number;
  reason: string;
  date: string;
  type: 'water' | 'energy' | 'bonus';
}

export function generateRewardsData(): RewardsData {
  return {
    totalCredits: 847,
    pendingVerification: 62,
    redeemableNow: 785,
    lifetimeRedeemed: 1_240,
    recentRedemptions: [
      { id: 'rd1', amount: 200, method: 'Nexus Wallet', date: 'Feb 18, 2026', status: 'completed' },
      { id: 'rd2', amount: 150, method: 'Gift Card', date: 'Jan 25, 2026', status: 'completed' },
      { id: 'rd3', amount: 100, method: 'Nexus Wallet', date: 'Jan 5, 2026', status: 'completed' },
    ],
    earningHistory: [
      { id: 'e1', amount: 35, reason: 'February water bill verified', date: 'Feb 28, 2026', type: 'water' },
      { id: 'e2', amount: 27, reason: 'February energy bill verified', date: 'Feb 27, 2026', type: 'energy' },
      { id: 'e3', amount: 15, reason: 'Smart meter data bonus', date: 'Feb 20, 2026', type: 'bonus' },
      { id: 'e4', amount: 32, reason: 'January water bill verified', date: 'Jan 31, 2026', type: 'water' },
      { id: 'e5', amount: 24, reason: 'January energy bill verified', date: 'Jan 30, 2026', type: 'energy' },
      { id: 'e6', amount: 50, reason: 'Onboarding bonus', date: 'Jan 15, 2026', type: 'bonus' },
      { id: 'e7', amount: 30, reason: 'December water bill verified', date: 'Dec 31, 2025', type: 'water' },
      { id: 'e8', amount: 22, reason: 'December energy bill verified', date: 'Dec 30, 2025', type: 'energy' },
    ],
  };
}

// ─── Verification Steps (plain English) ────────────────────

export function generateVerificationSteps(): VerificationStep[] {
  return [
    {
      id: 'v1',
      label: 'We received your March water bill',
      source: 'Utility / PDF upload',
      status: 'verified',
      timestamp: 'Mar 1, 2026 at 9:14 AM',
      technical: {
        txHash: '0x7a3f...e8b2',
        chain: 'XRPL',
        blockNumber: 84_291_037,
      },
    },
    {
      id: 'v2',
      label: 'Bill passed fraud detection checks',
      source: 'Nexus Oracle',
      status: 'verified',
      timestamp: 'Mar 1, 2026 at 9:15 AM',
      technical: {
        oracleSignature: 'sig_nexus_oracle_v3_2026_03',
        chain: 'XRPL',
      },
    },
    {
      id: 'v3',
      label: 'Usage verified against smart meter data',
      source: 'IoT Meter',
      status: 'verified',
      timestamp: 'Mar 1, 2026 at 9:16 AM',
      technical: {
        txHash: '0x3c1d...f4a7',
        chain: 'XRPL',
        blockNumber: 84_291_042,
      },
    },
    {
      id: 'v4',
      label: '35 impact credits issued to your account',
      source: 'Nexus Protocol',
      status: 'verified',
      timestamp: 'Mar 1, 2026 at 9:17 AM',
      technical: {
        txHash: '0x9e2b...c1d5',
        chain: 'XRPL',
        contractAddress: 'rNexusMintEngine...',
        blockNumber: 84_291_045,
      },
    },
    {
      id: 'v5',
      label: 'Receipt generated and stored',
      source: 'Nexus Vault',
      status: 'verified',
      timestamp: 'Mar 1, 2026 at 9:17 AM',
    },
  ];
}

// ─── Tips ──────────────────────────────────────────────────

export interface DailyTip {
  id: string;
  text: string;
  category: 'water' | 'energy' | 'general';
}

export function generateDailyTips(): DailyTip[] {
  return [
    { id: 't1', text: 'Turn off the tap while brushing your teeth — saves up to 8 gallons per day.', category: 'water' },
    { id: 't2', text: 'Unplug chargers when not in use. They draw power even when idle.', category: 'energy' },
    { id: 't3', text: 'Run your dishwasher only when full to save water and energy.', category: 'general' },
    { id: 't4', text: 'Use a rain barrel to collect water for gardening.', category: 'water' },
    { id: 't5', text: 'Set your thermostat 2° lower in winter and 2° higher in summer.', category: 'energy' },
  ];
}

// ─── Recent Activity (plain English) ───────────────────────

export interface RecentEvent {
  id: string;
  text: string;
  time: string;
  type: 'verification' | 'reward' | 'score' | 'tip';
}

export function generateRecentActivity(): RecentEvent[] {
  return [
    { id: 'a1', text: 'Your March water bill was verified', time: '2 hours ago', type: 'verification' },
    { id: 'a2', text: 'You earned 35 impact credits', time: '2 hours ago', type: 'reward' },
    { id: 'a3', text: 'Your Water Score improved to 74', time: '1 day ago', type: 'score' },
    { id: 'a4', text: 'February energy bill verified', time: '3 days ago', type: 'verification' },
    { id: 'a5', text: 'You earned 27 impact credits', time: '3 days ago', type: 'reward' },
    { id: 'a6', text: '23-day streak! Keep it up', time: '5 days ago', type: 'tip' },
    { id: 'a7', text: 'Smart meter sync completed', time: '1 week ago', type: 'verification' },
    { id: 'a8', text: 'You redeemed 200 credits to Nexus Wallet', time: '2 weeks ago', type: 'reward' },
  ];
}
