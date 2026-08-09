import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Microscope, Newspaper, PenLine } from 'lucide-react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Summarizer from './pages/Summarizer'
import ScienceBrief from './pages/ScienceBrief'
import NewsDigest from './pages/NewsDigest'
import Rewriter from './pages/Rewriter'

const TABS = [
  { id: 'summarizer', label: 'AI/ML Summarizer', icon: Zap },
  { id: 'science', label: 'S&T Brief', icon: Microscope },
  { id: 'news', label: 'News Digest', icon: Newspaper },
  { id: 'rewriter', label: 'Rewrite & Grammar', icon: PenLine },
]

function App() {
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

  // Fetch health when model changes
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

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar
        models={models}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        health={health}
        settings={settings}
        onSettingsChange={setSettings}
        onUnloadVRAM={handleUnloadVRAM}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-6" style={{ marginLeft: '320px' }}>
        <Header health={health} />

        {/* Tab Bar */}
        <div className="tab-bar mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Page Content with Animated Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
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

export default App
