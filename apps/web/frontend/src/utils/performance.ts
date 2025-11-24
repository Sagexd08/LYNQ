
import { useState, useEffect, useCallback, useRef } from 'react';


export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}


export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}


export const createLazyImageLoader = (
  fallbackSrc?: string,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return (img: HTMLImageElement) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          const src = image.dataset.src;

          if (src) {

            const tempImg = new Image();
            tempImg.onload = () => {
              image.src = src;
              image.classList.remove('opacity-0', 'blur-sm');
              image.classList.add('opacity-100');
            };
            tempImg.onerror = () => {
              if (fallbackSrc) {
                image.src = fallbackSrc;
                image.classList.remove('opacity-0', 'blur-sm');
                image.classList.add('opacity-100');
              }
            };
            tempImg.src = src;
          }

          observer.unobserve(image);
        }
      });
    }, defaultOptions);

    observer.observe(img);
    return () => observer.unobserve(img);
  };
};


export const PerformanceMonitor = {

  logMemoryUsage: () => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      if (memInfo) {
        console.group('🧠 Memory Usage');
        console.log(`Used: ${(memInfo.usedJSHeapSize / 1048576).toFixed(2)} MB`);
        console.log(`Total: ${(memInfo.totalJSHeapSize / 1048576).toFixed(2)} MB`);
        console.log(`Limit: ${(memInfo.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
        console.groupEnd();
      }
    }
  },


  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`❌ ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
      throw error;
    }
  },


  measureRender: (componentName: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎨 ${componentName} render: ${(end - start).toFixed(2)}ms`);
      }
    };
  }
};


export const useVirtualScroll = <T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  overscan = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    startIndex + Math.ceil(containerHeight / itemHeight) + overscan * 2
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    offsetY,
    setScrollTop,
    totalHeight,
    startIndex,
    endIndex
  };
};


export interface ResourceToPreload {
  type: 'image' | 'font' | 'script' | 'style';
  url: string;
  crossOrigin?: string;
}

export const preloadResources = async (resources: ResourceToPreload[]): Promise<void> => {
  const promises = resources.map(resource => {
    return new Promise<void>((resolve, reject) => {
      switch (resource.type) {
        case 'image': {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          if (resource.crossOrigin) img.crossOrigin = resource.crossOrigin;
          img.src = resource.url;
          break;
        }
        case 'font': {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'font';
          link.href = resource.url;
          link.crossOrigin = resource.crossOrigin || 'anonymous';
          link.onload = () => resolve();
          link.onerror = reject;
          document.head.appendChild(link);
          break;
        }
        case 'script': {
          const script = document.createElement('script');
          script.src = resource.url;
          script.onload = () => resolve();
          script.onerror = reject;
          if (resource.crossOrigin) script.crossOrigin = resource.crossOrigin;
          document.head.appendChild(script);
          break;
        }
        case 'style': {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = resource.url;
          link.onload = () => resolve();
          link.onerror = reject;
          document.head.appendChild(link);
          break;
        }
        default:
          reject(new Error(`Unknown resource type: ${(resource as any).type}`));
      }
    });
  });

  await Promise.allSettled(promises);
};


export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<Element | null>(null);

  const setElement = useCallback((element: Element | null) => {
    elementRef.current = element;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return { isIntersecting, entry, setElement };
};


export const useIdleCallback = (callback: () => void, deps: any[] = []) => {
  useEffect(() => {
    const hasRequestIdleCallback = typeof window !== 'undefined' && 'requestIdleCallback' in window;

    const handle = hasRequestIdleCallback ?
      requestIdleCallback(callback) :
      setTimeout(callback, 0);

    return () => {
      if (hasRequestIdleCallback) {
        cancelIdleCallback(handle as number);
      } else {
        clearTimeout(handle as number);
      }
    };
  }, deps);
};
