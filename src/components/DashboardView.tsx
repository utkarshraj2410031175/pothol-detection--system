import React from 'react';
import { 
  ShieldAlert, 
  Flame, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Report } from '../types';
import { formatConfidence, getPriorityBadgeColor, getStatusBadgeInfo } from '../utils/priority';
import { InteractiveMapView } from './InteractiveMapView';

interface DashboardViewProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
  onOpenReportModal: () => void;
  onNavigateToPriority: () => void;
  onNavigateToReports: () => void;
  onNavigateToMap: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  reports,
  onSelectReport,
  onOpenReportModal,
  onNavigateToPriority,
  onNavigateToReports,
  onNavigateToMap,
}) => {
  // Statistics Calculations
  const totalReports = reports.length;
  const detectedCount = reports.filter((r) => r.confidence > 0.5).length;
  const criticalCount = reports.filter((r) => (r.priority_level || '').toLowerCase() === 'critical').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const inProgressCount = reports.filter((r) => r.status === 'in_progress').length;

  const avgConfidence = totalReports > 0
    ? reports.reduce((acc, r) => acc + (r.confidence || 0), 0) / totalReports
    : 0;

  // Priority sorted top 5 (Section 13 & 16)
  const priorityQueueTop5 = [...reports]
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    .slice(0, 5);

  // Recent 5 reports
  const recentReports = [...reports]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Automated Pothole Triage & Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Road Infrastructure & Pothole Operations
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            FastAPI and YOLO11n computer vision continuous road inspection network. Automatically ranking maintenance urgency, coordinating field crews, and tracking asphalt repair workflows.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              id="btn-hero-report-pothole"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Road Pothole</span>
            </button>
            <button
              onClick={onNavigateToPriority}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 transition-all"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Inspect Priority Queue ({criticalCount} Critical)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards (Handover Section 16: Total Reports | Detected | Critical | Resolved) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Reports */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Total Reports
            </span>
            <span className="text-2xl font-bold text-slate-900">{totalReports}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Cataloged in database</span>
          </div>
        </div>

        {/* AI Detected */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              YOLO Detected
            </span>
            <span className="text-2xl font-bold text-amber-700">{detectedCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Avg conf: {formatConfidence(avgConfidence)}
            </span>
          </div>
        </div>

        {/* Critical Urgency */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Critical Urgency
            </span>
            <span className="text-2xl font-bold text-rose-600">{criticalCount}</span>
            <span className="text-[11px] text-rose-500 font-medium block mt-0.5">Immediate repair needed</span>
          </div>
        </div>

        {/* Resolved / Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Repaired / Resolved
            </span>
            <span className="text-2xl font-bold text-emerald-600">{resolvedCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">{inProgressCount} currently in progress</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Maintenance Priority Queue (Section 13) + Geospatial Map (Section 16 & 18) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map (Left / 7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Geospatial Distribution</h2>
            </div>
            <button
              onClick={onNavigateToMap}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Full Screen Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <InteractiveMapView
            reports={reports}
            onSelectReport={onSelectReport}
            className="h-[380px] w-full"
            isCompact={false}
          />
        </div>

        {/* Maintenance Priority Queue (Right / 5 cols) - Exactly matching Handover Section 13 & 16 */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <h2 className="text-base font-bold text-slate-900">Maintenance Priority Queue</h2>
            </div>
            <button
              onClick={onNavigateToPriority}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex-1 flex flex-col justify-between space-y-3">
            <div className="text-xs text-slate-500 flex items-center justify-between pb-2 border-b border-slate-100">
              <span>Highest Urgent Dispatches</span>
              <span>Priority Score</span>
            </div>

            <div className="space-y-2.5">
              {priorityQueueTop5.map((item, idx) => {
                const colors = getPriorityBadgeColor(item.priority_level);
                const score = item.priority_score ?? 50;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectReport(item)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-200/80 font-mono text-xs font-bold text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-amber-100 group-hover:text-amber-800">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        {/* Handover Section 13 format: Pothole #18 Critical Score 92 */}
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <span>Pothole #{item.id.toString().padStart(2, '0')}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase ${colors.badge}`}>
                            {item.priority_level || 'Normal'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-mono text-xs font-extrabold ${colors.text}`}>
                        Score {score}
                      </span>
                      <span className="block text-[10px] text-slate-400 capitalize">
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onNavigateToPriority}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold text-center transition-colors mt-2"
            >
              Open Full Prioritisation Engine
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reports Table (Section 16: Recent Reports) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" />
            <h2 className="text-base font-bold text-slate-900">Recent Road Reports</h2>
          </div>
          <button
            onClick={onNavigateToReports}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Road Defect Description</th>
                  <th className="py-3 px-4">YOLO Confidence</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Priority Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReports.map((report) => {
                  const priColors = getPriorityBadgeColor(report.priority_level);
                  const statusInfo = getStatusBadgeInfo(report.status);

                  return (
                    <tr
                      key={report.id}
                      onClick={() => onSelectReport(report)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        #{report.id}
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <p className="font-semibold text-slate-900 line-clamp-1">{report.description}</p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(report.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700">
                        {formatConfidence(report.confidence)}
                      </td>
                      <td className="py-3 px-4 capitalize font-semibold text-slate-700">
                        {report.severity}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded capitalize ${priColors.badge}`}>
                          {report.priority_level || 'Normal'} ({report.priority_score ?? '—'})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md ${statusInfo.bg} ${statusInfo.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectReport(report);
                          }}
                          className="text-amber-700 hover:text-amber-900 font-bold inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
