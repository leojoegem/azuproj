import {
  ClipboardCheck,
  Eraser,
  HelpCircle,
  LayoutGrid,
  Route,
  ScrollText,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { CURRENT_USER } from '@/data/mockAssets'
import { cn } from '@/lib/utils'

const primary = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { to: '/assessments', label: 'Assessments', icon: ClipboardCheck },
  { to: '/sanitization', label: 'Sanitization', icon: Eraser },
  { to: '/disposition', label: 'Disposition', icon: Route },
  { to: '/reports', label: 'Reports', icon: ShieldCheck },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
]

interface SidebarProps {
  onNavigate?: () => void
  onOpenSettings: () => void
  onOpenHelp: () => void
}

export function Sidebar({ onNavigate, onOpenSettings, onOpenHelp }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-6">
        <div className="flex items-baseline gap-0.5">
          <span className="text-lg font-semibold tracking-tight">RE</span>
          <span className="text-lg font-semibold text-accent">:</span>
          <span className="text-lg font-semibold tracking-tight">SET</span>
        </div>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-sidebar-muted">
          Asset Recovery Platform
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Primary">
        {primary.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('h-4 w-0.5 rounded-full', isActive ? 'bg-accent' : 'bg-transparent')} />
                <item.icon className="size-4" />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 px-3 pb-4">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Settings className="size-4" />
          Settings
        </button>
        <button
          type="button"
          onClick={onOpenHelp}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <HelpCircle className="size-4" />
          Help & Support
        </button>
        <Separator className="my-3 bg-sidebar-border" />
        <div className="flex items-center gap-3 px-2 py-1">
          <Avatar name={CURRENT_USER.name} className="bg-white text-black" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{CURRENT_USER.name}</p>
            <p className="truncate text-xs text-sidebar-muted">{CURRENT_USER.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
