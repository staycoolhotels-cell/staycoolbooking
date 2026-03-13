'use client';

import React, { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface PropertyImage {
  id: number;
  url: string;
  alt: string;
  caption?: string;
}

interface PropertyGalleryProps {
  images: PropertyImage[];
  propertyName: string;
}

const PropertyGallery = ({ images, propertyName: _propertyName }: PropertyGalleryProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <div className="w-full h-[500px] bg-muted rounded-xl animate-pulse"></div>;
  }

  const handlePrevious = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  return (
    <>
      <div className="w-full">
        {/* Main Image */}
        <div className="relative w-full rounded-3xl overflow-hidden group aspect-[16/9] shadow-2xl shadow-black/50 border border-white/5">
          <AppImage
            src={images[selectedImageIndex].url}
            alt={images[selectedImageIndex].alt}
            className="w-full h-full transform transition-transform duration-700 ease-in-out group-hover:scale-105"
            fill={true}
            objectFit="cover"
          />

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 hover:scale-110"
            aria-label="Previous image"
          >
            <Icon name="ChevronLeftIcon" size={24} className="text-white drop-shadow-md" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 hover:scale-110"
            aria-label="Next image"
          >
            <Icon name="ChevronRightIcon" size={24} className="text-white drop-shadow-md" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/40 backdrop-blur-lg border border-white/10 rounded-full text-xs font-semibold tracking-wider text-white uppercase drop-shadow-sm">
            {selectedImageIndex + 1} / {images.length}
          </div>

          {/* Expand Button */}
          <button
            onClick={() => openLightbox(selectedImageIndex)}
            className="absolute bottom-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-lg border border-white/10 rounded-full flex items-center space-x-2 hover:bg-black/60 transition-all duration-300 group/expand"
            aria-label="View full screen gallery"
          >
            <Icon name="ArrowsPointingOutIcon" size={18} className="text-white group-hover/expand:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-white">Expand</span>
          </button>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-5 gap-3 mt-4">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative w-full aspect-video rounded-xl overflow-hidden transition-all duration-300 ${selectedImageIndex === index
                ? 'ring-2 ring-blue-500 scale-[1.02] shadow-lg shadow-blue-500/20'
                : 'hover:scale-105 hover:ring-1 hover:ring-white/20 opacity-50 hover:opacity-100'
                }`}
            >
              <AppImage
                src={image.url}
                alt={image.alt}
                className="w-full h-full"
                fill={true}
                objectFit="cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-8 right-8 w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all duration-300"
            aria-label="Close gallery"
          >
            <Icon name="XMarkIcon" size={28} className="text-white" />
          </button>

          <div className="relative w-full max-w-7xl h-[85vh]">
            <AppImage
              src={images[selectedImageIndex].url}
              alt={images[selectedImageIndex].alt}
              className="w-full h-full drop-shadow-2xl"
              fill={true}
              objectFit="contain"
            />

            <button
              onClick={handlePrevious}
              className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all duration-300"
              aria-label="Previous image"
            >
              <Icon name="ChevronLeftIcon" size={32} className="text-white" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all duration-300"
              aria-label="Next image"
            >
              <Icon name="ChevronRightIcon" size={32} className="text-white" />
            </button>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-center">
              <p className="text-sm font-semibold tracking-widest text-white uppercase">
                {selectedImageIndex + 1} / {images.length}
              </p>
              {images[selectedImageIndex].caption && (
                <p className="text-sm text-zinc-400 mt-2 font-medium">
                  {images[selectedImageIndex].caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyGallery;
