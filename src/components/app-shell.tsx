import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Mail,
  NotebookPen,
  ListChecks,
  Search,
  MessagesSquare,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Sparkle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AI_DISCLAIMER } from "@/lib/prompt-builder";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "Smart Email", icon: Mail },
  { to: "/meetings", label: "Meeting Notes", icon: NotebookPen },
  { to: "/tasks", label: "Task Planner", icon: ListChecks },
  { to: "/research", label: "Research", icon: Search },
  { to: "/chat", label: "Assistant Chat", icon: MessagesSquare },
] as const;

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            title={label}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  collapsed,
  onNavigate,
  email,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  email: string | null;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex items-center gap-3 px-5 py-5", collapsed && "justify-center px-2")}>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500 text-white">
          <Sparkle className="size-5" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">AI Workplace</p>
            <p className="truncate text-xs text-sidebar-foreground/60">Productivity Assistant</p>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <NavLinks collapsed={collapsed} {...(onNavigate ? { onNavigate } : {})} />
      </div>
      <div className="border-t border-sidebar-border p-3">
        {!collapsed && email && (
          <p className="truncate px-2 pb-2 text-xs text-sidebar-foreground/60">{email}</p>
        )}
        <button
          onClick={() => {
            void supabase.auth.signOut();
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="size-[18px]" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setEmail(data.user?.email ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 md:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <SidebarBody collapsed={collapsed} email={email} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody
                collapsed={false}
                email={email}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </Button>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground md:text-lg">{title}</h1>
            {description && (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {description}
              </p>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>

        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground md:px-8">
          {AI_DISCLAIMER}
        </footer>
      </div>
    </div>
  );
}
