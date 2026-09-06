import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Activity, AlertCircle, RefreshCw } from 'lucide-react';

export default function RealtimeConnectionStatus() {
  const { connectionStatus } = useSocket();

  if (connectionStatus === 'LIVE') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-600 bg-emerald-50 px-2 py-1 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </div>
    );
  }

  if (connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-amber-600 bg-amber-50 px-2 py-1 border border-amber-200">
        <RefreshCw size={10} className="animate-spin" />
        {connectionStatus}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-500 bg-slate-100 px-2 py-1 border border-slate-200">
      <AlertCircle size={10} />
      Offline
    </div>
  );
}
