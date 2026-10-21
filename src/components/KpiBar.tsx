import React from 'react';
import { MarketRegime, ModelPerformanceMetrics } from '../types/stock';
import { TrendingUp, TrendingDown, ShieldAlert, Cpu } from 'lucide-react';

interface KpiBarProps {
  ticker: string;
  companyName: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  regime: MarketRegime;
  improvedMetrics: ModelPerformanceMetrics;
  baselineRmse: number;
  volatility: number;
  rsi: number;
}

export const KpiBar: React.FC<KpiBarProps> = ({
  ticker,
  companyName,
  currentPrice,
  dayChange,
  dayChangePercent,
  regime,
  improvedMetrics,
  baselineRmse,
  volatility,
  rsi,
}) => {
  const isPositive = dayChange >= 0;
  const rmseReduction =
    baselineRmse > 0
      ? ((baselineRmse - improvedMetrics.rmse) / baselineRmse) * 100
      : 0;

  const getRegimeLabel = (r: MarketRegime) => {
    switch (r) {
      case 'BULLISH_EXPANSION':
        return 'Bullish Expansion';
      case 'BEARISH_CONTRACTION':
        return 'Bearish Contraction';
      case 'HIGH_VOLATILITY_BREAKOUT':
        return 'High Volatility Breakout';
      case 'RANGE_BOUND_CONSOLIDATION':
      default:
        return 'Range-Bound Consolidation';
    }
  };

  const getRsiStatus = (val: number) => {
    if (val >= 70) return 'Overbought';
    if (val <= 30) return 'Oversold';
    return 'Neutral Band';
  };

  return (
    <div className="bg-[#0f172a] border-b border-slate-800 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Asset Headline */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                {ticker}
              </span>
              <span className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-none">
                {companyName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Market Regime:</span>
              <span className="text-slate-200 font-medium">
                {getRegimeLabel(regime)}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Financial Telemetry Grid */}
        <div className="flex flex-wrap items-center gap-6 text-xs">
          {/* Last Price */}
          <div className="border-l border-slate-800/80 pl-4">
            <span className="text-slate-400 block text-[11px] mb-0.5">Last Price</span>
            <div className="flex items-center gap-1.5 font-mono tabular-nums">
              <span className="text-base font-bold text-white">
                ${currentPrice.toFixed(2)}
              </span>
              <span
                className={`flex items-center text-xs font-semibold ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                )}
                {isPositive ? '+' : ''}
                {dayChange.toFixed(2)} ({isPositive ? '+' : ''}
                {dayChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Improvised Model Directional Accuracy */}
          <div className="border-l border-slate-800/80 pl-4">
            <span className="text-slate-400 block text-[11px] mb-0.5">
              Directional Hit Ratio
            </span>
            <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-base font-bold text-emerald-400">
                {improvedMetrics.directionalAccuracy.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400">
                vs 50% baseline
              </span>
            </div>
          </div>

          {/* Variance Reduction vs Naive */}
          <div className="border-l border-slate-800/80 pl-4 hidden sm:block">
            <span className="text-slate-400 block text-[11px] mb-0.5">
              RMSE Error Reduction
            </span>
            <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-base font-bold text-cyan-400">
                -{rmseReduction.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400">
                vs naive lag
              </span>
            </div>
          </div>

          {/* Volatility & RSI */}
          <div className="border-l border-slate-800/80 pl-4 hidden md:block">
            <span className="text-slate-400 block text-[11px] mb-0.5">
              20D Vol · RSI (14)
            </span>
            <div className="flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-sm font-semibold text-slate-200">
                {(volatility * 100).toFixed(1)}% vol
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-sm font-semibold text-slate-300">
                {rsi.toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-400">
                ({getRsiStatus(rsi)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
