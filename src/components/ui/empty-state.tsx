import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/cn'

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

function EmptyState({ icon, title, description, ctaLabel, ctaHref, className }: EmptyStateProps) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center', className)}>
      {icon ? (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">{description}</p>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className={cn(buttonVariants({ variant: 'primary' }), 'mt-4')}>
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  )
}

export { EmptyState }
