import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Gamepad2, 
  Users, 
  MessageCircle, 
  LogOut, 
  LogIn,
  ShieldCheck,
  User
} from "lucide-react";
import { motion } from "framer-motion";

export function Navigation() {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { href: "/", label: "หน้าแรก", icon: Gamepad2 },
    { href: "/scoreboard", label: "ตารางคะแนน", icon: Trophy },
    { href: "/bracket", label: "สายการแข่งขัน", icon: Users },
    { href: "/chat", label: "แชทสด", icon: MessageCircle },
  ];

  const adminItem = { href: "/admin", label: "จัดการระบบ", icon: ShieldCheck };

  return (
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
              <div className="flex flex-col items-center lg:hidden">
                 <span className="text-[10px] font-bold text-white leading-none max-w-[50px] truncate">{user.displayName || 'Gamer'}</span>
                 <span className="text-[8px] text-accent uppercase font-bold">ONLINE</span>
              </div>
              <Link href="/profile">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground hover:text-accent hover:bg-accent/10"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
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
  );
}
