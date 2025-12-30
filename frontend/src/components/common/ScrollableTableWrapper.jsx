import React, { useEffect, useRef, useState } from 'react';

/**
 * Simple and efficient horizontally scrollable table wrapper
 * with a fixed scrollbar at the bottom of the viewport
 */
const ScrollableTableWrapper = ({ children, className = '' }) => {
  const containerRef = useRef(null);
  const scrollbarRef = useRef(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [leftOffset, setLeftOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId = null;
    let isScrolling = false;

    // Detect if scrolling is needed and measure sidebar offset
    const updateScrollState = () => {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      setNeedsScroll(hasOverflow);

      // Check if mobile device (hide scrollbar on mobile)
      const isMobileDevice = window.innerWidth < 768; // Tailwind md breakpoint
      setIsMobile(isMobileDevice);

      // Measure sidebar offset
      const sidebar = document.querySelector('aside');
      const offset = sidebar ? sidebar.getBoundingClientRect().right : 0;
      setLeftOffset(Math.max(0, offset));

      // Update scrollbar content width if scrollbar exists
      if (hasOverflow && scrollbarRef.current) {
        const content = scrollbarRef.current.querySelector('.scrollbar-track');
        if (content) {
          content.style.width = `${container.scrollWidth}px`;
        }
      }
    };

    // Sync scroll positions
    const syncFromContainer = () => {
      if (isScrolling || !scrollbarRef.current) return;
      isScrolling = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      animationFrameId = requestAnimationFrame(() => {
        if (scrollbarRef.current) {
          scrollbarRef.current.scrollLeft = container.scrollLeft;
        }
        isScrolling = false;
      });
    };

    // Initial check
    updateScrollState();

    // Re-check when container becomes visible
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Container is now visible, re-check scroll state
          setTimeout(updateScrollState, 50);
        }
      });
    }, { threshold: 0.1 });
    intersectionObserver.observe(container);

    // Setup resize observer
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    const sidebar = document.querySelector('aside');
    if (sidebar) resizeObserver.observe(sidebar);

    // Event listeners
    container.addEventListener('scroll', syncFromContainer, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener('scroll', syncFromContainer);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  // Separate effect for scrollbar sync (only when it exists and not on mobile)
  useEffect(() => {
    if (!needsScroll || isMobile || !scrollbarRef.current) return;

    const scrollbar = scrollbarRef.current;
    let isScrolling = false;

    const syncFromScrollbar = () => {
      if (isScrolling || !containerRef.current) return;
      isScrolling = true;
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = scrollbar.scrollLeft;
        }
        isScrolling = false;
      });
    };

    scrollbar.addEventListener('scroll', syncFromScrollbar, { passive: true });

    return () => {
      scrollbar.removeEventListener('scroll', syncFromScrollbar);
    };
  }, [needsScroll, isMobile]);

  return (
    <>
      {/* Main scrollable container */}
      <div
        ref={containerRef}
        className={`scroll-container-hidden ${className}`}
        style={{
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {children}
      </div>

      {/* Fixed scrollbar at bottom of viewport (hidden on mobile) */}
      {needsScroll && !isMobile && (
        <div
          ref={scrollbarRef}
          className="fixed-horizontal-scrollbar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: `${leftOffset}px`,
            right: 0,
            height: '20px',
            overflowX: 'auto',
            overflowY: 'hidden',
            zIndex: 1000,
            backgroundColor: '#f3f4f6',
            borderTop: '2px solid #3b82f6',
            boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'left 0.3s ease'
          }}
        >
          <div className="scrollbar-track" style={{ height: '1px' }} />
        </div>
      )}
    </>
  );
};

export default ScrollableTableWrapper;
