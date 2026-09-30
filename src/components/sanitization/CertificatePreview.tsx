import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import type { Asset } from '@/types/asset'

function QrPlaceholder() {
  return (
    <svg viewBox="0 0 80 80" className="size-20 text-foreground" aria-hidden>
      <rect width="80" height="80" fill="currentColor" opacity="0.06" />
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((__, col) => {
          const on = (row * 7 + col * 3) % 4 !== 0
          return on ? <rect key={`${row}-${col}`} x={col * 10 + 4} y={row * 10 + 4} width="7" height="7" fill="currentColor" /> : null
        }),
      )}
    </svg>
  )
}

export function CertificatePreview({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!asset) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Data Sanitization Certificate</DialogTitle>
          <DialogDescription>Official sanitization evidence for {asset.id}</DialogDescription>
        </DialogHeader>
        <div className="border border-border px-8 py-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            RE:SET Asset Recovery
          </p>
          <h2 className="mt-3 text-center text-2xl font-semibold tracking-tight">
            DATA SANITIZATION CERTIFICATE
          </h2>
          <p className="mt-2 text-center font-mono text-sm text-muted-foreground">
            {asset.certificateId ?? `SAN-2026-${asset.id.replace('AST-', '')}`}
          </p>

          <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <Field label="Asset" value={asset.id} />
            <Field label="Serial" value={asset.serialNumber} />
            <Field label="Device" value={asset.device} />
            <Field label="Method" value={asset.sanitizationMethod ?? '—'} />
            <Field label="Result" value="VERIFIED" />
            <Field
              label="Date"
              value={asset.sanitizationCompleted ? formatDate(asset.sanitizationCompleted) : '24 September 2026'}
            />
          </div>

          <div className="mt-8 flex items-end justify-between gap-6 border-t border-border pt-6">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Authorized by</p>
              <p className="mt-1 text-sm font-medium">RE:SET Asset Recovery</p>
              <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">Verification ID</p>
              <p className="mt-1 font-mono text-xs">{asset.certificateId ?? 'SAN-PENDING'}-VX</p>
            </div>
            <div className="text-center">
              <QrPlaceholder />
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Scan to verify</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
