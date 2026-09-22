import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Trash2, 
  LayoutGrid, 
  Table as TableIcon,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Report, ReportStatus, SeverityLevel, PriorityLevel } from '../types';
import { formatConfidence, getPriorityBadgeColor, getStatusBadgeInfo } from '../utils/priority';

interface ReportsListViewProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
  onUpdateStatus: (id: number, status: ReportStatus) => Promise<void>;
  onDeleteReport: (id: number) => Promise<void>;
  onOpenReportModal: () => void;
}

export const ReportsListView: React.FC<ReportsListViewProps> = ({
  reports,
  onSelectReport,
  onUpdateStatus,
  onDeleteReport,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority_score' | 'confidence' | 'created_at' | 'id'>('priority_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filter and sort
  const filtered = reports.filter((r) => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = r.id.toString().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchAddr = (r.address_hint || '').toLowerCase().includes(q);
      if (!matchId && !matchDesc && !matchAddr) return false;
    }

    // Severity
    if (filterSeverity !== 'all' && r.severity.toLowerCase() !== filterSeverity.toLowerCase()) {
      return false;
    }

    // Status
    if (filterStatus !== 'all' && r.status !== filterStatus) {
      return false;
    }

    // Priority
    if (filterPriority !== 'all' && (r.priority_level || '').toLowerCase() !== filterPriority.toLowerCase()) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortBy] ?? 0;
    let valB = b[sortBy] ?? 0;

    if (sortBy === 'created_at') {
      valA = new Date(a.created_at).getTime();
      valB = new Date(b.created_at).getTime();
    }

    if (sortOrder === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Description', 'Severity', 'Confidence', 'Priority Score', 'Priority Level', 'Status', 'Latitude', 'Longitude', 'Created At'];
    const rows = sorted.map((r) => [
      r.id,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.severity,
      formatConfidence(r.confidence),
      r.priority_score ?? '',
      r.priority_level ?? '',
      r.status,
      r.latitude ?? '',
      r.longitude ?? '',
      r.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pothole_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async (id: number) => {
    if (window.confirm(`Are you sure you want to delete Report #${id}? This will remove it from PostgreSQL.`)) {
      setDeletingId(id);
      await onDeleteReport(id);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Road Pothole Reports</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Query, filter, and inspect {reports.length} total incidents across municipal road networks.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenReportModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
            >
              <span>+ New Report</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, street name, description..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Severities</option>
              <option value="high">High Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="low">Low Severity</option>
            </select>
          </div>

          {/* Status Filter (Section 11) */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
            >
              <option value="priority_score">Sort: Urgency Score</option>
              <option value="confidence">Sort: AI Confidence</option>
              <option value="created_at">Sort: Report Date</option>
              <option value="id">Sort: Report ID</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Switch to ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-600"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Toggle on Desktop/Tablet */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{sorted.length}</strong> of {reports.length} reports
          </span>

          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Display: Table or Grid */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Search className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Reports Match Your Search</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the severity or status filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Responsive Table View (Desktop & Tablet) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Report</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">AI Confidence</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Urgency Score</th>
                  <th className="py-3 px-4">Workflow Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((report) => {
                  const priColor = getPriorityBadgeColor(report.priority_level);
                  const statusInfo = getStatusBadgeInfo(report.status);

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                      onClick={() => onSelectReport(report)}
                    >
                      {/* ID & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={report.image_path}
                              alt="Pothole"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900 block">
                              #{report.id}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 line-clamp-1">
                          {report.description}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                        </p>
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>{formatConfidence(report.confidence)}</span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-4">
                        <span
                          className={`capitalize font-bold px-2 py-0.5 rounded text-[11px] ${
                            report.severity === 'high'
                              ? 'text-rose-700 bg-rose-50 border border-rose-200'
                              : report.severity === 'medium'
                              ? 'text-amber-700 bg-amber-50 border border-amber-200'
                              : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {report.severity}
                        </span>
                      </td>

                      {/* Priority Score */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${priColor.badge}`}>
                            {report.priority_level || 'Normal'} ({report.priority_score ?? '—'})
                          </span>
                        </div>
                      </td>

                      {/* Workflow Status Dropdown (Section 11) */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={report.status}
                          onChange={(e) => onUpdateStatus(report.id, e.target.value as ReportStatus)}
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer ${statusInfo.bg} ${statusInfo.text}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectReport(report)}
                            title="Inspect details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(report.id)}
                            disabled={deletingId === report.id}
                            title="Delete report (Admin)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Responsive Grid / Card View (Great for Mobile & Tablet) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((report) => {
            const priColor = getPriorityBadgeColor(report.priority_level);
            const statusInfo = getStatusBadgeInfo(report.status);

            return (
              <div
                key={report.id}
                onClick={() => onSelectReport(report)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-amber-300 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-100 mb-3">
                    <img
                      src={report.image_path}
                      alt="Pothole"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 font-mono text-xs font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      #{report.id}
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${priColor.badge}`}>
                        {report.priority_level || 'Normal'} {report.priority_score ?? ''}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                    {report.description}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>YOLO Confidence: <strong className="text-amber-700">{formatConfidence(report.confidence)}</strong></span>
                    <span className="capitalize font-semibold text-slate-700">{report.severity} Severity</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md ${statusInfo.bg} ${statusInfo.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                    <span>{statusInfo.label}</span>
                  </span>

                  <button
                    onClick={() => onSelectReport(report)}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
