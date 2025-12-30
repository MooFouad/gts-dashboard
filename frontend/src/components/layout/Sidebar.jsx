import React from 'react';
import { Car, Home, Zap, Shield, Settings, Info, X, Menu, User, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({
  activeTab,
  onTabChange,
  vehiclesCount,
  homeRentsCount,
  electricityCount,
  absherCount,
  socialInsuranceCount,
  gosiCount,
  insuranceCount,
  mvpiCount,
  isOpen,
  onToggle,
  onSettingsClick,
  onDiagnosticsClick,
  isCollapsed,
  onToggleCollapse
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      onTabChange(tab);
      // Close sidebar on mobile after selection
      if (window.innerWidth < 768) {
        onToggle();
      }
    }
  };

  const navItems = [
    {
      id: 'absher',
      label: 'Tamm - Istemarah',
      icon: Car,
      count: absherCount
    },
    {
      id: 'homeRents',
      label: 'Home Rents',
      icon: Home,
      count: homeRentsCount
    },
    {
      id: 'electricity',
      label: 'Electricity',
      icon: Zap,
      count: electricityCount
    },
    {
      id: 'socialInsurance',
      label: 'Social Insurance',
      icon: Shield,
      count: socialInsuranceCount
    },
    {
      id: 'gosi',
      label: 'GOSI',
      icon: null, // Will use image instead
      count: gosiCount,
      useImage: true
    }
  ];

  const itemClasses = (tab) =>
    `flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
      activeTab === tab
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
    }`;

  return (
    <>
      {/* Desktop Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:block fixed top-24 z-50 p-2 bg-blue-600 text-white rounded-r-lg shadow-lg hover:bg-blue-700 transition"
        style={{ left: isCollapsed ? '0px' : '256px' }}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-40 transition-transform duration-300 ease-in-out flex flex-col w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'md:-translate-x-full' : 'md:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="GTS logo"
                className="h-10 w-10 object-contain bg-white rounded-lg p-1"
              />
              <div className="text-white">
                <h2 className="font-bold text-lg">GTS</h2>
                <p className="text-xs text-blue-100">Management</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="md:hidden text-white hover:bg-blue-500 rounded p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={itemClasses(item.id)}
            >
              <div className="flex items-center gap-3">
                {item.useImage ? (
                  <img src="/gosi-logo.png" alt="GOSI" className="w-5 h-5" />
                ) : (
                  <item.icon size={20} />
                )}
                <span className="font-medium">{item.label}</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === item.id
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {item.count}
              </span>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t bg-gray-50">
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                onDiagnosticsClick();
                if (window.innerWidth < 768) onToggle();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition"
              title="Notification Diagnostics"
            >
              <Info size={18} />
              <span className="text-sm font-medium">Diagnostics</span>
            </button>
            <button
              onClick={() => {
                onSettingsClick();
                if (window.innerWidth < 768) onToggle();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition"
              title="Notification Settings"
            >
              <Settings size={18} />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role || 'Role'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              title="Logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
