import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, Sliders, Download, ShieldCheck, AlertTriangle, FileDiff, Clock, ArrowRight } from 'lucide-react'

export default function Rewriter({ settings, selectedModel, presets }) {
  const [text, setText] = useState('')
  const [preset, setPreset] = useState('formal')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

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
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
          <PenLine size={24} className="text-cyan-400" /> Reformatting & Fact-Lock Rewriter
        </h2>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Contextual grammar correction and tone rewriting guaranteed by zero-hallucination fact verification.
        </p>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="studio-card p-6">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste raw draft, email, report, or text to fix and reformat..."
              rows={12}
              className="studio-canvas"
            />
          </div>

          {error && <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">{error}</div>}
        </div>

        <div className="lg:col-span-4">
          <div className="studio-card p-6 studio-card-glow space-y-6">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
              <Sliders size={16} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Style Controls</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Transformation Preset
              </label>
              <select
                value={preset}
                onChange={e => setPreset(e.target.value)}
                className="studio-select"
              >
                {Object.entries(presets).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="btn-studio-primary w-full py-3 text-sm"
            >
              {loading ? (
                <>
                  <div className="studio-spinner" /> Rewriting & Fact-Locking...
                </>
              ) : (
                <>
                  <PenLine size={16} /> Execute Rewrite <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Studio Diff Output */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="studio-card p-8 space-y-6 border-cyan-500/30"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <h3 className="text-xl font-bold text-white">Original vs. Rewritten Diff Workbench</h3>
              <button onClick={downloadRewrite} className="btn-studio-secondary text-xs">
                <Download size={14} /> Export Result
              </button>
            </div>

            {/* Fact-Lock Score Banner */}
            <div className={`p-4 rounded-xl flex items-center justify-between ${
              factCheck.passed
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}>
              <div className="flex items-center gap-3">
                {factCheck.passed ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
                <div>
                  <h4 className="text-sm font-bold">
                    {factCheck.passed ? 'Fact-Lock Verification Passed' : 'Fact-Lock Warning'}
                  </h4>
                  <p className="text-xs opacity-80">
                    {factCheck.passed
                      ? `All ${factCheck.total_facts || 0} facts fully preserved without hallucination.`
                      : `${factCheck.missing_count || 0} of ${factCheck.total_facts || 0} facts may have changed.`}
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm font-bold bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                Score: {factCheck.score || 100}%
              </span>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest block">Original Text</span>
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {result.original}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[0.65rem] font-bold text-emerald-400 uppercase tracking-widest block">Rewritten Version</span>
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-sm leading-relaxed text-white whitespace-pre-wrap">
                  {result.rewritten}
                </div>
              </div>
            </div>

            {/* Unified Diff */}
            {result.diff?.length > 0 && (
              <details className="bg-black/50 border border-white/5 rounded-xl p-4">
                <summary className="text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer flex items-center gap-2">
                  <FileDiff size={16} /> View Unified Line Diff
                </summary>
                <pre className="mt-4 p-4 font-mono text-xs overflow-x-auto bg-black rounded-lg">
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

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-cyan-400" /> Latency: {result.latency_seconds}s
              </span>
              <span>Model: {result.model_name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
