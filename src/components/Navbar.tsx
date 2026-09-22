import React, { useState } from 'react';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  ListFilter, 
  MapPin, 
  Flame, 
  PlusCircle, 
  Settings, 
  Menu, 
  X, 
  Wifi, 
  WifiOff,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { ApiConfig } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenReportModal: () => void;
  onOpenSettingsModal: () => void;
  apiConfig: ApiConfig;
  onRefreshData: () => void;
  isRefreshing: boolean;
  totalCritical: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenReportModal,
  onOpenSettingsModal,
  apiConfig,
  onRefreshData,
  isRefreshing,
  totalCritical,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'priority', label: 'Priority Queue', icon: Flame, badge: totalCritical > 0 ? totalCritical : undefined },
    { id: 'reports', label: 'Reports', icon: ListFilter },
    { id: 'map', label: 'Map View', icon: MapPin },
  ];

  return (
    <>
      <header id="app-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <button
                id="brand-logo-btn"
                onClick={() => onSelectTab('dashboard')}
                className="flex items-center gap-2.5 text-left focus:outline-none group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 text-white font-bold transition-transform group-hover:scale-105">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold tracking-tight text-slate-900">PotholeAI</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      YOLO11n
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 hidden sm:block">Road Maintenance Platform</p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => onSelectTab(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'text-amber-700 bg-amber-50 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Action Items */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Refresh button */}
              <button
                id="btn-refresh-data"
                onClick={onRefreshData}
                title="Refresh reports from backend"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
              </button>

              {/* API Connection Indicator */}
              <button
                id="btn-api-status"
                onClick={onOpenSettingsModal}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  apiConfig.isLive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                title={apiConfig.statusMessage}
              >
                {apiConfig.isLive ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span>FastAPI Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Demo Mode</span>
                  </>
                )}
              </button>

              {/* Report Pothole Button */}
              <button
                id="btn-open-report-modal"
                onClick={onOpenReportModal}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Report Pothole</span>
                <span className="sm:hidden">Report</span>
              </button>

              {/* Settings / API Modal Trigger */}
              <button
                id="btn-settings-toggle"
                onClick={onOpenSettingsModal}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Backend API Configuration & Swagger"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Mobile menu hamburger */}
              <button
                id="btn-mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium ${
                    isActive ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
            
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Backend Status:</span>
              <button
                onClick={() => {
                  onOpenSettingsModal();
                  setMobileMenuOpen(false);
                }}
                className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                  apiConfig.isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {apiConfig.isLive ? 'FastAPI Live (:8000)' : 'Interactive Demo Mode'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (for rapid thumb access on phones) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[56px] min-h-[44px] transition-colors relative ${
                isActive ? 'text-amber-700' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
        <button
          onClick={onOpenReportModal}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[56px] min-h-[44px] text-amber-600 font-bold"
        >
          <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 text-amber-700">Add</span>
        </button>
      </div>
    </>
  );
};
