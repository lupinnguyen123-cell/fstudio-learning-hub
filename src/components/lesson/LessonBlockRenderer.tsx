import { useMemo, useState } from 'react'
import { AlertTriangle, Award, Check, Download, HelpCircle, Image as ImageIcon, Lightbulb, PlaySquare, RotateCcw, Sparkles } from 'lucide-react'
import type { LessonBlock } from '../../types'

function isRenderableBlock(block: LessonBlock): boolean {
  const value = block as unknown as Record<string, unknown>
  if (!value || typeof value.type !== 'string') return false
  if (['bullet_list', 'checklist', 'sorting'].includes(block.type)) return Array.isArray(value.items)
  if (['quick_question', 'multiple_choice', 'multi_select', 'scenario'].includes(block.type)) return Array.isArray(value.options)
  if (block.type === 'flashcard') return Array.isArray(value.cards)
  if (block.type === 'dialogue') return Array.isArray(value.lines)
  if (block.type === 'matching') return Array.isArray(value.pairs)
  return true
}

function safeEmbed(url: string, provider: 'youtube' | 'vimeo' | 'direct') {
  try { const parsed = new URL(url); if (provider === 'youtube') { const id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v'); return id ? `https://www.youtube-nocookie.com/embed/${id}` : null } if (provider === 'vimeo') { const id = parsed.pathname.split('/').filter(Boolean).pop(); return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null } return parsed.protocol === 'https:' ? parsed.toString() : null } catch { return null }
}
function ChoiceActivity({ block }: { block: Extract<LessonBlock, { type: 'quick_question' | 'multiple_choice' | 'multi_select' }> }) {
  const [selected, setSelected] = useState<string[]>([]); const [checked, setChecked] = useState(false); const multiple = block.type === 'multi_select'
  const toggle = (id: string) => { setChecked(false); setSelected((items) => multiple ? items.includes(id) ? items.filter((item) => item !== id) : [...items, id] : [id]) }
  const correct = block.options.every((option) => option.correct === selected.includes(option.id))
  return <section className="interactive-block"><span className="block-kicker"><HelpCircle />{block.type === 'quick_question' ? 'Câu hỏi nhanh' : 'Tương tác'}</span><h2>{block.question}</h2><div className="activity-options">{block.options.map((option) => <label key={option.id} className={selected.includes(option.id) ? 'selected' : ''}><input type={multiple ? 'checkbox' : 'radio'} name={block.id} checked={selected.includes(option.id)} onChange={() => toggle(option.id)} />{option.text}</label>)}</div><button className="button button-primary" type="button" disabled={!selected.length} onClick={() => setChecked(true)}>Kiểm tra</button>{checked && <div className={`activity-feedback ${correct ? 'correct' : 'incorrect'}`} role="status"><strong>{correct ? 'Chính xác!' : 'Chưa chính xác'}</strong><p>{correct ? block.options.filter((item) => item.correct).map((item) => item.feedback).join(' ') : block.options.find((item) => selected.includes(item.id))?.feedback}</p><p>{block.explanation}</p></div>}</section>
}
function Flashcards({ block }: { block: Extract<LessonBlock, { type: 'flashcard' }> }) { const [index, setIndex] = useState(0); const [flipped, setFlipped] = useState(false); const card = block.cards[index]; if (!card) return null; return <section className="interactive-block"><span className="block-kicker">Flashcard · {index + 1}/{block.cards.length}</span><h2>{block.title}</h2><button type="button" className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>{card.imageUrl && <img src={card.imageUrl} alt="" />}<strong>{flipped ? card.back : card.front}</strong><small>Chạm để lật</small></button><div className="inline-actions"><button className="button button-secondary" disabled={index === 0} onClick={() => { setIndex(index - 1); setFlipped(false) }}>Trước</button><button className="button button-secondary" disabled={index === block.cards.length - 1} onClick={() => { setIndex(index + 1); setFlipped(false) }}>Sau</button></div></section> }
function Sorting({ block }: { block: Extract<LessonBlock, { type: 'sorting' }> }) { const [items, setItems] = useState(() => [...block.items].reverse()); const [result, setResult] = useState(''); const move = (index: number, delta: number) => { const next = [...items]; const target = index + delta; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setItems(next); setResult('') }; return <section className="interactive-block"><span className="block-kicker">Sắp xếp</span><h2>{block.prompt}</h2><ol className="sorting-list">{items.map((item, index) => <li key={item.id}><span>{item.text}</span><span><button aria-label={`Di chuyển ${item.text} lên`} onClick={() => move(index, -1)}>↑</button><button aria-label={`Di chuyển ${item.text} xuống`} onClick={() => move(index, 1)}>↓</button></span></li>)}</ol><button className="button button-primary" onClick={() => setResult(items.every((item, index) => item.id === block.items[index]?.id) ? block.feedback : 'Thứ tự chưa đúng, hãy thử lại.')}>Kiểm tra</button>{result && <p role="status" className="activity-feedback">{result}</p>}</section> }
function Matching({ block }: { block: Extract<LessonBlock, { type: 'matching' }> }) { const shuffled = useMemo(() => [...block.pairs].reverse(), [block.pairs]); const [answers, setAnswers] = useState<Record<string, string>>({}); const [checked, setChecked] = useState(false); const correct = block.pairs.every((pair) => answers[pair.id] === pair.right); return <section className="interactive-block"><span className="block-kicker">Matching · Experimental</span><h2>{block.prompt}</h2>{block.pairs.map((pair) => <label className="matching-row" key={pair.id}><span>{pair.left}</span><select value={answers[pair.id] ?? ''} onChange={(event) => { setChecked(false); setAnswers({ ...answers, [pair.id]: event.target.value }) }}><option value="">Chọn cặp</option>{shuffled.map((item) => <option key={item.id} value={item.right}>{item.right}</option>)}</select></label>)}<button className="button button-primary" onClick={() => setChecked(true)}>Kiểm tra</button>{checked && <p role="status" className="activity-feedback">{correct ? block.feedback : 'Một số cặp chưa chính xác.'}</p>}</section> }

export function LessonBlockRenderer({ block }: { block: LessonBlock }) {
  if (!isRenderableBlock(block)) return <section className="invalid-block" role="note"><AlertTriangle /><div><strong>Nội dung chưa sẵn sàng</strong><p>Block này thiếu dữ liệu cần thiết. Vui lòng báo Trainer kiểm tra lại.</p></div></section>
  switch (block.type) {
    case 'heading': return block.level === 2 ? <h2>{block.text}</h2> : <h3>{block.text}</h3>
    case 'paragraph': return <p>{block.text}</p>
    case 'image': return <figure className="lesson-image">{block.url ? <img src={block.url} alt={block.alt} /> : <div className="media-placeholder"><ImageIcon /><span>Chưa có hình ảnh</span></div>}<figcaption>{block.caption}</figcaption></figure>
    case 'video': { const embed = safeEmbed(block.url, block.provider); return <figure className="video-block"><h2>{block.title}</h2>{embed ? block.provider === 'direct' ? <video controls preload="metadata" src={embed}>Trình duyệt không hỗ trợ video.</video> : <iframe src={embed} title={block.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <div className="media-placeholder"><PlaySquare /><span>Video URL chưa hợp lệ hoặc không tải được.</span></div>}<figcaption>{block.description} · {block.durationMinutes} phút{block.required ? ' · Bắt buộc xem' : ''}</figcaption>{block.transcript && <details><summary>Transcript</summary><p>{block.transcript}</p></details>}</figure> }
    case 'bullet_list': return <section className="content-panel"><h2>{block.title}</h2><ul>{block.items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section>
    case 'quote': return <blockquote><p>{block.text}</p>{block.attribution && <cite>{block.attribution}</cite>}</blockquote>
    case 'divider': return <hr />
    case 'key_point': case 'warning': { const Icon = block.type === 'warning' ? AlertTriangle : Lightbulb; return <section className={`learning-block ${block.type}`}><Icon /><div><h2>{block.title}</h2><p>{block.text}</p></div></section> }
    case 'attachment': return <a className="attachment-block" href={block.url} target="_blank" rel="noreferrer"><Download /><span><strong>{block.title}</strong><small>{block.description}</small></span></a>
    case 'quick_question': case 'multiple_choice': case 'multi_select': return <ChoiceActivity block={block} />
    case 'true_false': return <ChoiceActivity block={{ id: block.id, type: 'multiple_choice', question: block.question, options: [{ id: 'true', text: 'Đúng', correct: block.correct, feedback: block.correct ? block.correctFeedback : block.incorrectFeedback }, { id: 'false', text: 'Sai', correct: !block.correct, feedback: !block.correct ? block.correctFeedback : block.incorrectFeedback }], explanation: block.explanation }} />
    case 'flashcard': return <Flashcards block={block} />
    case 'checklist': return <section className="interactive-block"><h2>{block.title}</h2>{block.items.map((item) => <label className="check-row" key={item.id}><input type="checkbox" />{item.text}</label>)}</section>
    case 'scenario': return <section className="interactive-block scenario"><span className="block-kicker">Tình huống tư vấn</span><h2>{block.context}</h2><blockquote>{block.customerQuote}</blockquote><ChoiceActivity block={{ id: block.id, type: 'multiple_choice', question: 'Bạn sẽ phản hồi thế nào?', options: block.options.map((item) => ({ id: item.id, text: item.text, correct: item.recommended, feedback: item.feedback })), explanation: block.explanation }} /></section>
    case 'dialogue': return <section className="content-panel"><h2>{block.title}</h2>{block.lines.map((line, index) => <p key={`${line.speaker}-${index}`}><strong>{line.speaker}:</strong> {line.text}</p>)}</section>
    case 'sorting': return <Sorting block={block} />
    case 'matching': return <Matching block={block} />
    case 'xp_reward': return <aside className="reward-block"><Sparkles /><strong>+{block.amount} XP</strong><span>{block.message}</span></aside>
    case 'badge_reward': return <aside className="reward-block"><Award /><strong>Badge</strong><span>{block.message}</span></aside>
    case 'completion_message': return <aside className="reward-block"><Check /><strong>{block.title}</strong><span>{block.message}</span></aside>
    case 'module_challenge': return <section className="learning-block key_point"><RotateCcw /><div><h2>{block.title}</h2><p>{block.description}</p></div></section>
    case 'unlock_condition': return <p className="unlock-note">🔒 {block.description}</p>
  }
}
