/* eslint-disable react-refresh/only-export-components -- Provider and hook are one public module. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { contentService } from '../services/contentService'
import type { ContentStore, Course } from '../types'

interface ContentContextValue { store: ContentStore; warning: string; refresh(): void; saveCourse(course: Course): void; reset(): void }
const ContentContext = createContext<ContentContextValue | null>(null)
export function ContentProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(contentService.getStore())
  const refresh = useCallback(() => setStore(contentService.getStore()), [])
  useEffect(() => { window.addEventListener('fstudio-content-change', refresh); return () => window.removeEventListener('fstudio-content-change', refresh) }, [refresh])
  const saveCourse = useCallback((course: Course) => { contentService.upsertCourse(course); refresh() }, [refresh])
  const reset = useCallback(() => { contentService.reset(); refresh() }, [refresh])
  const value = useMemo(() => ({ store, warning: contentService.getWarning(), refresh, saveCourse, reset }), [refresh, reset, saveCourse, store])
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}
export function useContent() { const value = useContext(ContentContext); if (!value) throw new Error('useContent must be used within ContentProvider'); return value }
