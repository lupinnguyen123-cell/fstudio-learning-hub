import { describe, expect, it } from 'vitest'
import { createRuleBasedInstructionalGraph } from '../ai/instructional/fallbackEngine'
import { INSTRUCTIONAL_GRAPH_STORAGE_KEY, InstructionalGraphService } from '../ai/instructional/instructionalPersistence'
import { addObjective, deleteObjective, dismissInstructionalWarning, markObjectiveReviewed, markUnitReviewed, reorderUnit, setUnitFormat } from '../ai/instructional/instructionalTransform'
import type { InstructionalAnalysisRequest, InstructionalGraph } from '../ai/instructional/instructionalGraph'
import { validateInstructionalGraph } from '../ai/instructional/instructionalValidation'
import { parseInstructionalGraph } from '../../netlify/functions/_shared/ai/instructional/responseParser'
import type { StorageLike } from '../services/contentService'

const request: InstructionalAnalysisRequest = {
  document: { schemaVersion: 1, sourceId: 'doc-1', fileName: 'mac.md', format: 'markdown', metadata: { title: 'Tư vấn Mac', wordCount: 180 }, sections: [
    { id: 'section-product', title: 'Hiểu sản phẩm', level: 1, elements: [{ id: 'element-product', type: 'paragraph', content: 'MacBook Air nhẹ, phù hợp nhu cầu học tập và khách hàng sinh viên.', retailSignals: ['product', 'specification'] }] },
    { id: 'section-scenario', title: 'Tư vấn tại cửa hàng', level: 1, elements: [{ id: 'element-scenario', type: 'paragraph', content: 'Khách hàng phản đối về giá. Nhân viên cần hỏi nhu cầu và giải thích lợi ích.', retailSignals: ['scenario', 'price'] }] },
    { id: 'section-campaign', title: 'Điều kiện chương trình', level: 1, elements: [{ id: 'element-campaign', type: 'paragraph', content: 'Kiểm tra điều kiện chương trình trước khi tư vấn.', retailSignals: ['campaign_rule', 'warning'] }] },
  ], normalizedText: 'MacBook Air nhẹ và phù hợp học tập. Khách hàng phản đối giá. Kiểm tra điều kiện chương trình.', detectedSignals: ['product', 'specification', 'scenario', 'price', 'campaign_rule', 'warning'], qualityScore: 90 },
  courseType: 'sales', audience: 'Nhân viên tư vấn F.Studio', trainingContext: 'Tại cửa hàng', desiredLearningDuration: 45, desiredLessonLength: 'short', includeAssessment: true, retailContext: 'F.Studio', sourceLanguage: 'vi', outputLanguage: 'vi', trainerGoal: 'Áp dụng kiến thức vào tư vấn khách hàng.', requestId: 'instructional-test-1',
}

describe('AI-5 Instructional Designer', () => {
  it('creates a separate, source-grounded rule-based graph', () => {
    const graph = createRuleBasedInstructionalGraph(request)
    expect(graph.analysisType).toBe('rule_based')
    expect(graph.schemaVersion).toBe(1)
    expect(graph.learningObjectives).toHaveLength(3)
    expect(graph.contentMap.map((item) => item.type)).toEqual(expect.arrayContaining(['Product Knowledge', 'Consultation Scenario', 'Campaign Condition']))
    expect(graph.instructionalUnits.every((unit) => unit.sourceReferences[0]?.documentId === 'doc-1')).toBe(true)
    expect(graph.sourceCoverage).toMatchObject({ totalSections: 3, usedSections: 3, percentage: 100, coverageViewed: false })
    expect(graph.warnings.some((warning) => warning.code === 'rule_based_analysis')).toBe(true)
    expect(JSON.stringify(graph)).not.toContain('lesson_blocks')
  })

  it('creates an explainable sequence, interaction and assessment blueprint', () => {
    const graph = createRuleBasedInstructionalGraph(request)
    expect(graph.instructionalUnits.map((unit) => unit.sequenceIndex)).toEqual([1, 2, 3])
    expect(graph.instructionalUnits[1]?.dependencyIds).toEqual([graph.instructionalUnits[0]?.id])
    expect(graph.instructionalUnits.every((unit) => unit.sequenceRationale && unit.suggestedInteractions.length)).toBe(true)
    expect(graph.assessmentPlan.enabled).toBe(true)
    expect(graph.assessmentPlan.objectiveCoverage).toBe(100)
    expect(graph.assessmentPlan.scenarioBasedCandidates.length).toBeGreaterThan(0)
    expect(graph.salesRelevance.metrics.find((metric) => metric.id === 'scenario')?.passed).toBe(true)
  })

  it('validates missing references, objective behavior and cognitive load', () => {
    const graph = createRuleBasedInstructionalGraph(request)
    const invalid = structuredClone(graph)
    invalid.learningObjectives[0]!.statement = 'Hiểu sản phẩm'
    invalid.learningObjectives[0]!.sourceReferences = []
    invalid.instructionalUnits[0]!.conceptCount = 8
    invalid.instructionalUnits[0]!.cognitiveLoad = 'high'
    const result = validateInstructionalGraph(invalid)
    expect(result.errors.some((item) => item.id.startsWith('objective-source'))).toBe(true)
    expect(result.warnings.some((item) => item.id.startsWith('objective-general'))).toBe(true)
    expect(result.warnings.some((item) => item.id.startsWith('unit-load'))).toBe(true)
  })

  it('supports Trainer edits without mutating the original graph', () => {
    const graph = createRuleBasedInstructionalGraph(request)
    const firstObjective = graph.learningObjectives[0]!
    const firstUnit = graph.instructionalUnits[0]!
    let edited = addObjective(graph, 'Áp dụng checklist tư vấn tại quầy.')
    edited = markObjectiveReviewed(edited, firstObjective.id)
    edited = setUnitFormat(edited, firstUnit.id, 'checklist')
    edited = markUnitReviewed(edited, firstUnit.id)
    edited = reorderUnit(edited, firstUnit.id, 1)
    edited = dismissInstructionalWarning(edited, edited.warnings[0]!.id, 'Trainer đã xác minh nguồn')
    expect(graph.learningObjectives).toHaveLength(3)
    expect(edited.learningObjectives).toHaveLength(4)
    expect(edited.instructionalUnits.find((item) => item.id === firstUnit.id)?.sequenceIndex).toBe(2)
    expect(edited.warnings[0]).toMatchObject({ resolution: 'dismissed', dismissReason: 'Trainer đã xác minh nguồn' })
    expect(deleteObjective(edited, firstObjective.id).instructionalUnits.every((unit) => !unit.linkedObjectives.includes(firstObjective.id))).toBe(true)
  })

  it('persists, archives and discards graphs under the isolated storage key', () => {
    const storage = memoryStorage()
    const service = new InstructionalGraphService(storage)
    const graph = createRuleBasedInstructionalGraph(request)
    service.save(graph)
    expect(storage.getItem(INSTRUCTIONAL_GRAPH_STORAGE_KEY)).toContain(graph.id)
    expect(storage.getItem('fstudio_learning_content')).toBeNull()
    expect(service.load()?.id).toBe(graph.id)
    service.archive(graph.id)
    expect(service.load()).toBeNull()
    service.discard(graph.id)
    expect(storage.getItem(INSTRUCTIONAL_GRAPH_STORAGE_KEY)).not.toContain(graph.id)
  })

  it('rejects malformed provider output and accepts a valid graph', () => {
    const graph = createRuleBasedInstructionalGraph(request)
    expect(parseInstructionalGraph(JSON.stringify(graph)).id).toBe(graph.id)
    expect(() => parseInstructionalGraph('{bad')).toThrow()
    expect(() => parseInstructionalGraph(JSON.stringify({ ...graph, learningObjectives: [] }))).toThrow()
  })

  it('can be approved as a graph without becoming a production course', () => {
    const graph = createRuleBasedInstructionalGraph(request)
    const approved: InstructionalGraph = { ...graph, status: 'approved', reviewStatus: 'approved' }
    expect(approved.status).toBe('approved')
    expect(approved).not.toHaveProperty('modules')
    expect(approved).not.toHaveProperty('quiz')
    expect(approved).not.toHaveProperty('publishStatus')
  })
})

function memoryStorage(): StorageLike {
  const data = new Map<string, string>()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) }, removeItem: (key) => { data.delete(key) } }
}
