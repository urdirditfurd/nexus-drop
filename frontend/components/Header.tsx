"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/lib/cart";
import { ThemeToggle } from "./ThemeProvider";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());

  const links = [
    { href: "/collections/tech-gadgets", label: "Tech" },
    { href: "/collections/home-living", label: "Maison" },
    { href: "/collections/fitness", label: "Fitness" },
    { href: "/collections/accessories", label: "Accessoires" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
              N
            </div>
            <span className="hidden font-semibold tracking-tight sm:inline">
              NEXUS-DROP
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-600 transition hover:text-accent dark:text-zinc-400 dark:hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 sm:block">
            <Search className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <ThemeToggle className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" />
          <Link
            href="/account"
            className="hidden text-sm text-zinc-600 hover:text-accent dark:text-zinc-400 sm:block"
          >
            Compte
          </Link>
          <Link
            href="/cart"
            className="relative rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-2 text-sm text-zinc-600 dark:text-zinc-400"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/account"
            className="block py-2 text-sm text-zinc-600 dark:text-zinc-400"
            onClick={() => setMenuOpen(false)}
          >
            Mon compte
          </Link>
        </nav>
      )}
    </header>
  );
}
