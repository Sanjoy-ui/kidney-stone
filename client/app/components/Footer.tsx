"use client";

import { Globe, X, Mail, Share2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  Services: [
    { label: "Kidney Stone Detection", href: "/diagnose" },
    { label: "Ultrasound Analysis", href: "/diagnose" },
    { label: "CT Segmentation", href: "/diagnose" },
    { label: "Diagnostic Reports", href: "/diagnose" },
  ],
  Platform: [
    { label: "About Us", href: "#about" },
    { label: "Clinical Validation", href: "#how-it-works" },
    { label: "Pricing & Plans", href: "#pricing" },
    { label: "Hospital Network", href: "#about" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "HIPAA Compliance", href: "/terms" },
    { label: "Data Security", href: "/privacy" },
  ],
};

const socials = [
  { icon: Globe, href: "#", label: "Website" },
  { icon: X, href: "#", label: "X" },
  { icon: Share2, href: "#", label: "Community" },
  { icon: Mail, href: "mailto:contact@nephroscan.ai", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#90e0ef]/60 py-12 sm:py-16 mt-6 sm:mt-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-12">
        {/* Brand Column */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <Image
              src="/mainLogo.png"
              alt="Health Care Medical Company"
              width={160}
              height={70}
              className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <p className="text-[#334155] text-sm leading-relaxed max-w-xs font-normal">
            A modern medical center and AI renal diagnostics platform trusted by clinicians, radiologists, and patients worldwide.
          </p>
          {/* Social Links */}
          <div className="flex gap-3 pt-1">
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-10 h-10 rounded-xl border border-[#90e0ef] bg-[#caf0f8]/30 flex items-center justify-center text-[#0077b6] hover:bg-[#0077b6] hover:text-white transition-all duration-200"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Link Columns */}
        {Object.entries(footerLinks).map(([group, links]) => (
          <div key={group} className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-[#03045e] uppercase tracking-wider">
              {group}
            </h4>
            <ul className="flex flex-col gap-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#334155] hover:text-[#0077b6] transition-colors duration-200 font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} NephroScan Medical Center Inc. All rights reserved.
        </p>
        <p className="text-xs text-slate-500 font-medium">
          Certified ISO 13485 & HIPAA Compliant Diagnostics.
        </p>
      </div>
    </footer>
  );
}
