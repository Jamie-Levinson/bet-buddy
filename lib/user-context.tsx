"use client";

import { createContext, useContext, ReactNode } from "react";
import type { UserProfile } from "@/actions/account-actions";

interface UserContextType {
  profile: UserProfile;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  profile,
}: {
  children: ReactNode;
  profile: UserProfile;
}) {
  return (
    <UserContext.Provider value={{ profile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context.profile;
}

