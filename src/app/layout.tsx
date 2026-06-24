import type { Metadata } from "next"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "CALCULADORA DE CARGA",
  description: "Planejamento inteligente de cargas para transportadoras",
  icons: {
    icon: [{ url: "/favicon.ico?v=2", sizes: "any" }],
    shortcut: "/favicon.ico?v=2",
    apple: "/cargo-logo-transparent.png",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" suppressHydrationWarning><body className="antialiased"><ThemeProvider><AppShell>{children}</AppShell><Toaster richColors position="top-right" /></ThemeProvider></body></html>
}
