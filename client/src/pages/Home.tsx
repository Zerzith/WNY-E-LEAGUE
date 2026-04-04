import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Trophy, Users, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const HERO_BG = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop";

interface Event {
  id: string;
  title: string;
  game: string;
  date: string;
  registrationDeadline?: string;
  bannerUrl?: string;
  maxTeams?: number;
  status?: string;
  registeredTeams?: number;
  logoUrl?: string;
}

interface News {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  author: string;
}

// Component สำหรับแสดงแถบข่าวสารวิ่ง
const NewsMarquee = ({ news }: { news: News[] }) => {
  if (news.length === 0) return null;

  const marqueeText = news.map(item => item.title).join(" \u2022 ");

  return (
    <div className="w-full bg-primary/10 py-3 overflow-hidden relative border-y border-primary/20">
      <div className="flex whitespace-nowrap">
        <motion.div 
          initial={{ x: "100%" }}
          animate={{ x: "-100%" }}
          transition={{ 
            repeat: Infinity, 
            duration: 20, 
            ease: "linear" 
          }}
          className="text-white text-sm font-medium tracking-wide flex items-center gap-4 px-4"
        >
          <Megaphone className="w-4 h-4 text-primary shrink-0" />
          <span>{marqueeText}</span>
          <span className="mx-4 text-primary/40">\u2022</span>
          <span>{marqueeText}</span>
        </motion.div>
      </div>
    </div>
  );
};

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ดึงข้อมูลการแข่งขัน
    const qEvents = query(
      collection(db, "events"), 
      orderBy("createdAt", "desc")
    );
    
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setEvents(eventsList);
      setLoading(false);
    });

    // ดึงข้อมูลข่าวสาร
    const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(5));
    const unsubNews = onSnapshot(qNews, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    return () => {
      unsubEvents();
      unsubNews();
    };
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Component สำหรับการ์ดแสดงการแข่งขัน
  const EventCard = ({ event, index }: { event: Event, index: number }) => {
    const [registeredCount, setRegisteredCount] = useState(event.registeredTeams || 0);

    useEffect(() => {
      const qRegs = query(
        collection(db, "registrations"),
        where("eventId", "==", event.id),
        where("status", "==", "approved")
      );
      
      const unsubRegs = onSnapshot(qRegs, (snapshot) => {
        setRegisteredCount(snapshot.docs.length);
      });

      return () => unsubRegs();
    }, [event.id]);

    const isFull = event.maxTeams ? registeredCount >= event.maxTeams : false;
    const isExpired = event.registrationDeadline ? new Date(event.registrationDeadline).setHours(23, 59, 59, 999) < Date.now() : false;
    const isOpen = event.status === 'open' || (event.status !== 'closed' && !isExpired);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className={`group relative h-96 rounded-3xl overflow-hidden border bg-background transition-all ${
          !isOpen || isFull ? "border-red-500/50 opacity-90 shadow-lg shadow-red-500/10" : "border-white/10 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20"
        }`}
      >
        <Link href={`/event/${event.id}`}>
          <div className="absolute inset-0 cursor-pointer">
            <img 
              src={event.bannerUrl || HERO_BG}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>
        </Link>
        
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {!isOpen ? (
            <div className="px-3 py-1.5 rounded-full bg-red-500/80 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
              <AlertCircle className="w-3 h-3" />
              ปิดรับสมัคร
            </div>
          ) : isFull ? (
            <div className="px-3 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
              <AlertCircle className="w-3 h-3" />
              เต็มแล้ว
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-green-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              เปิดรับสมัคร
            </div>
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 p-8 w-full pointer-events-none">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
              {event.game}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/80 font-bold uppercase tracking-wider">
              <Calendar className="w-3 h-3 text-primary" /> {event.date}
            </span>
          </div>
          
          <h3 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-primary transition-colors pointer-events-auto">
            <Link href={`/event/${event.id}`}>{event.title}</Link>
          </h3>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Users className="w-4 h-4 text-primary" />
              <span className={isFull ? "text-red-400 font-bold" : "text-white font-bold"}>
                {registeredCount}/{event.maxTeams || 16} ทีม
              </span>
            </div>
            {isOpen && !isFull && (
              <Link href={user ? `/event/${event.id}` : "/login"}>
                <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/80 text-white font-bold px-4 pointer-events-auto shadow-lg shadow-primary/20">
                  สมัครเลย
                </Button>
              </Link>
            )}
            {(!isOpen || isFull) && (
              <Link href={`/event/${event.id}`}>
                <Button size="sm" variant="outline" className="rounded-xl border-white/20 hover:bg-white/5 text-white/60 font-bold px-4 pointer-events-auto">
                  ดูรายละเอียด
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[75vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={HERO_BG} alt="Esports Arena" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-primary/5" />
        </div>

        <div className="container relative z-10 text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-[0.2em]">
                Wang Nam Yen Technical College
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold text-white mb-6 tracking-tighter text-glow">
              WNY <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">ESPORTS</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              ศูนย์รวมการแข่งขันอีสปอร์ตวิทยาลัยเทคนิควังน้ำเย็น<br />
              พิสูจน์ฝีมือ และก้าวสู่ความเป็นเลิศไปกับเรา
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/events">
                <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all font-bold">
                  <Trophy className="mr-2 w-5 h-5" />
                  ดูการแข่งขันทั้งหมด
                </Button>
              </Link>
              {!user && (
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white/10 hover:bg-white/5 text-white rounded-2xl backdrop-blur-sm font-bold">
                    เข้าสู่ระบบ
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* News Marquee */}
      <NewsMarquee news={news} />

      {/* Events Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
        
        <div className="w-full px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4 max-w-7xl mx-auto">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-[2px] bg-primary" />
                <span className="text-primary font-bold uppercase tracking-widest text-xs">Tournaments</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white">การแข่งขันอีสปอร์ต</h2>
              <p className="text-muted-foreground mt-3 text-lg">รายการแข่งขันทั้งหมดของวิทยาลัยเทคนิควังน้ำเย็น</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground animate-pulse">กำลังโหลดข้อมูลการแข่งขัน...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-24 bg-card/20 rounded-[3rem] border border-dashed border-white/10 max-w-7xl mx-auto">
              <Trophy className="w-20 h-20 mx-auto text-white/5 mb-6" />
              <h3 className="text-2xl font-bold text-white/40">ยังไม่มีการแข่งขันในขณะนี้</h3>
              <p className="text-muted-foreground mt-2">โปรดติดตามข่าวสารประกาศเร็วๆ นี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-7xl mx-auto">
              {events.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>


    </div>
  );
}
