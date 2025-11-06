import { getCurrentUser } from "@/lib/auth";
import { NavClient } from "./NavClient";

export async function Nav() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return <NavClient />;
}

