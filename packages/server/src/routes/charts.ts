import { Router } from 'express';
import { generateOHLCV, generateSparkline, generateActivityFeed } from '../mock/chartData.js';

export const chartsRouter = Router();

// OHLCV candlestick data
chartsRouter.get('/ohlcv/:pair', (req, res) => {
  const pair = decodeURIComponent(req.params.pair);
  const candles = generateOHLCV(pair);
  res.json({ data: candles, pair });
});

// Sparkline (7-day price array)
chartsRouter.get('/sparkline/:token', (req, res) => {
  const sparkline = generateSparkline(req.params.token);
  res.json({ data: sparkline, token: req.params.token });
});

// Activity feed
chartsRouter.get('/activity', (_req, res) => {
  const events = generateActivityFeed(30);
  res.json({ data: events });
});
