import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CertificatePreview } from '@/components/sanitization/CertificatePreview'
import { SanitizationDetail } from '@/components/sanitization/SanitizationDetail'
import { StartSanitizationDialog } from '@/components/sanitization/StartSanitizationDialog'
import { AssetTable } from '@/components/shared/AssetTable'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ChartSkeleton, StatSkeleton, TableSkeleton } from '@/components/shared/LoadingState'
import { SearchBar } from '@/components/shared/SearchBar'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { usePageLoading } from '@/hooks/usePageLoading'
import { formatDateTime } from '@/lib/utils'
import { CircleAlert, Loader, ShieldCheck, Timer } from 'lucide-react'

export function Sanitization() {
  const { assets } = useApp()
  const loading = usePageLoading()
  const [params] = useSearchParams()
  const [query, setQuery] = useState('')
  const [startOpen, setStartOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [certId, setCertId] = useState<string | null>(null)
  const selected = assets.find((asset) => asset.id === selectedId) ?? null
  const certAsset = assets.find((asset) => asset.id === certId) ?? null
  const filter = params.get('filter')

  const rows = useMemo(() => {
    return assets.filter((asset) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        asset.id.toLowerCase().includes(q) ||
        asset.device.toLowerCase().includes(q) ||
        asset.serialNumber.toLowerCase().includes(q)
      const matchesFilter = !filter || asset.sanitizationStatus === filter || asset.verification === filter
      return matchesQuery && matchesFilter
    })
  }, [assets, filter, query])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <ChartSkeleton className="h-20" />
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">Data Sanitization</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Securely remove data and verify that devices are ready for their next lifecycle stage.
          </p>
        </div>
        <Button onClick={() => setStartOpen(true)}>
          <Plus /> Start Sanitization
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={24} icon={Timer} />
        <StatCard label="In Progress" value={7} tone="info" icon={Loader} />
        <StatCard label="Completed" value={1043} tone="success" icon={ShieldCheck} />
        <StatCard label="Failed Verification" value={12} tone="warning" icon={CircleAlert} />
      </section>

      <SearchBar value={query} onChange={setQuery} placeholder="Search sanitization queue..." />

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Sanitization Queue</h2>
        <AssetTable
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={(row) => setSelectedId(row.id)}
          columns={[
            { key: 'asset', header: 'Asset', className: 'whitespace-nowrap', render: (row) => <span className="font-mono text-[13px]">{row.id}</span> },
            { key: 'device', header: 'Device', render: (row) => row.device },
            { key: 'storage', header: 'Storage', render: (row) => row.storage },
            { key: 'method', header: 'Sanitization Method', render: (row) => row.sanitizationMethod ?? '—' },
            { key: 'operator', header: 'Operator', render: (row) => row.sanitizationOperator ?? '—' },
            { key: 'started', header: 'Started', render: (row) => (row.sanitizationStarted ? formatDateTime(row.sanitizationStarted) : '—') },
            {
              key: 'verification',
              header: 'Verification',
              render: (row) => <StatusBadge value={row.verification === 'Passed' ? 'Passed' : row.verification} />,
            },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.sanitizationStatus} /> },
          ]}
        />
      </section>

      <SanitizationDetail
        asset={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onViewCertificate={(asset) => setCertId(asset.id)}
      />
      <CertificatePreview asset={certAsset} open={!!certAsset} onOpenChange={(open) => !open && setCertId(null)} />
      <StartSanitizationDialog open={startOpen} onOpenChange={setStartOpen} />
    </div>
  )
}
