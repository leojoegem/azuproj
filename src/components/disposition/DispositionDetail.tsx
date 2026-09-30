import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useApp } from '@/context/AppContext'
import { formatKes } from '@/lib/utils'
import type { Asset, DispositionPath } from '@/types/asset'

const reasons: Record<DispositionPath, string[]> = {
  Redeploy: ['Functional hardware', 'Excellent or good condition', 'Sanitization verified', 'Internal demand exists', 'No critical diagnostic failures'],
  Refurbish: ['Repairable cosmetic wear', 'Core hardware functional', 'Sanitization verified or queued', 'Refurbishment cost is economical', 'Residual value after service'],
  Resale: ['Functional hardware', 'Good physical condition', 'Sanitization verified', 'Battery health acceptable', 'No critical diagnostic failures'],
  Donate: ['Functional for education or NGO use', 'Sanitization verified', 'Residual resale value limited', 'Meets donation eligibility', 'No data-retention risk'],
  Recycle: ['Uneconomical to repair', 'Limited residual value', 'Parts recovery preferred', 'Storage can be wiped or destroyed', 'Compliant material recovery path'],
  Destroy: ['Unsuitable for reuse', 'Storage cannot be verified', 'Security or policy requirement', 'Physical damage beyond service', 'Chain-of-custody destruction required'],
}

export function DispositionDetail({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { approveDisposition, requestReview, rejectDisposition } = useApp()
  const [confirmDestroy, setConfirmDestroy] = useState(false)

  if (!asset) return null

  const path = asset.disposition ?? asset.recommendedPath
  const recovery = Math.max(0, asset.estimatedValue - asset.refurbishmentCost)

  const approve = () => {
    if (path === 'Destroy') {
      setConfirmDestroy(true)
      return
    }
    approveDisposition(asset.id, path)
    toast.success('Disposition approved', { description: `${asset.id} · ${path}` })
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <div className="flex flex-wrap items-center gap-3">
              <SheetTitle className="font-mono">{asset.id}</SheetTitle>
              <StatusBadge value={asset.dispositionStatus} />
            </div>
            <SheetDescription>{asset.device}</SheetDescription>
          </SheetHeader>

          <div className="space-y-8 px-6 py-6">
            <section className="rounded-xl border border-border p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Asset Recovery Recommendation
              </p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight">{path.toUpperCase()}</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric label="Estimated value" value={formatKes(asset.estimatedValue)} />
                <Metric label="Potential refurbishment cost" value={formatKes(asset.refurbishmentCost)} />
                <Metric label="Expected recovery" value={formatKes(recovery)} />
              </div>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {reasons[path].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-4 text-sm font-semibold">Approval workflow</h3>
              <ol className="space-y-0 text-sm">
                {['Assessment', 'Sanitization', 'Disposition Review', 'Approval', 'Final Processing'].map((step, i) => {
                  const done =
                    (i === 0 && asset.assessmentStatus === 'Completed') ||
                    (i === 1 && asset.verification === 'Passed') ||
                    (i === 2 && asset.approval !== 'Pending') ||
                    (i === 3 && asset.approval === 'Approved') ||
                    (i === 4 && asset.dispositionStatus === 'Completed')
                  return (
                    <li key={step} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`size-2.5 rounded-full ${done ? 'bg-success' : 'bg-border'}`} />
                        {i < 4 ? <span className="h-6 w-px bg-border" /> : null}
                      </div>
                      <p className={done ? 'font-medium' : 'text-muted-foreground'}>{step}</p>
                    </li>
                  )
                })}
              </ol>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={approve}>Approve Disposition</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    requestReview(asset.id)
                    toast.message('Review requested', { description: `${asset.id} sent to a second reviewer.` })
                  }}
                >
                  Request Review
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    rejectDisposition(asset.id)
                    toast.error('Disposition rejected')
                    onOpenChange(false)
                  }}
                >
                  Reject
                </Button>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={confirmDestroy}
        onOpenChange={setConfirmDestroy}
        title="Confirm destruction"
        description="Are you sure you want to mark this device for destruction? This path is irreversible once processing begins."
        confirmLabel="Mark for destruction"
        destructive
        onConfirm={() => {
          approveDisposition(asset.id, 'Destroy')
          toast.success('Destruction path approved')
          onOpenChange(false)
        }}
      />
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}
