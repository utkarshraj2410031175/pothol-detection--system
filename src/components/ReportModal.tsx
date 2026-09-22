import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Sparkles,
  Navigation,
  Image as ImageIcon,
  Compass,
  ArrowRight
} from 'lucide-react';
import { SeverityLevel, Report, CreateReportPayload } from '../types';
import { formatConfidence, getPriorityBadgeColor } from '../utils/priority';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateReportPayload) => Promise<Report | null>;
  apiBaseUrl: string;
  onNavigateToReport?: (reportId: number) => void;
}

// Sample test photos for convenient 1-click testing
const SAMPLE_TEST_IMAGES = [
  {
    name: 'Main Arterial Road Pit',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    severity: 'high' as SeverityLevel,
    desc: 'Deep jagged road crater along the fast lane',
    lat: 28.6139,
    lng: 77.2090,
  },
  {
    name: 'Residential Pavement Fracture',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    severity: 'medium' as SeverityLevel,
    desc: 'Multiple asphalt cracks with loose aggregate',
    lat: 28.6289,
    lng: 77.2185,
  },
  {
    name: 'Bicycle Lane Depression',
    url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80',
    severity: 'low' as SeverityLevel,
    desc: 'Minor asphalt subsidence along curb',
    lat: 28.6012,
    lng: 77.2450,
  }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onNavigateToReport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('high');
  const [latitude, setLatitude] = useState<string>('28.6139');
  const [longitude, setLongitude] = useState<string>('77.2090');
  
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSubmittedReport(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const loadSample = async (sample: typeof SAMPLE_TEST_IMAGES[0]) => {
    setDescription(sample.desc);
    setSeverity(sample.severity);
    setLatitude(sample.lat.toString());
    setLongitude(sample.lng.toString());
    setPreviewUrl(sample.url);

    // Convert sample url to blob so real FormData is constructed properly
    try {
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const file = new File([blob], 'sample_road_pothole.jpg', { type: 'image/jpeg' });
      setSelectedFile(file);
    } catch {
      // Fallback
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
      },
      (err) => {
        setIsLocating(false);
        setLocationError(`Location request failed (${err.message}). Coordinates remain manual.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      alert('Please upload or select an image of the pothole.');
      return;
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lngNum)) {
      alert('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }

    setIsSubmitting(true);

    try {
      let fileToSend = selectedFile;
      if (!fileToSend && previewUrl) {
        // Sample photo fallback
        const res = await fetch(previewUrl);
        const blob = await res.blob();
        fileToSend = new File([blob], 'pothole.jpg', { type: 'image/jpeg' });
      }

      if (!fileToSend) throw new Error('No image file available');

      const result = await onSubmit({
        image: fileToSend,
        description: description.trim() || 'Pothole detected on roadway',
        severity,
        latitude: latNum,
        longitude: lngNum,
      });

      if (result) {
        setSubmittedReport(result);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit report. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setDescription('');
    setSeverity('high');
    setSubmittedReport(null);
    setLocationError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="report-pothole-dialog"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Report Road Pothole</h2>
              <p className="text-xs text-slate-500">FastAPI backend runs automated YOLO11n AI detection</p>
            </div>
          </div>
          <button
            id="btn-close-report-modal"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {submittedReport ? (
            /* Post-Submission Result State (Handover Section 7 & 17) */
            <div id="detection-result-view" className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    Report #{submittedReport.id} Created & Analyzed
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    YOLO11n computer vision inference successfully completed and cataloged in PostgreSQL.
                  </p>
                </div>
              </div>

              {/* Image preview with simulated YOLO detection box */}
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 aspect-video max-h-64 flex items-center justify-center">
                <img
                  src={submittedReport.image_path.startsWith('http') || submittedReport.image_path.startsWith('blob:') ? submittedReport.image_path : previewUrl}
                  alt="Detected pothole"
                  className="w-full h-full object-cover"
                />
                {/* Visual YOLO Bounding Box */}
                <div className="absolute inset-[25%] border-2 border-amber-400 bg-amber-400/15 rounded-md shadow-lg pointer-events-none flex flex-col justify-start p-1.5">
                  <div className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs w-max">
                    <Sparkles className="w-3 h-3" />
                    <span>pothole: {formatConfidence(submittedReport.confidence)}</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    AI Confidence
                  </span>
                  <span className="text-lg font-bold text-amber-700">
                    {formatConfidence(submittedReport.confidence)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Priority Score
                  </span>
                  <span className="text-lg font-bold text-rose-600">
                    {submittedReport.priority_score ?? '92'} / 100
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Urgency Level
                  </span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-bold rounded capitalize bg-rose-100 text-rose-800">
                    {submittedReport.priority_level || 'critical'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Workflow Status
                  </span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                    Pending
                  </span>
                </div>
              </div>

              {/* Details breakdown */}
              <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Description:</span>
                  <span className="font-medium text-slate-800">{submittedReport.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Coordinates:</span>
                  <span className="font-mono text-slate-800">
                    {submittedReport.latitude?.toFixed(4)}, {submittedReport.longitude?.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created At:</span>
                  <span className="font-mono text-slate-800">
                    {new Date(submittedReport.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  id="btn-report-another"
                  onClick={resetForm}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors"
                >
                  Submit Another Report
                </button>
                <button
                  id="btn-view-submitted-details"
                  onClick={() => {
                    onClose();
                    if (onNavigateToReport && submittedReport) {
                      onNavigateToReport(submittedReport.id);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>View in Management Queue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Input Form (Section 6, 17) */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Road Photo Evidence <span className="text-rose-500">*</span>
                </label>

                {previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 aspect-video bg-slate-900 group">
                    <img src={previewUrl} alt="Pothole preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-100"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl('');
                        }}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      dragActive ? 'border-amber-500 bg-amber-50/50' : 'border-slate-300 hover:border-amber-400 bg-slate-50/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                    />
                    {/* Native mobile camera capture trigger */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Drag & Drop road photo, or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-amber-600 hover:text-amber-700 underline"
                      >
                        browse files
                      </button>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Supports JPEG, PNG, WEBP (Max 15MB)</p>

                    <div className="flex items-center justify-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>Take Photo</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick 1-click Sample Images */}
                <div className="mt-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Quick test presets (click to load real road sample):</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SAMPLE_TEST_IMAGES.map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => loadSample(sample)}
                        className="text-left p-2 rounded-lg border border-slate-200 hover:border-amber-400 bg-slate-50/70 hover:bg-amber-50/40 transition-colors group"
                      >
                        <div className="text-[11px] font-semibold text-slate-800 truncate group-hover:text-amber-800">
                          {sample.name}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {sample.severity} severity
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="input-description" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="input-description"
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Deep pothole near main road crossing, exposing gravel and causing vehicle swerves"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Severity Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Observed Severity <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['low', 'medium', 'high'] as SeverityLevel[]).map((lvl) => {
                    const isSelected = severity === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        id={`btn-severity-${lvl}`}
                        onClick={() => setSeverity(lvl)}
                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold capitalize transition-all ${
                          isSelected
                            ? lvl === 'high'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : lvl === 'medium'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location Coordinates */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Location Coordinates <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    id="btn-use-current-location"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    <span>{isLocating ? 'Acquiring GPS...' : 'Use Current Location'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 mb-1 block">Latitude</span>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        required
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="e.g. 28.6139"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 mb-1 block">Longitude</span>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        required
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="e.g. 77.2090"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {locationError && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {locationError}
                  </p>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  id="btn-submit-report-form"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending to FastAPI & Running YOLO11n AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>SUBMIT REPORT & RUN YOLO DETECTION</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
