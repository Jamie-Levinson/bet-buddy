import { signUp } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Create an account</CardTitle>
          <CardDescription>Sign up to start tracking your bets</CardDescription>
        </CardHeader>
        <form action={signUp}>
          <CardContent className="space-y-4">
            {params.error && (
              <div className="rounded-md bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive backdrop-blur-sm">
                {params.error}
              </div>
            )}
            {params.message && (
              <div className="rounded-md bg-win-green/15 border border-win-green/30 p-3 text-sm text-win-green backdrop-blur-sm">
                {params.message}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required className="min-h-[44px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} className="min-h-[44px]" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full min-h-[44px]">
              Sign Up
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

