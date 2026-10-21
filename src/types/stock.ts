export interface Candle {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change?: number;
  changePercent?: number;
}

export interface TechnicalIndicators {
  sma20: (number | null)[];
  sma50: (number | null)[];
  ema9: (number | null)[];
  ema21: (number | null)[];
  rsi14: (number | null)[];
  macdLine: (number | null)[];
  macdSignal: (number | null)[];
  macdHist: (number | null)[];
  bbUpper: (number | null)[];
  bbLower: (number | null)[];
  bbMiddle: (number | null)[];
  atr14: (number | null)[];
  obv: (number | null)[];
  volatility20: (number | null)[];
}

export type MarketRegime =
  | 'BULLISH_EXPANSION'
  | 'BEARISH_CONTRACTION'
  | 'HIGH_VOLATILITY_BREAKOUT'
  | 'RANGE_BOUND_CONSOLIDATION';

export interface ModelPerformanceMetrics {
  rmse: number;
  mae: number;
  mape: number;
  directionalAccuracy: number; // percentage (0-100)
  rSquared: number;
  theilU: number; // < 1 means beats naive random walk
  sharpeRatio: number;
  maxDrawdown: number;
}

export interface ModelComparisonResult {
  baselineNaive: ModelPerformanceMetrics;
  baselineLinearAR: ModelPerformanceMetrics;
  baselineNeuralProxy: ModelPerformanceMetrics;
  improvisedEnsemble: ModelPerformanceMetrics;
  improvementOverNaivePct: number;
  improvementOverLinearPct: number;
  directionalGainPct: number;
}

export interface ForecastPoint {
  date: string;
  timestamp: number;
  predictedPrice: number;
  upper80: number;
  lower80: number;
  upper95: number;
  lower95: number;
  baselinePrediction: number;
}

export interface FeatureAttribution {
  feature: string;
  weight: number; // 0-100
  correlation: number;
  description: string;
}

export interface BacktestFitPoint {
  date: string;
  actual: number;
  naivePredict: number;
  linearPredict: number;
  neuralPredict: number;
  improvisedPredict: number;
  residual: number; // actual - improvisedPredict
}

export interface PredictionEngineOutput {
  ticker: string;
  companyName: string;
  currentPrice: number;
  regime: MarketRegime;
  indicators: TechnicalIndicators;
  backtestResults: BacktestFitPoint[];
  metrics: ModelComparisonResult;
  forecastPoints: ForecastPoint[];
  featureAttributions: FeatureAttribution[];
  residuals: number[];
  hyperparameters: {
    lookbackDays: number;
    horizonDays: number;
    trainSplitRatio: number;
    ensembleMode: 'Performance-Weighted' | 'Volatility-Adaptive' | 'Equal';
  };
}

export interface QuantReport {
  executiveSummary: string;
  regimeDiagnosis: string;
  modelAblationInsight: string;
  factorAttribution: Array<{ factor: string; weight: string; impact: string }>;
  scenarios: {
    bullCase: { target: number; probability: string; catalyst: string };
    baseCase: { target: number; probability: string; catalyst: string };
    bearCase: { target: number; probability: string; catalyst: string };
  };
  riskAssessment: string;
  academicMethodologyNote: string;
}
