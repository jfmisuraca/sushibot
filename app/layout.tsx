import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simple Chatbot',
  description: 'A basic chatbot using Next.js and MongoDB',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

