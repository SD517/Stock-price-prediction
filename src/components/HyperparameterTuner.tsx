import React, { useState } from 'react';
import { Sliders, Play, RefreshCw, CheckCircle2 } from 'lucide-react';

interface HyperparameterTunerProps {
  lookbackDays: number;
  setLookbackDays: (days: number) => void;
  horizonDays: number;
  setHorizonDays: (days: number) => void;
  trainSplitRatio: number;
  setTrainSplitRatio: (ratio: number) => void;
  ensembleMode: 'Performance-Weighted' | 'Volatility-Adaptive' | 'Equal';
  setEnsembleMode: (mode: 'Performance-Weighted' | 'Volatility-Adaptive' | 'Equal') => void;
  onRetrain: () => void;
}

export const HyperparameterTuner: React.FC<HyperparameterTunerProps> = ({
  lookbackDays,
  setLookbackDays,
  horizonDays,
  setHorizonDays,
  trainSplitRatio,
  setTrainSplitRatio,
  ensembleMode,
  setEnsembleMode,
  onRetrain,
}) => {
  const [isTraining, setIsTraining] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<string | null>(null);

  const handleRunRetrain = async () => {
    setIsTraining(true);
    setPipelineStep('1/4: Feature Stationarization & Normalization');
    await new Promise((r) => setTimeout(r, 250));

    setPipelineStep('2/4: Multi-lag Cross-Validation Matrix');
    await new Promise((r) => setTimeout(r, 250));

    setPipelineStep('3/4: Kalman Error-Variance Weight Optimization');
    await new Promise((r) => setTimeout(r, 250));

    setPipelineStep('4/4: Forward Monte Carlo Projection');
    await new Promise((r) => setTimeout(r, 200));

    onRetrain();
    setIsTraining(false);
    setPipelineStep(null);
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Model Configuration & Hyperparameter Optimization
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust training memory depth, forecast window, and ensemble aggregation logic.
          </p>
        </div>

        <button
          onClick={handleRunRetrain}
          disabled={isTraining}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          {isTraining ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{pipelineStep}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Re-fit & Forecast</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
        {/* Lookback Window */}
        <div>
          <label className="text-slate-300 font-medium block mb-1.5">
            Lookback Window (Lag Depth)
          </label>
          <div className="grid grid-cols-4 gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {[7, 14, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setLookbackDays(d)}
                className={`py-1 text-center font-mono rounded transition-colors ${
                  lookbackDays === d
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Memory length for recurrent state
          </span>
        </div>

        {/* Forecast Horizon */}
        <div>
          <label className="text-slate-300 font-medium block mb-1.5">
            Forecast Horizon
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {[7, 14, 30].map((h) => (
              <button
                key={h}
                onClick={() => setHorizonDays(h)}
                className={`py-1 text-center font-mono rounded transition-colors ${
                  horizonDays === h
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {h} Days
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Forward projection trading days
          </span>
        </div>

        {/* Train / Holdout Split */}
        <div>
          <label className="text-slate-300 font-medium block mb-1.5">
            Train / Test Split Ratio
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {[
              { label: '70 / 30', val: 0.7 },
              { label: '80 / 20', val: 0.8 },
              { label: '85 / 15', val: 0.85 },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => setTrainSplitRatio(s.val)}
                className={`py-1 text-center font-mono rounded transition-colors ${
                  trainSplitRatio === s.val
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Out-of-sample backtest validation split
          </span>
        </div>

        {/* Dynamic Ensemble Weighting Mode */}
        <div>
          <label className="text-slate-300 font-medium block mb-1.5">
            Ensemble Weighting Engine
          </label>
          <select
            value={ensembleMode}
            onChange={(e) =>
              setEnsembleMode(
                e.target.value as 'Performance-Weighted' | 'Volatility-Adaptive' | 'Equal'
              )
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="Volatility-Adaptive">Volatility-Adaptive (Kalman)</option>
            <option value="Performance-Weighted">Inverse-RMSE Weighted</option>
            <option value="Equal">Equal Weight Averaging</option>
          </select>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Dynamic regime adaptation rule
          </span>
        </div>
      </div>
    </div>
  );
};
