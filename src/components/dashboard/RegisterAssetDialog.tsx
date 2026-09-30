import { useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/context/AppContext'
import { locations } from '@/data/mockAssets'
import type { Manufacturer } from '@/types/asset'

const manufacturers: Manufacturer[] = ['Dell', 'Lenovo', 'HP', 'Apple', 'ASUS']

interface RegisterAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegisterAssetDialog({ open, onOpenChange }: RegisterAssetDialogProps) {
  const { registerAsset } = useApp()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    manufacturer: '' as Manufacturer | '',
    model: '',
    serialNumber: '',
    location: '',
    processor: '',
    ram: '',
    storage: '',
  })

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!form.manufacturer) next.manufacturer = 'Select a manufacturer'
    if (!form.model.trim()) next.model = 'Model is required'
    if (form.serialNumber.trim().length < 6) next.serialNumber = 'Enter a valid serial number'
    if (!form.location) next.location = 'Select a location'
    if (!form.storage.trim()) next.storage = 'Storage is required'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    const device = `${form.manufacturer} ${form.model}`
    const asset = registerAsset({
      device,
      manufacturer: form.manufacturer as Manufacturer,
      model: form.model,
      serialNumber: form.serialNumber.toUpperCase(),
      location: form.location,
      storage: form.storage,
      processor: form.processor || 'Not specified',
      ram: form.ram || 'Not specified',
    })
    toast.success('Asset registered', { description: `${asset.id} is now in the intake queue.` })
    onOpenChange(false)
    setForm({
      manufacturer: '',
      model: '',
      serialNumber: '',
      location: '',
      processor: '',
      ram: '',
      storage: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register Asset</DialogTitle>
          <DialogDescription>Add an incoming laptop to the recovery intake queue.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field error={errors.manufacturer}>
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Select value={form.manufacturer} onValueChange={(v) => update('manufacturer', v)}>
              <SelectTrigger id="manufacturer">
                <SelectValue placeholder="Select manufacturer" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field error={errors.model}>
            <Label htmlFor="model">Model</Label>
            <Input id="model" value={form.model} onChange={(e) => update('model', e.target.value)} placeholder="Latitude 5420" />
          </Field>
          <Field error={errors.serialNumber}>
            <Label htmlFor="serial">Serial number</Label>
            <Input
              id="serial"
              value={form.serialNumber}
              onChange={(e) => update('serialNumber', e.target.value)}
              placeholder="DL5420X8291"
            />
          </Field>
          <Field error={errors.location}>
            <Label htmlFor="location">Location</Label>
            <Select value={form.location} onValueChange={(v) => update('location', v)}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <Label htmlFor="processor">Processor</Label>
              <Input id="processor" value={form.processor} onChange={(e) => update('processor', e.target.value)} placeholder="i7-1185G7" />
            </Field>
            <Field>
              <Label htmlFor="ram">RAM</Label>
              <Input id="ram" value={form.ram} onChange={(e) => update('ram', e.target.value)} placeholder="16 GB" />
            </Field>
            <Field error={errors.storage}>
              <Label htmlFor="storage">Storage</Label>
              <Input id="storage" value={form.storage} onChange={(e) => update('storage', e.target.value)} placeholder="512 GB NVMe" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Register Asset</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ children, error }: { children: ReactNode; error?: string }) {
  return (
    <div className="grid gap-1.5">
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
