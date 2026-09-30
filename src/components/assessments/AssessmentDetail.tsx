import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AssessmentChecklist } from '@/components/assessments/AssessmentChecklist'
import { ConditionScore } from '@/components/assessments/ConditionScore'
import { DiagnosticCheck } from '@/components/assessments/DiagnosticCheck'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useApp } from '@/context/AppContext'
import type { Asset, DiagnosticResult, PhysicalAssessment, PhysicalGrade, TechnicalAssessment } from '@/types/asset'

const gradeScore: Record<PhysicalGrade, number> = {
  Good: 90,
  Fair: 68,
  Damaged: 32,
  Missing: 8,
}

const diagScore: Record<DiagnosticResult, number> = {
  Passed: 94,
  Warning: 70,
  Failed: 28,
}

function computeScore(physical: PhysicalAssessment, technical: TechnicalAssessment) {
  const p = (Object.values(physical) as PhysicalGrade[]).reduce((sum, g) => sum + gradeScore[g], 0) / 9
  const t = (Object.values(technical) as DiagnosticResult[]).reduce((sum, g) => sum + diagScore[g], 0) / 11
  return Math.min(100, Math.round(p * 0.58 + t * 0.42))
}

export function AssessmentDetail({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { saveAssessment } = useApp()
  const [physical, setPhysical] = useState<PhysicalAssessment | null>(null)
  const [technical, setTechnical] = useState<TechnicalAssessment | null>(null)
  const [notes, setNotes] = useState('')
  const [noteError, setNoteError] = useState('')

  useEffect(() => {
    if (!asset) return
    setPhysical(asset.physicalChecks)
    setTechnical(asset.diagnosticChecks)
    setNotes(asset.notes)
    setNoteError('')
  }, [asset])

  const livePhysical = physical ?? asset?.physicalChecks
  const liveTechnical = technical ?? asset?.diagnosticChecks
  const score = useMemo(() => {
    if (!asset || !livePhysical || !liveTechnical) return asset?.conditionScore ?? 0
    const unchanged =
      JSON.stringify(livePhysical) === JSON.stringify(asset.physicalChecks) &&
      JSON.stringify(liveTechnical) === JSON.stringify(asset.diagnosticChecks)
    return unchanged ? asset.conditionScore || computeScore(livePhysical, liveTechnical) : computeScore(livePhysical, liveTechnical)
  }, [asset, livePhysical, liveTechnical])

  if (!asset || !livePhysical || !liveTechnical) return null

  const recommendation =
    score >= 88 ? 'Redeploy internally' : score >= 70 ? 'Refurbish & Resell' : score >= 50 ? 'Donate or refurbish' : 'Recycle or destroy'

  const path = score >= 88 ? 'Redeploy' : score >= 70 ? 'Resale' : score >= 50 ? 'Donate' : 'Recycle'

  const save = () => {
    if (notes.trim().length < 12) {
      setNoteError('Enter observations, damage details and recommendations before saving.')
      return
    }
    const failed = Object.values(liveTechnical).some((v) => v === 'Failed')
    saveAssessment(asset.id, {
      physicalChecks: livePhysical,
      diagnosticChecks: liveTechnical,
      notes,
      conditionScore: score,
      physicalCondition: score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 55 ? 'Fair' : score >= 35 ? 'Poor' : 'Scrap',
      technicalCondition: failed ? 'Failed' : Object.values(liveTechnical).some((v) => v === 'Warning') ? 'Warning' : 'Passed',
      recommendedAction: recommendation,
      recommendedPath: path,
      assessmentStatus: 'Completed',
    })
    toast.success('Assessment saved successfully.')
    onOpenChange(false)
  }

  const specs = [
    ['Manufacturer', asset.manufacturer],
    ['Model', asset.model],
    ['Serial number', asset.serialNumber],
    ['Asset tag', asset.assetTag],
    ['Processor', asset.processor],
    ['RAM', asset.ram],
    ['Storage', asset.storage],
    ['Operating system', asset.os],
    ['Purchase year', String(asset.purchaseYear)],
    ['Current location', asset.location],
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-3">
            <SheetTitle className="font-mono">{asset.id}</SheetTitle>
            <StatusBadge value={asset.assessmentStatus === 'Completed' ? 'Assessment Complete' : asset.assessmentStatus} />
          </div>
          <SheetDescription>{asset.device}</SheetDescription>
        </SheetHeader>

        <div className="space-y-8 px-6 py-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold">Device information</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              {specs.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border px-3 py-2.5">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold">Physical assessment — Exterior</h3>
            <AssessmentChecklist value={livePhysical} onChange={setPhysical} />
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold">Technical assessment</h3>
            <DiagnosticCheck value={liveTechnical} onChange={setTechnical} />
          </section>

          <ConditionScore score={score} recommendation={recommendation} />

          <section>
            <h3 className="mb-3 text-sm font-semibold">Assessor notes</h3>
            <Textarea
              value={notes}
              aria-invalid={!!noteError}
              aria-describedby={noteError ? 'notes-error' : undefined}
              onChange={(e) => {
                setNotes(e.target.value)
                if (noteError) setNoteError('')
              }}
              placeholder="Enter observations, damage details and recommendations..."
            />
            {noteError ? (
              <p id="notes-error" className="mt-2 text-xs text-destructive">
                {noteError}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <Button onClick={save}>Save Assessment</Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
