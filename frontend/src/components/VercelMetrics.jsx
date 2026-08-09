import { Cpu, ShieldCheck, Zap, Activity } from 'lucide-react'

export default function VercelMetrics({ health, selectedModel }) {
  const isOnline = health?.status === 'online' || health?.status === 'CHALU HAI'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Security Profile */}
      <div className="vercel-card p-4">
        <div className="flex items-center justify-between text-xs text-[#888888] font-mono mb-1">
          <span>SECURITY PROFILE</span>
          <ShieldCheck size={14} className="text-emerald-400" />
        </div>
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> 100% Air-Gapped
        </div>
        <p className="text-[0.7rem] text-[#666666] mt-1 font-mono">Zero Cloud Dependency</p>
      </div>

      {/* Model Runtime */}
      <div className="vercel-card p-4">
        <div className="flex items-center justify-between text-xs text-[#888888] font-mono mb-1">
          <span>MODEL RUNTIME</span>
          <Zap size={14} className="text-blue-400" />
        </div>
        <div className="text-sm font-semibold text-white truncate font-mono">
          {health?.runtime || 'Ollama'}
        </div>
        <p className="text-[0.7rem] text-[#666666] mt-1 font-mono truncate">
          ID: {selectedModel || 'gemma-4-e2b'}
        </p>
      </div>

      {/* GPU Hardware Acceleration */}
      <div className="vercel-card p-4">
        <div className="flex items-center justify-between text-xs text-[#888888] font-mono mb-1">
          <span>HARDWARE</span>
          <Cpu size={14} className="text-purple-400" />
        </div>
        <div className="text-sm font-semibold text-white">
          RTX 4060 Accelerated
        </div>
        <p className="text-[0.7rem] text-[#666666] mt-1 font-mono">32GB DDR5 System RAM</p>
      </div>

      {/* Health Status */}
      <div className="vercel-card p-4">
        <div className="flex items-center justify-between text-xs text-[#888888] font-mono mb-1">
          <span>RUNTIME STATUS</span>
          <Activity size={14} className={isOnline ? 'text-emerald-400' : 'text-rose-400'} />
        </div>
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          {isOnline ? 'Active & Ready' : 'Runtime Offline'}
        </div>
        <p className="text-[0.7rem] text-[#666666] mt-1 font-mono">:11434 Ollama API</p>
      </div>
    </div>
  )
}
