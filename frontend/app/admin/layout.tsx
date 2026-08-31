"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";
import { ThemeToggle } from "@/components/ThemeProvider";
import { Search, Bell, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              placeholder="Rechercher produits, commandes..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="ml-4 flex items-center gap-2">
            <Link
              href="/admin/products"
              className="hidden items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover sm:flex"
            >
              <Plus className="h-4 w-4" />
              Nouveau produit
            </Link>
            <button className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Bell className="h-5 w-5 text-zinc-500" />
            </button>
            <ThemeToggle className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
