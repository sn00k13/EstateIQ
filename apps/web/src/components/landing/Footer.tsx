import Image from "next/image";
import Link from "next/link";
import logo from "@/components/images/logo.webp";
import NewsletterForm from "@/components/NewsletterForm";
import { footerSocialLinks } from "@/lib/socialLinks";

const footerLinks = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Help & guide", href: "/help" },
      { label: "Integrations", href: "/#features" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

const Footer = () => (
  <footer className="py-16 bg-card border-t border-border">
    <div className="max-w-7xl mx-auto section-padding">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Image
              src={logo}
              alt="Kynjo.Homes - Intelligent Estate Management Platform"
              height={64}
              width={224}
              className="h-16 w-auto object-contain"
            />
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Intelligent estate management platform for modern communities.
          </p>
        </div>

        {footerLinks.map((group) => (
          <div key={group.heading}>
            <h4 className="font-sans text-sm font-semibold text-foreground mb-4">{group.heading}</h4>
            <ul className="space-y-2.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="sm:col-span-2 lg:col-span-1 max-w-sm">
          <NewsletterForm variant="footer" />
        </div>
      </div>

      <div className="mt-14 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-xs text-muted-foreground">Powered by Bubble Barrel Commerce Limited. © 2026 Kynjo.Homes. All rights reserved.</span>
        <div className="flex flex-wrap gap-5 justify-center sm:justify-end">
          {footerSocialLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
