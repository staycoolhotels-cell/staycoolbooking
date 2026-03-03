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
        <div className="relative w-full rounded-xl overflow-hidden group aspect-video">
          <AppImage
            src={images[selectedImageIndex].url}
            alt={images[selectedImageIndex].alt}
            className="w-full h-full"
            fill={true}
            objectFit="cover"
          />

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-card shadow-brand-md"
            aria-label="Previous image"
          >
            <Icon name="ChevronLeftIcon" size={24} className="text-foreground" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-card shadow-brand-md"
            aria-label="Next image"
          >
            <Icon name="ChevronRightIcon" size={24} className="text-foreground" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 px-4 py-2 bg-card/90 backdrop-blur-sm rounded-full text-sm font-heading font-semibold text-foreground">
            {selectedImageIndex + 1} / {images.length}
          </div>

          {/* Expand Button */}
          <button
            onClick={() => openLightbox(selectedImageIndex)}
            className="absolute bottom-4 left-4 px-4 py-2 bg-card/90 backdrop-blur-sm rounded-full flex items-center space-x-2 hover:bg-card transition-colors duration-200"
            aria-label="View full screen gallery"
          >
            <Icon name="ArrowsPointingOutIcon" size={20} className="text-foreground" />
            <span className="text-sm font-heading font-medium text-foreground">Expand</span>
          </button>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative w-full h-24 rounded-lg overflow-hidden transition-all duration-200 ${selectedImageIndex === index
                  ? 'ring-2 ring-primary scale-105'
                  : 'hover:scale-105 opacity-70 hover:opacity-100'
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
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-24 right-8 w-12 h-12 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-card transition-colors duration-200"
            aria-label="Close gallery"
          >
            <Icon name="XMarkIcon" size={24} className="text-foreground" />
          </button>

          <div className="relative w-full max-w-6xl h-[80vh]">
            <AppImage
              src={images[selectedImageIndex].url}
              alt={images[selectedImageIndex].alt}
              className="w-full h-full"
              fill={true}
              objectFit="contain"
            />

            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-card transition-colors duration-200 shadow-brand-md"
              aria-label="Previous image"
            >
              <Icon name="ChevronLeftIcon" size={28} className="text-foreground" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-card transition-colors duration-200 shadow-brand-md"
              aria-label="Next image"
            >
              <Icon name="ChevronRightIcon" size={28} className="text-foreground" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-card/90 backdrop-blur-sm rounded-full">
              <p className="text-sm font-heading font-semibold text-foreground">
                {selectedImageIndex + 1} / {images.length}
              </p>
              {images[selectedImageIndex].caption && (
                <p className="text-xs text-text-secondary mt-1">
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
