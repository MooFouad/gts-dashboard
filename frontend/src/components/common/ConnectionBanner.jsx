import React from 'react';
import { WifiOff, ServerCrash, RefreshCw } from 'lucide-react';
import useConnectionStatus from '../../hooks/useConnectionStatus';

const ConnectionBanner = () => {
  const { isOnline, isServerReachable, checkHealth } = useConnectionStatus();

  if (isOnline && isServerReachable) return null;

  const isOffline = !isOnline;

  return (
    <div className={`px-4 py-3 flex items-center justify-between text-sm ${
      isOffline ? 'bg-gray-700 text-white' : 'bg-amber-500 text-white'
    }`}>
      <div className="flex items-center gap-2">
        {isOffline ? (
          <>
            <WifiOff size={18} />
            <span>You are offline. Please check your internet connection.</span>
          </>
        ) : (
          <>
            <ServerCrash size={18} />
            <span>Unable to connect to the server. Retrying automatically...</span>
          </>
        )}
      </div>
      {!isOffline && (
        <button
          onClick={checkHealth}
          className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Retry Now
        </button>
      )}
    </div>
  );
};

export default ConnectionBanner;
