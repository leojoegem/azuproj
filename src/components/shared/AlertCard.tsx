import { AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertCardProps {
  title: string
  count: number
  tone?: 'warning' | 'critical' | 'info'
  onClick?: () => void
}

export function AlertCard({ title, count, tone = 'warning', onClick }: AlertCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-foreground/15 hover:bg-muted/40"
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          tone === 'critical' && 'bg-destructive/10 text-destructive',
          tone === 'warning' && 'bg-warning/10 text-warning',
          tone === 'info' && 'bg-info/10 text-info',
        )}
      >
        <AlertTriangle className="size-4" />
      </span>
      <span className="flex-1 text-sm">
        <span className="font-semibold tabular-nums">{count}</span> {title}
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  )
}
