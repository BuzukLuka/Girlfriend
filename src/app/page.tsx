"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  MouseEvent,
} from "react";
import emailjs from "@emailjs/browser";
import dynamic from "next/dynamic";

// client-only (random/viewport stuff)
const EmojiBackground = dynamic(() => import("../app/components/EmojiBackground"), {
  ssr: false,
});
const FloatingHearts = dynamic(() => import("../app/components/FloatingHearts"), {
  ssr: false,
});

type FormState = { message: string };

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

  // --- NO button logic ---
  const gridRef = useRef<HTMLDivElement | null>(null);
  const noRef = useRef<HTMLButtonElement | null>(null);

  // once you hover the NO button for the first time, we switch to "dodging" mode (absolute)
  const [dodging, setDodging] = useState(false);
  const [tease, setTease] = useState(false);
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);

  // place the NO button somewhere inside the grid
  const moveNo = useCallback(() => {
    if (!gridRef.current || !noRef.current) return;
    const container = gridRef.current.getBoundingClientRect();
    const btn = noRef.current.getBoundingClientRect();

    const pad = 6;
    const maxX = Math.max(0, container.width - btn.width - pad);
    const maxY = Math.max(0, container.height - btn.height - pad);

    const nextX = pad + Math.random() * maxX;
    const nextY = pad + Math.random() * maxY;
    setNoPos({ x: nextX, y: nextY });
  }, []);

  // tease a tiny bit, then move
  const teaseThenMove = useCallback(() => {
    setTease(true);
    setTimeout(() => {
      setDodging(true); // from now on it’s absolute-positioned
      moveNo();
      setTease(false);
    }, 120);
  }, [moveNo]);

  // move away when the mouse gets close (continuous dodging)
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

      // if pointer is within 120px radius, jump somewhere else
      if (dist < 120) moveNo();
    },
    [dodging, moveNo]
  );

  // also dodge on hover/click/touch of the NO button
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

  // keep inside bounds on resize
  useEffect(() => {
    const onResize = () => {
      if (dodging) moveNo();
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [dodging, moveNo]);

  // style for NO button (static before dodging; absolute after)
  const noStyle = useMemo(() => {
    if (!dodging || !noPos) return {}; // default grid cell (visible on first load)
    return {
      position: "absolute" as const,
      left: noPos.x,
      top: noPos.y,
      transform: "translate3d(0,0,0)",
      transition:
        "left .12s ease, top .12s ease, transform .12s ease, background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease",
    };
  }, [dodging, noPos]);

  // --- YES button / Email ---
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
      setForm((p) => ({ ...p, message: "Илгээлээ! Чамд хайртай 💘" }));
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

            {/* NO button: visible at default place on first load, then dodges */}
            <button
              ref={noRef}
              type="button"
              className={`btn btn-no ${dodging ? "dodging" : ""} ${
                tease ? "tease" : ""
              }`}
              style={noStyle as React.CSSProperties}
              onClick={(e) => {
                e.preventDefault();
                teaseThenMove(); // if click lands, dodge again
              }}
              aria-label="NO"
            >
              Үгүй, уучлаарай 💔
            </button>
          </div>

          {sent && <div className="toast">{sent}</div>}
          {err && <div className="toast-error">{err}</div>}
        </div>
      </section>
    </main>
  );
}
