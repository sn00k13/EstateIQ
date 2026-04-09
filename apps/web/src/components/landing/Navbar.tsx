"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useSession } from '@/components/layout/SessionProvider'
import logo from "@/components/images/logo.png";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
    { label: "Help", href: "/help" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 section-padding">
        <Link href="/" className="flex items-center">
          <Image
            src={logo}
            alt="Kynjo.Homes"
            height={59}
            width={206}
            className="h-[59px] w-auto object-contain"
          />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) =>
            l.href.startsWith('/') ? (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {l.label}
              </a>
            )
          )}
        </div>
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Button size="sm" className="bg-primary hover:bg-primary-dark text-primary-foreground active:scale-[0.97] transition-all" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                <Link href="/sign-in">Log in</Link>
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary-dark text-primary-foreground active:scale-[0.97] transition-all" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground rounded"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-card border-b border-border section-padding pb-6 animate-fade-in">
          <div className="flex flex-col gap-4 pt-2">
            {links.map((l) =>
              l.href.startsWith('/') ? (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              )
            )}
            <div className="flex gap-3 pt-2">
              {isLoggedIn ? (
                <Button size="sm" className="bg-primary hover:bg-primary-dark text-primary-foreground" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                    <Link href="/sign-in">Log in</Link>
                  </Button>
                  <Button size="sm" className="bg-primary hover:bg-primary-dark text-primary-foreground" asChild>
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
