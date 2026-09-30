import { useMemo, useState } from 'react'
import { SearchBar } from '@/components/shared/SearchBar'
import { Timeline } from '@/components/shared/Timeline'
import { EmptyState } from '@/components/shared/EmptyState'
import { useApp } from '@/context/AppContext'

export function Audit() {
  const { auditLog } = useApp()
  const [query, setQuery] = useState('')

  const events = useMemo(() => {
    const q = query.toLowerCase()
    return auditLog.filter(
      (event) =>
        !q ||
        event.assetId.toLowerCase().includes(q) ||
        event.actor.toLowerCase().includes(q) ||
        event.action.toLowerCase().includes(q),
    )
  }, [auditLog, query])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable activity trail for assessment, sanitization and disposition decisions.
        </p>
      </div>
      <SearchBar value={query} onChange={setQuery} placeholder="Search actor, asset or action..." />
      {events.length === 0 ? (
        <EmptyState title="No audit events" description="Try a different search term." />
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <Timeline events={events} />
        </div>
      )}
    </div>
  )
}
