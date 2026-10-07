import { useEffect, useRef } from "react";

const IMAGE_URLS = [
  "/bg/1.jpg",
  "/bg/buffalos.jpeg",
  "/bg/harvest.jpg",
  "/bg/harvesting.jpg",
  "/bg/paddy.jpg",
  "/bg/all.jpg",
  "/bg/basket.jpg",
  "/bg/container.jpg",
  "/bg/cotton.jpg",
  "/bg/fruit-market.webp",
  "/bg/hello.jpg",
  "/bg/leafy.jpg",
  "/bg/padddy.jpg",
  "/bg/penut.jpg",
  "/bg/pulses.jpg",
  "/bg/vegetablee.jpg",
];

const LANES = 8;

function loadImages() {
  return IMAGE_URLS.map((src) => {
    const img = new Image();
    img.src = src;
    return img;
  });
}

const randomImage = (images) => images[Math.floor(Math.random() * images.length)];

function makeLane(index, count, w, h, images) {
  const laneW = w / count;
  const depth = Math.random();
  const size = Math.min(laneW * 0.92, 100 + depth * 120);
  const gap = 24 + Math.random() * 50;
  const lane = {
    x: laneW * (index + 0.5),
    laneW,
    dir: index % 2 === 0 ? -1 : 1,
    speed: 22 + depth * 35,
    depth,
    size,
    gap,
    items: [],
  };
  let y = -size - Math.random() * size;
  while (y < h + size) {
    lane.items.push({ img: randomImage(images), y });
    y += size + gap;
  }
  return lane;
}

function drawLane(ctx, lane) {
  for (const it of lane.items) {
    const img = it.img;
    if (!img.complete || !img.naturalWidth) continue;
    const ratio = img.naturalWidth / img.naturalHeight;
    let h = lane.size;
    let w = h * ratio;
    if (w > lane.laneW * 0.92) {
      w = lane.laneW * 0.92;
      h = w / ratio;
    }
    const x = lane.x - w / 2;
    const y = it.y - h / 2;
    const radius = 12;

    ctx.save();
    ctx.globalAlpha = 0.7 + lane.depth * 0.3;
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 5;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }
}

export default function PaperBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const images = loadImages();
    let w = 0;
    let h = 0;
    let lanes = [];
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 700 ? Math.max(3, Math.round(LANES * 0.5)) : LANES;
      lanes = Array.from({ length: count }, (_, i) =>
        makeLane(i, count, w, h, images),
      );
    };

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      for (const lane of lanes) drawLane(ctx, lane);
    };

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      for (const lane of lanes) {
        const step = lane.dir * lane.speed * dt;
        for (const it of lane.items) it.y += step;

        const ys = lane.items.map((i) => i.y);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const stride = lane.size + lane.gap;

        for (const it of lane.items) {
          if (lane.dir < 0 && it.y < -lane.size) {
            it.y = Math.max(maxY, h) + stride;
            it.img = randomImage(images);
          } else if (lane.dir > 0 && it.y > h + lane.size) {
            it.y = Math.min(minY, 0) - stride;
            it.img = randomImage(images);
          }
        }
      }
      render();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reduce.matches) {
        render();
      } else {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    };

    images.forEach((img) =>
      img.addEventListener("load", () => reduce.matches && render()),
    );

    resize();
    start();
    window.addEventListener("resize", resize);
    window.addEventListener("resize", start);
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener?.("change", start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", start);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener?.("change", start);
    };
  }, []);

  return <canvas ref={canvasRef} className="paper-bg" aria-hidden="true" />;
}