"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, Calendar, Trophy, Music, Info, LayoutDashboard, Ticket, Wallet,
  Shield, MapPin, ChevronLeft, ChevronRight, X, BarChart, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isAuthenticated, logout } from "@/utils/auth-utils";
import { decodeAccessToken } from "@/utils/jwt-utils";

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isCollapsed, toggleCollapse, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'USER' | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      if (authenticated) {
        try {
          const token = localStorage.getItem('accessToken');
          if (token) {
            const user = decodeAccessToken(token);
            setUserRole(user.role);
          }
        } catch (err) {
          console.error('Failed to decode token:', err);
          setIsLoggedIn(false);
        }
      }
    };
    checkAuth();
  }, [pathname]);

  const publicNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "About", href: "/about", icon: Info },
  ];

  const userNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Tickets", href: "/tickets", icon: Ticket },
    { name: "Wallet", href: "/wallet", icon: Wallet },
  ];

  const adminNavItems = [
    { name: "Admin Panel", href: "/admin", icon: Shield },
    { name: "Analytics Center", href: "/admin/analytics", icon: BarChart },
    { name: "Event Management", href: "/admin/events", icon: Calendar },
    { name: "Venue Config", href: "/admin/venues", icon: MapPin },
    { name: "User Management", href: "/admin/users", icon: Users },
  ];

  const NavLink = ({ item, isActive }: { item: typeof publicNavItems[0]; isActive: boolean }) => (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
      )}
      title={isCollapsed ? item.name : undefined}
    >
      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-slate-400")} />
      {(!isCollapsed || isMobileOpen) && <span>{item.name}</span>}
    </Link>
  );

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {(!isCollapsed || isMobileOpen) && (
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Ticket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-none">TicketForge AI</h1>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">Event Ticketing</p>
            </div>
          </Link>
        )}
        
        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div className="space-y-1">
          {(!isCollapsed || isMobileOpen) && (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Explore
            </p>
          )}
          {publicNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href} />
          ))}
        </div>

        {isLoggedIn && (
          <div className="space-y-1 pt-4 border-t border-slate-700">
            {(!isCollapsed || isMobileOpen) && (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                My Account
              </p>
            )}
            {userNavItems.map((item) => (
              <NavLink key={item.name} item={item} isActive={pathname === item.href} />
            ))}
          </div>
        )}

        {isLoggedIn && userRole === 'ADMIN' && (
          <div className="space-y-1 pt-4 border-t border-slate-700">
            {(!isCollapsed || isMobileOpen) && (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Administration
              </p>
            )}
            {adminNavItems.map((item) => (
              <NavLink key={item.href} item={item} isActive={pathname === item.href} />
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-slate-900 border-r border-slate-700 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}