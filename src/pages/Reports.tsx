import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { formatKesCompact } from '@/lib/utils'

const reports = [
  {
    title: 'Asset Lifecycle Report',
    meta: '1,284 assets',
    detail: 'Intake through disposition volumes, cycle time and location breakdown.',
  },
  {
    title: 'Sanitization Compliance Report',
    meta: '1,043 verified',
    detail: 'Wipe methods, verification outcomes and certificate coverage.',
  },
  {
    title: 'Recovery Value Report',
    meta: 'KES 8.42M',
    detail: 'Estimated resale, refurbishment cost and net recovered value.',
  },
  {
    title: 'Disposition Summary',
    meta: '94 pending',
    detail: 'Approved paths, pending reviews and destruction exceptions.',
  },
]

export function Reports() {
  const { assets } = useApp()
  const verified = assets.filter((a) => a.verification === 'Passed').length
  const pending = assets.filter((a) => a.dispositionStatus === 'Queued' || a.dispositionStatus === 'Ready').length
  const recovered = assets.reduce((sum, a) => sum + Math.max(0, a.estimatedValue - a.refurbishmentCost), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate operational evidence for recovery, compliance and finance teams.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Assets in workspace" value={String(assets.length)} />
        <Metric label="Verified wipes" value={String(verified)} />
        <Metric label="Sample recovered value" value={formatKesCompact(recovered)} />
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {reports.map((report, i) => (
          <article key={report.title} className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold tracking-tight">{report.title}</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {i === 1 ? `${verified} verified` : i === 3 ? `${pending} pending` : report.meta}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{report.detail}</p>
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => toast.success('Report generated', { description: `${report.title} exported as PDF.` })}
            >
              Generate
            </Button>
          </article>
        ))}
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  )
}
