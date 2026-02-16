'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { ActivityDrawer } from '@/components/ui/activity-drawer'
import { StatusStrip, type StatusKind } from '@/components/ui/status-strip'
import { isCurrentPath, productNavGroups, type ProductNavGroupKey } from '@/lib/app-navigation'

type AppShellNavItem = {
  href: string
  label: string
  icon?: React.ReactNode
  group?: ProductNavGroupKey
  description?: string
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

  const groupedNav = useMemo(() => {
    return productNavGroups.map((group) => ({
      ...group,
      items: nav.filter((item) => item.group === group.key),
    }))
  }, [nav])

  const activeItem = nav.find((item) => isCurrentPath(currentPath, item.href))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-0 hidden h-screen w-[292px] shrink-0 border-r border-sidebar-border/80 bg-sidebar/90 p-4 md:block">
          <Link href="/dashboard" className="mb-6 block rounded-2xl border border-border/70 bg-card p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">AI School</p>
            <p className="mt-1 font-display text-lg font-semibold text-foreground">Institute Console</p>
            <p className="mt-1 text-xs text-muted-foreground">Admissions to outcomes, in one academic workspace.</p>
          </Link>

          <div className="space-y-5">
            {groupedNav.map((group) =>
              group.items.length > 0 ? (
                <section key={group.key} aria-label={group.label}>
                  <h2 className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {group.label}
                  </h2>
                  <nav className="mt-2 space-y-1.5">
                    {group.items.map((item) => {
                      const active = isCurrentPath(currentPath, item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'block rounded-xl border px-3 py-2.5 transition-colors',
                            active
                              ? 'border-primary/35 bg-primary/10 text-foreground'
                              : 'border-transparent text-muted-foreground hover:border-border hover:bg-sidebar-muted/80 hover:text-foreground'
                          )}
                        >
                          <p className="text-sm font-semibold">{item.label}</p>
                          {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
                        </Link>
                      )
                    })}
                  </nav>
                </section>
              ) : null
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-border/70 glass">
            <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground md:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Institute Workspace</p>
                  <p className="truncate font-display text-lg font-semibold text-foreground">{activeItem?.label || 'Learning Surface'}</p>
                </div>
              </div>

              <Button variant="secondary" size="sm" onClick={() => setActivityOpen(true)}>
                View activity
              </Button>
            </div>
          </header>

          <main className="px-4 py-4 md:px-6 md:py-6">
            <StatusStrip status={status} onViewActivity={() => setActivityOpen(true)} />
            <div className="mt-4 animate-fade-in">{children}</div>
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/35"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm border-r border-sidebar-border bg-sidebar p-4">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-sidebar-foreground">Institute Console</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sidebar-border"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto pb-8">
              {groupedNav.map((group) =>
                group.items.length > 0 ? (
                  <section key={group.key} aria-label={group.label}>
                    <h2 className="px-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{group.label}</h2>
                    <nav className="mt-2 space-y-1.5">
                      {group.items.map((item) => {
                        const active = isCurrentPath(currentPath, item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              'block rounded-xl border px-3 py-2.5',
                              active
                                ? 'border-primary/35 bg-primary/10 text-foreground'
                                : 'border-transparent text-muted-foreground hover:border-border hover:bg-sidebar-muted/80'
                            )}
                          >
                            <p className="text-sm font-semibold">{item.label}</p>
                            {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
                          </Link>
                        )
                      })}
                    </nav>
                  </section>
                ) : null
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ActivityDrawer open={activityOpen} onOpenChange={setActivityOpen} />
    </div>
  )
}

export { AppShell }
export type { AppShellNavItem }
