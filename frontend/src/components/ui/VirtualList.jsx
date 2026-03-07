/**
 * 📜 VIRTUAL LIST & GRID
 * * Renderização virtualizada de alta performance.
 * - Otimizado para GPU (Transform vs Top)
 * - Fade-in suave na entrada de itens
 * - Containment estrito para economia de CPU
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const totalHeight = items.length * (itemHeight + gap) - gap;

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = window.scrollY - containerRef.current.offsetTop;
    const viewportHeight = window.innerHeight;

    const start = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const visibleCount = Math.ceil(viewportHeight / (itemHeight + gap)) + overscan * 2;
    const end = Math.min(items.length, start + visibleCount);

    setVisibleRange(prev => (prev.start !== start || prev.end !== end ? { start, end } : prev));
  }, [itemHeight, gap, overscan, items.length]);

  useEffect(() => {
    window.addEventListener('scroll', updateVisibleRange, { passive: true });
    window.addEventListener('resize', updateVisibleRange, { passive: true });
    updateVisibleRange();
    return () => {
      window.removeEventListener('scroll', updateVisibleRange);
      window.removeEventListener('resize', updateVisibleRange);
    };
  }, [updateVisibleRange]);

  if (items.length === 0) {
    return <div className="flex items-center justify-center py-20 text-slate-400 font-medium italic">{emptyMessage}</div>;
  }

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className={`relative will-change-transform ${className}`}
      style={{ height: totalHeight, minHeight: totalHeight, contain: 'layout' }}
    >
      {visibleItems.map((item, index) => {
        const actualIndex = visibleRange.start + index;
        const translateY = actualIndex * (itemHeight + gap);

        return (
          <div
            key={item.id || actualIndex}
            className="absolute left-0 right-0"
            style={{
              transform: `translateY(${translateY}px)`,
              height: itemHeight,
              willChange: 'transform',
              contain: 'strict'
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {renderItem(item, actualIndex)}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
});

/* ─── VIRTUAL GRID PREMIUM ─── */
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

  const updateColumns = useCallback(() => {
    const width = window.innerWidth;
    if (width >= 1024) setCurrentColumns(columns.lg || 3);
    else if (width >= 768) setCurrentColumns(columns.md || 2);
    else setCurrentColumns(columns.sm || 1);
  }, [columns]);

  const rowsCount = Math.ceil(items.length / currentColumns);
  const totalHeight = rowsCount * (itemHeight + gap) - gap;

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = window.scrollY - containerRef.current.offsetTop;
    const viewportHeight = window.innerHeight;

    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const visibleRows = Math.ceil(viewportHeight / (itemHeight + gap)) + (overscan * 2);
    const endRow = Math.min(rowsCount, startRow + visibleRows);

    setVisibleRange({
      start: startRow * currentColumns,
      end: Math.min(items.length, endRow * currentColumns)
    });
  }, [itemHeight, gap, overscan, items.length, rowsCount, currentColumns]);

  useEffect(() => {
    const handleEvents = () => { updateColumns(); updateVisibleRange(); };
    window.addEventListener('scroll', handleEvents, { passive: true });
    window.addEventListener('resize', handleEvents, { passive: true });
    handleEvents();
    return () => {
      window.removeEventListener('scroll', handleEvents);
      window.removeEventListener('resize', handleEvents);
    };
  }, [updateColumns, updateVisibleRange]);

  if (items.length === 0) {
    return <div className="flex items-center justify-center py-20 text-slate-400 font-medium italic">{emptyMessage}</div>;
  }

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const colWidthPct = 100 / currentColumns;

  return (
    <div
      ref={containerRef}
      className={`relative will-change-transform ${className}`}
      style={{ height: totalHeight, minHeight: totalHeight, contain: 'layout' }}
    >
      {visibleItems.map((item, index) => {
        const actualIndex = visibleRange.start + index;
        const row = Math.floor(actualIndex / currentColumns);
        const col = actualIndex % currentColumns;
        
        const translateY = row * (itemHeight + gap);
        // Cálculo preciso de X para evitar gaps de 1px
        const translateX = `calc(${col * colWidthPct}% + ${col * gap / currentColumns}px)`;
        const width = `calc(${colWidthPct}% - ${(currentColumns - 1) * gap / currentColumns}px)`;

        return (
          <div
            key={item.id || actualIndex}
            className="absolute top-0 left-0"
            style={{
              width,
              height: itemHeight,
              transform: `translate3d(${translateX}, ${translateY}px, 0)`,
              willChange: 'transform',
              contain: 'strict'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              {renderItem(item, actualIndex)}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
});

export default VirtualList;