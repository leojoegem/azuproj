import { Download, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { ProgressStepper } from '@/components/sanitization/ProgressStepper'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useApp } from '@/context/AppContext'
import { formatDateTime } from '@/lib/utils'
import type { Asset } from '@/types/asset'

export function SanitizationDetail({
  asset,
  open,
  onOpenChange,
  onViewCertificate,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewCertificate: (asset: Asset) => void
}) {
  const { completeSanitization, startSanitization } = useApp()

  if (!asset) return null

  const verified = asset.verification === 'Passed'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-3">
            <SheetTitle className="font-mono">{asset.id}</SheetTitle>
            <StatusBadge value={asset.sanitizationStatus} />
          </div>
          <SheetDescription>{asset.device} · {asset.storage}</SheetDescription>
        </SheetHeader>

        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[220px_1fr]">
          <ProgressStepper currentStep={Math.max(asset.sanitizationStep, 1)} />

          <div className="space-y-6">
            <section className="rounded-xl border border-border p-5">
              <h3 className="mb-4 text-sm font-semibold">Sanitization record</h3>
              <dl className="grid gap-3 text-sm">
                <Row label="Asset" value={asset.id} />
                <Row label="Drive" value={asset.storage} />
                <Row label="Method" value={asset.sanitizationMethod ?? 'Not assigned'} />
                <Row label="Operator" value={asset.sanitizationOperator ?? 'Unassigned'} />
                <Row label="Start time" value={asset.sanitizationStarted ? formatDateTime(asset.sanitizationStarted) : '—'} />
                <Row label="Completion" value={asset.sanitizationCompleted ? formatDateTime(asset.sanitizationCompleted) : '—'} />
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Verification</dt>
                  <dd>
                    <StatusBadge value={asset.verification === 'Passed' ? 'PASSED' : asset.verification} />
                  </dd>
                </div>
              </dl>
            </section>

            {verified ? (
              <section className="rounded-xl border border-success/20 bg-success/5 p-5">
                <h3 className="text-lg font-semibold">Sanitization Verified</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No recoverable user data detected during verification.
                </p>
                <dl className="mt-4 grid gap-2 text-sm">
                  <Row label="Verification status" value="PASSED" />
                  <Row
                    label="Verification timestamp"
                    value={asset.sanitizationCompleted ? formatDateTime(asset.sanitizationCompleted) : '—'}
                  />
                  <Row label="Operator" value={asset.sanitizationOperator ?? '—'} />
                  <Row label="Method" value={asset.sanitizationMethod ?? '—'} />
                  <Row label="Certificate ID" value={asset.certificateId ?? '—'} />
                </dl>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={() => onViewCertificate(asset)}>
                    <FileCheck /> View Certificate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toast.success('Certificate downloaded', { description: `${asset.certificateId}.pdf` })}
                  >
                    <Download /> Download Certificate
                  </Button>
                </div>
              </section>
            ) : (
              <section className="rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold">Operator actions</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Advance the wipe workflow or record verification for this device.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {asset.sanitizationStatus === 'Not Started' || asset.sanitizationStatus === 'Pending' ? (
                    <Button onClick={() => startSanitization(asset.id, asset.sanitizationMethod ?? 'NIST 800-88 Purge')}>
                      Start sanitization
                    </Button>
                  ) : null}
                  {asset.sanitizationStatus === 'In Progress' || asset.sanitizationStatus === 'Failed' ? (
                    <>
                      <Button
                        variant="success"
                        onClick={() => {
                          completeSanitization(asset.id, true)
                          toast.success('Sanitization verified.')
                        }}
                      >
                        Mark verified
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          completeSanitization(asset.id, false)
                          toast.error('Verification failed. Device returned to queue.')
                        }}
                      >
                        Fail verification
                      </Button>
                    </>
                  ) : null}
                </div>
              </section>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
