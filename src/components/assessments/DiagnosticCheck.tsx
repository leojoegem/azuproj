import { DIAGNOSTIC_CHECK_LABELS, type DiagnosticResult, type TechnicalAssessment } from '@/types/asset'
import { cn } from '@/lib/utils'

const results: DiagnosticResult[] = ['Passed', 'Warning', 'Failed']

interface DiagnosticCheckProps {
  value: TechnicalAssessment
  onChange?: (value: TechnicalAssessment) => void
  readOnly?: boolean
}

export function DiagnosticCheck({ value, onChange, readOnly }: DiagnosticCheckProps) {
  const keys = Object.keys(DIAGNOSTIC_CHECK_LABELS) as (keyof TechnicalAssessment)[]

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {keys.map((key) => (
        <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm font-medium">{DIAGNOSTIC_CHECK_LABELS[key]}</p>
          <div className="flex gap-1">
            {results.map((result) => {
              const active = value[key] === result
              return (
                <button
                  key={result}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onChange?.({ ...value, [key]: result })}
                  className={cn(
                    'rounded-lg border px-2 py-1 text-[11px] font-medium uppercase tracking-wide',
                    active
                      ? result === 'Passed'
                        ? 'border-success/30 bg-success/10 text-success'
                        : result === 'Warning'
                          ? 'border-warning/30 bg-warning/10 text-warning'
                          : 'border-destructive/30 bg-destructive/10 text-destructive'
                      : 'border-transparent text-muted-foreground hover:bg-muted',
                  )}
                >
                  {result}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
