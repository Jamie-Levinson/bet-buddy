import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateBetForm } from "@/components/CreateBetForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewBetPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Bet</h1>
        <Link href="/dashboard">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      <CreateBetForm />
    </div>
  );
}

