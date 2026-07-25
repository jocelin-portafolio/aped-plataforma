'use client';

import { useLightbox } from '@/hooks/useLightbox';
import { Lightbox } from '@/components/ui';
import { galleryImages } from '@/config/gallery';

export default function GalleryGrid() {
  const { currentIndex, isOpen, open, close, goNext, goPrev } = useLightbox(galleryImages.length);

  return (
    <>
      <div className="gallery-grid" role="list">
        {galleryImages.map((img, i) => (
          <button
            key={img.src}
            className="gallery-item"
            role="listitem"
            onClick={() => open(i)}
            aria-label={`Ver imagen ampliada: ${img.alt}`}
          >
            <img src={img.src} alt={img.alt} loading="lazy" />
          </button>
        ))}
      </div>

      <Lightbox
        isOpen={isOpen}
        image={isOpen ? galleryImages[currentIndex] : null}
        total={galleryImages.length}
        currentIndex={currentIndex ?? 0}
        onClose={close}
        onPrev={goPrev}
        onNext={goNext}
      />
    </>
  );
}
