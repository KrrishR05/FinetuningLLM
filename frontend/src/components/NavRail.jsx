import { motion } from 'framer-motion'

export default function NavRail({ tabs, activeTab, onSelectTab }) {
  return (
    <aside className="w-48 bg-[#0e0e11] border-r border-[var(--border-subtle)] flex flex-col justify-between py-4 px-3 select-none shrink-0">
      <div className="space-y-1">
        <div className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-wider px-3 mb-2 font-mono">
          WORKSPACES
        </div>
        {tabs.map((tab, idx) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} />
                <span>{tab.label}</span>
              </div>
              <span className="text-[0.65rem] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                {idx + 1}
              </span>
            </button>
          )
        })}
      </div>

      <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-[0.68rem] text-slate-400 font-mono space-y-1">
        <div className="text-white font-bold">STATUS</div>
        <div className="flex justify-between">
          <span>Ollama API:</span>
          <span className="text-emerald-400">:11434</span>
        </div>
        <div className="flex justify-between">
          <span>FastAPI:</span>
          <span className="text-emerald-400">:8000</span>
        </div>
      </div>
    </aside>
  )
}
