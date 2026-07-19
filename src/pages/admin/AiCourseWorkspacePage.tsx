import { ArrowRight, Check, FileSearch, FileText, LoaderCircle, ShieldCheck, Sparkles, Upload, WandSparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AiReviewTree } from '../../features/ai-authoring/AiReviewTree'
import { aiProcessingStages, buildCourseFromAiDraft, createMockAiDraft, estimateImport } from '../../features/ai-authoring/mockAiAuthoring'
import type { AiCourseDraft, AiImportedFile, AiImportPhase } from '../../features/ai-authoring/types'
import { contentService } from '../../services/contentService'

const acceptedTypes = '.pptx,.pdf,.docx,.txt,.md,.markdown'
const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

export function AiCourseWorkspacePage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<AiImportPhase>('import')
  const [file, setFile] = useState<AiImportedFile | null>(null)
  const [stageIndex, setStageIndex] = useState(0)
  const [draft, setDraft] = useState<AiCourseDraft | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (phase !== 'processing' || !file) return
    if (stageIndex >= aiProcessingStages.length - 1) {
      const timeout = window.setTimeout(() => { setDraft(createMockAiDraft(file)); setPhase('review') }, 550)
      return () => window.clearTimeout(timeout)
    }
    const timeout = window.setTimeout(() => setStageIndex((current) => current + 1), 550)
    return () => window.clearTimeout(timeout)
  }, [file, phase, stageIndex])

  const importFile = (selected?: File) => {
    if (!selected) return
    const extension = selected.name.split('.').pop()?.toLowerCase()
    if (!extension || !['pptx', 'pdf', 'docx', 'txt', 'md', 'markdown'].includes(extension)) { setNotice('Định dạng chưa được hỗ trợ. Chọn PPTX, PDF, DOCX, TXT hoặc Markdown.'); return }
    setFile(estimateImport(selected)); setDraft(null); setPhase('import'); setNotice('')
  }
  const process = () => { if (!file) return; setStageIndex(0); setPhase('processing'); setNotice('') }
  const approve = () => {
    if (!draft || !draft.title.trim() || !draft.modules.length || draft.modules.some((module) => !module.title.trim() || !module.lessons.length || module.lessons.some((lesson) => !lesson.title.trim() || !lesson.blocks.length))) { setNotice('Bản nháp cần có tên, module và lesson có nội dung trước khi approve.'); return }
    try {
      const course = buildCourseFromAiDraft(draft)
      contentService.upsertCourse(course)
      setPhase('approved')
      navigate(`/admin/courses/${course.id}/edit`, { replace: true })
    } catch { setNotice('Không thể tạo course. Dữ liệu hiện tại chưa bị thay đổi.') }
  }

  return <section className="ai-workspace"><header className="ai-workspace-hero"><div><span className="ui-eyebrow"><WandSparkles /> AI Course Authoring</span><h1>Biến tài liệu thành bản nháp khóa học</h1><p>Workspace mô phỏng quy trình AI để Trainer import, review và approve. Không có dữ liệu nào được gửi ra bên ngoài.</p></div><span className="ai-local-badge"><ShieldCheck /> Local mock · Không gọi AI API</span></header>

    <nav className="ai-stepper" aria-label="Quy trình AI Course"><span className={phase === 'import' ? 'active' : 'done'}>1. Import</span><span className={phase === 'processing' ? 'active' : phase === 'review' || phase === 'approved' ? 'done' : ''}>2. Preview</span><span className={phase === 'review' ? 'active' : phase === 'approved' ? 'done' : ''}>3. Review</span><span className={phase === 'approved' ? 'active' : ''}>4. Approve</span></nav>

    {notice && <div className="builder-notice" role="alert">{notice}</div>}

    {phase === 'import' && <section className="ai-import-card"><div className="ai-upload-zone"><Upload /><h2>Import tài liệu đào tạo</h2><p>PPTX, PDF, DOCX, TXT hoặc Markdown · xử lý mock ngay trong trình duyệt</p><label className="button button-primary">Chọn file<input type="file" accept={acceptedTypes} onChange={(event) => importFile(event.target.files?.[0])} /></label></div>{file && <div className="ai-file-preview"><span><FileText /></span><div><strong>{file.name}</strong><small>{formatSize(file.size)} · {file.type || 'Document'}</small></div><dl><div><dt>Estimated Modules</dt><dd>{file.estimatedModules}</dd></div><div><dt>Estimated Lessons</dt><dd>{file.estimatedLessons}</dd></div></dl><button type="button" className="button button-primary" onClick={process}>Tạo bản nháp AI <ArrowRight /></button></div>}</section>}

    {phase === 'processing' && <section className="ai-processing" aria-live="polite"><span className="ai-processing-icon"><LoaderCircle className="spin" /></span><span className="ui-eyebrow">Mock AI Processing</span><h2>{aiProcessingStages[stageIndex]}</h2><p>{file?.name}</p><div className="ai-processing-track"><span style={{ width: `${((stageIndex + 1) / aiProcessingStages.length) * 100}%` }} /></div><ol>{aiProcessingStages.map((stage, index) => <li className={index < stageIndex ? 'done' : index === stageIndex ? 'active' : ''} key={stage}>{index < stageIndex ? <Check /> : <FileSearch />}{stage}</li>)}</ol></section>}

    {phase === 'review' && draft && <><section className="ai-review-header"><div><span className="ui-eyebrow">Mock AI Output</span><input aria-label="Tên course" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /><textarea aria-label="Mô tả course" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></div><div><span>{draft.modules.length} modules</span><span>{draft.modules.flatMap((module) => module.lessons).length} lessons</span><span>3 quiz questions</span></div></section><AiReviewTree draft={draft} onChange={setDraft} /><footer className="ai-review-actions"><button type="button" className="button button-secondary" onClick={() => { setPhase('import'); setDraft(null) }}>Import lại</button><button type="button" className="button button-primary" onClick={approve}><Sparkles /> Approve & tạo Course</button></footer></>}
  </section>
}
