'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface AppImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

const AppImage = (props: AppImageProps) => {
  const {
    src: srcProp,
    fallbackSrc: fallbackSrcProp,
    alt = 'image',
    fill,
    sizes,
    className = '',
    style,
    objectFit,
    width: imageWidthProp,
    height: imageHeightProp,
    onError,
    ...otherProps
  } = props;

  // Be explicit about the fallback source, preventing it from ever being undefined.
  const fallbackSrc = fallbackSrcProp || '/assets/images/no_image.png';

  const [isError, setIsError] = useState(false);

  // Reset error state if the main src prop changes.
  useEffect(() => {
    setIsError(false);
  }, [srcProp]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!isError) {
      setIsError(true);
    }
    if (onError) {
      onError(e);
    }
  };

  // Determine the final source. If the provided src is falsy (null, undefined, ''),
  // or if an error has occurred, use the fallback.
  let finalSrc = srcProp;
  if (isError || !finalSrc) {
    finalSrc = fallbackSrc;
  }

  const finalImageProps: any = {
    ...otherProps,
    src: finalSrc,
    alt,
    className: `${className} ${otherProps.onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${objectFit ? `object-${objectFit}` : ''}`,
    onError: handleError,
    ...(fill
      ? {
          fill: true,
          sizes: sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
          style: { ...style, objectFit: objectFit || 'cover' },
        }
      : { width: imageWidthProp || 400, height: imageHeightProp || 300 }),
  };

  if (finalImageProps.unoptimized === undefined) {
    finalImageProps.unoptimized = false;
  }

  // Force unoptimized for Dicebear images (SVGs) to avoid hostname issues and optimization overhead
  if (typeof finalImageProps.src === 'string' && finalImageProps.src.includes('api.dicebear.com')) {
    finalImageProps.unoptimized = true;
  }

  if (fill) {
    delete finalImageProps.width;
    delete finalImageProps.height;
  }

  // Final safeguard. If after all this logic, src is STILL not a valid string,
  // render nothing to prevent Next.js from crashing. This should be impossible now.
  if (typeof finalImageProps.src !== 'string' || !finalImageProps.src) {
    return null;
  }

  return <Image {...finalImageProps} />;
};

export default AppImage;
