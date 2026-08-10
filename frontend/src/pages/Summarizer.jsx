import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, FileText, UploadCloud, Download, CheckCircle, Clock, Cpu, ArrowRight, Copy, Trash, FileCode, Eye, Code, Terminal, Zap, Layers, AlignLeft, ListOrdered } from 'lucide-react'
import VercelSelect from '../components/VercelSelect'

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

  const handleSummarize = async (overrideLength, overrideFormat, overrideText) => {
    const textToSummarize = overrideText !== undefined ? overrideText : text
    if (!textToSummarize.trim()) return

    const lengthToUse = overrideLength || targetLength
    const formatToUse = overrideFormat || outputFormat

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSummarize,
          model_id: selectedModel,
          length: lengthToUse,
          fmt: formatToUse,
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

  const runPreset = (length, format) => {
    setTargetLength(length)
    setOutputFormat(format)
    if (text.trim()) {
      handleSummarize(length, format, text)
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold gradient-heading tracking-tight">AI/ML Intelligence Summarizer</h2>
        <p className="text-xs text-[#888888] mt-1 font-mono">
          Single-Pane LLM Summarizer with instant one-click presets and rich output workbench.
        </p>
      </div>

      {/* Vercel Easy Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => runPreset('100 words', 'bullets')} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-blue-400 flex items-center gap-1.5">
              <Zap size={14} className="text-blue-400" /> 100-Word Bullets
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 01</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Extract key takeaways into structured bullet points from sample text.
          </p>
        </button>

        <button onClick={() => runPreset('50 words', 'paragraph')} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-emerald-400 flex items-center gap-1.5">
              <FileText size={14} className="text-emerald-400" /> Executive Paragraph
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 02</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Synthesize a concise 50-word executive synopsis for decision makers.
          </p>
        </button>

        <button onClick={() => runPreset('Detailed', 'bullets')} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-purple-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-400" /> Deep Sectional Analysis
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 03</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Full comprehensive breakdown with in-depth structural details.
          </p>
        </button>
      </div>

      {/* Main Single-Pane Playground */}
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
                  <FileText size={12} className="inline mr-1.5" /> Text Input
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    inputMode === 'upload' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <UploadCloud size={12} className="inline mr-1.5" /> Upload File
                </button>
              </div>

              <div className="flex items-center gap-2">
                {inputMode === 'text' && (
                  <>
                    <button onClick={() => setText(SAMPLE_TEXT)} className="btn-vercel-secondary text-xs !py-1">
                      <FileCode size={12} /> Load Sample
                    </button>
                    {text && (
                      <button onClick={() => setText('')} className="btn-vercel-secondary text-xs !py-1 text-rose-400">
                        <Trash size={12} /> Clear
                      </button>
                    )}
                  </>
                )}
                {wordCount > 0 && (
                  <span className="vercel-badge vercel-badge-neutral font-mono text-[0.68rem]">
                    {wordCount} words
                  </span>
                )}
              </div>
            </div>

            {inputMode === 'text' ? (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste paragraph text or report draft here..."
                rows={10}
                className="vercel-input font-sans text-xs leading-relaxed"
              />
            ) : (
              <div className="border border-dashed border-[#222222] hover:border-[#444444] rounded-md p-8 text-center bg-[#000000]">
                <UploadCloud size={28} className="mx-auto text-[#888888] mb-2" />
                <p className="text-xs font-semibold text-white">Upload document file</p>
                <p className="text-[0.7rem] text-[#666666] mt-0.5 font-mono">PDF, DOCX, TXT supported</p>
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" id="v-upload" />
                <label htmlFor="v-upload" className="btn-vercel-secondary text-xs mt-3 inline-flex">
                  Select File
                </label>
                {extractedInfo && (
                  <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400 text-left font-mono">
                    Extracted {extractedInfo.num_pages || 1} pages, {extractedInfo.word_count || wordCount} words.
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-md text-xs text-rose-400">{error}</div>}
        </div>

        {/* Controls */}
        <div className="lg:col-span-4">
          <div className="vercel-card p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-2">
              Parameters
            </h3>

            <div>
              <label className="text-[0.7rem] font-mono text-[#888888] uppercase block mb-1">Target Length</label>
              <VercelSelect
                options={[
                  { value: '50 words', label: '50 words (Concise Snapshot)', description: '2-3 sentence brief executive summary' },
                  { value: '100 words', label: '100 words (Balanced Overview)', description: '4-5 sentence balanced summary' },
                  { value: '250 words', label: '250 words (Extended Report)', description: 'Comprehensive multi-paragraph report' },
                  { value: 'Detailed', label: 'Detailed Breakdown', description: 'In-depth exhaustive analysis' },
                ]}
                value={targetLength}
                onChange={setTargetLength}
              />
            </div>

            <div>
              <label className="text-[0.7rem] font-mono text-[#888888] uppercase block mb-1">Format Structure</label>
              <VercelSelect
                options={[
                  { value: 'bullets', label: 'Bullet Points & Takeaways', icon: ListOrdered, description: 'Structured takeaways with bullet lists' },
                  { value: 'paragraph', label: 'Executive Paragraph', icon: AlignLeft, description: 'Unified narrative paragraph' },
                ]}
                value={outputFormat}
                onChange={setOutputFormat}
              />
            </div>

            <button
              onClick={() => handleSummarize()}
              disabled={loading || !text.trim()}
              className="btn-vercel-primary w-full py-2.5 text-xs"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Processing LLM...
                </>
              ) : (
                <>
                  Run LLM Model <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Rich Intuitive Output Inspector */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="vercel-card p-6 space-y-5 border-white/20"
          >
            {/* Header & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f1f] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="vercel-badge vercel-badge-emerald font-mono">SYNTHESIS COMPLETE</span>
                  <span className="text-xs font-mono text-[#666666]">• {result.latency_seconds}s</span>
                </div>
                <h3 className="text-base font-semibold text-white tracking-tight">{result.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#000000] p-0.5 rounded border border-[#222222] text-xs">
                  <button
                    onClick={() => setViewTab('rendered')}
                    className={`px-3 py-1 rounded text-[0.725rem] font-medium transition-colors ${
                      viewTab === 'rendered' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <Eye size={12} className="inline mr-1" /> Visual Report
                  </button>
                  <button
                    onClick={() => setViewTab('markdown')}
                    className={`px-3 py-1 rounded text-[0.725rem] font-medium transition-colors ${
                      viewTab === 'markdown' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <FileCode size={12} className="inline mr-1" /> Markdown
                  </button>
                  <button
                    onClick={() => setViewTab('curl')}
                    className={`px-3 py-1 rounded text-[0.725rem] font-medium transition-colors ${
                      viewTab === 'curl' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <Terminal size={12} className="inline mr-1" /> cURL API
                  </button>
                </div>

                <button onClick={copyResult} className="btn-vercel-secondary text-xs">
                  <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadSummary} className="btn-vercel-secondary text-xs">
                  <Download size={12} /> TXT
                </button>
              </div>
            </div>

            {/* Visual Report */}
            {viewTab === 'rendered' && (
              <div className="space-y-5">
                {/* Executive Summary Block */}
                <div className="p-4 bg-[#000000] border-l-4 border-white rounded-r-md">
                  <span className="text-[0.65rem] font-mono font-bold text-[#888888] uppercase block mb-1">
                    Executive Synopsis
                  </span>
                  <p className="text-xs leading-relaxed text-[#eeeeee]">
                    {result.summary}
                  </p>
                </div>

                {/* Key Takeaway Grid Cards */}
                {result.bullets?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[0.68rem] font-mono font-bold text-[#888888] uppercase block tracking-wider">
                      Key Structural Takeaways ({result.bullets.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.bullets.map((bullet, idx) => (
                        <div key={idx} className="p-3 bg-[#000000] border border-[#1f1f1f] rounded-md flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle size={12} className="text-emerald-400" />
                          </div>
                          <p className="text-xs text-[#dddddd] leading-relaxed">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Markdown View */}
            {viewTab === 'markdown' && (
              <pre className="vercel-code">
{`# ${result.title}

## Executive Summary
${result.summary}

## Key Takeaways
${(result.bullets || []).map(b => `- ${b}`).join('\n')}`}
              </pre>
            )}

            {/* cURL Snippet View */}
            {viewTab === 'curl' && (
              <pre className="vercel-code">
{`curl -X POST "http://localhost:8000/api/summarize" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "${text.replace(/"/g, '\\"').slice(0, 100)}...",
    "model_id": "${selectedModel}",
    "length": "${targetLength}",
    "format": "${outputFormat}"
  }'`}
              </pre>
            )}

            {/* Telemetry Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1f1f1f] text-[0.7rem] font-mono text-[#666666]">
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> Execution Latency: {result.latency_seconds}s
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu size={12} /> Engine Model: {result.model_name}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
