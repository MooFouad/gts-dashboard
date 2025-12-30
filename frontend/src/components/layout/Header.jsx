import React from 'react';
import { Menu, X } from 'lucide-react';

const Header = ({ sidebarCollapsed, sidebarOpen, onToggleSidebar }) => {
  return (
    <div className="bg-white shadow-lg">
      <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
        <div className={`flex items-center justify-between transition-all duration-300 ${sidebarCollapsed ? '' : 'md:ml-64'}`}>
          <div className="flex items-center">
            <img
              src="/logo.svg"
              alt="GTS logo"
              className="h-12 sm:h-16 w-auto object-contain"
            />
            <h1 className="ml-4 text-xl sm:text-2xl font-bold text-gray-800 hidden md:block">
              GTS Management System
            </h1>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            title={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;