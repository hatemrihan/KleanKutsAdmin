import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import ThemeInitializer from "./components/ThemeInitializer";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'KA Admin Dashboard',
  description: 'Admin dashboard for KA brand',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background transition-colors duration-300`}>
        <Providers>
          <ThemeInitializer />
          <main className="lg:pl-64 min-h-screen transition-all duration-300">
            <div className="p-4 md:p-8">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
