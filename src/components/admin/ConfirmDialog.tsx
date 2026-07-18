import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps { open: boolean; title: string; description: string; confirmLabel?: string; onCancel(): void; onConfirm(): void }

export function ConfirmDialog({ open, title, description, confirmLabel = 'Xóa', onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description"><span className="dialog-icon"><AlertTriangle /></span><h2 id="confirm-title">{title}</h2><p id="confirm-description">{description}</p><div className="dialog-actions"><button className="button button-secondary" autoFocus onClick={onCancel}>Hủy</button><button className="button button-danger" onClick={onConfirm}>{confirmLabel}</button></div></section></div>
}
