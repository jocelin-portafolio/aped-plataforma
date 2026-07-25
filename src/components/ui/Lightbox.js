'use client';

export default function Lightbox({
  isOpen,
  image,
  total,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}) {
  if (!isOpen || !image) return null;

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-label="Visor de imagen"
      onClick={onClose}
    >
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Cerrar visor">
          &times;
        </button>
        <button className="lightbox-prev" onClick={onPrev} aria-label="Imagen anterior">
          &#8249;
        </button>
        <img src={image.src} alt={image.alt} className="lightbox-img" />
        <button className="lightbox-next" onClick={onNext} aria-label="Siguiente imagen">
          &#8250;
        </button>
        <p className="lightbox-caption">
          {image.alt} &mdash; {currentIndex + 1} / {total}
        </p>
      </div>
    </div>
  );
}
