/**
 * Captures a frame of a video file as a JPEG blob, entirely client-side (#130) — no
 * server-side ffmpeg. Best-effort: resolves null on any failure/timeout so the caller
 * can still upload the video without a thumbnail.
 */
export function captureVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    const url = URL.createObjectURL(file)

    let settled = false
    const finish = (result: Blob | null) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      URL.revokeObjectURL(url)
      resolve(result)
    }

    const timeout = setTimeout(() => finish(null), 5000)

    video.onloadeddata = () => {
      // A hair past 0 avoids an all-black first frame with some codecs.
      video.currentTime = Math.min(0.1, video.duration || 0)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx || canvas.width === 0 || canvas.height === 0) return finish(null)
      ctx.drawImage(video, 0, 0)
      canvas.toBlob((blob) => finish(blob), 'image/jpeg', 0.8)
    }
    video.onerror = () => finish(null)

    video.src = url
  })
}
