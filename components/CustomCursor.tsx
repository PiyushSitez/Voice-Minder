
import React, { useEffect, useRef, useState } from 'react';

interface Explosion {
  id: number;
  x: number;
  y: number;
}

const CustomCursor: React.FC = () => {
  const cursorOuterRef = useRef<HTMLDivElement>(null);
  const cursorInnerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  
  const mouse = useRef({ x: 0, y: 0 });
  const outerPos = useRef({ x: 0, y: 0 });
  const innerPos = useRef({ x: 0, y: 0 });

  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [explosions, setExplosions] = useState<Explosion[]>([]);

  // Cleanup explosions after animation
  useEffect(() => {
    if (explosions.length > 0) {
      const timer = setTimeout(() => {
        setExplosions((prev) => prev.slice(1));
      }, 800); // Match CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [explosions]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicking(true);
      const newExplosion = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY
      };
      setExplosions(prev => [...prev, newExplosion]);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if hovering over interactive elements
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        window.getComputedStyle(target).cursor === 'pointer';

      setIsHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseOver);
    
    document.body.style.cursor = 'none';

    // Animation Loop
    const animate = () => {
      // Linear Interpolation (LERP) for smooth trailing outer cursor
      // Increase 0.15 to make it faster, decrease to make it slower/smoother
      const ease = 0.2; 
      
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * ease;
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * ease;
      
      // Inner cursor is instant (or very fast lerp)
      innerPos.current.x = mouse.current.x;
      innerPos.current.y = mouse.current.y;

      if (cursorOuterRef.current) {
        cursorOuterRef.current.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0)`;
      }
      
      if (cursorInnerRef.current) {
        cursorInnerRef.current.style.transform = `translate3d(${innerPos.current.x}px, ${innerPos.current.y}px, 0)`;
      }

      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(requestRef.current);
      document.body.style.cursor = 'auto';
    };
  }, []);

  const colors = ['#f472b6', '#a78bfa', '#34d399', '#facc15', '#60a5fa'];

  return (
    <>
      {/* Outer Ring Wrapper (Handles Position) */}
      <div 
        ref={cursorOuterRef}
        className="fixed top-0 left-0 pointer-events-none z-[10000] hidden md:block"
        style={{ marginLeft: -16, marginTop: -16 }} // Center the 32x32 circle
      >
          {/* Visual Outer Ring (Handles Scale/Style) */}
          <div 
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-300 ease-out mix-blend-screen
              ${isHovering 
                ? 'scale-[2.5] bg-white/10 border-transparent shadow-[0_0_20px_rgba(255,255,255,0.3)] backdrop-blur-[1px]' 
                : 'scale-100 bg-transparent'
              }
              ${isClicking ? 'scale-[0.8]' : ''}
            `}
            style={{ 
              border: isHovering ? '1px solid rgba(255,255,255,0.2)' : '1.5px solid rgba(255, 255, 255, 0.6)',
            }}
          >
            {/* Inner Gradient Ring on Hover */}
            <div className={`absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 ${isHovering ? 'opacity-100' : ''} bg-gradient-to-r from-pink-500/30 to-purple-500/30 blur-sm`}></div>
          </div>
      </div>
      
      {/* Inner Dot Wrapper (Handles Position) */}
      <div 
        ref={cursorInnerRef}
        className="fixed top-0 left-0 pointer-events-none z-[10000] hidden md:block"
        style={{ marginLeft: -1, marginTop: -1 }} // Center (approx)
      >
          {/* Visual Inner Dot (Handles Scale/Color) */}
          <div 
            className={`
               rounded-full mix-blend-screen transition-all duration-200
               ${isHovering ? 'bg-pink-400 w-3 h-3 -ml-1.5 -mt-1.5 shadow-[0_0_10px_#ec4899]' : 'bg-white w-2 h-2 -ml-1 -mt-1'}
            `}
          />
      </div>

      {/* Click Explosions (Party Pooper) */}
      {explosions.map((expl) => (
        <div 
          key={expl.id}
          className="fixed pointer-events-none z-[9999]"
          style={{ left: expl.x, top: expl.y }}
        >
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) + Math.random() * 20; 
            const velocity = 30 + Math.random() * 40;
            const tx = Math.cos(angle * (Math.PI / 180)) * velocity;
            const ty = Math.sin(angle * (Math.PI / 180)) * velocity;
            const color = colors[i % colors.length];
            const size = 3 + Math.random() * 4;

            return (
              <div
                key={i}
                className="absolute rounded-full animate-cursor-explode"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}`,
                  '--tw-translate-x': `${tx}px`,
                  '--tw-translate-y': `${ty}px`,
                } as React.CSSProperties}
              ></div>
            );
          })}
        </div>
      ))}

      <style>{`
        @keyframes cursorExplode {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tw-translate-x)), calc(-50% + var(--tw-translate-y))) scale(0);
            opacity: 0;
          }
        }
        .animate-cursor-explode {
          animation: cursorExplode 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
        @media (max-width: 768px) {
          body { cursor: auto !important; }
        }
      `}</style>
    </>
  );
};

export default CustomCursor;
