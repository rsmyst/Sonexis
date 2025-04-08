"use client";

import { useSession } from "next-auth/react";
import { Navbar, NavBody, NavItems, NavbarLogo } from "@/components/navbar";

export default function NavbarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  const navItems = [
    { name: "Home", link: "/" },
    { name: "Account", link: "/account" },
    { name: "History", link: "/history" },
    ...(session?.user?.role === "ADMIN"
      ? [{ name: "Admin", link: "/admin" }]
      : []),
  ];

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen theme-bg-dark">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
        </NavBody>
      </Navbar>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
