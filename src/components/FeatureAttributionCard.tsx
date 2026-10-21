import React from 'react';
import { FeatureAttribution } from '../types/stock';
import { Sparkles, Brain, Cpu, Zap, Activity } from 'lucide-react';

interface FeatureAttributionProps {
  attributions: FeatureAttribution[];
}

export const FeatureAttributionCard: React.FC<FeatureAttributionProps> = ({ attributions }) => {
  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 lg:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Quantitative Feature Attribution & SHAP Decomposition
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Relative factor weight assigned by the improvised model’s dynamic weighting matrix.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attributions.map((attr, idx) => {
          const isPosCorr = attr.correlation >= 0;
          return (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-200">
                  {attr.feature}
                </span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {attr.weight}% Weight
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  style={{ width: `${attr.weight * 2.5}%` }}
                  className="h-full bg-emerald-400 rounded-full transition-all"
                />
              </div>

              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                {attr.description}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/60">
                <span>Information Coefficient:</span>
                <span className={isPosCorr ? 'text-emerald-400' : 'text-cyan-400'}>
                  {isPosCorr ? '+' : ''}{attr.correlation.toFixed(2)} r
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
