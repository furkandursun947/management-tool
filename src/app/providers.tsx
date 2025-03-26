// In /app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';
import { FirebaseProvider } from '@/contexts/firebase-context';
import { ProjectsProvider } from '@/contexts/projects-context';
import { RolesProvider } from '@/contexts/roles-context';
import { Toaster } from 'sonner';
import { ProgressProvider } from '@bprogress/next/app';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="3px"
      color="#0ea5e9"
      options={{ showSpinner: false }}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <FirebaseProvider>
          <ProjectsProvider>
            <RolesProvider>
              {children}
              <Toaster />
            </RolesProvider>
          </ProjectsProvider>
        </FirebaseProvider>
      </ThemeProvider>
    </ProgressProvider>
  );
}