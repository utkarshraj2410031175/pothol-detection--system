import React, { useState } from 'react';
import { 
  X, 
  Server, 
  ExternalLink, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Code2,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { ApiConfig } from '../types';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiConfig: ApiConfig;
  onUpdateBaseUrl: (newUrl: string) => void;
  onTestConnection: () => Promise<void>;
  onResetDemoData: () => void;
  isTesting: boolean;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
  apiConfig,
  onUpdateBaseUrl,
  onTestConnection,
  onResetDemoData,
  isTesting,
}) => {
  const [inputUrl, setInputUrl] = useState(apiConfig.baseUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateBaseUrl(inputUrl.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo reports and priority queue back to default seed data?')) {
      onResetDemoData();
      alert('Local test dataset reset successfully.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        id="backend-settings-dialog"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                FastAPI & ML Backend Configuration
              </h2>
              <p className="text-xs text-slate-500">API Gateway & Integration Checklist (PDF Section 4, 20 & 28)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-xs">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
              apiConfig.isLive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {apiConfig.isLive ? (
                <Wifi className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <WifiOff className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {apiConfig.isLive
                    ? 'Connected to Live FastAPI Backend'
                    : 'Interactive Local Simulation Mode Active'}
                </h4>
                <p className="text-xs mt-0.5 opacity-90">
                  {apiConfig.isLive
                    ? `Live responses from ${apiConfig.baseUrl}. Reports are persisted directly into PostgreSQL with YOLO11n AI.`
                    : `FastAPI at ${apiConfig.baseUrl} is not currently responding. The UI is running in full interactive simulation with realistic YOLO11n confidence scoring and priority queues.`}
                </p>
              </div>
            </div>

            <button
              onClick={onTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg bg-white shadow-2xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Pinging...' : 'Test Connection'}</span>
            </button>
          </div>

          {/* API Base URL Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              FastAPI Server Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-500 bg-white"
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors"
              >
                Save URL
              </button>
            </div>
            {saveSuccess && (
              <p className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Base URL updated and saved in browser storage.</span>
              </p>
            )}

            <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500">
              <span>Swagger Interactive Docs:</span>
              <a
                href={`${inputUrl.replace(/\/+$/, '')}/docs`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-amber-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{inputUrl.replace(/\/+$/, '')}/docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Handover Integration Checklist (Section 28) */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Handover Guide Specification Checklist (Section 28)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>POST /reports/ multipart/form-data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>GET /reports/ with full array</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Confidence converted to percentage (0.9211 -&gt; 92.11%)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>PUT /reports/&#123;id&#125;/status controlled updates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>DELETE /reports/&#123;id&#125; admin removal</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Maintenance priority score (0-100) & queue</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Leaflet map coordinates & urgency pins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Responsive mobile, tablet & desktop layout</span>
              </div>
            </div>
          </div>

          {/* CORS & Backend Startup helper (Section 20) */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
            <h5 className="font-bold text-amber-900 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-amber-700" />
              <span>FastAPI Backend Startup & CORS Reminder</span>
            </h5>
            <p className="text-amber-800 leading-relaxed">
              When running the FastAPI server locally, start with:
            </p>
            <pre className="bg-slate-900 text-amber-300 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
              uvicorn main:app --host 0.0.0.0 --port 8000 --reload
            </pre>
            <p className="text-[11px] text-amber-800">
              Ensure <code className="font-mono font-bold">CORSMiddleware</code> allows origins such as <code className="font-mono">"*"</code> or your preview domain.
            </p>
          </div>

          {/* Reset Demo Data Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="font-bold text-slate-800 block">Reset Interactive Demo State</span>
              <span className="text-slate-500 text-[11px]">Restore standard seed reports and sample locations</span>
            </div>
            <button
              onClick={handleResetData}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
