"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Truck,
  ShoppingCart,
  Sparkles,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produits", icon: Package },
  { href: "/admin/trends", label: "Tendances", icon: TrendingUp },
  { href: "/admin/suppliers", label: "Fournisseurs", icon: Truck },
  { href: "/admin/orders", label: "Commandes", icon: ShoppingCart },
  { href: "/admin/ai", label: "IA Listing", icon: Sparkles },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
              N
            </div>
            <span className="text-sm font-semibold">Admin</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Réduire le menu"
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                active
                  ? "bg-accent-light font-medium text-accent dark:bg-accent/20"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Link
          href="/admin/login"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && "Déconnexion"}
        </Link>
      </div>
    </aside>
  );
}
