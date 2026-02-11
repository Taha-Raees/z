import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Virtual School - AI Education Platform',
  description: 'Personalized learning powered by AI agents. Create custom curricula, access curated resources, and track your progress.',
  keywords: ['AI education', 'personalized learning', 'online courses', 'virtual school'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
