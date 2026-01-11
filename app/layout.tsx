import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import RequireAuth from '@/components/require-auth'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'LabManager',
  description: 'LabManager — lab reservation and project manager',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/labmanager-icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/labmanager-icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <RequireAuth>
          {children}
        </RequireAuth>
        <Analytics />
      </body>
    </html>
  )
}
