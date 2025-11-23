
import React, { useEffect, useRef, useState } from 'react';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      
      const { clientX, clientY } = e;
      
      // Main circle follows with slight delay (css transition)
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
      }
      
      // Center dot follows instantly
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
      }
    };

    const handleMouseDown = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform += ' scale(0.8)';
        cursorRef.current.style.borderColor = '#ec4899'; // Pink on click
      }
    };

    const handleMouseUp = () => {
       if (cursorRef.current) {
        // We rely on the mousemove to reset the translation, 
        // but we reset the color/scale here conceptually or let CSS transition handle it
        cursorRef.current.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'auto';
    };
  }, [isVisible]);

  return (
    <>
      {/* Outer Ring */}
      <div 
        ref={cursorRef}
        className="fixed top-0 left-0 w-8 h-8 border border-white/50 rounded-full pointer-events-none z-[10000] hidden md:block transition-colors duration-200 ease-out mix-blend-difference"
        style={{ 
          marginLeft: '-16px', 
          marginTop: '-16px',
          transition: 'transform 0.15s ease-out, border-color 0.2s',
          opacity: isVisible ? 1 : 0
        }}
      />
      
      {/* Inner Dot */}
      <div 
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[10000] hidden md:block mix-blend-difference"
        style={{ 
          marginLeft: '-4px', 
          marginTop: '-4px',
          opacity: isVisible ? 1 : 0
        }}
      />

      <style>{`
        @media (max-width: 768px) {
          body { cursor: auto !important; }
        }
      `}</style>
    </>
  );
};

export default CustomCursor;
