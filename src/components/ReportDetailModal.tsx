import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Sparkles, 
  Trash2, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  Compass, 
  ExternalLink,
  Truck,
  RotateCcw,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Report, ReportStatus } from '../types';
import { formatConfidence, getPriorityBadgeColor, getStatusBadgeInfo } from '../utils/priority';

interface ReportDetailModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: number, status: ReportStatus) => Promise<void>;
  onDeleteReport: (id: number) => Promise<void>;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteReport,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showYoloBox, setShowYoloBox] = useState(true);

  if (!isOpen || !report) return null;

  const priorityColors = getPriorityBadgeColor(report.priority_level);
  const statusInfo = getStatusBadgeInfo(report.status);

  const handleStatusChange = async (newStatus: ReportStatus) => {
    setIsUpdating(true);
    await onUpdateStatus(report.id, newStatus);
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Permanently remove Pothole Report #${report.id} from PostgreSQL?`)) {
      await onDeleteReport(report.id);
      onClose();
    }
  };

  const mapsUrl = report.latitude && report.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`
    : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        id={`report-detail-dialog-${report.id}`}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              Incident #{report.id}
            </span>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-md capitalize ${priorityColors.badge}`}>
              {report.priority_level || 'Normal'} Priority ({report.priority_score ?? '—'}/100)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete report (Admin)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Main Visual Photo Inspection with YOLO Bounding Box toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                YOLO11n Computer Vision Evidence
              </span>
              <button
                type="button"
                onClick={() => setShowYoloBox(!showYoloBox)}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showYoloBox ? 'Hide YOLO Box' : 'Show YOLO Box'}</span>
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-80 flex items-center justify-center border border-slate-200 shadow-inner">
              <img
                src={report.image_path}
                alt="Pothole"
                className="w-full h-full object-cover"
              />

              {showYoloBox && (
                <div className="absolute inset-[24%] border-2 border-amber-400 bg-amber-400/20 rounded-md shadow-lg pointer-events-none flex flex-col justify-start p-1.5">
                  <div className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded shadow-sm w-max">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>pothole: {formatConfidence(report.confidence)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Detection Confidence
              </span>
              <span className="text-xl font-bold text-amber-700">
                {formatConfidence(report.confidence)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Urgency Score
              </span>
              <span className="text-xl font-bold text-rose-600">
                {report.priority_score ?? '90'} / 100
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Observed Severity
              </span>
              <span className="text-xl font-bold capitalize text-slate-800">
                {report.severity}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Current Status
              </span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs font-bold rounded-md ${statusInfo.bg} ${statusInfo.text}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Description & Road Location */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium block mb-1">Description</span>
              <p className="text-sm font-semibold text-slate-900">
                {report.description || 'Pothole defect detected on road section.'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {report.latitude?.toFixed(6)}, {report.longitude?.toFixed(6)}
                </span>
                {report.address_hint && (
                  <span className="text-slate-500 font-sans ml-1">({report.address_hint})</span>
                )}
              </div>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Reported on: {new Date(report.created_at).toLocaleString()}</span>
              </span>
              {report.estimated_dimensions && (
                <span>Dimensions: <strong className="text-slate-700">{report.estimated_dimensions}</strong></span>
              )}
            </div>
          </div>

          {/* Workflow Status Controls (Handover Section 11: PUT /reports/{id}/status) */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Workflow Status Progression (PUT /reports/{report.id}/status)
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  { id: 'pending', label: 'Pending', icon: RotateCcw },
                  { id: 'verified', label: 'Verified', icon: CheckCircle2 },
                  { id: 'in_progress', label: 'In Progress', icon: Truck },
                  { id: 'resolved', label: 'Resolved', icon: Check },
                  { id: 'rejected', label: 'Rejected', icon: AlertTriangle },
                ] as const
              ).map((step) => {
                const isCurrent = report.status === step.id;
                const Icon = step.icon;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStatusChange(step.id)}
                    disabled={isUpdating || isCurrent}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      isCurrent
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
