'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { Skeleton } from './LoadingSpinner';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: ReactNode;
  skeletonLines?: number;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

export function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  skeletonLines = 3,
  threshold = 0.1,
  onLoad,
  onError,
  priority = false,
  sizes = '100vw',
  loading = 'lazy'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [src, priority, threshold]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    console.error(`Failed to load image: ${src}`);
    setHasError(true);
    onError?.();
    
    // Попытка загрузить изображение повторно через 2 секунды
    setTimeout(() => {
      if (imgRef.current) {
        imgRef.current.src = src;
      }
    }, 2000);
  };

  // Если изображение загружается с ошибкой, показываем placeholder
  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-lg ${className}`}>
        {placeholder || (
          <div className="text-slate-400 text-center p-4">
            <div className="w-12 h-12 mx-auto mb-2 bg-slate-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm">Image failed to load</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden w-full h-full ${className}`}>
      {/* Skeleton Screen */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 z-10">
          <Skeleton lines={skeletonLines} className="h-full" />
        </div>
      )}

      {/* Placeholder до загрузки */}
      {!isInView && (
        <div className="absolute inset-0 z-10">
          {placeholder || <Skeleton lines={skeletonLines} className="h-full" />}
        </div>
      )}

      {/* Основное изображение */}
      {isInView && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={`w-full h-full transition-all duration-500 ease-out ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          sizes={sizes}
          loading={loading}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
}

// Компонент для lazy loading с blur placeholder
export function LazyImageWithBlur({
  src,
  alt,
  className = '',
  placeholderSrc,
  threshold = 0.1,
  onLoad,
  onError,
  priority = false
}: {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [priority, threshold]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-lg ${className}`}>
        <div className="text-slate-400 text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 bg-slate-200 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm">Image failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Blur placeholder */}
      {placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
            isLoaded ? 'opacity-0 scale-110 blur-xl' : 'opacity-100 scale-100 blur-sm'
          }`}
          style={{ filter: 'blur(20px)' }}
        />
      )}

      {/* Основное изображение */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`relative z-10 w-full h-full object-cover transition-all duration-700 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
}

// Компонент для lazy loading с прогресс-баром
export function LazyImageWithProgress({
  src,
  alt,
  className = '',
  onLoad,
  onError,
  priority = false
}: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [priority]);

  const handleImageLoad = () => {
    setProgress(100);
    setTimeout(() => {
      setIsLoaded(true);
      onLoad?.();
    }, 200);
  };

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  // Симуляция прогресса загрузки
  useEffect(() => {
    if (isInView && !isLoaded && !hasError) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isInView, isLoaded, hasError]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-lg ${className}`}>
        <div className="text-slate-400 text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 bg-slate-200 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm">Image failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Progress bar */}
      {!isLoaded && isInView && (
        <div className="absolute top-2 left-2 right-2 z-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-full p-1">
            <div className="bg-blue-500 h-1 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Skeleton */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 z-10">
          <Skeleton lines={3} className="h-full" />
        </div>
      )}

      {/* Основное изображение */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`transition-all duration-500 ease-out ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
}
