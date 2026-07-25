'use client';

import { useState, useCallback } from 'react';

export function useLightbox(totalItems) {
  const [currentIndex, setCurrentIndex] = useState(null);

  const open = useCallback((index) => setCurrentIndex(index), []);
  const close = useCallback(() => setCurrentIndex(null), []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  return {
    currentIndex,
    isOpen: currentIndex !== null,
    open,
    close,
    goNext,
    goPrev,
  };
}
