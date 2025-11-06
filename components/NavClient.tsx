"use client";

import { signOut } from "@/actions/auth-actions";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavClient() {
  const pathname = usePathname();

  return (
    <>
      {/* Floating iOS-style navigation pill */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden sm:block">
        <div className="glass-nav px-4 py-2 flex items-center gap-1">
          <Link href="/dashboard">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[36px] ${
                pathname === "/dashboard"
                  ? "bg-primary/20 text-primary shadow-lg"
                  : "text-foreground/70 hover:text-foreground hover:bg-white/5"
              }`}
            >
              Dashboard
            </button>
          </Link>
          <Link href="/bets">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[36px] ${
                pathname === "/bets" || pathname?.startsWith("/bets/")
                  ? "bg-primary/20 text-primary shadow-lg"
                  : "text-foreground/70 hover:text-foreground hover:bg-white/5"
              }`}
            >
              Bets
            </button>
          </Link>
          <form action={signOut} className="inline">
            <button
              type="submit"
              className="px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[36px] text-foreground/70 hover:text-foreground hover:bg-white/5"
            >
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      {/* Mobile: Floating bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        <div className="glass-nav mx-4 mb-4 px-2 py-2 flex items-center justify-around">
          <Link href="/dashboard" className="flex-1">
            <button
              className={`w-full px-3 py-2 rounded-full text-xs font-medium transition-all min-h-[44px] flex items-center justify-center ${
                pathname === "/dashboard"
                  ? "bg-primary/20 text-primary"
                  : "text-foreground/70"
              }`}
            >
              Dashboard
            </button>
          </Link>
          <Link href="/bets" className="flex-1">
            <button
              className={`w-full px-3 py-2 rounded-full text-xs font-medium transition-all min-h-[44px] flex items-center justify-center ${
                pathname === "/bets" || pathname?.startsWith("/bets/")
                  ? "bg-primary/20 text-primary"
                  : "text-foreground/70"
              }`}
            >
              Bets
            </button>
          </Link>
          <form action={signOut} className="flex-1">
            <button
              type="submit"
              className="w-full px-3 py-2 rounded-full text-xs font-medium transition-all min-h-[44px] text-foreground/70"
            >
              Sign Out
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}

