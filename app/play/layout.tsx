import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function PlayLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return children;
}
