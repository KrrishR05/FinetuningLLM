import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Microscope, FileText, UploadCloud, ClipboardPaste, BarChart2, Hash, SlidersHorizontal, Download, FlaskConical, Beaker, CheckCircle } from 'lucide-react'

const BRIEF_FIELDS = [
  'Title', 'Authors', 'Source/Published', 'Objective',
  'Method', 'Key Findings', 'Important Values/Dates',
  'Limitations', 'Implications', 'Keywords', 'Source Pages',
]

export default function ScienceBrief({ settings, selectedModel }) {
  const [inputMode, setInputMode] = useState('upload')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [chunkSize, setChunkSize] = useState(3000)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.full_text) setText(data.full_text)
      else if (data.warnings?.length) setError(data.warnings[0])
    } catch {
      setError('Failed to extract document.')
    }
  }

  const handleGenerate = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/science-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: selectedModel,
          chunk_size: chunkSize,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt || null,
          auto_unload: settings.autoUnload,
        }),
      })
      const data = await res.json()
      if (data.status === 'success') setResult(data)
      else setError(data.error || 'Brief generation failed.')
    } catch {
      setError('Connection failed.')
    } finally {
      setLoading(false)
    }
  }

  const downloadBrief = () => {
    if (!result?.brief) return
    const content = BRIEF_FIELDS.map(f => `${f}: ${result.brief[f] || 'N/A'}`).join('\n\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'st_research_brief.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl font-semibold text-white mb-2 flex items-center gap-2"
      >
        <Microscope size={24} className="text-white" /> S&T Document Research Brief
      </motion.h2>
      <p className="text-sm text-[#a1a1aa] mb-8">
        Upload a scientific/technical PDF or DOCX to generate a structured research brief with page citations.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="flex gap-2 mb-4 bg-[rgba(255,255,255,0.02)] p-1 rounded-lg border border-[rgba(255,255,255,0.04)] w-fit">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                inputMode === 'upload' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
              }`}
              onClick={() => setInputMode('upload')}
            >
              <UploadCloud size={16} /> Upload S&T Document
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                inputMode === 'paste' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
              }`}
              onClick={() => setInputMode('paste')}
            >
              <ClipboardPaste size={16} /> Paste Raw Text
            </button>
          </div>

          {inputMode === 'paste' ? (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste the research paper or technical report text..."
              rows={12}
              className="mb-4"
            />
          ) : (
            <div className="dropzone mb-4" onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.md" onChange={handleFileUpload} className="hidden" />
              <FlaskConical size={48} className="text-[#3f3f46] mb-2" />
              <p className="text-sm text-[#fdfdfd] font-medium mb-1">{fileName || 'Drop S&T document here or click to browse'}</p>
              <p className="text-xs text-[#71717a]">Supports PDF, DOCX, TXT, MD</p>
            </div>
          )}

          {text.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-6 flex-wrap"
            >
              <span className="badge badge-neutral text-xs">
                <BarChart2 size={12} /> {text.split(/\s+/).length.toLocaleString()} Words
              </span>
              <span className="badge badge-neutral text-xs">
                <Hash size={12} /> {text.length.toLocaleString()} Characters
              </span>
            </motion.div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] text-[#f87171] text-sm mb-6 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}
        </div>

        <div className="col-span-1">
          <div className="glass-card !p-6">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#71717a] mb-5 flex items-center gap-2">
              <SlidersHorizontal size={14} /> Brief Settings
            </h3>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-[#a1a1aa] font-medium">Chunk Size</span>
                <span className="text-xs font-mono text-white bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded">{chunkSize}</span>
              </div>
              <input type="range" min="1500" max="5000" step="500" value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value))} className="w-full" />
            </div>
            <button className="btn-primary w-full" onClick={handleGenerate} disabled={loading || !text.trim()}>
              {loading ? <><div className="spinner" /> Generating...</> : <><Beaker size={16} /> Generate S&T Brief</>}
            </button>
          </div>
        </div>
      </div>

      {/* Output */}
      <AnimatePresence>
        {result?.brief && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 mb-20"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-4">
              <CheckCircle size={20} className="text-[#a1a1aa]" /> Structured Research Brief
            </h3>
            <div className="space-y-4 mb-8">
              {BRIEF_FIELDS.map((field, i) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-xl border border-[rgba(255,255,255,0.03)] bg-[rgba(255,255,255,0.015)]"
                >
                  <span className="text-[0.65rem] uppercase tracking-widest text-[#a1a1aa] font-semibold mb-1.5 block">{field}</span>
                  <div className="text-sm text-[#fdfdfd] leading-relaxed whitespace-pre-wrap">{result.brief[field] || 'Not stated in source.'}</div>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)] p-4 rounded-xl">
              <button className="btn-secondary text-sm" onClick={downloadBrief}>
                <Download size={16} /> Export Brief
              </button>
              <span className="text-xs text-[#71717a] flex items-center gap-4">
                <span>Latency: <code className="text-white bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded ml-1">{result.latency_seconds}s</code></span>
                <span>Chunks: <code className="text-white bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded ml-1">{result.num_chunks}</code></span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
