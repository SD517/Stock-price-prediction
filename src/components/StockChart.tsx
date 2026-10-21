import React, { useState, useMemo, useRef } from 'react';
import {
  Candle,
  TechnicalIndicators,
  BacktestFitPoint,
  ForecastPoint,
} from '../types/stock';
import { Eye, EyeOff, BarChart2, TrendingUp, Maximize2 } from 'lucide-react';

interface StockChartProps {
  candles: Candle[];
  indicators: TechnicalIndicators;
  backtestResults: BacktestFitPoint[];
  forecastPoints: ForecastPoint[];
  currentPrice: number;
}

export const StockChart: React.FC<StockChartProps> = ({
  candles,
  indicators,
  backtestResults,
  forecastPoints,
  currentPrice,
}) => {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [showOverlays, setShowOverlays] = useState(true);
  const [showConfidenceCone, setShowConfidenceCone] = useState(true);
  const [showBaseline, setShowBaseline] = useState(false);

  // Mouse hover crosshair state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter candles by time range
  const visibleCandles = useMemo(() => {
    const total = candles.length;
    let count = total;
    if (timeRange === '1M') count = Math.min(22, total);
    else if (timeRange === '3M') count = Math.min(65, total);
    else if (timeRange === '6M') count = Math.min(130, total);
    else if (timeRange === '1Y') count = Math.min(252, total);
    return candles.slice(total - count);
  }, [candles, timeRange]);

  // Combine visible history with forecast points for unified continuous plotting
  const visibleDates = useMemo(() => {
    return visibleCandles.map((c) => c.date);
  }, [visibleCandles]);

  // Map backtest predictions to visible candles
  const backtestMap = useMemo(() => {
    const map = new Map<string, BacktestFitPoint>();
    backtestResults.forEach((b) => map.set(b.date, b));
    return map;
  }, [backtestResults]);

  // Dimensions
  const svgWidth = 1000;
  const svgHeight = 440;
  const priceChartHeight = 320;
  const volumeChartHeight = 80;
  const chartPadding = { top: 20, right: 70, bottom: 30, left: 10 };

  const plotWidth = svgWidth - chartPadding.left - chartPadding.right;

  // Calculate Price Range across history and forecast
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    // Also include forecast bounds
    forecastPoints.forEach((f) => {
      if (f.lower95 < min) min = f.lower95;
      if (f.upper95 > max) max = f.upper95;
    });

    const buffer = (max - min) * 0.08 || 5;
    return {
      minPrice: Math.max(0.1, min - buffer),
      maxPrice: max + buffer,
      maxVolume: maxVol || 1000000,
    };
  }, [visibleCandles, forecastPoints]);

  const totalPoints = visibleCandles.length + forecastPoints.length;
  const stepX = plotWidth / (totalPoints - 1 || 1);

  // Coordinate mappers
  const getY = (price: number) => {
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    return priceChartHeight - ratio * (priceChartHeight - chartPadding.top);
  };

  const getVolY = (vol: number) => {
    const ratio = vol / maxVolume;
    return (
      priceChartHeight +
      20 +
      volumeChartHeight -
      ratio * volumeChartHeight
    );
  };

  // Generate Candlestick / Line Path
  const linePoints = visibleCandles
    .map((c, i) => `${chartPadding.left + i * stepX},${getY(c.close)}`)
    .join(' ');

  // Generate Improvised Model Prediction Path for visible backtest + forecast
  const improvisedModelPath = useMemo(() => {
    const pts: string[] = [];
    visibleCandles.forEach((c, i) => {
      const bt = backtestMap.get(c.date);
      if (bt) {
        pts.push(`${chartPadding.left + i * stepX},${getY(bt.improvisedPredict)}`);
      }
    });

    // Connect continuously to forecast points
    const histOffset = visibleCandles.length - 1;
    pts.push(`${chartPadding.left + histOffset * stepX},${getY(currentPrice)}`);

    forecastPoints.forEach((f, idx) => {
      const x = chartPadding.left + (histOffset + 1 + idx) * stepX;
      pts.push(`${x},${getY(f.predictedPrice)}`);
    });

    return pts.join(' ');
  }, [visibleCandles, backtestMap, forecastPoints, currentPrice, stepX, minPrice, maxPrice]);

  // Generate Baseline Naive Path
  const baselineModelPath = useMemo(() => {
    const pts: string[] = [];
    visibleCandles.forEach((c, i) => {
      const bt = backtestMap.get(c.date);
      if (bt) {
        pts.push(`${chartPadding.left + i * stepX},${getY(bt.naivePredict)}`);
      }
    });
    // Forecast baseline
    const histOffset = visibleCandles.length - 1;
    forecastPoints.forEach((f, idx) => {
      const x = chartPadding.left + (histOffset + 1 + idx) * stepX;
      pts.push(`${x},${getY(f.baselinePrediction)}`);
    });
    return pts.join(' ');
  }, [visibleCandles, backtestMap, forecastPoints, stepX, minPrice, maxPrice]);

  // Confidence Cone 95% SVG Polygon Area
  const confidencePolygon = useMemo(() => {
    if (!forecastPoints.length) return '';
    const histOffset = visibleCandles.length - 1;
    const startX = chartPadding.left + histOffset * stepX;
    const startY = getY(currentPrice);

    const upperPoints: string[] = [`${startX},${startY}`];
    const lowerPoints: string[] = [];

    forecastPoints.forEach((f, idx) => {
      const x = chartPadding.left + (histOffset + 1 + idx) * stepX;
      upperPoints.push(`${x},${getY(f.upper95)}`);
      lowerPoints.unshift(`${x},${getY(f.lower95)}`);
    });

    lowerPoints.push(`${startX},${startY}`);
    return [...upperPoints, ...lowerPoints].join(' ');
  }, [forecastPoints, visibleCandles.length, stepX, currentPrice, minPrice, maxPrice]);

  // Handle Mouse Move over chart
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = (mouseX / rect.width) * svgWidth - chartPadding.left;
    const index = Math.round(relX / stepX);
    if (index >= 0 && index < totalPoints) {
      setHoverIndex(index);
    } else {
      setHoverIndex(null);
    }
  };

  const activeHoverData = useMemo(() => {
    if (hoverIndex === null) return null;
    if (hoverIndex < visibleCandles.length) {
      const candle = visibleCandles[hoverIndex];
      const bt = backtestMap.get(candle.date);
      return {
        isForecast: false,
        date: candle.date,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        change: candle.change,
        changePercent: candle.changePercent,
        modelPredict: bt?.improvisedPredict,
        naivePredict: bt?.naivePredict,
      };
    } else {
      const fIdx = hoverIndex - visibleCandles.length;
      const f = forecastPoints[fIdx];
      if (!f) return null;
      return {
        isForecast: true,
        date: f.date,
        predictedPrice: f.predictedPrice,
        upper95: f.upper95,
        lower95: f.lower95,
        upper80: f.upper80,
        lower80: f.lower80,
        baseline: f.baselinePrediction,
      };
    }
  }, [hoverIndex, visibleCandles, backtestMap, forecastPoints]);

  // Y-axis grid ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 5;
    const step = (maxPrice - minPrice) / count;
    for (let i = 0; i <= count; i++) {
      ticks.push(minPrice + i * step);
    }
    return ticks;
  }, [minPrice, maxPrice]);

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 lg:p-5">
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                  timeRange === r
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setChartType('candle')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === 'candle'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Line
            </button>
          </div>
        </div>

        {/* Legend & Feature Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
              showOverlays
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <span className="w-2 h-0.5 bg-emerald-400 rounded-full" />
            Improvised Model
          </button>

          <button
            onClick={() => setShowConfidenceCone(!showConfidenceCone)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
              showConfidenceCone
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <span className="w-2.5 h-1.5 bg-cyan-500/30 border border-cyan-400/50 rounded-sm" />
            95% Monte Carlo Cone
          </button>

          <button
            onClick={() => setShowBaseline(!showBaseline)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
              showBaseline
                ? 'bg-slate-700/50 border-slate-600 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <span className="w-2 h-0.5 border-t border-dashed border-slate-400" />
            Naive Baseline
          </button>
        </div>
      </div>

      {/* Main Interactive Chart Viewport */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
        >
          <defs>
            {/* Confidence Cone Gradient */}
            <linearGradient id="coneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.08" />
            </linearGradient>

            {/* Historical Area Gradient for Line View */}
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((price, idx) => {
            const y = getY(price);
            return (
              <g key={idx}>
                <line
                  x1={chartPadding.left}
                  y1={y}
                  x2={svgWidth - chartPadding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={svgWidth - chartPadding.right + 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  ${price.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Divider between Price and Volume */}
          <line
            x1={chartPadding.left}
            y1={priceChartHeight + 15}
            x2={svgWidth - chartPadding.right}
            y2={priceChartHeight + 15}
            stroke="#1e293b"
          />

          {/* Historical Separation Vertical Dashed Line */}
          {visibleCandles.length > 0 && (
            <g>
              <line
                x1={chartPadding.left + (visibleCandles.length - 1) * stepX}
                y1={chartPadding.top}
                x2={chartPadding.left + (visibleCandles.length - 1) * stepX}
                y2={priceChartHeight}
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <text
                x={chartPadding.left + (visibleCandles.length - 1) * stepX - 6}
                y={chartPadding.top + 14}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                Backtest Actuals ◄
              </text>
              <text
                x={chartPadding.left + (visibleCandles.length - 1) * stepX + 6}
                y={chartPadding.top + 14}
                textAnchor="start"
                fill="#38bdf8"
                fontSize="9"
                fontFamily="JetBrains Mono"
                fontWeight="bold"
              >
                ► Forecast Horizon
              </text>
            </g>
          )}

          {/* 95% Confidence Cone Polygon */}
          {showConfidenceCone && confidencePolygon && (
            <polygon points={confidencePolygon} fill="url(#coneGrad)" />
          )}

          {/* Historical Candles / Line */}
          {chartType === 'line' ? (
            <>
              {/* Fill under line */}
              <polygon
                points={`${chartPadding.left},${priceChartHeight} ${linePoints} ${
                  chartPadding.left + (visibleCandles.length - 1) * stepX
                },${priceChartHeight}`}
                fill="url(#areaGrad)"
              />
              <polyline
                fill="none"
                stroke="#34d399"
                strokeWidth="1.8"
                points={linePoints}
              />
            </>
          ) : (
            visibleCandles.map((c, i) => {
              const x = chartPadding.left + i * stepX;
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const highY = getY(c.high);
              const lowY = getY(c.low);
              const isUp = c.close >= c.open;
              const candleWidth = Math.max(2, Math.min(8, stepX * 0.7));

              return (
                <g key={i}>
                  {/* High/Low Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={isUp ? '#10b981' : '#f43f5e'}
                    strokeWidth="1"
                  />
                  {/* Candle Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={Math.min(openY, closeY)}
                    width={candleWidth}
                    height={Math.max(1.5, Math.abs(closeY - openY))}
                    fill={isUp ? '#10b981' : '#f43f5e'}
                    rx="0.5"
                  />
                </g>
              );
            })
          )}

          {/* Baseline Naive Model Path */}
          {showBaseline && baselineModelPath && (
            <polyline
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              points={baselineModelPath}
              opacity="0.75"
            />
          )}

          {/* Improvised Model Path */}
          {showOverlays && improvisedModelPath && (
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2.2"
              strokeDasharray="6 3"
              points={improvisedModelPath}
            />
          )}

          {/* Volume Sub-Chart Bars */}
          {visibleCandles.map((c, i) => {
            const x = chartPadding.left + i * stepX;
            const barY = getVolY(c.volume);
            const barH = priceChartHeight + 20 + volumeChartHeight - barY;
            const isUp = c.close >= c.open;
            const barW = Math.max(1.5, Math.min(6, stepX * 0.65));

            return (
              <rect
                key={i}
                x={x - barW / 2}
                y={barY}
                width={barW}
                height={Math.max(1, barH)}
                fill={isUp ? '#10b981' : '#f43f5e'}
                opacity="0.4"
              />
            );
          })}

          {/* Volume Y-Axis Label */}
          <text
            x={svgWidth - chartPadding.right + 8}
            y={priceChartHeight + 35}
            fill="#64748b"
            fontSize="9"
            fontFamily="JetBrains Mono"
          >
            {(maxVolume / 1000000).toFixed(0)}M Vol
          </text>

          {/* Interactive Crosshair Hover Line */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={chartPadding.left + hoverIndex * stepX}
                y1={chartPadding.top}
                x2={chartPadding.left + hoverIndex * stepX}
                y2={priceChartHeight + 20 + volumeChartHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={chartPadding.left + hoverIndex * stepX}
                cy={
                  hoverIndex < visibleCandles.length
                    ? getY(visibleCandles[hoverIndex].close)
                    : getY(
                        forecastPoints[hoverIndex - visibleCandles.length]?.predictedPrice ?? currentPrice
                      )
                }
                r="4.5"
                fill="#10b981"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Precision Hover Tooltip */}
        {activeHoverData && (
          <div className="absolute top-3 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs shadow-xl pointer-events-none z-10 max-w-xs font-mono">
            <div className="flex items-center justify-between gap-4 pb-1.5 border-b border-slate-800 text-slate-300">
              <span className="font-semibold text-white">
                {activeHoverData.date}
              </span>
              <span className="text-[10px] text-cyan-400 font-sans font-medium">
                {activeHoverData.isForecast ? 'Forecast Projection' : 'Backtest Actual'}
              </span>
            </div>

            {!activeHoverData.isForecast ? (
              <div className="mt-1.5 space-y-1 text-[11px] tabular-nums">
                <div className="flex justify-between gap-3 text-slate-400">
                  <span>Open / Close:</span>
                  <span className="text-white">
                    ${activeHoverData.open?.toFixed(2)} / ${activeHoverData.close?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-slate-400">
                  <span>High / Low:</span>
                  <span className="text-white">
                    ${activeHoverData.high?.toFixed(2)} / ${activeHoverData.low?.toFixed(2)}
                  </span>
                </div>
                {activeHoverData.modelPredict && (
                  <div className="flex justify-between gap-3 pt-1 border-t border-slate-800 text-emerald-400 font-semibold">
                    <span>Improvised Model:</span>
                    <span>${activeHoverData.modelPredict.toFixed(2)}</span>
                  </div>
                )}
                {activeHoverData.naivePredict && (
                  <div className="flex justify-between gap-3 text-slate-400">
                    <span>Naive Baseline:</span>
                    <span>${activeHoverData.naivePredict.toFixed(2)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-1.5 space-y-1 text-[11px] tabular-nums">
                <div className="flex justify-between gap-3 text-emerald-400 font-semibold">
                  <span>Target Projection:</span>
                  <span>${activeHoverData.predictedPrice?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-3 text-cyan-400">
                  <span>95% CI Range:</span>
                  <span>
                    ${activeHoverData.lower95?.toFixed(2)} - ${activeHoverData.upper95?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-slate-400">
                  <span>Naive Persistence:</span>
                  <span>${activeHoverData.baseline?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
