import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function ChartCard({ title, action, children, className }: ChartCardProps) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
