import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, ClipboardPaste, Table, SlidersHorizontal, Download, LayoutList, CheckCircle2, MessageSquare, List } from 'lucide-react'

export default function NewsDigest({ settings, selectedModel }) {
  const [inputMode, setInputMode] = useState('paste')
  const [text, setText] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/news-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          topic,
          model_id: selectedModel,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt || null,
          auto_unload: settings.autoUnload,
          csv_mode: inputMode === 'csv',
        }),
      })
      const data = await res.json()
      if (data.status === 'success') setResult(data)
      else setError(data.error || 'Digest generation failed.')
    } catch {
      setError('Connection failed.')
    } finally {
      setLoading(false)
    }
  }

  const downloadDigest = () => {
    if (!result?.digest) return
    const d = result.digest
    let content = `Topic: ${d.topic}\n\nFacts:\n`
    content += (d.facts || []).map(f => `- ${f}`).join('\n')
    content += '\n\nOpinions:\n'
    content += (d.opinions || []).map(o => `- ${o}`).join('\n')
    content += `\n\nSummary: ${d.summary || ''}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'news_digest.txt'
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
        <Newspaper size={24} className="text-white" /> News Digest & Fact/Opinion Separator
      </motion.h2>
      <p className="text-sm text-[#a1a1aa] mb-8">
        Upload news headlines or editorials to get a topic-wise overview with strict fact vs. opinion separation.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
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
                inputMode === 'csv' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
              }`}
              onClick={() => setInputMode('csv')}
            >
              <Table size={16} /> Paste CSV
            </button>
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={inputMode === 'csv'
              ? 'source,date,type,headline,body\nTimes of India,2024-01-15,news,ISRO Launches PSLV,Details here...'
              : 'Paste news headlines, articles, or editorials here...'}
            rows={12}
            className="mb-4"
          />

          {text.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-6 flex-wrap"
            >
              <span className="badge badge-neutral text-xs">
                <LayoutList size={12} /> {text.split(/\s+/).length.toLocaleString()} Words
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
              <SlidersHorizontal size={14} /> Digest Settings
            </h3>
            <div className="mb-8">
              <label className="text-xs text-[#a1a1aa] block mb-2 font-medium">Topic Filter (optional)</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Space, Defence, AI"
                className="input-field text-sm"
              />
            </div>
            <button className="btn-primary w-full" onClick={handleGenerate} disabled={loading || !text.trim()}>
              {loading ? <><div className="spinner" /> Analyzing...</> : <><Newspaper size={16} /> Generate Digest</>}
            </button>
          </div>
        </div>
      </div>

      {/* Output */}
      <AnimatePresence>
        {result?.digest && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 mb-20"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)] pb-4">
              <List size={20} className="text-[#a1a1aa]" /> Intelligence Digest
            </h3>

            {/* Topic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-xl mb-8 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]"
            >
              <span className="text-[0.65rem] uppercase tracking-widest text-[#71717a] font-semibold block mb-2">Topic</span>
              <div className="text-2xl font-semibold text-white">{result.digest.topic || 'General Overview'}</div>
            </motion.div>

            {/* Facts */}
            {result.digest.facts?.length > 0 && (
              <>
                <h4 className="text-[0.7rem] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#34d399]" /> Verified Facts
                </h4>
                <div className="space-y-3 mb-8">
                  {result.digest.facts.map((fact, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bullet-card !items-center"
                    >
                      <span className="text-[0.65rem] font-bold text-[#34d399] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] px-2 py-0.5 rounded uppercase tracking-wider shrink-0">FACT</span>
                      <span className="text-sm text-[#d4d4d8] leading-relaxed">{fact}</span>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Opinions */}
            {result.digest.opinions?.length > 0 && (
              <>
                <h4 className="text-[0.7rem] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#f59e0b]" /> Editorial Opinions
                </h4>
                <div className="space-y-3 mb-8">
                  {result.digest.opinions.map((op, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="bullet-card !items-center"
                    >
                      <span className="text-[0.65rem] font-bold text-[#f59e0b] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] px-2 py-0.5 rounded uppercase tracking-wider shrink-0">OPINION</span>
                      <span className="text-sm text-[#d4d4d8] leading-relaxed">{op}</span>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Summary */}
            {result.digest.summary && (
              <>
                <h4 className="text-[0.7rem] font-semibold text-[#71717a] uppercase tracking-widest mb-3 pl-1">
                  Overall Synthesis
                </h4>
                <div className="summary-box mb-8">{result.digest.summary}</div>
              </>
            )}

            <div className="flex items-center justify-between bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)] p-4 rounded-xl">
              <button className="btn-secondary text-sm" onClick={downloadDigest}>
                <Download size={16} /> Export Digest
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
