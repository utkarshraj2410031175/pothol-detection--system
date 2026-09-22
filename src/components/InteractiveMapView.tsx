import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  ExternalLink, 
  Navigation, 
  Maximize2, 
  Sparkles,
  Info,
  Filter
} from 'lucide-react';
import { Report, PriorityLevel } from '../types';
import { formatConfidence, getPriorityBadgeColor, getStatusBadgeInfo } from '../utils/priority';

interface InteractiveMapViewProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
  selectedReportId?: number | null;
  className?: string;
  isCompact?: boolean;
}

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  reports,
  onSelectReport,
  selectedReportId,
  className = '',
  isCompact = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeReportInView, setActiveReportInView] = useState<Report | null>(null);

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (filterPriority !== 'all' && (r.priority_level || '').toLowerCase() !== filterPriority.toLowerCase()) {
      return false;
    }
    if (filterStatus !== 'all' && r.status !== filterStatus) {
      return false;
    }
    return r.latitude !== null && r.longitude !== null;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center (New Delhi / NCR area matching seed, or auto-fit)
      const defaultCenter: [number, number] = [28.6139, 77.2090];
      const initialZoom = isCompact ? 11 : 12;

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: initialZoom,
        zoomControl: !isCompact,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map alive unless unmounted
    };
  }, [isCompact]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const bounds = L.latLngBounds([]);

    filteredReports.forEach((report) => {
      if (report.latitude == null || report.longitude == null) return;

      const lat = report.latitude;
      const lng = report.longitude;
      bounds.extend([lat, lng]);

      const priorityLevel = (report.priority_level || 'low').toLowerCase() as PriorityLevel;
      const isCritical = priorityLevel === 'critical';
      const isHigh = priorityLevel === 'high';

      // Custom HTML Marker Icon
      const markerColor = isCritical 
        ? '#e11d48' 
        : isHigh 
        ? '#ea580c' 
        : priorityLevel === 'medium' 
        ? '#0284c7' 
        : '#10b981';

      const isSelected = selectedReportId === report.id;

      const customHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isCritical ? '<div class="absolute -inset-2 rounded-full bg-rose-500/30 animate-ping"></div>' : ''}
          <div style="background-color: ${markerColor};" 
               class="w-8 h-8 rounded-full border-2 ${isSelected ? 'border-white ring-4 ring-amber-500 scale-125' : 'border-white shadow-md'} flex items-center justify-center text-white text-xs font-bold transition-transform">
            ${report.priority_score ?? report.id}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-pothole-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setActiveReportInView(report);
      });

      markersLayer.addLayer(marker);
    });

    if (bounds.isValid() && filteredReports.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [filteredReports, selectedReportId]);

  const fitAllMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map || filteredReports.length === 0) return;
    const bounds = L.latLngBounds(
      filteredReports
        .filter((r) => r.latitude !== null && r.longitude !== null)
        .map((r) => [r.latitude!, r.longitude!])
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs ${className}`}>
      {/* Map Control Bar (Header) */}
      {!isCompact && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Geospatial Pothole Map</h3>
              <p className="text-[11px] text-slate-500">
                Displaying {filteredReports.length} road reports with priority ranking
              </p>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 hidden sm:inline">Priority:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical Only</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
                <option value="low">Low Only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 hidden sm:inline">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <button
              onClick={fitAllMarkers}
              title="Fit map to all markers"
              className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="relative flex-1 min-h-[300px] w-full">
        <div ref={mapContainerRef} className="w-full h-full min-h-[320px] z-0" />

        {/* Priority Legend Overlay */}
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-slate-200 shadow-md text-[11px] space-y-1">
          <div className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider mb-1">
            Priority Index
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span className="text-slate-700">Critical (&gt;85)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-slate-700">High (70-84)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span className="text-slate-700">Medium (45-69)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-700">Low (&lt;45)</span>
          </div>
        </div>

        {/* Selected Marker Detail Card Popover */}
        {activeReportInView && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-20 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 animate-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">
                  #{activeReportInView.id}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    getPriorityBadgeColor(activeReportInView.priority_level).badge
                  }`}
                >
                  {activeReportInView.priority_level || 'Normal'} Priority (
                  {activeReportInView.priority_score ?? '—'})
                </span>
              </div>
              <button
                onClick={() => setActiveReportInView(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-800 mt-2 line-clamp-2">
              {activeReportInView.description}
            </p>

            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Confidence: {formatConfidence(activeReportInView.confidence)}</span>
              <span className="capitalize">{activeReportInView.status.replace('_', ' ')}</span>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  onSelectReport(activeReportInView);
                }}
                className="flex-1 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>View Full Details</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
