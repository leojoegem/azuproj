import type { AuditEvent } from '@/types/asset'

export function Timeline({ events }: { events: AuditEvent[] }) {
  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const time = new Date(event.timestamp).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        })
        return (
          <li key={event.id} className="grid grid-cols-[52px_1fr] gap-3">
            <span className="pt-0.5 text-xs font-medium tabular-nums text-muted-foreground">{time}</span>
            <div className="border-l border-border pl-4">
              <p className="text-sm">
                <span className="font-medium">{event.actor}</span>{' '}
                <span className="text-muted-foreground">{event.action}</span>
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{event.assetId}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
