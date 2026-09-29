"use client";

import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Categories", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Reviews", href: "#reviews" },
  { label: "Plans", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="w-full py-5 flex flex-col relative z-50">
      <div className="w-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/mainLogo.png"
            alt="Health Care Medical Company"
            width={160}
            height={70}
            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-[#03045e] hover:text-[#0077b6] transition-colors duration-200 font-semibold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA / User Auth */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/diagnose"
                className="btn-primary text-xs sm:text-sm px-4 py-2 rounded-full shadow-md flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Scan Dashboard</span>
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-[#caf0f8] text-[#0077b6] flex items-center justify-center font-bold text-xs shadow-xs border border-[#90e0ef]">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-xs font-semibold text-[#03045e] max-w-[110px] truncate">
                  {user?.username}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm text-[#03045e] hover:text-[#0077b6] transition-colors font-bold px-2 py-2"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn-primary text-sm px-6 py-2.5 rounded-full shadow-md"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden text-[#03045e] p-2 rounded-lg hover:bg-[#caf0f8]/50 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden mt-3 p-5 rounded-2xl bg-white border border-[#90e0ef]/70 shadow-xl flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-[#03045e] hover:text-[#0077b6] transition-colors text-base font-semibold py-1"
            >
              {link.label}
            </a>
          ))}

          {isAuthenticated ? (
            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 px-1 py-1">
                <div className="w-7 h-7 rounded-full bg-[#caf0f8] text-[#0077b6] flex items-center justify-center font-bold text-xs">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#03045e] truncate">
                    {user?.username}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">
                    {user?.email}
                  </span>
                </div>
              </div>
              <Link
                href="/diagnose"
                onClick={() => setMenuOpen(false)}
                className="btn-primary text-sm justify-center rounded-xl py-2.5 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Scan Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="btn-ghost text-sm justify-center rounded-xl text-rose-600 hover:bg-rose-50 py-2 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="btn-ghost text-sm justify-center rounded-xl"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="btn-primary text-sm justify-center rounded-xl"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
