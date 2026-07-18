export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const normalizedValue = Math.min(100, Math.max(0, value))
  return <div className="progress-wrap">{label && <div className="progress-label"><span>{label}</span><strong>{normalizedValue}%</strong></div>}<div className="progress-track" role="progressbar" aria-label={label ?? 'Tiến độ'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalizedValue}><span style={{ width: `${normalizedValue}%` }} /></div></div>
}
