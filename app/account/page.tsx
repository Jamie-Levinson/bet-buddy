import { getTimezoneList } from "@/lib/timezone-helpers";
import { redirect } from "next/navigation";
import { AccountSettingsForm } from "./components/AccountSettingsForm";

export default async function AccountPage() {
  let timezones;

  try {
    timezones = getTimezoneList();
  } catch (error) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Account Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>
      <AccountSettingsForm timezones={timezones} />
    </div>
  );
}



