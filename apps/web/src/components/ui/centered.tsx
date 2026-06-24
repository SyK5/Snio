import type { ReactNode } from 'react'

export function Centered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">{children}</div>
}
