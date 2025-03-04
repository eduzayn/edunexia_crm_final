import { useState, useEffect, useCallback, useRef } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
  mobile?: boolean;
}

interface VirtualItem {
  index: number;
  offsetTop: number;
  height: number;
}

export function useVirtualization<T>(
  items: T[],
  { itemHeight, overscan = 3, containerHeight, mobile = false }: VirtualizationOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calcular itens visíveis
  const getVisibleItems = useCallback((): VirtualItem[] => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return Array.from({ length: endIndex - startIndex + 1 }, (_, index) => ({
      index: startIndex + index,
      offsetTop: (startIndex + index) * itemHeight,
      height: itemHeight,
    }));
  }, [scrollTop, itemHeight, overscan, containerHeight, items.length]);

  // Atualizar scroll com debounce
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    setIsScrolling(true);
    setScrollTop(containerRef.current.scrollTop);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150); // Debounce de 150ms
  }, []);

  // Suporte a gestos móveis
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    const startScrollTop = containerRef.current?.scrollTop || 0;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaY = touch.clientY - startY;
      if (containerRef.current) {
        containerRef.current.scrollTop = startScrollTop - deltaY;
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, []);

  // Adicionar listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    if (mobile) {
      container.addEventListener('touchstart', handleTouchStart);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (mobile) {
        container.removeEventListener('touchstart', handleTouchStart);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, handleTouchStart, mobile]);

  // Calcular altura total da lista
  const totalHeight = items.length * itemHeight;

  return {
    containerRef,
    virtualItems: getVisibleItems(),
    totalHeight,
    scrollTop,
    isScrolling,
  };
} 