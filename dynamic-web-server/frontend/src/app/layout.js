import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/lib/providers";

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "My App",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "A Next.js App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppProvider>  {/* Wrap children with the provider */}
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}