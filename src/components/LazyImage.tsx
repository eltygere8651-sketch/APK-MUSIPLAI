import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_MUSIC_COVER } from '../lib/constants';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  onImageError?: (e: any, setSrc: (url: string) => void) => void;
  wrapperClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, fallbackSrc, className, wrapperClassName, alt, onImageError, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentSrc(src);
    setError(false);
    setIsLoaded(false);
  }, [src]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName || ''}`} ref={imgRef}>
      {!isLoaded && isVisible && !error && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}
      {isVisible && (
        <img
          src={error ? (fallbackSrc || DEFAULT_MUSIC_COVER) : currentSrc}
          alt={alt}
          className={`${className || ''} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            if (onImageError && !error) {
               let updated = false;
               onImageError(e, (newSrc) => {
                 updated = true;
                 setCurrentSrc(newSrc);
                 setError(false);
                 setIsLoaded(false);
               });
               if (!updated) {
                 setError(true);
                 setIsLoaded(true);
               }
            } else {
              setError(true);
              setIsLoaded(true);
            }
          }}
          {...props}
        />
      )}
    </div>
  );
};
