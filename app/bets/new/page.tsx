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
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">New Bet</h1>
        <Link href="/dashboard">
          <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">Cancel</Button>
        </Link>
      </div>
      <CreateBetForm />
    </div>
  );
}

