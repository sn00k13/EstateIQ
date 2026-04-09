"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import ipadFeature from "@/components/images/Ipad.png";

const steps = [
  {
    num: "01",
    title: "Onboard your estate",
    description:
      "Add your property details, units, and resident roster in minutes — CSV import supported.",
  },
  {
    num: "02",
    title: "Configure billing & rules",
    description:
      "Set up service charges, payment schedules, late-fee policies, and approval workflows.",
  },
  {
    num: "03",
    title: "Invite residents",
    description:
      "Each resident gets a personal portal and mobile app — no training needed.",
  },
  {
    num: "04",
    title: "Manage with insight",
    description:
      "Real-time dashboards, automated reports, and AI-assisted recommendations keep you ahead.",
  },
];

const HowItWorks = () => {
  const ref = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const [visible, setVisible] = useState(false);
  const [imagePadTop, setImagePadTop] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
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
        setImagePadTop(0);
        return;
      }
      const gridTop = grid.getBoundingClientRect().top;
      const headingBottom = h2.getBoundingClientRect().bottom;
      setImagePadTop(Math.max(0, Math.round(headingBottom - gridTop)));
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
    <section id="how-it-works" className="py-24 md:py-32 bg-secondary" ref={ref}>
      <div className="max-w-7xl mx-auto section-padding">
        <div
          ref={gridRef}
          className="grid grid-cols-1 lg:grid-cols-2 lg:items-start gap-12 lg:gap-14 xl:gap-16"
        >
          {/* Left: section intro + steps */}
          <div className="min-w-0 flex flex-col gap-8 lg:gap-10">
            <div className="max-w-xl">
              <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                How It Works
              </span>
              <h2
                ref={h2Ref}
                className="mt-3 text-3xl md:text-4xl font-bold text-foreground leading-tight"
              >
                Up and running in a single afternoon
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                No consultants, no month-long rollouts. Kynjo.Homes is designed to be self-serve from day one.
              </p>
            </div>

            <div className="min-w-0 grid sm:grid-cols-2 gap-6 lg:gap-8">
              {steps.map((s, i) => (
                <div
                  key={s.num}
                  className={`relative ${visible ? "reveal-up" : "opacity-0"}`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="text-5xl font-display font-bold text-primary/15 leading-none select-none">
                    {s.num}
                  </span>
                  <h3 className="mt-2 font-sans text-base font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {s.description}
                  </p>
                  {i % 2 === 0 && i < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-6 -right-4 w-8 border-t border-dashed border-primary/30" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: image top aligns with bottom of main h2 on lg+ */}
          <div
            className={`min-w-0 w-full flex flex-col gap-6 ${
              visible ? "reveal-up" : "opacity-0"
            }`}
            style={{ animationDelay: "120ms", paddingTop: imagePadTop }}
          >
            <div className="relative w-full rounded-2xl border border-border bg-card p-1.5 shadow-xl shadow-primary/10 overflow-hidden">
              <Image
                src={ipadFeature}
                alt="KYNJO Homes residents dashboard on iPad in landscape"
                width={ipadFeature.width}
                height={ipadFeature.height}
                className="w-full h-auto rounded-[0.625rem]"
                sizes="(max-width: 1024px) min(100vw - 3rem, 36rem), (max-width: 1536px) 45vw, 40rem"
                quality={100}
                priority={false}
              />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              The same workflow across web, tablet, and phone — so your team and residents stay aligned
              at every step.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
