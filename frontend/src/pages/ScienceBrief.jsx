import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Microscope, FileText, UploadCloud, Sliders, Download, Clock, ArrowRight, FileCode, Eye, Code, Copy, Trash } from 'lucide-react'

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

  const handleGenerate = async () => {
    let sourcePages = pages
    if (!sourcePages.length && text.trim()) {
      sourcePages = [{ page_number: 1, text: text, source_label: 'Pasted Text' }]
    }
    if (!sourcePages.length) return

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/science-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: sourcePages,
          model_id: selectedModel,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt || null,
          auto_unload: settings.autoUnload,
          max_chunk_chars: chunkSize,
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

  const fields = [
    'Title', 'Authors', 'Source/Published', 'Objective',
    'Method', 'Key Findings', 'Important Values/Dates',
    'Limitations', 'Implications', 'Keywords', 'Source Pages'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Microscope size={20} className="text-blue-400" /> S&T Document Research Brief
        </h2>
        <p className="text-xs text-[var(--text-dim)] mt-0.5">
          Map-Reduce structural analysis for scientific publications, technical papers, and engineering reports.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <div className="wb-card p-5">
            <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    inputMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText size={13} /> Raw Paper Text
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    inputMode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud size={13} /> Upload Paper (.pdf)
                </button>
              </div>

              <div className="flex items-center gap-2">
                {inputMode === 'text' && (
                  <>
                    <button onClick={() => setText(SAMPLE_SCIENCE_TEXT)} className="btn-wb-secondary text-[0.7rem] !py-1 !px-2">
                      <FileCode size={12} /> Insert Sample Paper
                    </button>
                    {text && (
                      <button onClick={() => setText('')} className="btn-wb-secondary text-[0.7rem] !py-1 !px-2 text-rose-400">
                        <Trash size={12} /> Clear
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {inputMode === 'text' ? (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste research paper abstract, methodology, or full text..."
                rows={11}
                className="wb-canvas font-mono text-xs leading-relaxed"
              />
            ) : (
              <div className="border border-dashed border-zinc-700/80 hover:border-blue-500 rounded-lg p-8 text-center bg-black/40">
                <Microscope size={32} className="mx-auto text-blue-400 mb-2" />
                <p className="text-xs font-semibold text-white">Upload research paper or patent</p>
                <p className="text-[0.7rem] text-slate-400 mt-0.5">PDF, DOCX formats supported</p>
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" id="st-upload-2" />
                <label htmlFor="st-upload-2" className="btn-wb-secondary text-xs mt-3 inline-flex">
                  Select File
                </label>
                {pages.length > 0 && (
                  <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400 text-left">
                    Document parsed into {pages.length} pages.
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">{error}</div>}
        </div>

        <div className="lg:col-span-4">
          <div className="wb-card p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Sliders size={15} className="text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Map-Reduce Settings</h3>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
                  Chunk Size
                </label>
                <span className="text-[0.7rem] font-mono text-blue-400">{chunkSize} chars</span>
              </div>
              <input
                type="range"
                min="1500"
                max="5000"
                step="500"
                value={chunkSize}
                onChange={e => setChunkSize(parseInt(e.target.value))}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || (!pages.length && !text.trim())}
              className="btn-wb-primary w-full py-2.5 text-xs"
            >
              {loading ? (
                <>
                  <div className="studio-spinner" /> Synthesizing Map-Reduce Brief...
                </>
              ) : (
                <>
                  <Microscope size={14} /> Generate Brief <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Output */}
      <AnimatePresence>
        {result?.brief && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="wb-card p-6 space-y-4 border-blue-500/30"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-3">
                <span className="wb-badge wb-badge-blue text-[0.65rem]">RESEARCH BRIEF</span>
                <h3 className="text-base font-bold text-white">Structured S&T Findings</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-black/40 p-0.5 rounded border border-white/10 text-xs">
                  <button
                    onClick={() => setViewTab('rendered')}
                    className={`px-2.5 py-1 rounded text-[0.7rem] font-medium flex items-center gap-1 ${
                      viewTab === 'rendered' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye size={12} /> Rendered Cards
                  </button>
                  <button
                    onClick={() => setViewTab('json')}
                    className={`px-2.5 py-1 rounded text-[0.7rem] font-medium flex items-center gap-1 ${
                      viewTab === 'json' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code size={12} /> JSON Response
                  </button>
                </div>

                <button onClick={copyResult} className="btn-wb-secondary text-xs">
                  <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadBrief} className="btn-wb-secondary text-xs">
                  <Download size={13} /> TXT
                </button>
              </div>
            </div>

            {viewTab === 'rendered' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.map(field => {
                  const val = result.brief[field]
                  if (!val) return null
                  return (
                    <div key={field} className="p-3 bg-zinc-900/60 border border-white/5 rounded space-y-1">
                      <span className="text-[0.65rem] font-mono font-bold text-blue-400 uppercase tracking-wider block">
                        {field}
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed">{val}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <pre className="code-block">{JSON.stringify(result, null, 2)}</pre>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] text-[0.7rem] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-blue-400" /> Latency: {result.latency_seconds}s
              </span>
              <span>Chunks: {result.num_chunks || 1}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
