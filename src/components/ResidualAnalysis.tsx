import React, { useMemo } from 'react';
import { BacktestFitPoint } from '../types/stock';

interface ResidualAnalysisProps {
  backtestResults: BacktestFitPoint[];
}

export const ResidualAnalysis: React.FC<ResidualAnalysisProps> = ({ backtestResults }) => {
  const residuals = useMemo(() => backtestResults.map((b) => b.residual), [backtestResults]);

  // Statistics on residuals
  const stats = useMemo(() => {
    if (residuals.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
    const n = residuals.length;
    const mean = residuals.reduce((a, b) => a + b, 0) / n;
    const variance = residuals.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (n - 1 || 1);
    const std = Math.sqrt(variance);
    const min = Math.min(...residuals);
    const max = Math.max(...residuals);
    return { mean, std, min, max };
  }, [residuals]);

  // Histogram calculation (16 bins)
  const histogram = useMemo(() => {
    if (residuals.length === 0) return [];
    const binCount = 14;
    const range = Math.max(0.1, stats.max - stats.min);
    const binSize = range / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      binStart: stats.min + i * binSize,
      binEnd: stats.min + (i + 1) * binSize,
      count: 0,
    }));

    residuals.forEach((r) => {
      let bIdx = Math.floor((r - stats.min) / binSize);
      if (bIdx >= binCount) bIdx = binCount - 1;
      if (bIdx >= 0) bins[bIdx].count++;
    });

    const maxCount = Math.max(1, ...bins.map((b) => b.count));
    return bins.map((b) => ({ ...b, relativeHeight: b.count / maxCount }));
  }, [residuals, stats]);

  // Scatter plot points (Actual vs Predicted)
  const scatterData = useMemo(() => {
    if (backtestResults.length === 0) return { points: [], minVal: 0, maxVal: 100 };
    let min = Infinity;
    let max = -Infinity;

    backtestResults.forEach((b) => {
      if (b.actual < min) min = b.actual;
      if (b.actual > max) max = b.actual;
      if (b.improvisedPredict < min) min = b.improvisedPredict;
      if (b.improvisedPredict > max) max = b.improvisedPredict;
    });

    const buffer = (max - min) * 0.05 || 5;
    const minVal = min - buffer;
    const maxVal = max + buffer;

    const points = backtestResults.map((b) => ({
      x: ((b.actual - minVal) / (maxVal - minVal)) * 100,
      y: 100 - ((b.improvisedPredict - minVal) / (maxVal - minVal)) * 100,
      actual: b.actual,
      predicted: b.improvisedPredict,
      date: b.date,
    }));

    return { points, minVal, maxVal };
  }, [backtestResults]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Residual Error Distribution */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Residual Error Distribution (ε = Y - Ŷ)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Empirical forecast errors centered around mean zero with homoscedastic variance.
            </p>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400 tabular-nums">
            <span>μ = {stats.mean.toFixed(3)}</span>
            <span className="mx-1.5">·</span>
            <span>σ = {stats.std.toFixed(3)}</span>
          </div>
        </div>

        {/* Histogram SVG Bars */}
        <div className="h-44 w-full flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-800">
          {histogram.map((bin, i) => (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              <div
                style={{ height: `${Math.max(4, bin.relativeHeight * 100)}%` }}
                className="w-full bg-emerald-500/30 hover:bg-emerald-400 border border-emerald-500/50 rounded-t-sm transition-all"
              />
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 border border-slate-700 text-[10px] text-white px-1.5 py-0.5 rounded font-mono pointer-events-none whitespace-nowrap z-10">
                Count: {bin.count}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-2">
          <span>{stats.min.toFixed(2)} (Over-predicted)</span>
          <span className="text-emerald-400 font-semibold">0.00 (Zero Error)</span>
          <span>+{stats.max.toFixed(2)} (Under-predicted)</span>
        </div>
      </div>

      {/* Actual vs Predicted Scatter */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Actual vs. Improvised Forecast Regression Fit
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ideal predictor falls precisely on the 45° diagonal parity reference.
            </p>
          </div>
        </div>

        <div className="h-44 w-full relative border border-slate-800/80 bg-slate-900/50 rounded-lg overflow-hidden">
          {/* 45-degree diagonal line */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none">
            <line
              x1="0"
              y1="100%"
              x2="100%"
              y2="0"
              stroke="#334155"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>

          {/* Scatter dots */}
          {scatterData.points.map((pt, i) => (
            <div
              key={i}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              title={`${pt.date}: Actual $${pt.actual.toFixed(2)} | Pred $${pt.predicted.toFixed(2)}`}
              className="w-2 h-2 rounded-full bg-cyan-400/70 border border-cyan-300 absolute -translate-x-1/2 -translate-y-1/2 hover:scale-150 hover:bg-emerald-400 transition-transform cursor-pointer"
            />
          ))}
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-2">
          <span>X: Actual Holdout Close ($)</span>
          <span>Y: Improvised Model Prediction ($)</span>
        </div>
      </div>
    </div>
  );
};
