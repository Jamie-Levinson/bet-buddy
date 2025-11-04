import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/actions/auth-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function Nav() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/dashboard" className="text-xl font-bold">
          BetBuddy
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Dashboard
            </Button>
          </Link>
          <Link href="/bets">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Bets
            </Button>
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </nav>
  );
}

