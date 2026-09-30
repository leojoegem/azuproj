import { Badge } from '@/components/ui/badge'
import type { ComponentProps } from 'react'

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>['variant']>

const map: Record<string, BadgeVariant> = {
  Completed: 'success',
  Complete: 'success',
  Verified: 'success',
  Passed: 'success',
  Approved: 'success',
  Ready: 'success',
  Excellent: 'success',
  Good: 'accent',
  Resale: 'accent',
  Redeploy: 'info',
  Refurbish: 'info',
  Donate: 'info',
  Processing: 'info',
  'In Progress': 'info',
  Fair: 'warning',
  Warning: 'warning',
  Pending: 'warning',
  Queued: 'warning',
  'Requires attention': 'warning',
  'Review Requested': 'warning',
  Failed: 'destructive',
  Rejected: 'destructive',
  Poor: 'destructive',
  Scrap: 'destructive',
  Recycle: 'warning',
  Destroy: 'destructive',
  Damaged: 'destructive',
  Missing: 'destructive',
  'Not Started': 'default',
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge variant={map[value] ?? 'default'}>{value}</Badge>
}
