import { Report, CreateReportPayload, ReportStatus } from '../types';
import { computePriority } from '../utils/priority';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';
const STORAGE_KEY = 'pothole_reports_store_v1';
const API_URL_KEY = 'pothole_api_base_url';

export function getStoredApiUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(API_URL_KEY) || DEFAULT_API_BASE_URL;
  }
  return DEFAULT_API_BASE_URL;
}

export function setStoredApiUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_URL_KEY, url);
  }
}

// Initial realistic seed reports matching PDF handover specification & real locations
const SEED_REPORTS: Report[] = [
  {
    id: 18,
    image_path: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    description: 'Deep road cavity on Ring Road near Expressway exit ramp',
    severity: 'high',
    latitude: 28.6139,
    longitude: 77.2090,
    confidence: 0.9482,
    status: 'in_progress',
    created_at: '2026-09-20T14:22:10.000Z',
    priority_score: 92,
    priority_level: 'critical',
    address_hint: 'Ring Road, Sector 4 South Corridor',
    estimated_dimensions: '60cm x 45cm, ~12cm depth',
    assigned_team: 'Rapid Pavement Squad #4',
  },
  {
    id: 24,
    image_path: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    description: 'Severe asphalt fracturing with exposed gravel on school crossing lane',
    severity: 'high',
    latitude: 28.6289,
    longitude: 77.2185,
    confidence: 0.8974,
    status: 'verified',
    created_at: '2026-09-21T09:15:42.000Z',
    priority_score: 81,
    priority_level: 'high',
    address_hint: 'Lincoln Ave & 5th St Crossing',
    estimated_dimensions: '40cm x 35cm, ~9cm depth',
    assigned_team: 'Metro Roads Team B',
  },
  {
    id: 11,
    image_path: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80',
    description: 'Multiple clustered edge potholes causing tire damage on commercial truck route',
    severity: 'high',
    latitude: 28.5821,
    longitude: 77.2341,
    confidence: 0.8711,
    status: 'pending',
    created_at: '2026-09-21T18:40:19.000Z',
    priority_score: 76,
    priority_level: 'high',
    address_hint: 'Industrial Logistics Boulevard',
    estimated_dimensions: '75cm x 50cm, ~7cm depth',
  },
  {
    id: 7,
    image_path: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80',
    description: 'Sunken storm drain perimeter with noticeable pothole lip',
    severity: 'medium',
    latitude: 28.6415,
    longitude: 77.1982,
    confidence: 0.8145,
    status: 'pending',
    created_at: '2026-09-22T06:12:00.000Z',
    priority_score: 54,
    priority_level: 'medium',
    address_hint: 'Oakridge Residential Way',
    estimated_dimensions: '30cm x 25cm, ~5cm depth',
  },
  {
    id: 6,
    image_path: 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=800&q=80',
    description: 'Pothole detected outside residential entrance near speed breaker',
    severity: 'high',
    latitude: 27.8989,
    longitude: 77.9800,
    confidence: 0.921187,
    status: 'verified',
    created_at: '2026-09-13T18:05:35.784Z',
    priority_score: 88,
    priority_level: 'critical',
    address_hint: 'Civil Lines Road, Gate 2',
    estimated_dimensions: '55cm x 40cm, ~11cm depth',
    assigned_team: 'Municipal Asphalt Unit #1',
  },
  {
    id: 3,
    image_path: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80',
    description: 'Minor surface chipping and small depression along bicycle lane',
    severity: 'low',
    latitude: 28.6012,
    longitude: 77.2450,
    confidence: 0.7233,
    status: 'resolved',
    created_at: '2026-09-18T11:04:12.000Z',
    priority_score: 31,
    priority_level: 'low',
    address_hint: 'Greenway Bike Path km 3.2',
    estimated_dimensions: '20cm x 15cm, ~3cm depth',
  }
];

function getLocalStore(): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REPORTS));
      return SEED_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_REPORTS;
  }
}

function saveLocalStore(reports: Report[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

/**
 * Checks if the backend at apiUrl is reachable.
 */
export async function checkBackendHealth(apiUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    // FastAPI will respond to GET /reports/ or /docs or /
    const res = await fetch(`${apiUrl.replace(/\/+$/, '')}/reports/`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * API Service implementing all contracts in Section 5 & 6
 */
export const ApiService = {
  /**
   * GET /reports/
   * Return all reports for dashboard/list/map
   */
  async getAllReports(baseUrl: string): Promise<{ data: Report[]; isLive: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/reports/`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const rawList = await res.json();
        // Ensure priority_score and priority_level are present (Section 13 & 22)
        const reports: Report[] = (rawList as Report[]).map((r, idx) => {
          if (r.priority_score && r.priority_level) return r;
          const pri = computePriority(r.severity, r.confidence, idx * 3);
          return {
            ...r,
            priority_score: pri.score,
            priority_level: pri.level,
          };
        });
        return { data: reports, isLive: true };
      }
    } catch {
      // Backend not running locally - fallback seamlessly to interactive local store
    }

    const localData = getLocalStore();
    return { data: localData, isLive: false };
  },

  /**
   * GET /reports/{report_id}
   * Return one report
   */
  async getReportById(id: number, baseUrl: string): Promise<{ data: Report; isLive: boolean }> {
    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/reports/${id}`);
      if (res.ok) {
        const item: Report = await res.json();
        if (!item.priority_score || !item.priority_level) {
          const pri = computePriority(item.severity, item.confidence, item.id);
          item.priority_score = pri.score;
          item.priority_level = pri.level;
        }
        return { data: item, isLive: true };
      }
    } catch {
      // Fallback
    }

    const localList = getLocalStore();
    const found = localList.find((r) => r.id === id) || localList[0];
    return { data: found, isLive: false };
  },

  /**
   * POST /reports/
   * Multipart/form-data upload.
   * Backend runs YOLO11n, extracts confidence and saves to DB.
   */
  async createReport(
    payload: CreateReportPayload,
    baseUrl: string
  ): Promise<{ report: Report; isLive: boolean }> {
    const formData = new FormData();
    formData.append('image', payload.image);
    formData.append('description', payload.description);
    formData.append('severity', payload.severity);
    formData.append('latitude', payload.latitude.toString());
    formData.append('longitude', payload.longitude.toString());

    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/reports/`, {
        method: 'POST',
        body: formData,
        // Do not set Content-Type header manually; browser provides multipart boundary
      });

      if (res.ok) {
        const created: Report = await res.json();
        const pri = computePriority(created.severity, created.confidence, created.id);
        const enriched: Report = {
          ...created,
          priority_score: created.priority_score ?? pri.score,
          priority_level: created.priority_level ?? pri.level,
        };
        return { report: enriched, isLive: true };
      }
    } catch {
      // Local simulated YOLO11n detection fallback
    }

    // High fidelity YOLO11n detection simulation
    let simulatedConfidence = 0.9125;
    if (payload.severity === 'high') {
      simulatedConfidence = 0.91 + Math.random() * 0.07; // 91% - 98%
    } else if (payload.severity === 'medium') {
      simulatedConfidence = 0.78 + Math.random() * 0.12; // 78% - 90%
    } else {
      simulatedConfidence = 0.65 + Math.random() * 0.15; // 65% - 80%
    }
    simulatedConfidence = Math.min(0.99, Number(simulatedConfidence.toFixed(6)));

    // Create object URL or read as data URL for persistent image viewing in local mode
    let imageDisplayUrl = '';
    if (payload.image instanceof Blob) {
      imageDisplayUrl = URL.createObjectURL(payload.image);
    } else {
      imageDisplayUrl = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
    }

    const currentList = getLocalStore();
    const nextId = currentList.length > 0 ? Math.max(...currentList.map((r) => r.id)) + 1 : 1;
    const pri = computePriority(payload.severity, simulatedConfidence, nextId);

    const newReport: Report = {
      id: nextId,
      image_path: imageDisplayUrl,
      description: payload.description,
      severity: payload.severity,
      latitude: payload.latitude,
      longitude: payload.longitude,
      confidence: simulatedConfidence,
      status: 'pending',
      created_at: new Date().toISOString(),
      priority_score: pri.score,
      priority_level: pri.level,
      address_hint: `Coordinates: ${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}`,
      estimated_dimensions: payload.severity === 'high' ? '50cm x 40cm, ~10cm depth' : '30cm x 25cm, ~5cm depth',
    };

    saveLocalStore([newReport, ...currentList]);
    return { report: newReport, isLive: false };
  },

  /**
   * PUT /reports/{report_id}/status
   * Controlled status change
   */
  async updateStatus(
    id: number,
    newStatus: ReportStatus,
    baseUrl: string
  ): Promise<{ success: boolean; isLive: boolean }> {
    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        return { success: true, isLive: true };
      }
    } catch {
      // Local fallback
    }

    const list = getLocalStore();
    const updated = list.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
    saveLocalStore(updated);
    return { success: true, isLive: false };
  },

  /**
   * DELETE /reports/{report_id}
   */
  async deleteReport(id: number, baseUrl: string): Promise<{ success: boolean; isLive: boolean }> {
    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/reports/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        return { success: true, isLive: true };
      }
    } catch {
      // Local fallback
    }

    const list = getLocalStore();
    const filtered = list.filter((item) => item.id !== id);
    saveLocalStore(filtered);
    return { success: true, isLive: false };
  },

  /**
   * Resets local demo data to default seed
   */
  resetDemoData(): Report[] {
    saveLocalStore(SEED_REPORTS);
    return SEED_REPORTS;
  }
};
