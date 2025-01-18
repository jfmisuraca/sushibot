'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const isNightInArgentina = () => {
      const argentinaTime = new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })
      const hour = new Date(argentinaTime).getHours()
      return hour >= 18 || hour < 6
    }

    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

    if (isNightInArgentina() || prefersDarkMode) {
      setTheme('dark')
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

