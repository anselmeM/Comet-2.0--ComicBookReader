import React, { useEffect, useState, useRef } from 'react';

interface BlobImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  blob: Blob;
  width?: number;
  height?: number;
  onLoadError?: () => void;
}

/**
 * An image component that takes a Blob, creates an Object URL only when in view,
 * and manages its lifecycle. Uses IntersectionObserver for efficiency.
 */
export function BlobImage({ 
  blob, 
  width, 
  height, 
  onLoadError, 
  className, 
  style, 
  alt = 'Comic page', 
  ...props 
}: BlobImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '800px' } // Load well before coming into view for smoother scroll
    );

    const currentImg = imgRef.current;
    if (currentImg) {
      observer.observe(currentImg);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || !blob) return;

    const url = URL.createObjectURL(blob);
    // Use timeout to avoid cascading renders warning in some lints
    const timeout = setTimeout(() => setObjectUrl(url), 0);

    return () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
    };
  }, [blob, isInView]);

  return (
    <div 
      className={`relative w-full overflow-hidden ${!objectUrl ? 'animate-pulse bg-neutral-800' : ''} ${className}`}
      style={{ 
        aspectRatio: `${width}/${height}`,
        ...style 
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={objectUrl ?? undefined}
        alt={alt}
        className={`w-full h-full object-contain transition-opacity duration-300 ${objectUrl ? 'opacity-100' : 'opacity-0'}`}
        onError={onLoadError}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
