import { useEffect, useRef } from 'react';

const GRAIN_SHAPES = ['circle', 'ellipse', 'drop'] as const;
const GRAIN_COLORS = [
  '#8B4513', '#6B3410', '#a05010', '#c8a050', '#d4b060',
  '#3a6b20', '#2d5010', '#c83220', '#e04030', '#b08030',
];

type Grain = {
  x: number; y: number; size: number; vx: number; vy: number;
  rotation: number; vr: number; color: string;
  shape: (typeof GRAIN_SHAPES)[number]; alpha: number;
  wobble: number; wobbleSpeed: number;
};

export function GrainCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const gc = ref.current;
    if (!gc) return;
    const gctx = gc.getContext('2d');
    if (!gctx) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const resize = () => {
      gc.width = window.innerWidth;
      gc.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const grains: Grain[] = Array.from({ length: 55 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 2 + Math.random() * 5,
      vx: (Math.random() - 0.5) * 0.00015,
      vy: -(0.0001 + Math.random() * 0.00025),
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.008,
      color: GRAIN_COLORS[Math.floor(Math.random() * GRAIN_COLORS.length)]!,
      shape: GRAIN_SHAPES[Math.floor(Math.random() * 3)]!,
      alpha: 0.55 + Math.random() * 0.35,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.01 + Math.random() * 0.02,
    }));

    const drawGrain = (g: Grain) => {
      const w = gc.width, h = gc.height;
      gctx.save();
      gctx.translate(g.x * w, g.y * h);
      gctx.rotate(g.rotation);
      gctx.globalAlpha = g.alpha;
      gctx.fillStyle = g.color;

      if (g.shape === 'circle') {
        gctx.beginPath();
        gctx.arc(0, 0, g.size / 2, 0, Math.PI * 2);
        gctx.fill();
      } else if (g.shape === 'ellipse') {
        gctx.beginPath();
        gctx.ellipse(0, 0, g.size * 0.7, g.size * 0.35, 0, 0, Math.PI * 2);
        gctx.fill();
      } else {
        gctx.beginPath();
        gctx.moveTo(0, -g.size * 0.6);
        gctx.bezierCurveTo(g.size * 0.4, -g.size * 0.2, g.size * 0.4, g.size * 0.3, 0, g.size * 0.6);
        gctx.bezierCurveTo(-g.size * 0.4, g.size * 0.3, -g.size * 0.4, -g.size * 0.2, 0, -g.size * 0.6);
        gctx.fill();
      }
      gctx.restore();
    };

    const update = () => {
      for (const g of grains) {
        g.wobble += g.wobbleSpeed;
        g.x += g.vx + Math.sin(g.wobble) * 0.00008;
        g.y += g.vy;
        g.rotation += g.vr;
        if (g.y < -0.05) { g.y = 1.05; g.x = Math.random(); }
        if (g.x < -0.02) g.x = 1.02;
        if (g.x > 1.02) g.x = -0.02;
      }
    };

    let raf = 0;
    const loop = () => {
      gctx.clearRect(0, 0, gc.width, gc.height);
      for (const g of grains) drawGrain(g);
      update();
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full z-[9999]"
    />
  );
}
