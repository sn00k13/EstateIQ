"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useSession } from '@/components/layout/SessionProvider'
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import frontgate from "@/components/images/frontgate.webp";

const CTA = () => {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 z-0">
        <Image
          src={frontgate}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority={false}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/80"
          aria-hidden
        />
      </div>

      <div
        className={`relative z-10 max-w-3xl mx-auto section-padding text-center ${visible ? "reveal-up" : "opacity-0"}`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-sm leading-tight">
          Ready to modernize your estate?
        </h2>
        <p className="mt-4 text-white/90 text-lg leading-relaxed max-w-lg mx-auto">
          Join hundreds of communities that switched from spreadsheets and group chats to Kynjo.Homes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-dark text-primary-foreground gap-2 active:scale-[0.97] transition-all shadow-lg shadow-black/30"
            asChild
          >
            <Link href={isLoggedIn ? "/dashboard" : "/sign-up"}>
              {isLoggedIn ? "Go to dashboard" : "Start Free Trial"}
              <ArrowRight size={16} />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/40 text-white bg-white/5 hover:bg-white/15 hover:text-white active:scale-[0.97] transition-all"
            asChild
          >
            <Link href={isLoggedIn ? "#pricing" : "/contact"}>
              {isLoggedIn ? "View pricing" : "Talk to Sales"}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
