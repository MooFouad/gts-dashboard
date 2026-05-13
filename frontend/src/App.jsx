import React, { useState, useEffect } from 'react';
import ConnectionBanner from './components/common/ConnectionBanner';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import HomeRentsContainer from './components/homeRents/HomeRentsContainer';
import ElectricityContainer from './components/electricity/ElectricityContainer';
import AbsherContainer from './components/absher/AbsherContainer';
import SocialInsuranceContainer from './components/socialInsurance/SocialInsuranceContainer';
import GOSIContainer from './components/gosi/GOSIContainer';
import { vehicleService, homeRentService, electricityService, socialInsuranceService, absherService, gosiService } from './services';

// Lazy load notification settings
const NotificationSettings = React.lazy(() =>
  import('./components/common/NotificationSettings').catch(() => ({
    default: () => <div>Notification Settings Not Available</div>
  }))
);

const App = () => {
  const [activeTab, setActiveTab] = useState('absher');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [counts, setCounts] = useState({
    vehicles: 0,
    homeRents: 0,
    electricity: 0,
    absher: 0,
    socialInsurance: 0,
    gosi: 0,
    insurance: 0,
    mvpi: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const results = await Promise.allSettled([
          vehicleService.getCount(),
          homeRentService.getCount(),
          electricityService.getCount(),
          absherService.getCount(),
          socialInsuranceService.getCount(),
          gosiService.getCount()
        ]);

        const [vehiclesCount, homeRentsCount, electricityCount, absherCount, socialInsuranceCount, gosiCount] = results.map(
          result => result.status === 'fulfilled' ? result.value : { count: 0 }
        );

        setCounts({
          vehicles: vehiclesCount.count || 0,
          homeRents: homeRentsCount.count || 0,
          electricity: electricityCount.count || 0,
          absher: absherCount.count || 0,
          socialInsurance: socialInsuranceCount.count || 0,
          gosi: gosiCount.count || 0,
          insurance: 0,
          mvpi: 0
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();

    const handleCountUpdate = (event) => {
      const { type, count } = event.detail;
      setCounts(prevCounts => ({
        ...prevCounts,
        [type]: count
      }));
    };

    window.addEventListener('itemCountUpdate', handleCountUpdate);
    return () => window.removeEventListener('itemCountUpdate', handleCountUpdate);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ConnectionBanner />
      <Header
        sidebarCollapsed={sidebarCollapsed}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        onSettingsClick={handleSettingsClick}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          vehiclesCount={counts.vehicles}
          homeRentsCount={counts.homeRents}
          electricityCount={counts.electricity}
          absherCount={counts.absher}
          socialInsuranceCount={counts.socialInsurance}
          gosiCount={counts.gosi}
          insuranceCount={counts.insurance}
          mvpiCount={counts.mvpi}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-64'}`}>
          <div className="p-2 sm:p-4">
            <div className={activeTab === 'absher' ? 'block' : 'hidden'}>
              <AbsherContainer />
            </div>

            <div className={activeTab === 'homeRents' ? 'block' : 'hidden'}>
              <HomeRentsContainer />
            </div>

            <div className={activeTab === 'electricity' ? 'block' : 'hidden'}>
              <ElectricityContainer />
            </div>

            <div className={activeTab === 'socialInsurance' ? 'block' : 'hidden'}>
              <SocialInsuranceContainer />
            </div>

            <div className={activeTab === 'gosi' ? 'block' : 'hidden'}>
              <GOSIContainer />
            </div>
          </div>
        </main>
      </div>

      {/* Notification Settings Popup */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4 animate-fade-in" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-xl shadow-modal w-full max-w-2xl max-h-[70vh] overflow-y-auto animate-slide-down" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Notification Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="btn-icon !p-1.5 text-slate-400 hover:text-slate-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6">
              <React.Suspense fallback={
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-navy-200 border-t-navy-600"></div>
                </div>
              }>
                <NotificationSettings />
              </React.Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
