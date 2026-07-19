import { Check, Download, FileDown, FileText, Image as ImageIcon, PlayCircle, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { mediaAssets, mediaCategories } from '../../data/mediaAssets'
import type { MediaAsset, MediaKind } from '../../types/media'

const tabs: Array<{ kind: MediaKind; label: string }> = [
  { kind: 'image', label: 'Images' },
  { kind: 'video', label: 'Videos' },
  { kind: 'pdf', label: 'PDF' },
  { kind: 'download', label: 'Downloads' },
]

interface MediaPickerProps {
  initialKind?: MediaKind
  allowedKinds?: MediaKind[]
  onSelect(asset: MediaAsset): void
  onClose(): void
}

export function MediaPicker({ initialKind = 'image', allowedKinds = tabs.map((tab) => tab.kind), onSelect, onClose }: MediaPickerProps) {
  const availableTabs = tabs.filter((tab) => allowedKinds.includes(tab.kind))
  const [kind, setKind] = useState<MediaKind>(allowedKinds.includes(initialKind) ? initialKind : availableTabs[0]?.kind ?? 'image')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [recentOnly, setRecentOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    return mediaAssets.filter((asset) => asset.kind === kind && (category === 'all' || asset.category === category) && (!recentOnly || asset.recent) && (!normalized || [asset.name, asset.category, ...asset.tags].some((value) => value.toLocaleLowerCase('vi').includes(normalized))))
  }, [category, kind, query, recentOnly])
  const selected = mediaAssets.find((asset) => asset.id === selectedId)

  return <div className="media-picker" role="dialog" aria-modal="true" aria-labelledby="media-picker-title">
    <button type="button" className="media-picker-backdrop" aria-label="Đóng Media Library" onClick={onClose} />
    <section className="media-picker-dialog">
      <header><div><span className="ui-eyebrow">Asset Library</span><h2 id="media-picker-title">Chọn media</h2></div><button type="button" className="icon-button" aria-label="Đóng" onClick={onClose}><X /></button></header>
      <nav className="media-tabs" aria-label="Loại media">{availableTabs.map((tab) => <button type="button" key={tab.kind} className={kind === tab.kind ? 'active' : ''} onClick={() => { setKind(tab.kind); setSelectedId(null) }}>{tab.label}</button>)}</nav>
      <div className="media-toolbar"><label className="media-search"><Search aria-hidden="true" /><span className="sr-only">Tìm asset</span><input value={query} placeholder="Tìm theo tên, category hoặc tag" onChange={(event) => setQuery(event.target.value)} /></label><label className="cms-field"><span className="sr-only">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Tất cả category</option>{mediaCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><button type="button" className={`button button-secondary ${recentOnly ? 'active' : ''}`} aria-pressed={recentOnly} onClick={() => setRecentOnly(!recentOnly)}>Recent</button></div>
      <div className="media-grid">{results.map((asset) => <button type="button" className={`media-card ${selectedId === asset.id ? 'selected' : ''}`} key={asset.id} onClick={() => setSelectedId(asset.id)}>{asset.kind === 'image' && <img src={asset.url} alt="" />}{asset.kind === 'video' && (asset.thumbnailUrl ? <img src={asset.thumbnailUrl} alt="" /> : <span className="media-card-placeholder"><PlayCircle /></span>)}{asset.kind === 'pdf' && <span className="media-card-placeholder"><FileText /><small>PDF preview</small></span>}{asset.kind === 'download' && <span className="media-card-placeholder"><FileDown /><small>Download</small></span>}<span className="media-card-copy"><strong>{asset.name}</strong><small>{asset.category}{asset.durationMinutes ? ` · ${asset.durationMinutes} phút` : ''}</small></span>{selectedId === asset.id && <span className="media-card-check"><Check /></span>}</button>)}</div>
      {!results.length && <div className="media-empty"><ImageIcon /><strong>Không tìm thấy asset</strong><span>Thử từ khóa hoặc category khác.</span></div>}
      {selected && <aside className="media-selection"><div><strong>{selected.name}</strong><span>{selected.description}</span></div><div className="media-selection-actions">{(selected.kind === 'pdf' || selected.kind === 'download') && <><a className="button button-secondary" href={selected.url} target="_blank" rel="noreferrer">Mở</a><a className="button button-secondary" href={selected.url} download><Download /> Tải xuống</a></>}<button type="button" className="button button-primary" onClick={() => onSelect(selected)}>Xong · Chèn asset</button></div></aside>}
    </section>
  </div>
}
