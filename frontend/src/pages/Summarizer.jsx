import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ClipboardPaste, UploadCloud, FileText, BarChart2, Hash, Clock, SlidersHorizontal, Download, FileJson } from 'lucide-react'

export default function Summarizer({ settings, selectedModel }) {
  const [inputMode, setInputMode] = useState('paste')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [targetLength, setTargetLength] = useState('100 words')
  const [outputFormat, setOutputFormat] = useState('bullets')
  const fileInputRef = useRef(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

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
      if (data.full_text) {
        setText(data.full_text)
      } else if (data.warnings?.length) {
        setError(data.warnings[0])
      }
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
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: selectedModel,
          length: targetLength,
          fmt: outputFormat,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt || null,
          auto_unload: settings.autoUnload,
        }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        setResult(data)
      } else {
        setError(data.error || 'Summarization failed.')
      }
    } catch {
      setError('Connection failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const downloadResult = () => {
    if (!result) return
    let content = `TITLE: ${result.title}\n\nSUMMARY:\n${result.summary}\n`
    if (result.bullets?.length) {
      content += '\nKEY POINTS:\n' + result.bullets.map(b => `- ${b}`).join('\n')
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `summary_${(result.title || 'output').slice(0, 20).replace(/\s/g, '_')}.txt`
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
        <Zap size={24} className="text-white" /> AI/ML Text Summarization
      </motion.h2>
      <p className="text-sm text-[#a1a1aa] mb-8">
        Summarize unstructured text or documents locally with custom length and structural formatting controls.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Column (2/3) */}
        <div className="col-span-2">
          {/* Input Mode Toggle */}
          <div className="flex gap-2 mb-4 bg-[rgba(255,255,255,0.02)] p-1 rounded-lg border border-[rgba(255,255,255,0.04)] w-fit">
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
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                inputMode === 'upload' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
              }`}
              onClick={() => setInputMode('upload')}
            >
              <UploadCloud size={16} /> Upload Document
            </button>
          </div>

          {inputMode === 'paste' ? (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste the text or report paragraph you wish to summarize..."
              className="mb-4"
              rows={12}
            />
          ) : (
            <div
              className="dropzone mb-4"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) {
                  const dt = new DataTransfer()
                  dt.items.add(file)
                  fileInputRef.current.files = dt.files
                  handleFileUpload({ target: { files: dt.files } })
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileText size={48} className="text-[#3f3f46] mb-2" />
              <p className="text-sm text-[#fdfdfd] font-medium mb-1">
                {fileName || 'Drop a file here or click to browse'}
              </p>
              <p className="text-xs text-[#71717a]">Supports PDF, DOCX, TXT</p>
            </div>
          )}

          {/* Text Stats */}
          {text.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-6 flex-wrap"
            >
              <span className="badge badge-neutral text-xs">
                <BarChart2 size={12} /> {wordCount.toLocaleString()} Words
              </span>
              <span className="badge badge-neutral text-xs">
                <Hash size={12} /> {charCount.toLocaleString()} Characters
              </span>
              <span className="badge badge-neutral text-xs">
                <Clock size={12} /> ~{readTime} min read
              </span>
            </motion.div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] text-[#f87171] text-sm mb-6 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}
        </div>

        {/* Config Column (1/3) */}
        <div className="col-span-1 lg:col-span-1">
          <div className="glass-card !p-6">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#71717a] mb-5 flex items-center gap-2">
              <SlidersHorizontal size={14} /> Summarizer Controls
            </h3>

            <div className="mb-5">
              <label className="text-xs text-[#a1a1aa] block mb-2 font-medium">Target Length</label>
              <select
                value={targetLength}
                onChange={e => setTargetLength(e.target.value)}
              >
                <option value="50 words">50 words (Quick)</option>
                <option value="100 words">100 words (Balanced)</option>
                <option value="250 words">250 words (Detailed)</option>
                <option value="Detailed">Detailed (Full)</option>
              </select>
            </div>

            <div className="mb-8">
              <label className="text-xs text-[#a1a1aa] block mb-2 font-medium">Output Format</label>
              <select
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value)}
              >
                <option value="bullets">Bullet Points</option>
                <option value="paragraph">Executive Paragraph</option>
              </select>
            </div>

            <button
              className="btn-primary w-full"
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap size={16} /> Generate Summary
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Output Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 mb-20"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-4">
              <FileJson size={20} className="text-[#a1a1aa]" /> Structured Output
            </h3>

            {/* Title Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl mb-6 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]"
            >
              <span className="text-[0.65rem] uppercase tracking-widest text-[#71717a] font-semibold block mb-2">
                Document Title
              </span>
              <div className="text-2xl font-semibold text-white">{result.title}</div>
            </motion.div>

            {/* Summary Box */}
            <h4 className="text-[0.7rem] font-semibold text-[#71717a] uppercase tracking-widest mb-3 pl-1">
              Executive Summary
            </h4>
            <div className="summary-box mb-8">{result.summary}</div>

            {/* Bullets */}
            {result.bullets?.length > 0 && (
              <>
                <h4 className="text-[0.7rem] font-semibold text-[#71717a] uppercase tracking-widest mb-3 pl-1">
                  Key Takeaways
                </h4>
                <div className="space-y-3 mb-8">
                  {result.bullets.map((b, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="bullet-card"
                    >
                      <div className="bullet-icon bg-[rgba(255,255,255,0.05)] rounded-full text-xs font-semibold">{i + 1}</div>
                      <span className="text-sm text-[#d4d4d8] leading-relaxed">{b}</span>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)] p-4 rounded-xl">
              <button className="btn-secondary text-sm" onClick={downloadResult}>
                <Download size={16} /> Export
              </button>
              <span className="text-xs text-[#71717a] flex items-center gap-4">
                <span>Latency: <code className="text-white bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded ml-1">{result.latency_seconds}s</code></span>
                <span>Model: <code className="text-white bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded ml-1">{result.model_name}</code></span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
