"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/ui/Logo";

export function Nav() {
  const pathname = usePathname();
  const { user, isAdmin, approved, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5">
        <Link href={user ? "/dashboard" : "/"} className="transition-opacity hover:opacity-80">
          <Logo size={26} v2 />
        </Link>

        <nav className="flex items-center gap-1">
          {user ? (
            <>
              {approved && (
                <>
                  <Link
                    href="/dashboard"
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      pathname.startsWith("/dashboard")
                        ? "text-ink bg-elevated"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                        pathname.startsWith("/admin")
                          ? "text-ink bg-elevated"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      <ShieldCheck size={15} />
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/analysis/new"
                    className="ml-1 flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <Plus size={15} />
                    Nouvelle analyse
                  </Link>
                </>
              )}
              <button
                onClick={signOut}
                className="ml-1 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
                title={user.email ?? "Déconnexion"}
              >
                <LogOut size={15} />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/pricing" className={`rounded-md px-3 py-1.5 text-sm transition-colors ${pathname === "/pricing" ? "text-ink bg-elevated" : "text-muted hover:text-ink"}`}>
                Tarifs
              </Link>
              <Link href="/faq" className={`rounded-md px-3 py-1.5 text-sm transition-colors ${pathname === "/faq" ? "text-ink bg-elevated" : "text-muted hover:text-ink"}`}>
                FAQ
              </Link>
              <Link
                href="/login"
                className="ml-1 flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Se connecter
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
