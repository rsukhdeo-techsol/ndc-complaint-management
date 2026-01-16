'use client';

import { ThemeProvider } from "@/components/theme-provider";
import { StatusProvider } from "@/lib/contexts/StatusContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StatusProvider>
        {children}
      </StatusProvider>
    </ThemeProvider>
  );
}
