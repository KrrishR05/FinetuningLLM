import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Microscope, FileText, UploadCloud, Sliders, Download, Layers, Clock, ArrowRight } from 'lucide-react'

export default function ScienceBrief({ settings, selectedModel }) {
  const [inputMode, setInputMode] = useState('upload')
  const [text, setText] = useState('')
  const [pages, setPages] = useState([])
  const [chunkSize, setChunkSize] = useState(3000)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

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
      setError('Connection failed. Please verify backend.')
    } finally {
      setLoading(false)
    }
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
          <Microscope size={24} className="text-violet-400" /> S&T Document Research Brief
        </h2>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Map-Reduce structural analysis for scientific publications, technical papers, and engineering reports.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="studio-card p-6">
            <div className="flex gap-2 mb-4 bg-black/40 p-1 rounded-xl w-fit border border-[var(--border-subtle)]">
              <button
                onClick={() => setInputMode('upload')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                  inputMode === 'upload' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UploadCloud size={14} /> Upload Paper (.pdf/.docx)
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                  inputMode === 'text' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText size={14} /> Paste Text
              </button>
            </div>

            {inputMode === 'upload' ? (
              <div className="border-2 border-dashed border-slate-700/60 hover:border-violet-500/50 rounded-xl p-10 text-center transition-colors bg-black/20">
                <Microscope size={36} className="mx-auto text-violet-400 mb-3" />
                <p className="text-sm font-semibold text-white">Upload research paper or patent</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="st-upload"
                />
                <label htmlFor="st-upload" className="btn-studio-secondary text-xs mt-4 inline-flex">
                  Choose Document
                </label>

                {pages.length > 0 && (
                  <div className="mt-4 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg text-xs text-violet-400 text-left">
                    Document parsed into {pages.length} pages. Ready for map-reduce.
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste research paper abstract, methodology, or full text..."
                rows={12}
                className="studio-canvas"
              />
            )}
          </div>

          {error && <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">{error}</div>}
        </div>

        <div className="lg:col-span-4">
          <div className="studio-card p-6 studio-card-glow space-y-6">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
              <Sliders size={16} className="text-violet-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Map-Reduce Settings</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Chunk Window Size ({chunkSize} chars)
              </label>
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
              className="btn-studio-primary w-full py-3 text-sm !from-violet-600 !to-indigo-600 shadow-violet-500/25"
            >
              {loading ? (
                <>
                  <div className="studio-spinner" /> Extracting S&T Brief...
                </>
              ) : (
                <>
                  <Microscope size={16} /> Generate Research Brief <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Brief Result Cards */}
      <AnimatePresence>
        {result?.brief && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="studio-card p-8 space-y-6 border-violet-500/30"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <h3 className="text-xl font-bold text-white">Structured S&T Research Brief</h3>
              <button onClick={downloadBrief} className="btn-studio-secondary text-xs">
                <Download size={14} /> Download Brief
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(field => {
                const val = result.brief[field]
                if (!val) return null
                return (
                  <div key={field} className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-1">
                    <span className="text-[0.65rem] font-bold text-violet-400 uppercase tracking-widest block">
                      {field}
                    </span>
                    <p className="text-sm text-slate-200 leading-relaxed">{val}</p>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-violet-400" /> Latency: {result.latency_seconds}s
              </span>
              <span className="flex items-center gap-2">
                <Layers size={14} className="text-cyan-400" /> Chunks Processed: {result.num_chunks || 1}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
