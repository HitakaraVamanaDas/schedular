import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { FontProvider } from '@/components/font-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { SearchProvider } from '@/hooks/use-search';

export const metadata: Metadata = {
  title: 'Schedule',
  description: 'A modern schedule app.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Lato:wght@400;700&family=Open+Sans:wght@400;700&family=Montserrat:wght@400;700&family=Merienda:wght@400;700&family=Bad+Script&family=Caveat:wght@400;700&family=Playfair+Display:wght@400;700&family=Lobster&family=Pacifico&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <SearchProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
              <FontProvider>
                <div className="relative flex flex-col min-h-screen">
                  {children}
                </div>
                <Toaster />
              </FontProvider>
            </ThemeProvider>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
