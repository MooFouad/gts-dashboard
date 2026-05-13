import React from 'react';
import { Car, Home, Zap, Shield, X, User, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
      if (window.innerWidth < 768) {
        onToggle();
      }
    }
  };

  const navItems = [
    { id: 'absher', label: 'Tamm - Istemarah', icon: Car, count: absherCount },
    { id: 'homeRents', label: 'Home Rents', icon: Home, count: homeRentsCount },
    { id: 'electricity', label: 'Electricity', icon: Zap, count: electricityCount },
    { id: 'socialInsurance', label: 'Social Insurance', icon: Shield, count: socialInsuranceCount },
    { id: 'gosi', label: 'GOSI', icon: null, count: gosiCount, useImage: true },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 animate-fade-in"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-navy-900 shadow-xl z-40 flex flex-col
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isCollapsed ? 'md:w-[68px]' : 'md:w-64'}
          w-64`}
      >
        {/* Sidebar Header */}
        <div className={`border-b border-navy-800 ${isCollapsed ? 'md:p-2 md:py-4' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'md:justify-center md:w-full' : ''}`}>
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-navy-800 rounded-lg">
                <img
                  src="/logo.svg"
                  alt="GTS logo"
                  className="h-7 w-7 object-contain brightness-0 invert"
                />
              </div>
              <div className={isCollapsed ? 'md:hidden' : ''}>
                <h2 className="font-bold text-base text-white">GTS</h2>
                <p className="text-xs text-navy-400">Management System</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="md:hidden text-navy-400 hover:text-white hover:bg-navy-800 rounded-lg p-1.5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Label */}
        <div className={`pt-5 pb-2 ${isCollapsed ? 'md:hidden' : 'px-4'}`}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-500 px-4 md:px-0">Navigation</p>
        </div>
        {isCollapsed && <div className="hidden md:block pt-3" />}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                title={item.label}
                className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group
                  ${isCollapsed ? 'md:justify-center md:px-0' : 'justify-between'}
                  ${isActive
                    ? 'bg-blue-600/20 text-white border-l-[3px] border-blue-400'
                    : 'text-navy-300 hover:bg-navy-800 hover:text-white border-l-[3px] border-transparent'
                  }`}
              >
                <div className={`flex items-center gap-3 ${isCollapsed ? 'md:gap-0' : ''}`}>
                  {item.useImage ? (
                    <img src="/gosi-logo.png" alt="GOSI" className="w-[18px] h-[18px] flex-shrink-0 opacity-80 group-hover:opacity-100" />
                  ) : (
                    <item.icon size={18} className={`flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                  )}
                  <span className={`text-sm font-medium ${isCollapsed ? 'md:hidden' : ''}`}>{item.label}</span>
                </div>
                <span
                  className={`min-w-[28px] text-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                    ${isCollapsed ? 'md:hidden' : ''}
                    ${isActive
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'bg-navy-800 text-navy-400 group-hover:bg-navy-700 group-hover:text-navy-300'
                    }`}
                >
                  {item.count}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-navy-800">
          {/* Collapse Toggle - desktop only */}
          <div className="hidden md:block px-2 pt-2">
            <button
              onClick={onToggleCollapse}
              className={`w-full flex items-center gap-3 px-3 py-2 text-navy-400 hover:bg-navy-800 hover:text-navy-200 rounded-lg transition-colors
                ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              <span className={`text-xs font-medium ${isCollapsed ? 'hidden' : ''}`}>
                {isCollapsed ? 'Expand' : 'Collapse'}
              </span>
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className={`p-3 ${isCollapsed ? 'md:flex md:flex-col md:items-center md:gap-2' : ''}`}>
            <div className={`flex items-center gap-3 mb-3 px-1 ${isCollapsed ? 'md:mb-0 md:px-0' : ''}`}>
              <div className="flex-shrink-0 w-9 h-9 bg-navy-700 rounded-full flex items-center justify-center" title={user?.name || 'User'}>
                <User size={16} className="text-navy-300" />
              </div>
              <div className={`flex-1 min-w-0 ${isCollapsed ? 'md:hidden' : ''}`}>
                <p className="text-sm font-medium text-navy-100 truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-navy-500 truncate capitalize">{user?.role || 'Role'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center gap-2 border border-navy-700 text-navy-400 rounded-lg hover:bg-navy-800 hover:text-rose-400 hover:border-rose-900 transition-all text-xs font-medium
                ${isCollapsed ? 'md:w-9 md:h-9 md:p-0 w-full px-3 py-2' : 'w-full px-3 py-2'}`}
              title="Logout"
            >
              <LogOut size={14} />
              <span className={isCollapsed ? 'md:hidden' : ''}>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
