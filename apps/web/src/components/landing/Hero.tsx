"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, Users, ShieldCheck } from "lucide-react";
import { useSession } from '@/components/layout/SessionProvider'
import { Button } from "@/components/ui/button";
import heroImage from "@/components/images/hero-estate.webp";

const stats = [
  { icon: Building2, value: "2,400+", label: "Estates managed" },
  { icon: Users, value: "18k", label: "Residents served" },
  { icon: ShieldCheck, value: "99.8%", label: "Uptime" },
];

const Hero = () => {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImage}
          alt="Modern residential estate aerial view"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-charcoal/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto section-padding">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-mist/30 bg-mist/10 px-4 py-1.5 mb-6 reveal-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-mist uppercase">
              Neighborhood & Estate Management
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-mist leading-[1.08] tracking-tight reveal-up reveal-up-delay-1">
            Manage your estate with clarity
          </h1>

          <p className="mt-5 text-lg md:text-xl text-mist/70 max-w-lg leading-relaxed reveal-up reveal-up-delay-2">
            The intelligent platform for estate managers, HOAs, and residential communities. From dues collection to maintenance — simplified.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 reveal-up reveal-up-delay-3">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-dark text-primary-foreground gap-2 active:scale-[0.97] transition-all shadow-lg shadow-primary/25"
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
              className="border-mist/30 text-black hover:bg-mist/10 active:scale-[0.97] transition-all"
              asChild
            >
              <Link href={isLoggedIn ? "#features" : "/contact"}>
                {isLoggedIn ? "Explore features" : "Book a Demo"}
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl reveal-up reveal-up-delay-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-mist/10 flex items-center justify-center">
                <s.icon size={18} className="text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold text-mist tabular-nums">{s.value}</div>
                <div className="text-xs text-mist/50">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
