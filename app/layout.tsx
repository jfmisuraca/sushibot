import { ThemeProvider } from '@/app/contexts/ThemeContext'
import '@/styles/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simple Chatbot',
  description: 'A basic chatbot using Nextjs and MongoDB',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Bot de pedidos de sushi" />
        <title>SushiBot</title>
      </head>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  )
}

