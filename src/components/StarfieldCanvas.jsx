import { useEffect, useRef } from 'react';

export default function StarfieldCanvas({ isLightMode }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let stars = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const initStars = (w, h) => {
      stars = [];
      const numStars = Math.floor((w * h) / 5000);
      for (let i = 0; i < numStars; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + 0.3, base: Math.random() * 0.6 + 0.2, speed: Math.random() * 0.02 + 0.005, phase: Math.random() * Math.PI * 2 });
      }
    };

    const resize = () => { 
      width = window.innerWidth; 
      height = window.innerHeight;
      canvas.width = width; 
      canvas.height = height; 
      initStars(width, height);
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (!isLightMode) {
        stars.forEach(s => {
          const opacity = s.base + Math.sin(t * s.speed + s.phase) * 0.3;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${Math.max(0, opacity)})`; ctx.fill();
          s.y -= 0.15 + s.speed * 5; s.x += 0.05 + s.speed * 2;
          if (s.y < 0) s.y = height; if (s.x > width) s.x = 0;
        });
      }
      t++; animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [isLightMode]);

  return <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:0, pointerEvents:'none' }} />;
}
