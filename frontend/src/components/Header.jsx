import { motion } from 'framer-motion'
import { Lock, Zap, Cpu, MemoryStick, ShieldCheck, Box, Activity } from 'lucide-react'

export default function Header({ health }) {
  const isOnline = health?.status === 'online'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl p-8 mb-8 overflow-hidden glass-card !shadow-none"
    >
      {/* Subtle ambient top glow instead of harsh rainbow */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }}
      />

      <h1 className="text-3xl font-semibold tracking-tight mb-3 text-white flex items-center gap-3">
        VERIDIAN
      </h1>

      <div className="flex items-center gap-3 flex-wrap mb-2">
        <span className="text-[#a1a1aa] text-sm flex items-center gap-1.5">
          <Lock size={14} /> Air-Gapped Document Intelligence
        </span>
        <span className="text-[#3f3f46]">•</span>
        <span className="text-[#a1a1aa] text-sm flex items-center gap-1.5">
          <Zap size={14} /> Zero Cloud Dependency
        </span>
        <span className="text-[#3f3f46]">•</span>
        <span className="badge badge-neutral text-xs flex items-center gap-1.5">
          <Cpu size={12} /> RTX 4060 Accelerated
        </span>
        <span className="badge badge-neutral text-xs flex items-center gap-1.5">
          <MemoryStick size={12} /> 32GB DDR5
        </span>
        {isOnline ? (
          <span className="badge badge-online flex items-center gap-1.5">
            <Activity size={12} /> Online
          </span>
        ) : (
          <span className="badge badge-offline flex items-center gap-1.5">
            <Activity size={12} /> Offline
          </span>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 stagger">
        {[
          { label: 'MODEL REGISTRY', value: '5 Models / 4 Families', icon: Box },
          { label: 'INFERENCE ENGINE', value: 'Ollama / llama.cpp', icon: Zap },
          { label: 'SECURITY PROFILE', value: '100% Air-Gapped', icon: ShieldCheck },
          { label: 'VRAM MODE', value: 'Dynamic On-Demand', icon: MemoryStick },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="metric-card"
            >
              <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-wider text-[#71717a] font-semibold mb-2">
                <Icon size={14} className="text-[#a1a1aa]" /> {card.label}
              </div>
              <div className="text-sm font-semibold text-[#fdfdfd]">{card.value}</div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
