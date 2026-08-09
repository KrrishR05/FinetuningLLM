import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, ShieldCheck, Zap, Sliders, Server, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function CommandBar({
  models,
  selectedModel,
  onModelChange,
  health,
  settings,
  onSettingsChange,
  onUnloadVRAM
}) {
  const [showSettings, setShowSettings] = useState(false)
  const isOnline = health?.status === 'online' || health?.status === 'CHALU HAI'

  return (
    <header className="sticky top-0 z-50 px-6 py-3 bg-[var(--bg-command)] border-b border-[var(--border-subtle)] backdrop-blur-xl flex items-center justify-between">
      {/* Brand & Studio Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white font-sans">
                NETRAVAANI <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">STUDIO v2.0</span>
              </h1>
            </div>
            <p className="text-[0.7rem] text-[var(--text-dim)] flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck size={12} /> Air-Gapped Local
              </span>
              <span>•</span>
              <span className="text-slate-400">Zero-Cloud Latency</span>
            </p>
          </div>
        </div>
      </div>

      {/* Center Engine Telemetry & Selector */}
      <div className="flex items-center gap-3">
        {/* Model Dropdown */}
        <div className="relative flex items-center bg-black/40 border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 focus-within:border-cyan-500/50 transition-colors">
          <Server size={15} className="text-cyan-400 mr-2.5 shrink-0" />
          <select
            value={selectedModel}
            onChange={e => onModelChange(e.target.value)}
            className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer pr-6 font-sans"
          >
            {models.map(m => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                {m.label || m.id}
              </option>
            ))}
          </select>
          <span className="absolute right-3 pointer-events-none text-xs text-slate-500">▼</span>
        </div>

        {/* Live Engine Status Badge */}
        <div className={`studio-badge ${isOnline ? 'studio-badge-emerald' : 'studio-badge-rose'}`}>
          <span className={`pulse-dot ${isOnline ? 'pulse-dot-emerald' : 'pulse-dot-rose'}`} />
          <span>{isOnline ? 'Runtime Ready' : 'Runtime Offline'}</span>
        </div>

        {/* VRAM Flush Action */}
        <button
          onClick={onUnloadVRAM}
          title="Instantly release GPU VRAM"
          className="btn-studio-secondary text-xs !py-1.5 !px-3 hover:text-rose-400 hover:border-rose-500/30"
        >
          <Trash2 size={14} /> Release VRAM
        </button>
      </div>

      {/* Right Hardware Specs & Settings Toggle */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 text-xs text-[var(--text-muted)] bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
          <Cpu size={14} className="text-cyan-400" />
          <span className="font-mono text-slate-300">RTX 4060</span>
        </div>

        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`btn-studio-secondary text-xs !py-1.5 ${showSettings ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : ''}`}
        >
          <Sliders size={15} /> Tuning Drawer
        </button>
      </div>

      {/* Slide-Down Tuning Drawer */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-[#090b12] border-b border-cyan-500/20 p-6 shadow-2xl z-50 grid grid-cols-1 md:grid-cols-4 gap-6 backdrop-blur-2xl"
        >
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Temperature ({settings.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.temperature}
              onChange={e => onSettingsChange({ ...settings, temperature: parseFloat(e.target.value) })}
            />
            <div className="flex justify-between text-[0.65rem] text-slate-500 mt-1 font-mono">
              <span>0.0 Precise</span>
              <span>1.0 Creative</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Max Response Tokens ({settings.maxTokens})
            </label>
            <input
              type="range"
              min="128"
              max="2048"
              step="64"
              value={settings.maxTokens}
              onChange={e => onSettingsChange({ ...settings, maxTokens: parseInt(e.target.value) })}
            />
            <div className="flex justify-between text-[0.65rem] text-slate-500 mt-1 font-mono">
              <span>128 Tokens</span>
              <span>2048 Tokens</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Custom System Context Prompt
            </label>
            <input
              type="text"
              className="studio-input text-xs"
              value={settings.systemPrompt}
              onChange={e => onSettingsChange({ ...settings, systemPrompt: e.target.value })}
              placeholder="e.g. You are a precise scientific research assistant..."
            />
          </div>
        </motion.div>
      )}
    </header>
  )
}
