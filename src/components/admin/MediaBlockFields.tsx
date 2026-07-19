import { FileText, Image as ImageIcon, PlayCircle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import type { LessonBlock } from '../../types'
import type { MediaAsset, MediaKind } from '../../types/media'
import { MediaPicker } from './MediaPicker'

type MediaBlock = Extract<LessonBlock, { type: 'image' | 'video' | 'attachment' }>

function youtubeThumbnail(url: string): string {
  try {
    const parsed = new URL(url)
    const id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v')
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ''
  } catch { return '' }
}

function MediaPreview({ block }: { block: MediaBlock }) {
  if (block.type === 'image') return <div className="media-field-preview">{block.url ? <img src={block.url} alt={block.alt} /> : <span><ImageIcon />Chưa chọn ảnh</span>}</div>
  if (block.type === 'video') { const thumbnail = block.provider === 'youtube' ? youtubeThumbnail(block.url) : ''; return <div className="media-field-preview media-field-preview--video">{thumbnail ? <img src={thumbnail} alt="" /> : <span><PlayCircle />Chưa có thumbnail</span>}<strong>{block.durationMinutes} phút · {block.provider}</strong></div> }
  return <div className="media-file-preview"><FileText /><div><strong>{block.title}</strong><small>{block.url ? 'Tài liệu đã được liên kết' : 'Chưa chọn tài liệu'}</small></div></div>
}

export function MediaBlockFields({ block, update }: { block: MediaBlock; update(next: LessonBlock): void }) {
  const [pickerKind, setPickerKind] = useState<MediaKind | null>(null)
  const set = (values: Partial<MediaBlock>) => update({ ...block, ...values } as LessonBlock)
  const select = (asset: MediaAsset) => {
    if (block.type === 'image' && asset.kind === 'image') set({ url: asset.url, alt: asset.name })
    if (block.type === 'video' && asset.kind === 'video') set({ title: asset.name, url: asset.url, provider: asset.provider ?? 'direct', description: asset.description, durationMinutes: asset.durationMinutes ?? block.durationMinutes })
    if (block.type === 'attachment' && (asset.kind === 'pdf' || asset.kind === 'download')) set({ title: asset.name, url: asset.url, description: asset.description })
    setPickerKind(null)
  }

  return <>
    <MediaPreview block={block} />
    <button type="button" className="button button-secondary media-replace" onClick={() => setPickerKind(block.type === 'attachment' ? 'pdf' : block.type)}><RefreshCw />{block.url ? 'Thay thế từ Media Library' : 'Chọn từ Media Library'}</button>
    {block.type === 'image' && <div className="form-grid media-field-grid"><label className="cms-field"><span>Image URL</span><input value={block.url} onChange={(event) => set({ url: event.target.value })} /></label><label className="cms-field"><span>Alt text</span><input value={block.alt} onChange={(event) => set({ alt: event.target.value })} /></label><label className="cms-field full"><span>Chú thích</span><input value={block.caption ?? ''} onChange={(event) => set({ caption: event.target.value })} /></label><label className="cms-field"><span>Căn ảnh</span><select value={block.alignment ?? 'center'} onChange={(event) => set({ alignment: event.target.value as NonNullable<typeof block.alignment> })}><option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option></select></label><label className="cms-field"><span>Chiều rộng</span><select value={block.widthPercent ?? 100} onChange={(event) => set({ widthPercent: Number(event.target.value) as NonNullable<typeof block.widthPercent> })}><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option></select></label></div>}
    {block.type === 'video' && <div className="form-grid media-field-grid"><label className="cms-field full"><span>Tiêu đề</span><input value={block.title} onChange={(event) => set({ title: event.target.value })} /></label><label className="cms-field full"><span>Video URL (https)</span><input value={block.url} onChange={(event) => set({ url: event.target.value })} /></label><label className="cms-field"><span>Nguồn</span><select value={block.provider} onChange={(event) => set({ provider: event.target.value as typeof block.provider })}><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="direct">Direct URL</option></select></label><label className="cms-field"><span>Thời lượng (phút)</span><input type="number" min="0" value={block.durationMinutes} onChange={(event) => set({ durationMinutes: Math.max(0, Number(event.target.value)) })} /></label><label className="cms-field full"><span>Mô tả</span><textarea value={block.description} onChange={(event) => set({ description: event.target.value })} /></label><label className="cms-field full"><span>Transcript (tùy chọn)</span><textarea value={block.transcript ?? ''} onChange={(event) => set({ transcript: event.target.value })} /></label><label className="check-row full"><input type="checkbox" checked={block.required} onChange={(event) => set({ required: event.target.checked })} />Bắt buộc xem</label></div>}
    {block.type === 'attachment' && <div className="form-grid media-field-grid"><label className="cms-field full"><span>Tên tài liệu</span><input value={block.title} onChange={(event) => set({ title: event.target.value })} /></label><label className="cms-field full"><span>URL</span><input value={block.url} onChange={(event) => set({ url: event.target.value })} /></label><label className="cms-field full"><span>Mô tả</span><input value={block.description ?? ''} onChange={(event) => set({ description: event.target.value })} /></label></div>}
    {pickerKind && <MediaPicker initialKind={pickerKind} allowedKinds={block.type === 'attachment' ? ['pdf', 'download'] : [block.type]} onSelect={select} onClose={() => setPickerKind(null)} />}
  </>
}
