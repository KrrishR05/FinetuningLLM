import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, ShieldCheck, Zap, Sliders, Server, Trash2, Layers, Command, Sparkles } from 'lucide-react'

const SYSTEM_PROMPT_PRESETS = [
  { label: 'Factual Analyst', prompt: 'You are a precise, direct, and factual offline LLM assistant.' },
  { label: 'Scientific Researcher', prompt: 'You are an expert scientific researcher. Analyze documents with strict empirical rigor.' },
  { label: 'Executive Summarizer', prompt: 'You are an executive assistant. Synthesize key takeaways for C-suite decision makers.' },
]

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
    <header className="sticky top-0 z-50 px-6 py-2.5 bg-[var(--bg-command)] border-b border-[var(--border-subtle)] backdrop-blur-md flex items-center justify-between">
      {/* Brand & Telemetry */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white font-sans">
                NETRAVAANI <span className="text-[0.65rem] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">PRO WORKSTATION</span>
              </h1>
            </div>
            <p className="text-[0.68rem] text-[var(--text-muted)] flex items-center gap-2 font-mono">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck size={11} /> AIR-GAPPED LOCAL
              </span>
              <span>•</span>
              <span>ZERO-CLOUD LATENCY</span>
            </p>
          </div>
        </div>
      </div>

      {/* Model Selector & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-[#09090b] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 focus-within:border-blue-500 transition-colors">
          <Server size={14} className="text-blue-400 mr-2 shrink-0" />
          <select
            value={selectedModel}
            onChange={e => onModelChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer pr-4 font-mono"
          >
            {models.map(m => (
              <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
                {m.label || m.id}
              </option>
            ))}
          </select>
        </div>

        {/* Live Health Badge */}
        <div className={`wb-badge ${isOnline ? 'wb-badge-emerald' : 'wb-badge-rose'}`}>
          <span className={isOnline ? 'dot-emerald' : 'dot-rose'} />
          <span>{isOnline ? 'RUNNER READY' : 'OFFLINE'}</span>
        </div>

        {/* Unload VRAM */}
        <button
          onClick={onUnloadVRAM}
          title="Release GPU VRAM Memory"
          className="btn-wb-secondary text-[0.75rem] hover:text-rose-400"
        >
          <Trash2 size={13} /> Flush VRAM
        </button>
      </div>

      {/* Hardware & Drawer Toggle */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 text-[0.725rem] text-[var(--text-muted)] font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded">
          <Cpu size={13} className="text-blue-400" />
          <span>RTX 4060 GPU</span>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`btn-wb-secondary text-[0.75rem] ${showSettings ? 'border-blue-500 text-blue-400 bg-blue-500/10' : ''}`}
        >
          <Sliders size={13} /> Control Panel
        </button>
      </div>

      {/* Slide-Down Tuning Drawer */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-[#141417] border-b border-zinc-700/50 p-6 shadow-2xl z-50 grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {/* Temperature */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Temperature
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={settings.temperature}
                onChange={e => onSettingsChange({ ...settings, temperature: parseFloat(e.target.value) || 0 })}
                className="w-14 wb-input text-xs text-right font-mono py-0.5 px-1"
              />
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.temperature}
              onChange={e => onSettingsChange({ ...settings, temperature: parseFloat(e.target.value) })}
            />
            <div className="flex justify-between text-[0.65rem] text-slate-400 mt-1 font-mono">
              <span>Deterministic (0.0)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Max Response Tokens
              </label>
              <input
                type="number"
                min="128"
                max="2048"
                step="64"
                value={settings.maxTokens}
                onChange={e => onSettingsChange({ ...settings, maxTokens: parseInt(e.target.value) || 512 })}
                className="w-16 wb-input text-xs text-right font-mono py-0.5 px-1"
              />
            </div>
            <input
              type="range"
              min="128"
              max="2048"
              step="64"
              value={settings.maxTokens}
              onChange={e => onSettingsChange({ ...settings, maxTokens: parseInt(e.target.value) })}
            />
            <div className="flex justify-between text-[0.65rem] text-slate-400 mt-1 font-mono">
              <span>128</span>
              <span>2048 Tokens</span>
            </div>
          </div>

          {/* System Prompt Preset Chips & Input */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              System Context Prompt
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {SYSTEM_PROMPT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onSettingsChange({ ...settings, systemPrompt: p.prompt })}
                  className="text-[0.7rem] px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-blue-500/50 text-slate-300 transition-colors"
                >
                  <Sparkles size={10} className="inline mr-1 text-blue-400" />
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="wb-input text-xs"
              value={settings.systemPrompt}
              onChange={e => onSettingsChange({ ...settings, systemPrompt: e.target.value })}
            />
          </div>
        </motion.div>
      )}
    </header>
  )
}
