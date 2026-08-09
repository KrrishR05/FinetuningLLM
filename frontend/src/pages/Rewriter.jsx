import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, Sliders, Download, ShieldCheck, AlertTriangle, FileDiff, Clock, ArrowRight, FileCode, Eye, Code, Copy, Trash } from 'lucide-react'

const SAMPLE_DRAFT_TEXT = `Hi team, we has tested the new API endpoint yesterday on server 4 and found 3 errors in response payload. Average response time was 850ms which is too high according to our 200ms SLA target. We need to fix this asap before release.`

export default function Rewriter({ settings, selectedModel, presets }) {
  const [text, setText] = useState('')
  const [preset, setPreset] = useState('formal')
  const [viewTab, setViewTab] = useState('rendered')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          preset,
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <PenLine size={20} className="text-blue-400" /> Reformatting & Fact-Lock Rewriter
        </h2>
        <p className="text-xs text-[var(--text-dim)] mt-0.5">
          Contextual grammar correction and tone reformatting with zero-hallucination fact lock verification.
        </p>
      </div>

      {/* Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <div className="wb-card p-5">
            <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-3">
              <span className="text-[0.68rem] font-bold text-slate-400 uppercase font-mono">DRAFT CANVAS</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setText(SAMPLE_DRAFT_TEXT)} className="btn-wb-secondary text-[0.7rem] !py-1 !px-2">
                  <FileCode size={12} /> Insert Sample Draft
                </button>
                {text && (
                  <button onClick={() => setText('')} className="btn-wb-secondary text-[0.7rem] !py-1 !px-2 text-rose-400">
                    <Trash size={12} /> Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste rough draft, email, or report text to fix and reformat..."
              rows={11}
              className="wb-canvas font-sans text-xs leading-relaxed"
            />
          </div>

          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">{error}</div>}
        </div>

        <div className="lg:col-span-4">
          <div className="wb-card p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Sliders size={15} className="text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Style Preset Controls</h3>
            </div>

            <div>
              <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Transformation Preset
              </label>
              <select value={preset} onChange={e => setPreset(e.target.value)} className="wb-select">
                {Object.entries(presets).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="btn-wb-primary w-full py-2.5 text-xs"
            >
              {loading ? (
                <>
                  <div className="studio-spinner" /> Rewriting & Verifying Facts...
                </>
              ) : (
                <>
                  <PenLine size={14} /> Execute Rewrite <ArrowRight size={13} />
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="wb-card p-6 space-y-4 border-blue-500/30"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-3">
                <span className="wb-badge wb-badge-blue text-[0.65rem]">REWRITE WORKBENCH</span>
                <h3 className="text-base font-bold text-white">Original vs. Rewritten Comparison</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-black/40 p-0.5 rounded border border-white/10 text-xs">
                  <button
                    onClick={() => setViewTab('rendered')}
                    className={`px-2.5 py-1 rounded text-[0.7rem] font-medium flex items-center gap-1 ${
                      viewTab === 'rendered' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye size={12} /> Side-by-Side
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
                <button onClick={downloadRewrite} className="btn-wb-secondary text-xs">
                  <Download size={13} /> TXT
                </button>
              </div>
            </div>

            {/* Fact-Lock Banner */}
            <div className={`p-3 rounded-lg flex items-center justify-between text-xs ${
              factCheck.passed
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}>
              <div className="flex items-center gap-2.5">
                {factCheck.passed ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                <div>
                  <span className="font-bold">
                    {factCheck.passed ? 'Fact-Lock Check Passed' : 'Fact-Lock Warning'}
                  </span>
                  <span className="opacity-80 ml-2">
                    ({factCheck.passed ? '100% facts preserved' : `${factCheck.missing_count || 0} facts altered`})
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10">
                Score: {factCheck.score || 100}%
              </span>
            </div>

            {viewTab === 'rendered' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[0.65rem] font-mono font-bold text-slate-400 uppercase tracking-wider block">Original Text</span>
                    <div className="p-3 bg-black/40 border border-white/5 rounded text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {result.original}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[0.65rem] font-mono font-bold text-emerald-400 uppercase tracking-wider block">Rewritten Version</span>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded text-xs leading-relaxed text-white whitespace-pre-wrap">
                      {result.rewritten}
                    </div>
                  </div>
                </div>

                {/* Diff */}
                {result.diff?.length > 0 && (
                  <details className="bg-black/50 border border-white/5 rounded p-3">
                    <summary className="text-[0.7rem] font-mono font-bold text-slate-400 uppercase tracking-wider cursor-pointer flex items-center gap-1.5">
                      <FileDiff size={14} /> Line-by-Line Unified Diff
                    </summary>
                    <pre className="mt-3 p-3 font-mono text-[0.7rem] overflow-x-auto bg-black rounded">
                      {result.diff.map((line, i) => (
                        <div key={i} className={
                          line.startsWith('+') ? 'text-emerald-400' :
                          line.startsWith('-') ? 'text-rose-400' :
                          'text-slate-500'
                        }>
                          {line}
                        </div>
                      ))}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <pre className="code-block">{JSON.stringify(result, null, 2)}</pre>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] text-[0.7rem] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-blue-400" /> Latency: {result.latency_seconds}s
              </span>
              <span>Model: {result.model_name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
