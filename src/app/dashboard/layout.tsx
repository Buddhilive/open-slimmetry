import { DashboardShell } from '@/components/DashboardShell'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Open Slimmetry',
  description: 'Self-hosted observability dashboard',
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
