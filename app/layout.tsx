import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/toast-provider'
import { GlobalWidgets } from '@/components/global-widgets'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Black Social Network — Buy. Hold. Earn SOL',
  description:
    'Black Social Network — Buy. Hold. Earn SOL. Join our community of token holders. Share, connect, and earn SOL rewards automatically every 10 seconds just by holding our token.',

  metadataBase: new URL('https://blacksocialnetwork.fun'),

  icons: {
    icon: 'https://i.ibb.co/4gfpFXS6/bx.png',
    shortcut: 'https://i.ibb.co/4gfpFXS6/bx.png',
    apple: 'https://i.ibb.co/4gfpFXS6/bx.png',
  },

  openGraph: {
    title: 'Black Social Network — Buy. Hold. Earn SOL',
    description:
      'Join our community. Share, connect, and earn SOL rewards automatically every 10 seconds.',
    url: 'https://blacksocialnetwork.fun',
    siteName: 'Black Social Network',
    images: [
      {
        url: 'https://i.ibb.co/4gfpFXS6/bx.png',
        width: 1200,
        height: 630,
        alt: 'Black Social Network Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Black Social Network — Buy. Hold. Earn SOL',
    description:
      'Share, connect, and earn SOL rewards automatically every 10 seconds just by holding our token.',
    images: ['https://i.ibb.co/4gfpFXS6/bx.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <GlobalWidgets>{children}</GlobalWidgets>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}
