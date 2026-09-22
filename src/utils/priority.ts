import { Report, PriorityLevel, SeverityLevel } from '../types';

/**
 * Calculates priority score (0-100) and priority level based on Section 14:
 * - Severity (High, Medium, Low)
 * - Detection confidence (0..1)
 * - Road/Location context factor
 */
export function computePriority(
  severity: SeverityLevel | string,
  confidence: number,
  customOffset: number = 0
): { score: number; level: PriorityLevel } {
  let severityScore = 20;
  const normalizedSeverity = (severity || '').toLowerCase();

  if (normalizedSeverity === 'high') {
    severityScore = 45;
  } else if (normalizedSeverity === 'medium') {
    severityScore = 30;
  } else if (normalizedSeverity === 'low') {
    severityScore = 15;
  }

  // Confidence contributes up to 40 points
  const confidenceScore = Math.min(Math.max(confidence, 0), 1) * 40;

  // Road density / repeat report factor
  const roadFactor = 10 + (customOffset % 15);

  let total = Math.round(severityScore + confidenceScore + roadFactor);
  total = Math.min(99, Math.max(15, total));

  let level: PriorityLevel = 'low';
  if (total >= 85) {
    level = 'critical';
  } else if (total >= 70) {
    level = 'high';
  } else if (total >= 45) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { score: total, level };
}

/**
 * Formats confidence decimal (e.g. 0.921187 -> 92.12%)
 * As specified in Section 7 & 28 of the guide.
 */
export function formatConfidence(confidence: number): string {
  if (typeof confidence !== 'number' || isNaN(confidence)) return '0.00%';
  const percentage = confidence <= 1 ? confidence * 100 : confidence;
  return `${percentage.toFixed(2)}%`;
}

/**
 * Resolves backend image path to a displayable browser URL.
 * Handles Windows paths (uploads\filename.jpeg), Unix paths, and absolute URLs.
 */
export function resolveImageUrl(imagePath: string, apiBaseUrl: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
    return imagePath;
  }

  // Normalize Windows backslashes: uploads\abc.jpeg -> uploads/abc.jpeg
  const normalized = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Format against API base URL: http://127.0.0.1:8000/uploads/abc.jpeg
  const base = apiBaseUrl.replace(/\/+$/, '');
  return `${base}/${normalized}`;
}

export function getPriorityBadgeColor(level?: string): { bg: string; text: string; border: string; badge: string; dot: string } {
  const norm = (level || '').toLowerCase();
  switch (norm) {
    case 'critical':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badge: 'bg-rose-600 text-white',
        dot: 'bg-rose-500',
      };
    case 'high':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        badge: 'bg-amber-500 text-white',
        dot: 'bg-amber-500',
      };
    case 'medium':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        badge: 'bg-sky-500 text-white',
        dot: 'bg-sky-500',
      };
    case 'low':
    default:
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-600 text-white',
        dot: 'bg-emerald-500',
      };
  }
}

export function getStatusBadgeInfo(status: string): { label: string; bg: string; text: string; dot: string } {
  switch (status) {
    case 'pending':
      return { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700 border border-amber-200', dot: 'bg-amber-500' };
    case 'verified':
      return { label: 'Verified', bg: 'bg-blue-50', text: 'text-blue-700 border border-blue-200', dot: 'bg-blue-500' };
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-indigo-50', text: 'text-indigo-700 border border-indigo-200', dot: 'bg-indigo-500 animate-pulse' };
    case 'resolved':
      return { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' };
    case 'rejected':
      return { label: 'Rejected', bg: 'bg-slate-100', text: 'text-slate-600 border border-slate-300', dot: 'bg-slate-400' };
    default:
      return { label: status, bg: 'bg-slate-50', text: 'text-slate-700 border border-slate-200', dot: 'bg-slate-400' };
  }
}
