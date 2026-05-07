"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Map, 
  BarChart3, 
  Tags, 
  Settings, 
  HelpCircle,
  Ticket,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Event Management", href: "/admin/events", icon: CalendarDays },
  { name: "Venue Config", href: "/admin/venues", icon: Map },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Pricing Rules", href: "/admin/pricing", icon: Tags },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-slate-700">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-700">
        <div className="bg-primary rounded-lg p-1.5 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white leading-none">TicketForge AI</h1>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Enterprise Admin</p>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 py-6 px-4 space-y-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Footer Nav */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
        <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium">
            <Settings className="w-5 h-5" /> Settings
        </Link>
        <Link href="/admin/support" className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium">
            <HelpCircle className="w-5 h-5" /> Support
        </Link>
      </div>
    </aside>
  );
}