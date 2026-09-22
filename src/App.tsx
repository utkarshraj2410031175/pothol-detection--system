import React, { useState, useEffect, useCallback } from 'react';
import { 
  Report, 
  CreateReportPayload, 
  ReportStatus, 
  ApiConfig 
} from './types';
import { 
  ApiService, 
  getStoredApiUrl, 
  setStoredApiUrl, 
  checkBackendHealth 
} from './services/api';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MaintenanceQueueView } from './components/MaintenanceQueueView';
import { ReportsListView } from './components/ReportsListView';
import { InteractiveMapView } from './components/InteractiveMapView';
import { ReportModal } from './components/ReportModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { BackendSettingsModal } from './components/BackendSettingsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);

  // API Config
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    baseUrl: getStoredApiUrl(),
    isLive: false,
    lastChecked: null,
    statusMessage: 'Checking backend status...',
  });

  // Fetch reports from backend (with automatic fallback to local store)
  const fetchReports = useCallback(async (customUrl?: string) => {
    const url = customUrl || apiConfig.baseUrl;
    setIsRefreshing(true);

    try {
      const result = await ApiService.getAllReports(url);
      setReports(result.data);
      setApiConfig((prev) => ({
        ...prev,
        baseUrl: url,
        isLive: result.isLive,
        lastChecked: new Date().toLocaleTimeString(),
        statusMessage: result.isLive
          ? `Connected to live FastAPI backend at ${url}`
          : `Running in Interactive Demo Mode (FastAPI at ${url} unreachable)`,
      }));
    } catch (e) {
      console.error('Failed to load reports', e);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [apiConfig.baseUrl]);

  // Initial load
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle report submission
  const handleCreateReport = async (payload: CreateReportPayload): Promise<Report | null> => {
    try {
      const res = await ApiService.createReport(payload, apiConfig.baseUrl);
      // Prepend or update reports
      setReports((prev) => [res.report, ...prev.filter((r) => r.id !== res.report.id)]);
      return res.report;
    } catch (err) {
      console.error('Failed to create report', err);
      return null;
    }
  };

  // Handle status update
  const handleUpdateStatus = async (id: number, newStatus: ReportStatus) => {
    try {
      await ApiService.updateStatus(id, newStatus, apiConfig.baseUrl);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Handle delete report
  const handleDeleteReport = async (id: number) => {
    try {
      await ApiService.deleteReport(id, apiConfig.baseUrl);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error('Failed to delete report', err);
    }
  };

  // Handle Base URL update
  const handleUpdateBaseUrl = (newUrl: string) => {
    setStoredApiUrl(newUrl);
    setApiConfig((prev) => ({ ...prev, baseUrl: newUrl }));
    fetchReports(newUrl);
  };

  // Test backend connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    const isLive = await checkBackendHealth(apiConfig.baseUrl);
    setIsTestingConnection(false);
    setApiConfig((prev) => ({
      ...prev,
      isLive,
      lastChecked: new Date().toLocaleTimeString(),
      statusMessage: isLive
        ? `Successfully connected to FastAPI at ${apiConfig.baseUrl}`
        : `Could not reach ${apiConfig.baseUrl}. Is uvicorn running?`,
    }));
    if (isLive) {
      fetchReports();
    }
  };

  // Reset demo data
  const handleResetDemoData = () => {
    const defaultReports = ApiService.resetDemoData();
    setReports(defaultReports);
  };

  const criticalCount = reports.filter(
    (r) => (r.priority_level || '').toLowerCase() === 'critical'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-amber-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        apiConfig={apiConfig}
        onRefreshData={() => fetchReports()}
        isRefreshing={isRefreshing}
        totalCritical={criticalCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-600">
              Initializing Pothole Detection System...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                reports={reports}
                onSelectReport={setSelectedReport}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onNavigateToPriority={() => setCurrentTab('priority')}
                onNavigateToReports={() => setCurrentTab('reports')}
                onNavigateToMap={() => setCurrentTab('map')}
              />
            )}

            {currentTab === 'priority' && (
              <MaintenanceQueueView
                reports={reports}
                onSelectReport={setSelectedReport}
                onUpdateStatus={handleUpdateStatus}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsListView
                reports={reports}
                onSelectReport={setSelectedReport}
                onUpdateStatus={handleUpdateStatus}
                onDeleteReport={handleDeleteReport}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            )}

            {currentTab === 'map' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">
                      Geographic Road Infrastructure Map
                    </h1>
                    <p className="text-xs text-slate-500">
                      Pinpointed pothole hazards color-coded by maintenance urgency level (Critical, High, Medium, Low).
                    </p>
                  </div>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                  >
                    + Report at Current Location
                  </button>
                </div>

                <InteractiveMapView
                  reports={reports}
                  onSelectReport={setSelectedReport}
                  selectedReportId={selectedReport?.id}
                  className="h-[calc(100vh-250px)] min-h-[500px] w-full"
                  isCompact={false}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Report Pothole Modal (Section 6, 7 & 17) */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleCreateReport}
        apiBaseUrl={apiConfig.baseUrl}
        onNavigateToReport={(reportId) => {
          const found = reports.find((r) => r.id === reportId);
          if (found) setSelectedReport(found);
          setCurrentTab('priority');
        }}
      />

      {/* Report Details Modal (Section 10 & 11) */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpdateStatus={handleUpdateStatus}
        onDeleteReport={handleDeleteReport}
      />

      {/* Backend Settings & Swagger Modal (Section 4, 20 & 28) */}
      <BackendSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        apiConfig={apiConfig}
        onUpdateBaseUrl={handleUpdateBaseUrl}
        onTestConnection={handleTestConnection}
        onResetDemoData={handleResetDemoData}
        isTesting={isTestingConnection}
      />
    </div>
  );
}
