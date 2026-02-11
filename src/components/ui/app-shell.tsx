'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { ActivityDrawer } from '@/components/ui/activity-drawer'
import { StatusStrip, type StatusKind } from '@/components/ui/status-strip'

type AppShellNavItem = {
  href: string
  label: string
  icon?: React.ReactNode
}

type AppShellProps = {
  nav: AppShellNavItem[]
  currentPath: string
  children: React.ReactNode
  status?: StatusKind
}

function AppShell({ nav, currentPath, children, status = 'ready' }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 border-r border-sidebar-border bg-sidebar px-4 py-5 md:block">
          <Link href="/" className="mb-6 block rounded-xl px-2 py-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">AI School</p>
            <p className="text-sm font-semibold text-sidebar-foreground">Learning Cockpit</p>
          </Link>

          <nav className="space-y-1">
            {nav.map((item) => {
              const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-sidebar-muted text-sidebar-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-muted/80 hover:text-sidebar-foreground'
                  )}
                >
                  {item.icon ? <span className="text-muted-foreground">{item.icon}</span> : null}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <p className="mt-8 px-2 text-xs text-muted-foreground">
            The interface stays quiet. The work happens in the background.
          </p>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur-md">
            <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">Product UI v0.2</p>
              </div>

              <Button variant="ghost" size="sm" onClick={() => setActivityOpen(true)}>
                View activity
              </Button>
            </div>
          </header>

          <main className="px-4 py-4 md:px-6 md:py-6">
            <StatusStrip status={status} onViewActivity={() => setActivityOpen(true)} />
            <div className="mt-4">{children}</div>
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute left-0 top-0 h-full w-[84%] max-w-xs border-r border-sidebar-border bg-sidebar p-4">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-semibold text-sidebar-foreground">AI School</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sidebar-border"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => {
                const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm',
                      active
                        ? 'bg-sidebar-muted text-sidebar-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-muted/80'
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      ) : null}

      <ActivityDrawer open={activityOpen} onOpenChange={setActivityOpen} />
    </div>
  )
}

export { AppShell }
export type { AppShellNavItem }

