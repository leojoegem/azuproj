import type { LucideIcon } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { cn, formatNumber } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  tone?: 'default' | 'warning' | 'success' | 'info'
  icon: LucideIcon
  prefix?: string
  decimals?: number
}

const tones = {
  default: 'text-muted-foreground',
  warning: 'text-warning',
  success: 'text-success',
  info: 'text-info',
}

export function StatCard({ label, value, hint, tone = 'default', icon: Icon, prefix, decimals = 0 }: StatCardProps) {
  const numeric = typeof value === 'number'
  const counted = useCountUp(numeric ? value : 0)

  return (
    <article className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/15">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight">
            {prefix}
            {numeric ? formatNumber(Number(counted.toFixed(decimals))) : value}
          </p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-muted/60">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </div>
      {hint ? <p className={cn('mt-3 text-xs font-medium', tones[tone])}>{hint}</p> : null}
    </article>
  )
}
