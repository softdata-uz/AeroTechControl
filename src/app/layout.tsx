import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RoleProvider } from "@/lib/role-context";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme-context";
import { LocaleProvider, LOCALE_INIT_SCRIPT } from "@/lib/locale-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Учет досмотрового оборудования",
  description: "Система учета, контроля и технического обслуживания досмотрового оборудования",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Sets data-theme before first paint — avoids a flash of the wrong
            theme. Reads the same key ThemeProvider/useTheme write to. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Sets html lang before first paint to match the stored locale. */}
        <script dangerouslySetInnerHTML={{ __html: LOCALE_INIT_SCRIPT }} />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <LocaleProvider>
            <RoleProvider>{children}</RoleProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
