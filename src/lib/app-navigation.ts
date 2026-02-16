export type ProductNavGroupKey = 'onboarding' | 'learn-hub' | 'practice' | 'progress'

export type ProductNavGroup = {
  key: ProductNavGroupKey
  label: string
}

export type ProductNavItem = {
  href: string
  label: string
  group: ProductNavGroupKey
  description?: string
}

export const productNavGroups: ProductNavGroup[] = [
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'learn-hub', label: 'Learn Hub' },
  { key: 'practice', label: 'Practice' },
  { key: 'progress', label: 'Progress' },
]

export const productNav: ProductNavItem[] = [
  {
    href: '/admissions',
    label: 'Admissions',
    group: 'onboarding',
    description: 'Student intake and build launch',
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    group: 'learn-hub',
    description: 'Today plan and active workload',
  },
  {
    href: '/programs',
    label: 'Programs',
    group: 'learn-hub',
    description: 'Program management and progress',
  },
  {
    href: '/practice',
    label: 'Practice',
    group: 'practice',
    description: 'Workbook sets and submissions',
  },
  {
    href: '/review',
    label: 'Review',
    group: 'progress',
    description: 'Weak topics and spaced repetition',
  },
  {
    href: '/gradebook',
    label: 'Gradebook',
    group: 'progress',
    description: 'Transcript and historical attempts',
  },
]

export function isCurrentPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
