import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const MAX_VISIBLE = 3

export default function ImageGrid({ images }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [loaded, setLoaded] = useState({})

  if (!images || images.length === 0) return null

  const visible = images.slice(0, MAX_VISIBLE)
  const remaining = images.length - MAX_VISIBLE
  const showMore = remaining > 0

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const goNext = useCallback(() => {
    setLightboxIndex(prev => (prev + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setLightboxIndex(prev => (prev - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxOpen, goNext, goPrev])

  const handleImageLoad = (idx) => {
    setLoaded(prev => ({ ...prev, [idx]: true }))
  }

  const handleImgError = (idx) => {
    setLoaded(prev => ({ ...prev, [idx]: 'error' }))
  }

  const gridClass = visible.length === 1
    ? 'img-grid-single'
    : visible.length === 2
      ? 'img-grid-pair'
      : 'img-grid-multi'

  return (
    <>
      <div className={`img-grid ${gridClass}`}>
        {visible.map((img, idx) => (
          <div key={idx} className="img-grid-cell" onClick={() => openLightbox(idx)}>
            {!loaded[idx] && <div className="img-skeleton" />}
            {loaded[idx] === 'error' ? null : (
              <img
                src={img.url}
                alt={img.alt}
                loading="lazy"
                className={`img-grid-img ${loaded[idx] ? 'loaded' : ''}`}
                onLoad={() => handleImageLoad(idx)}
                onError={() => handleImgError(idx)}
              />
            )}
            {showMore && idx === MAX_VISIBLE - 1 && (
              <div className="img-more-overlay">
                <span className="img-more-text">+{remaining} more</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}><X size={20} /></button>
            {images.length > 1 && (
              <>
                <button className="lightbox-nav lightbox-prev" onClick={goPrev}><ChevronLeft size={24} /></button>
                <button className="lightbox-nav lightbox-next" onClick={goNext}><ChevronRight size={24} /></button>
              </>
            )}
            <img
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].alt}
              className="lightbox-img"
            />
            <div className="lightbox-counter">
              {lightboxIndex + 1} / {images.length}
            </div>
            {images[lightboxIndex].alt && (
              <div className="lightbox-caption">{images[lightboxIndex].alt}</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
