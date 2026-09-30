import { cn } from '@/lib/utils'

export function ConditionScore({ score, recommendation }: { score: number; recommendation: string }) {
  const label = score >= 90 ? 'EXCELLENT' : score >= 75 ? 'GOOD' : score >= 55 ? 'FAIR' : score >= 35 ? 'POOR' : 'SCRAP'
  const tone =
    score >= 75 ? 'bg-success' : score >= 55 ? 'bg-warning' : 'bg-destructive'

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <p className="text-[13px] font-medium text-muted-foreground">Overall Condition</p>
      <div className="mt-2 flex items-end gap-3">
        <p className="text-[40px] font-semibold leading-none tracking-tight">{score}</p>
        <p className="mb-1 text-lg text-muted-foreground">/ 100</p>
      </div>
      <p className="mt-2 text-sm font-semibold tracking-wide">{label}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all duration-500', tone)} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Recommended action: <span className="font-medium text-foreground">{recommendation}</span>
      </p>
    </section>
  )
}
