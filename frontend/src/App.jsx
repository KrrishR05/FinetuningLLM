import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Microscope, Newspaper, PenLine, ShieldCheck, Cpu, Activity, Lock, CircleDot } from 'lucide-react'
import VercelHeader from './components/VercelHeader'
import VercelMetrics from './components/VercelMetrics'
import DashboardHero from './components/DashboardHero'
import Summarizer from './pages/Summarizer'
import ScienceBrief from './pages/ScienceBrief'
import NewsDigest from './pages/NewsDigest'
import Rewriter from './pages/Rewriter'

const TABS = [
  { id: 'summarizer', label: 'Overview / Summarizer', icon: Zap },
  { id: 'science', label: 'S&T Research Brief', icon: Microscope },
  { id: 'news', label: 'News & Fact Digest', icon: Newspaper },
  { id: 'rewriter', label: 'Fact-Lock Rewriter', icon: PenLine },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('summarizer')
  const [models, setModels] = useState([])
  const [presets, setPresets] = useState({})
  const [selectedModel, setSelectedModel] = useState('')
  const [health, setHealth] = useState(null)
  const [settings, setSettings] = useState({
    temperature: 0.2,
    maxTokens: 512,
    systemPrompt: 'You are a precise, direct, and factual offline LLM assistant.',
    autoUnload: false,
  })

  // Fetch models on mount
  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then(data => {
        setModels(data.models || [])
        setPresets(data.presets || {})
        if (data.models?.length > 0) {
          const defaultModel = data.models.find(m => m.default) || data.models[0]
          setSelectedModel(defaultModel.id)
        }
      })
      .catch(() => {})
  }, [])

  // Fetch health status when selected model changes
  useEffect(() => {
    if (!selectedModel) return
    fetch(`/api/health?model_id=${selectedModel}`)
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline' }))
  }, [selectedModel])

  const handleUnloadVRAM = () => {
    fetch('/api/unload-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_id: selectedModel }),
    })
      .then(r => r.json())
      .then(data => alert(data.message))
      .catch(() => alert('Failed to unload model'))
  }

  return (
    <div className="app-shell min-h-screen text-white flex flex-col font-sans relative selection:bg-white selection:text-[#07110f]">
      <div className="app-shell__noise pointer-events-none" />
      <div className="app-shell__grid pointer-events-none" />

      {/* Vercel Header with Sub-Tabs */}
      <div className="relative z-10">
        <VercelHeader
          tabs={TABS}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          health={health}
          settings={settings}
          onSettingsChange={setSettings}
          onUnloadVRAM={handleUnloadVRAM}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6 lg:space-y-7">
        <DashboardHero activeTab={activeTab} selectedModel={selectedModel} health={health} />

        {/* Compact system pulse keeps platform state visible without taking over the workspace. */}
        <VercelMetrics health={health} selectedModel={selectedModel} />

        {/* Tab Page Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="tool-workspace">
              {activeTab === 'summarizer' && (
                <Summarizer settings={settings} selectedModel={selectedModel} />
              )}
              {activeTab === 'science' && (
                <ScienceBrief settings={settings} selectedModel={selectedModel} />
              )}
              {activeTab === 'news' && (
                <NewsDigest settings={settings} selectedModel={selectedModel} />
              )}
              {activeTab === 'rewriter' && (
                <Rewriter settings={settings} selectedModel={selectedModel} presets={presets} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Enterprise Bottom Telemetry Footer Bar */}
      <footer className="app-footer relative z-10">
        <div className="app-footer__inner">
          <div className="app-footer__trust">
            <span><ShieldCheck size={14} /> Air-gapped hardened</span>
            <span><Lock size={13} /> Your data stays on this device</span>
          </div>

          <div className="app-footer__runtime">
            <span><Cpu size={13} /> Local CUDA runtime</span>
            <span><CircleDot size={13} className="app-footer__status" /> REST API :8000</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
