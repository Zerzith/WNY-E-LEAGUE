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
  LayoutDashboard,
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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="relative w-8 h-8 flex items-center justify-center bg-primary rounded-lg overflow-hidden group-hover:ring-2 ring-accent transition-all">
              <span className="font-display font-bold text-lg text-white">E</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:block group-hover:text-accent transition-colors">
              WangNamYen<span className="text-primary">Esports</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`
                    relative px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all cursor-pointer
                    ${isActive ? 'text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
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
                  relative px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all cursor-pointer
                  ${location === adminItem.href ? 'text-white' : 'text-accent hover:text-white hover:bg-white/5'}
                `}
              >
                <adminItem.icon className="w-4 h-4" />
                {adminItem.label}
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

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-white leading-none">{user.displayName || 'Gamer'}</span>
                <span className="text-xs text-accent uppercase">Online</span>
              </div>
              <Link href="/profile">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-accent hover:bg-accent/10"
                >
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={signOut}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-medium shadow-lg shadow-primary/20">
                <LogIn className="w-4 h-4 mr-2" />
                เข้าสู่ระบบ
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
