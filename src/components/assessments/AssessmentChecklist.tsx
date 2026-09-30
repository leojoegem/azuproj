import { PHYSICAL_CHECK_LABELS, PHYSICAL_GRADES, type PhysicalAssessment } from '@/types/asset'
import { cn } from '@/lib/utils'

interface AssessmentChecklistProps {
  value: PhysicalAssessment
  onChange?: (value: PhysicalAssessment) => void
  readOnly?: boolean
}

export function AssessmentChecklist({ value, onChange, readOnly }: AssessmentChecklistProps) {
  const keys = Object.keys(PHYSICAL_CHECK_LABELS) as (keyof PhysicalAssessment)[]

  return (
    <div className="space-y-2">
      {keys.map((key) => (
        <div key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm font-medium">{PHYSICAL_CHECK_LABELS[key]}</p>
          <div className="flex flex-wrap gap-1.5">
            {PHYSICAL_GRADES.map((grade) => {
              const active = value[key] === grade
              return (
                <button
                  key={grade}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onChange?.({ ...value, [key]: grade })}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-[12px] transition-colors',
                    active
                      ? grade === 'Good'
                        ? 'border-success/30 bg-success/10 text-success'
                        : grade === 'Fair'
                          ? 'border-warning/30 bg-warning/10 text-warning'
                          : 'border-destructive/30 bg-destructive/10 text-destructive'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {grade}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
