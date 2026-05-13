import React from 'react';
import { Menu, X, Bell } from 'lucide-react';

const Header = ({ sidebarCollapsed, sidebarOpen, onToggleSidebar, onSettingsClick }) => {
  return (
    <header className="bg-navy-900 border-b border-navy-800 sticky top-0 z-20">
      <div className="w-full px-4 sm:px-6 py-2.5">
        <div className={`flex items-center justify-between transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-64'}`}>
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="GTS logo"
              className="h-9 w-auto object-contain brightness-0 invert"
            />
            <div className="hidden md:block">
              <h1 className="text-base font-semibold text-white leading-tight">
                GTS Management System
              </h1>
              <p className="text-xs text-navy-300">Enterprise Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Settings Button */}
            <button
              onClick={onSettingsClick}
              className="flex items-center gap-2 px-3 py-2 text-navy-300 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
              title="Notification Settings"
            >
              <Bell size={18} />
              <span className="hidden sm:inline text-sm font-medium">Notifications</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-navy-300 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
              title={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
