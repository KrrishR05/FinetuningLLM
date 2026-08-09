import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, FileText, UploadCloud, Sliders, Download, CheckCircle, Clock, Cpu, ArrowRight } from 'lucide-react'

export default function Summarizer({ settings, selectedModel }) {
  const [inputMode, setInputMode] = useState('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [extractedInfo, setExtractedInfo] = useState(null)
  const [targetLength, setTargetLength] = useState('100 words')
  const [outputFormat, setOutputFormat] = useState('bullets')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.full_text) {
        setText(data.full_text)
        setExtractedInfo(data.metadata)
      } else {
        setError(data.warnings?.[0] || 'Extraction failed')
      }
    } catch {
      setError('File extraction failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSummarize = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: selectedModel,
          length: targetLength,
          format: outputFormat,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt || null,
          auto_unload: settings.autoUnload,
        }),
      })
      const data = await res.json()
      if (data.status === 'success') setResult(data)
      else setError(data.error || 'Summarization failed.')
    } catch {
      setError('Connection failed. Please ensure local servers are running.')
    } finally {
      setLoading(false)
    }
  }

  const downloadSummary = () => {
    if (!result) return
    let content = `TITLE: ${result.title}\n\nSUMMARY:\n${result.summary}\n\n`
    if (result.bullets?.length) {
      content += 'KEY TAKEAWAYS:\n' + result.bullets.map(b => `- ${b}`).join('\n')
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `summary_${(result.title || 'document').slice(0, 20).replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  return (
    <div className="space-y-8">
      {/* Studio Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
          <Sparkles size={24} className="text-cyan-400" /> AI/ML Intelligence Summarizer
        </h2>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Extract structural bullet points or executive synopses from raw text and multi-format documents.
        </p>
      </div>

      {/* Main Studio Grid: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Canvas (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="studio-card p-6">
            {/* Input Mode Selector */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-[var(--border-subtle)]">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    inputMode === 'text' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText size={14} /> Paste Text
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    inputMode === 'upload' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud size={14} /> Upload Doc
                </button>
              </div>

              {wordCount > 0 && (
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span>{wordCount.toLocaleString()} words</span>
                  <span>•</span>
                  <span>{charCount.toLocaleString()} chars</span>
                </div>
              )}
            </div>

            {/* Editor Canvas or Upload Zone */}
            {inputMode === 'text' ? (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste unstructured text, research notes, or reports here..."
                rows={12}
                className="studio-canvas"
              />
            ) : (
              <div className="border-2 border-dashed border-slate-700/60 hover:border-cyan-500/50 rounded-xl p-10 text-center transition-colors bg-black/20">
                <UploadCloud size={36} className="mx-auto text-cyan-400 mb-3" />
                <p className="text-sm font-semibold text-white">Upload document file</p>
                <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, TXT formats</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="doc-upload"
                />
                <label htmlFor="doc-upload" className="btn-studio-secondary text-xs mt-4 inline-flex">
                  Choose File
                </label>

                {extractedInfo && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 text-left">
                    Extracted {extractedInfo.num_pages || 1} pages, {extractedInfo.word_count || wordCount} words.
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}
        </div>

        {/* Right Parameter Studio Controls (Col 4) */}
        <div className="lg:col-span-4">
          <div className="studio-card p-6 studio-card-glow space-y-6">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
              <Sliders size={16} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Summarizer Controls</h3>
            </div>

            {/* Target Length Slider / Select */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Target Summary Length
              </label>
              <select
                value={targetLength}
                onChange={e => setTargetLength(e.target.value)}
                className="studio-select"
              >
                <option value="50 words">50 words (Concise Snapshot)</option>
                <option value="100 words">100 words (Balanced Synopsis)</option>
                <option value="250 words">250 words (Extended Executive)</option>
                <option value="Detailed">Detailed (Full Sectional Breakdown)</option>
              </select>
            </div>

            {/* Structural Format */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Output Format Structure
              </label>
              <select
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value)}
                className="studio-select"
              >
                <option value="bullets">Bullet Points & Key Takeaways</option>
                <option value="paragraph">Executive Synthesis Paragraph</option>
              </select>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleSummarize}
              disabled={loading || !text.trim()}
              className="btn-studio-primary w-full py-3 text.sm"
            >
              {loading ? (
                <>
                  <div className="studio-spinner" /> Synthesizing Summary...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate Summary <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Output Results Workbench */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="studio-card p-8 space-y-6 border-cyan-500/30"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="text-[0.65rem] font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                  Synthesized Result
                </span>
                <h3 className="text-xl font-bold text-white">{result.title}</h3>
              </div>
              <button onClick={downloadSummary} className="btn-studio-secondary text-xs">
                <Download size={14} /> Export TXT
              </button>
            </div>

            {/* Executive Summary Box */}
            <div className="p-5 bg-slate-900/80 border-l-4 border-cyan-500 rounded-r-xl text-sm leading-relaxed text-slate-200">
              {result.summary}
            </div>

            {/* Key Takeaways Bullets */}
            {result.bullets?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Takeaways</h4>
                <div className="space-y-2">
                  {result.bullets.map((bullet, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-start gap-3 text-sm text-slate-300"
                    >
                      <CheckCircle size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Latency & Telemetry Metadata */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-cyan-400" /> Latency: {result.latency_seconds}s
              </span>
              <span className="flex items-center gap-2">
                <Cpu size={14} className="text-emerald-400" /> Engine: {result.model_name}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
