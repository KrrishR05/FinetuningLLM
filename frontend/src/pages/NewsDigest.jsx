import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, FileText, Table, Download, Clock, ArrowRight, FileCode, Eye, Code, Copy, Trash, Zap, CheckCircle2, MessageSquare } from 'lucide-react'

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

  const handleGenerate = async (overrideTopic, overrideText) => {
    const textToUse = overrideText !== undefined ? overrideText : text
    const topicToUse = overrideTopic !== undefined ? overrideTopic : topic
    if (!textToUse.trim()) return

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/news-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          topic: topicToUse,
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

  const runPreset = (sampleText, topicFilter) => {
    setTopic(topicFilter)
    if (text.trim()) {
      handleGenerate(topicFilter, text)
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold gradient-heading tracking-tight">News Digest & Fact/Opinion Matrix</h2>
        <p className="text-xs text-[#888888] mt-1 font-mono">
          Dissect media streams, press releases, and editorials into empirical facts versus subjective opinions.
        </p>
      </div>

      {/* Vercel Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => runPreset(SAMPLE_NEWS_TEXT, 'Space & ISRO')} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-emerald-400 flex items-center gap-1.5">
              <Newspaper size={14} className="text-emerald-400" /> Space News Dissection
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 01</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Separate PSLV orbital injection facts from analyst commentary.
          </p>
        </button>

        <button onClick={() => runPreset(SAMPLE_NEWS_TEXT, '')} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-blue-400 flex items-center gap-1.5">
              <Zap size={14} className="text-blue-400" /> Editorial Bias Detector
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 02</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Filter out opinionated language and highlight verifiable statements.
          </p>
        </button>

        <button onClick={() => runPreset(SAMPLE_NEWS_TEXT, 'Tech Policy')} className="vercel-preset-card group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-white group-hover:text-amber-400 flex items-center gap-1.5">
              <FileText size={14} className="text-amber-400" /> Executive Digest
            </span>
            <span className="text-[0.65rem] font-mono text-[#666666]">PRESET 03</span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            Synthesize key press updates into a unified 1-paragraph summary.
          </p>
        </button>
      </div>

      {/* Main Single Pane Playground */}
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
                  <FileText size={12} className="inline mr-1.5" /> News Text
                </button>
                <button
                  onClick={() => setInputMode('csv')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    inputMode === 'csv' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <Table size={12} className="inline mr-1.5" /> CSV Importer
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setText(SAMPLE_NEWS_TEXT)} className="btn-vercel-secondary text-xs !py-1">
                  <FileCode size={12} /> Load News Feed
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
              placeholder={inputMode === 'csv'
                ? 'source,date,type,headline,body\nReuters,2026-08-09,news,ISRO launches PSLV,Payload deployed...'
                : 'Paste news headlines, editorials, or press releases...'}
              rows={10}
              className="vercel-input font-sans text-xs leading-relaxed"
            />
          </div>

          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-md text-xs text-rose-400">{error}</div>}
        </div>

        <div className="lg:col-span-4">
          <div className="vercel-card p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-[#1f1f1f] pb-2">
              Topic Filter
            </h3>

            <div>
              <label className="text-[0.7rem] font-mono text-[#888888] uppercase block mb-1">Topic Keyword (Optional)</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Space, Defense, AI"
                className="vercel-field text-xs"
              />
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={loading || !text.trim()}
              className="btn-vercel-primary w-full py-2.5 text-xs"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Dissecting News...
                </>
              ) : (
                <>
                  Generate Digest <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dual Column Claim Matrix Output Inspector */}
      <AnimatePresence>
        {result?.digest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="vercel-card p-6 space-y-5 border-white/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f1f] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="vercel-badge vercel-badge-emerald font-mono">MATRIX ANALYZED</span>
                  <span className="text-xs font-mono text-[#666666]">• Topic: {result.digest.topic || 'General'}</span>
                </div>
                <h3 className="text-base font-semibold text-white font-mono">Fact vs. Opinion Dissection Report</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#000000] p-0.5 rounded border border-[#222222] text-xs">
                  <button
                    onClick={() => setViewTab('rendered')}
                    className={`px-3 py-1 rounded text-[0.725rem] font-medium transition-colors ${
                      viewTab === 'rendered' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <Eye size={12} className="inline mr-1" /> Dual Matrix
                  </button>
                  <button
                    onClick={() => setViewTab('json')}
                    className={`px-3 py-1 rounded text-[0.725rem] font-medium transition-colors ${
                      viewTab === 'json' ? 'bg-white text-black' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <Code size={12} className="inline mr-1" /> JSON
                  </button>
                </div>

                <button onClick={copyResult} className="btn-vercel-secondary text-xs">
                  <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadDigest} className="btn-vercel-secondary text-xs">
                  <Download size={12} /> TXT
                </button>
              </div>
            </div>

            {viewTab === 'rendered' ? (
              <div className="space-y-5">
                {/* Dual Matrix Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Verified Facts Column */}
                  <div className="p-4 bg-[#000000] border border-[#1f1f1f] rounded-md space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> VERIFIED FACTS ({result.digest.facts?.length || 0})
                      </span>
                      <span className="text-[0.65rem] font-mono text-[#666666]">EMPIRICAL</span>
                    </div>

                    <div className="space-y-2">
                      {result.digest.facts?.map((fact, idx) => (
                        <div key={idx} className="p-2.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded text-xs text-[#dddddd] leading-relaxed">
                          {fact}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Editorial Opinions Column */}
                  <div className="p-4 bg-[#000000] border border-[#1f1f1f] rounded-md space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-2">
                      <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <MessageSquare size={14} /> EDITORIAL OPINIONS ({result.digest.opinions?.length || 0})
                      </span>
                      <span className="text-[0.65rem] font-mono text-[#666666]">COMMENTARY</span>
                    </div>

                    <div className="space-y-2">
                      {result.digest.opinions?.map((opinion, idx) => (
                        <div key={idx} className="p-2.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded text-xs text-[#dddddd] leading-relaxed">
                          {opinion}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Synthesis Block */}
                {result.digest.summary && (
                  <div className="p-4 bg-[#000000] border-l-4 border-white rounded-r-md">
                    <span className="text-[0.65rem] font-mono font-bold text-[#888888] uppercase block mb-1">
                      Synthesis Summary
                    </span>
                    <p className="text-xs text-[#cccccc] leading-relaxed">{result.digest.summary}</p>
                  </div>
                )}
              </div>
            ) : (
              <pre className="vercel-code">{JSON.stringify(result, null, 2)}</pre>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#1f1f1f] text-[0.7rem] font-mono text-[#666666]">
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> Execution Latency: {result.latency_seconds}s
              </span>
              <span>Model: {result.model_name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
