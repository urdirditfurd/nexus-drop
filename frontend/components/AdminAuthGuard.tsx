"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";
import { getAdminMe } from "@/lib/api-client";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }

    const token = getToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    getAdminMe()
      .then(() => setReady(true))
      .catch(() => {
        clearToken();
        router.replace("/admin/login");
      });
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Chargement...</p>
      </div>
    );
  }

  return <>{children}</>;
}
