import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import ThemeInitializer from "./components/ThemeInitializer";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'EleveAdmin Dashboard',
  description: 'Admin dashboard for Eleve Egypt brand',
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
      <body className={`${inter.className} ${montserrat.variable} bg-background transition-colors duration-300`}>
        <Providers>
          <ThemeInitializer />
          <main className="lg:pl-64 min-h-screen transition-all duration-300 pb-20 lg:pb-0">
            <div className="p-4 md:p-8">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
