import { File, Film, Image as ImageIcon, Music, RotateCcw } from 'lucide-react'
import { cn } from 'ui'

const MimeTypeIcon = ({ mimeType, size }: { mimeType?: string; size: number }) => {
  if (mimeType?.includes('image')) {
    return <ImageIcon size={size} className="text-foreground-lighter" />
  }
  if (mimeType?.includes('audio')) {
    return <Music size={size} className="text-foreground-lighter" />
  }
  if (mimeType?.includes('video')) {
    return <Film size={size} className="text-foreground-lighter" />
  }
  return <File size={size} className="text-foreground-lighter" />
}

interface VersionThumbnailProps {
  mimeType?: string
  isCurrent: boolean
  size?: number
}

/**
 * Type glyph for a version row. Noncurrent versions have no thumbnail of their
 * own so they share one; the current version gets a restore glyph instead.
 */
export const VersionThumbnail = ({ mimeType, isCurrent, size = 14 }: VersionThumbnailProps) => (
  <span
    className={cn(
      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
      isCurrent ? 'border-brand-400 bg-surface-200' : 'border-overlay bg-surface-100'
    )}
  >
    {isCurrent ? (
      <RotateCcw size={size} className="text-brand" />
    ) : (
      <MimeTypeIcon mimeType={mimeType} size={size} />
    )}
  </span>
)
