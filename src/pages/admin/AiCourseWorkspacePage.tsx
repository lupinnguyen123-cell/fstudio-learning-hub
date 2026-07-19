import { AlertTriangle, ArrowRight, Check, FileSearch, FileText, LoaderCircle, RotateCcw, ShieldCheck, Upload, WandSparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { aiClient } from '../../ai/aiClient'
import { InstructionalClientError } from '../../ai/instructional/contracts'
import { analyzeInstructionalDesign } from '../../ai/instructional/instructionalDesignerClient'
import { createRuleBasedInstructionalGraph } from '../../ai/instructional/fallbackEngine'
import type { InstructionalAnalysisRequest, InstructionalGraph } from '../../ai/instructional/instructionalGraph'
import { instructionalGraphService } from '../../ai/instructional/instructionalPersistence'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { AdvancedAiReviewWorkspace } from '../../features/ai-authoring/AdvancedAiReviewWorkspace'
import { DocumentPreview } from '../../features/ai-authoring/DocumentPreview'
import { InstructionalReviewWorkspace } from '../../features/ai-authoring/InstructionalReviewWorkspace'
import type { AiCourseDraft, AiImportedFile, AiImportPhase, AiPresetId, AiReviewSelection } from '../../features/ai-authoring/types'
import { type RegenerateAction, type RegenerateProposal } from '../../features/ai-authoring/aiReviewActions'
import { aiCourseService, aiProcessingStages } from '../../services/aiCourseService'
import { contentService } from '../../services/contentService'
import { documentService } from '../../document/services/documentService'
import type { StructuredDocument } from '../../document/types'

const acceptedTypes = '.pptx,.pdf,.docx,.txt,.md,.markdown'
const textExtensions = new Set(['txt', 'md', 'markdown'])
const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
const requestId = () => `ai_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`

export function AiCourseWorkspacePage() {
  const navigate = useNavigate()
  const existingDraft = useMemo(() => aiCourseService.loadDraft(), [])
  const existingGraph = useMemo(() => instructionalGraphService.load(), [])
  const [phase, setPhase] = useState<AiImportPhase>(existingGraph ? existingGraph.status === 'approved' ? 'instructional_approved' : 'instructional_review' : existingDraft ? 'review' : 'import')
  const [imported, setImported] = useState<AiImportedFile | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [document, setDocument] = useState<StructuredDocument | null>(null)
  const [preset, setPreset] = useState<AiPresetId>(existingDraft?.preset ?? 'product')
  const [stageIndex, setStageIndex] = useState(0)
  const [draft, setDraft] = useState<AiCourseDraft | null>(existingDraft)
  const [graph, setGraph] = useState<InstructionalGraph | null>(existingGraph)
  const [audience, setAudience] = useState(existingGraph?.audience ?? 'Nhân viên tư vấn F.Studio')
  const [trainerGoal, setTrainerGoal] = useState(existingGraph?.overallLearningGoal ?? '')
  const [notice, setNotice] = useState(existingGraph ? 'Đã khôi phục Instructional Graph gần nhất.' : existingDraft ? 'Đã khôi phục AI draft cũ để bảo toàn dữ liệu.' : '')
  const [discardOpen, setDiscardOpen] = useState(false)
  const [lastRequestAt, setLastRequestAt] = useState(0)
  const requestController = useRef<AbortController | null>(null)

  useEffect(() => {
    if (phase !== 'processing') return
    const timer = window.setInterval(() => setStageIndex((current) => Math.min(current + 1, aiProcessingStages.length - 1)), 700)
    return () => window.clearInterval(timer)
  }, [phase])
  useEffect(() => () => requestController.current?.abort(), [])

  const importFile = async (selected?: File) => {
    if (!selected) return
    try {
      const extension = selected.name.split('.').pop()?.toLowerCase() ?? ''
      const extractedText = textExtensions.has(extension) ? await selected.text() : ''
      const structured = await documentService.parseFile(selected)
      const analysis = aiCourseService.analyzeSource(selected, extractedText)
      setImported(analysis); setDocument(structured); setSourceText(extractedText); setPreset(analysis.suggestedPreset); setDraft(null); setPhase('import')
      setNotice(structured.status === 'parsed' ? 'Document đã được parse và chuẩn hóa. Hãy review trước khi Generate.' : 'Định dạng đã nhận diện nhưng parser chưa khả dụng.')
    } catch { setNotice('Định dạng chưa được hỗ trợ. Chọn PPTX, PDF, DOCX, TXT hoặc Markdown.') }
  }
  const preparePastedText = async () => {
    try { const analysis = aiCourseService.analyzeText(sourceText); const structured = await documentService.parseText(sourceText); setDocument(structured); setImported(analysis); setPreset(analysis.suggestedPreset); setNotice('Nội dung đã được parse và chuẩn hóa.') }
    catch { setNotice('Hãy nhập nội dung nguồn hợp lệ trước khi tiếp tục.') }
  }

  const instructionalRequest = (structured: StructuredDocument): InstructionalAnalysisRequest => ({ document: documentService.toAiHandoff(structured), courseType: preset, audience: audience.trim(), trainingContext: 'Đào tạo nhân viên bán lẻ F.Studio tại cửa hàng.', desiredLearningDuration: 45, desiredLessonLength: 'short', includeAssessment: true, retailContext: 'F.Studio retail consultation', sourceLanguage: 'vi', outputLanguage: 'vi', trainerGoal: trainerGoal.trim() || undefined, requestId: requestId() })
  const process = async () => {
    let analysis = imported; let structured = document
    if (sourceText.trim() && (!analysis || analysis.source.extractedText !== sourceText.trim())) { try { analysis = aiCourseService.analyzeText(sourceText); structured = await documentService.parseText(sourceText); setImported(analysis); setDocument(structured) } catch { analysis = null; structured = null } }
    if (!analysis || !structured) { setNotice('Hãy parse nội dung nguồn trước khi phân tích.'); return }
    if (!audience.trim()) { setNotice('Cần nhập đối tượng học trước khi phân tích.'); return }
    if (structured.status !== 'parsed') { setNotice('Định dạng đã nhận diện nhưng parser chưa khả dụng. AI không nhận raw file hoặc placeholder.'); return }
    if (Date.now() - lastRequestAt < 2_000) { setNotice('Vui lòng chờ trước khi gửi yêu cầu AI tiếp theo.'); return }
    setLastRequestAt(Date.now()); setStageIndex(0); setPhase('processing'); setNotice('')
    const controller = new AbortController(); requestController.current = controller
    try {
      const response = await analyzeInstructionalDesign(instructionalRequest(structured), controller.signal)
      const saved = instructionalGraphService.save(response.graph); setGraph(saved); setPhase('instructional_review'); setNotice(response.analysisType === 'rule_based' ? 'Kết quả rule-based cần Trainer xác minh.' : `Instructional Graph đã tạo bằng ${response.provider} · ${response.model}.`)
    } catch (error) { if (controller.signal.aborted) setNotice('Đã hủy yêu cầu. Source vẫn được giữ nguyên.'); else setNotice(error instanceof InstructionalClientError ? error.message : 'Không thể tạo Instructional Graph.'); setPhase('failed') }
    finally { requestController.current = null }
  }
  const useDevelopmentMock = () => {
    if (!document) return
    const fallback = instructionalGraphService.save(createRuleBasedInstructionalGraph(instructionalRequest(document)))
    setGraph(fallback); setPhase('instructional_review'); setNotice('Rule-based analysis — không phải AI provider thật.')
  }
  const cancelGeneration = () => requestController.current?.abort()

  const regenerate = async (current: AiCourseDraft, selection: AiReviewSelection, action: RegenerateAction, signal: AbortSignal): Promise<RegenerateProposal> => {
    const selected = selectedItem(current, selection)
    const module = selection.type === 'course' ? undefined : current.modules.find((item) => item.id === selection.moduleId)
    const lesson = selection.type === 'lesson' || selection.type === 'block' ? module?.lessons.find((item) => item.id === selection.lessonId) : undefined
    const response = await aiClient.regenerateSection({ requestId: requestId(), action, selection, selectedItem: selected, parentContext: { courseTitle: current.title, moduleTitle: module?.title, lessonTitle: lesson?.title }, sourceExcerpt: document?.normalizedText.slice(0, 6_000) ?? '', instruction: regenerateInstruction(action), expectedResponseType: 'text' }, signal)
    return { action, selection, before: response.before, after: response.after }
  }
  const approve = (reviewedDraft: AiCourseDraft) => {
    const result = aiCourseService.validateCourseDraft(reviewedDraft)
    if (result.errors.length) { setNotice(`Không thể approve: còn ${result.errors.length} validation error.`); return }
    try { const course = aiCourseService.convertDraftToCourse(reviewedDraft); contentService.upsertCourse(course); const approvedDraft = { ...reviewedDraft, status: 'approved' as const, updatedAt: new Date().toISOString() }; aiCourseService.saveDraft(approvedDraft); setDraft(approvedDraft); setPhase('approved'); setNotice('Khóa học nháp đã được tạo. Vui lòng kiểm tra trước khi xuất bản.'); window.setTimeout(() => navigate(`/admin/courses/${course.id}/edit`, { replace: true }), 650) }
    catch { setNotice('Không thể tạo course. Course hiện có và AI draft vẫn được giữ nguyên.') }
  }
  const discard = () => { if (draft) aiCourseService.discardDraft(draft.id); setDraft(null); setImported(null); setDocument(null); setSourceText(''); setPhase('discarded'); setDiscardOpen(false); setNotice('AI draft đã được loại bỏ.') }
  const discardGraph = () => { if (graph) instructionalGraphService.discard(graph.id); setGraph(null); setImported(null); setDocument(null); setSourceText(''); setPhase('discarded'); setDiscardOpen(false); setNotice('Instructional Graph đã được loại bỏ. Course production không bị ảnh hưởng.') }
  const approveGraph = (approved: InstructionalGraph) => { const saved = instructionalGraphService.save(approved); setGraph(saved); setPhase('instructional_approved'); setNotice('Instructional Graph đã được duyệt và sẵn sàng cho AI-6. Chưa tạo Course production.') }

  return <section className="ai-workspace">
    <ConfirmDialog open={discardOpen} title="Loại bỏ bản phân tích?" description="Bản review hiện tại sẽ bị xóa khỏi storage riêng. Course production không bị ảnh hưởng." onCancel={() => setDiscardOpen(false)} onConfirm={graph ? discardGraph : discard} />
    <header className="ai-workspace-hero"><div><span className="ui-eyebrow"><WandSparkles /> AI Course Authoring</span><h1>Biến tài liệu thành bản nháp khóa học</h1><p>Nội dung text được gửi tới AI provider qua Netlify Function. API key không xuất hiện trong trình duyệt.</p></div><span className="ai-local-badge"><ShieldCheck /> Server-side AI · Trainer review bắt buộc</span></header>
    <nav className="ai-stepper" aria-label="Quy trình AI Course"><span className={phase === 'import' ? 'active' : 'done'}>1. Import</span><span className={phase === 'processing' ? 'active' : phase.includes('review') || phase.includes('approved') ? 'done' : ''}>2. Analyze</span><span className={phase.includes('review') ? 'active' : phase.includes('approved') ? 'done' : ''}>3. Review</span><span className={phase.includes('approved') ? 'active' : ''}>4. Approve graph</span></nav>
    {notice && <div className={`builder-notice ${phase === 'approved' ? 'ready' : ''}`} role="status">{notice}</div>}
    {(phase === 'import' || phase === 'discarded') && document && <DocumentPreview document={document} rawText={sourceText} />}
    {(phase === 'import' || phase === 'discarded') && <section className="ai-import-card"><div className="ai-upload-zone"><Upload /><h2>{phase === 'discarded' ? 'Bản phân tích đã được loại bỏ' : 'Import nguồn đã chuẩn hóa'}</h2><p>Instructional Designer chỉ nhận Normalized Document, không nhận raw binary.</p><label className="button button-secondary">Chọn file<input type="file" accept={acceptedTypes} onChange={(event) => void importFile(event.target.files?.[0])} /></label></div><label className="cms-field ai-source-text"><span>Nội dung nguồn</span><textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Dán nội dung đào tạo, TXT hoặc Markdown…" /><small>{sourceText.length.toLocaleString('vi-VN')} ký tự</small></label><div className="instructional-inputs"><label className="cms-field"><span>Đối tượng học *</span><input value={audience} onChange={(event) => setAudience(event.target.value)} /></label><label className="cms-field"><span>Mục tiêu Trainer (tùy chọn)</span><input value={trainerGoal} onChange={(event) => setTrainerGoal(event.target.value)} placeholder="Ví dụ: áp dụng vào tư vấn tại quầy" /></label></div><button type="button" className="button button-secondary" onClick={preparePastedText}>Kiểm tra nguồn</button>{imported && <div className="ai-file-preview"><span><FileText /></span><div><strong>{imported.source.fileName}</strong><small>{formatSize(imported.source.fileSize)} · {imported.source.metadata.extractionMode}</small></div><dl><div><dt>Estimated Modules</dt><dd>{imported.estimatedModules}</dd></div><div><dt>Estimated Lessons</dt><dd>{imported.estimatedLessons}</dd></div></dl><label className="cms-field ai-preset-select"><span>Preset</span><select value={preset} onChange={(event) => setPreset(event.target.value as AiPresetId)}><option value="product">Product Training</option><option value="sales">Sales Training</option><option value="campaign">Campaign Training</option></select></label><button type="button" className="button button-primary" onClick={() => void process()}>Phân tích cấu trúc học tập <ArrowRight /></button></div>}</section>}
    {phase === 'processing' && <section className="ai-processing" aria-live="polite"><span className="ai-processing-icon"><LoaderCircle className="spin" /></span><span className="ui-eyebrow">Server-side AI Processing</span><h2>{aiProcessingStages[stageIndex]}</h2><p>{imported?.source.fileName}</p><div className="ai-processing-track"><span style={{ width: `${((stageIndex + 1) / aiProcessingStages.length) * 100}%` }} /></div><ol>{aiProcessingStages.map((stage, index) => <li className={index < stageIndex ? 'done' : index === stageIndex ? 'active' : ''} key={stage}>{index < stageIndex ? <Check /> : <FileSearch />}{stage}</li>)}</ol><button type="button" className="button button-secondary" onClick={cancelGeneration}><X /> Hủy yêu cầu</button></section>}
    {phase === 'failed' && <section className="ai-state-panel" role="alert"><AlertTriangle /><h2>Không thể phân tích instructional design</h2><p>Source, AI draft cũ và Course production không bị thay đổi.</p><div><button type="button" className="button button-primary" onClick={() => void process()}><RotateCcw /> Thử lại</button><button type="button" className="button button-secondary" onClick={() => setPhase('import')}>Quay về chỉnh nguồn</button>{document && <button type="button" className="button button-secondary" onClick={useDevelopmentMock}>Dùng rule-based analysis</button>}</div></section>}
    {phase === 'review' && draft && <AdvancedAiReviewWorkspace initialDraft={draft} onApprove={approve} onDiscard={(current) => { setDraft(current); setDiscardOpen(true) }} onRegenerate={regenerate} />}
    {phase === 'instructional_review' && graph && <InstructionalReviewWorkspace initialGraph={graph} onApprove={approveGraph} onDiscard={(current) => { setGraph(current); setDiscardOpen(true) }} onArchive={(current) => { instructionalGraphService.archive(current.id); setGraph(null); setPhase('import'); setNotice('Instructional Graph đã được lưu trữ.') }} />}
    {phase === 'instructional_approved' && graph && <section className="ai-state-panel ready"><ShieldCheck /><h2>Instructional Graph đã được duyệt</h2><p>Sẵn sàng chuyển sang Course Draft ở AI-6. Chưa tạo Course, block production hoặc publish.</p><button type="button" className="button button-secondary" onClick={() => setPhase('instructional_review')}>Mở lại review</button></section>}
  </section>
}

function selectedItem(draft: AiCourseDraft, selection: AiReviewSelection): unknown { if (selection.type === 'course') return { title: draft.title, shortDescription: draft.shortDescription, learningObjectives: draft.learningObjectives, quiz: draft.quiz }; const module = draft.modules.find((item) => item.id === selection.moduleId); if (selection.type === 'module') return module; const lesson = module?.lessons.find((item) => item.id === selection.lessonId); if (selection.type === 'lesson') return lesson; return lesson?.blocks.find((item) => item.id === selection.blockId) }
const regenerateInstruction = (action: RegenerateAction) => ({ course_title: 'Viết lại tiêu đề rõ và ngắn.', course_description: 'Viết lại mô tả khóa học.', learning_objectives: 'Viết lại mục tiêu học tập, mỗi mục một dòng.', module_title: 'Viết lại tên module.', lesson_title: 'Viết lại tên lesson.', lesson_summary: 'Tóm tắt lesson.', quiz: 'Đề xuất nội dung quiz phù hợp.', flashcard: 'Cải thiện flashcard.', scenario: 'Cải thiện tình huống tư vấn.', simplify: 'Đơn giản hóa nội dung.', concise: 'Rút gọn nội dung.', sales_focus: 'Tăng tính ứng dụng bán hàng mà không thêm dữ kiện.' })[action]
