import { AlertTriangle, ArrowRight, Check, FileSearch, FileText, LoaderCircle, RotateCcw, ShieldCheck, Upload, WandSparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { aiClient } from '../../ai/aiClient'
import { AiClientError, type GenerateCourseRequest } from '../../ai/contracts'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { AdvancedAiReviewWorkspace } from '../../features/ai-authoring/AdvancedAiReviewWorkspace'
import { DocumentPreview } from '../../features/ai-authoring/DocumentPreview'
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
  const [phase, setPhase] = useState<AiImportPhase>(existingDraft ? 'review' : 'import')
  const [imported, setImported] = useState<AiImportedFile | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [document, setDocument] = useState<StructuredDocument | null>(null)
  const [preset, setPreset] = useState<AiPresetId>(existingDraft?.preset ?? 'product')
  const [stageIndex, setStageIndex] = useState(0)
  const [draft, setDraft] = useState<AiCourseDraft | null>(existingDraft)
  const [notice, setNotice] = useState(existingDraft ? 'Đã khôi phục AI draft gần nhất.' : '')
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

  const generateRequest = (analysis: AiImportedFile, structured: StructuredDocument): GenerateCourseRequest => ({ document: documentService.toAiHandoff(structured), courseType: preset, language: 'vi', tone: 'professional_friendly', audience: 'Nhân viên tư vấn F.Studio', desiredModuleCount: analysis.estimatedModules, desiredLessonLength: 'short', includeQuiz: true, includeScenario: true, includeFlashcards: true, retailContext: 'Đào tạo bán lẻ F.Studio, ưu tiên áp dụng tại quầy.', requestId: requestId() })
  const process = async () => {
    let analysis = imported; let structured = document
    if (sourceText.trim() && (!analysis || analysis.source.extractedText !== sourceText.trim())) { try { analysis = aiCourseService.analyzeText(sourceText); structured = await documentService.parseText(sourceText); setImported(analysis); setDocument(structured) } catch { analysis = null; structured = null } }
    if (!analysis || !structured) { setNotice('Hãy parse nội dung nguồn trước khi Generate.'); return }
    if (structured.status !== 'parsed') { setNotice('Định dạng đã nhận diện nhưng parser chưa khả dụng. AI không nhận raw file hoặc placeholder.'); return }
    if (Date.now() - lastRequestAt < 2_000) { setNotice('Vui lòng chờ trước khi gửi yêu cầu AI tiếp theo.'); return }
    setLastRequestAt(Date.now()); setStageIndex(0); setPhase('processing'); setNotice('')
    const controller = new AbortController(); requestController.current = controller
    try {
      const response = await aiClient.generateCourse(generateRequest(analysis, structured), controller.signal)
      const validation = aiCourseService.validateCourseDraft(response.draft)
      if (validation.errors.length) throw new AiClientError('AI_SCHEMA_VALIDATION_FAILED', 'AI Draft không vượt qua validation.')
      aiCourseService.saveDraft(response.draft); setDraft(response.draft); setPhase('review'); setNotice(response.isMock || response.draft.generation?.isMock ? 'Đây là kết quả mô phỏng, không phải AI provider thật.' : `AI Draft đã tạo bằng ${response.provider} · ${response.model}.`)
    } catch (error) { if (controller.signal.aborted) setNotice('Đã hủy yêu cầu AI. Source vẫn được giữ nguyên.'); else setNotice(error instanceof AiClientError ? error.message : 'Không thể tạo AI Draft.'); setPhase('failed') }
    finally { requestController.current = null }
  }
  const useDevelopmentMock = () => {
    if (!import.meta.env.DEV || !imported) return
    const mock = aiCourseService.generateCourseDraft(imported.source, preset)
    const marked = { ...mock, generation: { provider: 'mock', model: 'deterministic-local', generatedAt: new Date().toISOString(), latencyMs: 0, isMock: true } }
    aiCourseService.saveDraft(marked); setDraft(marked); setPhase('review'); setNotice('Đây là kết quả mô phỏng, không phải AI provider thật.')
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

  return <section className="ai-workspace">
    <ConfirmDialog open={discardOpen} title="Discard AI draft?" description="Bản review hiện tại sẽ bị xóa khỏi AI draft storage. Course production không bị ảnh hưởng." onCancel={() => setDiscardOpen(false)} onConfirm={discard} />
    <header className="ai-workspace-hero"><div><span className="ui-eyebrow"><WandSparkles /> AI Course Authoring</span><h1>Biến tài liệu thành bản nháp khóa học</h1><p>Nội dung text được gửi tới AI provider qua Netlify Function. API key không xuất hiện trong trình duyệt.</p></div><span className="ai-local-badge"><ShieldCheck /> Server-side AI · Trainer review bắt buộc</span></header>
    <nav className="ai-stepper" aria-label="Quy trình AI Course"><span className={phase === 'import' ? 'active' : 'done'}>1. Import</span><span className={phase === 'processing' ? 'active' : phase === 'review' || phase === 'approved' ? 'done' : ''}>2. Generate</span><span className={phase === 'review' ? 'active' : phase === 'approved' ? 'done' : ''}>3. Review</span><span className={phase === 'approved' ? 'active' : ''}>4. Approve</span></nav>
    {notice && <div className={`builder-notice ${phase === 'approved' ? 'ready' : ''}`} role="status">{notice}</div>}
    {(phase === 'import' || phase === 'discarded') && document && <DocumentPreview document={document} rawText={sourceText} />}
    {(phase === 'import' || phase === 'discarded') && <section className="ai-import-card"><div className="ai-upload-zone"><Upload /><h2>{phase === 'discarded' ? 'Draft đã được loại bỏ' : 'Import nguồn text'}</h2><p>TXT/Markdown được đọc trực tiếp. PDF, PPTX và DOCX cần dán extracted text vì chưa có parser thật.</p><label className="button button-secondary">Chọn file<input type="file" accept={acceptedTypes} onChange={(event) => void importFile(event.target.files?.[0])} /></label></div><label className="cms-field ai-source-text"><span>Nội dung nguồn</span><textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Dán nội dung đào tạo, TXT hoặc Markdown…" /><small>{sourceText.length.toLocaleString('vi-VN')} ký tự</small></label><button type="button" className="button button-secondary" onClick={preparePastedText}>Kiểm tra nguồn</button>{imported && <div className="ai-file-preview"><span><FileText /></span><div><strong>{imported.source.fileName}</strong><small>{formatSize(imported.source.fileSize)} · {imported.source.metadata.extractionMode}</small></div><dl><div><dt>Estimated Modules</dt><dd>{imported.estimatedModules}</dd></div><div><dt>Estimated Lessons</dt><dd>{imported.estimatedLessons}</dd></div></dl><label className="cms-field ai-preset-select"><span>Preset</span><select value={preset} onChange={(event) => setPreset(event.target.value as AiPresetId)}><option value="product">Product Training</option><option value="sales">Sales Training</option><option value="campaign">Campaign Training</option></select></label><button type="button" className="button button-primary" onClick={() => void process()}>Tạo bản nháp AI <ArrowRight /></button></div>}</section>}
    {phase === 'processing' && <section className="ai-processing" aria-live="polite"><span className="ai-processing-icon"><LoaderCircle className="spin" /></span><span className="ui-eyebrow">Server-side AI Processing</span><h2>{aiProcessingStages[stageIndex]}</h2><p>{imported?.source.fileName}</p><div className="ai-processing-track"><span style={{ width: `${((stageIndex + 1) / aiProcessingStages.length) * 100}%` }} /></div><ol>{aiProcessingStages.map((stage, index) => <li className={index < stageIndex ? 'done' : index === stageIndex ? 'active' : ''} key={stage}>{index < stageIndex ? <Check /> : <FileSearch />}{stage}</li>)}</ol><button type="button" className="button button-secondary" onClick={cancelGeneration}><X /> Hủy yêu cầu</button></section>}
    {phase === 'failed' && <section className="ai-state-panel" role="alert"><AlertTriangle /><h2>Không thể tạo AI draft</h2><p>Source và Course hiện có không bị thay đổi.</p><div><button type="button" className="button button-primary" onClick={() => void process()}><RotateCcw /> Thử lại</button><button type="button" className="button button-secondary" onClick={() => setPhase('import')}>Quay về chỉnh nguồn</button>{import.meta.env.DEV && imported && <button type="button" className="button button-secondary" onClick={useDevelopmentMock}>Dùng mock draft (development)</button>}</div></section>}
    {phase === 'review' && draft && <AdvancedAiReviewWorkspace initialDraft={draft} onApprove={approve} onDiscard={(current) => { setDraft(current); setDiscardOpen(true) }} onRegenerate={regenerate} />}
  </section>
}

function selectedItem(draft: AiCourseDraft, selection: AiReviewSelection): unknown { if (selection.type === 'course') return { title: draft.title, shortDescription: draft.shortDescription, learningObjectives: draft.learningObjectives, quiz: draft.quiz }; const module = draft.modules.find((item) => item.id === selection.moduleId); if (selection.type === 'module') return module; const lesson = module?.lessons.find((item) => item.id === selection.lessonId); if (selection.type === 'lesson') return lesson; return lesson?.blocks.find((item) => item.id === selection.blockId) }
const regenerateInstruction = (action: RegenerateAction) => ({ course_title: 'Viết lại tiêu đề rõ và ngắn.', course_description: 'Viết lại mô tả khóa học.', learning_objectives: 'Viết lại mục tiêu học tập, mỗi mục một dòng.', module_title: 'Viết lại tên module.', lesson_title: 'Viết lại tên lesson.', lesson_summary: 'Tóm tắt lesson.', quiz: 'Đề xuất nội dung quiz phù hợp.', flashcard: 'Cải thiện flashcard.', scenario: 'Cải thiện tình huống tư vấn.', simplify: 'Đơn giản hóa nội dung.', concise: 'Rút gọn nội dung.', sales_focus: 'Tăng tính ứng dụng bán hàng mà không thêm dữ kiện.' })[action]
