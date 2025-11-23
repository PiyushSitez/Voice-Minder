
import React, { useEffect, useRef } from 'react';
import { Mic, Clock, ShieldCheck, Zap, ArrowRight, Headphones, Smartphone } from 'lucide-react';
import Pricing from './Pricing';
import { PlanConfig } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onSelectPlan: (plan: PlanConfig) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onSelectPlan }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();

  // Canvas Star Background Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const stars: Star[] = [];
    const BASE_STARS = 400; // Initial stars

    class Star {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fade: boolean; // If true, star fades out (for trail)

      constructor(x: number, y: number, isTrail: boolean = false) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random();
        this.fade = isTrail;
        
        if(isTrail) {
            this.size = Math.random() * 1.5;
            this.speedX = (Math.random() - 0.5) * 2; // Move faster
            this.speedY = (Math.random() - 0.5) * 2;
            this.opacity = 1;
        }
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around screen for base stars
        if (!this.fade) {
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
            
            // Twinkle effect
            this.opacity += (Math.random() - 0.5) * 0.05;
            if (this.opacity < 0.2) this.opacity = 0.2;
            if (this.opacity > 1) this.opacity = 1;
        } else {
            // Trail stars fade out and die
            this.opacity -= 0.015;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize base stars
    for (let i = 0; i < BASE_STARS; i++) {
      stars.push(new Star(Math.random() * width, Math.random() * height));
    }

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      
      // Update and draw stars
      for (let i = 0; i < stars.length; i++) {
        stars[i].update();
        stars[i].draw();
        
        // Remove dead trail stars
        if (stars[i].fade && stars[i].opacity <= 0) {
            stars.splice(i, 1);
            i--;
        }
      }
      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    // Add stars on mouse move
    const handleMouseMove = (e: MouseEvent) => {
        // Add 3 stars per move event for density
        for(let i=0; i<3; i++) {
            stars.push(new Star(e.clientX, e.clientY, true));
        }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Reveal animation logic
  useEffect(() => {
    const reveal = () => {
      const reveals = document.querySelectorAll(".reveal");
      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
          reveals[i].classList.add("active");
        }
      }
    };
    window.addEventListener("scroll", reveal);
    reveal(); 
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  // Magnetic/Parallax Effect for Title
  const handleMouseMoveTitle = (e: React.MouseEvent) => {
    if (!titleRef.current) return;
    
    // Only enable tilt on desktop
    if (window.innerWidth < 768) return;
    
    const { left, top, width, height } = titleRef.current.getBoundingClientRect();
    const x = (e.clientX - (left + width / 2)) / 20; 
    const y = (e.clientY - (top + height / 2)) / 20;

    titleRef.current.style.transform = `perspective(1000px) rotateX(${-y}deg) rotateY(${x}deg) translateZ(20px)`;
  };

  const handleMouseLeaveTitle = () => {
    if (titleRef.current) {
        titleRef.current.style.transform = `perspective(1000px) rotateX(0) rotateY(0) translateZ(0)`;
    }
  };

  return (
    <div className="text-white overflow-x-hidden bg-black relative w-full">
      
      {/* INTERACTIVE CANVAS BACKGROUND */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      ></canvas>

      {/* Hero Section */}
      <section 
        className="relative flex flex-col items-center justify-center min-h-[85vh] md:min-h-screen w-full pt-20 pb-10"
        onMouseMove={handleMouseMoveTitle}
        onMouseLeave={handleMouseLeaveTitle}
      >
        {/* Deep Space Gradients Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/30 via-black/50 to-black z-0 pointer-events-none"></div>
        
        {/* Subtle Color Blobs - Hidden on very small screens to save performance/space */}
        <div className="hidden sm:block absolute top-[20%] left-[20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-900/10 rounded-full blur-[100px] animate-blob z-0 mix-blend-screen"></div>
        <div className="hidden sm:block absolute bottom-[20%] right-[20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-900/10 rounded-full blur-[100px] animate-blob animation-delay-2000 z-0 mix-blend-screen"></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center perspective-1000 flex flex-col items-center">
          
          {/* Magnetic Title */}
          <div 
            className="transition-transform duration-100 ease-out mb-6 md:mb-8 w-full max-w-5xl"
            style={{ transformStyle: 'preserve-3d' }}
          >
             <h1 
                ref={titleRef}
                className="font-extrabold tracking-tighter leading-tight transition-transform duration-100 ease-out cursor-default drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] text-center"
                style={{ willChange: 'transform' }}
            >
                <span className="block text-4xl sm:text-6xl md:text-8xl lg:text-9xl bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500 py-2">{t('hero_title1')}</span>
                <span className="block text-4xl sm:text-6xl md:text-8xl lg:text-9xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-[0_0_50px_rgba(168,85,247,0.5)] py-2">
                {t('hero_title2')}
                </span>
            </h1>
          </div>
          
          <p className="text-base sm:text-lg md:text-2xl text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed font-light px-4 text-center drop-shadow-lg">
            {t('hero_subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full max-w-md sm:max-w-none px-4 relative z-20">
            <button 
              onClick={() => onNavigate('signup')}
              className="group relative w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 rounded-full bg-white text-black font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] overflow-hidden flex items-center justify-center"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 whitespace-nowrap">{t('hero_cta_primary')} <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} /></span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <button 
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 rounded-full bg-white/5 border border-white/20 text-white font-bold text-base md:text-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-md hover:border-white/50 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] whitespace-nowrap"
            >
              {t('hero_cta_secondary')}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 relative">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center mb-12 md:mb-20 reveal">
                <h2 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 tracking-tight"><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 drop-shadow-[0_0_25px_rgba(52,211,153,0.3)]">{t('feat_title')}</span></h2>
                <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto px-2">{t('feat_subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
                {[
                    { icon: Mic, color: 'purple', title: 'AI Voice Synthesis', desc: 'Your text becomes a lifelike voice, instantly.' },
                    { icon: Headphones, color: 'pink', title: 'Mood Detection', desc: 'Urgent? We shout. Calm? We whisper.' },
                    { icon: Zap, color: 'blue', title: 'Lightning Fast', desc: 'Zero latency reminders delivered to your dashboard.' },
                    { icon: Smartphone, color: 'green', title: 'Cross Platform', desc: 'Access your data anywhere, anytime.' },
                    { icon: ShieldCheck, color: 'yellow', title: 'Bank-Grade Security', desc: 'Your personal data is encrypted and safe.' },
                    { icon: Clock, color: 'red', title: '24/7 Admin Support', desc: 'Direct line to the owner for any issues.' }
                ].map((feature, idx) => (
                    <div key={idx} className={`group reveal glass-card p-8 md:p-10 rounded-[2rem] bg-white/5 hover:bg-white/10 transition-all duration-500 relative overflow-hidden hover:-translate-y-3 border border-white/5 flex flex-col items-center text-center`}>
                        {/* Hover Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/0 to-${feature.color}-500/0 opacity-0 group-hover:opacity-10 group-hover:from-${feature.color}-500/20 group-hover:to-black transition duration-500`}></div>
                        
                        {/* Glow Orb */}
                        <div className={`absolute -top-10 -right-10 w-40 h-40 bg-${feature.color}-500/20 rounded-full blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:bg-${feature.color}-500/30`}></div>
                        
                        <div className={`w-16 h-16 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 group-hover:rotate-3 transition duration-500 border border-${feature.color}-500/30 shadow-[0_0_30px_rgba(0,0,0,0.2)] relative z-10`}>
                            <feature.icon className={`w-8 h-8 text-${feature.color}-300 drop-shadow-lg`} />
                        </div>
                        <h3 className={`text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white group-hover:text-${feature.color}-300 transition relative z-10`}>{feature.title}</h3>
                        <p className="text-gray-400 leading-relaxed text-sm md:text-base group-hover:text-gray-300 relative z-10">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Pricing Section Wrapper */}
      <section className="py-16 md:py-24 relative border-t border-white/5 bg-gradient-to-b from-black to-indigo-950/20 reveal">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
            <Pricing onSelectPlan={onSelectPlan} />
        </div>
      </section>

      {/* Footer Call to Action */}
      <section className="py-20 md:py-40 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 via-black to-black"></div>
          <div className="container mx-auto px-4 md:px-6 relative z-10 reveal">
            <h2 className="text-4xl md:text-8xl font-bold mb-8 md:mb-10 tracking-tighter text-white leading-tight">Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 animate-gradient-x">Upgrade?</span></h2>
            <button 
                onClick={() => onNavigate('signup')}
                className="group relative px-10 md:px-14 py-5 md:py-7 rounded-full bg-white text-black font-bold text-lg md:text-xl transition-all duration-300 hover:scale-105 shadow-[0_0_80px_rgba(255,255,255,0.4)] overflow-hidden"
            >
                <span className="relative z-10">{t('nav_signup')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-300 to-pink-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
      </section>

    </div>
  );
};

export default LandingPage;
