import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, FileText, UploadCloud, Sliders, Download, CheckCircle, Clock, Cpu, ArrowRight, Copy, Trash, FileCode, Eye, Code } from 'lucide-react'

const SAMPLE_TEXT = `Learning is a lifelong journey that shapes the mind and expands our understanding of the world. Every single day gives us new chances to gain knowledge, build skills, and experience growth through curiosity. While challenges may appear, persistence helps us overcome obstacles and find fresh perspectives. As individuals develop, they also learn vital lessons about empathy, responsibility, and cooperation. Ultimately, this ongoing process enriches our daily lives, unlocks hidden potential, and opens doors to a future filled with bright new possibilities, achievements, and meaningful connections with everyone around us.`

export default function Summarizer({ settings, selectedModel }) {
  const [inputMode, setInputMode] = useState('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [extractedInfo, setExtractedInfo] = useState(null)
  const [targetLength, setTargetLength] = useState('100 words')
  const [outputFormat, setOutputFormat] = useState('bullets')
  const [viewTab, setViewTab] = useState('rendered')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

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
      setError('Connection failed.')
    } finally {
      setLoading(false)
    }
  }

  const copyResult = () => {
    if (!result) return
    const textToCopy = `TITLE: ${result.title}\n\nSUMMARY:\n${result.summary}\n\nKEY POINTS:\n` + (result.bullets || []).map(b => `- ${b}`).join('\n')
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
    a.download = `summary_${(result.title || 'doc').slice(0, 20).replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Sparkles size={20} className="text-blue-400" /> AI/ML Intelligence Summarizer
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-0.5">
            Synthesize unstructured document feeds into executive bullet points or structured synopses.
          </p>
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Canvas (Col 8) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="wb-card p-5">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    inputMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText size={13} /> Raw Text
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    inputMode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud size={13} /> Upload File
                </button>
              </div>

              {/* Quick Action Pills */}
              <div className="flex items-center gap-2">
                {inputMode === 'text' && (
                  <>
                    <button
                      onClick={() => setText(SAMPLE_TEXT)}
                      className="btn-wb-secondary text-[0.7rem] !py-1 !px-2"
                    >
                      <FileCode size={12} /> Insert Sample
                    </button>
                    {text && (
                      <button
                        onClick={() => setText('')}
                        className="btn-wb-secondary text-[0.7rem] !py-1 !px-2 text-rose-400 hover:border-rose-500/30"
                      >
                        <Trash size={12} /> Clear
                      </button>
                    )}
                  </>
                )}
                {wordCount > 0 && (
                  <span className="wb-badge wb-badge-neutral text-[0.68rem]">
                    {wordCount.toLocaleString()} words
                  </span>
                )}
              </div>
            </div>

            {/* Canvas Input Area */}
            {inputMode === 'text' ? (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste paragraph text or report draft here..."
                rows={11}
                className="wb-canvas font-sans text-xs leading-relaxed"
              />
            ) : (
              <div className="border border-dashed border-zinc-700/80 hover:border-blue-500 rounded-lg p-8 text-center bg-black/40">
                <UploadCloud size={32} className="mx-auto text-blue-400 mb-2" />
                <p className="text-xs font-semibold text-white">Upload document file</p>
                <p className="text-[0.7rem] text-slate-400 mt-0.5">PDF, DOCX, TXT formats supported</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="doc-upload-2"
                />
                <label htmlFor="doc-upload-2" className="btn-wb-secondary text-xs mt-3 inline-flex">
                  Select File
                </label>

                {extractedInfo && (
                  <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400 text-left">
                    Extracted {extractedInfo.num_pages || 1} pages, {extractedInfo.word_count || wordCount} words.
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
              {error}
            </div>
          )}
        </div>

        {/* Pro Studio Parameters (Col 4) */}
        <div className="lg:col-span-4">
          <div className="wb-card p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Sliders size={15} className="text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Summarizer Controls</h3>
            </div>

            <div>
              <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Target Summary Length
              </label>
              <select
                value={targetLength}
                onChange={e => setTargetLength(e.target.value)}
                className="wb-select"
              >
                <option value="50 words">50 words (Concise Snapshot)</option>
                <option value="100 words">100 words (Balanced Synopsis)</option>
                <option value="250 words">250 words (Extended Executive)</option>
                <option value="Detailed">Detailed (Full Breakdown)</option>
              </select>
            </div>

            <div>
              <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Output Format Structure
              </label>
              <select
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value)}
                className="wb-select"
              >
                <option value="bullets">Bullet Points & Key Takeaways</option>
                <option value="paragraph">Executive Paragraph</option>
              </select>
            </div>

            <button
              onClick={handleSummarize}
              disabled={loading || !text.trim()}
              className="btn-wb-primary w-full py-2.5 text-xs"
            >
              {loading ? (
                <>
                  <div className="studio-spinner" /> Processing Local LLM...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Generate Summary <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Multi-View Output Workbench */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="wb-card p-6 space-y-4 border-blue-500/30"
          >
            {/* View Selector & Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-3">
                <span className="wb-badge wb-badge-blue text-[0.65rem]">OUTPUT</span>
                <h3 className="text-base font-bold text-white">{result.title}</h3>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex bg-black/40 p-0.5 rounded border border-white/10 text-xs">
                  <button
                    onClick={() => setViewTab('rendered')}
                    className={`px-2.5 py-1 rounded text-[0.7rem] font-medium flex items-center gap-1 ${
                      viewTab === 'rendered' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye size={12} /> Rendered View
                  </button>
                  <button
                    onClick={() => setViewTab('markdown')}
                    className={`px-2.5 py-1 rounded text-[0.7rem] font-medium flex items-center gap-1 ${
                      viewTab === 'markdown' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCode size={12} /> Raw Markdown
                  </button>
                  <button
                    onClick={() => setViewTab('json')}
                    className={`px-2.5 py-1 rounded text-[0.7rem] font-medium flex items-center gap-1 ${
                      viewTab === 'json' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code size={12} /> JSON API Response
                  </button>
                </div>

                <button onClick={copyResult} className="btn-wb-secondary text-xs">
                  <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadSummary} className="btn-wb-secondary text-xs">
                  <Download size={13} /> TXT
                </button>
              </div>
            </div>

            {/* Rendered View */}
            {viewTab === 'rendered' && (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-900 border-l-2 border-blue-500 rounded-r text-xs leading-relaxed text-slate-200">
                  {result.summary}
                </div>

                {result.bullets?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider block">Key Takeaways</span>
                    {result.bullets.map((bullet, idx) => (
                      <div key={idx} className="p-2.5 bg-black/40 border border-white/5 rounded text-xs text-slate-300 flex items-start gap-2.5">
                        <CheckCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Markdown View */}
            {viewTab === 'markdown' && (
              <pre className="code-block">
{`# ${result.title}

## Executive Summary
${result.summary}

## Key Points
${(result.bullets || []).map(b => `- ${b}`).join('\n')}`}
              </pre>
            )}

            {/* JSON View */}
            {viewTab === 'json' && (
              <pre className="code-block">
{JSON.stringify(result, null, 2)}
              </pre>
            )}

            {/* Footer Telemetry */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] text-[0.7rem] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-blue-400" /> Execution Latency: {result.latency_seconds}s
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu size={12} className="text-emerald-400" /> Active Model: {result.model_name}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
