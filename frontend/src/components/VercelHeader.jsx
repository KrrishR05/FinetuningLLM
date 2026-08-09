import { useState } from 'react'
import { motion } from 'framer-motion'
import { Server, Trash2, Sliders, ShieldCheck, Cpu } from 'lucide-react'

export default function VercelHeader({
  tabs,
  activeTab,
  onSelectTab,
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
    <header className="sticky top-0 z-50 bg-[var(--bg-header)] border-b border-[var(--border-subtle)] backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Vercel Logo & Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* Black Vercel Triangle Logo */}
          <div className="w-6 h-6 flex items-center justify-center">
            <svg width="18" height="16" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="white" />
            </svg>
          </div>

          <div className="h-4 w-[1px] bg-[#222222]" />

          {/* Org & App Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium text-white">
            <span className="font-semibold text-white">NETRAVAANI</span>
            <span className="text-[#444444]">/</span>
            <span className="px-2 py-0.5 rounded bg-[#111111] border border-[#222222] text-[#888888] font-mono text-[0.7rem] flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-400" /> Air-Gapped Local
            </span>
          </div>
        </div>

        {/* Center Model Selector & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0a0a0a] border border-[var(--border-subtle)] rounded-md px-2.5 py-1">
            <Server size={13} className="text-[#888888] mr-2 shrink-0" />
            <select
              value={selectedModel}
              onChange={e => onModelChange(e.target.value)}
              className="bg-transparent text-xs font-mono font-medium text-white outline-none cursor-pointer pr-4"
            >
              {models.map(m => (
                <option key={m.id} value={m.id} className="bg-[#0a0a0a] text-white">
                  {m.label || m.id}
                </option>
              ))}
            </select>
          </div>

          {/* Live Status Badge */}
          <div className={`vercel-badge ${isOnline ? 'vercel-badge-emerald' : 'vercel-badge-rose'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          <button
            onClick={onUnloadVRAM}
            title="Flush GPU VRAM"
            className="btn-vercel-secondary text-xs !py-1"
          >
            <Trash2 size={12} /> Flush VRAM
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`btn-vercel-secondary text-xs !py-1 ${showSettings ? 'border-white text-white' : ''}`}
          >
            <Sliders size={12} /> Controls
          </button>
        </div>
      </div>

      {/* Slide-Down Settings Drawer */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-[#222222] bg-[#0a0a0a] p-6 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto"
        >
          <div>
            <label className="text-xs font-semibold text-[#888888] uppercase block mb-1 font-mono">
              Temperature ({settings.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.temperature}
              onChange={e => onSettingsChange({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888888] uppercase block mb-1 font-mono">
              Max Tokens ({settings.maxTokens})
            </label>
            <input
              type="range"
              min="128"
              max="2048"
              step="64"
              value={settings.maxTokens}
              onChange={e => onSettingsChange({ ...settings, maxTokens: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-[#888888] uppercase block mb-1 font-mono">
              System Context Prompt
            </label>
            <input
              type="text"
              className="vercel-field text-xs"
              value={settings.systemPrompt}
              onChange={e => onSettingsChange({ ...settings, systemPrompt: e.target.value })}
            />
          </div>
        </motion.div>
      )}

      {/* Horizontal Sub-Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 flex gap-6 overflow-x-auto text-xs font-medium text-[#888888]">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative py-3 flex items-center gap-2 transition-colors ${
                isActive ? 'text-white font-semibold' : 'hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>

              {/* Sliding Active Underline */}
              {isActive && (
                <motion.div
                  layoutId="vercelTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </header>
  )
}
