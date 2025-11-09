import { getUserProfile } from "@/actions/account-actions";
import { UserProvider } from "@/lib/user-context";
import { OddsFormatProvider } from "@/lib/odds-format-context";

export async function UserProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user profile once per request (React cache() ensures deduplication)
  // Returns null if not logged in (for login/signup pages)
  const profile = await getUserProfile();

  // If not logged in, render children without providers (login/signup pages)
  if (!profile) {
    return <>{children}</>;
  }

  return (
    <UserProvider profile={profile}>
      <OddsFormatProvider initialFormat={profile.preferredOddsFormat}>
        {children}
      </OddsFormatProvider>
    </UserProvider>
  );
}

