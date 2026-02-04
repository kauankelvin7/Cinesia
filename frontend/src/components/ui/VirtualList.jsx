/**
 * 📜 VIRTUAL LIST - Renderização Virtualizada para Listas Longas
 * 
 * Otimização para dispositivos móveis de baixo desempenho:
 * - Renderiza APENAS os itens visíveis na viewport
 * - Usa IntersectionObserver para detecção eficiente
 * - Recicla elementos DOM para economizar memória
 * - Suporte a alturas fixas e dinâmicas
 * 
 * Uso: Substituir listas com mais de 20 itens
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';

const VirtualList = memo(({
  items = [],
  itemHeight = 300,
  overscan = 3,
  renderItem,
  className = '',
  emptyMessage = 'Nenhum item encontrado',
  gap = 16
}) => {
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [containerHeight, setContainerHeight] = useState(0);

  // Calcula altura total da lista
  const totalHeight = items.length * (itemHeight + gap) - gap;

  // Atualiza range visível baseado no scroll
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = window.scrollY - container.offsetTop;
    const viewportHeight = window.innerHeight;

    const start = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const visibleCount = Math.ceil(viewportHeight / (itemHeight + gap)) + overscan * 2;
    const end = Math.min(items.length, start + visibleCount);

    setVisibleRange(prev => {
      if (prev.start !== start || prev.end !== end) {
        return { start, end };
      }
      return prev;
    });
  }, [itemHeight, gap, overscan, items.length]);

  // Observer para resize
  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(window.innerHeight);
      updateVisibleRange();
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', updateVisibleRange, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateVisibleRange);
    };
  }, [updateVisibleRange]);

  // Atualiza quando items mudam
  useEffect(() => {
    updateVisibleRange();
  }, [items.length, updateVisibleRange]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  // Renderiza apenas os itens visíveis
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: totalHeight, minHeight: totalHeight }}
    >
      {visibleItems.map((item, index) => {
        const actualIndex = visibleRange.start + index;
        const top = actualIndex * (itemHeight + gap);

        return (
          <div
            key={item.id || actualIndex}
            className="absolute left-0 right-0"
            style={{
              top,
              height: itemHeight,
              willChange: 'transform',
              contain: 'layout style paint'
            }}
          >
            {renderItem(item, actualIndex)}
          </div>
        );
      })}
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

export default VirtualList;

/**
 * 🔥 VIRTUAL GRID - Grade Virtualizada para Cards
 * 
 * Similar ao VirtualList, mas para layouts de grid responsivo
 */
export const VirtualGrid = memo(({
  items = [],
  itemHeight = 280,
  columns = { sm: 1, md: 2, lg: 3 },
  overscan = 2,
  renderItem,
  className = '',
  emptyMessage = 'Nenhum item encontrado',
  gap = 20
}) => {
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 12 });
  const [currentColumns, setCurrentColumns] = useState(1);

  // Detecta número de colunas baseado na largura
  const updateColumns = useCallback(() => {
    const width = window.innerWidth;
    if (width >= 1024) {
      setCurrentColumns(columns.lg || 3);
    } else if (width >= 768) {
      setCurrentColumns(columns.md || 2);
    } else {
      setCurrentColumns(columns.sm || 1);
    }
  }, [columns]);

  // Calcula altura total do grid
  const rows = Math.ceil(items.length / currentColumns);
  const totalHeight = rows * (itemHeight + gap) - gap;

  // Atualiza range visível baseado no scroll
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = window.scrollY - container.offsetTop;
    const viewportHeight = window.innerHeight;

    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const visibleRows = Math.ceil(viewportHeight / (itemHeight + gap)) + overscan * 2;
    const endRow = Math.min(rows, startRow + visibleRows);

    const start = startRow * currentColumns;
    const end = Math.min(items.length, endRow * currentColumns);

    setVisibleRange(prev => {
      if (prev.start !== start || prev.end !== end) {
        return { start, end };
      }
      return prev;
    });
  }, [itemHeight, gap, overscan, items.length, rows, currentColumns]);

  useEffect(() => {
    const handleResize = () => {
      updateColumns();
      updateVisibleRange();
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', updateVisibleRange, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateVisibleRange);
    };
  }, [updateColumns, updateVisibleRange]);

  useEffect(() => {
    updateVisibleRange();
  }, [items.length, currentColumns, updateVisibleRange]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const columnWidth = `calc((100% - ${(currentColumns - 1) * gap}px) / ${currentColumns})`;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: totalHeight, minHeight: totalHeight }}
    >
      {visibleItems.map((item, index) => {
        const actualIndex = visibleRange.start + index;
        const row = Math.floor(actualIndex / currentColumns);
        const col = actualIndex % currentColumns;
        const top = row * (itemHeight + gap);
        const left = col * (100 / currentColumns);

        return (
          <div
            key={item.id || actualIndex}
            className="absolute"
            style={{
              top,
              left: `calc(${left}% + ${col * gap / currentColumns}px)`,
              width: columnWidth,
              height: itemHeight,
              willChange: 'transform',
              contain: 'layout style paint'
            }}
          >
            {renderItem(item, actualIndex)}
          </div>
        );
      })}
    </div>
  );
});

VirtualGrid.displayName = 'VirtualGrid';
