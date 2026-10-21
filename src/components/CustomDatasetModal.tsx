import React, { useState } from 'react';
import { X, Upload, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseStockCSV, generateCSVExport } from '../data/stockDatasets';
import { Candle } from '../types/stock';

interface CustomDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (candles: Candle[], ticker: string, name: string) => void;
}

export const CustomDatasetModal: React.FC<CustomDatasetModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewCandles, setPreviewCandles] = useState<Candle[] | null>(null);
  const [customTicker, setCustomTicker] = useState('CUSTOM');
  const [customName, setCustomName] = useState('User Uploaded Stock Data');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = parseStockCSV(text);
      if (res.success && res.candles) {
        setPreviewCandles(res.candles);
        setError(null);
      } else {
        setError(res.error || 'Failed to parse CSV file');
        setPreviewCandles(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
    };
    reader.readAsText(selected);
  };

  const handleDownloadSample = () => {
    // Generate sample 40-day CSV
    const sampleRows = [
      'Date,Open,High,Low,Close,Volume',
      '2026-08-01,150.20,152.40,149.80,151.75,2450000',
      '2026-08-02,151.80,154.10,151.20,153.60,2890000',
      '2026-08-05,153.50,155.00,152.90,154.20,2100000',
      '2026-08-06,154.00,156.80,153.50,156.40,3400000',
      '2026-08-07,156.20,158.00,155.50,157.10,3100000',
      '2026-08-08,157.00,157.50,154.20,155.00,2700000',
      '2026-08-09,155.20,156.30,153.80,154.50,2300000',
      '2026-08-12,154.60,156.90,154.10,156.20,2600000',
      '2026-08-13,156.50,159.20,156.00,158.80,3900000',
      '2026-08-14,159.00,161.40,158.50,160.90,4200000',
    ];
    const blob = new Blob([sampleRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_stock_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    if (!previewCandles || previewCandles.length === 0) return;
    onDatasetLoaded(previewCandles, customTicker.toUpperCase(), customName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Upload className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">
            Upload Custom Stock Time-Series CSV
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Test the improvised model on your own financial dataset. The CSV should contain columns: <code>Date</code>, <code>Open</code>, <code>High</code>, <code>Low</code>, <code>Close</code>, <code>Volume</code>.
        </p>

        {/* File Drag / Select Box */}
        <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 text-center bg-slate-900/50 mb-4 transition-colors">
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            id="csv-file-input"
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <span className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 block mb-1">
              {file ? file.name : 'Choose CSV file or drag here'}
            </span>
            <span className="text-[11px] text-slate-400">
              Supports standard Yahoo Finance, AlphaVantage, or custom analytics formats
            </span>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {previewCandles && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Parsed {previewCandles.length} trading candles successfully
              </span>
              <span className="text-slate-400 font-mono">
                Latest: ${previewCandles[previewCandles.length - 1].close.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Ticker Identifier
                </label>
                <input
                  type="text"
                  value={customTicker}
                  onChange={(e) => setCustomTicker(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Project / Asset Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <button
            onClick={handleDownloadSample}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample CSV
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!previewCandles}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold rounded-lg transition-colors"
            >
              Load into Engine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
