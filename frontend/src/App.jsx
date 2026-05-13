import React, { useState, useEffect } from 'react';
import ConnectionBanner from './components/common/ConnectionBanner';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import StatusLegend from './components/common/StatusLegend';
import HomeRentsContainer from './components/homeRents/HomeRentsContainer';
import ElectricityContainer from './components/electricity/ElectricityContainer';
import AbsherContainer from './components/absher/AbsherContainer';
import SocialInsuranceContainer from './components/socialInsurance/SocialInsuranceContainer';
import GOSIContainer from './components/gosi/GOSIContainer';
// Commented out - No data available yet
// import VehiclesContainer from './components/vehicles/VehiclesContainer';
// import InsuranceContainer from './components/insurance/InsuranceContainer';
// import MVPIContainer from './components/mvpi/MVPIContainer';
import { vehicleService, homeRentService, electricityService, socialInsuranceService, absherService, gosiService } from './services';
// import { insuranceService, mvpiService } from './services';

// Lazy load notification components to prevent errors
const NotificationSettings = React.lazy(() =>
  import('./components/common/NotificationSettings').catch(() => ({
    default: () => <div>Notification Settings Not Available</div>
  }))
);

const NotificationDiagnostics = React.lazy(() =>
  import('./components/common/NotificationDiagnostics').catch(() => ({
    default: () => <div>Diagnostics Not Available</div>
  }))
);

const App = () => {
  const [activeTab, setActiveTab] = useState('absher');
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
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
    // Fetch initial counts from API
    const fetchCounts = async () => {
      try {
        // Use Promise.allSettled to handle individual failures gracefully
        const results = await Promise.allSettled([
          vehicleService.getCount(),
          homeRentService.getCount(),
          electricityService.getCount(),
          absherService.getCount(),
          socialInsuranceService.getCount(),
          gosiService.getCount()
          // insuranceService.getCount(),
          // mvpiService.getCount()
        ]);

        // Extract counts, defaulting to 0 if failed
        // API service returns JSON directly (not wrapped like axios)
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
          insurance: 0, // insuranceCount.count,
          mvpi: 0 // mvpiCount.count
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();

    // Listen for count updates
    const handleCountUpdate = (event) => {
      const { type, count } = event.detail;
      setCounts(prevCounts => ({
        ...prevCounts,
        [type]: count
      }));
    };

    window.addEventListener('itemCountUpdate', handleCountUpdate);

    return () => {
      window.removeEventListener('itemCountUpdate', handleCountUpdate);
    };
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
    setShowDiagnostics(false);
  };

  const handleDiagnosticsClick = () => {
    setShowDiagnostics(!showDiagnostics);
    setShowSettings(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ConnectionBanner />
      <Header
        sidebarCollapsed={sidebarCollapsed}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Mobile & Desktop */}
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
          onSettingsClick={handleSettingsClick}
          onDiagnosticsClick={handleDiagnosticsClick}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? '' : 'md:ml-64'}`}>
          <StatusLegend />

          {/* Notification Diagnostics Panel */}
          {showDiagnostics && (
            <div className="max-w-7xl mx-auto px-4 py-4">
              <React.Suspense fallback={<div className="text-center py-4">Loading...</div>}>
                <NotificationDiagnostics />
              </React.Suspense>
            </div>
          )}

          {/* Notification Settings Panel */}
          {showSettings && (
            <div className="max-w-7xl mx-auto px-4 py-4">
              <React.Suspense fallback={<div className="text-center py-4">Loading...</div>}>
                <NotificationSettings />
              </React.Suspense>
            </div>
          )}

          <div className="p-2 sm:p-4">
        {/* replaced by Tamm api data */}
        {/* <div className={activeTab === 'vehicles' ? 'block' : 'hidden'}>
          <VehiclesContainer />
        </div> */}

          <div className={activeTab === 'absher' ? 'block' : 'hidden'}>
          <AbsherContainer />
        </div>

        {/* Commented out - No data available yet */}
        {/* <div className={activeTab === 'insurance' ? 'block' : 'hidden'}>
          <InsuranceContainer />
        </div>

        <div className={activeTab === 'mvpi' ? 'block' : 'hidden'}>
          <MVPIContainer />
        </div> */}

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
    </div>
  );
};

export default App;