import { useState, useEffect, useCallback, useRef } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

interface VirtualItem {
  index: number;
  offsetTop: number;
  height: number;
}

export function useVirtualization<T>(
  items: T[],
  { itemHeight, overscan = 3, containerHeight }: VirtualizationOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Atualizar scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Adicionar listener de scroll
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Calcular altura total da lista
  const totalHeight = items.length * itemHeight;

  return {
    containerRef,
    virtualItems: getVisibleItems(),
    totalHeight,
    scrollTop,
  };
} 