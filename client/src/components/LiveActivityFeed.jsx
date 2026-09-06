import React from 'react';
import { Clock } from 'lucide-react';

export default function LiveActivityFeed({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="card p-5 h-full flex flex-col">
        <h3 className="text-xs font-bold text-slate-900 tracking-widest uppercase border-b-2 border-slate-900 pb-3 mb-4">
          Recent Activity
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
          <Clock size={24} className="mb-2 opacity-20" />
          <span className="text-xs font-medium uppercase tracking-widest">No recent activity</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 h-full flex flex-col">
      <h3 className="text-xs font-bold text-slate-900 tracking-widest uppercase border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
        <span>Recent Activity</span>
        <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 animate-pulse">LIVE</span>
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="relative pl-4 border-l-2 border-slate-200 group hover:border-slate-900 transition-colors">
            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-none bg-white border-2 border-slate-300 group-hover:border-slate-900 transition-colors" />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              {formatTimeAgo(activity.timestamp)}
            </div>
            <div className="text-sm font-bold text-slate-900 leading-tight">
              {activity.title}
            </div>
            {activity.description && (
              <div className="text-xs text-slate-600 mt-0.5">
                {activity.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTimeAgo(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);

  if (seconds < 30) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return date.toLocaleDateString();
}
