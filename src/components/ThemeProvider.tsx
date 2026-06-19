import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Garantir que caso o usuário tenha um tema classic salvo, seja convertido
  const getInitialTheme = () => {
    const saved = localStorage.getItem(storageKey) as string;
    if (saved && saved.startsWith("classic-")) {
      const newTheme = saved.replace("classic-", "") as Theme;
      localStorage.setItem(storageKey, newTheme);
      return newTheme;
    }
    return (saved as Theme) || defaultTheme;
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = window.document.documentElement

    // Remover a classe classic caso estivesse presente
    root.classList.remove("light", "dark", "classic")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
