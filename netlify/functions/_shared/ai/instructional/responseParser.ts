import type { InstructionalGraph } from '../../../../../src/ai/instructional/instructionalGraph'
import { validateInstructionalGraph } from '../../../../../src/ai/instructional/instructionalValidation'
import { parseJsonObject } from '../../../../../src/ai/responseValidation'

export function parseInstructionalGraph(raw: string): InstructionalGraph { const value = parseJsonObject(raw); if (typeof value !== 'object' || value === null || !('schemaVersion' in value) || value.schemaVersion !== 1 || !('learningObjectives' in value) || !Array.isArray(value.learningObjectives) || !('instructionalUnits' in value) || !Array.isArray(value.instructionalUnits)) throw new Error('INSTRUCTIONAL_INVALID_RESPONSE'); const graph = value as InstructionalGraph; const validation = validateInstructionalGraph(graph); if (validation.errors.length) throw new Error('INSTRUCTIONAL_SCHEMA_ERROR'); return graph }
