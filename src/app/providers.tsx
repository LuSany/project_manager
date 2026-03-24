'use client'

import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from '@/lib/queryClient'
import { AuthProvider } from '@/hooks/useAuth'
import { CommandPalette } from '@/components/ui/command-palette'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <CommandPalette />
      </AuthProvider>
    </QueryClientProvider>
  )
}
