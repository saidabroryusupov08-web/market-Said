import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/storage'

const HISTORY_KEY = 'stylehub-search-history'
const HISTORY_LIMIT = 8

type SearchContextValue = {
  query: string
  setQuery: (query: string) => void
  history: string[]
  addToHistory: (term: string) => void
  removeFromHistory: (term: string) => void
  clearHistory: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

function loadHistory(): string[] {
  const saved = loadFromStorage<unknown>(HISTORY_KEY, [])
  return Array.isArray(saved)
    ? saved.filter((term): term is string => typeof term === 'string').slice(0, HISTORY_LIMIT)
    : []
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<string[]>(loadHistory)

  useEffect(() => {
    saveToStorage(HISTORY_KEY, history)
  }, [history])

  // eng oxirgi qidiruv tepada turadi, takrorlar bitta bo'lib qoladi
  const addToHistory = (term: string) => {
    const clean = term.trim()
    if (!clean) return
    setHistory((prev) =>
      [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        HISTORY_LIMIT,
      ),
    )
  }

  const removeFromHistory = (term: string) => {
    setHistory((prev) => prev.filter((t) => t !== term))
  }

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        history,
        addToHistory,
        removeFromHistory,
        clearHistory: () => setHistory([]),
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useSearch must be used inside SearchProvider')
  return context
}
