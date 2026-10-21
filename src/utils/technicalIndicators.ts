import { Candle, TechnicalIndicators } from '../types/stock';

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  let initialSMA = 0;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      initialSMA += data[i];
      result.push(null);
    } else if (i === period - 1) {
      initialSMA += data[i];
      const sma = initialSMA / period;
      result.push(sma);
    } else {
      const prevEMA = result[i - 1] as number;
      const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA;
      result.push(currentEMA);
    }
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI) using Wilder's smoothing
 */
export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (closes.length <= period) {
    return closes.map(() => null);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }

    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i < period) {
        result.push(null);
      } else {
        avgGain = avgGain / period;
        avgLoss = avgLoss / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        result.push(rsi);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      result.push(rsi);
    }
  }

  return result;
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macdLine: (number | null)[];
  macdSignal: (number | null)[];
  macdHist: (number | null)[];
} {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== null && s !== null) {
      macdLine.push(f - s);
    } else {
      macdLine.push(null);
    }
  }

  // Calculate signal line (9-period EMA of MACD Line)
  const validMacdValues: number[] = [];
  const validIndices: number[] = [];
  macdLine.forEach((val, idx) => {
    if (val !== null) {
      validMacdValues.push(val);
      validIndices.push(idx);
    }
  });

  const signalEMA = calculateEMA(validMacdValues, signalPeriod);
  const macdSignal: (number | null)[] = new Array(closes.length).fill(null);
  const macdHist: (number | null)[] = new Array(closes.length).fill(null);

  signalEMA.forEach((sigVal, idx) => {
    const originalIdx = validIndices[idx];
    macdSignal[originalIdx] = sigVal;
    const macdVal = macdLine[originalIdx];
    if (macdVal !== null && sigVal !== null) {
      macdHist[originalIdx] = macdVal - sigVal;
    }
  });

  return { macdLine, macdSignal, macdHist };
}

/**
 * Calculates Bollinger Bands (20, 2 stdev)
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdevMultiplier = 2
): {
  bbUpper: (number | null)[];
  bbLower: (number | null)[];
  bbMiddle: (number | null)[];
} {
  const bbMiddle = calculateSMA(closes, period);
  const bbUpper: (number | null)[] = [];
  const bbLower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    const mid = bbMiddle[i];
    if (mid === null || i < period - 1) {
      bbUpper.push(null);
      bbLower.push(null);
    } else {
      let varianceSum = 0;
      for (let j = 0; j < period; j++) {
        varianceSum += Math.pow(closes[i - j] - mid, 2);
      }
      const stdev = Math.sqrt(varianceSum / period);
      bbUpper.push(mid + stdevMultiplier * stdev);
      bbLower.push(mid - stdevMultiplier * stdev);
    }
  }

  return { bbUpper, bbLower, bbMiddle };
}

/**
 * Calculates Average True Range (ATR 14)
 */
export function calculateATR(candles: Candle[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const trueRanges: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trueRanges.push(candles[i].high - candles[i].low);
    } else {
      const prevClose = candles[i - 1].close;
      const currentHigh = candles[i].high;
      const currentLow = candles[i].low;
      const tr = Math.max(
        currentHigh - currentLow,
        Math.abs(currentHigh - prevClose),
        Math.abs(currentLow - prevClose)
      );
      trueRanges.push(tr);
    }
  }

  let atrAcc = 0;
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      atrAcc += trueRanges[i];
      result.push(null);
    } else if (i === period - 1) {
      atrAcc += trueRanges[i];
      result.push(atrAcc / period);
    } else {
      const prevATR = result[i - 1] as number;
      const currentATR = (prevATR * (period - 1) + trueRanges[i]) / period;
      result.push(currentATR);
    }
  }

  return result;
}

/**
 * Calculates On-Balance Volume (OBV)
 */
export function calculateOBV(candles: Candle[]): (number | null)[] {
  const obv: (number | null)[] = [];
  let currentOBV = 0;

  candles.forEach((c, i) => {
    if (i === 0) {
      currentOBV = c.volume;
    } else {
      if (c.close > candles[i - 1].close) {
        currentOBV += c.volume;
      } else if (c.close < candles[i - 1].close) {
        currentOBV -= c.volume;
      }
    }
    obv.push(currentOBV);
  });

  return obv;
}

/**
 * Calculates Rolling 20-Day Annualized Volatility
 */
export function calculateHistoricalVolatility(closes: number[], period = 20): (number | null)[] {
  const result: (number | null)[] = [];
  const logReturns: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      logReturns.push(0);
      result.push(null);
    } else {
      const ret = Math.log(closes[i] / closes[i - 1]);
      logReturns.push(ret);
      if (i < period) {
        result.push(null);
      } else {
        let mean = 0;
        for (let j = 0; j < period; j++) {
          mean += logReturns[i - j];
        }
        mean = mean / period;

        let variance = 0;
        for (let j = 0; j < period; j++) {
          variance += Math.pow(logReturns[i - j] - mean, 2);
        }
        const dailyStd = Math.sqrt(variance / (period - 1));
        const annualizedVol = dailyStd * Math.sqrt(252);
        result.push(annualizedVol);
      }
    }
  }

  return result;
}

/**
 * Comprehensive indicator pack generator
 */
export function computeAllIndicators(candles: Candle[]): TechnicalIndicators {
  const closes = candles.map((c) => c.close);

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const rsi14 = calculateRSI(closes, 14);
  const { macdLine, macdSignal, macdHist } = calculateMACD(closes);
  const { bbUpper, bbLower, bbMiddle } = calculateBollingerBands(closes);
  const atr14 = calculateATR(candles, 14);
  const obv = calculateOBV(candles);
  const volatility20 = calculateHistoricalVolatility(closes, 20);

  return {
    sma20,
    sma50,
    ema9,
    ema21,
    rsi14,
    macdLine,
    macdSignal,
    macdHist,
    bbUpper,
    bbLower,
    bbMiddle,
    atr14,
    obv,
    volatility20,
  };
}
