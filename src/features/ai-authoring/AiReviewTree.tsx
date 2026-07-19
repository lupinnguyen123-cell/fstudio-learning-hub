import { GitMerge, Scissors, Trash2 } from 'lucide-react'
import type { AiCourseDraft } from './types'

interface AiReviewTreeProps { draft: AiCourseDraft; onChange(draft: AiCourseDraft): void }

export function AiReviewTree({ draft, onChange }: AiReviewTreeProps) {
  const updateModule = (moduleIndex: number, title: string) => onChange({ ...draft, modules: draft.modules.map((module, index) => index === moduleIndex ? { ...module, title } : module) })
  const deleteModule = (moduleIndex: number) => onChange({ ...draft, modules: draft.modules.filter((_, index) => index !== moduleIndex) })
  const updateLesson = (moduleIndex: number, lessonIndex: number, title: string) => onChange({ ...draft, modules: draft.modules.map((module, index) => index === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, childIndex) => childIndex === lessonIndex ? { ...lesson, title } : lesson) } : module) })
  const deleteLesson = (moduleIndex: number, lessonIndex: number) => onChange({ ...draft, modules: draft.modules.map((module, index) => index === moduleIndex ? { ...module, lessons: module.lessons.filter((_, childIndex) => childIndex !== lessonIndex) } : module) })
  const mergeLesson = (moduleIndex: number, lessonIndex: number) => onChange({ ...draft, modules: draft.modules.map((module, index) => {
    if (index !== moduleIndex || lessonIndex === 0) return module
    const previous = module.lessons[lessonIndex - 1]; const current = module.lessons[lessonIndex]
    return { ...module, lessons: module.lessons.map((lesson, childIndex) => childIndex === lessonIndex - 1 ? { ...previous, title: `${previous.title} & ${current.title}`, blocks: [...previous.blocks, ...current.blocks] } : lesson).filter((_, childIndex) => childIndex !== lessonIndex) }
  }) })
  const splitLesson = (moduleIndex: number, lessonIndex: number) => onChange({ ...draft, modules: draft.modules.map((module, index) => {
    if (index !== moduleIndex) return module
    const source = module.lessons[lessonIndex]; const pivot = Math.max(1, Math.ceil(source.blocks.length / 2))
    const second = { ...source, id: `${source.id}-split-${Date.now()}`, title: `${source.title} · Phần 2`, blocks: source.blocks.slice(pivot) }
    const first = { ...source, title: `${source.title} · Phần 1`, blocks: source.blocks.slice(0, pivot) }
    return { ...module, lessons: [...module.lessons.slice(0, lessonIndex), first, second, ...module.lessons.slice(lessonIndex + 1)] }
  }) })

  return <div className="ai-review-tree">{draft.modules.map((module, moduleIndex) => <article className="ai-module-card" key={module.id}><header><span>Module {moduleIndex + 1}</span><input aria-label={`Tên module ${moduleIndex + 1}`} value={module.title} onChange={(event) => updateModule(moduleIndex, event.target.value)} /><button type="button" className="icon-button danger" aria-label={`Xóa module ${module.title}`} onClick={() => deleteModule(moduleIndex)}><Trash2 /></button></header><div className="ai-lessons">{module.lessons.map((lesson, lessonIndex) => <section className="ai-lesson-card" key={lesson.id}><div className="ai-lesson-heading"><span>Lesson {lessonIndex + 1}</span><input aria-label={`Tên lesson ${lessonIndex + 1} của module ${moduleIndex + 1}`} value={lesson.title} onChange={(event) => updateLesson(moduleIndex, lessonIndex, event.target.value)} /><div><button type="button" className="icon-button" aria-label={`Merge ${lesson.title}`} disabled={lessonIndex === 0} onClick={() => mergeLesson(moduleIndex, lessonIndex)}><GitMerge /></button><button type="button" className="icon-button" aria-label={`Split ${lesson.title}`} onClick={() => splitLesson(moduleIndex, lessonIndex)}><Scissors /></button><button type="button" className="icon-button danger" aria-label={`Xóa lesson ${lesson.title}`} onClick={() => deleteLesson(moduleIndex, lessonIndex)}><Trash2 /></button></div></div><div className="ai-block-list">{lesson.blocks.map((item) => <span key={item.id}><small>{item.type}</small>{item.text}</span>)}</div></section>)}</div></article>)}</div>
}
