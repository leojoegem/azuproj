import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/context/AppContext'
import type { SanitizationMethod } from '@/types/asset'

const methods: SanitizationMethod[] = [
  'Secure Erase',
  'Cryptographic Erase',
  'NIST 800-88 Clear',
  'NIST 800-88 Purge',
  'Physical Destruction',
]

export function StartSanitizationDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { assets, startSanitization } = useApp()
  const candidates = assets.filter(
    (a) => a.assessmentStatus === 'Completed' && (a.sanitizationStatus === 'Not Started' || a.sanitizationStatus === 'Pending' || a.sanitizationStatus === 'Failed'),
  )
  const [assetId, setAssetId] = useState('')
  const [method, setMethod] = useState<SanitizationMethod>('NIST 800-88 Purge')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!assetId) {
      setError('Select an asset')
      return
    }
    startSanitization(assetId, method)
    toast.success('Sanitization started', { description: `${assetId} · ${method}` })
    onOpenChange(false)
    setAssetId('')
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Sanitization</DialogTitle>
          <DialogDescription>Assign a wipe method and begin processing a queued device.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Asset</Label>
            <Select value={assetId} onValueChange={(v) => { setAssetId(v); setError('') }}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.id} — {asset.device}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label>Sanitization method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as SanitizationMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Start Sanitization</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
