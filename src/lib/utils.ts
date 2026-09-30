import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKes(value: number) {
  return `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(value)}`
}

export function formatKesCompact(value: number) {
  if (value >= 1_000_000) {
    return `KES ${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `KES ${(value / 1_000).toFixed(1)}K`
  }
  return formatKes(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function relativeTime(iso: string) {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDate(iso)
}

export function nextAssetId(existing: string[]) {
  const nums = existing.map((id) => Number(id.replace('AST-', ''))).filter((n) => !Number.isNaN(n))
  const next = (Math.max(0, ...nums) + 1).toString().padStart(6, '0')
  return `AST-${next}`
}
