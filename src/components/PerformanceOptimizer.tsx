'use client';

import { ReactNode, useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';

// Компонент для виртуализации списков
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = ''
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor(scrollTop / itemHeight) + visibleCount + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Компонент для бесконечной прокрутки
interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
  className?: string;
}

export function InfiniteScroll<T>({
  items,
  renderItem,
  onLoadMore,
  hasMore,
  loading,
  threshold = 100,
  className = ''
}: InfiniteScrollProps<T>) {
  const observerRef = useRef<IntersectionObserver>();
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, loading]);

  return (
    <div className={className}>
      {items.map((item, index) => renderItem(item, index))}
      
      {hasMore && (
        <div ref={loadingRef} className="py-4 text-center">
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-slate-600">Loading more...</span>
            </div>
          ) : (
            <div className="h-4" /> // Невидимый элемент для триггера
          )}
        </div>
      )}
    </div>
  );
}

// Компонент для отложенной загрузки
interface DeferredComponentProps {
  children: ReactNode;
  delay?: number;
  fallback?: ReactNode;
  className?: string;
}

export function DeferredComponent({
  children,
  delay = 100,
  fallback,
  className = ''
}: DeferredComponentProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
}

// Компонент для условного рендеринга
interface ConditionalRenderProps {
  condition: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function ConditionalRender({
  condition,
  children,
  fallback,
  className = ''
}: ConditionalRenderProps) {
  if (condition) {
    return <div className={className}>{children}</div>;
  }

  return fallback ? <div className={className}>{fallback}</div> : null;
}

// HOC для мемоизации компонентов
export function withMemo<T extends object>(
  Component: React.ComponentType<T>,
  propsAreEqual?: (prevProps: T, nextProps: T) => boolean
) {
  return memo(Component, propsAreEqual);
}

// Компонент для оптимизации изображений
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  sizes = '100vw',
  priority = false,
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

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
    <img
      src={src}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      sizes={sizes}
      priority={priority}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
});

// Компонент для оптимизации списков
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  virtualized?: boolean;
  itemHeight?: number;
  containerHeight?: number;
}

export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className = '',
  virtualized = false,
  itemHeight = 100,
  containerHeight = 400
}: OptimizedListProps<T>) {
  const memoizedRenderItem = useCallback(
    (item: T, index: number) => renderItem(item, index),
    [renderItem]
  );

  if (virtualized) {
    return (
      <VirtualizedList
        items={items}
        renderItem={memoizedRenderItem}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)}>
          {memoizedRenderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// Компонент для оптимизации форм
interface OptimizedFormProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
  debounceMs?: number;
}

export function OptimizedForm({
  children,
  onSubmit,
  className = '',
  debounceMs = 300
}: OptimizedFormProps) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onSubmit(e);
      }, debounceMs);
    },
    [onSubmit, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}

// Утилита для создания оптимизированных компонентов
export function createOptimizedComponent<T extends object>(
  Component: React.ComponentType<T>,
  options: {
    memo?: boolean;
    propsAreEqual?: (prevProps: T, nextProps: T) => boolean;
  } = {}
) {
  let OptimizedComponent = Component;

  if (options.memo) {
    OptimizedComponent = memo(Component, options.propsAreEqual);
  }

  return OptimizedComponent;
}
