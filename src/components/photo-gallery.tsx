"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoGalleryProps {
  photos: string[];
  alt: string;
}

export function PhotoGallery({ photos, alt }: PhotoGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openGallery = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeGallery = () => {
    setIsOpen(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
  };

  if (photos.length === 0) return null;

  return (
    <>
      <div className="mb-8">
        {photos.length > 1 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {photos.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt={`${alt} ${i + 1}`}
                className={`w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${
                  i === 0 ? "h-48 md:h-56 col-span-2 row-span-2" : "h-24 md:h-28"
                }`}
                onClick={() => openGallery(i)}
                data-testid={i === 0 ? "img-property-main" : `img-property-${i + 1}`}
              />
            ))}
          </div>
        ) : (
          <img
            src={photos[0]}
            alt={alt}
            className="w-full h-64 md:h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openGallery(0)}
            data-testid="img-property-main"
          />
        )}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeGallery}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          data-testid="photo-gallery-lightbox"
        >
          <button
            className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white font-medium transition-colors"
            onClick={(e) => { e.stopPropagation(); closeGallery(); }}
            data-testid="button-close-gallery"
          >
            <X className="h-5 w-5" />
            <span>Close</span>
          </button>

          {photos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-14 h-14 bg-white/10 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                data-testid="button-gallery-prev"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-14 h-14 bg-white/10 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                data-testid="button-gallery-next"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <img
            src={photos[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
            data-testid="img-gallery-current"
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white font-medium">
            {currentIndex + 1} of {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
