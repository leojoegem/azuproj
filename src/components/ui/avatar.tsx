import { cn } from '@/lib/utils'

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn(
        'flex size-8 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background',
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}
