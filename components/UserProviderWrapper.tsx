import { getUserProfile } from "@/actions/account-actions";
import { UserProvider } from "@/lib/user-context";
import { OddsFormatProvider } from "@/lib/odds-format-context";

export async function UserProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile;
  let initialFormat: "decimal" | "american" = "decimal";

  try {
    profile = await getUserProfile();
    initialFormat = profile.preferredOddsFormat;
  } catch {
    // If profile fetch fails, redirect will happen at page level
    // For now, use defaults
    return <>{children}</>;
  }

  return (
    <UserProvider profile={profile}>
      <OddsFormatProvider initialFormat={initialFormat}>
        {children}
      </OddsFormatProvider>
    </UserProvider>
  );
}

