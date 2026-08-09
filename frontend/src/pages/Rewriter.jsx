import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, Sliders, Download, ShieldCheck, AlertTriangle, FileDiff, Clock, ArrowRight, FileCode, Eye, Code, Copy, Trash, Zap } from 'lucide-react'

const SAMPLE_DRAFT_TEXT = `Hi team, we has tested the new API endpoint yesterday on server 4 and found 3 errors in response payload. Average response time was 850ms which is too high according to our 200ms SLA target. We need to fix this asap before release.`

export default function Rewriter({ settings, selectedModel, presets }) {
  const [text, setText] = useState('')
  const [preset, setPreset] = useState('formal')
  const [viewTab, setViewTab] = useState('rendered')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async (overridePreset, overrideText) => {
    const textToUse = overrideText !== undefined ? overrideText : text
    if (!textToUse.trim()) return

    const presetToUse = overridePreset || preset

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          preset: presetToUse,
          model_id: selectedModel,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt || null,
          auto_unload: settings.autoUnload,
        }),
      })
      const data = await res.json()
      if (data.status === 'success') setResult(data)
      else setError(data.error || 'Rewrite failed.')
    } catch {
      setError('Connection failed.')
    } finally {
      setLoading(false)
    }
  }

  const runPreset = (selectedPreset) => {
    setText(SAMPLE_DRAFT_TEXT)
    setPreset(selectedPreset)
    handleGenerate(selectedPreset, SAMPLE_DRAFT_TEXT)
  }

  const copyResult = () => {
    if (!result?.rewritten) return
    navigator.clipboard.writeText(result.rewritten)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadRewrite = () => {
    if (!result) return
    let content = `PRESET: ${result.preset}\n\nORIGINAL:\n${result.original}\n\nREWRITTEN:\n${result.rewritten}\n`
    if (result.changes?.length) {
      content += '\nCHANGES:\n' + result.changes.map(c => `- ${c}`).join('\n')
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rewritten_text.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const factCheck = result?.fact_check || {}

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">Fact-Lock Rewriter & Grammar Fixer</h2>
        <p className="text-xs text-[#888888] mt-1 font-mono">
          Contextual grammar correction and tone reformatting with zero-hallucination fact lock verification.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => runPreset('formal')} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-blue-400 flex items-center gap-1.5">
              <PenLine size={14} className="text-blue-400" /> Formal Executive Tone
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 01</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Reformat draft into professional business communication with fact locks.
          </p>
        </button>

        <button onClick={() => runPreset('concise')} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-emerald-400 flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-400" /> Ultra-Concise Edit
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 02</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Trim wordiness while preserving all technical numbers and SLA metrics.
          </p>
        </button>

        <button onClick={() => runPreset('technical')} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-purple-400 flex items-center gap-1.5">
              <FileCode size={14} className="text-purple-400" /> Technical Bug Report
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 03</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Structure draft into a clear engineering incidence report.
          </p>
        </button>
      </div>

      {/* Main Single Pane Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="vercel-card p-5">
            <div className="flex items-center justify-between mb-3 border-b border-[#1f1f1f] pb-3">
              <span className="text-xs font-mono text-[#888888]">DRAFT CANVAS</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setText(SAMPLE_DRAFT_TEXT)} className="btn-vercel-secondary text-xs !py-1">
                  <FileCode size={12} /> Load Draft
                </button>
                {text && (
                  <button onClick={() => setText('')} className="btn-vercel-secondary text-xs !py-1 text-rose-400">
                    <Trash size={12} /> Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste rough draft, email, or report text to fix..."
              rows={10}
              className="vercel-input font-sans text-xs leading-relaxed"
            />
          </div>

          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-md text-xs text-rose-400">{error}</div>}
        </div>

        <div className="lg:col-span-4">
          <div className="vercel-card p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-2">
              Style Preset
            </h3>

            <div>
              <label className="text-[0.7rem] font-mono text-[#888888] uppercase block mb-1">Preset Style</label>
              <select value={preset} onChange={e => setPreset(e.target.value)} className="vercel-select">
                {Object.entries(presets).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={loading || !text.trim()}
              className="btn-vercel-primary w-full py-2.5 text-xs"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Rewriting & Verifying...
                </>
              ) : (
                <>
                  Execute Rewrite <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Output */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="vercel-card p-6 space-y-4 border-white/20"
          >
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
              <span className="vercel-badge vercel-badge-neutral">REWRITE COMPARISON</span>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#000000] p-0.5 rounded border border-[#222222] text-xs">
                  <button
                    onClick={() => setViewTab('rendered')}
                    className={`px-2.5 py-1 rounded text-[0.7rem] font-medium ${
                      viewTab === 'rendered' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <Eye size={12} className="inline mr-1" /> Comparison
                  </button>
                  <button
                    onClick={() => setViewTab('json')}
                    className={`px-2.5 py-1 rounded text-[0.7rem] font-medium ${
                      viewTab === 'json' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <Code size={12} className="inline mr-1" /> JSON
                  </button>
                </div>

                <button onClick={copyResult} className="btn-vercel-secondary text-xs">
                  <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadRewrite} className="btn-vercel-secondary text-xs">
                  <Download size={12} /> TXT
                </button>
              </div>
            </div>

            {/* Fact Lock Banner */}
            <div className={`p-3 rounded flex items-center justify-between text-xs font-mono ${
              factCheck.passed
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}>
              <div className="flex items-center gap-2">
                {factCheck.passed ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                <span>{factCheck.passed ? 'Fact-Lock Check Passed (100% Facts Preserved)' : 'Fact-Lock Warning'}</span>
              </div>
              <span>Score: {factCheck.score || 100}%</span>
            </div>

            {viewTab === 'rendered' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[0.65rem] font-mono text-[#888888] block">ORIGINAL</span>
                    <div className="p-3 bg-[#000000] border border-[#1f1f1f] rounded text-xs leading-relaxed text-[#888888] whitespace-pre-wrap">
                      {result.original}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[0.65rem] font-mono text-emerald-400 block">REWRITTEN</span>
                    <div className="p-3 bg-[#000000] border border-emerald-500/30 rounded text-xs leading-relaxed text-white whitespace-pre-wrap">
                      {result.rewritten}
                    </div>
                  </div>
                </div>

                {result.diff?.length > 0 && (
                  <details className="bg-[#000000] border border-[#1f1f1f] rounded p-3">
                    <summary className="text-[0.7rem] font-mono text-[#888888] cursor-pointer flex items-center gap-1.5">
                      <FileDiff size={14} /> Line-by-Line Unified Diff
                    </summary>
                    <pre className="mt-3 p-3 font-mono text-[0.7rem] overflow-x-auto bg-[#000000]">
                      {result.diff.map((line, i) => (
                        <div key={i} className={
                          line.startsWith('+') ? 'text-emerald-400' :
                          line.startsWith('-') ? 'text-rose-400' :
                          'text-[#666666]'
                        }>
                          {line}
                        </div>
                      ))}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <pre className="vercel-code">{JSON.stringify(result, null, 2)}</pre>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#1f1f1f] text-[0.7rem] font-mono text-[#666666]">
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> Latency: {result.latency_seconds}s
              </span>
              <span>Model: {result.model_name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
