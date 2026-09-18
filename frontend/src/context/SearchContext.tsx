'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType>({
  searchQuery: '',
  setSearchQuery: () => {},
  clearSearch: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQueryState] = useState<string>('');

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQueryState('');
  }, []);

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      clearSearch,
    }),
    [searchQuery, setSearchQuery, clearSearch]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextType {
  return useContext(SearchContext);
}
