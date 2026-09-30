import { Bell, HelpCircle, Menu, Moon, Search, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useApp } from '@/context/AppContext'
import { CURRENT_USER } from '@/data/mockAssets'
import { relativeTime } from '@/lib/utils'

const crumbs: Record<string, string[]> = {
  '/dashboard': ['Operations', 'Overview'],
  '/assessments': ['Operations', 'Asset Assessment'],
  '/sanitization': ['Operations', 'Sanitization'],
  '/disposition': ['Operations', 'Disposition'],
  '/reports': ['Operations', 'Reports'],
  '/audit': ['Operations', 'Audit Log'],
}

const titles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/assessments': 'Asset Assessment',
  '/sanitization': 'Data Sanitization',
  '/disposition': 'Disposition',
  '/reports': 'Reports',
  '/audit': 'Audit Log',
}

export function TopNavigation({
  pathname,
  onOpenSidebar,
  onOpenHelp,
  onOpenSettings,
}: {
  pathname: string
  onOpenSidebar: () => void
  onOpenHelp: () => void
  onOpenSettings: () => void
}) {
  const { theme, toggleTheme, notifications, markNotificationsRead } = useApp()
  const navigate = useNavigate()
  const unread = notifications.filter((n) => !n.read).length
  const trail = crumbs[pathname] ?? ['Operations']

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-md lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="rounded-xl p-2 text-muted-foreground hover:bg-muted lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[12px] text-muted-foreground">{trail.join(' / ')}</p>
          <h1 className="truncate text-sm font-semibold lg:hidden">{titles[pathname]}</h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 w-56 pl-8"
            placeholder="Search assets..."
            aria-label="Search assets"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/assessments?q=${encodeURIComponent(e.currentTarget.value)}`)
              }
            }}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative rounded-xl p-2 text-muted-foreground hover:bg-muted"
              aria-label="Notifications"
              onClick={markNotificationsRead}
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.slice(0, 5).map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2.5">
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.body}</span>
                <span className="text-[11px] text-muted-foreground">{relativeTime(n.time)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
          aria-label="Help"
          onClick={onOpenHelp}
        >
          <HelpCircle className="size-4" />
        </button>
        <button
          type="button"
          className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <button type="button" onClick={onOpenSettings} className="ml-1 flex items-center gap-2 rounded-xl py-1 pl-1 pr-1 sm:pr-2">
          <Avatar name={CURRENT_USER.name} />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none">{CURRENT_USER.name}</p>
            <Badge className="mt-1 normal-case tracking-normal">{CURRENT_USER.role}</Badge>
          </div>
        </button>
      </div>
    </header>
  )
}
