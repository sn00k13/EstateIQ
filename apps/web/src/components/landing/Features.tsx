"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Receipt,
  Wrench,
  BarChart3,
  ShieldCheck,
  Bell,
  Users,
} from "lucide-react";
import kynjousers from "@/components/images/kynjousers.webp";

const features = [
  {
    icon: Receipt,
    title: "Dues & Levy Collection",
    description:
      "Automate service charge billing, track payments in real-time, and send gentle reminders to defaulters.",
  },
  {
    icon: Wrench,
    title: "Maintenance Requests",
    description:
      "Residents submit issues from their phone. Your team triages, assigns, and resolves — all in one place.",
  },
  {
    icon: BarChart3,
    title: "Financial Dashboard",
    description:
      "Income, expenditure, arrears, and forecasts presented in clear visuals your board will actually read.",
  },
  {
    icon: ShieldCheck,
    title: "Access & Security",
    description:
      "Visitor pre-authorization, gate logs, and panic alerts integrated into one security layer.",
  },
  {
    icon: Bell,
    title: "Community Notices",
    description:
      "Push announcements, AGM agendas, and polls to every resident — no more WhatsApp chaos.",
  },
  {
    icon: Users,
    title: "Resident Directory",
    description:
      "A private, permission-based directory so estate managers and residents stay connected.",
  },
];

const Features = () => {
  const ref = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const [visible, setVisible] = useState(false);
  const [cardsPadTop, setCardsPadTop] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    const h2 = h2Ref.current;
    if (!grid || !h2) return;

    const mq = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      if (!mq.matches) {
        setCardsPadTop(0);
        return;
      }
      const gridTop = grid.getBoundingClientRect().top;
      const h2Bottom = h2.getBoundingClientRect().bottom;
      setCardsPadTop(Math.max(0, Math.round(h2Bottom - gridTop)));
    };

    update();

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });
    ro.observe(grid);
    ro.observe(h2);

    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section id="features" className="py-24 md:py-32 bg-card" ref={ref}>
      <div className="max-w-7xl mx-auto section-padding">
        <div
          ref={gridRef}
          className="grid grid-cols-1 lg:grid-cols-2 lg:items-start gap-12 lg:gap-14 xl:gap-16"
        >
          {/* Left: section copy + image (image sits below title & description) */}
          <div className="min-w-0 flex flex-col gap-8 lg:gap-10">
            <div className="max-w-xl">
              <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                Features
              </span>
              <h2
                ref={h2Ref}
                className="mt-3 text-3xl md:text-4xl font-bold text-foreground leading-tight"
              >
                Everything your estate needs, nothing it doesn't
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Built for the realities of neighborhood management — not retrofitted from generic property tools.
              </p>
            </div>

            <div
              className={`w-full ${
                visible ? "reveal-up" : "opacity-0"
              }`}
              style={{ animationDelay: "120ms" }}
            >
              <div className="relative rounded-2xl border border-border bg-secondary/30 p-1.5 shadow-xl shadow-primary/10 overflow-hidden">
                <Image
                  src={kynjousers}
                  alt="Team using KYNJO Homes on laptop, tablet, and phone in a modern office"
                  width={kynjousers.width}
                  height={kynjousers.height}
                  className="w-full h-auto rounded-[0.625rem]"
                  sizes="(max-width: 1024px) min(100vw - 3rem, 36rem), (max-width: 1536px) 45vw, 40rem"
                  quality={100}
                  priority={false}
                />
              </div>
            </div>
          </div>

          {/* Right: on lg+, first row of cards aligns with bottom edge of main h2 */}
          <div
            className="min-w-0 grid sm:grid-cols-2 gap-4 lg:gap-5"
            style={{ paddingTop: cardsPadTop }}
          >
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`group p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${
                  visible ? "reveal-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <f.icon size={18} className="text-primary" />
                </div>
                <h3 className="font-sans text-sm font-semibold text-foreground mb-1.5 leading-snug">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
