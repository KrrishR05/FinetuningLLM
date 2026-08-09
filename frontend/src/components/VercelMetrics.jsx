import { Activity, Cpu, LockKeyhole, Sparkles } from 'lucide-react'

export default function VercelMetrics({ health, selectedModel }) {
  const isOnline = health?.status === 'online' || health?.status === 'CHALU HAI'
  const metrics = [
    {
      label: 'Privacy boundary',
      value: 'Air-gapped',
      detail: 'No cloud relay',
      icon: LockKeyhole,
      tone: 'mint',
    },
    {
      label: 'Local engine',
      value: health?.runtime || 'Ollama',
      detail: selectedModel || 'Model discovery',
      icon: Sparkles,
      tone: 'violet',
    },
    {
      label: 'Compute profile',
      value: 'RTX accelerated',
      detail: 'On-demand memory',
      icon: Cpu,
      tone: 'blue',
    },
    {
      label: 'Runtime health',
      value: isOnline ? 'Ready to run' : 'Checking connection',
      detail: isOnline ? 'Local API reachable' : 'Private workspace intact',
      icon: Activity,
      tone: isOnline ? 'mint' : 'amber',
      live: true,
    },
  ]

  return (
    <section className="system-pulse" aria-label="System pulse">
      <div className="system-pulse__intro">
        <span><i /> System pulse</span>
        <p>Your workspace, at a glance.</p>
      </div>
      <div className="system-pulse__items">
        {metrics.map(metric => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className={`system-pulse__item system-pulse__item--${metric.tone}`}>
              <div className="system-pulse__icon"><Icon size={15} /></div>
              <div className="system-pulse__copy">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.live && <i />} {metric.detail}</small>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
