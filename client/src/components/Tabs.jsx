import React, { useState } from 'react';

/**
 * Simple tab navigation component.
 * Props:
 *  - tabs: string[] – list of tab labels
 *  - activeTab: string – currently selected tab label
 *  - onChange: (tab: string) => void – callback when a tab is selected
 */
export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-1.5 mb-4">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
