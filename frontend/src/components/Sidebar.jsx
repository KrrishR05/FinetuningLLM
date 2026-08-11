import { motion } from 'framer-motion'
import { Server, Zap, Cpu, Settings, Trash2, Shield } from 'lucide-react'

export default function Sidebar({
  models,
  selectedModel,
  onModelChange,
  health,
  settings,
  onSettingsChange,
  onUnloadVRAM,
}) {
  const isOnline = health?.status === 'online'

  const updateSetting = (key, value) => {
    onSettingsChange(prev => ({ ...prev, [key]: value }))
  }

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 h-screen w-[320px] overflow-y-auto p-6 z-50 border-r"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold text-sm">
            V
          </div>
          VERIDIAN
        </h2>
        <p className="text-[0.75rem] text-[#71717a] mt-2 tracking-wide uppercase">Offline LLM Suite v1.0</p>
      </div>

      {/* Model Selector */}
      <div className="mb-8">
        <label className="text-[0.7rem] uppercase tracking-widest text-[#71717a] font-semibold mb-3 flex items-center gap-2">
          <Cpu size={14} /> Engine & Model
        </label>
        <select
          value={selectedModel}
          onChange={e => onModelChange(e.target.value)}
          className="w-full text-sm"
        >
          {models.map(m => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Server Status */}
      <div className="mb-8 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#71717a] uppercase tracking-wider font-semibold flex items-center gap-2">
            <Server size={12} /> Server Status
          </span>
          {isOnline ? (
            <span className="badge badge-online text-xs !py-1 !px-2">Online</span>
          ) : (
            <span className="badge badge-offline text-xs !py-1 !px-2">Offline</span>
          )}
        </div>
        {health && isOnline && (
          <div className="text-xs text-[#a1a1aa] space-y-2 font-mono">
            <div className="flex justify-between"><span className="text-[#71717a]">Runtime:</span> <span>{health.runtime}</span></div>
            <div className="flex justify-between"><span className="text-[#71717a]">Endpoint:</span> <span>{health.endpoint}</span></div>
          </div>
        )}
      </div>

      {/* VRAM Release Button */}
      <button
        onClick={onUnloadVRAM}
        className="w-full mb-8 btn-secondary flex items-center justify-center gap-2 text-sm"
      >
        <Trash2 size={16} /> Release GPU VRAM
      </button>

      {/* Generation Settings */}
      <div className="mb-8">
        <label className="text-[0.7rem] uppercase tracking-widest text-[#71717a] font-semibold mb-4 flex items-center gap-2">
          <Settings size={14} /> Generation Settings
        </label>

        {/* Temperature */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#a1a1aa]">Temperature</span>
            <span className="text-xs font-mono text-white bg-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded">{settings.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.temperature}
            onChange={e => updateSetting('temperature', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Max Tokens */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#a1a1aa]">Max Tokens</span>
            <span className="text-xs font-mono text-white bg-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded">{settings.maxTokens}</span>
          </div>
          <input
            type="range"
            min="128"
            max="2048"
            step="64"
            value={settings.maxTokens}
            onChange={e => updateSetting('maxTokens', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Auto Unload */}
        <label className="flex items-center gap-3 cursor-pointer mb-5 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors border border-transparent hover:border-[rgba(255,255,255,0.05)]">
          <input
            type="checkbox"
            checked={settings.autoUnload}
            onChange={e => updateSetting('autoUnload', e.target.checked)}
          />
          <span className="text-sm text-[#a1a1aa] flex items-center gap-2">
            <Zap size={14} className="text-white" /> Auto-release VRAM
          </span>
        </label>

        {/* System Prompt */}
        <div>
          <span className="text-xs text-[#71717a] uppercase tracking-widest font-semibold block mb-2">System Prompt</span>
          <textarea
            value={settings.systemPrompt}
            onChange={e => updateSetting('systemPrompt', e.target.value)}
            className="text-xs !min-h-[100px] !bg-[rgba(255,255,255,0.01)]"
            rows={4}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-[rgba(255,255,255,0.04)]">
        <p className="text-[0.65rem] text-[#71717a] flex items-center justify-center gap-1.5 uppercase tracking-widest">
          <Shield size={12} /> 100% Air-Gapped Local Inference
        </p>
      </div>
    </motion.aside>
  )
}
