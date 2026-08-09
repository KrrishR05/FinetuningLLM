import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, SlidersHorizontal, Download, LayoutTemplate, ShieldCheck, AlertTriangle, FileDiff, CheckCircle, SplitSquareVertical } from 'lucide-react'

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
    <div>
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl font-semibold text-white mb-2 flex items-center gap-2"
      >
        <PenLine size={24} className="text-white" /> Reformatting & Contextual Grammar Fixer
      </motion.h2>
      <p className="text-sm text-[#a1a1aa] mb-8">
        Paste text to fix grammar and reformat with fact-lock protection. All facts are verified after rewriting.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste the rough draft, report text, or email you want to fix..."
            rows={12}
            className="mb-4"
          />
          {text.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-6"
            >
              <span className="badge badge-neutral text-xs">
                <LayoutTemplate size={12} /> {text.split(/\s+/).length.toLocaleString()} Words
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
              <SlidersHorizontal size={14} /> Rewrite Settings
            </h3>
            <div className="mb-8">
              <label className="text-xs text-[#a1a1aa] block mb-2 font-medium">Style Preset</label>
              <select value={preset} onChange={e => setPreset(e.target.value)}>
                {Object.entries(presets).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <button className="btn-primary w-full" onClick={handleGenerate} disabled={loading || !text.trim()}>
              {loading ? <><div className="spinner" /> Rewriting...</> : <><PenLine size={16} /> Rewrite Text</>}
            </button>
          </div>
        </div>
      </div>

      {/* Output */}
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
              <SplitSquareVertical size={20} className="text-[#a1a1aa]" /> Original vs. Rewritten
            </h3>

            {/* Side by side comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <h4 className="text-[0.7rem] font-semibold text-[#71717a] uppercase tracking-widest mb-3 pl-1">Original Text</h4>
                <div className="p-5 rounded-xl text-sm leading-relaxed text-[#a1a1aa] whitespace-pre-wrap bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                  {result.original}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <h4 className="text-[0.7rem] font-semibold text-[#34d399] uppercase tracking-widest mb-3 pl-1">Rewritten Result</h4>
                <div className="p-5 rounded-xl text-sm leading-relaxed text-white whitespace-pre-wrap bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.2)] shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                  {result.rewritten}
                </div>
              </motion.div>
            </div>

            {/* Fact-Lock Report */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-xl mb-6 flex items-center gap-3"
              style={{
                background: factCheck.passed ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                border: `1px solid ${factCheck.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              {factCheck.passed ? (
                <ShieldCheck size={20} className="text-[#34d399]" />
              ) : (
                <AlertTriangle size={20} className="text-[#f87171]" />
              )}
              <span className={`text-sm font-medium ${factCheck.passed ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                {factCheck.passed
                  ? `Fact-Lock PASSED — All ${factCheck.total_facts || 0} facts preserved (score: ${factCheck.score})`
                  : `Fact-Lock WARNING — ${factCheck.missing_count || 0} of ${factCheck.total_facts || 0} facts may have changed (score: ${factCheck.score})`
                }
              </span>
            </motion.div>

            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <details className="mb-4 group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4">
                <summary className="text-sm text-[#f59e0b] cursor-pointer font-medium flex items-center gap-2">
                  <AlertTriangle size={16} /> Fact-Lock Warnings ({result.warnings.length})
                </summary>
                <div className="mt-4 space-y-2 pl-6">
                  {result.warnings.map((w, i) => (
                    <p key={i} className="text-sm text-[#a1a1aa] leading-relaxed">• {w}</p>
                  ))}
                </div>
              </details>
            )}

            {/* Changes */}
            {result.changes?.length > 0 && (
              <details className="mb-4 group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4">
                <summary className="text-sm text-[#60a5fa] cursor-pointer font-medium flex items-center gap-2">
                  <CheckCircle size={16} /> Changes Made ({result.changes.length})
                </summary>
                <div className="mt-4 space-y-2 pl-6">
                  {result.changes.map((c, i) => (
                    <p key={i} className="text-sm text-[#a1a1aa] leading-relaxed">• {c}</p>
                  ))}
                </div>
              </details>
            )}

            {/* Diff */}
            {result.diff?.length > 0 && (
              <details className="mb-8 group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4">
                <summary className="text-sm text-[#a1a1aa] cursor-pointer font-medium flex items-center gap-2">
                  <FileDiff size={16} /> Unified Diff
                </summary>
                <pre className="mt-4 text-xs font-mono p-5 rounded-lg overflow-x-auto bg-[#040405] border border-[rgba(255,255,255,0.05)]">
                  {result.diff.map((line, i) => (
                    <div key={i} className={
                      line.startsWith('+') ? 'text-[#34d399]' :
                      line.startsWith('-') ? 'text-[#f87171]' :
                      'text-[#71717a]'
                    }>{line}</div>
                  ))}
                </pre>
              </details>
            )}

            <div className="flex items-center justify-between bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)] p-4 rounded-xl">
              <button className="btn-secondary text-sm" onClick={downloadRewrite}>
                <Download size={16} /> Export Rewrite
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
