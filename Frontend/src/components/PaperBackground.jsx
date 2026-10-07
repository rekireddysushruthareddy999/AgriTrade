import { useEffect, useRef } from "react";

const IMAGE_URLS = [
  // Local high-definition produce & farm imagery
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
  // High-resolution agricultural & mandi photography
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1543083477-4f785aeafaa9?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1598512752271-33f913a5af13?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1628102491629-778571d893a3?w=600&auto=format&fit=crop&q=80",
];

const LANES = 8;

function loadImages() {
  return IMAGE_URLS.map((src) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => {
      // Safe fallback to guaranteed bundled agricultural image
      img.src = "/bg/harvest.jpg";
    };
    img.src = src;
    return img;
  });
}

const randomImage = (images) => images[Math.floor(Math.random() * images.length)];

function makeLane(index, count, w, h, images) {
  const laneW = w / count;
  const depth = Math.random();
  const size = Math.min(laneW * 0.95, 140 + depth * 140);
  const gap = 16 + Math.random() * 32;
  const lane = {
    x: laneW * (index + 0.5),
    laneW,
    dir: index % 2 === 0 ? -1 : 1,
    speed: 26 + depth * 36,
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
    if (w > lane.laneW * 0.94) {
      w = lane.laneW * 0.94;
      h = w / ratio;
    }
    const x = lane.x - w / 2;
    const y = it.y - h / 2;
    const radius = 14;

    ctx.save();
    // Soft, pleasant background visibility
    ctx.globalAlpha = 0.72 + lane.depth * 0.22;
    ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

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