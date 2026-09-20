'use client'

import { SessionProvider } from 'next-auth/react'
import { useState, createContext, useContext } from 'react'

const ThemeContext = createContext({
  dark: false,
  toggle: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export function Providers({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false)

  const toggle = () => {
    setDark(d => {
      if (!d) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      return !d
    })
  }

  return (
    <SessionProvider>
      <ThemeContext.Provider value={{ dark, toggle }}>
        {children}
      </ThemeContext.Provider>
    </SessionProvider>
  )
}
