import { createContext, useContext, useState, type ReactNode } from 'react'
import type { NavTag } from '../data/products'

type CatalogFilterContextValue = {
  activeTag: NavTag | null
  setActiveTag: (tag: NavTag | null) => void
}

const CatalogFilterContext = createContext<CatalogFilterContextValue | null>(null)

export function CatalogFilterProvider({ children }: { children: ReactNode }) {
  const [activeTag, setActiveTag] = useState<NavTag | null>(null)

  return (
    <CatalogFilterContext.Provider value={{ activeTag, setActiveTag }}>
      {children}
    </CatalogFilterContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalogFilter() {
  const context = useContext(CatalogFilterContext)
  if (!context) throw new Error('useCatalogFilter must be used inside CatalogFilterProvider')
  return context
}
