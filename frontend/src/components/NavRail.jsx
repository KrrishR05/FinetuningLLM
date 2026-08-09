import { motion } from 'framer-motion'
import { Zap, Microscope, Newspaper, PenLine } from 'lucide-react'

export default function NavRail({ tabs, activeTab, onSelectTab }) {
  return (
    <aside className="w-16 bg-[var(--bg-rail)] border-r border-[var(--border-subtle)] flex flex-col items-center py-6 gap-4 z-40 shrink-0 select-none">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            title={tab.label}
            className={`relative group w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isActive
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={20} />

            {/* Glowing Active Indicator Pill */}
            {isActive && (
              <motion.div
                layoutId="activeRailPill"
                className="absolute -left-3 w-1.5 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_12px_#06b6d4]"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}

            {/* Floating Tooltip */}
            <div className="absolute left-16 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-800 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {tab.label}
            </div>
          </button>
        )
      })}
    </aside>
  )
}
