import React, { useEffect, useRef, useState } from 'react';

/**
 * Horizontally scrollable table wrapper.
 * Uses native scrollbar on mobile, and a synced fixed-bottom scrollbar on desktop.
 */
const ScrollableTableWrapper = ({ children, className = '' }) => {
  const containerRef = useRef(null);
  const scrollbarRef = useRef(null);
  const isSyncing = useRef(false); // shared flag to prevent scroll event loops
  const [contentWidth, setContentWidth] = useState(0);
  const [leftOffset, setLeftOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      setContentWidth(container.scrollWidth);
      setIsMobile(window.innerWidth < 768);

      const sidebar = document.querySelector('aside');
      const offset = sidebar ? sidebar.getBoundingClientRect().right : 0;
      setLeftOffset(Math.max(0, offset));
    };

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);

    const sidebar = document.querySelector('aside');
    if (sidebar) resizeObserver.observe(sidebar);

    window.addEventListener('resize', update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Sync: table → bottom scrollbar
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onContainerScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      if (scrollbarRef.current) {
        scrollbarRef.current.scrollLeft = container.scrollLeft;
      }
      isSyncing.current = false;
    };

    container.addEventListener('scroll', onContainerScroll, { passive: true });
    return () => container.removeEventListener('scroll', onContainerScroll);
  }, []);

  // Sync: bottom scrollbar → table
  useEffect(() => {
    const scrollbar = scrollbarRef.current;
    if (!scrollbar) return;

    const onScrollbarScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      if (containerRef.current) {
        containerRef.current.scrollLeft = scrollbar.scrollLeft;
      }
      isSyncing.current = false;
    };

    scrollbar.addEventListener('scroll', onScrollbarScroll, { passive: true });
    return () => scrollbar.removeEventListener('scroll', onScrollbarScroll);
  }, [contentWidth, isMobile]);

  const needsScroll = contentWidth > 0 && containerRef.current
    ? contentWidth > containerRef.current.clientWidth
    : false;

  return (
    <>
      <div
        ref={containerRef}
        className={`${className}`}
        style={{
          overflowX: isMobile ? 'auto' : 'auto',
          overflowY: 'visible',
          // Hide native scrollbar on desktop (we show our custom one at the bottom)
          ...(isMobile ? {} : {
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }),
        }}
      >
        {children}
      </div>

      {/* Fixed scrollbar at bottom of viewport — desktop only */}
      {needsScroll && !isMobile && (
        <div
          ref={scrollbarRef}
          style={{
            position: 'fixed',
            bottom: 0,
            left: `${leftOffset}px`,
            right: 0,
            height: '14px',
            overflowX: 'auto',
            overflowY: 'hidden',
            zIndex: 1000,
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
          }}
        >
          {/* Ghost element that matches the table's scroll width */}
          <div style={{ width: `${contentWidth}px`, height: '1px' }} />
        </div>
      )}
    </>
  );
};

export default ScrollableTableWrapper;
