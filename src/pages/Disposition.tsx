import { Gift, Recycle, RefreshCw, Shield, Tag, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DispositionDetail } from '@/components/disposition/DispositionDetail'
import { AssetTable } from '@/components/shared/AssetTable'
import { TableSkeleton } from '@/components/shared/LoadingState'
import { SearchBar } from '@/components/shared/SearchBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Timeline } from '@/components/shared/Timeline'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { usePageLoading } from '@/hooks/usePageLoading'
import { formatKes } from '@/lib/utils'
import type { DispositionPath } from '@/types/asset'
import { cn } from '@/lib/utils'

const paths: { id: DispositionPath; title: string; copy: string; icon: typeof RefreshCw; danger?: boolean }[] = [
  { id: 'Redeploy', title: 'REDEPLOY', copy: 'Return device to internal use.', icon: RefreshCw },
  { id: 'Refurbish', title: 'REFURBISH', copy: 'Repair, upgrade and prepare for reuse.', icon: Wrench },
  { id: 'Resale', title: 'RESALE', copy: 'Prepare asset for secondary-market sale.', icon: Tag },
  { id: 'Donate', title: 'DONATE', copy: 'Transfer device to an approved recipient.', icon: Gift },
  { id: 'Recycle', title: 'RECYCLE', copy: 'Send device for responsible material recovery.', icon: Recycle },
  { id: 'Destroy', title: 'DESTROY', copy: 'For devices unsuitable for reuse.', icon: Shield, danger: true },
]

export function Disposition() {
  const { assets, auditLog } = useApp()
  const loading = usePageLoading()
  const [query, setQuery] = useState('')
  const [pathFilter, setPathFilter] = useState<DispositionPath | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = assets.find((asset) => asset.id === selectedId) ?? null

  const rows = useMemo(() => {
    return assets.filter((asset) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        asset.id.toLowerCase().includes(q) ||
        asset.device.toLowerCase().includes(q)
      const path = asset.disposition ?? asset.recommendedPath
      const matchesPath = pathFilter === 'all' || path === pathFilter
      return matchesQuery && matchesPath
    })
  }, [assets, pathFilter, query])

  if (loading) {
    return <TableSkeleton cols={8} rows={8} />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">Disposition</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Determine the next lifecycle stage for every recovered asset.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {paths.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPathFilter((prev) => (prev === item.id ? 'all' : item.id))}
            className={cn(
              'rounded-xl border bg-card p-5 text-left transition-colors',
              pathFilter === item.id ? 'border-foreground/30' : 'border-border hover:border-foreground/15',
              item.danger && pathFilter === item.id && 'border-destructive/40',
            )}
          >
            <item.icon className={cn('size-5', item.danger ? 'text-destructive' : 'text-muted-foreground')} />
            <h3 className={cn('mt-4 text-sm font-semibold tracking-wide', item.danger && 'text-destructive')}>
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.copy}</p>
          </button>
        ))}
      </section>

      <SearchBar value={query} onChange={setQuery} placeholder="Search disposition queue..." />

      <AssetTable
        rows={rows}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelectedId(row.id)}
        columns={[
          { key: 'id', header: 'Asset ID', className: 'whitespace-nowrap', render: (row) => <span className="font-mono text-[13px]">{row.id}</span> },
          { key: 'device', header: 'Device', render: (row) => row.device },
          { key: 'condition', header: 'Condition', render: (row) => <StatusBadge value={row.physicalCondition} /> },
          {
            key: 'sanitization',
            header: 'Sanitization',
            render: (row) => <StatusBadge value={row.verification === 'Passed' ? 'Verified' : row.verification} />,
          },
          { key: 'value', header: 'Estimated Value', render: (row) => formatKes(row.estimatedValue) },
          { key: 'path', header: 'Recommended Path', render: (row) => <StatusBadge value={row.recommendedPath} /> },
          { key: 'approval', header: 'Approval', render: (row) => <StatusBadge value={row.approval} /> },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.dispositionStatus} /> },
          {
            key: 'action',
            header: 'Action',
            render: (row) => (
              <button type="button" className="text-sm font-medium underline-offset-2 hover:underline" onClick={() => setSelectedId(row.id)}>
                Review
              </button>
            ),
          },
        ]}
      />

      <section id="reports">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Reports</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ReportCard title="Asset Lifecycle Report" meta="1,284 assets" />
          <ReportCard title="Sanitization Compliance Report" meta="1,043 verified" />
          <ReportCard title="Recovery Value Report" meta="KES 8.42M" />
          <ReportCard title="Disposition Summary" meta="94 pending" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Audit Log</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <Timeline events={auditLog.slice(0, 6)} />
        </div>
      </section>

      <DispositionDetail asset={selected} open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  )
}

function ReportCard({ title, meta }: { title: string; meta: string }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
      <Button
        className="mt-4"
        variant="outline"
        size="sm"
        onClick={() => toast.success('Report generated', { description: `${title} is ready to download.` })}
      >
        Generate
      </Button>
    </article>
  )
}
