"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  MouseEvent,
} from "react";
import emailjs from "@emailjs/browser";
import dynamic from "next/dynamic";

// Client-only decorative backgrounds to avoid hydration issues
const EmojiBackground = dynamic(() => import("../app/components/EmojiBackground"), {
  ssr: false,
});
const FloatingHearts = dynamic(() => import("../app/components/FloatingHearts"), {
  ssr: false,
});

type FormState = { message: string };

/* Clamp a position to container bounds given current button size */
function clampPosition(
  x: number,
  y: number,
  container: DOMRect,
  btn: DOMRect,
  pad = 6
) {
  const maxX = Math.max(0, container.width - btn.width - pad);
  const maxY = Math.max(0, container.height - btn.height - pad);
  const clampedX = Math.min(Math.max(x, pad), maxX);
  const clampedY = Math.min(Math.max(y, pad), maxY);
  return { x: clampedX, y: clampedY };
}

export default function Page() {
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

  const [form, setForm] = useState<FormState>({
    message: "Би чамд дурласан… 💗",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<null | string>(null);
  const [err, setErr] = useState<null | string>(null);

  // NO button refs & state
  const gridRef = useRef<HTMLDivElement | null>(null);
  const noRef = useRef<HTMLButtonElement | null>(null);

  // Default: visible in its grid cell. After first tease, becomes absolute/dodging.
  const [dodging, setDodging] = useState(false);
  const [tease, setTease] = useState(false);
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);

  // Place the NO button somewhere inside bounds
  const moveNo = useCallback(() => {
    if (!gridRef.current || !noRef.current) return;
    const container = gridRef.current.getBoundingClientRect();
    const btn = noRef.current.getBoundingClientRect();

    const pad = 6;
    const maxX = Math.max(0, container.width - btn.width - pad);
    const maxY = Math.max(0, container.height - btn.height - pad);

    const nextX = pad + Math.random() * maxX;
    const nextY = pad + Math.random() * maxY;

    const { x, y } = clampPosition(nextX, nextY, container, btn, pad);
    setNoPos({ x, y });
  }, []);

  // Tease for a moment, then enter dodging mode and move
  const teaseThenMove = useCallback(() => {
    setTease(true);
    setTimeout(() => {
      setDodging(true);
      moveNo();
      setTease(false);
    }, 120);
  }, [moveNo]);

  // Continuous dodge when cursor approaches within radius
  const onGridMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!dodging || !gridRef.current || !noRef.current) return;

      const gridBox = gridRef.current.getBoundingClientRect();
      const mouseX = e.clientX - gridBox.left;
      const mouseY = e.clientY - gridBox.top;

      const btnBox = noRef.current.getBoundingClientRect();
      const btnX = btnBox.left - gridBox.left + btnBox.width / 2;
      const btnY = btnBox.top - gridBox.top + btnBox.height / 2;

      const dx = mouseX - btnX;
      const dy = mouseY - btnY;
      const dist = Math.hypot(dx, dy);

      if (dist < 120) moveNo();
    },
    [dodging, moveNo]
  );

  // Enter dodging on hover/press/touch of NO
  useEffect(() => {
    const el = noRef.current;
    if (!el) return;

    const onEnter = () => teaseThenMove();
    const onDown = () => teaseThenMove();

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: true });

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onDown);
    };
  }, [teaseThenMove]);

  // Keep inside on resize
  useEffect(() => {
    const onResize = () => {
      if (dodging) moveNo();
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [dodging, moveNo]);

  // Re-clamp when the NO button's size changes (font-size/padding edits)
  useEffect(() => {
    if (!noRef.current) return;

    const ro = new ResizeObserver(() => {
      if (!gridRef.current || !noRef.current) return;
      const container = gridRef.current.getBoundingClientRect();
      const btn = noRef.current.getBoundingClientRect();

      setNoPos((prev) => {
        if (!prev) return prev; // still default grid cell
        const { x, y } = clampPosition(prev.x, prev.y, container, btn, 6);
        return { x, y };
      });
    });

    ro.observe(noRef.current);
    return () => ro.disconnect();
  }, []);

  // Style for NO: default grid position before dodging; absolute after
  const noStyle = useMemo(() => {
    if (!dodging || !noPos) return {}; // default spot: visible in grid
    return {
      position: "absolute" as const,
      left: noPos.x,
      top: noPos.y,
      transform: "translate3d(0,0,0)",
      transition:
        "left .12s ease, top .12s ease, transform .12s ease, background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease",
    };
  }, [dodging, noPos]);

  // YES -> send email
  async function yesClick() {
    setErr(null);
    setSent(null);
    setSending(true);
    try {
      if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        throw new Error("EmailJS env тохиргоо алга.");
      }
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: "oluka0330@gmail.com",
          from_name: "Нууц шүтэн бишрэгч 😘",
          message: form.message || "Тийм гээд өгөөч 💖",
          answer: "YES",
        },
        { publicKey: PUBLIC_KEY }
      );
      setSent("Зяаа! Илгээлээ. 💌");
      setForm({ message: "Илгээлээ! Чамд хайртай 💘" });
    } catch (e: any) {
      setErr(e?.message || "Илгээх үед алдаа гарлаа.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="container">
      <EmojiBackground />
      <FloatingHearts />

      <section className="card" role="dialog" aria-label="Proposal">
        <div className="header">
          <h1 className="title">Надтай үерхээч? 💖</h1>
          <p className="subtitle">
            Чи надад үнэхээр таалагддаг… хамтдаа бол илүү гэрэлтэнэ ✨
          </p>
        </div>

        <div className="content">
          <div className="row two">
            <div>
              <div className="label">Мессеж (optional)</div>
              <input
                className="input"
                placeholder="Жишээ: Чи миний бүх зүйл 💘"
                value={form.message}
                onChange={(e) => setForm({ message: e.target.value })}
              />
            </div>
          </div>

          <div
            ref={gridRef}
            className="btngrid"
            aria-live="polite"
            onMouseMove={onGridMouseMove}
          >
            <button
              type="button"
              className="btn btn-yes"
              onClick={yesClick}
              disabled={sending}
              aria-label="YES"
            >
              {sending ? "Илгээж байна..." : "Тийм ээ 💞"}
            </button>

            {/* NO button: shows in default grid spot first; after first tease it dodges */}
            <button
              ref={noRef}
              type="button"
              className={`btn btn-no ${dodging ? "dodging" : ""} ${
                tease ? "tease" : ""
              } big`}
              style={noStyle as React.CSSProperties}
              onClick={(e) => {
                e.preventDefault();
                teaseThenMove();
              }}
              aria-label="NO"
            >
              Үгүй 😅
            </button>
          </div>

          {sent && <div className="toast">{sent}</div>}
          {err && <div className="toast-error">{err}</div>}
        </div>
      </section>
    </main>
  );
}
