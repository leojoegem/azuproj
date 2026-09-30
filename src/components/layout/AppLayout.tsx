import { ClipboardCheck, Eraser, LayoutGrid, Route } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

const mobileNav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { to: '/assessments', label: 'Assess', icon: ClipboardCheck },
  { to: '/sanitization', label: 'Sanitize', icon: Eraser },
  { to: '/disposition', label: 'Dispose', icon: Route },
]

export function AppLayout() {
  const location = useLocation()
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useApp()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-background">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-svh">
          <Sidebar onOpenSettings={() => setSettingsOpen(true)} onOpenHelp={() => setHelpOpen(true)} />
        </div>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <Sidebar
            onNavigate={() => setSidebarOpen(false)}
            onOpenSettings={() => {
              setSidebarOpen(false)
              setSettingsOpen(true)
            }}
            onOpenHelp={() => {
              setSidebarOpen(false)
              setHelpOpen(true)
            }}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <TopNavigation
          pathname={location.pathname}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <main className="page-enter flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 backdrop-blur lg:hidden" aria-label="Mobile">
        {mobileNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px]',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Workspace preferences for the recovery platform.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <Label htmlFor="dark-mode">Dark mode</Label>
              <p className="text-xs text-muted-foreground">Use the infrastructure theme.</p>
            </div>
            <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>
              For sanitization exceptions or chain-of-custody issues, contact the operations desk.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Operations: ops@reset.recovery</p>
            <p>Compliance: certificates@reset.recovery</p>
            <p>Hours: 07:00–19:00 EAT, Monday–Saturday</p>
          </div>
          <Button variant="outline" onClick={() => setHelpOpen(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
