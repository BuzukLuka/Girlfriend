"use client";

import { useEffect, useMemo, useState } from "react";

const EMOJIS = [
  "💖",
  "💘",
  "💕",
  "💞",
  "💓",
  "💗",
  "💝",
  "🌸",
  "🌷",
  "✨",
  "🥰",
  "😘",
  "😊",
];

export default function EmojiBackground() {
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const count = Math.min(
    80,
    Math.max(24, Math.floor((viewport.w * viewport.h) / 35000))
  );

  const items = useMemo(() => {
    return new Array(count).fill(null).map((_, i) => {
      const left = Math.random() * 100; // vw
      const delay = Math.random() * 8; // s
      const dur = 14 + Math.random() * 18; // s
      const size = 16 + Math.random() * 18; // px
      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      return { left, delay, dur, size, emoji, key: i };
    });
  }, [count]);

  return (
    <div className="emoji-layer" aria-hidden>
      {items.map((e) => (
        <span
          key={e.key}
          className="emoji"
          style={{
            left: `${e.left}vw`,
            bottom: `-60px`,
            animationDuration: `${e.dur}s`,
            animationDelay: `${e.delay}s`,
            fontSize: e.size,
          }}
        >
          {e.emoji}
        </span>
      ))}
    </div>
  );
}
