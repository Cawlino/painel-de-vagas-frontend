import React from 'react';

const TABS = [
  { id: 'todas', label: 'Todas' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'catho', label: 'Catho' },
];

export default function TabFilter({ activeTab, onTabChange, counts }) {
  return (
    <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-1 backdrop-blur-md w-fit">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts?.[tab.id] ?? 0;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              flex items-center gap-2
              ${isActive
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
              }
            `}
          >
            {tab.label}
            <span
              className={`
                text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                ${isActive
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-zinc-800 text-zinc-500'
                }
              `}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
