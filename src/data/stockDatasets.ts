import { Candle } from '../types/stock';

export interface StockProfile {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
  basePrice: number;
  annualDrift: number;
  annualVol: number;
  description: string;
}

export const STOCK_PROFILES: Record<string, StockProfile> = {
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Semiconductors & AI Hardware',
    exchange: 'NASDAQ',
    basePrice: 128.5,
    annualDrift: 0.45,
    annualVol: 0.42,
    description: 'Leading producer of accelerated computing GPUs powering AI data centers and generative model training.',
  },
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Consumer Electronics & Software',
    exchange: 'NASDAQ',
    basePrice: 226.4,
    annualDrift: 0.18,
    annualVol: 0.21,
    description: 'Global technology giant known for iPhone, Mac ecosystem, and proprietary Apple Silicon hardware.',
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    sector: 'Automotive & Clean Energy',
    exchange: 'NASDAQ',
    basePrice: 218.2,
    annualDrift: 0.28,
    annualVol: 0.52,
    description: 'Electric vehicle manufacturer, autonomy pioneer, and grid-scale energy storage provider.',
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Enterprise Software & Cloud',
    exchange: 'NASDAQ',
    basePrice: 422.8,
    annualDrift: 0.22,
    annualVol: 0.23,
    description: 'Provider of Microsoft Azure cloud computing, Windows, Office 365, and enterprise AI Copilot platforms.',
  },
  AMZN: {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    sector: 'E-Commerce & Cloud Computing',
    exchange: 'NASDAQ',
    basePrice: 184.6,
    annualDrift: 0.24,
    annualVol: 0.28,
    description: 'Global e-commerce marketplace and operator of Amazon Web Services (AWS) infrastructure.',
  },
  GOOGL: {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Internet Content & Cloud',
    exchange: 'NASDAQ',
    basePrice: 165.7,
    annualDrift: 0.20,
    annualVol: 0.25,
    description: 'Parent entity of Google Search, YouTube, Android, and Google DeepMind artificial intelligence.',
  },
  SPY: {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    sector: 'Broad Market Equity Index',
    exchange: 'NYSE Arca',
    basePrice: 564.2,
    annualDrift: 0.12,
    annualVol: 0.14,
    description: 'The world’s most liquid exchange-traded fund tracking the benchmark S&P 500 index of US corporations.',
  },
  QQQ: {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust (Nasdaq 100)',
    sector: 'Large-Cap Technology ETF',
    exchange: 'NASDAQ',
    basePrice: 486.3,
    annualDrift: 0.16,
    annualVol: 0.19,
    description: 'Benchmark ETF tracking the 100 largest non-financial corporations listed on the Nasdaq stock market.',
  },
};

/**
 * Generates realistic deterministic geometric Brownian motion time series with mean-reverting cyclical jumps
 * for a fixed seed so data is reliable, persistent, and has authentic market microstructure.
 */
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateHistoricalStockData(
  profile: StockProfile,
  tradingDays = 260
): Candle[] {
  // Use ticker characters as seed
  let seed = 1337;
  for (let i = 0; i < profile.ticker.length; i++) {
    seed = seed * 31 + profile.ticker.charCodeAt(i);
  }
  const rand = pseudoRandom(seed);

  const candles: Candle[] = [];
  const endDate = new Date('2026-10-18T16:00:00Z');
  const dt = 1 / 252;
  const mu = profile.annualDrift;
  const sigma = profile.annualVol;

  let currentPrice = profile.basePrice * (1 - mu * 0.7); // start lower to simulate 1-year growth
  const baseVolume = profile.ticker === 'NVDA' || profile.ticker === 'TSLA' ? 45000000 : 25000000;

  // Generate backwards date array of weekdays
  const dates: Date[] = [];
  const curr = new Date(endDate);
  while (dates.length < tradingDays) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) {
      dates.unshift(new Date(curr));
    }
    curr.setDate(curr.getDate() - 1);
  }

  for (let i = 0; i < tradingDays; i++) {
    const d = dates[i];
    const dateStr = d.toISOString().split('T')[0];

    // Standard normal via Box-Muller
    const u1 = Math.max(0.000001, rand());
    const u2 = rand();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Cyclical micro-regimes: sine wave earnings cycles + occasional shock
    const cycle = Math.sin((i / tradingDays) * Math.PI * 4) * 0.003;
    const shockChance = rand();
    const shock = shockChance > 0.96 ? (rand() - 0.48) * 0.04 : 0;

    const returnPct = (mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z + cycle + shock;
    const open = currentPrice;
    const close = Math.max(1, currentPrice * Math.exp(returnPct));

    const intradayNoise = rand() * 0.012 + 0.004;
    const high = Math.max(open, close) * (1 + intradayNoise);
    const low = Math.min(open, close) * (1 - intradayNoise * (0.8 + rand() * 0.4));

    const volumeMultiplier = 0.6 + rand() * 0.8 + Math.abs(returnPct) * 15;
    const volume = Math.round(baseVolume * volumeMultiplier);

    const prevClose = i > 0 ? candles[i - 1].close : open;
    const change = close - prevClose;
    const changePercent = (change / prevClose) * 100;

    candles.push({
      date: dateStr,
      timestamp: d.getTime(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Robust CSV Parser for user-uploaded stock datasets
 */
export function parseStockCSV(csvText: string): {
  success: boolean;
  candles?: Candle[];
  error?: string;
} {
  try {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 15) {
      return {
        success: false,
        error: 'CSV contains fewer than 15 rows. At least 30 rows of daily data are recommended for analytics.',
      };
    }

    const header = lines[0].toLowerCase().split(/[,\t]/).map((h) => h.replace(/["']/g, '').trim());

    // Map column indices
    const dateIdx = header.findIndex((h) => h.includes('date') || h.includes('time'));
    const openIdx = header.findIndex((h) => h === 'open' || h.includes('open'));
    const highIdx = header.findIndex((h) => h === 'high' || h.includes('high'));
    const lowIdx = header.findIndex((h) => h === 'low' || h.includes('low'));
    const closeIdx = header.findIndex(
      (h) => h === 'close' || h === 'adj close' || h.includes('close') || h === 'price'
    );
    const volIdx = header.findIndex((h) => h.includes('vol') || h.includes('shares'));

    if (closeIdx === -1) {
      return {
        success: false,
        error: "Missing required 'Close' price column in CSV header.",
      };
    }

    const candles: Candle[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/[,\t]/).map((p) => p.replace(/["']/g, '').trim());
      if (parts.length <= closeIdx) continue;

      const rawClose = parseFloat(parts[closeIdx]);
      if (isNaN(rawClose) || rawClose <= 0) continue;

      const rawDate = dateIdx !== -1 && parts[dateIdx] ? parts[dateIdx] : `2026-01-${String(i).padStart(2, '0')}`;
      const rawOpen = openIdx !== -1 && !isNaN(parseFloat(parts[openIdx])) ? parseFloat(parts[openIdx]) : rawClose;
      const rawHigh = highIdx !== -1 && !isNaN(parseFloat(parts[highIdx])) ? parseFloat(parts[highIdx]) : Math.max(rawOpen, rawClose) * 1.01;
      const rawLow = lowIdx !== -1 && !isNaN(parseFloat(parts[lowIdx])) ? parseFloat(parts[lowIdx]) : Math.min(rawOpen, rawClose) * 0.99;
      const rawVol = volIdx !== -1 && !isNaN(parseFloat(parts[volIdx])) ? Math.round(parseFloat(parts[volIdx])) : 1000000;

      const dObj = new Date(rawDate);
      const timestamp = isNaN(dObj.getTime()) ? Date.now() - (lines.length - i) * 86400000 : dObj.getTime();
      const dateStr = !isNaN(dObj.getTime()) ? dObj.toISOString().split('T')[0] : rawDate;

      const prev = candles.length > 0 ? candles[candles.length - 1].close : rawOpen;
      const chg = rawClose - prev;
      const chgPct = (chg / prev) * 100;

      candles.push({
        date: dateStr,
        timestamp,
        open: Number(rawOpen.toFixed(2)),
        high: Number(rawHigh.toFixed(2)),
        low: Number(rawLow.toFixed(2)),
        close: Number(rawClose.toFixed(2)),
        volume: rawVol,
        change: Number(chg.toFixed(2)),
        changePercent: Number(chgPct.toFixed(2)),
      });
    }

    // Sort chronologically if needed
    candles.sort((a, b) => a.timestamp - b.timestamp);

    if (candles.length < 15) {
      return {
        success: false,
        error: 'Failed to extract valid numerical rows from CSV.',
      };
    }

    return { success: true, candles };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to parse CSV dataset.',
    };
  }
}

/**
 * Exports current dataset or predictions to downloadable CSV string
 */
export function generateCSVExport(
  candles: Candle[],
  predictions?: Array<{ date: string; predictedPrice: number; upper95: number; lower95: number }>
): string {
  if (predictions && predictions.length > 0) {
    const headers = ['Date', 'Historical_Close', 'Improvised_Model_Prediction', 'Upper_95_CI', 'Lower_95_CI'];
    const rows = candles.map((c) => [c.date, c.close.toFixed(2), '', '', '']);
    predictions.forEach((p) => {
      rows.push([p.date, '', p.predictedPrice.toFixed(2), p.upper95.toFixed(2), p.lower95.toFixed(2)]);
    });
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume', 'Change', 'ChangePercent'];
  const rows = candles.map((c) => [
    c.date,
    c.open.toFixed(2),
    c.high.toFixed(2),
    c.low.toFixed(2),
    c.close.toFixed(2),
    c.volume,
    (c.change ?? 0).toFixed(2),
    (c.changePercent ?? 0).toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
