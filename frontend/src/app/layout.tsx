import type { Metadata } from "next"
import { Fraunces, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { ModeToggle } from "@/components/mode-toggle"
import { Separator } from "@/components/ui/separator"
import { AuthPanel } from "@/components/auth-panel"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
})

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Stash Dashboard",
  description: "Autonomous AI Agent Dashboard",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <SidebarProvider>
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4 bg-background/70 backdrop-blur-lg">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Stash</span>
                    <span className="text-sm font-semibold text-foreground font-display">Autonomous Vault</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AuthPanel />
                  <ModeToggle />
                </div>
              </header>
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </div>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
