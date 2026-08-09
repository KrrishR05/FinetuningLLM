import { motion } from 'framer-motion'
import { ArrowUpRight, Cpu, LockKeyhole, Sparkles } from 'lucide-react'
import heroArt from '../assets/hero.png'

const WORKFLOW_COPY = {
  summarizer: {
    label: 'Knowledge distillation',
    description: 'Turn dense source material into clear, decision-ready intelligence without moving a byte beyond your device.',
  },
  science: {
    label: 'Research intelligence',
    description: 'Translate technical research into concise, source-aware briefs for teams that need the signal first.',
  },
  news: {
    label: 'Claim intelligence',
    description: 'Separate evidence from interpretation and turn noisy updates into a defensible view of the facts.',
  },
  rewriter: {
    label: 'Precision writing',
    description: 'Refine important drafts while keeping the facts, figures, and technical meaning locked in place.',
  },
}

export default function DashboardHero({ activeTab, selectedModel, health }) {
  const workflow = WORKFLOW_COPY[activeTab] || WORKFLOW_COPY.summarizer
  const isOnline = health?.status === 'online' || health?.status === 'CHALU HAI'

  return (
    <section className="command-hero">
      <div className="command-hero__glow command-hero__glow--one" />
      <div className="command-hero__glow command-hero__glow--two" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="command-hero__copy"
      >
        <div className="command-hero__eyebrow">
          <span className="command-hero__eyebrow-dot" />
          Private intelligence workspace
        </div>

        <div>
          <p className="command-hero__kicker">{workflow.label}</p>
          <h1>
            Bring clarity to <span>every signal.</span>
          </h1>
          <p className="command-hero__description">{workflow.description}</p>
        </div>

        <div className="command-hero__meta" aria-label="Workspace security and model status">
          <span><LockKeyhole size={14} /> On-device by design</span>
          <span><Cpu size={14} /> {selectedModel || 'Discovering local model'}</span>
          <span className={isOnline ? 'is-ready' : 'is-checking'}>
            <i /> {isOnline ? 'Runtime ready' : 'Runtime checking'}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, x: 12 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="command-hero__visual"
        aria-hidden="true"
      >
        <div className="command-hero__orbit command-hero__orbit--outer" />
        <div className="command-hero__orbit command-hero__orbit--inner" />
        <div className="command-hero__signal command-hero__signal--one"><Sparkles size={13} /></div>
        <div className="command-hero__signal command-hero__signal--two"><ArrowUpRight size={13} /></div>
        <img className="command-hero__art" src={heroArt} alt="" />
        <div className="command-hero__visual-label">
          <span>LOCAL CORE</span>
          <strong>01</strong>
        </div>
      </motion.div>
    </section>
  )
}
