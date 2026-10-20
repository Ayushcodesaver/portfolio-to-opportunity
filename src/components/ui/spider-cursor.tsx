import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Particle = Point & { len: number; radius: number };
type Spider = {
  particles: Particle[];
  rays: Point[];
  seed: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  walkX: number;
  walkY: number;
};

const PARTICLE_COUNT = 180;
const RAY_COUNT = 9;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

export function SpiderCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reducedMotion.matches || !finePointer.matches) return;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let pointerActive = false;
    let frame: number | null = null;
    let lastFrameTime = 0;
    let pointer = { x: 0, y: 0 };
    let spiders: Spider[] = [];
    const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();

    const createSpider = (): Spider => ({
      particles: Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 0,
        radius: 0,
      })),
      rays: Array.from({ length: RAY_COUNT }, (_, index) => ({
        x: Math.cos((index / RAY_COUNT) * Math.PI * 2),
        y: Math.sin((index / RAY_COUNT) * Math.PI * 2),
      })),
      seed: Math.random() * 100,
      x: Math.random() * width,
      y: Math.random() * height,
      targetX: pointer.x,
      targetY: pointer.y,
      walkX: 28 + Math.random() * 28,
      walkY: 28 + Math.random() * 28,
    });

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      spiders = [createSpider(), createSpider()];
      context.clearRect(0, 0, width, height);
    };

    const drawCircle = (x: number, y: number, radius: number) => {
      context.beginPath();
      context.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2);
      context.fill();
    };

    const drawStrand = (x0: number, y0: number, x1: number, y1: number, time: number) => {
      context.beginPath();
      context.moveTo(x0, y0);
      for (let index = 1; index <= 4; index += 1) {
        const progress = index / 4;
        const wave = Math.sin(time * 1.4 + x0 * 0.025 + progress * Math.PI) * 1.2;
        context.lineTo(lerp(x0, x1, progress) + wave, lerp(y0, y1, progress) - wave * 0.6);
      }
      context.stroke();
    };

    const render = (timestamp: number) => {
      if (!pointerActive) {
        context.clearRect(0, 0, width, height);
        frame = null;
        return;
      }

      if (timestamp - lastFrameTime < 32) {
        frame = window.requestAnimationFrame(render);
        return;
      }
      lastFrameTime = timestamp;
      context.clearRect(0, 0, width, height);
      context.strokeStyle = `hsl(${foreground} / 0.38)`;
      context.fillStyle = `hsl(${foreground} / 0.62)`;
      context.lineWidth = 0.7;

      spiders.forEach((spider) => {
        const time = timestamp / 1000;
        const targetX = spider.targetX + Math.cos(time * 0.55 + spider.seed) * spider.walkX;
        const targetY = spider.targetY + Math.sin(time * 0.5 + spider.seed) * spider.walkY;
        spider.x += (targetX - spider.x) * 0.1;
        spider.y += (targetY - spider.y) * 0.1;
        const radius = width / (100 + (spider.seed % 50));
        let nearbyParticles = 0;

        spider.particles.forEach((particle) => {
          const dx = particle.x - spider.x;
          const dy = particle.y - spider.y;
          const distance = Math.hypot(dx, dy);
          const nearby = distance < width / 10 && nearbyParticles < 8;
          if (nearby) nearbyParticles += 1;

          particle.radius = Math.min(2, width / Math.max(distance, 1) / 5);
          particle.len = clamp(particle.len + (nearby ? 0.1 : -0.1), 0, 1);
          if (particle.len <= 0) return;

          spider.rays.forEach((ray) => {
            const rayX = spider.x + ray.x * radius;
            const rayY = spider.y + ray.y * radius;
            drawStrand(
              lerp(rayX, particle.x, particle.len * particle.len),
              lerp(rayY, particle.y, particle.len * particle.len),
              rayX,
              rayY,
              time,
            );
          });
          drawCircle(particle.x, particle.y, particle.radius);
        });
      });

      frame = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
        pointerActive = false;
        return;
      }

      pointer = { x, y };
      pointerActive = true;
      spiders.forEach((spider) => {
        spider.targetX = pointer.x;
        spider.targetY = pointer.y;
      });
      if (frame === null) frame = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      if (frame !== null) window.cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 block h-dvh w-screen" />;
}

export default SpiderCursor;