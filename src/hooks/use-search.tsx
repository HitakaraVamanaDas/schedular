"use client"

import * as React from "react"

type SearchProviderState = {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const initialState: SearchProviderState = {
  searchQuery: "",
  setSearchQuery: () => null,
}

const SearchProviderContext = React.createContext<SearchProviderState>(initialState)

export function SearchProvider({
  children,
  ...props
}: {
  children: React.ReactNode
}) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const value = {
    searchQuery,
    setSearchQuery,
  }

  return (
    <SearchProviderContext.Provider {...props} value={value}>
      {children}
    </SearchProviderContext.Provider>
  )
}

export const useSearch = () => {
  const context = React.useContext(SearchProviderContext)

  if (context === undefined)
    throw new Error("useSearch must be used within a SearchProvider")

  return context
}
