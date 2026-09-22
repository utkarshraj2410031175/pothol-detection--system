/**
 * Pothole Detection System - Data Contracts & Types
 * Based on Frontend Developer Handover & API Integration Guide (Section 22)
 */

export type SeverityLevel = 'low' | 'medium' | 'high';

export type ReportStatus = 'pending' | 'verified' | 'in_progress' | 'resolved' | 'rejected';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface Report {
  id: number;
  image_path: string;
  description: string | null;
  severity: SeverityLevel | string;
  latitude: number | null;
  longitude: number | null;
  confidence: number; // decimal 0..1 (e.g. 0.921187)
  status: ReportStatus;
  created_at: string; // ISO 8601 string
  // Future backend prioritisation fields
  priority_score?: number; // 0..100
  priority_level?: PriorityLevel | string;
  // Optional metadata for rich UI experience
  address_hint?: string;
  estimated_dimensions?: string; // e.g. "45cm x 30cm, ~8cm depth"
  assigned_team?: string;
}

export interface CreateReportPayload {
  image: File | Blob;
  description: string;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
}

export interface ApiConfig {
  baseUrl: string;
  isLive: boolean;
  lastChecked: string | null;
  statusMessage: string;
}
