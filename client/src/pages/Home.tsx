import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Users, Calendar, Loader2, Megaphone, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, limit, getDocs } from "firebase/firestore";
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

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch upcoming events
    const qEvents = query(collection(db, "events"), where("status", "==", "upcoming"), limit(3));
    const unsubEvents = onSnapshot(qEvents, async (snapshot) => {
      const eventsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const event = { id: doc.id, ...doc.data() } as any;
        
        // Fetch registered teams count
        const registrationsQuery = query(
          collection(db, "registrations"),
          where("eventId", "==", event.id),
          where("status", "==", "approved")
        );
        const registrationsSnapshot = await getDocs(registrationsQuery);
        event.registeredTeams = registrationsSnapshot.docs.length;

        // Fetch team logo from one of the approved registrations
        if (registrationsSnapshot.docs.length > 0) {
          const teamName = registrationsSnapshot.docs[0].data().teamName;
          const teamQuery = query(collection(db, "teams"), where("name", "==", teamName), where("eventId", "==", event.id), limit(1));
          const teamSnapshot = await getDocs(teamQuery);
          if (!teamSnapshot.empty) {
            event.logoUrl = teamSnapshot.docs[0].data().logoUrl;
          }
        }

        return event;
      }));
      
      setEvents(eventsData);
    });

    // Fetch latest news
    const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3));
    const unsubNews = onSnapshot(qNews, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setLoading(false);
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

  const isRegistrationFull = (event: Event) => {
    return event.maxTeams && event.registeredTeams && event.registeredTeams >= event.maxTeams;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={HERO_BG} alt="Esports Arena" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-primary/10" />
        </div>

        <div className="container relative z-10 text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
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

      {/* News Section */}
      {news.length > 0 && (
        <section className="py-16 bg-accent/5 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Megaphone className="text-accent w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">ข่าวสารและประกาศ</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {news.map((item) => (
                <div key={item.id} className="bg-card/50 border border-white/10 p-6 rounded-2xl hover:border-accent/50 transition-all">
                  <p className="text-xs text-accent font-bold mb-2">
                    {item.createdAt?.toDate?.().toLocaleDateString('th-TH') || "ประกาศใหม่"}
                  </p>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{item.content}</p>
                  <p className="text-xs text-muted-foreground italic">โดย {item.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Games */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-display font-bold text-white">การแข่งขันที่เปิดรับสมัคร</h2>
              <p className="text-muted-foreground mt-2">เข้าร่วมการแข่งขันที่กำลังจะมาถึง</p>
            </div>
            <Link href="/hall-of-fame">
              <Button variant="ghost" className="text-accent hover:text-accent/80 p-0 h-auto hover:bg-transparent">
                ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-card/20 rounded-3xl border border-dashed border-white/10">
              <p className="text-muted-foreground">ยังไม่มีการแข่งขันที่เปิดรับสมัครในขณะนี้</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {events.map((event, i) => {
                const isFull = isRegistrationFull(event);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`group relative h-96 rounded-3xl overflow-hidden border bg-background transition-all ${
                      isFull ? "border-red-500/50 opacity-75" : "border-white/10 hover:border-accent/50"
                    }`}
                  >
                    {event.logoUrl ? (
                      <img 
                        src={event.logoUrl}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                      />
                    ) : (
                      <img 
                        src={event.bannerUrl || HERO_BG}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    {/* Full Badge */}
                    {isFull && (
                      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs font-bold flex items-center gap-1.5 z-10">
                        <AlertCircle className="w-3 h-3" />
                        เต็มแล้ว
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 p-8 w-full">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-accent text-black text-xs font-bold">
                          {event.game}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-white/80">
                          <Calendar className="w-3 h-3" /> {event.date}
                        </span>
                      </div>
                      
                      {/* Registration Deadline */}
                      {event.registrationDeadline && (
                        <div className="flex items-center gap-1.5 text-xs text-yellow-400 mb-2">
                          <Clock className="w-3 h-3" />
                          ปิดรับสมัคร: {formatDate(event.registrationDeadline)}
                        </div>
                      )}
                      
                      <h3 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-accent transition-colors">
                        {event.title}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4" />
                          <span className={isFull ? "text-red-400 font-semibold" : "text-muted-foreground"}>
                            สมัครแล้ว {event.registeredTeams || 0}/{event.maxTeams || 0} ทีม
                          </span>
                        </div>
                        {!isFull && (
                          <Link href={user ? "/register-team" : "/login"}>
                            <Button size="sm" className="rounded-full bg-white/10 hover:bg-white text-white hover:text-black border-none">
                              สมัครเลย
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto glass-panel p-16 rounded-[3rem] relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">
              พร้อมที่จะเป็นตำนานหรือยัง?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              สร้างทีมของคุณ รวบรวมสมาชิก และลงทะเบียนเพื่อชิงรางวัลและการยอมรับในระดับวิทยาลัย
            </p>
            <Link href={user ? "/register-team" : "/login"}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-12 h-16 text-xl rounded-full shadow-2xl shadow-primary/40">
                ลงทะเบียนทีมแข่ง
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
