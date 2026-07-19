import { AlertTriangle, ArrowRight, Check, FileSearch, FileText, LoaderCircle, RotateCcw, ShieldCheck, Sparkles, Upload, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { AiReviewTree } from '../../features/ai-authoring/AiReviewTree'
import type { AiCourseDraft, AiImportedFile, AiImportPhase, AiPresetId } from '../../features/ai-authoring/types'
import { aiCourseService, aiProcessingStages } from '../../services/aiCourseService'
import { contentService } from '../../services/contentService'

const acceptedTypes = '.pptx,.pdf,.docx,.txt,.md,.markdown'
const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
const objectiveLines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean)

export function AiCourseWorkspacePage() {
  const navigate = useNavigate()
  const existingDraft = useMemo(() => aiCourseService.loadDraft(), [])
  const [phase, setPhase] = useState<AiImportPhase>(existingDraft ? 'review' : 'import')
  const [imported, setImported] = useState<AiImportedFile | null>(null)
  const [preset, setPreset] = useState<AiPresetId>(existingDraft?.preset ?? 'product')
  const [stageIndex, setStageIndex] = useState(0)
  const [draft, setDraft] = useState<AiCourseDraft | null>(existingDraft)
  const [notice, setNotice] = useState(existingDraft ? 'Đã khôi phục AI draft gần nhất.' : '')
  const [discardOpen, setDiscardOpen] = useState(false)
  const validation = useMemo(() => draft ? aiCourseService.validateCourseDraft(draft) : null, [draft])

  useEffect(() => {
    if (phase !== 'processing' || !imported) return
    if (stageIndex >= aiProcessingStages.length - 1) {
      const timeout = window.setTimeout(() => { try { const generated = aiCourseService.generateCourseDraft(imported.source, preset); aiCourseService.saveDraft(generated); setDraft(generated); setPhase('review') } catch { setPhase('failed'); setNotice('Mock generation thất bại. Source chưa bị mất và bạn có thể thử lại.') } }, 550)
      return () => window.clearTimeout(timeout)
    }
    const timeout = window.setTimeout(() => setStageIndex((current) => current + 1), 550)
    return () => window.clearTimeout(timeout)
  }, [imported, phase, preset, stageIndex])

  useEffect(() => { if (phase === 'review' && draft) aiCourseService.saveDraft(draft) }, [draft, phase])

  const importFile = (selected?: File) => {
    if (!selected) return
    try { const analysis = aiCourseService.analyzeSource(selected); setImported(analysis); setPreset(analysis.suggestedPreset); setDraft(null); setPhase('import'); setNotice('') }
    catch { setNotice('Định dạng chưa được hỗ trợ. Chọn PPTX, PDF, DOCX, TXT hoặc Markdown.') }
  }
  const process = () => { if (!imported) return; setStageIndex(0); setPhase('processing'); setNotice('') }
  const changeDraft = (next: AiCourseDraft) => setDraft({ ...next, updatedAt: new Date().toISOString(), status: next.warnings.some((warning) => !warning.reviewed) ? 'needs_review' : 'ready' })
  const approve = () => {
    if (!draft) return
    const result = aiCourseService.validateCourseDraft(draft)
    if (result.errors.length) { setNotice(`Không thể approve: còn ${result.errors.length} validation error.`); return }
    try {
      const course = aiCourseService.convertDraftToCourse(draft)
      contentService.upsertCourse(course)
      aiCourseService.discardDraft(draft.id)
      setPhase('approved'); setNotice('Khóa học nháp đã được tạo. Vui lòng kiểm tra trước khi xuất bản.')
      window.setTimeout(() => navigate(`/admin/courses/${course.id}/edit`, { replace: true }), 650)
    } catch { setNotice('Không thể tạo course. Course hiện có và AI draft vẫn được giữ nguyên.') }
  }
  const discard = () => { if (draft) aiCourseService.discardDraft(draft.id); setDraft(null); setImported(null); setPhase('discarded'); setDiscardOpen(false); setNotice('AI draft đã được loại bỏ.') }
  const restart = () => { setDraft(null); setImported(null); setPhase('import'); setNotice('') }

  return <section className="ai-workspace">
    <ConfirmDialog open={discardOpen} title="Discard AI draft?" description="Bản review hiện tại sẽ bị xóa khỏi AI draft storage. Course production không bị ảnh hưởng." onCancel={() => setDiscardOpen(false)} onConfirm={discard} />
    <header className="ai-workspace-hero"><div><span className="ui-eyebrow"><WandSparkles /> AI Course Authoring</span><h1>Biến tài liệu thành bản nháp khóa học</h1><p>Mock engine cấu trúc nội dung theo heuristic đào tạo bán lẻ. Không có dữ liệu nào được gửi ra bên ngoài.</p></div><span className="ai-local-badge"><ShieldCheck /> Local mock · Không gọi AI API</span></header>
    <nav className="ai-stepper" aria-label="Quy trình AI Course"><span className={phase === 'import' ? 'active' : 'done'}>1. Import</span><span className={phase === 'processing' ? 'active' : phase === 'review' || phase === 'approved' ? 'done' : ''}>2. Preview</span><span className={phase === 'review' ? 'active' : phase === 'approved' ? 'done' : ''}>3. Review</span><span className={phase === 'approved' ? 'active' : ''}>4. Approve</span></nav>
    {notice && <div className={`builder-notice ${phase === 'approved' ? 'ready' : ''}`} role="status">{notice}</div>}

    {(phase === 'import' || phase === 'discarded') && <section className="ai-import-card"><div className="ai-upload-zone"><Upload /><h2>{phase === 'discarded' ? 'Draft đã được loại bỏ' : 'Import tài liệu đào tạo'}</h2><p>PPTX, PDF, DOCX, TXT hoặc Markdown · chưa parse binary trong Sprint này</p><label className="button button-primary">Chọn file<input type="file" accept={acceptedTypes} onChange={(event) => importFile(event.target.files?.[0])} /></label></div>{imported && <div className="ai-file-preview"><span><FileText /></span><div><strong>{imported.source.fileName}</strong><small>{formatSize(imported.source.fileSize)} · {imported.source.fileType || 'Document'} · Mock extraction</small></div><dl><div><dt>Estimated Modules</dt><dd>{imported.estimatedModules}</dd></div><div><dt>Estimated Lessons</dt><dd>{imported.estimatedLessons}</dd></div></dl><label className="cms-field ai-preset-select"><span>Preset</span><select value={preset} onChange={(event) => setPreset(event.target.value as AiPresetId)}><option value="product">Product Training</option><option value="sales">Sales Training</option><option value="campaign">Campaign Training</option></select></label><button type="button" className="button button-primary" onClick={process}>Tạo bản nháp AI <ArrowRight /></button></div>}</section>}

    {phase === 'processing' && <section className="ai-processing" aria-live="polite"><span className="ai-processing-icon"><LoaderCircle className="spin" /></span><span className="ui-eyebrow">Mock AI Processing</span><h2>{aiProcessingStages[stageIndex]}</h2><p>{imported?.source.fileName}</p><div className="ai-processing-track"><span style={{ width: `${((stageIndex + 1) / aiProcessingStages.length) * 100}%` }} /></div><ol>{aiProcessingStages.map((stage, index) => <li className={index < stageIndex ? 'done' : index === stageIndex ? 'active' : ''} key={stage}>{index < stageIndex ? <Check /> : <FileSearch />}{stage}</li>)}</ol></section>}

    {phase === 'failed' && <section className="ai-state-panel" role="alert"><AlertTriangle /><h2>Không thể tạo AI draft</h2><p>Mock failure không làm thay đổi Course hoặc source đã chọn.</p><button type="button" className="button button-primary" onClick={process}><RotateCcw /> Thử lại</button></section>}

    {phase === 'review' && draft && <><section className="ai-review-header"><div><span className="ui-eyebrow">{draft.preset} preset · confidence {draft.confidence}</span><input aria-label="Tên course" value={draft.title} onChange={(event) => changeDraft({ ...draft, title: event.target.value })} /><textarea aria-label="Mô tả course" value={draft.shortDescription} onChange={(event) => changeDraft({ ...draft, shortDescription: event.target.value })} /><label className="cms-field"><span>Learning objectives · mỗi dòng một mục</span><textarea value={draft.learningObjectives.join('\n')} onChange={(event) => changeDraft({ ...draft, learningObjectives: objectiveLines(event.target.value) })} /></label></div><div><span>{draft.modules.length} modules</span><span>{draft.modules.flatMap((module) => module.lessons).length} lessons</span><span>{draft.quiz.questions.length} quiz questions</span></div></section>
      <section className={`ai-validation-card ${validation?.status}`} aria-live="polite"><header><strong>{validation?.status === 'error' ? 'Validation Error' : validation?.status === 'warning' ? 'Ready with warnings' : 'Ready to approve'}</strong><span>{validation?.errors.length ?? 0} error · {validation?.warnings.length ?? 0} warning</span></header>{Boolean(validation?.errors.length) && <ul>{validation?.errors.map((issue) => <li key={issue.id}><strong>{issue.path}</strong>{issue.message}</li>)}</ul>}</section>
      <section className="ai-warning-review"><div className="section-heading compact"><div><span className="ui-eyebrow">Trainer verification</span><h2>Warnings cần review</h2></div></div>{draft.warnings.map((warning) => <label key={warning.id}><input type="checkbox" checked={warning.reviewed} onChange={(event) => changeDraft({ ...draft, warnings: draft.warnings.map((item) => item.id === warning.id ? { ...item, reviewed: event.target.checked } : item) })} /><span><strong>{warning.code}</strong>{warning.message}</span></label>)}</section>
      <AiReviewTree draft={draft} onChange={changeDraft} />
      <footer className="ai-review-actions"><button type="button" className="button button-secondary danger" onClick={() => setDiscardOpen(true)}>Discard Draft</button><button type="button" className="button button-secondary" onClick={restart}>Import lại</button><button type="button" className="button button-primary" disabled={validation?.status === 'error'} onClick={approve}><Sparkles /> Approve & tạo Course</button></footer></>}
  </section>
}
