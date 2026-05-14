import React, { useState, useEffect } from 'react';
import { checkNotificationPermission, checkAndSendNotifications } from './utils/notificationUtils';
import Header from './components/layout/Header';
import TabNavigation from './components/layout/TabNavigation';
import { getDataCount } from './utils/dataUtils';
import Toolbar from './components/layout/Toolbar';
import StatusLegend from './components/common/StatusLegend';
import VehiclesContainer from './components/vehicles/VehiclesContainer';
import HomeRentsContainer from './components/homeRents/HomeRentsContainer';
import ConfirmDialog from './components/common/ConfirmDialog';
import { mockVehicles } from './data/mockVehicles';
import { mockHomeRents } from './data/mockHomeRents';
import { mockElectricity } from './data/mockElectricity';
import ElectricityContainer from './components/electricity/ElectricityContainer';
import { loadSavedData } from './utils/storageUtils';

const App = () => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [counts, setCounts] = useState({
    vehicles: getDataCount('vehicles'),
    homeRents: getDataCount('homeRents'),
    electricity: getDataCount('electricity')
  });

  useEffect(() => {
    // طلب إذن الإشعارات عند بدء التطبيق
    checkNotificationPermission();

    // Initial count setup
    setCounts({
      vehicles: getDataCount('vehicles'),
      homeRents: getDataCount('homeRents'),
      electricity: getDataCount('electricity')
    });

    // Listen for count updates
    const handleCountUpdate = (event) => {
      const { type, count } = event.detail;
      setCounts(prevCounts => ({
        ...prevCounts,
        [type + 's']: count  // Add 's' to match the counts object keys
      }));
    };

    window.addEventListener('itemCountUpdate', handleCountUpdate);

    // Function to check notifications with current data from localStorage
    const checkNotifications = () => {
      const currentVehicles = loadSavedData('vehicle', mockVehicles);
      const currentHomeRents = loadSavedData('homeRent', mockHomeRents);
      const currentElectricity = loadSavedData('electricity', mockElectricity);

      checkAndSendNotifications(currentVehicles, 'vehicle');
      checkAndSendNotifications(currentHomeRents, 'homeRent');
      checkAndSendNotifications(currentElectricity, 'electricity');
    };

    // Run initial notification check when app loads
    checkNotifications();

    // التحقق من الإشعارات كل ساعة
    const checkInterval = setInterval(checkNotifications, 60 * 60 * 1000);

    return () => {
      window.removeEventListener('itemCountUpdate', handleCountUpdate);
      clearInterval(checkInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 w-full overflow-hidden">
      <Header />

      {/* Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        vehiclesCount={counts.vehicles}
        homeRentsCount={counts.homeRents}
        electricityCount={counts.electricity}
      />

      {/* Toolbar */}


      <StatusLegend />

      <div className="p-2 sm:p-4 overflow-x-auto">
        {activeTab === 'vehicles' && (
          <VehiclesContainer initialData={mockVehicles} />
        )}

        {activeTab === 'homeRents' && (
          <HomeRentsContainer initialData={mockHomeRents} />
        )}

        {activeTab === 'electricity' && (
          <ElectricityContainer initialData={mockElectricity} />
        )}
      </div>


    </div>
  );
};

export default App;
