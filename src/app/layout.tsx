import type { Metadata } from "next"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = { title: "CargoCalc | Inteligencia de cargas", description: "Planejamento inteligente de cargas para transportadoras" }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" suppressHydrationWarning><body className="antialiased"><ThemeProvider><AppShell>{children}</AppShell><Toaster richColors position="top-right" /></ThemeProvider></body></html>
}
