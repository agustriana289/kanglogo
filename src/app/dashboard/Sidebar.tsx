"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FolderKanban, ShoppingBag,
  Ticket, Tags, Megaphone,
  Users, LayoutTemplate, BriefcaseBusiness, BookOpen, Tv2, Star, Images, HelpCircle, MessageSquare
} from "lucide-react";

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  // Admin Items
  const adminMenu = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { name: "Services", href: "/dashboard/services", icon: BriefcaseBusiness },
    { name: "Shop", href: "/dashboard/shop", icon: ShoppingBag },
    { name: "Discounts", href: "/dashboard/discounts", icon: Tags },
    { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
    { name: "Support Tickets", href: "/dashboard/tickets", icon: Ticket },
    { name: "Portfolios", href: "/dashboard/portfolios", icon: Images },
    { name: "Testimonials", href: "/dashboard/testimonials", icon: Star },
    { name: "Blogs", href: "/dashboard/blogs", icon: BookOpen },
    { name: "Ads", href: "/dashboard/ads", icon: Tv2 },
    { name: "Pages", href: "/dashboard/pages", icon: LayoutTemplate },
    { name: "FAQ", href: "/dashboard/faq", icon: HelpCircle },
    { name: "Users", href: "/dashboard/users", icon: Users },
  ];

  // User Items
  const userMenu = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Projects", href: "/dashboard/projects", icon: FolderKanban },
    { name: "Browse Shop", href: "/dashboard/browse-shop", icon: ShoppingBag },
    { name: "Discounts", href: "/dashboard/vouchers", icon: Tags },
    { name: "Latest Post", href: "/dashboard/latest-posts", icon: BookOpen },
    { name: "Explore Pages", href: "/dashboard/user-pages", icon: LayoutTemplate },
    { name: "Help & FAQ", href: "/dashboard/help-faq", icon: HelpCircle },
    { name: "Chat with Admin", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Support Tickets", href: "/dashboard/tickets", icon: Ticket },
  ];

  const menus = isAdmin ? adminMenu : userMenu;


  return (
    <>
      <aside 
        id="sidebar" 
        className="fixed hidden z-20 h-full top-0 left-0 pt-16 lg:flex shrink-0 flex-col w-64 transition-width duration-75" 
        aria-label="Sidebar"
      >
        <div className="relative flex-1 flex flex-col min-h-0 border-r border-slate-200 bg-white pt-0">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto px-4">
            <div className="flex-1 bg-white space-y-4">
              <h3 className="px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Main Menu
              </h3>
              <ul className="space-y-1.5 pb-2">
                {menus.map((item) => {
                  const isActive = item.href !== "#" && (
                    item.href === "/dashboard" 
                      ? pathname === "/dashboard" 
                      : (pathname === item.href || pathname.startsWith(item.href + "/"))
                  );
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`text-sm font-bold rounded-xl flex items-center p-3 group transition-all duration-200 ${
                          isActive 
                            ? "bg-indigo-50 text-indigo-700 pointer-events-none ring-1 ring-indigo-100 shadow-sm" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 transition duration-75 ${
                          isActive 
                            ? "text-indigo-600" 
                            : "text-slate-400 group-hover:text-slate-600"
                        }`} />
                        <span className="ml-3 flex-1 whitespace-nowrap">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </aside>
      <div className="bg-slate-900/50 backdrop-blur-sm hidden fixed inset-0 z-10 transition-opacity" id="sidebarBackdrop"></div>
    </>
  );
}
