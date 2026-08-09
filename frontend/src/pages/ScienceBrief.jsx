import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Microscope, FileText, UploadCloud, Download, Clock, ArrowRight, FileCode, Eye, Code, Copy, Trash, Zap, Target, Cpu, AlertTriangle, Lightbulb, Bookmark } from 'lucide-react'

const SAMPLE_SCIENCE_TEXT = `TITLE: Quantum Phase Transitions in Superconducting Qubits
AUTHORS: Dr. A. Sharma, Prof. R. Patel (IISc Bangalore, 2026)
OBJECTIVE: Investigate non-equilibrium quantum phase transitions under magnetic flux sweeps in 2D transmon architecture.
METHODOLOGY: Synthesized 8-qubit superconducting transmon array operated at 15 mK dilution refrigerator temperature. Measured state tomography via microwave pulse dispersion.
KEY FINDINGS: Observed a critical phase transition at H_c = 1.42 Tesla with coherence time T_2 = 120 microseconds, representing a 35% improvement over previous 1D topologies.
LIMITATIONS: Thermal fluctuations above 40 mK induce rapid decoherence. Flux noise scaling remains non-linear beyond 2 Tesla.
IMPLICATIONS: Enables fault-tolerant quantum error correction protocols for next-generation quantum simulators.`

export default function ScienceBrief({ settings, selectedModel }) {
  const [inputMode, setInputMode] = useState('text')
  const [text, setText] = useState('')
  const [pages, setPages] = useState([])
  const [chunkSize, setChunkSize] = useState(3000)
  const [viewTab, setViewTab] = useState('rendered')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.pages?.length) {
        setPages(data.pages)
        setText(data.full_text)
      } else {
        setError(data.warnings?.[0] || 'Extraction failed')
      }
    } catch {
      setError('File extraction failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (overrideText) => {
    const textToUse = overrideText !== undefined ? overrideText : text
    if (!textToUse.trim()) return

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/science-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          chunk_size: chunkSize,
          model_id: selectedModel,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt || null,
          auto_unload: settings.autoUnload,
        }),
      })
      const data = await res.json()
      if (data.status === 'success') setResult(data)
      else setError(data.error || 'S&T Brief generation failed.')
    } catch {
      setError('Connection failed.')
    } finally {
      setLoading(false)
    }
  }

  const runPreset = (sampleText) => {
    setText(sampleText)
    handleGenerate(sampleText)
  }

  const copyResult = () => {
    if (!result?.brief) return
    const textToCopy = Object.entries(result.brief)
      .map(([k, v]) => `${k.toUpperCase()}:\n${v}`)
      .join('\n\n')
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadBrief = () => {
    if (!result?.brief) return
    const content = Object.entries(result.brief)
      .map(([key, val]) => `${key.toUpperCase()}:\n${val}`)
      .join('\n\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'st_research_brief.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getIconForField = (field) => {
    const name = field.toLowerCase()
    if (name.includes('objective')) return <Target size={14} className="text-blue-400" />
    if (name.includes('method')) return <Cpu size={14} className="text-purple-400" />
    if (name.includes('finding')) return <Sparkles size={14} className="text-emerald-400" />
    if (name.includes('limitation')) return <AlertTriangle size={14} className="text-amber-400" />
    if (name.includes('implication')) return <Lightbulb size={14} className="text-cyan-400" />
    return <Bookmark size={14} className="text-slate-400" />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">S&T Research Paper Brief</h2>
        <p className="text-xs text-[#888888] mt-1 font-mono">
          Map-Reduce structural analysis for scientific publications, technical papers, and engineering reports.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => runPreset(SAMPLE_SCIENCE_TEXT)} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-purple-400 flex items-center gap-1.5">
              <Microscope size={14} className="text-purple-400" /> Quantum Physics Paper
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 01</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Extract methodology, key findings, and limitations from a 2026 quantum qubit paper.
          </p>
        </button>

        <button onClick={() => runPreset(SAMPLE_SCIENCE_TEXT)} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-blue-400 flex items-center gap-1.5">
              <Zap size={14} className="text-blue-400" /> Empirical Findings
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 02</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Isolate quantitative critical thresholds, coherence times, and temperature bounds.
          </p>
        </button>

        <button onClick={() => runPreset(SAMPLE_SCIENCE_TEXT)} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-emerald-400 flex items-center gap-1.5">
              <FileText size={14} className="text-emerald-400" /> Map-Reduce Full Brief
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 03</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Full 11-field structured breakdown with citation page references.
          </p>
        </button>
      </div>

      {/* Main Single Pane Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="vercel-card p-5">
            <div className="flex items-center justify-between mb-3 border-b border-[#1f1f1f] pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    inputMode === 'text' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <FileText size={12} className="inline mr-1.5" /> Paper Text
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    inputMode === 'upload' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <UploadCloud size={12} className="inline mr-1.5" /> Upload (.pdf)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setText(SAMPLE_SCIENCE_TEXT)} className="btn-vercel-secondary text-xs !py-1">
                  <FileCode size={12} /> Load Paper
                </button>
                {text && (
                  <button onClick={() => setText('')} className="btn-vercel-secondary text-xs !py-1 text-rose-400">
                    <Trash size={12} /> Clear
                  </button>
                )}
              </div>
            </div>

            {inputMode === 'text' ? (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste research paper abstract, methodology, or full text..."
                rows={10}
                className="vercel-input font-mono text-xs leading-relaxed"
              />
            ) : (
              <div className="border border-dashed border-[#222222] hover:border-[#444444] rounded-md p-8 text-center bg-[#000000]">
                <Microscope size={28} className="mx-auto text-[#888888] mb-2" />
                <p className="text-xs font-semibold text-white">Upload scientific paper</p>
                <p className="text-[0.7rem] text-[#666666] mt-0.5 font-mono">PDF, DOCX supported</p>
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" id="v-st-upload" />
                <label htmlFor="v-st-upload" className="btn-vercel-secondary text-xs mt-3 inline-flex">
                  Select File
                </label>
                {pages.length > 0 && (
                  <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400 text-left font-mono">
                    Parsed {pages.length} pages into Map-Reduce memory.
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-md text-xs text-rose-400">{error}</div>}
        </div>

        <div className="lg:col-span-4">
          <div className="vercel-card p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-2">
              Chunk Window
            </h3>

            <div>
              <div className="flex justify-between items-center mb-1 font-mono text-[0.7rem] text-[#888888]">
                <span>Chunk Size</span>
                <span className="text-white">{chunkSize} chars</span>
              </div>
              <input
                type="range"
                min="1500"
                max="5000"
                step="500"
                value={chunkSize}
                onChange={e => setChunkSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={loading || (!pages.length && !text.trim())}
              className="btn-vercel-primary w-full py-2.5 text-xs"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Synthesizing Brief...
                </>
              ) : (
                <>
                  Generate Research Brief <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Rich Categorized Output Inspector */}
      <AnimatePresence>
        {result?.brief && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="vercel-card p-6 space-y-5 border-white/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f1f] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="vercel-badge vercel-badge-emerald font-mono">S&T BRIEF COMPLETE</span>
                  <span className="text-xs font-mono text-[#666666]">• {result.latency_seconds}s</span>
                </div>
                <h3 className="text-base font-semibold text-white font-mono">{result.brief.Title || 'Scientific Report'}</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#000000] p-0.5 rounded border border-[#222222] text-xs">
                  <button
                    onClick={() => setViewTab('rendered')}
                    className={`px-3 py-1 rounded text-[0.725rem] font-medium transition-colors ${
                      viewTab === 'rendered' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <Eye size={12} className="inline mr-1" /> Visual Cards
                  </button>
                  <button
                    onClick={() => setViewTab('json')}
                    className={`px-3 py-1 rounded text-[0.725rem] font-medium transition-colors ${
                      viewTab === 'json' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <Code size={12} className="inline mr-1" /> JSON
                  </button>
                </div>

                <button onClick={copyResult} className="btn-vercel-secondary text-xs">
                  <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadBrief} className="btn-vercel-secondary text-xs">
                  <Download size={12} /> TXT
                </button>
              </div>
            </div>

            {viewTab === 'rendered' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(result.brief).map(([field, val]) => {
                  if (!val || field === 'Title') return null
                  return (
                    <div key={field} className="p-4 bg-[#000000] border border-[#1f1f1f] rounded-md space-y-1.5">
                      <div className="flex items-center gap-2">
                        {getIconForField(field)}
                        <span className="text-[0.68rem] font-mono font-bold text-white uppercase tracking-wider">
                          {field}
                        </span>
                      </div>
                      <p className="text-xs text-[#cccccc] leading-relaxed pl-5">{val}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <pre className="vercel-code">{JSON.stringify(result, null, 2)}</pre>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#1f1f1f] text-[0.7rem] font-mono text-[#666666]">
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> Execution Latency: {result.latency_seconds}s
              </span>
              <span>Chunks Processed: {result.num_chunks || 1}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
