'use client';

import { useState, useEffect, useRef, ReactNode, Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from './LoadingSpinner';

interface LazyComponentProps {
  children: ReactNode;
  className?: string;
  skeletonLines?: number;
  threshold?: number;
  onLoad?: () => void;
  placeholder?: ReactNode;
  fallback?: ReactNode;
  delay?: number;
}

export function LazyComponent({
  children,
  className = '',
  skeletonLines = 3,
  threshold = 0.1,
  onLoad,
  placeholder,
  fallback,
  delay = 0
}: LazyComponentProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '100px'
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
  }, [threshold]);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
        onLoad?.();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isInView, delay, onLoad]);

  return (
    <div ref={containerRef} className={className}>
      {!isInView && (
        <div className="animate-pulse">
          {placeholder || <Skeleton lines={skeletonLines} />}
        </div>
      )}

      {isInView && !isLoaded && (
        <div className="animate-pulse">
          {placeholder || <Skeleton lines={skeletonLines} />}
        </div>
      )}

      {isInView && isLoaded && (
        <div className="animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

// HOC для создания lazy компонентов
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  options: {
    skeletonLines?: number;
    threshold?: number;
    delay?: number;
    placeholder?: ReactNode;
  } = {}
) {
  const LazyWrapper = (props: T) => (
    <LazyComponent
      skeletonLines={options.skeletonLines}
      threshold={options.threshold}
      delay={options.delay}
      placeholder={options.placeholder}
    >
      <Component {...props} />
    </LazyComponent>
  );

  LazyWrapper.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return LazyWrapper;
}

// Компонент для lazy loading с динамическим импортом
export function DynamicLazyComponent<T extends object>({
  importFunc,
  props,
  className = '',
  skeletonLines = 3,
  threshold = 0.1,
  placeholder,
  fallback
}: {
  importFunc: () => Promise<{ default: ComponentType<T> }>;
  props: T;
  className?: string;
  skeletonLines?: number;
  threshold?: number;
  placeholder?: ReactNode;
  fallback?: ReactNode;
}) {
  const [Component, setComponent] = useState<ComponentType<T> | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [threshold]);

  useEffect(() => {
    if (isInView && !Component && !isLoading) {
      setIsLoading(true);
      importFunc()
        .then((module) => {
          setComponent(() => module.default);
        })
        .catch((error) => {
          console.error('Failed to load component:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isInView, Component, isLoading, importFunc]);

  return (
    <div ref={containerRef} className={className}>
      {!isInView && (
        <div className="animate-pulse">
          {placeholder || <Skeleton lines={skeletonLines} />}
        </div>
      )}

      {isInView && isLoading && (
        <div className="animate-pulse">
          {placeholder || <Skeleton lines={skeletonLines} />}
        </div>
      )}

      {isInView && Component && (
        <Suspense fallback={fallback || <Skeleton lines={skeletonLines} />}>
          <Component {...props} />
        </Suspense>
      )}
    </div>
  );
}

// Компонент для lazy loading с предзагрузкой
export function PreloadableLazyComponent<T extends object>({
  importFunc,
  props,
  className = '',
  skeletonLines = 3,
  threshold = 0.1,
  placeholder,
  preloadDistance = 200
}: {
  importFunc: () => Promise<{ default: ComponentType<T> }>;
  props: T;
  className?: string;
  skeletonLines?: number;
  threshold?: number;
  placeholder?: ReactNode;
  preloadDistance?: number;
}) {
  const [Component, setComponent] = useState<ComponentType<T> | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: `${preloadDistance}px`
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
  }, [threshold, preloadDistance]);

  useEffect(() => {
    if (isInView && !isPreloaded) {
      setIsPreloaded(true);
      importFunc()
        .then((module) => {
          setComponent(() => module.default);
        })
        .catch((error) => {
          console.error('Failed to preload component:', error);
        });
    }
  }, [isInView, isPreloaded, importFunc]);

  return (
    <div ref={containerRef} className={className}>
      {!isInView && (
        <div className="animate-pulse">
          {placeholder || <Skeleton lines={skeletonLines} />}
        </div>
      )}

      {isInView && !Component && (
        <div className="animate-pulse">
          {placeholder || <Skeleton lines={skeletonLines} />}
        </div>
      )}

      {isInView && Component && (
        <Suspense fallback={placeholder || <Skeleton lines={skeletonLines} />}>
          <Component {...props} />
        </Suspense>
      )}
    </div>
  );
}

// Утилита для создания lazy компонентов
export function createLazyComponent<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  options: {
    skeletonLines?: number;
    threshold?: number;
    delay?: number;
    placeholder?: ReactNode;
  } = {}
) {
  return function LazyComponentWrapper(props: T) {
    return (
      <DynamicLazyComponent
        importFunc={importFunc}
        props={props}
        skeletonLines={options.skeletonLines}
        threshold={options.threshold}
        placeholder={options.placeholder}
      />
    );
  };
}
