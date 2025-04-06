"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo,
} from "@/components/navbar";

interface DevSession {
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export default function NavbarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [devSession, setDevSession] = useState<DevSession | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const storedSession = localStorage.getItem("devSession");
      if (storedSession) {
        setDevSession(JSON.parse(storedSession));
      } else {
        const defaultDevSession = {
          user: {
            id: "dev-user",
            name: "Developer",
            role: "ADMIN",
          },
        };
        setDevSession(defaultDevSession);
        localStorage.setItem("devSession", JSON.stringify(defaultDevSession));
      }
    }
  }, []);

  const currentSession = session || devSession;

  const navItems = [
    { name: "Home", link: "/" },
    { name: "Account", link: "/account" },
    { name: "History", link: "/history" },
    ...(currentSession?.user?.role === "ADMIN" ||
    process.env.NODE_ENV === "development"
      ? [{ name: "Admin", link: "/admin" }]
      : []),
  ];

  return (
    <div className="min-h-screen theme-bg-dark">
      <Navbar className="border-none">
        <NavBody>
          <NavbarLogo />
          <NavItems
            items={navItems}
            className="text-white/90 hover:text-white"
          />
        </NavBody>
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>
          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.link}
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                {item.name}
              </a>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      <main className="container mx-auto px-4 py-16">{children}</main>
    </div>
  );
}
