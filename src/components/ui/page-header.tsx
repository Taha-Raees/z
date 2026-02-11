import { cn } from '@/lib/cn'

type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export { PageHeader }

