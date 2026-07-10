import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/toast-provider'
import { GlobalWidgets } from '@/components/global-widgets'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'RobinBook — The Social Network for Robinhood Traders',
  description:
    'RobinBook — The social network for the Robinhood ecosystem. Create communities, chat live, and connect with traders who trade what you trade.',

  metadataBase: new URL('https://robinbook.fun'),

  icons: {
    icon: 'https://i.ibb.co/JRJChvkT/robinbook.png',
    shortcut: 'https://i.ibb.co/JRJChvkT/robinbook.png',
    apple: 'https://i.ibb.co/JRJChvkT/robinbook.png',
  },

  openGraph: {
    title: 'RobinBook — The Social Network for Robinhood Traders',
    description:
      'The social network for the Robinhood ecosystem. Create communities, chat live, and connect with traders who trade what you trade.',
    url: 'https://robinbook.fun',
    siteName: 'RobinBook',
    images: [
      {
        url: 'https://i.ibb.co/JRJChvkT/robinbook.png',
        width: 1200,
        height: 630,
        alt: 'RobinBook Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'RobinBook — The Social Network for Robinhood Traders',
    description:
      'The social network for the Robinhood ecosystem. Create communities, chat live, and connect with traders who trade what you trade.',
    images: ['https://i.ibb.co/JRJChvkT/robinbook.png'],
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
