import React from 'react';
import {
  TrendingUp,
  Sliders,
  FileText,
  Upload,
  Download,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { STOCK_PROFILES } from '../data/stockDatasets';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  onOpenUpload: () => void;
  onOpenMethodology: () => void;
  onExportCSV: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedTicker,
  setSelectedTicker,
  onOpenUpload,
  onOpenMethodology,
  onExportCSV,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              QuantNova
            </span>
          </div>

          {/* Ticker Selector Dropdown */}
          <div className="relative group">
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
            >
              {Object.keys(STOCK_PROFILES).map((sym) => (
                <option key={sym} value={sym}>
                  {sym} · {STOCK_PROFILES[sym].name.split(' ')[0]}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Predictive Studio
          </button>

          <button
            onClick={() => setActiveTab('ablation')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'ablation'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Model Ablation & Metrics
          </button>

          <button
            onClick={() => setActiveTab('ai-report')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'ai-report'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Quant AI Synthesis
          </button>

          <button
            onClick={onOpenMethodology}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            Project Methodology
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenUpload}
            title="Upload custom stock CSV dataset"
            className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>

          <button
            onClick={onExportCSV}
            title="Export predictions and dataset to CSV"
            className="px-3 py-1.5 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Forecast</span>
          </button>
        </div>
      </div>
    </header>
  );
};
