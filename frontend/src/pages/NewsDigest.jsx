import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, FileText, Table, Sliders, Download, CheckCircle2, MessageSquare, Clock, ArrowRight } from 'lucide-react'

export default function NewsDigest({ settings, selectedModel }) {
  const [inputMode, setInputMode] = useState('text')
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
      else setError(data.error || 'Digest failed.')
    } catch {
      setError('Connection failed.')
    } finally {
      setLoading(false)
    }
  }

  const downloadDigest = () => {
    if (!result?.digest) return
    const d = result.digest
    let content = `TOPIC: ${d.topic}\n\nVERIFIED FACTS:\n`
    content += (d.facts || []).map(f => `- ${f}`).join('\n')
    content += '\n\nEDITORIAL OPINIONS:\n'
    content += (d.opinions || []).map(o => `- ${o}`).join('\n')
    content += `\n\nSUMMARY: ${d.summary || ''}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'news_digest.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
          <Newspaper size={24} className="text-emerald-400" /> News Digest & Fact/Opinion Separator
        </h2>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Dissect media streams, press releases, and editorial articles into verified factual claims vs. subjective opinions.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="studio-card p-6">
            <div className="flex gap-2 mb-4 bg-black/40 p-1 rounded-xl w-fit border border-[var(--border-subtle)]">
              <button
                onClick={() => setInputMode('text')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                  inputMode === 'text' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText size={14} /> Raw Headlines / Articles
              </button>
              <button
                onClick={() => setInputMode('csv')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                  inputMode === 'csv' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table size={14} /> Paste CSV Format
              </button>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={inputMode === 'csv'
                ? 'source,date,type,headline,body\nReuters,2026-08-09,news,ISRO launches new rocket,Payload deployed...'
                : 'Paste news headlines, editorials, or media summaries here...'}
              rows={12}
              className="studio-canvas"
            />
          </div>

          {error && <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">{error}</div>}
        </div>

        <div className="lg:col-span-4">
          <div className="studio-card p-6 studio-card-glow space-y-6">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
              <Sliders size={16} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Digest Settings</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Topic Filter Keyword (Optional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Defense, Space, AI, Economy"
                className="studio-input"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="btn-studio-primary w-full py-3 text-sm !from-emerald-600 !to-teal-600 shadow-emerald-500/25"
            >
              {loading ? (
                <>
                  <div className="studio-spinner" /> Dissecting Facts & Opinions...
                </>
              ) : (
                <>
                  <Newspaper size={16} /> Generate Digest <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result?.digest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="studio-card p-8 space-y-8 border-emerald-500/30"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="text-[0.65rem] font-bold text-emerald-400 uppercase tracking-widest block">Topic Analysis</span>
                <h3 className="text-xl font-bold text-white">{result.digest.topic || 'General Intelligence'}</h3>
              </div>
              <button onClick={downloadDigest} className="btn-studio-secondary text-xs">
                <Download size={14} /> Export Digest
              </button>
            </div>

            {/* Split Fact vs. Opinion Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Facts */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={16} /> Verified Factual Claims ({result.digest.facts?.length || 0})
                </h4>
                <div className="space-y-2">
                  {result.digest.facts?.map((fact, idx) => (
                    <div key={idx} className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-sm text-slate-200">
                      {fact}
                    </div>
                  ))}
                </div>
              </div>

              {/* Opinions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={16} /> Editorial Opinions ({result.digest.opinions?.length || 0})
                </h4>
                <div className="space-y-2">
                  {result.digest.opinions?.map((opinion, idx) => (
                    <div key={idx} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-slate-200">
                      {opinion}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Synthesis */}
            {result.digest.summary && (
              <div className="p-5 bg-slate-900/80 border-l-4 border-emerald-500 rounded-r-xl text-sm text-slate-200">
                <span className="text-[0.65rem] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Synthesis</span>
                {result.digest.summary}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-emerald-400" /> Latency: {result.latency_seconds}s
              </span>
              <span>Model: {result.model_name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
