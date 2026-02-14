"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import type { AppShellUIProps } from "@/components/AppShell/types";

export default function AppShellUI({
  title,
  workspaceLabel,
  navItems,
  children,
  onSignOut,
}: AppShellUIProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background-gray)" }}>
      {/* ─── Sidebar: Bedrock Layer ─── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:inset-y-auto lg:w-64 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ background: "#1A1A1A", borderColor: "rgba(255,255,255,0.08)" }}>
        {/* Close button for mobile */}
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-md p-2 text-white hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        {/* Workspace identifier — Core Sample label */}
        <div className="m-4 rounded-md p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="stratum-header" style={{ color: "#00AA6C", fontSize: "0.6rem" }}>Workspace</p>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>{workspaceLabel}</p>
        </div>

        {/* Fault line accent */}
        <div className="mx-4 mb-3 h-[2px]" style={{ background: "linear-gradient(90deg, #00AA6C, #FFD500 50%, #2563EB 80%, transparent)" }} />

        <nav className="flex flex-col gap-0.5 px-3 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200"
                style={
                  active
                    ? { background: "rgba(0,170,108,0.12)", color: "#00AA6C", borderLeft: "3px solid #00AA6C", paddingLeft: "9px" }
                    : { color: "rgba(255,255,255,0.55)", borderLeft: "3px solid transparent", paddingLeft: "9px" }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                  }
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={() => {
              onSignOut();
              router.push("/login");
              setIsMobileMenuOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200"
            style={{ color: "rgba(255,255,255,0.55)", borderLeft: "3px solid transparent", paddingLeft: "9px" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = "rgba(255,255,255,0.85)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.55)";
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ─── Main Content Area: Limestone Layer ─── */}
      <section className="flex-1 min-w-0">
        {/* Top Bar — Topsoil Band */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6" style={{ background: "#00AA6C", borderBottom: "3px solid", borderImage: "linear-gradient(90deg, #00AA6C, #FFD500, #2563EB) 1" }}>
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden rounded-md p-2 text-white hover:bg-white/10 mr-2"
          >
            <Menu size={20} />
          </button>

          <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "#ffffff" }}>{title}</h1>


        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </section>
    </div>
  );
}
