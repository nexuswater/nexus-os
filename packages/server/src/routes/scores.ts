/**
 * Scores API stubs — GET /scores/today, GET /scores/history, GET /recommendations
 */
import { Router } from 'express';

export const scoresRouter = Router();

/** Current day scores */
scoresRouter.get('/today', (_req, res) => {
  res.json({
    success: true,
    data: {
      waterScore: 74,
      energyScore: 68,
      impactScore: 71,
      waterDelta: 3,
      energyDelta: 5,
      impactDelta: 4,
      asOf: new Date().toISOString(),
    },
  });
});

/** Score history */
scoresRouter.get('/history', (req, res) => {
  const range = (req.query.range as string) || '30d';
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const waterHistory: number[] = [];
  const energyHistory: number[] = [];
  const impactHistory: number[] = [];

  for (let i = 0; i < days; i++) {
    waterHistory.push(Math.round(60 + Math.random() * 15));
    energyHistory.push(Math.round(55 + Math.random() * 15));
    impactHistory.push(Math.round(58 + Math.random() * 15));
  }

  res.json({
    success: true,
    data: {
      range,
      water: waterHistory,
      energy: energyHistory,
      impact: impactHistory,
    },
  });
});

/** Personalized recommendations */
scoresRouter.get('/recommendations', (_req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'r1',
        title: 'Install a low-flow showerhead',
        description: 'Reduces water usage by up to 40% per shower.',
        impact: '+5 pts',
        category: 'water',
        difficulty: 'easy',
        estimatedSaving: '$8/mo',
      },
      {
        id: 'r2',
        title: 'Shift laundry to off-peak hours',
        description: 'Running appliances during off-peak hours saves energy.',
        impact: '+3 pts',
        category: 'energy',
        difficulty: 'easy',
        estimatedSaving: '$12/mo',
      },
      {
        id: 'r3',
        title: 'Connect a smart water meter',
        description: 'Real-time monitoring improves verification and detects leaks.',
        impact: '+8 pts',
        category: 'water',
        difficulty: 'moderate',
        estimatedSaving: '$25/mo',
      },
    ],
  });
});
