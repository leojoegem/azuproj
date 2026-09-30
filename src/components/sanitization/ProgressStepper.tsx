import { Check } from 'lucide-react'
import { SANITIZATION_STEPS } from '@/types/asset'
import { cn } from '@/lib/utils'

export function ProgressStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="space-y-0">
      {SANITIZATION_STEPS.map((label, index) => {
        const step = index + 1
        const complete = currentStep > step || (currentStep === 6 && step === 6)
        const current = currentStep === step && currentStep < 6
        return (
          <li key={label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border text-xs font-semibold',
                  complete && 'border-success bg-success text-white',
                  current && 'border-accent bg-accent/10 text-accent',
                  !complete && !current && 'border-border text-muted-foreground',
                )}
              >
                {complete ? <Check className="size-3.5" /> : step}
              </span>
              {index < SANITIZATION_STEPS.length - 1 ? (
                <span className={cn('h-8 w-px', complete ? 'bg-success' : 'bg-border')} />
              ) : null}
            </div>
            <div className="pb-6 pt-1">
              <p className={cn('text-sm font-medium', current && 'text-accent')}>{label}</p>
              <p className="text-xs text-muted-foreground">
                {complete ? 'Complete' : current ? 'In progress' : 'Queued'}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
