import { useCallback, useState } from 'react'
import type { AiCourseDraft } from './types'

interface HistoryState { past: AiCourseDraft[]; present: AiCourseDraft; future: AiCourseDraft[] }

export function useAiReviewHistory(initial: AiCourseDraft, onPersist: (draft: AiCourseDraft) => void) {
  const [history, setHistory] = useState<HistoryState>({ past: [], present: initial, future: [] })
  const commit = useCallback((next: AiCourseDraft) => setHistory((current) => { const updated = { ...next, updatedAt: new Date().toISOString() }; onPersist(updated); return { past: [...current.past, current.present].slice(-25), present: updated, future: [] } }), [onPersist])
  const undo = useCallback(() => setHistory((current) => { const previous = current.past.at(-1); if (!previous) return current; onPersist(previous); return { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future].slice(0, 25) } }), [onPersist])
  const redo = useCallback(() => setHistory((current) => { const next = current.future[0]; if (!next) return current; onPersist(next); return { past: [...current.past, current.present].slice(-25), present: next, future: current.future.slice(1) } }), [onPersist])
  return { draft: history.present, commit, undo, redo, canUndo: history.past.length > 0, canRedo: history.future.length > 0 }
}
