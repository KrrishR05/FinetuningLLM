import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, FileText, Table, Sliders, Download, CheckCircle2, MessageSquare, Clock, ArrowRight, FileCode, Eye, Code, Copy, Trash } from 'lucide-react'

const SAMPLE_NEWS_TEXT = `NEW DELHI — India's Space Research Organisation (ISRO) successfully launched the PSLV-C60 mission today from Sriharikota, deploying two climate monitoring satellites into a 520km polar sun-synchronous orbit. Mission telemetry confirmed orbital injection at 09:14 AM IST. 

"This launch represents a pivotal leap in space-based atmospheric monitoring for the South Asian region," stated ISRO Chairman S. Somanath during the press conference.

However, industry analyst Rajiv Mehta argued that heavy relying on public space agencies might slow down private space tech commercialization, calling the government payload prioritization "outdated and bureaucratic".`

export default function NewsDigest({ settings, selectedModel }) {
  const [inputMode, setInputMode] = useState('text')
  const [text, setText] = useState('')
  const [topic, setTopic] = useState('')
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

  const copyResult = () => {
    if (!result?.digest) return
    const d = result.digest
    const textToCopy = `TOPIC: ${d.topic}\n\nVERIFIED FACTS:\n` + (d.facts || []).map(f => `- ${f}`).join('\n') + '\n\nEDITORIAL OPINIONS:\n' + (d.opinions || []).map(o => `- ${o}`).join('\n')
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Newspaper size={20} className="text-blue-400" /> News Digest & Fact/Opinion Matrix
        </h2>
        <p className="text-xs text-[var(--text-dim)] mt-0.5">
          Dissect media feeds into verified empirical facts versus subjective commentary.
        </p>
      </div>

      {/* Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <div className="wb-card p-5">
            <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    inputMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText size={13} /> Raw News Feed
                </button>
                <button
                  onClick={() => setInputMode('csv')}
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    inputMode === 'csv' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table size={13} /> Paste CSV
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setText(SAMPLE_NEWS_TEXT)} className="btn-wb-secondary text-[0.7rem] !py-1 !px-2">
                  <FileCode size={12} /> Insert Sample Feed
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
              placeholder={inputMode === 'csv'
                ? 'source,date,type,headline,body\nReuters,2026-08-09,news,ISRO launches PSLV,Payload deployed...'
                : 'Paste news headlines, editorials, or media summaries here...'}
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
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Digest Settings</h3>
            </div>

            <div>
              <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Topic Filter (Optional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Space, Defense, AI"
                className="wb-input text-xs"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="btn-wb-primary w-full py-2.5 text-xs"
            >
              {loading ? (
                <>
                  <div className="studio-spinner" /> Dissecting Facts & Opinions...
                </>
              ) : (
                <>
                  <Newspaper size={14} /> Generate Digest <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Output */}
      <AnimatePresence>
        {result?.digest && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="wb-card p-6 space-y-4 border-blue-500/30"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-3">
                <span className="wb-badge wb-badge-blue text-[0.65rem]">NEWS MATRIX</span>
                <h3 className="text-base font-bold text-white">{result.digest.topic || 'General Overview'}</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-black/40 p-0.5 rounded border border-white/10 text-xs">
                  <button
                    onClick={() => setViewTab('rendered')}
                    className={`px-2.5 py-1 rounded text-[0.7rem] font-medium flex items-center gap-1 ${
                      viewTab === 'rendered' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye size={12} /> Claim Matrix
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
                <button onClick={downloadDigest} className="btn-wb-secondary text-xs">
                  <Download size={13} /> TXT
                </button>
              </div>
            </div>

            {viewTab === 'rendered' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Facts */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="wb-badge wb-badge-emerald text-[0.65rem]">FACTS ({result.digest.facts?.length || 0})</span>
                    </div>
                    {result.digest.facts?.map((fact, idx) => (
                      <div key={idx} className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded text-xs text-slate-200">
                        {fact}
                      </div>
                    ))}
                  </div>

                  {/* Opinions */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="wb-badge wb-badge-rose text-[0.65rem]">EDITORIAL OPINIONS ({result.digest.opinions?.length || 0})</span>
                    </div>
                    {result.digest.opinions?.map((opinion, idx) => (
                      <div key={idx} className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded text-xs text-slate-200">
                        {opinion}
                      </div>
                    ))}
                  </div>
                </div>

                {result.digest.summary && (
                  <div className="p-3 bg-zinc-900 border-l-2 border-blue-500 rounded text-xs text-slate-200">
                    <span className="text-[0.65rem] font-mono font-bold text-blue-400 block mb-0.5">SYNTHESIS</span>
                    {result.digest.summary}
                  </div>
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
