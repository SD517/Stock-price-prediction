import React, { useState } from 'react';
import { QuantReport, PredictionEngineOutput } from '../types/stock';
import {
  Brain,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Compass,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface AiQuantBriefProps {
  engineOutput: PredictionEngineOutput;
}

export const AiQuantBrief: React.FC<AiQuantBriefProps> = ({ engineOutput }) => {
  const [report, setReport] = useState<QuantReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const len = engineOutput.forecastPoints.length;
      const finalForecast = engineOutput.forecastPoints[len - 1];
      const projChange = finalForecast
        ? ((finalForecast.predictedPrice - engineOutput.currentPrice) /
            engineOutput.currentPrice) *
          100
        : 0;

      const res = await fetch('/api/quant/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: engineOutput.ticker,
          companyName: engineOutput.companyName,
          currentPrice: engineOutput.currentPrice,
          horizonDays: engineOutput.hyperparameters.horizonDays,
          regime: engineOutput.regime,
          metrics: {
            baselineRmse: engineOutput.metrics.baselineNaive.rmse,
            improvedRmse: engineOutput.metrics.improvisedEnsemble.rmse,
            rmseImprovementPct: engineOutput.metrics.improvementOverNaivePct,
            directionalAccuracy: engineOutput.metrics.improvisedEnsemble.directionalAccuracy,
            mape: engineOutput.metrics.improvisedEnsemble.mape,
          },
          indicatorSnapshot: {
            rsi: engineOutput.indicators.rsi14[engineOutput.indicators.rsi14.length - 1],
            macdHist: engineOutput.indicators.macdHist[engineOutput.indicators.macdHist.length - 1],
            volatility: engineOutput.indicators.volatility20[engineOutput.indicators.volatility20.length - 1],
            atr: engineOutput.indicators.atr14[engineOutput.indicators.atr14.length - 1],
          },
          forecastSummary: {
            projectedPrice: finalForecast?.predictedPrice ?? engineOutput.currentPrice,
            projectedChangePct: projChange,
            upper95: finalForecast?.upper95 ?? engineOutput.currentPrice * 1.05,
            lower95: finalForecast?.lower95 ?? engineOutput.currentPrice * 0.95,
          },
          hyperparameters: engineOutput.hyperparameters,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate institutional quantitative report');
      }

      const data = await res.json();
      if (data.analysis) {
        setReport(data.analysis);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error communicating with analytics synthesizer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-white tracking-tight">
              Institutional Quantitative Research & Model Defense Brief
            </span>
            <span className="text-xs text-slate-400">· Gemini 3.8 Flash Synthesizer</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated econometric synthesis evaluating regime conditions, forecast horizons, and statistical validation.
          </p>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{report ? 'Refresh Synthesis' : 'Generate Quantitative Brief'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs mb-4">
          {error}
        </div>
      )}

      {!report && !loading && (
        <div className="text-center py-10 px-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Brain className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">
            Generate Comprehensive Institutional Report
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Click above to synthesize multi-factor technical indicators, backtest ablation metrics, and forward scenario horizons into a formal quantitative analysis.
          </p>
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-2"
          >
            Run Quant Engine Analysis
          </button>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-300">
            Running statistical factor inference and scenario projection matrix...
          </p>
        </div>
      )}

      {report && (
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Executive Summary */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              Executive Quantitative Summary
            </h4>
            <p className="text-slate-300 leading-relaxed text-xs">
              {report.executiveSummary}
            </p>
          </div>

          {/* 3-Column Scenario Outlook */}
          <div>
            <h4 className="font-semibold text-white mb-2.5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Multi-Horizon Scenario Probability Cone
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Bull Case */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-400">Bull Case</span>
                  <span className="font-mono text-slate-400">
                    {report.scenarios.bullCase.probability}
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-white mb-1.5">
                  ${report.scenarios.bullCase.target.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {report.scenarios.bullCase.catalyst}
                </p>
              </div>

              {/* Base Case */}
              <div className="bg-slate-900/60 border border-emerald-500/20 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-cyan-400">Base Improvised Path</span>
                  <span className="font-mono text-slate-400">
                    {report.scenarios.baseCase.probability}
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-white mb-1.5">
                  ${report.scenarios.baseCase.target.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {report.scenarios.baseCase.catalyst}
                </p>
              </div>

              {/* Bear Case */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-400">Bear Downside</span>
                  <span className="font-mono text-slate-400">
                    {report.scenarios.bearCase.probability}
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-white mb-1.5">
                  ${report.scenarios.bearCase.target.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {report.scenarios.bearCase.catalyst}
                </p>
              </div>
            </div>
          </div>

          {/* Econometric Diagnosis & Ablation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg">
              <h5 className="font-semibold text-white mb-1.5">
                Econometric Regime Diagnosis
              </h5>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {report.regimeDiagnosis}
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg">
              <h5 className="font-semibold text-white mb-1.5">
                Model Ablation & Statistical Superiority
              </h5>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {report.modelAblationInsight}
              </p>
            </div>
          </div>

          {/* Risk & Value-at-Risk */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white mb-1">
                Risk Management & Value-at-Risk (VaR)
              </h5>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {report.riskAssessment}
              </p>
            </div>
          </div>

          {/* Academic Defense Note */}
          <div className="bg-emerald-500/[0.04] border border-emerald-500/20 p-4 rounded-lg flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-emerald-400 mb-1">
                Academic Project Defense Recommendation
              </h5>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {report.academicMethodologyNote}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
