import './globals.css';
import { Toaster } from '../components/ui/toaster';
import { AuthProvider } from '../hooks/use-auth';
import { ThemeProvider } from '../components/theme-provider';
import { AppSettingsProvider } from '../hooks/use-app-settings';
import { AppMetadata } from './metadata';

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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <AppSettingsProvider>
                <AppMetadata />
                {children}
                <Toaster />
              </AppSettingsProvider>
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
