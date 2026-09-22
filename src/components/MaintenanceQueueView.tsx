import React, { useState } from 'react';
import { 
  Flame, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowUpDown, 
  ExternalLink, 
  ChevronRight,
  ShieldAlert,
  Info,
  Truck,
  Check,
  RotateCcw
} from 'lucide-react';
import { Report, PriorityLevel, ReportStatus } from '../types';
import { formatConfidence, getPriorityBadgeColor, getStatusBadgeInfo } from '../utils/priority';

interface MaintenanceQueueProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
  onUpdateStatus: (id: number, status: ReportStatus) => Promise<void>;
  onOpenReportModal: () => void;
}

export const MaintenanceQueueView: React.FC<MaintenanceQueueProps> = ({
  reports,
  onSelectReport,
  onUpdateStatus,
  onOpenReportModal,
}) => {
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Sort descending by priority_score
  const sortedReports = [...reports].sort((a, b) => {
    const scoreA = a.priority_score ?? 0;
    const scoreB = b.priority_score ?? 0;
    return scoreB - scoreA;
  });

  const filteredQueue = sortedReports.filter((report) => {
    if (selectedLevelFilter !== 'all' && (report.priority_level || '').toLowerCase() !== selectedLevelFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  const criticalCount = reports.filter((r) => (r.priority_level || '').toLowerCase() === 'critical').length;
  const highCount = reports.filter((r) => (r.priority_level || '').toLowerCase() === 'high').length;
  const mediumCount = reports.filter((r) => (r.priority_level || '').toLowerCase() === 'medium').length;
  const lowCount = reports.filter((r) => (r.priority_level || '').toLowerCase() === 'low').length;

  const handleQuickStatus = async (id: number, newStatus: ReportStatus) => {
    setUpdatingId(id);
    await onUpdateStatus(id, newStatus);
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Urgency Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Maintenance Prioritisation Engine
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Section 13 Specification
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                AI-ranked dispatch queue based on YOLO confidence, pothole severity, road impact, and repeat reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowFormulaInfo(!showFormulaInfo)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Info className="w-4 h-4 text-slate-500" />
              <span>{showFormulaInfo ? 'Hide Formula' : 'Prioritisation Matrix'}</span>
            </button>
            <button
              onClick={onOpenReportModal}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
            >
              <span>+ Add Incident</span>
            </button>
          </div>
        </div>

        {/* Prioritisation Inputs Info Drawer (Section 14) */}
        {showFormulaInfo && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Proposed Prioritisation Weight Inputs (Handover Section 14)
              </h4>
              <ul className="space-y-1.5 text-slate-600">
                <li><strong className="text-slate-800">1. Severity:</strong> High severity reports receive base +45 weighting; medium +30; low +15.</li>
                <li><strong className="text-slate-800">2. YOLO Confidence:</strong> Multiplied up to 40 points to prioritize highly verified detections.</li>
                <li><strong className="text-slate-800">3. Road / Location Importance:</strong> High-density corridors (arterial & transit routes) get urgency multipliers.</li>
                <li><strong className="text-slate-800">4. Repeated / Clustered Reports:</strong> Recurring complaints escalate priority automatically.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Urgency Tier Thresholds</h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-1.5 bg-rose-50 text-rose-800 rounded border border-rose-200 font-medium">
                  <span>CRITICAL (Score 85 - 100)</span>
                  <span>Highest Urgency • Immediate Dispatch</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-amber-50 text-amber-800 rounded border border-amber-200 font-medium">
                  <span>HIGH (Score 70 - 84)</span>
                  <span>Urgent • 24hr Window</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">
                  <span>MEDIUM (Score 45 - 69)</span>
                  <span>Normal Priority • Scheduled Batch</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 font-medium">
                  <span>LOW (Score &lt; 45)</span>
                  <span>Lower Priority • Periodic Maintenance</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tiers Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedLevelFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedLevelFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Items ({reports.length})
        </button>
        <button
          onClick={() => setSelectedLevelFilter('critical')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedLevelFilter === 'critical'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Critical Urgency ({criticalCount})</span>
        </button>
        <button
          onClick={() => setSelectedLevelFilter('high')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedLevelFilter === 'high'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          <span>High Priority ({highCount})</span>
        </button>
        <button
          onClick={() => setSelectedLevelFilter('medium')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedLevelFilter === 'medium'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-sky-700 border border-sky-200 hover:bg-sky-50'
          }`}
        >
          <span>Normal Priority ({mediumCount})</span>
        </button>
        <button
          onClick={() => setSelectedLevelFilter('low')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedLevelFilter === 'low'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <span>Low Priority ({lowCount})</span>
        </button>
      </div>

      {/* Priority Queue Cards List */}
      <div className="space-y-3">
        {filteredQueue.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No Potholes in this Priority Tier</h3>
            <p className="text-xs text-slate-500 mt-1">All road repairs in this segment are accounted for.</p>
          </div>
        ) : (
          filteredQueue.map((report, rankIndex) => {
            const colors = getPriorityBadgeColor(report.priority_level);
            const statusInfo = getStatusBadgeInfo(report.status);
            const score = report.priority_score ?? 50;

            return (
              <div
                key={report.id}
                id={`queue-item-${report.id}`}
                className={`group relative bg-white rounded-2xl border border-slate-200 hover:border-amber-300 p-4 sm:p-5 shadow-xs transition-all hover:shadow-md ${
                  (report.priority_level || '').toLowerCase() === 'critical' ? 'ring-1 ring-rose-300/60' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Rank & Title */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Rank Badge */}
                    <div className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-xs shrink-0 group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
                      <span className="text-[9px] uppercase text-slate-400">Rank</span>
                      <span className="text-sm">#{rankIndex + 1}</span>
                    </div>

                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img
                        src={report.image_path}
                        alt="Pothole"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-600">
                          Pothole #{report.id.toString().padStart(2, '0')}
                        </span>
                        
                        {/* Handover Section 13 format: Pothole #18 Critical Score 92 */}
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md capitalize ${colors.badge}`}>
                          {report.priority_level || 'Normal'} Score {score}
                        </span>

                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md ${statusInfo.bg} ${statusInfo.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {report.description || 'Pothole incident on public road'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span>YOLO Confidence: <strong className="text-slate-700">{formatConfidence(report.confidence)}</strong></span>
                        <span className="capitalize">Severity: <strong className="text-slate-700">{report.severity}</strong></span>
                        {report.address_hint && (
                          <span className="truncate max-w-[200px] text-slate-600">📍 {report.address_hint}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Urgency Score Bar & Action controls */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-56 shrink-0 gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="w-full text-right">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-500">Urgency Metric</span>
                        <span className={colors.text}>{score} / 100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            score >= 85 ? 'bg-rose-600' : score >= 70 ? 'bg-amber-500' : score >= 45 ? 'bg-sky-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Dispatch / Workflow Actions */}
                    <div className="flex items-center gap-1.5">
                      {report.status !== 'in_progress' && report.status !== 'resolved' && (
                        <button
                          onClick={() => handleQuickStatus(report.id, 'in_progress')}
                          disabled={updatingId === report.id}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 flex items-center gap-1 transition-colors"
                          title="Dispatch maintenance crew"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>
                      )}

                      {report.status === 'in_progress' && (
                        <button
                          onClick={() => handleQuickStatus(report.id, 'resolved')}
                          disabled={updatingId === report.id}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1 transition-colors"
                          title="Mark resolved after repair"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Fixed</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectReport(report)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
