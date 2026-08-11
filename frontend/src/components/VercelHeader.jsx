import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronRight,
  Cpu,
  LockKeyhole,
  MemoryStick,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import VercelSelect from './VercelSelect'

const DEFAULT_SETTINGS = {
  temperature: 0.2,
  maxTokens: 512,
  systemPrompt: 'You are a precise, direct, and factual offline LLM assistant.',
  autoUnload: false,
}

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
  onUnloadVRAM,
}) {
  const [showSettings, setShowSettings] = useState(false)
  const isOnline = health?.status === 'online' || health?.status === 'CHALU HAI'
  const modelOptions = models.length
    ? models.map(model => ({ value: model.id, label: model.label || model.id }))
    : [{ value: '', label: 'No local models detected', description: 'Start your local runtime to continue.' }]

  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape') setShowSettings(false)
    }

    if (showSettings) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showSettings])

  const updateSetting = (key, value) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <>
      <header className="app-header sticky top-0 z-40">
        <div className="app-header__chrome">
          <div className="app-brand">
            <div className="app-brand__mark" aria-hidden="true">
              <span />
              <span />
            </div>
            <div className="app-brand__copy">
              <span className="app-brand__name">VERIDIAN</span>
              <span className="app-brand__subtitle">Private AI workstation</span>
            </div>
          </div>

          <div className="app-header__actions">
            <div className={`runtime-chip ${isOnline ? 'runtime-chip--online' : 'runtime-chip--checking'}`} title={isOnline ? 'Local runtime is ready' : 'Checking local runtime'}>
              <i />
              <span className="hidden sm:inline">{isOnline ? 'Local runtime ready' : 'Runtime checking'}</span>
              <span className="sm:hidden">{isOnline ? 'Ready' : 'Checking'}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="control-trigger"
              aria-expanded={showSettings}
              aria-controls="workspace-controls"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Controls</span>
            </button>
          </div>
        </div>

        <div className="app-header__nav-wrap">
          <nav className="app-header__nav" aria-label="Workspace tools" role="tablist">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectTab(tab.id)}
                  className={`app-nav-tab ${isActive ? 'app-nav-tab--active' : ''}`}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.25 : 1.8} />
                  <span>{tab.shortLabel || tab.label}</span>
                  {isActive && <motion.i layoutId="activeWorkspaceTab" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showSettings && (
            <>
              <motion.button
                type="button"
                className="control-scrim"
                aria-label="Close workspace controls"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
              />

              <motion.aside
                id="workspace-controls"
                role="dialog"
                aria-modal="true"
                aria-label="Workspace controls"
                className="control-drawer"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 32, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              >
                <div className="control-drawer__header">
                  <div>
                    <span className="control-drawer__eyebrow"><Settings2 size={13} /> Workspace controls</span>
                    <h2>Fine-tune your local run.</h2>
                  </div>
                  <button type="button" className="icon-control" onClick={() => setShowSettings(false)} aria-label="Close workspace controls">
                    <X size={18} />
                  </button>
                </div>

                <div className="control-drawer__status">
                  <div className={`control-drawer__status-icon ${isOnline ? 'is-online' : ''}`}>
                    <Cpu size={17} />
                  </div>
                  <div>
                    <span>{isOnline ? 'Secure runtime connected' : 'Local runtime unavailable'}</span>
                    <small>{isOnline ? (health?.runtime || 'Local inference engine') : 'Your workspace remains private while it reconnects.'}</small>
                  </div>
                </div>

                <div className="control-drawer__body">
                  <section className="control-section">
                    <div className="control-section__heading">
                      <div>
                        <span>Inference engine</span>
                        <p>Choose the local model for this workspace.</p>
                      </div>
                      <Sparkles size={15} />
                    </div>
                    <VercelSelect
                      options={modelOptions}
                      value={selectedModel}
                      onChange={onModelChange}
                      icon={Cpu}
                      disabled={!models.length}
                      className="control-model-select"
                    />
                  </section>

                  <section className="control-section">
                    <div className="control-section__heading">
                      <div>
                        <span>Generation profile</span>
                        <p>Balance precision, breadth, and response size.</p>
                      </div>
                      <SlidersHorizontal size={15} />
                    </div>

                    <label className="range-control">
                      <span><b>Temperature</b><em>{settings.temperature.toFixed(2)}</em></span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.temperature}
                        onChange={event => updateSetting('temperature', parseFloat(event.target.value))}
                      />
                      <small>Focused <i /> Exploratory</small>
                    </label>

                    <label className="range-control">
                      <span><b>Response budget</b><em>{settings.maxTokens} tokens</em></span>
                      <input
                        type="range"
                        min="128"
                        max="2048"
                        step="64"
                        value={settings.maxTokens}
                        onChange={event => updateSetting('maxTokens', parseInt(event.target.value, 10))}
                      />
                      <small>Concise <i /> Detailed</small>
                    </label>
                  </section>

                  <section className="control-section">
                    <div className="control-section__heading">
                      <div>
                        <span>Safety & context</span>
                        <p>Control memory use and system behavior.</p>
                      </div>
                      <LockKeyhole size={15} />
                    </div>

                    <label className="toggle-control">
                      <input
                        type="checkbox"
                        checked={settings.autoUnload}
                        onChange={event => updateSetting('autoUnload', event.target.checked)}
                      />
                      <span className="toggle-control__switch" aria-hidden="true"><i /></span>
                      <span><b>Release VRAM after completion</b><small>Free local GPU memory when a task finishes.</small></span>
                    </label>

                    <label className="prompt-control">
                      <span>System instruction</span>
                      <textarea
                        value={settings.systemPrompt}
                        onChange={event => updateSetting('systemPrompt', event.target.value)}
                        rows={4}
                      />
                    </label>
                  </section>
                </div>

                <div className="control-drawer__footer">
                  <button type="button" className="drawer-reset" onClick={() => onSettingsChange({ ...DEFAULT_SETTINGS })}>
                    <RotateCcw size={14} /> Restore defaults
                  </button>
                  <button type="button" className="drawer-flush" onClick={onUnloadVRAM}>
                    <Trash2 size={14} /> Flush VRAM <ChevronRight size={14} />
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
