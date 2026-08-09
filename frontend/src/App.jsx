import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Microscope, Newspaper, PenLine } from 'lucide-react'
import VercelHeader from './components/VercelHeader'
import VercelMetrics from './components/VercelMetrics'
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
    <div className="min-h-screen bg-[var(--bg-page)] text-white flex flex-col font-sans">
      {/* Vercel Header with Sub-Tabs */}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">
        {/* Vercel Deployment Metrics */}
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
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
