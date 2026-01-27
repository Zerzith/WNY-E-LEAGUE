import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Users, Calendar, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Unsplash images with descriptive comments
// Hero background: Abstract tech/gaming background with blue lighting
const HERO_BG = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop";

interface Event {
  id: string;
  title: string;
  game: string;
  date: string;
  bannerUrl?: string;
  maxTeams?: number;
  status?: string;
}

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch upcoming events from Firestore
    const q = query(collection(db, "events"), where("status", "==", "upcoming"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as any));
      setEvents(eventData.slice(0, 3)); // Show only first 3 events
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={HERO_BG} 
            alt="Esports Arena" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-primary/10" />
        </div>

        {/* Content */}
        <div className="container relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-accent font-bold tracking-widest text-lg md:text-xl mb-4 uppercase">
              Wang Nam Yen Technical College
            </h2>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 tracking-tight text-glow">
              WNY <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">ESPORTS</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              เข้าร่วมการแข่งขัน พิสูจน์ฝีมือ และก้าวสู่ความเป็นเลิศในวงการอีสปอร์ต
              สมัครเข้าร่วมทีมได้แล้ววันนี้
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={user ? "/register-team" : "/login"}>
                <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 rounded-full shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all">
                  <Trophy className="mr-2 w-5 h-5" />
                  {user ? "ลงทะเบียนทีม" : "สมัครสมาชิก / เข้าสู่ระบบ"}
                </Button>
              </Link>
              <Link href="/scoreboard">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/20 hover:bg-white/10 text-white rounded-full backdrop-blur-sm">
                  ดูตารางคะแนน
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="py-24 bg-card/30 border-y border-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-display font-bold text-white">เกมที่เปิดรับสมัคร</h2>
              <p className="text-muted-foreground mt-2">การแข่งขันที่กำลังจะมาถึง</p>
            </div>
            <Link href="/hall-of-fame">
              <Button variant="link" className="text-accent hover:text-accent/80 p-0 h-auto">
                ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-80">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">ยังไม่มีการแข่งขันที่กำลังจะมาถึง</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative h-80 rounded-2xl overflow-hidden border border-white/10 bg-background hover:border-accent/50 transition-all cursor-pointer"
                >
                  <img 
                    src={event.bannerUrl || HERO_BG}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-md bg-accent/20 text-accent text-xs font-bold border border-accent/20 backdrop-blur-md">
                        {event.game}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/70">
                        <Calendar className="w-3 h-3" /> {event.date}
                      </span>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-accent transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-white transition-colors">
                      <Users className="w-4 h-4" /> {event.maxTeams || 0} ทีม
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto glass-panel p-12 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
              พร้อมที่จะลงแข่งหรือยัง?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              สร้างทีมของคุณ รวบรวมสมาชิก และลงทะเบียนเพื่อชิงรางวัลและการยอมรับในระดับวิทยาลัย
            </p>
            <Link href={user ? "/register-team" : "/login"}>
              <Button size="lg" className="bg-white text-background hover:bg-white/90 font-bold px-8 h-12 rounded-full">
                สร้างทีมเลย
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
