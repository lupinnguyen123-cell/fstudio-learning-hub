import type { VideoProvider } from './index'

export type MediaKind = 'image' | 'video' | 'pdf' | 'download'

export interface MediaAsset {
  id: string
  kind: MediaKind
  name: string
  category: string
  tags: string[]
  url: string
  thumbnailUrl?: string
  durationMinutes?: number
  provider?: VideoProvider
  description: string
  recent: boolean
}
