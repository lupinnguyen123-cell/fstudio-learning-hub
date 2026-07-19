import type { StorageLike } from '../../services/contentService'
import type { InstructionalGraph } from './instructionalGraph'

export const INSTRUCTIONAL_GRAPH_STORAGE_KEY = 'fstudio_ai_instructional_graphs'
const browserStorage = (): StorageLike | null => { try { return window.localStorage } catch { return null } }
export class InstructionalGraphService {
  private readonly storage: StorageLike | null
  constructor(storage: StorageLike | null = browserStorage()) { this.storage = storage }
  save(graph: InstructionalGraph) { const next = structuredClone({ ...graph, updatedAt: new Date().toISOString() }); const graphs = this.readAll().filter((item) => item.id !== next.id); this.storage?.setItem(INSTRUCTIONAL_GRAPH_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, graphs: [...graphs, next].slice(-10) })); return next }
  load(id?: string) { const active = this.readAll().filter((item) => item.status !== 'archived'); const graph = id ? active.find((item) => item.id === id) : active.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0]; return graph ? structuredClone(graph) : null }
  archive(id: string) { this.updateStatus(id, 'archived') }
  discard(id: string) { this.storage?.setItem(INSTRUCTIONAL_GRAPH_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, graphs: this.readAll().filter((item) => item.id !== id) })) }
  private updateStatus(id: string, status: InstructionalGraph['status']) { this.storage?.setItem(INSTRUCTIONAL_GRAPH_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, graphs: this.readAll().map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item) })) }
  private readAll(): InstructionalGraph[] { try { const value: unknown = JSON.parse(this.storage?.getItem(INSTRUCTIONAL_GRAPH_STORAGE_KEY) ?? '{}'); return typeof value === 'object' && value !== null && 'graphs' in value && Array.isArray(value.graphs) ? value.graphs.filter((item): item is InstructionalGraph => typeof item === 'object' && item !== null && 'instructionalUnits' in item && 'learningObjectives' in item) : [] } catch { return [] } }
}
export const instructionalGraphService = new InstructionalGraphService()
