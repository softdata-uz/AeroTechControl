import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { RoleProvider } from "@/lib/role-context";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Учет досмотрового оборудования",
  description: "Система учета, контроля и технического обслуживания досмотрового оборудования",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Sets data-theme before first paint — avoids a flash of the wrong
            theme. Reads the same key ThemeProvider/useTheme write to. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <RoleProvider>
            <AppShell>{children}</AppShell>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
