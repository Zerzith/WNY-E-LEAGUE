import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import { 
  Trophy, 
  Gamepad2, 
  Users, 
  MessageCircle, 
  LogOut, 
  LogIn,
  ShieldCheck,
  Menu,
  X,
  Edit2,
  Trash2,
  List
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation, Link } from "wouter";

export function Navigation() {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/", label: "หน้าแรก", icon: Gamepad2 },
    { href: "/scoreboard", label: "ตารางคะแนน", icon: Trophy },
    { href: "/bracket", label: "สายการแข่งขัน", icon: Users },
    { href: "/rules", label: "กฎการแข่ง", icon: ShieldCheck },
    { href: "/chat", label: "แชทสด", icon: MessageCircle },
  ];

  const adminItem = { href: "/admin", label: "จัดการระบบ", icon: ShieldCheck };

  const userMenuItems = [
    { href: "/my-teams", label: "ทีมของฉัน", icon: Users },
    { href: "/register-team", label: "ลงทะเบียนทีม", icon: Edit2 },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-2 sm:px-4 h-16 flex items-center justify-between gap-2">
          {/* Logo Section */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
              <div className="relative w-8 h-8 flex items-center justify-center bg-primary rounded-lg overflow-hidden group-hover:ring-2 ring-accent transition-all">
                <span className="font-display font-bold text-lg text-white">E</span>
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
              </div>
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight hidden xs:block group-hover:text-accent transition-colors whitespace-nowrap">
                WangNamYen<span className="text-primary">Esports</span>
              </span>
            </div>
          </Link>

          {/* Navigation Items - Horizontal Scroll on Mobile */}
          <div className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-hide px-2">
            <div className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div 
                      className={`
                        relative px-2 sm:px-4 py-2 rounded-md flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap
                        ${isActive ? 'text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}
                      `}
                    >
                      <item.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-primary/20 border-b-2 border-primary rounded-sm"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
              
              {user?.role === "admin" && (
                <Link href={adminItem.href}>
                  <div 
                    className={`
                      relative px-2 sm:px-4 py-2 rounded-md flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap
                      ${location === adminItem.href ? 'text-white' : 'text-accent hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <adminItem.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{adminItem.label}</span>
                    {location === adminItem.href && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-accent/20 border-b-2 border-accent rounded-sm"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </div>
                </Link>
              )}
              
              {user && user.role !== "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground hover:text-white"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* User Actions Section */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-1 sm:gap-3">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-bold text-white leading-none whitespace-nowrap">{user.displayName || 'Gamer'}</span>
                  <span className="text-[10px] text-accent uppercase font-bold">Online</span>
                </div>
                <Link href="/profile">
                  <div className="cursor-pointer hover:scale-105 transition-transform">
                    <AvatarCustom 
                      src={user.photoURL} 
                      name={user.displayName || "Gamer"} 
                      size="sm" 
                      className="ring-2 ring-primary/20"
                    />
                  </div>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={signOut}
                  className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" className="h-8 sm:h-10 px-2 sm:px-4 bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-medium shadow-lg shadow-primary/20 whitespace-nowrap">
                  <LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  เข้าสู่ระบบ
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar for User Menu */}
      {sidebarOpen && user && user.role !== "admin" && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          className="fixed left-0 top-16 z-40 w-64 h-[calc(100vh-4rem)] bg-card/95 backdrop-blur-sm border-r border-white/10 shadow-2xl"
        >
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">เมนู</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {userMenuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${location === item.href 
                        ? 'bg-primary/20 text-primary border border-primary/50' 
                        : 'text-muted-foreground hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </Link>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">ทีมของฉัน</h4>
              <div className="space-y-2">
                <Link href="/my-teams">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
                  >
                    <List className="w-4 h-4" />
                    <span className="text-sm">ดูทีมของฉัน</span>
                  </button>
                </Link>
                <Link href="/my-teams">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm">แก้ไขลงทะเบียน</span>
                  </button>
                </Link>
                <Link href="/my-teams">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">ยกเลิกสมัคร</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
